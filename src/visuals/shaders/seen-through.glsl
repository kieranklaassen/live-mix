// name: Seen through
// a: Great coil
// b: Tulip bed
// what: Shells on a warm white plate as rays see them: a great worn coil cut by the right edge, its uneven chambers as grey arcs, with the ghost of a tall spire lying through it and two whelks at the left; or a bed of tulips, petals as overlapping veils with seeds and filaments sharp inside, and one head alone, bowed over.
// follows: Loudness is exposure. The drone thickens walls and stems, pad fills chambers and flowers as the loop goes round, texture brings growth lines and veins, the phrase turns the spire or the bowed head and colours the seeds. The bands and the piece tint. A hit parts the outlines, a cue sends a band of black film across. Keys glint as grains, a voice pales it.
// own: 0 black film with pale forms at -1, amber glass with a low sun behind at 1; 1 thickness printed in false colours, orange to violet on mint, at -1, only walls, veins and seams left at 1; 2 a coil of many tight turns, or slim closed buds, at -1, a wide open horn, or flowers fallen open, at 1; 3 far off, to the whole shell or down to the bulbs and roots, at -1, very near at 1; 4 the coil alone, or three flowers and the bowed one, at -1, a heap of shells, or a crowd of flowers, at 1; 5 the coil seen aslant as a steep cone, or the petals gone and seed pods standing, at -1, the coil broken to a fragment, or the bed leaning in wind, at 1
float sePx, seSoft;   // a pixel of the picture as drawn; how soft the plate is
float seBody, seEdge, seNow, sePart;   // how much the bodies and the edges count; the loop; how far a hit has parted the outlines
vec3 seInk[5];                // what each kind of sound takes out of the light

// What a colour takes out of the light when it is in the glass.
vec3 seTaken(vec3 c) {
  c /= max(max(c.r, max(c.g, c.b)), 0.05);
  vec3 k = 1.75 - c;
  return k / max(dot(k, vec3(0.333)), 0.05);
}
// A line of half width w, fainter once it is finer than the plate can hold.
float seLine(float d, float w) {
  float s = max(w, sePx * 0.8) + seSoft;
  return exp(-d * d / (s * s)) * w / s;
}
// The wall of a hollow round tube seen through: x runs -1 to 1 across it, t is how thick the wall, e is a pixel of it.
float seTube(float x, float t, float e) {
  float tt = min(max(t, 1.6 * e), 0.95);
  float o = 1.0 - x * x, i = (1.0 - tt) * (1.0 - tt) - x * x;
  return (sqrt(max(o, 0.0)) - sqrt(max(i, 0.0))) * mix(1.0, t / tt, 0.6);
}

