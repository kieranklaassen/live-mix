// name: Flock
// a: Evening birds
// b: Fireflies
// what: A great flock of small birds at dusk, thousands of dark points turning together as one folding cloud over low land and a few trees; or fireflies drifting over a dark meadow at night, a few near and soft, many far and small.
// follows: Each kind of sound gathers birds in its own part of the sky and warms the sky there in its colour; the fuller the mix the more birds and the tighter the cloud; the low band sends slow waves through it, the high band is the shimmer of wings; a hit or cue turns the whole flock at once, so a dark wave runs through it. At night each firefly belongs to one kind of sound and glows with it, and a hit runs a flash across the meadow.

float flSq(float x) { return x * x; }
vec2 flC0, flC1, flC2, flC3, flC4;       // where each kind of sound gathers its birds this moment
mat2 flM0, flM1, flM2, flM3, flM4;       // the shape of that gathering
float flW0, flW1, flW2, flW3, flW4;      // how many
vec3 flT0, flT1, flT2, flT3, flT4;       // and the light it gives
float flHit;

// lean is the cosine and sine of the way this gathering lies; w holds four slow swings between -1 and 1:
// two move it, one rocks it a little about its lean (a small angle, so no trig is needed), one stretches it
void flLobe(vec2 home, vec2 lean, vec4 w, float size, out vec2 c, out mat2 m) {
  c = home * 0.85 + vec2(0.1, 0.05) * w.xy;
  float a = 0.5 * w.z, cw = 1.0 - 0.5 * a * a, sw = a * (1.0 - a * a / 6.0);
  float ca = lean.x * cw - lean.y * sw, sa = lean.y * cw + lean.x * sw;
  m = mat2(1.0, 0.0, 0.0, 2.0 + 0.6 * w.w) * mat2(ca, -sa, sa, ca) / size;
}
void flGather() {
  flHit = sat(uHits + 0.6 * uCue);
  float full = smoothstep(0.3, 1.0, uLevel);
  float size = mix(0.3, 0.23, full);                         // the fuller the mix, the tighter the cloud
  float gain = 0.75 + 0.5 * full;
  flW0 = (0.12 + 1.1 * uDrone) * gain;
  flW1 = (0.12 + 1.1 * uPad) * gain;
  flW2 = (0.12 + 1.1 * uTexture) * gain;
  flW3 = (0.12 + 1.1 * uPhrase) * gain;
  flW4 = (0.3 + 0.5 * full) * gain;                          // a hit turns the flock, it does not make birds
  flT0 = uKind[0] * uKind[0] * (0.34 * uDrone);
  flT1 = uKind[1] * uKind[1] * (0.34 * uPad);
  flT2 = uKind[2] * uKind[2] * (0.34 * uTexture);
  flT3 = uKind[3] * uKind[3] * (0.34 * uPhrase);
  flT4 = uKind[4] * uKind[4] * (0.34 * flHit);
  // four slow clocks, each as (sine, cosine); every gathering reads them at its own phase, written out as numbers
  vec2 ca = vec2(sin(uTime * 0.11), cos(uTime * 0.11)), cb = vec2(sin(uTime * 0.09), cos(uTime * 0.09));
  vec2 cc = vec2(sin(uTime * 0.07), cos(uTime * 0.07)), cd = vec2(sin(uTime * 0.05), cos(uTime * 0.05));
  flLobe(vec2(-0.5, 0.0), vec2(1.0000, 0.0000), vec4(dot(ca, vec2(1.0000, 0.0000)), dot(cb, vec2(-0.0000, 1.0000)), dot(cc, vec2(1.0000, 0.0000)), dot(cd, vec2(1.0000, 0.0000))), size, flC0, flM0);
  flLobe(vec2(-0.05, 0.2), vec2(0.6216, 0.7833), vec4(dot(ca, vec2(-0.4161, 0.9093)), dot(cb, vec2(-0.9636, 0.2675)), dot(cc, vec2(-0.1288, 0.9917)), dot(cd, vec2(0.5403, 0.8415))), size, flC1, flM1);
  flLobe(vec2(0.5, 0.06), vec2(-0.2272, 0.9738), vec4(dot(ca, vec2(-0.6536, -0.7568)), dot(cb, vec2(-0.5155, -0.8569)), dot(cc, vec2(-0.9668, -0.2555)), dot(cd, vec2(-0.4161, 0.9093))), size, flC2, flM2);
  flLobe(vec2(0.27, 0.3), vec2(-0.9041, 0.4274), vec4(dot(ca, vec2(0.9602, -0.2794)), dot(cb, vec2(0.6878, -0.7259)), dot(cc, vec2(0.3780, -0.9258)), dot(cd, vec2(-0.9900, 0.1411))), size, flC3, flM3);
  flLobe(vec2(-0.32, 0.3), vec2(-0.8968, -0.4425), vec4(dot(ca, vec2(-0.1455, 0.9894)), dot(cb, vec2(0.8835, 0.4685)), dot(cc, vec2(0.8694, 0.4941)), dot(cd, vec2(-0.6536, -0.7568))), size, flC4, flM4);
}
// How thick the flock is at a place: one cloud with a lobe for each kind of sound. warm is the light those kinds give the sky there.
float flBody(vec2 p, out vec3 warm) {
  vec2 q0 = flM0 * (p - flC0), q1 = flM1 * (p - flC1), q2 = flM2 * (p - flC2), q3 = flM3 * (p - flC3), q4 = flM4 * (p - flC4);
  float u0 = 1.0 / (1.0 + 0.6 * dot(q0, q0)), u1 = 1.0 / (1.0 + 0.6 * dot(q1, q1)), u2 = 1.0 / (1.0 + 0.6 * dot(q2, q2));
  float u3 = 1.0 / (1.0 + 0.6 * dot(q3, q3)), u4 = 1.0 / (1.0 + 0.6 * dot(q4, q4));
  warm = flT0 * u0 + flT1 * u1 + flT2 * u2 + flT3 * u3 + flT4 * u4;
  vec2 qb = (p - vec2(0.0, 0.15)) * vec2(1.2, 3.4);          // a thin body that joins them
  float d = flW0 * u0 * u0 + flW1 * u1 * u1 + flW2 * u2 * u2 + flW3 * u3 * u3 + flW4 * u4 * u4 + 0.32 / flSq(1.0 + 0.6 * dot(qb, qb));
  return max(d - 0.1, 0.0);
}
// The same with the darker sheets where the cloud folds over itself, and the slow waves of the low band.
float flDense(vec2 p, out vec3 warm) {
  float d = flBody(p, warm);
  float sheet = 1.0 - abs(2.0 * noise(p * vec2(2.6, 4.2) + vec2(uTime * 0.045, -uTime * 0.03)) - 1.0);
  d *= 0.45 + 1.1 * sheet * sheet;
  d *= 1.0 + 0.6 * uLow * sin(p.x * 7.0 + p.y * 4.0 - uTravel * 1.3);
  return d;
}

