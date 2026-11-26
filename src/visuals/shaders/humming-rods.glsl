// name: Humming rods
// a: Five rods
// b: One long wire
// what: Five steel rods stand on plain plinths before a plaster wall, shaken so fast that each is a vase of blur: pinched at its still places, bellied between, bright at both outlines, its soft shadow behind it; or one long wire runs across a dark room under a single wall lamp and swings into long bellies and bright knots.
// follows: Each kind of sound is one rod, or one set of bellies on the wire: the louder, the wider. The drone has few still places, texture many; keys add one to the phrase. The bands are the inner outlines, low notes soften shadows, the loop moves the lamp. A hit whips the shortest rod or runs along the wire; a cue swells and brightens.
vec3 hrLamp;    // where the lamp hangs

// How much of the time a swinging rod is over this place: x from its axis, A how far it swings, r half its thickness.
float hrOver(float x, float A, float r) {
  return (asin(clamp((x + r) / A, -1.0, 1.0)) - asin(clamp((x - r) / A, -1.0, 1.0))) / PI;
}
// A rod held at its foot and free at its tip, ringing with n - 1 still places: its swing at s (0 foot, 1 tip), and the slope of it.
vec2 hrMode(float n, float s) {
  if (n < 1.5) return vec2(s * s * (3.0 - s), 6.0 * s - 3.0 * s * s) * 0.5;
  float b = (n - 0.5) * PI, a = b * s - PI * 0.25;
  float e0 = exp(-b * s), e1 = (mod(n, 2.0) < 0.5 ? -1.0 : 1.0) * exp(-b * (1.0 - s));
  return 0.5 * vec2(e0 + 1.4142 * sin(a) + e1, b * (-e0 + 1.4142 * cos(a) + e1));
}
// Bare steel takes the hue a fire leaves on it: straw, bronze, violet, blue.
vec3 hrSteel(int k, float much) {
  vec3 c = uKind[k] * uKind[k];
  c /= max(dot(c, vec3(0.3, 0.59, 0.11)), 0.05);
  return mix(vec3(1.0, 0.97, 0.93), min(c, 2.0), much);
}
// The light a thin bright rod throws back when it lies along T: wide, and sharp.
vec2 hrShine(vec3 T, vec3 L, vec3 V) {
  T = normalize(T);
  float l = dot(T, L), h = dot(T, normalize(L + V)), w = max(1.0 - h * h, 0.0);
  return vec2(sqrt(max(1.0 - l * l, 0.0)), pow(w, mix(26.0, 90.0, uTone)));
}

// ---- a: five rods on plinths
const float hrZ = 1.0;                                                        // how far the row stands from the wall
vec4 hrRod[5];   // where it stands, the plinth's height, the rod's length, how far it swings
const float hrKnot[5] = float[5](2.0, 3.0, 6.0, 4.0, 1.0);
const float hrHalf = 0.2;                                                     // half a plinth