// A line broken straight from point to point, as shell breaks.
float seBreak(float x) { float i = floor(x); return mix(hash11(i + 3.1), hash11(i + 4.1), x - i) - 0.5; }
// A bite out of the shell's edge: inside is below 0.
float seChip(vec2 p, float turn) {
  float d = -1.0;
  for (int i = 0; i < 4; i++) {
    float a = turn + float(i) * 1.6 + 0.9 * hash11(turn + float(i));
    d = max(d, dot(p, vec2(cos(a), sin(a))) - 0.03 - 0.03 * hash11(turn * 3.0 + float(i)));
  }
  return d + 0.008 * seBreak(dot(p, vec2(110.0, 70.0)));
}
// A turned shell lying along x from its tip: its walls, the winding floor and the pillar.
// turn is how far round it is, whelk 0 a tall cone, 1 one with a spout.
float seSpire(vec2 q, float len, float slope, float lg, float turn, float whelk, float soft) {
  float s = q.x;
  if (s < 0.002 || s > len * 1.06 || abs(q.y) > 1.1 * slope * s + 0.004) return 0.0;
  float ss = s / len, px = sePx + soft;
  float w = slope * s * mix(1.0, 1.02 - 0.9 * smoothstep(0.5, 0.98, ss), whelk) * (1.0 - 0.7 * (1.0 - whelk) * smoothstep(0.8, 1.02, ss)) + 0.0015;
  float v = log(ss) / lg + turn;
  float x0 = clamp(q.y / w, -1.0, 1.0);
  float bul = abs(sin(PI * (v + 0.25 * x0)));
  float spout = whelk * smoothstep(0.55, 0.75, ss);
  w *= 0.9 + 0.1 * sqrt(mix(bul, 1.0, spout) + 0.001);
  float x = q.y / w, ax = abs(x);
  float inside = smoothstep(0.0, 1.0, (1.0 - ax) * w / px + 0.2);
  inside *= 1.0 - smoothstep(len - px, len + px, s);
  float cosx = sqrt(max(1.0 - x * x, 0.0) + 0.012 + px / w * 0.3);
  float d = (0.075 / cosx + 0.04) * seBody + 0.04 * (1.0 - seBody) / cosx;
  float a = asin(clamp(x, -1.0, 1.0)) / TAU;
  float pitch = s * lg;
  float f = abs(fract(v + a + 0.5) - 0.5), b = abs(fract(v - a) - 0.5);
  d += 0.3 * seLine(f * pitch, 0.0018 + soft) * (1.0 - spout) + 0.2 * (1.0 - spout) * seLine(b * pitch, 0.0018 + soft);
  // the winding floor, seen as dark lenses, left and right by turns
  float side = fract(v + (x > 0.0 ? 0.25 : 0.75) + 0.5) - 0.5;
  side += 0.16 * ax * (1.0 - ax);
  float reach = max(0.25 * (1.0 - ax) + 0.03, 1e-3);
  float lens = (1.0 - abs(side) / reach) * (1.0 - spout);
  d += 0.34 * seBody * smoothstep(0.0, 0.1 + px / (pitch * reach + 1e-4), lens) * (0.45 + 0.55 * sat(1.0 - lens)) * smoothstep(0.0, 0.1, ax);
  // the pillar
  float pw = 0.1 + 0.03 * sin(v * TAU);
  float pz = 1.0 - (x * x) / (pw * pw);
  d += 0.42 * sqrt(max(pz, 0.0)) * (1.0 - 0.45 * smoothstep(0.35, 0.7, pz));
  // the mouth of a whelk, along its last turn
  vec2 mo = vec2(ss - 0.70, q.y / len + 0.06 - 0.1 * (ss - 0.7)) / vec2(0.21, 0.065);
  float ml = length(mo);
  d += whelk * (0.5 * seLine((ml - 1.0) * 0.07 * len, 0.0025 + soft) - 0.10 * (1.0 - smoothstep(0.8, 1.0, ml)));
  return max(d, 0.0) * inside * smoothstep(0.0, 0.05, ss);
}

// Where a place lies in the coil: how far from the heart, and how far round from the lip.
vec2 seCoilAt(vec2 p, out float nse) {
  vec2 q = p - vec2(0.45, 0.03);
  nse = noise(q * 9.0 + 3.0);
  q = rot(0.35) * q;
  q.y *= 1.07;
  vec2 lean = vec2(0.10, -0.24) * (1.0 - 1.35 * min(uOwn[5], 0.0));
  float ps = dot(q, lean), l2 = 1.0 - dot(lean, lean), r = (sqrt(ps * ps + l2 * dot(q, q)) - ps) / l2;
  q -= lean * r;
  r = max(r * (1.0 + 0.06 * (nse - 0.5)), 1e-4);
  q = rot(5.9) * q;   // the lip lies beyond the right edge
  float th = (abs(q.x) + abs(q.y) < 1e-5) ? 0.0 : fract(atan(q.y, q.x) / TAU);
  return vec2(r, th);
}
float seLw() { return 0.80 * exp2(uOwn[2] * 0.75); }   // how fast the coil opens, a turn
float seLip() { return 0.79 * exp(0.5 * seLw()); }

// How full a chamber is, as the loop comes by, and its band.
vec2 seFill(float c, float now, float ends) {
  float n = hash11(c * 1.37 + 5.0), d = c - now;
  return vec2(ends * exp(-d * d * 0.09) + 0.3 * n, band(fract(c / 16.0 + 64.0) * 16.0 / 15.0) * (0.1 + 1.2 * n * n));
}

