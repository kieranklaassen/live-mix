// name: Moire
// a: Dot sheets
// b: Ring sheets
// what: Three round sheets of fine dots hang in the dark, leaning and crossing; where two overlap their dots fall in and out of step, and great slow figures of light open there.
// follows: Travel turns and slides the sheets, the low band stretches one so the figures swell, each kind of sound lights its own overlap, a hit sends a ring through one sheet and a cue twists another.
// own: 0 1 many fine dots or rings, -1 a few coarse ones; 1 1 tall square-cut panels, -1 no edge at all, the sheets fill the picture; 2 1 one great near stack cut off by the picture's corner, -1 a chain going away from big below to small above; 3 the ground: 1 pale paper printed with ink, -1 a lit evening seen through dark pierced plates; 4 a: 1 lines, -1 an open net of threads; b: 1 through spirals to spokes, -1 rings of beads; 5 1 the sheets hang in folds like cloth, -1 they are round balls lit from the upper left; 6 1 laid down like a floor, -1 opened sideways like the leaves of a screen; 7 1 turned well out of step so the figures are many and small, -1 nearly in step so they are vast
// Where the ray meets a leaning sheet, in the sheet's own two directions; t is how far away.
vec2 moTurn = vec2(0.0);   // how far a sheet is laid down or turned aside beside the plain picture
float moFront;             // 1 where the ray meets a sheet, 0 past its horizon
float moShade;             // the light on a bent sheet
vec2 sheet(vec3 rd, vec3 P, float ax, float ay, out float t) {
  vec3 n = normalize(vec3(sin(ay) + moTurn.x, sin(ax) + moTurn.y, -1.0));
  t = dot(P, n) / dot(rd, n);
  moFront = 1.0;
  if (uOwn[6] != 0.0 || uOwn[1] != 0.0) {          // past its own horizon a sheet is not there
    float facing = -dot(rd, n);
    moFront = smoothstep(0.015, 0.2, facing);
    t = min(dot(P, n) / min(dot(rd, n), -0.012), 40.0);
  }
  vec3 q = rd * t - P;
  vec3 ex = normalize(cross(vec3(0.0, 1.0, 0.0), n)), ey = cross(n, ex);
  return vec2(dot(q, ex), dot(q, ey));
}
// One screen of dots, antialiased: full dots when they are big on the screen, their mean when too fine to draw.
float dots(vec2 u, float fw) {
  vec2 c = 0.5 + 0.5 * cos(TAU * u);
  float m = c.x * c.y;
  float at = 0.5 - 0.22 * max(-uOwn[3], 0.0) - 0.22 * max(uOwn[3], 0.0), mean = 0.2 + 0.14 * abs(uOwn[3]);
  if (uOwn[4] > 0.0) { m = c.x * mix(c.y, 1.0, uOwn[4]); mean = mix(0.2, 0.5, uOwn[4]); }
  if (uOwn[4] < 0.0) { m = mix(m, 1.0 - (1.0 - c.x) * (1.0 - c.y), -uOwn[4]); at += 0.36 * -uOwn[4]; mean = mix(0.2, 0.42, -uOwn[4]); }
  float w = clamp(2.2 * fw, 0.04, 0.45);
  float s = smoothstep(at - w, at + w, m);
  return mix(s, mean, smoothstep(0.3, 0.6, fw));
}
// How far a place is from the middle of its sheet, as the edge of the sheet is cut.
float moCut(vec2 q) {
  float e = length(q);
  if (uOwn[1] > 0.0) {
    vec2 v = q * vec2(1.35, 0.8); v *= v; v *= v; v *= v;
    e = mix(e, pow(v.x + v.y + 1e-14, 0.125), uOwn[1]);
  }
  return e;
}
// A sheet bent into folds or a ball: what is added to the place on it. Sets the light there.
vec2 moBent(vec2 q, float e, float R, float own) {
  vec2 more = vec2(0.0);
  if (uOwn[5] < 0.0) {
    float r = min(e / R, 0.998), l = length(q), z = sqrt(1.0 - r * r);
    more = q * (asin(r) / max(r, 1e-3) - 1.0) * -uOwn[5];
    vec2 side = q / max(l, 1e-4) * r;
    float lam = sat(dot(vec3(side, z), vec3(-0.5, 0.55, 0.67)));
    moShade *= mix(1.0, 0.08 + 1.5 * lam * lam + 0.25 * pow(1.0 - z, 3.0), -uOwn[5]);
  }
  if (uOwn[5] > 0.0) {
    float fold = q.x * 9.0 + 1.9 * sin(q.y * 2.6 + own * 2.1) + uTravel * 0.11 + own * 1.7;
    more += uOwn[5] * vec2(0.034 * sin(fold), 0.02 * sin(q.y * 6.0 + q.x * 3.0 + own * 2.0 - uTravel * 0.07));
    moShade *= mix(1.0, 0.3 + 1.1 * sat(0.5 + 0.5 * cos(fold + 0.7)), uOwn[5]);
  }
  return more;
}
// b: rings turned to spirals and then to spokes; the arms are a whole number. There are two of it, with the seam of the
// angle on either side, so that the slope may be taken where neither breaks.
vec2 moRing(vec2 q, float d, float rows) {
  float k = max(uOwn[4], 0.0);
  if (k <= 0.0) return vec2(d * rows);
  float arms = floor(k * k * rows * 1.3 + 0.5) / TAU;
  return vec2(d * rows * (1.0 - k)) + arms * vec2(atan(q.y, q.x + 1e-7), atan(-q.y, -q.x + 1e-7));
}
float moSlope(vec2 r) { vec2 w = fwidth(r); return min(w.x, w.y); }
float rings(float r, float fw) {
  float m = 0.5 + 0.5 * cos(TAU * r);
  float w = clamp(3.0 * fw, 0.05, 0.5);
  float s = smoothstep(0.62 - 0.2 * max(-uOwn[3], 0.0) - w, 0.62 - 0.2 * max(-uOwn[3], 0.0) + w, m);
  return mix(s, 0.3, smoothstep(0.3, 0.6, fw));
}
float fig(float ra, float rb, float f) {
  float dif = ra - rb, sum = ra + rb;
  float wd = smoothstep(0.75, 0.2, fwidth(dif) * 0.5 / max(f, 1e-4)), ws = smoothstep(0.75, 0.2, fwidth(sum) * 0.5 / max(f, 1e-4));
  float gd = 0.5 + 0.5 * cos(TAU * dif), gs = 0.5 + 0.5 * cos(TAU * sum);
  return max(gd * gd * wd, gs * gs * ws);
}
// The same where the angle may break.
float moFig(vec2 ra, vec2 rb, float f) {
  vec2 dif = ra - rb, sum = ra + rb;
  float wd = smoothstep(0.75, 0.2, moSlope(dif) * 0.5 / max(f, 1e-4)), ws = smoothstep(0.75, 0.2, moSlope(sum) * 0.5 / max(f, 1e-4));
  float gd = 0.5 + 0.5 * cos(TAU * dif.x), gs = 0.5 + 0.5 * cos(TAU * sum.x);
  return max(gd * gd * wd, gs * gs * ws);
}
// b: how much of a bead is here, round its ring.
float moBead(vec2 q, float d, float turn) {
  const float n = 72.0;
  float w = length(fwidth(q)) * 0.7 / max(d, 1e-3) * n / TAU;
  return mix(smoothstep(0.35 - w, 0.65 + w, 0.5 + 0.5 * cos(n * (atan(q.y, q.x + 1e-7) + turn))), 0.5, smoothstep(0.25, 0.6, w));
}
vec3 render(vec2 p) {
  float T = uTravel;
  float kick = sat(uHits * 1.3);
  vec3 rd = normalize(vec3(p, 1.3));
  // three round sheets, each leaning its own way, drifting slowly round the middle
  float t0, t1, t2;
  vec3 P0 = vec3(-0.34 + 0.08 * sin(T * 0.05), 0.02 + 0.06 * sin(T * 0.07), 1.3);
  vec3 P1 = vec3(0.38 + 0.08 * cos(T * 0.045), -0.02 + 0.06 * cos(T * 0.06), 1.42);
  vec3 P2 = vec3(0.12 * sin(T * 0.04 + 1.0), 0.07 * sin(T * 0.052 + 2.0), 1.18);
  float R0 = 0.45, R1 = 0.5, R2 = 0.37 + 0.04 * uLevel;
  if (uVar > 0.5) {
    // b: the three hang almost on one middle, each wandering a few rings off it; a cue throws one further out
    P0.xy = 0.085 * vec2(cos(T * 0.13), sin(T * 0.17));
    P1.xy = (0.08 + 0.1 * uCue) * vec2(cos(T * 0.11 + 2.1), sin(T * 0.15 + 2.1));
    P2.xy = 0.07 * vec2(cos(T * 0.09 + 4.2), sin(T * 0.12 + 4.2));
    R0 = 0.4; R1 = 0.52; R2 = 0.3 + 0.04 * uLevel;
  }
  float endless = max(-uOwn[1], 0.0), apart = exp2(1.7 * uOwn[7]);
  if (uVar > 0.5 && uOwn[7] != 0.0) { float o = exp2(1.1 * uOwn[7]); P0.xy *= o; P1.xy *= o; P2.xy *= o; }
  if (uOwn[2] > 0.0) {                  // one great stack, near, its middle toward the lower right
    vec2 c = vec2(0.4, -0.16);
    P0.xy = mix(P0.xy, c + 0.5 * P0.yx, uOwn[2]); P1.xy = mix(P1.xy, c + 0.5 * P1.yx, uOwn[2]); P2.xy = mix(P2.xy, c + 0.7 * P2.yx, uOwn[2]);
    R0 = mix(R0, 0.74, uOwn[2]); R1 = mix(R1, 1.0, uOwn[2]); R2 = mix(R2, 0.4 + 0.04 * uLevel, uOwn[2]);
  }
  if (uOwn[2] < 0.0) {                  // a chain, from the great one below on the left to the small one above
    P1.xy = mix(P1.xy, vec2(-0.5, -0.26) + 0.3 * P1.xy, -uOwn[2]); P0.xy = mix(P0.xy, vec2(0.12, 0.03) + 0.4 * P0.yx, -uOwn[2]); P2.xy = mix(P2.xy, vec2(0.46, 0.22) + 0.4 * P2.xy, -uOwn[2]);
    R1 = mix(R1, 0.62, -uOwn[2]); R0 = mix(R0, 0.36, -uOwn[2]); R2 = mix(R2, 0.2 + 0.02 * uLevel, -uOwn[2]);
  }
  if (endless > 0.0) {                  // they lie on one another and have no edge
    P1.z = mix(P1.z, 1.3, endless); P2.z = mix(P2.z, 1.3, endless);
    float far = exp2(5.0 * endless); R0 *= far; R1 *= far; R2 *= far;
  }
  float down = max(uOwn[6], 0.0) * 2.3, aside = max(-uOwn[6], 0.0) * 1.5;
  float e0, e1, e2, v0, v1, v2;
  float ax = 0.3 * sin(T * 0.061), ay = 0.42 * sin(T * 0.047 + 1.0);   // they lean together, and each a little on its own
  if (uOwn[6] != 0.0) { ax *= 1.0 - 0.75 * abs(uOwn[6]); ay *= 1.0 - 0.75 * abs(uOwn[6]); }
  moTurn = vec2(-aside, down);
  vec2 q0 = sheet(rd, P0, ax + 0.07 * sin(T * 0.09), ay + 0.07 * cos(T * 0.08), t0);
  v0 = moFront; moTurn = vec2(aside, down);
  vec2 q1 = sheet(rd, P1, ax - 0.07 * sin(T * 0.07 + 2.0), ay - 0.06 * sin(T * 0.1), t1);
  v1 = moFront; moTurn = vec2(0.25 * aside, down);
  vec2 q2 = sheet(rd, P2, ax + 0.06 * cos(T * 0.075 + 4.0), ay + 0.08 * sin(T * 0.063 + 3.0), t2);
  v2 = moFront;
  float d0 = length(q0), d1 = length(q1), d2 = length(q2);
  e0 = d0; e1 = d1; e2 = d2;
  if (uOwn[1] > 0.0) { e0 = moCut(q0); e1 = moCut(q1); e2 = moCut(q2); }
  float aa = 1.5 / uRes.y;
  float m0 = smoothstep(R0, R0 - 0.01 - aa, e0) * v0, m1 = smoothstep(R1, R1 - 0.01 - aa, e1) * v1, m2 = smoothstep(R2, R2 - 0.01 - aa, e2) * v2;
  if (m0 + m1 + m2 < 0.001 && uOwn[3] == 0.0) {
    // nothing but the hoops' glow out here
    vec3 g = uKind[0] * exp(-abs(e0 - R0) * 85.0) + uKind[1] * exp(-abs(e1 - R1) * 85.0) + uKind[2] * exp(-abs(e2 - R2) * 85.0);
    return screenOf(g * 0.12 * (0.4 + uLevel));
  }
  // sheets put back into the page so that their dots share one frame: each sheet's place plus its own middle
  float h0 = 1.0, h1 = 1.0, h2 = 1.0;
  vec2 l0 = q0, l1 = q1, l2 = q2;
  if (uOwn[5] != 0.0) {
    moShade = 1.0; q0 += moBent(q0, e0, R0, 0.0); h0 = moShade;
    moShade = 1.0; q1 += moBent(q1, e1, R1, 1.0); h1 = moShade;
    moShade = 1.0; q2 += moBent(q2, e2, R2, 2.0); h2 = moShade;
    d0 = length(q0); d1 = length(q1); d2 = length(q2);
  }
  vec2 w0 = q0 + P0.xy, w1 = q1 + P1.xy, w2 = q2 + P2.xy;
  // a hit pushes a ring outward through the first sheet
  float ringR = R0 * 1.15 * (1.0 - kick);
  if (endless > 0.0) ringR = min(ringR, 1.0 - kick);
  float bump = kick * exp(-pow((d0 - ringR) * 11.0, 2.0));
  w0 += normalize(q0 + 1e-4) * bump * 0.012;
  float rows = 62.0 * (uOwn[0] == 0.0 ? 1.0 : exp2(uOwn[0] * (uOwn[0] > 0.0 ? 0.6 : 1.5))), level = mix(1.0, 1.42 / 1.3, endless), level2 = mix(1.0, 1.18 / 1.3, endless);
  float th = T * 0.028;
  // farther sheets are drawn coarser so that all three look alike from here; then the low and middle bands stretch two of them
  float k0 = rows, k1 = rows * (1.3 / 1.42) * (1.0 + 0.008 * sin(T * 0.09) + 0.025 * uLow), k2 = rows * (1.3 / 1.18) * (0.995 - 0.02 * uMid + 0.006 * cos(T * 0.07));
  k1 *= level; k2 *= level2;
  if (uOwn[7] > 0.0) { k1 *= 1.0 + 0.05 * uOwn[7]; k2 *= 1.0 - 0.035 * uOwn[7]; }
  if (uOwn[7] < 0.0) { k1 = mix(k1, rows * (1.3 / 1.42) * level, -0.75 * uOwn[7]); k2 = mix(k2, rows * (1.3 / 1.18) * level2 * 0.995, -0.75 * uOwn[7]); }
  float a1 = th + 0.028 + 0.02 * sin(T * 0.11) + 0.05 * uCue, a2 = th - 0.032 + 0.02 * cos(T * 0.083);
  if (uOwn[7] != 0.0) { a1 = th + (a1 - th) * apart; a2 = th + (a2 - th) * apart; }
  vec3 cA = mix(uKind[0], uKind[1], 0.5 + 0.35 * sin(T * 0.2)) * (0.35 + 0.9 * max(uDrone, uPad));         // sheets one and two
  vec3 cB = mix(uKind[2], uKind[3], sat(0.5 + uPhrase - uTexture)) * (0.1 + 1.3 * max(uTexture, uPhrase)); // two and three
  vec3 cC = mix(uKind[1], uKind[4], sat(kick + uCue)) * (0.1 + 0.9 * uHigh + 1.2 * kick + 0.8 * uCue);     // one and three
  float f0e = exp(-(t0 - 1.0) * 0.9), f1e = exp(-(t1 - 1.0) * 0.9), f2e = exp(-(t2 - 1.0) * 0.9);         // far parts of a sheet are dimmer
  vec3 col = vec3(0.0);
  float s0, s1, s2, g01, g12, g02;
  if (uVar < 0.5) {
    vec2 e01, e12, e02;
    vec2 u0 = rot(th) * w0 * k0, u1 = rot(a1) * w1 * k1 + vec2(T * 0.13, 0.0), u2 = rot(a2) * w2 * k2 - vec2(0.0, T * 0.11);
    float f0 = length(fwidth(u0)) * 0.5, f1 = length(fwidth(u1)) * 0.5, f2 = length(fwidth(u2)) * 0.5;
    s0 = dots(u0, f0); s1 = dots(u1, f1); s2 = dots(u2, f2);
    // the figures themselves, worked out from the difference of each pair: a soft light under the dots
    e01 = 0.5 + 0.5 * cos(TAU * (u0 - u1)); e12 = 0.5 + 0.5 * cos(TAU * (u1 - u2)); e02 = 0.5 + 0.5 * cos(TAU * (u0 - u2));
    if (uOwn[4] > 0.0) { e01.y = mix(e01.y, 1.0, uOwn[4]); e12.y = mix(e12.y, 1.0, uOwn[4]); e02.y = mix(e02.y, 1.0, uOwn[4]); }
    g01 = e01.x * e01.y; g12 = e12.x * e12.y; g02 = e02.x * e02.y;
  } else {
    // b: sheets of rings, each round its own middle
    float rows2 = 54.0 * (uOwn[0] == 0.0 ? 1.0 : exp2(uOwn[0] * (uOwn[0] > 0.0 ? 0.6 : 1.5)));
    float r0 = d0 * rows2 - T * 0.2, r1 = d1 * rows2 * (1.3 / 1.42) * (1.0 + 0.03 * uLow + 0.03 * uCue) + T * 0.15, r2 = d2 * rows2 * (1.3 / 1.18) * (0.98 - 0.03 * uMid) - T * 0.1;
    r0 += bump * 0.8;
    if (uOwn[4] > 0.0 || endless > 0.0 || uOwn[7] != 0.0) {
      vec2 g0 = moRing(q0, d0, rows2) + bump * 0.8 - T * 0.2, g1 = moRing(q1, d1, rows2 * (1.3 / 1.42) * level * (1.0 + 0.03 * uLow + 0.03 * uCue + 0.05 * uOwn[7])) + T * 0.15, g2 = moRing(q2, d2, rows2 * (1.3 / 1.18) * level2 * (0.98 - 0.03 * uMid - 0.04 * uOwn[7])) - T * 0.1;
      float f0 = moSlope(g0) * 0.5, f1 = moSlope(g1) * 0.5, f2 = moSlope(g2) * 0.5;
      s0 = rings(g0.x, f0); s1 = rings(g1.x, f1); s2 = rings(g2.x, f2);
      g01 = moFig(g0, g1, f0); g12 = moFig(g1, g2, f1); g02 = moFig(g0, g2, f0);
    } else {
    float f0 = fwidth(r0) * 0.5, f1 = fwidth(r1) * 0.5, f2 = fwidth(r2) * 0.5;
    s0 = rings(r0, f0); s1 = rings(r1, f1); s2 = rings(r2, f2);
    // two sets of rings make two families of figures, one from their difference and one from their sum; each shows where it is slow
    g01 = fig(r0, r1, f0); g12 = fig(r1, r2, f1); g02 = fig(r0, r2, f0);
    }
    if (uOwn[4] < 0.0) {
      float k = -uOwn[4];
      s0 *= mix(1.0, 1.25 * moBead(q0, d0, T * 0.03), k); s1 *= mix(1.0, 1.25 * moBead(q1, d1, -T * 0.02), k); s2 *= mix(1.0, 1.25 * moBead(q2, d2, T * 0.025), k);
    }
  }
  if (uOwn[3] != 0.0) {
    vec3 far = vec3(0.0);
    float i01 = m0 * m1 * g01 * g01, i12 = m1 * m2 * g12 * g12, i02 = m0 * m2 * g02 * g02;
    if (uOwn[3] > 0.0) {
      // printed: each sheet is thin vellum with its own ink, and where two are out of step the paper is covered
      vec3 paper = vec3(0.83, 0.79, 0.72) * (0.98 + 0.05 * noise(p * 300.0) - 0.1 * dot(p, p));
      float thrown = 0.0;
      if (endless < 1.0) {
        vec2 o = vec2(-0.03, 0.04);
        thrown = max(max(smoothstep(R0 + 0.05, R0 - 0.06, moCut(l0 + o)) * v0, smoothstep(R1 + 0.05, R1 - 0.06, moCut(l1 + o)) * v1), smoothstep(R2 + 0.05, R2 - 0.06, moCut(l2 + o)) * v2);
      }
      far = paper * (1.0 - 0.3 * thrown * (1.0 - endless));
      float full = 0.8 + 0.22 * uLevel + 0.2 * kick;
      vec3 ink0 = uKind[0] * uKind[0] * 0.75, ink1 = uKind[1] * uKind[1] * 0.75, ink2 = mix(uKind[2], uKind[3], 0.5 * uPhrase) * uKind[2] * 0.75;
      float fog0 = sat(f0e * 1.1), fog1 = sat(f1e * 1.15), fog2 = sat(f2e * 1.1);
      vec3 over = vec3(1.0);
      over *= mix(vec3(1.0), ink0, sat(s0 * full * (0.75 + 0.35 * uDrone) * mix(1.3 - 0.55 * h0, 1.0, 1.0 - abs(uOwn[5]))) * m0 * fog0);
      over *= mix(vec3(1.0), ink1, sat(s1 * full * (0.75 + 0.35 * uPad) * mix(1.3 - 0.55 * h1, 1.0, 1.0 - abs(uOwn[5]))) * m1 * fog1);
      over *= mix(vec3(1.0), ink2, sat(s2 * full * (0.75 + 0.35 * uTexture) * mix(1.3 - 0.55 * h2, 1.0, 1.0 - abs(uOwn[5]))) * m2 * fog2);
      vec3 sheetLight = mix(vec3(1.0), vec3(0.62 + 0.42 * h0), m0 * abs(uOwn[5])) * mix(vec3(1.0), vec3(0.62 + 0.42 * h1), m1 * abs(uOwn[5]) * (1.0 - 0.5 * m0)) * mix(vec3(1.0), vec3(0.62 + 0.42 * h2), m2 * abs(uOwn[5]) * (1.0 - 0.5 * max(m0, m1)));
      far = mix(far, paper, 0.75 * max(m0, max(m1, m2)));
      far *= min(sheetLight, 1.25) * mix(vec3(1.0), 0.8 + 0.2 * uKind[0], m0) * mix(vec3(1.0), 0.8 + 0.2 * uKind[1], m1) * mix(vec3(1.0), 0.8 + 0.2 * uKind[2], m2);
      far *= over;
      // where two are in step a wash of colour lies under them
      far *= mix(vec3(1.0), 0.25 + 0.75 * uKind[1], i01 * 0.5 * max(uDrone, uPad)) * mix(vec3(1.0), 0.25 + 0.75 * uKind[3], i12 * 0.55 * max(uTexture, uPhrase)) * mix(vec3(1.0), 0.2 + 0.8 * uKind[4], i02 * 0.5 * sat(uHigh + kick));
      far *= mix(vec3(1.0), uKind[4] * 0.7, sat(bump * (0.45 + s0)) * m0);
      far *= 1.0 - 0.4 * (exp(-abs(e0 - R0) * 320.0) * v0 + exp(-abs(e1 - R1) * 320.0) * v1 + exp(-abs(e2 - R2) * 320.0) * v2);
      far = pow(max(far, 0.0), vec3(0.4545));
    } else {
      // pierced: an evening behind, dark plates before it, light only where the holes lie one behind another
      float h = sat(p.y + 0.5);
      vec3 low = uKind[2] * uKind[2], high = uKind[0] * uKind[0] * 0.5;
      float lamp = exp(-dot(p - vec2(0.12, -0.2), p - vec2(0.12, -0.2)) * 4.0);
      vec3 sky = mix(low, high, smoothstep(0.0, 1.0, h)) + uKind[1] * uKind[1] * lamp * (0.5 + 0.5 * uPad);
      sky *= 0.75 + 0.6 * uLevel;
      vec3 rim = sky * 0.3;
      float p0 = mix(1.0, s0 * 1.15, m0), p1 = mix(1.0, s1 * 1.15, m1), p2 = mix(1.0, s2 * 1.15, m2);
      float n = m0 + m1 + m2, through = p0 * p1 * p2 * mix(1.0, uVar > 0.5 ? 1.35 : 2.0, sat(n - 1.0));
      vec3 plate = sky * 0.1 * (h0 * m0 * uKind[0] + h1 * m1 * uKind[1] + h2 * m2 * uKind[2]);
      far = sky * through + plate * sat(n);
      far += (cA * i01 + cB * i12 + cC * i02) * (uVar > 0.5 ? 0.1 : 0.3);
      far += uKind[4] * bump * (s0 * 1.4 + 0.3) * m0;
      far += rim * (exp(-abs(e0 - R0) * 200.0) * v0 + exp(-abs(e1 - R1) * 200.0) * v1 + exp(-abs(e2 - R2) * 200.0) * v2) * sat(n) * (1.0 - endless);
      far = screenOf(far * 1.5);
    }
    if (abs(uOwn[3]) >= 1.0) return far;
    s0 *= h0; s1 *= h1; s2 *= h2;
    col += (uKind[0] * s0 * m0 * f0e + uKind[1] * s1 * m1 * f1e + uKind[2] * s2 * m2 * f2e) * 0.14 * (0.5 + uLevel);
    col += cA * m0 * m1 * f0e * (s0 * s1 * 3.6 * (0.08 + g01) + g01 * g01 * 0.2) + cB * m1 * m2 * f1e * (s1 * s2 * 3.6 * (0.08 + g12) + g12 * g12 * 0.2) + cC * m0 * m2 * f2e * (s0 * s2 * 3.6 * (0.08 + g02) + g02 * g02 * 0.2);
    return mix(screenOf(col * (0.6 + 0.6 * uLevel)), far, abs(uOwn[3]));
  }
  if (uOwn[5] != 0.0) { s0 *= h0; s1 *= h1; s2 *= h2; float k = sqrt(max(h0 * h1, 0.0)); g01 *= k; g12 *= k; g02 *= k; }
  // each sheet alone is only a faint screen; light comes where two are in step
  col += (uKind[0] * s0 * m0 * f0e + uKind[1] * s1 * m1 * f1e + uKind[2] * s2 * m2 * f2e) * 0.14 * (0.5 + uLevel);
  col += cA * m0 * m1 * f0e * (s0 * s1 * 3.6 * (0.08 + g01) + g01 * g01 * 0.2);
  col += cB * m1 * m2 * f1e * (s1 * s2 * 3.6 * (0.08 + g12) + g12 * g12 * 0.2);
  col += cC * m0 * m2 * f2e * (s0 * s2 * 3.6 * (0.08 + g02) + g02 * g02 * 0.2);
  col += uKind[4] * bump * (s0 * 1.2 + 0.25) * m0;
  if (uOwn[5] < 0.0) col += (uKind[0] * m0 * h0 * h0 + uKind[1] * m1 * h1 * h1 * (1.0 - m0) + uKind[2] * m2 * h2 * h2) * -uOwn[5] * (0.1 + 0.12 * uLevel);
  if (uOwn[5] < 0.0) col += (uKind[0] * s0 * m0 + uKind[1] * s1 * m1 + uKind[2] * s2 * m2) * -uOwn[5] * 0.3 * (0.5 + uLevel);
  // the hoops that hold the sheets
  col += (uKind[0] * exp(-abs(e0 - R0) * 85.0) * (0.3 + kick) + uKind[1] * exp(-abs(e1 - R1) * 85.0) * (0.3 + uCue) + uKind[2] * exp(-abs(e2 - R2) * 85.0) * 0.3) * 0.4 * (0.4 + uLevel);
  return screenOf(col * (0.6 + 0.6 * uLevel));
}