vec3 flSkyAt(vec2 p, float horizon) {
  float y = max(p.y - horizon, 0.0);
  vec3 c = mix(vec3(0.95, 0.4, 0.1), vec3(0.5, 0.16, 0.22), smoothstep(0.0, 0.2, y));
  c = mix(c, vec3(0.13, 0.08, 0.24), smoothstep(0.1, 0.42, y));
  c = mix(c, vec3(0.015, 0.03, 0.11), smoothstep(0.3, 0.8, y));
  float sunD = length((p - vec2(-0.38, horizon - 0.03)) * vec2(0.5, 1.0));
  c += vec3(1.0, 0.55, 0.2) * exp(-sunD * 4.0) * 0.75;
  return c;
}
// One tree against the sky: a trunk, two limbs and flat clumps of leaves with ragged edges and a little sky between them.
float flSeg(vec2 q, vec2 a, vec2 b) { vec2 pa = q - a, ba = b - a; return length(pa - ba * sat(dot(pa, ba) / dot(ba, ba))); }
float flTree(vec2 p, vec2 foot, float tall, float flip) {
  vec2 q = (p - foot) / tall;
  q.x *= flip;
  float soft = 1.2 / (uRes.y * tall);
  float wood = flSeg(q, vec2(0.0, -0.05), vec2(0.03, 0.56)) - 0.034 + 0.03 * q.y;
  wood = min(wood, flSeg(q, vec2(0.02, 0.47), vec2(-0.26, 0.72)) - 0.013);
  wood = min(wood, flSeg(q, vec2(0.03, 0.54), vec2(0.3, 0.8)) - 0.013);
  const vec2 e = vec2(1.0, 1.5);
  float d = length((q - vec2(-0.28, 0.74)) * e) - 0.2;
  d = min(d, length((q - vec2(0.02, 0.92)) * e) - 0.25);
  d = min(d, length((q - vec2(0.3, 0.8)) * e) - 0.2);
  d = min(d, length((q - vec2(-0.06, 0.69)) * e) - 0.11);
  d = min(d, length((q - vec2(0.5, 0.67)) * e) - 0.09);
  d += 0.085 * (noise(q * 9.0 + tall * 50.0) - 0.5) + 0.045 * (noise(q * 27.0) - 0.5);
  return max(smoothstep(soft, -soft, wood), smoothstep(soft, -soft, d));
}