vec3 seShells(vec2 p) {
  vec3 T = vec3(0.0);
  float nse, lw = seLw(), lip = seLip();
  vec2 rt = seCoilAt(p, nse);
  float r = rt.x, th = rt.y, u = log(r / lip) / lw - th, lam = exp(-1.07 * lw);
  const float N = 15.0;
  float ends = 0.5 - 0.5 * cos(TAU * uLoop), now = -N * (3.2 - 3.0 * uLoop), broke = max(uOwn[5], 0.0);
  for (int j = 0; j < 2; j++) {
    float k = ceil(u) + float(j), ph = k + th;
    if (ph > 0.0) continue;
    float ro = lip * exp(lw * ph), h = 0.5 * ro * (1.0 - lam), x = (r - ro + h) / h;
    if (x < -1.0 || h < 1e-5) break;
    float e = sePx / h, x2 = x * x;
    // the lip is broken
    float jag = 0.06 + 0.05 * seBreak(x * 2.1) + 0.022 * seBreak(x * 7.0 + 20.0) + 0.6 * broke;
    float lipd = (-jag - ph) * TAU * r;
    float here = smoothstep(-sePx, sePx, lipd);
    if (here <= 0.0) continue;
    float small = smoothstep(0.5, 4.0, h / sePx);
    float wt = (0.04 + 0.02 * nse) * (1.0 + 0.7 * uDrone + 0.25 * uLow);
    float wall = seTube(x, wt, e);
    // bites out of its edge, and where it crumbles
    float chip = min(seChip(p - vec2(-0.205, -0.13), 1.0), seChip((p - vec2(0.0, 0.345)) * 0.8, 4.0));
    chip -= 0.5 * broke * max(noise(p * 4.0 + 1.0) - 0.45, 0.0);
    here *= smoothstep(-sePx, sePx, chip);
    float deep = 1.0 + 0.9 * exp2(-ro * 5.0);
    wall = max(wall - 1.3 * wt * sat(1.0 - seBody), 0.0) + 0.6 * uHits * seTube(x + 0.022 * sePart / h, wt, e);
    float T1 = seEdge * (wall * 2.0 * deep + 0.2 * seLine(chip - 0.006, 0.004) + 0.22 * seLine(lipd - 0.003, 0.0025));
    // growth lines
    float gl = sin(ph * TAU * 64.0 - 22.0 * x2 - 5.0 * x + 4.0 * nse) * 0.6 + 0.4 * sin(ph * TAU * 149.0 - 50.0 * x2 - 12.0 * x);
    float body = sqrt(max(1.0 - x2, 0.0)) * seBody;
    T1 += (0.012 + 0.05 * uTexture) * gl * body * smoothstep(1.5, 4.0, TAU * r / 64.0 / sePx * 0.5);
    T1 += 0.07 * body + 0.14 * deep * x2 * x2 * seBody;
    // the partitions
    float sep = 0.0;
    float f = ph * N + 0.62 * (1.0 - x2) - 0.25 * x + 0.35 * noise(vec2(ph * 5.0, 2.0)), i0 = floor(f), chamber = i0 - 1.0;
    float inner = smoothstep(0.10, 0.13, -ph - 0.02 * x - 0.5 * broke);
    float unit = TAU * r / N;
    vec2 am = seFill(i0 - 1.0, now, ends);
    for (int m = 0; m < 2; m++) {
      float id = i0 + float(m), hs = hash11(id * 0.731 + 2.0), hs2 = hash11(id * 1.913 + 9.0);
      float g = f - id - 0.55 * (hs - 0.5) - 0.22 * (hs2 - 0.5) * x;
      float d = g * unit;
      float part = hs2 > 0.8 ? smoothstep(-0.2, 0.0, x + 0.6 * (hs - 0.5)) : 1.0;
      sep += part * (0.75 * seEdge * seLine(d, 0.0022 + 0.009 * h) + 0.24 * seBody * exp(-max(-d, 0.0) / (0.10 * unit + sePx)) * step(d, 0.0));
      am = mix(am, seFill(id, now, ends), smoothstep(-sePx, sePx, d));
      chamber += step(0.0, d);
    }
    T1 += sep * inner * small * (1.0 - smoothstep(0.92, 1.0, abs(x)));
    // the thread that joins the chambers
    float sx = abs(x - 0.1 - 0.04 * sin(f * TAU));
    T1 += inner * small * 0.16 * seLine((sx - 0.035) * h, 0.0016);
    vec4 m = piece(vec2(sat(1.0 + ph / 3.1), 0.5 + 0.48 * x));
    vec3 pieceInk = seTaken(m.rgb + 0.02);
    T += here * T1 * mix(vec3(1.0), pieceInk, 0.5 * sat(m.a * 1.3)) * (1.0 + 0.4 * m.a);
    float room = here * body * inner * small, struck = exp(-0.25 * (f - now) * (f - now)) * ends * uHits;
    T += room * struck * 0.6 * seInk[4] * (0.4 + uEnergy);
    T += room * (0.5 + 0.9 * exp(-3.0 * ro)) * (uPad * (0.02 + 0.28 * am.x) * seInk[1] + 0.2 * am.y * seTaken(kindColour(fract(chamber * 0.21) * 3.0)) * (0.4 + uEnergy));
    T += here * body * m.a * 0.11 * pieceInk * (0.5 + uEnergy);
  }
  // the dark heart
  T += 0.9 * exp(-r * r * 2500.0) + seBody * (0.45 * exp(-r * r * 90.0) + 0.25 * exp(-r * 4.5));

  float far = 0.0015 + 0.002 * uSpace;
  vec2 q = p - vec2(-0.70, 0.43);
  q = vec2(dot(q, vec2(0.80, -0.60)), dot(q, vec2(0.60, 0.80)));
  q += vec2(0.05, 0.08) * (uSpace - 0.5) + vec2(0.0, 0.01 * sin(q.x * 3.0));
  float turn = fract(uTime * 0.006) + 0.5 * uPhrase, others = sat(1.0 + uOwn[4]);
  // the tall one behind, or one of two small whelks: they never lie over each other
  vec2 q1 = rot(0.35) * (p - vec2(-0.82, -0.13)), q2 = rot(-0.5) * (p - vec2(-0.66, -0.30));
  bool one = q1.x > 0.0 && q1.x < 0.43 && abs(q1.y) < 0.11, two = q2.x > 0.0 && q2.x < 0.31 && abs(q2.y) < 0.09;
  bool tiny = one || two;
  float sp = seSpire(one ? q1 : two ? q2 : q, one ? 0.42 : two ? 0.30 : 1.3, one ? 0.36 : two ? 0.30 : 0.15, tiny ? 0.34 : 0.24, one ? 0.2 : two ? 0.45 : turn, tiny ? 1.0 : 0.0, one ? 0.0 : two ? 0.004 : far);
  T += others * sp * (tiny ? vec3(1.25) : (1.0 + 0.5 * uPhrase) * mix(vec3(1.0), seInk[3], 0.15 + 0.55 * uPhrase));
  // a heap of others, when there is one
  if (uOwn[4] > 0.0) for (int i = 0; i < 9; i++) {
    float n = float(i), a = hash11(n + 1.7), len = 0.3 + 0.25 * hash11(n + 5.0);
    vec2 c = vec2(-0.84 + 0.17 * n - 0.7 * step(6.0, n), 0.38 - 0.76 * fract(0.15 + n * 0.618));
    T += uOwn[4] * 1.3 * seSpire(rot(TAU * a) * (p - c) + vec2(0.5 * len, 0.0), len, mix(0.36, 0.17, mod(n, 2.0)), 0.3, a, 1.0 - mod(n, 2.0), 0.0005 + 0.003 * hash11(n + 8.0));
  }
  return T;
}