// How far rod k swings at height y, and the slope: x the swing, y the slope
vec2 hrSwing(int k, float y) {
  float s = sat((y - hrRod[k].y) / hrRod[k].z);
  vec2 m = hrMode(hrKnot[k], s);
  m *= m.x < 0.0 ? -1.0 : 1.0;
  if (k == 3 && uKeys > 0.002) {                                              // keys: one knot more
    vec2 m2 = hrMode(5.0, s);
    m = mix(m, m2 * (m2.x < 0.0 ? -1.0 : 1.0), 0.85 * uKeys);
  }
  return m * hrRod[k].w * vec2(1.0, 1.0 / hrRod[k].z);
}
float hrSpot(vec3 q) {                                                        // the lamp's beam on the wall
  vec2 d = (q.xy - vec2(hrLamp.x * 0.22 + 0.2, 1.75)) * vec2(0.62, 1.0);
  return 0.07 + 1.1 * exp(-dot(d, d) * mix(0.62, 0.36, uSpace));
}
vec3 hrRoom(vec2 p) {
  float lv[5] = float[5](uDrone, uPad, uTexture, uPhrase, sat(uHits * uHits + 0.4 * uCue));
  float hw = 0.5 * uRes.x / uRes.y;
  float zoom = clamp(0.8 / hw, 1.0, 1.6), tight = clamp(hw * zoom / 0.8, 0.55, 1.0);
  p = p * zoom + vec2(0.0, (zoom - 1.0) * 0.18);
  float pxs = zoom / uRes.y;
  // the five: pad, drone, texture, hit, phrase from left to right
  const float cx[5] = float[5](-1.18, -2.22, 0.0, 2.05, 0.86);
  const float ph[5] = float[5](0.46, 0.86, 1.0, 0.6, 0.72);
  const float rl[5] = float[5](2.3, 1.55, 1.42, 1.92, 1.05);
  const float am[5] = float[5](0.42, 0.34, 0.2, 0.34, 0.36);
  for (int k = 0; k < 5; k++) {
    float fk = float(k);
    float breathe = 0.93 + 0.07 * sin(uTime * (0.31 + 0.07 * fk) + fk * 2.1);   // the orbit turns slowly, and looks wider and narrower
    float a = am[k] * (0.04 + 0.8 * lv[k] * (0.65 + 0.5 * uEnergy) / (0.45 + 0.55 * lv[k]) + 1.2 * uCue * (1.0 - uCue));
    hrRod[k] = vec4(cx[k] * tight, ph[k], rl[k], a * breathe);
  }
  float yaw = -0.2 + 0.03 * sin(uTime * 0.041), f = 2.26;
  vec3 fw = vec3(sin(yaw), 0.0, -cos(yaw)), rt = vec3(cos(yaw), 0.0, sin(yaw));
  vec3 ro = vec3(0.0, 1.38, hrZ) - fw * 7.5 + rt * 0.05;
  float ys = p.y + 0.034;
  vec3 rd = fw + rt * p.x / f + vec3(0.0, ys / f, 0.0);
  hrLamp = vec3(-2.9 + 0.55 * sin(TAU * uLoop), 2.95 + 0.2 * cos(TAU * uLoop), 5.4);
  vec3 lampCol = mix(vec3(1.0, 0.80, 0.60), vec3(1.0, 0.93, 0.84), uTone) * (1.0 + 0.12 * uLevel + 0.15 * uMic);
  float soft = mix(0.03, 0.09, uSpace) + 0.03 * uLow;                                       // how soft a shadow's edge is on the wall

  // wall or floor
  float tw = -ro.z / rd.z, tf = rd.y < 0.0 ? -ro.y / rd.y : 1e5;
  bool isWall = tw < tf;
  vec3 q = ro + rd * min(tw, tf);
  vec3 L = hrLamp - q; float ld = length(L); L /= ld;
  vec3 alb; float ndl, dark = 0.0;
  float plaster = noise(q.xy * vec2(2.1, 2.9)) * 0.6 + noise(q.xy * vec2(7.0, 9.0) + 3.0) * 0.4;
  if (isWall) {
    ndl = L.z;
    float comb = noise(q.xy * vec2(26.0, 60.0) + plaster * 4.0);
    alb = vec3(0.52, 0.465, 0.405) * (0.88 + 0.15 * plaster + 0.06 * comb);
    vec2 m = mix(hrLamp.xy, q.xy, (hrLamp.z - hrZ) / hrLamp.z);                // the same ray where it passes the row
    for (int k = 0; k < 5; k++) {
      vec4 R = hrRod[k];
      float x = m.x - R.x;
      float sb = soft * 1.5 + 0.06 * uLow;
      if (m.y < R.y + sb && abs(x) < hrHalf + sb + 0.05) {
        vec2 sx = smoothstep(vec2(hrHalf - sb), vec2(hrHalf + sb), abs(x + vec2(0.05, -0.05) * uLow));
        dark = max(dark, (1.0 - 0.5 * (sx.x + sx.y)) * (1.0 - smoothstep(R.y - sb, R.y + sb, m.y)) * 0.8);
      }
      if (abs(x) > R.w + 1.8 * soft || m.y < R.y - 0.1 || m.y > R.y + R.z + soft) continue;
      vec2 sw = hrSwing(k, m.y);
      float A = sw.x + soft * 0.35;
      float c = hrOver(x, A, soft * 0.5) * 0.45 + hrOver(x, A + soft * 0.4, soft) * 0.275 + hrOver(x, A * 0.6, soft) * 0.12;
      dark = max(dark, (1.0 - exp(-c * 1.9)) * (1.0 - smoothstep(R.y + R.z - soft, R.y + R.z + soft, m.y)) * 0.8);
    }
    dark = max(dark, 0.35 * exp(-q.y * 9.0));
  } else {
    ndl = L.y * 1.5;
    alb = vec3(0.30, 0.275, 0.25) * (0.9 + 0.2 * noise(q.xz * 3.0));
    vec2 dir = hrLamp.xz - q.xz;
    dir += step(abs(dir), vec2(1e-4)) * 3e-4;
    for (int k = 0; k < 5; k++) {
      // where the way to the lamp passes over a plinth, seen from above
      vec2 o = q.xz - vec2(hrRod[k].x, hrZ);
      vec2 a = (-hrHalf * 1.02 - o) / dir, b = (hrHalf * 1.02 - o) / dir;
      vec2 lo = min(a, b), hi = max(a, b);
      float n = max(max(lo.x, lo.y), 0.0), e = min(min(hi.x, hi.y), hrRod[k].y / hrLamp.y);
      dark = max(dark, smoothstep(-0.006, 0.016 + 0.02 * n, e - n) * 0.85);
      vec2 g = max(abs(o) - hrHalf, 0.0);
      dark = max(dark, 0.7 * exp(-length(g) * 12.0));
    }
    dark = max(dark, 0.3 * exp(-q.z * 5.0));
  }
  float fall = 36.0 / (ld * ld);
  float spot = hrSpot(isWall ? q : vec3(q.x, -0.2, 0.0));
  vec3 fill = vec3(0.07, 0.085, 0.11);
  // a hit: the short rod throws its light on the wall behind it
  vec2 hp = q.xy - vec2(hrRod[4].x + 0.1, isWall ? hrRod[4].y + 0.75 : 0.9);
  vec3 struck = hrSteel(4, 0.5) * uHits * exp(-dot(hp, hp) * 2.6) * 0.42;
  vec3 col = alb * (lampCol * ndl * fall * spot * (1.0 - dark) + fill + struck);

  // plinths, then the rod on each
  for (int k = 0; k < 5; k++) {
    vec4 R = hrRod[k];
    vec3 c0 = vec3(R.x, 0.0, hrZ) - ro;
    float d = dot(c0, fw), w = pxs * d / f;                                   // a pixel's size there
    float sx = p.x * d / f - dot(c0, rt);                                     // sideways from the axis, in the axis's own plane
    float wy = ro.y + ys * d / f;
    if (abs(sx) > max(0.36, R.w * 1.2 + 0.08)) continue;
    vec3 base = vec3(R.x, R.y, hrZ);
    vec3 Lr = normalize(hrLamp - base);
    float lampAt = 30.0 / dot(hrLamp - base, hrLamp - base);
    float beam = 0.45 + 0.55 * hrSpot(base + vec3(0.0, 0.2, 0.0));
    if (wy < R.y + 0.2) {
      vec3 pa = vec3(0.60, 0.575, 0.54);
      // top, side, front
      float tt = (R.y - ro.y) / min(rd.y, -1e-4); vec3 h = ro + rd * tt;
      vec2 g = abs(h.xz - base.xz) - hrHalf;
      float cov = R.y < ro.y ? (1.0 - smoothstep(-w, w, g.x)) * (1.0 - smoothstep(-w * 2.0, w * 4.0, g.y)) * step(rd.y, 0.0) : 0.0;
      float foot = exp(-length(h.xz - base.xz) * 16.0);
      col = mix(col, pa * (lampCol * lampAt * beam * (Lr.y * 1.15 + 0.15) * (1.0 - 0.45 * foot) + fill * 1.6), cov);
      float side = ro.x < R.x ? -1.0 : 1.0;
      h = ro + rd * (R.x + side * hrHalf - ro.x) / (abs(rd.x) < 1e-5 ? 1e-5 : rd.x);
      cov = (1.0 - smoothstep(-w, w, abs(h.z - hrZ) - hrHalf - w)) * (1.0 - smoothstep(-w, w, h.y - R.y)) * smoothstep(-w, w, h.y);
      float grd = 0.55 + 0.45 * smoothstep(0.0, 0.6, h.y);
      col = mix(col, pa * (lampCol * lampAt * beam * sat(side * Lr.x * 1.1) * grd + fill * grd), cov);
      h = ro + rd * (hrZ + hrHalf - ro.z) / rd.z;
      cov = (1.0 - smoothstep(-w, w, abs(h.x - R.x) - hrHalf)) * (1.0 - smoothstep(-w, w, h.y - R.y)) * smoothstep(-w, w, h.y);
      grd = 0.6 + 0.4 * smoothstep(0.0, 0.7, h.y);
      col = mix(col, pa * (0.97 + 0.06 * noise(h.xy * 9.0 + R.x)) * (lampCol * lampAt * beam * Lr.z * grd * 0.92 + fill * grd), cov);
    }
    float H = R.y + R.z;
    if (wy > H + 0.12 || wy < R.y - 0.03 || abs(sx) > R.w + 0.05) continue;
    // the rod
    vec2 sw = hrSwing(k, wy);
    float A = max(sw.x, w), r = max(0.0105, w * 0.95);
    float u = clamp(sx / A, -1.0, 1.0), z = sqrt(1.0 - u * u);
    float bnd = band((0.08 + 0.2 * float(k)));
    float c1 = hrOver(sx, A, r);
    float in1 = 0.28 + 0.5 * bnd, in2 = 0.62 + 0.25 * uBands[2 + 2 * k];
    float c2 = hrOver(sx, max(A * in1, w), r), c3 = hrOver(sx, max(A * in2, w), r);
    float cover = c1 + (0.30 * c2 + 0.28 * c3) * sat(A / r * 0.2 - 0.1) ;
    float tipE = (H - ro.y) / d, tz = sqrt(max(hrRod[k].w * hrRod[k].w - sx * sx, 0.0));
    float nearHalf = (1.0 - smoothstep(-w, w, wy - H - tipE * tz)), farHalf = (1.0 - smoothstep(-w, w, wy - H + tipE * tz));
    float op = (1.0 - exp(-cover * 3.2)) * 0.97 * mix(1.0, 0.55 + 0.45 * u * u, sat(A / r * 0.15 - 0.2));
    op *= 0.5 * (nearHalf + farHalf) * smoothstep(R.y - w, R.y + w, wy);
    vec3 V = -normalize(rd), Lw = normalize(hrLamp - vec3(R.x, wy, hrZ));
    vec3 Tn = rt * (sw.y * u) - fw * (sw.y * z) + vec3(0.0, 1.0, 0.0), Tf = rt * (sw.y * u) + fw * (sw.y * z) + vec3(0.0, 1.0, 0.0);
    vec2 s1 = hrShine(Tn, Lw, V), s2 = hrShine(Tf, Lw, V);
    vec3 tint = hrSteel(k, 0.06 + 0.42 * sqrt(lv[k]));
    float strike = (k == 4 ? uHits * 1.3 : 0.0) + 0.8 * uCue;
    float lit = lampAt * beam;
    vec3 body = tint * (0.23 * (s1.x * s1.x + s2.x * s2.x) + 0.35 * sat(-u) * sat(-u) + 0.25 * strike);
    vec3 steel = lampCol * lit * (body + mix(tint, vec3(1.0), 0.6) * (1.1 + 1.2 * strike) * (s1.y + s2.y * 0.6)) + fill * tint;
    col = mix(col, steel, op);
    // a round foot that holds it
    float ch = (1.0 - smoothstep(-w, w, abs(sx) - 0.036 + 0.2 * max(wy - R.y, 0.0))) * (1.0 - smoothstep(-w, w, wy - R.y - 0.055)) * smoothstep(-w, w, wy - R.y + 0.012);
    float cu = sx / 0.036;
    col = mix(col, vec3(0.05, 0.048, 0.045) + lampCol * lampAt * 0.5 * exp(-(cu + 0.35) * (cu + 0.35) * 14.0), ch);
    // the ring the tip draws in the air
    float ring = min(abs(wy - H - tipE * tz), abs(wy - H + tipE * tz));
    col = mix(col, tint * lampCol * lampAt * beam * 1.0, (1.0 - smoothstep(0.0, r * 0.4 + w, ring)) * (0.28 + 0.25 * sat(-u)) * step(abs(sx), hrRod[k].w) * sat(tz / hrRod[k].w * 3.0));
  }
  return screenOf(col * 1.5);
}