// One layer of birds: a grid turned its own way, one bird to a cell, there only where the flock is thick enough.
vec3 flBirds(vec3 col, vec2 p, float fi, float n, vec2 cs, float D, float head, float turn, vec3 dark) {
  float t = uTime, near = fi / 5.0;
  vec2 drift = vec2(t * (0.005 + 0.003 * fi), 0.0015 * t * sin(fi * 2.0)) + fi * 7.3;
  vec2 g = mat2(cs.x, -cs.y, cs.y, cs.x) * (p + drift) * n, id = floor(g), f = fract(g);   // cs: this layer's grid is turned by fi * 0.83 + 0.4
  vec2 h = hash22(id + fi * 17.0);
  float h3 = fract(h.x * 9.7 + h.y * 5.3);
  vec2 pos = 0.22 + 0.56 * h + 0.14 * vec2(sin(t * (0.5 + 0.5 * h.x) + h.y * 40.0), cos(t * (0.45 + 0.5 * h.y) + h.x * 40.0));
  float vis = smoothstep(0.0, 0.12, D * 1.5 - 0.06 - h3 * (0.75 + 0.5 * near));
  vec2 dq = rot(head + 0.6 * (h.x - 0.5) - fi * 0.83 - 0.4) * (f - pos);
  dq.x += 0.9 * abs(dq.y);                                  // wings swept back
  float wing = 0.5 + 0.5 * sin(t * 1.6 + h3 * TAU + p.x * 5.0) * (0.25 + 0.75 * uHigh);
  float sx = 0.21 * (0.7 + 0.6 * h.y) * (1.0 + 0.35 * turn), sy2 = sx * (0.3 + 0.45 * wing + 1.3 * turn);
  float d = length(dq / vec2(sx, sy2));
  float aa = n / (uRes.y * sx);
  float a = smoothstep(1.0 + aa, 1.0 - aa, d) * min(1.0, 1.4 / (1.0 + aa * aa)) * vis;
  return mix(col, mix(dark, vec3(0.008, 0.008, 0.014), 0.3 + 0.7 * near), a * mix(0.6, 0.97, near));
}