// One petal: a thin cupped sheet, darker at its sides where it turns away, with fine veins.
float sePetal(vec2 q, float lean, float wid, float hgt, float open, float e, float size, float seed, inout float tone) {
  float t = q.y / hgt;
  if (t <= 0.0 || t >= 1.0) return 0.0;
  float belly = 2.1 * t * (1.0 - 0.72 * t);
  float w = wid * 1.12 * sqrt(t) * (1.0 - t * t) * (1.0 + 0.05 * sin(t * 11.0 + seed * 30.0)) * (1.0 + 0.35 * t) + 1e-4;
  float x = (q.x - lean * (belly + open * t * t * 1.5)) / w, ax = abs(x);
  float d = uHits > 0.004 ? 0.28 * uHits * seLine((1.0 - abs(x + sePart * 0.1 * wid / w)) * w * size, 0.003) : 0.0;
  if (ax >= 1.0) return d;
  float in1 = smoothstep(0.0, 1.0, (1.0 - ax) * w / (1.5 * e));
  float turned = 1.0 / sqrt(1.0 - x * x + 0.03 + e / w * 0.2);
  float v = abs(fract(x * (4.5 + 2.0 * seed) + 0.8 * t * x + seed) - 0.5);
  tone += in1;
  return d + in1 * ((0.05 + 0.065 * turned + 0.07 * (1.0 - t) * (1.0 - t)) * seBody + 0.05 * turned * (seEdge - 1.0)
    + seEdge * (0.05 + 0.07 * uTexture) * (1.0 - smoothstep(0.02, 0.10 + e / w * 5.0, v)) * smoothstep(0.0, 0.2, t));
}
// One flower: its foot is at 0 and its tip near 1.
vec3 seHead(vec2 q, float size, float n, float at, float far) {
  float open = 0.22 * (hash11(n + 3.0) - 0.5) + 0.8 * max(uOwn[2], 0.0) + 0.02 * sin(uTime * 0.11 + n * 2.0);
  float slim = 1.0 - 0.5 * max(-uOwn[2], 0.0), e = (sePx + far) / size, bare = max(-uOwn[5], 0.0);
  vec3 T = vec3(0.0);
  if (bare < 1.0 && q.y > 0.0) {
    float d = 0.0, tone = 0.0;
    for (int i = 0; i < 5; i++) {
      float f = float(i), h = fract(n * 0.377 + f * 0.618), h2 = fract(n * 0.731 + f * 0.413);
      d += sePetal(q, slim * (0.135 * (f - 2.0) + 0.12 * (h - 0.5)), slim * (0.29 + 0.09 * h2), 0.88 + 0.22 * h, open, e, size, h2, tone);
    }
    if (d > 0.0) {
      float run = (at - seNow) * 3.0, b = band(fract(n * 0.1875));
      run = exp(-run * run) * (0.5 - 0.5 * cos(TAU * uLoop));
      T = d * mix(vec3(1.0), seInk[1], 0.5 * uPad) + tone * seBody * (uPad * (0.02 + 0.09 * run) * seInk[1] + 0.06 * b * (0.4 + uEnergy) * seTaken(kindColour(fract(n * 0.47) * 3.0)) + 0.1 * run * uHits * seInk[4]);
    }
    T *= 1.0 - bare;
  }
  // the pod with its two rows of seeds, its crown of three, and the filaments
  if (abs(q.x) < 0.22 && q.y < 0.72 && q.y > -0.02) {
    float grown = 1.0 + 0.5 * bare, py = (q.y - 0.2 * grown) / (0.21 * grown);
    float pw = 0.062 * grown * (1.0 + 0.5 * bare) * sqrt(max(1.0 - py * py, 0.0) + 1e-3), x = q.x / pw;
    float in2 = 1.0 - smoothstep(0.0, 1.0, 1.0 + (abs(x) - 1.0) * pw / (1.5 * e));
    float row = abs(fract(q.y * 22.0) - 0.5) / 22.0, seed = length(vec2(abs(q.x) - 0.45 * pw, row * 1.7));
    float d = in2 * (0.32 * seBody * sqrt(max(1.0 - x * x, 0.0)) + 0.1 + 0.4 * seEdge * (1.0 - smoothstep(0.009, 0.009 + 2.0 * e, seed)));
    vec2 c = vec2(abs(q.x), q.y - 0.43 * grown);
    d += 0.4 * (1.0 - smoothstep(0.0, 2.0 * e, length(vec2((c.x - 0.035) * 0.8, c.y - 0.25 * c.x)) - 0.028));
    float fan = 0.042 * (1.0 + 1.3 * max(q.y, 0.0)), k = clamp(floor(q.x / fan + 0.5), -2.0, 2.0), h = fract(n * 0.17 + k * 0.618), top = 0.34 + 0.1 * h;
    d += (1.0 - bare) * 0.35 * seEdge * seLine((q.x - fan * k) * size, 0.0014) * (1.0 - smoothstep(top, top + 0.02, q.y)) * smoothstep(0.0, 0.04, q.y);
    float al = length(vec2((q.x - fan * k) / 0.016, (q.y - top - 0.07) / 0.085));
    d += (1.0 - bare) * 0.5 * (1.0 - smoothstep(0.75, 1.0 + e * 20.0, al));
    T += d * mix(vec3(1.0), seInk[3], 0.6 * uPhrase);
  }
  return T;
}
// A stem seen through: a wet tube with threads inside.
float seStem(float d, float w) {
  float x = d / w;
  if (abs(x) > 1.0) return 0.0;
  return (0.5 + 0.35 * uDrone) * seEdge * seTube(x, 0.22, sePx / w) + 0.10 * seBody + 0.14 * seLine(d - 0.3 * w, 0.0011) + 0.10 * seLine(d + 0.4 * w, 0.0011);
}
// A bulb with roots.
float seBulb(vec2 q, float n) {
  float d = 0.0;
  for (int i = 0; i < 4; i++) { float R = 0.085 - 0.019 * float(i), k = length((q + vec2(0.0, 0.009 * float(i))) * vec2(1.0, 0.85 - 0.9 * q.y)); d += 0.6 * seTube(k / R, 0.12, sePx / R); }
  float out1 = 0.03 + max(-q.y - 0.05, 0.0) * 0.8, ra = q.x / out1;
  float ro = abs(fract(ra * 3.5 + 0.35 * sin(q.y * 40.0 + floor(ra * 3.5) * 2.0 + n)) - 0.5) / 3.5 * out1;
  d += 0.4 * seLine(ro, 0.0016) * (1.0 - smoothstep(0.8, 1.0, abs(ra))) * smoothstep(0.06, 0.075, -q.y) * (1.0 - smoothstep(0.1, 0.22 + 0.05 * sin(ra * 9.0), -q.y));
  return d;
}
// each flower's foot, where its stem leaves the ground, its size; after the eighth, a crowd behind
vec4 seFlower[14] = vec4[14](
  vec4(-0.80, -0.13, -0.88, 0.27), vec4(-0.56, 0.06, -0.63, 0.32), vec4(-0.41, -0.21, -0.47, 0.26), vec4(-0.17, -0.03, -0.26, 0.33),
  vec4(0.02, -0.26, -0.05, 0.25), vec4(0.22, -0.12, 0.11, 0.28), vec4(0.37, -0.28, 0.30, 0.23), vec4(-1.06, -0.04, -1.0, 0.3),
  vec4(-0.68, 0.16, -0.52, 0.22), vec4(-0.33, 0.17, -0.45, 0.2), vec4(0.06, 0.12, -0.02, 0.22), vec4(0.40, 0.02, 0.46, 0.22), vec4(0.84, -0.28, 0.7, 0.24), vec4(1.05, -0.06, 0.95, 0.25));