// ---- b: one wire in a dark room
// each kind has its own stretch of the wire: where it begins, how long one belly is, and how far it swings
const vec3 hrPart[4] = vec3[4](vec3(0.02, 0.18, 0.14), vec3(0.20, 0.08, 0.075), vec3(0.56, 0.05, 0.048), vec3(0.36, 0.0667, 0.06));
// Where the wire hangs, how near it is, and how far along it one is, at x on the screen: the line runs away to the right
vec3 hrLine(float x) {
  float S = max(1.0 - 0.55 * x, 0.2);
  return vec3(-0.035 + 0.15 * x + 0.03 * x * x, S, 0.2 * (x + 1.25) / S);
}
float hrAmp[4];
int hrAt(float u) { return u < 0.2 ? 0 : u < 0.36 ? 1 : u < 0.56 ? 3 : 2; }
vec2 hrBelly(int k, float u) {                                                // how far it swings there, and its slope
  float a = PI * (u - hrPart[k].x) / hrPart[k].y, s = sin(a), g = PI / hrPart[k].y;
  vec2 b = vec2(abs(s), g * cos(a) * (s < 0.0 ? -1.0 : 1.0) * 0.36);
  if (k == 3) {                                                               // keys: one knot more
    a *= 4.0 / 3.0; s = sin(a);
    b = mix(b, vec2(abs(s), g * 1.333 * cos(a) * (s < 0.0 ? -1.0 : 1.0) * 0.36), 0.85 * uKeys);
  }
  return b * hrAmp[k];
}
vec3 hrWire(vec2 p) {
  float lv[4] = float[4](uDrone, uPad, uTexture, uPhrase);
  for (int k = 0; k < 4; k++) {
    float fk = float(k);
    hrAmp[k] = hrPart[k].z * ((0.025 + 0.72 * lv[k] * (0.8 + 0.4 * uEnergy) / (0.35 + 0.65 * lv[k])) * (0.92 + 0.08 * sin(uTime * (0.27 + 0.06 * fk) + fk * 1.9)) + 1.6 * uCue * (1.0 - uCue));
  }
  float hw = 0.5 * uRes.x / uRes.y, zoom = clamp(0.8 / hw, 1.0, 1.5);
  p *= vec2(clamp(0.8 / hw, 1.0, 2.6), zoom);
  float px = zoom / uRes.y;
  float la = TAU * uLoop;
  hrLamp = normalize(vec3(-0.55 + 0.3 * sin(la), 0.8, 0.55 + 0.15 * cos(la)));
  vec3 lampCol = mix(vec3(1.0, 0.74, 0.5), vec3(1.0, 0.92, 0.82), uTone);
  // the room: a dark wall with a lamp hung close to it, shining down
  vec2 d = vec2(p.x - 0.22 - 0.05 * sin(la) - 0.03 * sin(uTime * 0.05), 0.72 - p.y);
  float near2 = mix(0.03, 0.07, uSpace), dy = max(d.y, 0.0), d3 = d.x * d.x * 0.75 + near2 + dy * dy, ca = dy / sqrt(d3);
  float pool = (0.46 * ca * ca * smoothstep(0.62, 0.97, ca) + 0.012) / (d3 + 0.12) * (1.0 + 0.15 * uMic);
  float plaster = noise(p * vec2(5.0, 7.0)) * 0.6 + noise(p * vec2(19.0, 27.0) + 3.0) * 0.4;
  vec3 wall = vec3(0.15, 0.118, 0.096) * (0.85 + 0.3 * plaster);
  // the wire's shadow: lower, to the right, wider and softer
  vec2 q = (p - vec2(0.05 - 0.03 * sin(la), -0.17)) / 1.12;
  vec3 ln = hrLine(q.x);
  float dark = 0.0, sv = q.y - ln.x, so = mix(0.010, 0.026, uSpace) + 0.012 * uLow;
  int ks = hrAt(ln.z);
  float As = hrBelly(ks, ln.z).x * ln.y + so * 0.5;
  dark = 0.6 * (hrOver(sv, As, so * 0.6) + hrOver(sv, As + so * 0.5, so) * 0.7) ;
  wall *= lampCol * pool * (0.85 + 0.25 * uLevel) * (1.0 - 0.75 * (1.0 - exp(-dark * 2.2))) ;
  // and a dark floor that holds a little of the light
  float fy = -0.335 - 0.035 * p.x - p.y;
  vec2 d2 = vec2(d.x, fy - 0.07);
  vec3 ground = vec3(0.075, 0.056, 0.045) * lampCol * (0.06 + exp(-dot(d2, d2) * 7.0)) * (0.6 + 0.5 * noise(vec2(p.x * 2.0 + fy * 1.2, fy * 34.0)));
  ground *= 0.75 - 0.5 * exp(-max(fy, 0.0) * 22.0);
  float edge = smoothstep(-px * 1.5, px * 1.5, fy);
  vec3 col = mix(wall * (1.0 - 0.45 * exp(-max(-fy, 0.0) * 11.0)), ground, edge) + vec3(0.005, 0.006, 0.009);
  // the wire, as far as it swings for each kind of sound
  ln = hrLine(p.x);
  float tilt = 0.15 + 0.06 * p.x, v = (p.y - ln.x) / sqrt(1.0 + tilt * tilt), u = ln.z, S = ln.y;
  if (abs(v) < 0.5) {
    float r = max(0.0032 * S, px);
    float light = 0.5 + 0.7 * exp(-(p.x - 0.2) * (p.x - 0.2) * 2.2) + 0.15 * uMic;
    vec3 m = u < 1.0 ? (piece(vec2(u, 0.3)).rgb + piece(vec2(u, 0.7)).rgb) * 0.5 : vec3(0.0);
    float uh = 0.12 + 0.95 * (1.0 - uHits), hg = exp(-(u - uh) * (u - uh) * 420.0);  // a hit runs along it
    int k = hrAt(u);
    vec2 b = hrBelly(k, u);
    float run = uHits * hg;
    b.x = (b.x + 0.065 * run) * S;
    float A = max(b.x, px);
    if (abs(v) < A + r) {
      float w = clamp(v / A, -1.0, 1.0), z = sqrt(1.0 - w * w);
      float b1 = uBands[1 + k * 3];
      float cover = hrOver(v, A, r) + (0.3 * hrOver(v, max(A * (0.3 + 0.5 * b1), px), r) + 0.25 * hrOver(v, max(A * (0.62 + 0.2 * uBands[2 + k * 3]), px), r)) * sat(A / r * 0.2 - 0.1);
      float op = (1.0 - exp(-cover * 2.4)) * 0.97 * mix(1.0, 0.25 + 0.75 * w * w, sat(A / r * 0.15 - 0.2));
      vec3 V = normalize(vec3(-0.2, 0.0, 1.0));
      vec2 s1 = hrShine(vec3(1.0, b.y * w + 0.06, b.y * z - 0.25), hrLamp, V), s2 = hrShine(vec3(1.0, b.y * w + 0.06, -b.y * z - 0.25), hrLamp, V);
      vec3 tint = mix(hrSteel(k, 0.06 + 0.34 * sqrt(lv[k])), hrSteel(4, 0.5), sat(run * 1.3));
      float strike = 2.0 * run + uCue;
      float knot = exp(-A * A / (r * r * 5.0));
      vec3 steel = lampCol * light * (tint * (0.5 * (s1.x * s1.x + s2.x * s2.x) + 1.2 * sat(w) * sat(w) + 0.5 * strike) * (1.0 - 0.5 * knot) + mix(tint, vec3(1.0), 0.6) * (2.0 + strike) * (s1.y + 0.6 * s2.y) * (1.0 - 0.6 * knot)) + m * 0.45;
      col = mix(col, steel, op);
    }
  }
  return screenOf(col * 1.5);
}

vec3 render(vec2 p) {
  return uVar < 0.5 ? hrRoom(p) : hrWire(p);
}