vec3 flDusk(vec2 p) {
  float t = uTime;
  const float horizon = -0.33;
  float full = smoothstep(0.3, 1.0, uLevel);
  float bright = 0.5 + 0.25 * full;
  // the flock folds slowly with the whole sky; a hit or cue turns it, a front that runs across
  vec2 fold = 0.12 * vec2(noise(p * 1.7 + vec2(t * 0.07, 0.0)) - 0.5, noise(p * 1.7 + vec2(9.0, -t * 0.06)) - 0.5)
            + 0.035 * vec2(noise(p * 5.0 + vec2(0.0, t * 0.1)) - 0.5, noise(p * 5.0 + vec2(5.0, t * 0.09)) - 0.5);
  float kick = sat(uHits * 1.3);
  float frontA = mix(-0.95, 0.95, 1.0 - kick), frontB = mix(0.95, -0.95, 1.0 - uCue);
  float turn = sqrt(kick) * exp(-flSq((p.x - frontA) / 0.13)) + sqrt(uCue) * 0.8 * exp(-flSq((p.x + 0.5 * p.y - frontB) / 0.2));
  vec3 warm;
  float D = flDense(p + fold * 2.0, warm) * (1.0 + 1.6 * turn);
  // the sky; each kind of sound warms the part of it where its birds gather
  vec3 col = flSkyAt(p, horizon) + warm;
  // long thin cloud, dark above and lit from below
  float sy = p.y - horizon;
  vec2 cq = vec2(p.x * 1.2 + t * 0.008, sy * 7.0 + 2.0);
  float cl = 0.5 * noise(cq) + 0.3 * noise(cq * 2.1 + 7.0) + 0.2 * noise(cq * 4.3 + 13.0);
  float cloud = smoothstep(0.5, 0.75, cl) * smoothstep(0.03, 0.18, sy);
  float under = smoothstep(0.5, 0.6, cl) * (1.0 - smoothstep(0.6, 0.75, cl)) * smoothstep(0.03, 0.18, sy);
  col = mix(col, col * 0.5, cloud * 0.8) + vec3(0.9, 0.3, 0.16) * under * 0.16 * exp(-sy * 2.5);
  col *= bright;

  // a veil where the birds are too far to tell apart, then layer on layer of birds
  float head = 2.6 * (noise(p * 1.3 + vec2(t * 0.05, 3.0)) - 0.5) + 1.4 * turn;
  vec3 dark = mix(col * 0.3, vec3(0.012, 0.012, 0.022), 0.6);
  col = mix(col, dark, (1.0 - exp(-D * 2.4)) * 0.85);
  col = flBirds(col, p, 0.0, 250.0, vec2(0.9211, 0.3894), D, head, turn, dark);
  col = flBirds(col, p, 1.0, 170.0, vec2(0.3342, 0.9425), D, head, turn, dark);
  col = flBirds(col, p, 2.0, 115.6, vec2(-0.4699, 0.8827), D, head, turn, dark);
  col = flBirds(col, p, 3.0, 78.6, vec2(-0.9685, 0.2489), D, head, turn, dark);
  col = flBirds(col, p, 4.0, 53.5, vec2(-0.8373, -0.5467), D, head, turn, dark);
  col = flBirds(col, p, 5.0, 36.3, vec2(-0.1617, -0.9868), D, head, turn, dark);

  // land: a far ridge, a strip of standing water that holds the sky, mist, dark ground and a few trees
  float rn = noise(vec2(p.x * 2.6 + 4.0, 0.5));
  float ridge = horizon + 0.03 * rn + 0.004 * sin(p.x * 23.0 + 9.0 * rn);
  vec3 far = mix(vec3(0.1, 0.055, 0.09), vec3(0.34, 0.15, 0.1), exp(-abs(p.x + 0.38) * 2.2)) * bright;
  col = mix(col, far, smoothstep(0.003, -0.003, p.y - ridge));
  float gy = horizon - 0.028 - p.y;
  if (gy > 0.0) {
    vec2 mp = vec2(p.x + 0.003 * sin(p.y * 300.0 + t * 0.7), horizon + gy * 3.0 + 0.03);
    vec3 pond = flSkyAt(mp, horizon) * bright * 0.75;
    pond = (pond + warm * 0.4 * bright) * mix(1.0, 0.3, 1.0 - exp(-flBody(mp + fold * 2.0, warm) * 1.3));
    vec3 ground = vec3(0.012, 0.01, 0.015);
    float bank = 0.05 + 0.03 * noise(vec2(p.x * 2.2, 8.0));                 // where the water ends and the near ground begins
    float rx = p.x * 240.0, rh = hash11(floor(rx));
    float reeds = bank - (0.006 + 0.05 * rh * rh * noise(vec2(p.x * 5.0, 5.0))) * smoothstep(0.5, 0.2, abs(fract(rx) - 0.5));
    col = mix(pond, ground, smoothstep(-0.002, 0.002, gy - reeds));
    col = mix(far * 0.5, col, smoothstep(0.0, 0.004, gy));
  }
  col += vec3(0.6, 0.3, 0.18) * 0.09 * bright * exp(-flSq((p.y - horizon + 0.015) / 0.025));   // mist along the far ground
  // four trees, each alone in its own stretch of the land, so one is worked out for any place: (where it stands, how far below the horizon, how tall)
  vec3 tr = p.x < -0.525 ? vec3(-0.66, 0.04, 0.24) : p.x < 0.0 ? vec3(-0.44, 0.035, 0.14) : p.x < 0.42 ? vec3(0.27, 0.03, 0.09) : vec3(0.66, 0.06, 0.34);
  float trees = flTree(p, vec2(tr.x, horizon - tr.y), tr.z, p.x < -0.525 || p.x > 0.42 ? -1.0 : 1.0);
  col = mix(col, vec3(0.01, 0.008, 0.013), trees);
  col *= 1.0 - 0.35 * dot(p, p);
  return max(mix(vec3(dot(col, vec3(0.3, 0.55, 0.15))), col, 1.25), 0.0);
}