vec4 seLeaf[9] = vec4[9](   // foot, how far it leans, how far it bends over, its tip's height
  vec4(-0.86, -0.16, 0.10, 0.02), vec4(-0.70, 0.22, 0.14, -0.06), vec4(-0.50, -0.20, -0.04, 0.10), vec4(-0.34, 0.10, 0.26, -0.10), vec4(-0.22, -0.10, -0.16, -0.16),
  vec4(0.02, 0.16, -0.06, 0.08), vec4(0.16, 0.02, 0.28, -0.20), vec4(0.48, -0.10, 0.36, -0.08), vec4(-1.06, 0.12, 0.2, 0.0));

// how much of a flower is there
float seHere(int i) { return i > 7 ? max(uOwn[4], 0.0) : i == 1 || i == 3 || i == 5 ? 1.0 : sat(1.0 + uOwn[4]); }

vec3 seBed(vec2 p) {
  vec3 T = vec3(0.0);
  float lo = p.y + 0.5;
  // everything leans together, and a little by itself
  p.x -= 0.4 * max(uOwn[5], 0.0) * lo * lo + lo * lo * 0.012 * sin(uTime * 0.17 + p.x * 2.0);
  for (int i = 0; i < 9; i++) {
    vec4 l = seLeaf[i];
    float t = (p.y + 0.56) / (l.w + 0.56);
    if (t <= 0.0 || t >= 1.0) continue;
    float xc = l.x + l.y * t + l.z * t * t * t;
    if (abs(p.x - xc) > 0.1) continue;
    float h = fract(float(i) * 0.618 + 0.2);
    float w = (0.05 + 0.03 * h) * 1.5 * sqrt(t + 0.02) * (1.0 - t * t) + 1e-4, x = (p.x - xc) / w;
    if (abs(x) > 1.0) continue;
    float in1 = smoothstep(0.0, 1.0, (1.0 - abs(x)) * w / (1.5 * sePx)), fold = 0.5 - 0.9 * h + 0.5 * sin(t * 3.0 + h * 6.0);
    float d = (0.14 + 0.05 / sqrt(max(1.0 - x * x, 0.0) + 0.03)) * seBody;
    d += 0.16 * seBody * smoothstep(-sePx, sePx, (x - fold) * w) + 0.2 * seEdge * seLine((x - fold) * w, 0.002);
    d += (0.05 + 0.05 * uTexture) * seEdge * seLine((abs(fract(x * 5.0) - 0.5)) * w / 5.0, 0.0014);
    d += 0.16 * seEdge * seLine((1.0 - abs(x)) * w - 0.003, 0.003);
    T += d * in1 * mix(vec3(1.0), seInk[2], 0.2 + 0.4 * uTexture);
  }
  // the stem nearest here, and the three flowers nearest
  float reach = 0.42 + 0.3 * max(uOwn[2], 0.0), stem = 9.0, stemW = 0.01;
  vec3 near = vec3(1.0), who = vec3(-1.0);
  for (int i = 0; i < 14; i++) {
    if (i == 8 && uOwn[4] <= 0.0) break;
    vec4 f = seFlower[i];
    float n = float(i), here = seHere(i), tall = f.y + 0.5, t = (p.y + 0.5) / tall, g = max(t, 0.0);
    float x = f.z + (f.x - f.z) * g * g, w = (i < 8 ? 0.0095 : 0.012) * here + 1e-4, slope = (f.x - f.z) * 2.0 * g / tall;
    float d = t < 1.0 && p.y > -0.64 && here > 0.02 ? (p.x - x) / (w * sqrt(1.0 + slope * slope)) : 9.0;
    if (abs(d) < abs(stem)) { stem = d; stemW = w; }
    if (p.y < -0.55 && abs(p.x - x) < 0.2) T += here * seBulb(p - vec2(x, -0.68), n);
    vec2 v = p - f.xy - 0.52 * f.w * normalize(vec2((f.x - f.z) * 2.0, tall));
    float o = here > 0.0 ? dot(v, v) / (reach * f.w * f.w) : 9.0;
    if (o < near.x) { near = vec3(o, near.xy); who = vec3(n, who.xy); }
    else if (o < near.y) { near.yz = vec2(o, near.y); who.yz = vec2(n, who.y); }
    else if (o < near.z) { near.z = o; who.z = n; }
  }
  // the one alone, bowed over
  const vec2 bow = vec2(0.63, 0.16), wide = vec2(0.105, 0.19);
  const float hang = -0.25;
  float t = (p.y + 0.6) / (bow.y + 0.6), x = bow.x - wide.x + 0.2 * (p.y - bow.y) + 0.07 * (1.0 - t) * (1.0 - t);
  float d = t < 1.0 && p.y > -0.64 ? (p.x - x) * 0.985 / 0.0092 : 9.0;
  if (p.y < -0.55 && abs(p.x - x) < 0.2) T += seBulb(p - vec2(x, -0.68), 20.0);
  vec2 v = p - bow, u = vec2(v.x - 0.2 * v.y, v.y), foot = wide * vec2(cos(hang), sin(hang)) + vec2(0.2 * wide.y * sin(hang), 0.0);
  if (abs(u.x) < 0.13 && (u.y > 0.0 || u.y > -0.6 * u.x && u.x > 0.0)) { vec2 o = u / wide; float l = length(o) + 1e-4; d = (l - 1.0) * l / length(o / wide + 1e-4) / 0.0088; }
  if (abs(d) < abs(stem)) { stem = d; stemW = 0.0092; }
  if (abs(stem) < 1.0) T += seStem(stem * stemW, stemW);
  v = rot(0.3 * uPhrase + 0.03 * sin(uTime * 0.23)) * (v - foot);
  vec2 down = normalize(vec2(sin(hang) * 0.8, -cos(hang))), vm = v - 0.15 * down;
  float alone = dot(vm, vm) / (reach * 0.085);
  if (alone < near.x) who = vec3(14.0, who.xy); else if (alone < near.y) who.yz = vec2(14.0, who.y); else if (alone < near.z) who.z = 14.0;
  for (int k = 0; k < 3; k++) {
    if (who.x < -0.5) break;
    int i = int(who.x + 0.5);
    vec4 f = seFlower[min(i, 13)];
    bool last = i == 14;
    vec2 dir = last ? down : normalize(vec2((f.x - f.z) * 2.0, f.y + 0.5)), q = last ? v : p - f.xy;
    float size = last ? 0.29 : f.w, here = last ? 1.0 : seHere(i);
    T += here * seHead(vec2(q.x * dir.y - q.y * dir.x, dot(q, dir)) / size, size, last ? 30.0 : who.x, last ? 0.85 : f.x / 1.8 + 0.5, i > 7 && !last ? 0.003 : 0.0);
    who = vec3(who.yz, -1.0);
  }
  // the piece is how thick things are, and what they are tinted with
  vec4 m = piece(vec2(sat(p.x / 1.8 + 0.5), sat(0.55 - 1.1 * p.y)));
  if (m.a > 0.003) T *= mix(vec3(1.0), seTaken(m.rgb + 0.02), 0.55 * sat(m.a * 1.3)) * (1.0 + 0.5 * m.a);
  return T;
}

