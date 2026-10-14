// name: Moire
// a: Dot sheets
// b: Ring sheets
// what: Three round sheets of fine dots hang in the dark, leaning and crossing; where two overlap their dots fall in and out of step, and great slow figures of light open there.
// follows: Travel turns and slides the sheets, the low band stretches one so the figures swell, each kind of sound lights its own overlap, a hit sends a ring through one sheet and a cue twists another.
// Where the ray meets a leaning sheet, in the sheet's own two directions; t is how far away.
vec2 sheet(vec3 rd, vec3 P, float ax, float ay, out float t) {
  vec3 n = normalize(vec3(sin(ay), sin(ax), -1.0));
  t = dot(P, n) / dot(rd, n);
  vec3 q = rd * t - P;
  vec3 ex = normalize(cross(vec3(0.0, 1.0, 0.0), n)), ey = cross(n, ex);
  return vec2(dot(q, ex), dot(q, ey));
}
// One screen of dots, antialiased: full dots when they are big on the screen, their mean when too fine to draw.
float dots(vec2 u, float fw) {
  vec2 c = 0.5 + 0.5 * cos(TAU * u);
  float m = c.x * c.y;
  float w = clamp(2.2 * fw, 0.04, 0.45);
  float s = smoothstep(0.5 - w, 0.5 + w, m);
  return mix(s, 0.2, smoothstep(0.3, 0.6, fw));
}
float rings(float r, float fw) {
  float m = 0.5 + 0.5 * cos(TAU * r);
  float w = clamp(3.0 * fw, 0.05, 0.5);
  float s = smoothstep(0.62 - w, 0.62 + w, m);
  return mix(s, 0.3, smoothstep(0.3, 0.6, fw));
}
float fig(float ra, float rb, float f) {
  float dif = ra - rb, sum = ra + rb;
  float wd = smoothstep(0.75, 0.2, fwidth(dif) * 0.5 / max(f, 1e-4)), ws = smoothstep(0.75, 0.2, fwidth(sum) * 0.5 / max(f, 1e-4));
  float gd = 0.5 + 0.5 * cos(TAU * dif), gs = 0.5 + 0.5 * cos(TAU * sum);
  return max(gd * gd * wd, gs * gs * ws);
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
  float ax = 0.3 * sin(T * 0.061), ay = 0.42 * sin(T * 0.047 + 1.0);   // they lean together, and each a little on its own
  vec2 q0 = sheet(rd, P0, ax + 0.07 * sin(T * 0.09), ay + 0.07 * cos(T * 0.08), t0);
  vec2 q1 = sheet(rd, P1, ax - 0.07 * sin(T * 0.07 + 2.0), ay - 0.06 * sin(T * 0.1), t1);
  vec2 q2 = sheet(rd, P2, ax + 0.06 * cos(T * 0.075 + 4.0), ay + 0.08 * sin(T * 0.063 + 3.0), t2);
  float d0 = length(q0), d1 = length(q1), d2 = length(q2);
  float aa = 1.5 / uRes.y;
  float m0 = smoothstep(R0, R0 - 0.01 - aa, d0), m1 = smoothstep(R1, R1 - 0.01 - aa, d1), m2 = smoothstep(R2, R2 - 0.01 - aa, d2);
  if (m0 + m1 + m2 < 0.001) {
    // nothing but the hoops' glow out here
    vec3 g = uKind[0] * exp(-abs(d0 - R0) * 85.0) + uKind[1] * exp(-abs(d1 - R1) * 85.0) + uKind[2] * exp(-abs(d2 - R2) * 85.0);
    return screenOf(g * 0.12 * (0.4 + uLevel));
  }
  // sheets put back into the page so that their dots share one frame: each sheet's place plus its own middle
  vec2 w0 = q0 + P0.xy, w1 = q1 + P1.xy, w2 = q2 + P2.xy;
  // a hit pushes a ring outward through the first sheet
  float ringR = R0 * 1.15 * (1.0 - kick);
  float bump = kick * exp(-pow((d0 - ringR) * 11.0, 2.0));
  w0 += normalize(q0 + 1e-4) * bump * 0.012;
  float rows = 62.0;
  float th = T * 0.028;
  // farther sheets are drawn coarser so that all three look alike from here; then the low and middle bands stretch two of them
  float k0 = rows, k1 = rows * (1.3 / 1.42) * (1.0 + 0.008 * sin(T * 0.09) + 0.025 * uLow), k2 = rows * (1.3 / 1.18) * (0.995 - 0.02 * uMid + 0.006 * cos(T * 0.07));
  float a1 = th + 0.028 + 0.02 * sin(T * 0.11) + 0.05 * uCue, a2 = th - 0.032 + 0.02 * cos(T * 0.083);
  vec3 cA = mix(uKind[0], uKind[1], 0.5 + 0.35 * sin(T * 0.2)) * (0.35 + 0.9 * max(uDrone, uPad));         // sheets one and two
  vec3 cB = mix(uKind[2], uKind[3], sat(0.5 + uPhrase - uTexture)) * (0.1 + 1.3 * max(uTexture, uPhrase)); // two and three
  vec3 cC = mix(uKind[1], uKind[4], sat(kick + uCue)) * (0.1 + 0.9 * uHigh + 1.2 * kick + 0.8 * uCue);     // one and three
  float f0e = exp(-(t0 - 1.0) * 0.9), f1e = exp(-(t1 - 1.0) * 0.9), f2e = exp(-(t2 - 1.0) * 0.9);         // far parts of a sheet are dimmer
  vec3 col = vec3(0.0);
  float s0, s1, s2, g01, g12, g02;
  if (uVar < 0.5) {
    vec2 u0 = rot(th) * w0 * k0, u1 = rot(a1) * w1 * k1 + vec2(T * 0.13, 0.0), u2 = rot(a2) * w2 * k2 - vec2(0.0, T * 0.11);
    float f0 = length(fwidth(u0)) * 0.5, f1 = length(fwidth(u1)) * 0.5, f2 = length(fwidth(u2)) * 0.5;
    s0 = dots(u0, f0); s1 = dots(u1, f1); s2 = dots(u2, f2);
    // the figures themselves, worked out from the difference of each pair: a soft light under the dots
    vec2 e01 = 0.5 + 0.5 * cos(TAU * (u0 - u1)), e12 = 0.5 + 0.5 * cos(TAU * (u1 - u2)), e02 = 0.5 + 0.5 * cos(TAU * (u0 - u2));
    g01 = e01.x * e01.y; g12 = e12.x * e12.y; g02 = e02.x * e02.y;
  } else {
    // b: sheets of rings, each round its own middle
    float rows2 = 54.0;
    float r0 = d0 * rows2 - T * 0.2, r1 = d1 * rows2 * (1.3 / 1.42) * (1.0 + 0.03 * uLow + 0.03 * uCue) + T * 0.15, r2 = d2 * rows2 * (1.3 / 1.18) * (0.98 - 0.03 * uMid) - T * 0.1;
    r0 += bump * 0.8;
    float f0 = fwidth(r0) * 0.5, f1 = fwidth(r1) * 0.5, f2 = fwidth(r2) * 0.5;
    s0 = rings(r0, f0); s1 = rings(r1, f1); s2 = rings(r2, f2);
    // two sets of rings make two families of figures, one from their difference and one from their sum; each shows where it is slow
    g01 = fig(r0, r1, f0); g12 = fig(r1, r2, f1); g02 = fig(r0, r2, f0);
  }
  // each sheet alone is only a faint screen; light comes where two are in step
  col += (uKind[0] * s0 * m0 * f0e + uKind[1] * s1 * m1 * f1e + uKind[2] * s2 * m2 * f2e) * 0.14 * (0.5 + uLevel);
  col += cA * m0 * m1 * f0e * (s0 * s1 * 3.6 * (0.08 + g01) + g01 * g01 * 0.2);
  col += cB * m1 * m2 * f1e * (s1 * s2 * 3.6 * (0.08 + g12) + g12 * g12 * 0.2);
  col += cC * m0 * m2 * f2e * (s0 * s2 * 3.6 * (0.08 + g02) + g02 * g02 * 0.2);
  col += uKind[4] * bump * (s0 * 1.2 + 0.25) * m0;
  // the hoops that hold the sheets
  col += (uKind[0] * exp(-abs(d0 - R0) * 85.0) * (0.3 + kick) + uKind[1] * exp(-abs(d1 - R1) * 85.0) * (0.3 + uCue) + uKind[2] * exp(-abs(d2 - R2) * 85.0) * 0.3) * 0.4 * (0.4 + uLevel);
  return screenOf(col * (0.6 + 0.6 * uLevel));
}