// Where the fireflies of one kind of sound gather: each kind has its own slow drifting stretch of the meadow.
float flPatch(vec2 x, float k) {
  return flSq(sat(0.5 + 0.8 * sin(x.x * 3.1 + x.y * 2.3 + k * 1.9 + uTime * 0.02)));
}
vec3 flPool(vec3 k, float sig, float lay, float at) {
  return mix(vec3(0.75, 1.0, 0.25), k * k * 2.6, 0.7) * (sig * flSq(sat(0.5 + 0.9 * cos(TAU * (lay * 1.6 - at)))));
}
// One layer of fireflies, one to a cell; each belongs to one kind of sound and glows with it.
void flFlies(vec2 p, float fi, float n, float full, float flash, inout vec3 glow, inout vec3 lightOn) {
  float t = uTime, near = fi / 3.0;
  vec2 g = (p + vec2(0.003 * t * (1.0 + fi), 0.0) + fi * 3.1) * n, id = floor(g), f = fract(g);
  vec2 h = hash22(id + fi * 23.0);
  float h3 = fract(h.x * 9.7 + h.y * 5.3), h4 = fract(h.x * 3.3 + h.y * 11.1);
  vec2 ph = vec2(t * 0.21 * (0.6 + h.x) + h.y * 50.0, t * 0.27 * (0.6 + h.y) + h.x * 50.0);
  vec2 pos = 0.5 + 0.17 * vec2(sin(ph.x), sin(ph.y));
  vec2 wp = (id + pos) / n - vec2(0.003 * t * (1.0 + fi), 0.0) - fi * 3.1;
  float fk = floor(h3 * 4.999);
  // where they fly: a band over the grass, lower and wider for the near ones, thick in their own patch
  float band = 1.0 / flSq(1.0 + flSq((wp.y - mix(-0.07, -0.2, near)) / mix(0.07, 0.3, near)));
  float here = step(h4, band * (0.2 + 1.0 * flPatch(wp, fk)) * (0.5 + 0.5 * full));
  float blink = flSq(0.5 + 0.5 * sin(t * (0.45 + 0.6 * h4) + h3 * 40.0));
  blink *= mix(blink, 1.0, near);
  float sig = fk < 0.5 ? uDrone : fk < 1.5 ? uPad : fk < 2.5 ? uTexture : fk < 3.5 ? uPhrase : flHit;
  vec3 kc = fk < 0.5 ? uKind[0] : fk < 1.5 ? uKind[1] : fk < 2.5 ? uKind[2] : fk < 3.5 ? uKind[3] : uKind[4];
  float lum = here * (blink * (0.1 + 1.7 * sig) + flash);
  vec3 tint = mix(vec3(0.75, 1.0, 0.25), kc * kc * 2.6, 0.55);
  float d = length(f - pos);
  float r = mix(0.03, 0.19, near * near);                             // near ones are out of focus: soft discs
  float sharp = 2.4 * flSq(flSq(sat(1.0 - d * d / (r * r * 1.6))));
  float disc = smoothstep(r, r * 0.72, d) * (0.3 + 0.3 * sat((d - r * 0.4) / (r * 0.55)));
  float halo = sat(1.0 - d / 0.33);
  halo *= halo * halo;
  glow += tint * lum * (mix(sharp, disc, near * near) + halo * mix(0.5, 0.1, near));
  lightOn += tint * lum * halo * mix(1.6, 0.4, near);
}
// One row of grass, catching the light along its top.
vec3 flRow(vec3 col, vec2 p, float fj, float base, vec3 lightOn, float px, vec2 wind) {
  float amp = 0.008 + 0.017 * fj, fr = 110.0 / (1.0 + 0.9 * fj);
  float sway = 0.3 * mix(wind.x, wind.y, fract(fj * 0.37 + 0.15));
  float bx = p.x * fr * 5.0 + fj * 10.0 + sway * 3.0, bh = hash11(floor(bx) + fj * 7.0);
  float top = base + amp * (0.7 * noise(vec2(p.x * fr * 0.5 + fj * 10.0 + sway, fj)) + 1.1 * bh * bh * smoothstep(0.5, 0.1, abs(fract(bx) - 0.5)));
  float in_ = smoothstep(px, -px, p.y - top);
  float rim = 1.0 / flSq(1.0 + 0.8 * max(top - p.y, 0.0) / (amp * 1.3 + 0.004));
  float streak = 0.6 + 0.8 * fract(floor(bx * 0.5) * 0.618 + fj * 0.37) * (0.5 + 0.5 * bh);
  vec3 row = vec3(0.003, 0.008, 0.007) + vec3(0.25, 0.5, 0.2) * lightOn * (0.2 + 2.6 * rim) * streak * mix(1.0, 0.5, fj / 5.0);
  return mix(col, row, in_);
}
// Tall grass close to us, dark and out of focus.
vec3 flBlades(vec3 col, vec2 p, float fj, vec3 lightOn) {
  float t = uTime, n = 8.0 + 7.0 * fj;
  float gx = p.x * n + fj * 5.0, id = floor(gx);
  float h = hash11(id + fj * 31.0);
  float top = -0.5 + (0.18 + 0.3 * h) * (1.0 - 0.35 * fj);
  float up = (p.y + 0.5) / (top + 0.5);
  float lean = (h - 0.5) * 0.9 + 0.12 * sin(t * 0.5 + h * 20.0);
  float bx = fract(gx) - 0.5 - lean * up * up;
  float wide = 0.14 * (1.0 - up);
  float blade = smoothstep(wide + 0.07 - 0.04 * fj, wide - 0.03, abs(bx)) * step(up, 1.0) * step(0.0, up);
  return mix(col, vec3(0.003, 0.008, 0.005) + lightOn * 0.03, blade * 0.93);
}
vec3 flNight(vec2 p) {
  float t = uTime;
  const float hz = -0.04;
  float full = smoothstep(0.3, 1.0, uLevel);
  // the last of the light low in the sky, a few stars, a line of trees
  float y = p.y - hz;
  vec3 col = mix(vec3(0.035, 0.11, 0.13), vec3(0.012, 0.035, 0.08), smoothstep(0.0, 0.2, y));
  col = mix(col, vec3(0.003, 0.007, 0.022), smoothstep(0.15, 0.55, y));
  col += vec3(0.05, 0.09, 0.08) * exp(-flSq((p.x - 0.45) / 0.5)) * exp(-max(y, 0.0) * 6.0);
  vec2 sg = p * 34.0, sid = floor(sg);
  vec2 sh = hash22(sid);
  col += vec3(0.7, 0.8, 1.0) * step(0.88, sh.x) * smoothstep(0.1, 0.0, length(fract(sg) - 0.2 - 0.6 * sh)) * (0.3 + 0.2 * sin(t * (0.5 + sh.y) + sh.y * 30.0)) * smoothstep(0.12, 0.35, y);
  float tn = noise(vec2(p.x * 2.7, 1.0)), tn2 = noise(vec2(p.x * 7.0, 4.0));
  float tl = hz + 0.035 + 0.1 * tn + 0.022 * sqrt(abs(sin(p.x * 23.0 + 5.0 * tn2))) * (0.5 + tn) + 0.014 * sqrt(abs(sin(p.x * 57.0 + 9.0 * tn2 + 3.0 * tn))) + 0.008 * noise(vec2(p.x * 90.0, 7.0));
  col = mix(col, vec3(0.002, 0.005, 0.007), smoothstep(0.004, -0.004, p.y - tl));

  // the glow of each kind of sound lies over its own patch of the meadow
  vec3 pools = vec3(0.0);
  float lay = noise(vec2(p.x * 1.6 + uTime * 0.02, p.y * 2.6 - uTime * 0.013));   // one slow field; each kind takes its own band of it
  pools += flPool(uKind[0], uDrone, lay, 0.0) + flPool(uKind[1], uPad, lay, 0.2) + flPool(uKind[2], uTexture, lay, 0.4)
         + flPool(uKind[3], uPhrase, lay, 0.6) + flPool(uKind[4], flHit, lay, 0.8);
  vec3 lightOn = vec3(0.01, 0.03, 0.035) + pools * 0.035;

  // the fireflies, far to near
  vec3 glow = vec3(0.0);
  float kick = sat(uHits * 1.3);
  float flash = kick * exp(-flSq((p.x - mix(-1.0, 1.0, 1.0 - kick)) / 0.22)) + uCue * 0.8 * exp(-flSq((p.x - mix(1.0, -1.0, 1.0 - uCue)) / 0.35));   // a hit or cue runs across the meadow
  flFlies(p, 0.0, 26.0, full, flash, glow, lightOn);
  flFlies(p, 1.0, 14.04, full, flash, glow, lightOn);
  flFlies(p, 2.0, 7.58, full, flash, glow, lightOn);
  flFlies(p, 3.0, 4.09, full, flash, glow, lightOn);

  // the meadow: row behind row of grass, each catching the light along its top
  float px = 1.5 / uRes.y;
  vec2 wind = sin(t * 0.3 + p.x * 3.0 + vec2(0.0, 2.2));
  col = flRow(col, p, 0.0, -0.0520, lightOn, px, wind);
  col = flRow(col, p, 1.0, -0.1220, lightOn, px, wind);
  col = flRow(col, p, 2.0, -0.2185, lightOn, px, wind);
  col = flRow(col, p, 3.0, -0.3284, lightOn, px, wind);
  col = flRow(col, p, 4.0, -0.4480, lightOn, px, wind);
  // mist over the far grass takes the glow
  col += (vec3(0.012, 0.03, 0.035) + pools * 0.07) * exp(-flSq((p.y - hz + 0.03) / 0.05));
  col += glow;
  // tall grass close to us, dark and out of focus
  col = flBlades(col, p, 0.0, lightOn);
  col = flBlades(col, p, 1.0, lightOn);
  return col;
}

vec3 render(vec2 p) {
  flGather();
  if (uVar < 0.5) return screenOf(flDusk(p));
  return screenOf(flNight(p));
}