vec3 render(vec2 p) {
  float wide = 0.5 * uRes.x / uRes.y;
  sePx = 1.0 / uRes.y;
  seNow = uLoop;
  sePart = 4.0 * uHits * (1.0 - uHits);
  seBody = 1.0 - 0.92 * max(uOwn[1], 0.0); seEdge = 1.0 + 0.5 * max(uOwn[1], 0.0);
  for (int i = 0; i < 5; i++) seInk[i] = seTaken(uKind[i]);
  vec2 at = p;
  float tall = 1.0 - smoothstep(0.3, 0.75, wide);
  // where the eye stands
  float z = exp2(-(uOwn[3] > 0.0 ? 1.0 : 0.65) * uOwn[3]);
  vec2 mid = mix(uVar < 0.5 ? vec2(0.0) : vec2(0.18, 0.42), uVar < 0.5 ? vec2(0.40, 0.03) : vec2(-0.30, 0.04), smoothstep(-0.2, 0.2, uOwn[3]));
  p = mid + (p - mid) * z;
  p = p * (1.0 + 0.48 * tall) + (uVar < 0.5 ? vec2(0.22, 0.0) : vec2(0.42, 0.24)) * tall;
  sePx *= z * (1.0 + 0.48 * tall);
  seSoft = 0.0012 * (1.0 - uTone) + (uVar < 0.5 ? 0.0 : 0.0005 * uSpace);
  vec3 T = uVar < 0.5 ? seShells(p) : seBed(p);
  float breath = 1.0 + 0.03 * sin(uTime * 0.21) + 0.02 * sin(uTime * 0.13 + 1.0);
  vec2 by = at + vec2(0.1, 0.1);
  T = max(T, 0.0) * breath * (uVar < 0.5 ? 1.2 : 1.1) * (1.0 - 0.3 * max(uOwn[0], 0.0)) * (1.0 + 0.35 * uLevel) * (0.88 + 0.24 * uTone) * (1.0 - 0.4 * uMic * exp(-3.0 * dot(by, by)));
  // the plate: uneven, with its grain
  vec2 pix = gl_FragCoord.xy;
  float grain = hash21(floor(pix)) - 0.5, speck = hash21(floor(pix * 0.5) + 31.0);
  T *= 1.0 + 0.16 * grain;
  T += 0.02 * noise(at * 2.1 + 4.0) + 0.06 * dot(at, at);
  T -= uKeys * 0.5 * step(0.97, speck) * sat(T * 2.0);
  vec3 paper = vec3(0.955, 0.943, 0.912);
  // a pane of amber with a low sun behind it
  float sun = max(uOwn[0], 0.0);
  vec2 su = at - vec2(-0.45, 0.20);
  paper = mix(paper, mix(vec3(1.0, 0.86, 0.50), vec3(0.70, 0.27, 0.08), sat(length(su) * 0.95)), sun);
  // the black film: the ground goes dark and what was thick shines; a cue sends a band of it across
  float black = max(-uOwn[0], 0.0);
  float far = (uVar < 0.5 ? length(at - vec2(0.44, 0.03)) : at.x + min(wide, 1.0)) - 1.7 * (1.0 - uCue);
  black = mix(black, 1.0 - black, 0.9 * smoothstep(0.0, 0.3, uCue) * exp(-far * far * 24.0));
  paper *= 1.0 - 0.15 * uCue;
  T = max(T, 0.0);
  T = 2.8 * (1.0 - exp(-T / 2.8));
  vec3 col = paper * mix(vec3(0.035, 0.04, 0.05), vec3(1.0), (1.0 - black) * (1.0 - black)) * exp(-T * vec3(1.06, 1.0, 0.95) * (1.0 + 0.5 * black));
  col += sqrt(black) * vec3(0.93, 0.97, 1.0) * pow(1.0 - exp(-T.gbr * 1.1), vec3(mix(4.0, 1.3, black)));
  // thickness printed in false colours
  float odd = max(-uOwn[1], 0.0);
  if (odd > 0.0) {
    float l = dot(col, vec3(0.33));
    vec3 c = mix(vec3(0.06, 0.03, 0.16), vec3(0.45, 0.08, 0.36), smoothstep(0.02, 0.3, l));
    c = mix(c, vec3(0.93, 0.36, 0.22), smoothstep(0.25, 0.52, l));
    c = mix(c, vec3(0.98, 0.78, 0.42), smoothstep(0.5, 0.75, l)); c = mix(c, vec3(0.78, 0.93, 0.90), smoothstep(0.74, 0.93, l));
    col = mix(col, max(c + 0.4 * (col - l), 0.0), odd);
  }
  return col;
}
