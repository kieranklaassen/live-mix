// name: Juggled
// a: Behind the wall
// b: Night fountain
// what: A long low whitewashed wall under a pale sky, a bare tree far right, and behind it unseen hands juggling: painted balls rise and fall in crossing arcs, each with a trail of dots where it was; or looking down a round brick shaft at night, where pale balls fountain up from a small lamp, turn just under us and fall back to points.
// follows: Each kind is a juggler of its own: louder brings in more of its balls, and the bands swell them. The piece tints the sky or the bricks, the pad the foot of the sky. A hit lights one ball at its top; a cue passes a soft light along the wall, or sends one up the shaft. The low band warms the sky or feeds the lamp, keys chalk an arc or brighten the rims.
// own: 0 moonlit night at -1, red dusk at 1, or a cold lamp, a whitewashed shaft by day; 1 few great balls at -1, many small ones at 1; 2 seen straight on at -1, along the wall or from close to one side at 1; 3 arcs tall and narrow at -1, low and wide at 1, or turning near the eye, farther down; 4 the wall a kerb at -1, high at 1, or the shaft shallow, square; 5 the wall bare earth at -1, washed blue at 1, or the balls sharp, very soft; 6 snow lying and falling at -1, mountains behind at 1, or the shaft of smooth ice, of painted tiles, and the balls dyed; 7 hoops in place of balls at -1, a great sun or moon behind at 1, or looking up to a round of sky in place of the lamp
// For each kind of sound: where its hands are, how many balls, how long a flight, how far apart the hands, how big a ball.
const float JG_AT[5] = float[5](-0.73, -0.37, -0.05, 0.27, 0.53);
const float JG_N[5] = float[5](3.0, 6.0, 7.0, 7.0, 7.0);
const float JG_T[5] = float[5](4.7, 3.9, 3.4, 5.1, 5.7);
const float JG_WIDE[5] = float[5](0.15, 0.1, 0.17, 0.15, 0.19);
const float JG_BIG[5] = float[5](0.040, 0.031, 0.0205, 0.028, 0.0235);
#define JG_SNOW max(-uOwn[6], 0.0)
#define JG_HIGH max(uOwn[6], 0.0)
#define JG_HOOP max(-uOwn[7], 0.0)
#define JG_DISC max(uOwn[7], 0.0)
const float JG_FALL = 0.234;       // slower than on the moon
const float JG_HZ = -0.315;        // how high the eye is
float jgPx, jgRake, jgNight, jgDusk;
vec3 jgSunC;
float jgIn(float d, float e) { return sat(0.5 - d / max(e, 1e-5)); } // 1 inside an edge, e wide
float jgDown(float a, float b, float x) { return 1.0 - smoothstep(a, b, x); }
float jgMore(int i) { return sat((i == 0 ? uDrone : i == 1 ? uPad : i == 2 ? uTexture : i == 3 ? uPhrase : uHits) * (0.75 + 0.75 * uEnergy)); }
float jgGrey(vec3 c) { return dot(c, vec3(0.3, 0.59, 0.11)); }
// The paint of one kind's balls.
vec3 jgPaint(int i, float b) {
  vec3 k = uKind[i]; float g = max(jgGrey(k), 0.05);
  k = clamp(mix(vec3(g), k, 1.1) * mix(1.0, 0.45 / g, 0.6), 0.0, 1.0);
  return mix(k, vec3(0.80, 0.66, 0.50), 0.12 + 0.2 * fract(b * 0.618));
}
vec3 jgHour(vec3 day, vec3 night, vec3 dusk) { return mix(mix(day, night, jgNight), dusk, jgDusk); }
// A hoop's round, v as of a ball, l its length.
vec2 jgRound(vec2 v, float l) { return mix(v, v / max(l, 1e-3) * clamp((l - 0.5 - 0.35 * JG_HOOP) / (0.5 - 0.35 * JG_HOOP), -1.0, 1.0), sat(JG_HOOP * 3.0)); }

// ---- a ----
// A bare tree: q stands on its root, about 1 tall. Below 0 is wood; lean is which side of a limb.
float jgTree(vec2 q, out float lean) {
  float d = 1e3, w = 0.024, sc = 1.0, side = 1.0, g = 0.37;
  lean = 0.0;
  for (int i = 0; i < 9; i++) {
    float l = i == 0 ? 0.27 : 0.235, y = clamp(q.y, 0.0, l), h = y / l, x = q.x - 0.14 * side * h * (1.0 - h), yy = q.y - y;
    float e = (sqrt(x * x + yy * yy) - w * (1.0 - 0.26 * h)) * sc;
    if (e < d) { d = e; lean = x / w; }
    q.y -= l * (i == 0 ? 1.0 : 0.9);
    side = q.x > 0.0 ? 1.0 : -1.0;
    g = fract(g * 3.7 + 0.21 * side + 0.13);
    float a = side * (0.20 + 0.36 * g) + 0.07;        // which way the next limb leans, and how long it is
    q = vec2(q.x - a * q.y, a * q.x + q.y) / sqrt(1.0 + a * a);
    float k = 0.76 + 0.13 * fract(g * 5.3);
    q /= k; sc *= k; w *= 0.80;
  }
  return d;
}
vec3 jgSky(vec2 p) {
  float h = sat((p.y + 0.24) / 0.74);
  vec3 top = jgHour(vec3(0.43, 0.60, 0.69), vec3(0.025, 0.045, 0.11), vec3(0.22, 0.18, 0.34));
  vec3 mid = jgHour(vec3(0.79, 0.85, 0.84), vec3(0.075, 0.13, 0.24), vec3(0.70, 0.35, 0.35));
  vec3 low = jgHour(vec3(1.0, 0.87, 0.735), vec3(0.21, 0.29, 0.40), vec3(0.99, 0.64, 0.28));
  low *= mix(vec3(1.0), 0.62 + 0.7 * uKind[1], 0.75 * jgMore(1));        // the pad colours the foot of it
  vec3 c = mix(low, mix(mid, top, smoothstep(0.3, 1.1, h)), smoothstep(-0.1, 0.64 + 0.03 * sin(uTime * 0.23) + 0.12 * uLow, h));
  if (JG_SNOW > 0.0) c = mix(c, jgHour(vec3(0.80, 0.83, 0.85), vec3(0.13, 0.16, 0.22), vec3(0.80, 0.66, 0.66)), JG_SNOW * (0.85 - 0.3 * h));
  // stars at night
  vec2 sc = p * 42.0, si = floor(sc);
  float sh = hash21(si + 7.0);
  c += jgNight * 0.55 * smoothstep(0.8, 1.0, sh) * h * jgDown(0.02, 0.07 + 42.0 * jgPx, length(fract(sc) - 0.3 - 0.4 * vec2(fract(sh * 57.0), fract(sh * 91.0))));
  // thin high cloud, drawn out; the piece tints it
  vec2 q = vec2(p.x * 1.1 + 0.5 * p.y + uTravel * 0.006 + uTime * 0.0015, p.y * 5.0 - 0.7 * p.x);
  float n = 0.66 * noise(q * 1.6) + 0.34 * noise(q * vec2(3.6, 6.5) + 7.0);
  float veil = smoothstep(0.42, 0.9, n) * smoothstep(0.0, 0.35, h);
  c = mix(c, jgHour(vec3(0.97, 0.95, 0.90), vec3(0.2, 0.25, 0.34), vec3(0.98, 0.66, 0.5)), veil * 0.4);
  vec4 m = piece(vec2(sat(p.x / 1.9 + 0.5 + 0.22 * (n - 0.5)), sat(1.0 - h + 0.3 * (n - 0.5))));
  float now = p.x / 1.9 + 0.5 - uLoop; now -= floor(now + 0.5);
  c = mix(c, c * (0.5 + 0.8 * mix(m.rgb / max(m.a, 0.05), vec3(0.85, 0.62, 0.48), 0.25)), 0.8 * sat(m.a * (0.4 + 0.7 * n) * (0.4 + 0.5 * uEnergy) * (0.8 + 0.5 * exp(-now * now * 30.0))));
  if (JG_DISC > 0.0) {
    vec2 d = p - vec2(0.10, 0.02 + 0.16 * max(uOwn[4], 0.0));
    float l = length(d), r = 0.06 + 0.30 * JG_DISC, n2 = noise(d * 9.0 + 40.0) * 0.6 + 0.4 * noise(d * 23.0 + 9.0);
    vec3 face = jgHour(vec3(1.0, 0.95, 0.82), vec3(0.86, 0.87, 0.84) * (1.0 - 0.35 * smoothstep(0.4, 0.75, n2)), mix(vec3(0.95, 0.30, 0.16), vec3(1.0, 0.62, 0.26), sat(0.5 + d.y / r * 0.6)));
    face = mix(face, face * (0.45 + 1.1 * m.rgb / max(m.a, 0.05)), 0.75 * sat(m.a * (0.5 + 0.6 * uEnergy)));
    c += face * 0.12 * (1.0 + 0.6 * uLow) * exp(-max(l - r, 0.0) * 7.0) * sat(JG_DISC * 4.0);
    c = mix(c, face * (0.96 + 0.08 * uPad), jgIn(l - r, 1.5 * jgPx) * sat(JG_DISC * 4.0) * (0.94 - 0.3 * veil));
  }
  if (JG_HIGH > 0.0) for (int k = 0; k < 3; k++) {
    float f = float(k), x = p.x * (1.5 + 0.8 * f) + 11.0 * f + 33.0;
    float y = -0.3 + JG_HIGH * (0.56 - 0.15 * f) * (0.55 * noise(vec2(x, f)) + 0.32 * (1.0 - abs(2.0 * noise(vec2(x * 2.3, f + 3.0)) - 1.0)) + 0.13 * noise(vec2(x * 9.0, f)) + 0.16);
    vec3 rock = jgHour(vec3(0.50, 0.60, 0.69), vec3(0.08, 0.12, 0.21), vec3(0.50, 0.27, 0.36)) * (1.08 - 0.24 * f) * (0.93 + 0.12 * noise(p * vec2(23.0, 37.0) + f * 5.0));
    rock = mix(rock, low * 0.9 + 0.05, (0.75 - 0.2 * f) * jgDown(-0.02, 0.3 - 0.07 * f, p.y + 0.22));
    c = mix(c, rock, jgIn(p.y - y, 1.5 * jgPx));
  }
  return c;
}
// One ball in daylight, v from its middle and within 1: two halves, one a little paler.
vec3 jgBall(vec2 v, vec3 paint, float spin, vec3 sky, float lit) {
  vec3 n = vec3(v, sqrt(max(0.0, 1.0 - dot(v, v))));
  vec3 alb = mix(paint, mix(paint, vec3(0.95, 0.90, 0.80), 0.62), smoothstep(-0.05, 0.05, dot(n, normalize(vec3(cos(spin), sin(spin), 0.5))) - 0.25));
  float sun = smoothstep(-0.15, 1.0, dot(n, vec3(-0.64, 0.57, 0.515)));
  vec3 c = alb * (sky * (0.36 + 0.14 * n.y) + jgSunC * (vec3(0.17, 0.12, 0.07) * sat(0.3 - n.y) + sun * (0.74 + 0.2 * uTone) * (1.0 + 1.1 * jgNight)));
  return mix(c, vec3(1.0, 0.95, 0.78), lit * (0.55 + 0.4 * n.z));
}
// The wall and the ground before it. u is measured on the wall, along and up; s is how near it is here.
vec3 jgWall(vec2 p, vec2 u, float s, float top, float foot) {
  float px = jgPx / s, h = sat((u.y - foot) / (top - foot));
  vec3 gr = vec3(0.0);
  float grain = noise(u.y < foot ? vec2(1.7, 13.0) * vec2(p.x, 0.12) / max(JG_HZ - p.y, 0.01) : u * vec2(60.0, 240.0));
  if (u.y < foot + 0.01) {
    float gn = grain;
    gr = mix(mix(vec3(0.80, 0.72, 0.60), vec3(0.93, 0.865, 0.755), gn), vec3(0.95, 0.965, 0.99) * (0.93 + 0.08 * gn), JG_SNOW) * (1.0 - 0.38 * exp(-max(foot - u.y, 0.0) * 70.0));
  }
  if (u.y > foot - 0.01) {
  float l0 = noise(u * vec2(22.0, 25.0)), l = 0.6 * l0 + 0.4 * noise(u * vec2(47.0, 53.0) + 5.0), l1 = noise(u * vec2(22.0, 25.0) + vec2(-0.12, 0.12));
  float part = noise(u * vec2(6.0, 10.0) + 2.0);
  vec3 c = mix(vec3(0.905, 0.875, 0.82), vec3(0.975, 0.96, 0.92), l) * (0.985 + 0.03 * grain);
  c *= mix(mix(vec3(1.0), vec3(0.78, 0.55, 0.40), sat(-uOwn[5])), vec3(0.22, 0.36, 0.62), sat(uOwn[5]));
  // rain has drawn it down, and low on it the wash has come off
  float run = (0.5 + 0.5 * sin(u.x * 173.0 + 4.0 * sin(u.x * 41.0 + u.y * 5.0))) * (0.4 + part);
  c *= 1.0 - 0.15 * smoothstep(0.4, 0.75, part) * smoothstep(0.3, 1.2, run) * smoothstep(0.15, 1.0, h);
  float fl = 0.56 * part + 0.44 * l;
  c = mix(c, vec3(0.80, 0.68, 0.54), 0.62 * smoothstep(0.66, 0.68, fl + 0.16 * (1.0 - h) - 0.06));
  float dado = jgDown(0.285, 0.30, h + 0.03 * (l - 0.5));
  c = mix(c, mix(mix(vec3(0.43, 0.52, 0.60), vec3(0.93, 0.90, 0.84), sat(-uOwn[5])), vec3(0.90, 0.83, 0.72), sat(uOwn[5])) * (0.82 + 0.35 * l), dado * (0.85 - 0.6 * smoothstep(0.5, 0.64, fl)));
  c *= (1.0 + (0.9 * (l0 - l1) + 0.12 * (grain - 0.5)) * (0.35 + 0.4 * uTone) * jgDown(0.006, 0.02, px)) * (0.94 + 0.06 * h);
  // clay tiles along the top, and their shade
  float cop = top - u.y, ti = u.x / 0.023, tf = fract(ti) - 0.5, lip = 0.0145 + 0.0028 * cos(TAU * ti) * sat(1.0 - px * 150.0);
  if (JG_SNOW > 0.0) lip += JG_SNOW * (0.012 + 0.022 * noise(vec2(u.x * 9.0, 1.0)));
  vec3 clay = mix(vec3(0.70, 0.44, 0.31), vec3(0.83, 0.60, 0.44), hash11(mod(floor(ti), 97.0)));
  clay *= mix(0.92, 0.66 + 0.5 * sqrt(max(0.0, 1.0 - 4.0 * tf * tf)) - 0.45 * tf, sat(1.0 - px * 90.0));
  if (JG_SNOW > 0.0) clay = mix(clay, vec3(0.96, 0.975, 1.0), JG_SNOW);
  c *= 1.0 - 0.5 * jgIn(cop - lip - 0.016 - 0.004 * (l - 0.5), 0.010 - 0.006 * uTone);
  c = mix(c, clay * (0.8 + 0.3 * jgDown(0.0, lip, cop)), jgIn(cop - lip, 1.5 * px));
  gr = mix(c, gr, jgIn((u.y - foot - 0.003 * (l - 0.5)) * s, 1.5 * jgPx));
  }
  return gr * jgSunC;
}
vec3 jgDay(vec2 p) {
  // step back where the arcs would leave the top
  float back = 1.0 + 0.3 * sat(-uOwn[3]) + 0.17 * sat(uOwn[4]) + 0.2 * sat(-uOwn[2]);
  p.y = (p.y + 0.5) * back - 0.5; p.x *= back; jgPx *= back;
  jgRake = 0.44 + 0.44 * uOwn[2];
  jgSunC = jgHour(vec3(1.06, 1.015, 0.93), vec3(0.33, 0.42, 0.60), vec3(1.13, 0.80, 0.60));
  float s = max(1.0 - jgRake * p.x, 0.03);
  vec2 u = vec2(p.x / s, (p.y - JG_HZ) / s);
  float top = 0.125 + (uOwn[4] > 0.0 ? 0.2 : 0.075) * uOwn[4], foot = -0.085, wallIn = jgIn((u.y - top) * s, 1.5 * jgPx);
  vec3 col = vec3(0.0), air = jgHour(vec3(0.80, 0.80, 0.76), vec3(0.11, 0.15, 0.24), vec3(0.72, 0.5, 0.44));
  if (wallIn < 1.0) {
    col = jgSky(p);
    col += vec3(0.16, 0.10, 0.04) * uMic * exp(-12.0 * max(u.y - top, 0.0));
    // a day moon
    vec2 mq = p - vec2(-0.27, 0.335);
    float moon = jgIn(length(mq) - 0.017, jgPx * 1.5) * (1.0 - jgIn(length(mq - vec2(0.009, 0.004)) - 0.0185, 0.012));
    col = mix(col, vec3(0.99, 0.97, 0.90), moon * mix(0.6, 1.0, jgNight) * (1.0 - sat(4.0 * JG_DISC)));
    // the tree, far off behind the wall
    const float size = 0.46 * (1.0 + 0.5 * JG_SNOW);
    vec2 tq = (p - vec2(0.70 - 0.12 * JG_SNOW - 1.36 * JG_HIGH, -0.275)) / size;
    if (abs(tq.x) < 0.75 && tq.y < 1.25) {
      float lean, d = jgTree(tq, lean) * size;
      vec3 bark = mix(vec3(0.27, 0.215, 0.20), vec3(0.47, 0.40, 0.35), sat(0.5 - 0.5 * lean)) * mix(1.0, 0.3, jgNight);
      col = mix(col, bark, jgIn(d, 1.5 * jgPx) * 0.9);
    }
  }
  float arcW = exp2(0.75 * uOwn[3]), arcH = exp2(-0.5 * uOwn[3]), many = exp2(0.75 * uOwn[1]);
  float hands = min(0.02, top - 0.1) + 0.6 * max(top - 0.125, 0.0);
  float grow = JG_FALL * 0.125 * arcH;
  // a hit lights the ball that is at the top, farthest off
  float per = JG_N[4] - 1.6, hb = uTime / JG_T[4] * per, hq = floor(0.5 * per - fract(hb)), glowing = 0.0;
  for (int k = 0; k < 2; k++) {
    float q = hq + float(k), f = (fract(hb) + q) / per, hand = mod(floor(hb) - q, 2.0) < 0.5 ? 1.0 : -1.0;
    vec2 d = u - vec2(JG_AT[4] / (1.0 - jgRake * JG_AT[4]) + hand * JG_WIDE[4] * arcW * (0.5 - 1.5 * f), hands + grow * JG_T[4] * JG_T[4] * 4.0 * f * (1.0 - f));
    glowing += jgDown(0.2, 0.8, abs(f - 0.5) * per) * (0.85 * exp(-dot(d, d) * 260.0) + 0.5 * exp(-length(d) * 6.5));
  }
  col = mix(col, vec3(1.0, 0.85, 0.5), uHits * (1.0 - wallIn) * sat(glowing));
  if (uKeys > 0.003) {                                  // keys chalk the tops of the arcs
    float a = JG_WIDE[3] * arcW, H = grow * JG_T[3] * JG_T[3], du = u.x - JG_AT[3] / (1.0 - jgRake * JG_AT[3]);
    vec2 f = (0.5 * a + vec2(-du, du)) / (1.5 * a), st = 4.0 * H * (1.0 - 2.0 * f) / (1.5 * a), gap = abs(u.y - hands - 4.0 * H * f * (1.0 - f)) / sqrt(1.0 + st * st);
    vec2 ch = (1.0 - smoothstep(0.002, 0.0055, gap)) * (1.0 - smoothstep(0.16, 0.36, abs(f - 0.5)));
    col = mix(col, vec3(1.0, 0.99, 0.95), sat(uKeys * 1.5) * max(ch.x, ch.y) * (0.45 + 0.55 * hash21(floor(p * 300.0))));
  }
  if (wallIn > 0.0) {
    vec3 w = jgWall(p, u, s, top, foot);
    // the shade of a house out of the picture
    float sun = smoothstep(-0.012, 0.012, u.x + 0.60 + 0.03 * cos(TAU * uLoop) - (u.y > foot ? 0.9 : 2.4) * (u.y - foot));
    w *= mix(vec3(0.56, 0.64, 0.76), vec3(1.0), sun);
    // a cue goes along it as a soft light
    float cd = (p.x - mix(-1.2, 1.2, 1.0 - uCue)) * 2.6;
    w += vec3(1.0, 0.72, 0.34) * (0.3 - 0.12 * jgNight) * smoothstep(0.0, 0.3, uCue) * exp(-cd * cd) * smoothstep(foot - 0.05, foot + 0.1, u.y) * (1.0 - 0.5 * w);
    // the shadows of the balls this side of it
    float a = JG_WIDE[0] * arcW, H = grow * JG_T[0] * JG_T[0], du = u.x - JG_AT[0] / (1.0 - jgRake * JG_AT[0]), beat = uTime / JG_T[0] * (JG_N[0] - 1.6);
    for (int q = 0; q < 3; q++) {
      float f = (fract(beat) + float(q)) / (JG_N[0] - 1.6), id = floor(beat) - float(q), hand = mod(id, 2.0) < 0.5 ? a : -a;
      vec2 sd = vec2(du - mix(0.5 * hand, -hand, f), u.y + 0.24 - 4.0 * H * f * (1.0 - f)) - vec2(0.075, -0.06);
      w *= 1.0 - 0.4 * smoothstep(0.0, 1.0, jgMore(0) * 5.2 * many - mod(id, 3.0) * 0.9) * sun * jgIn(f - 1.0, 0.02) * jgIn((foot - u.y) * s, jgPx) * (1.0 - smoothstep(0.6, 1.35, length(sd * vec2(1.1, 1.0)) * many / JG_BIG[0]));
    }
    col = mix(col, w, wallIn);
  }
  for (int o = 1; o <= 5; o++) {
    int i = o == 5 ? 0 : o;                               // the one this side of the wall comes last
    float s0 = 1.0 - jgRake * JG_AT[i], u0 = JG_AT[i] / s0, du0 = u.x - u0, a = JG_WIDE[i] * arcW, R = JG_BIG[i] / many, T = JG_T[i], H = grow * T * T;
    float up0 = u.y - (i == 0 ? -0.24 : hands);
    float n = JG_N[i], dw = 1.6, air1 = 1.0 / (n - dw), pace = uTime / T, beat = floor(pace / air1), fr = fract(pace / air1), lv = jgMore(i), turned = mod(n, 2.0) < 0.5 ? 1.0 : -1.0, trail = min(0.27, 0.04 + dw * air1);
    float m3 = R * (1.35 * max(1.0, 1.0 / s0) + jgRake), mt = 1.5 * R * 0.22 / s0 + 2.0 * jgPx;
    if ((i == 0 || wallIn < 1.0) && abs(du0) < a + R * 3.5 + (i == 0 ? 0.1 : 0.0) && up0 < H + R * 3.5) {
      // which of its balls can be at this height, going up or coming down
      float flo = 0.5 - 0.5 * sqrt(max(1.0 - (up0 - m3) / H, 0.0)), inn = 0.5 - 0.5 * sqrt(max(1.0 - (up0 + m3) / H, 0.0));
      int last = int(min(floor((1.0 - flo + trail) / air1 - fr), n - 1.0)), skip = int(floor((inn + trail) / air1 - fr)), on = int(ceil((1.0 - inn) / air1 - fr));
      for (int q = int(max(ceil(flo / air1 - fr), 0.0)); q <= last; q++) {
        if (q > skip && q < on) q = on;
        if (q > last) break;
        float id = beat - float(q), f = (fr + float(q)) * air1, hand = mod(id, 2.0) < 0.5 ? a : -a, from = hand * (turned > 0.0 ? 0.25 : 0.5), to = hand * (turned > 0.0 ? 1.3 : -1.0), f1 = max(f - trail, 0.0);
        // where it is, and where it was at even steps of time
        float x0 = mix(from, to, f1), x1 = mix(from, to, f);
        if (abs(du0 - 0.5 * (x0 + x1)) < 0.5 * abs(x1 - x0) + m3) {
          float y0 = 4.0 * H * f1 * (1.0 - f1), y1 = 4.0 * H * f * (1.0 - f), fj = mod(id, n);
          bool ball = max(abs(du0 - x1), abs(up0 - y1)) < m3 && f < 1.0;
          bool dots = up0 > min(y0, y1) - mt && up0 < (f1 < 0.5 && f > 0.5 ? H : max(y0, y1)) + mt;
          if (ball || dots) {
            float lit = i == 4 ? (1.0 - smoothstep(0.45, 1.1, abs(f - 0.5) * n)) * uHits : 0.0;
            float see = max(lit, smoothstep(0.0, 1.0, lv * (n + 1.5) * many * 1.15 - fj * 0.9));
            if (i >= 3 && fj < 0.5 || i == 3 && abs(fj - 3.0) < 0.5) see = 1.0;
            float r = R * (0.55 + 0.45 * see) * smoothstep(0.0, 0.25, see) * (0.86 + 0.4 * band((fj + 0.5) / n));
            vec3 paint = i == 3 && mod(fj, 3.0) < 0.5 && fj < 5.0 ? mix(jgPaint(3, 0.0), vec3(0.80, 0.20, 0.11), 0.85) : jgPaint(i, fj);
            if (dots && see > 0.01) {
              float pitch = trail / 7.0, kc = (f - (du0 - from) / (to - from)) / pitch, kw = 0.5 + mt / (abs(to - from) * pitch);
              int k1 = int(clamp(floor(kc - kw), 1.0, 8.0));
              for (int k = int(clamp(ceil(kc + kw), 0.0, 7.0)); k >= k1; k--) {
                float fk = f - float(k) * pitch;
                float du = mix(from, to, fk), w = max(1.0 / s0 + jgRake * du, 0.05);
                vec2 d = p - vec2(u0 + du, 4.0 * H * fk * (1.0 - fk) - up0 + u.y) / w - vec2(0.0, JG_HZ);
                float in1 = jgIn(length(d) - r * 0.22 / w, 1.5 * jgPx) * (i == 0 ? 1.0 : 1.0 - wallIn);
                col = mix(col, mix(paint * 0.8, air, 0.1), in1 * step(0.0, fk) * step(fk, 1.0) * see * (0.85 - 0.09 * float(k)));
              }
            }
            if (ball && see > 0.01) {
              float w = max(1.0 / s0 + jgRake * x1, 0.05), rr = max(r / w, 1e-4), over = i == 0 ? 1.0 : 1.0 - wallIn;
              vec2 d = p - vec2(u0 + x1, y1 - up0 + u.y) / w - vec2(0.0, JG_HZ);
              float l = length(d);
              if (JG_HOOP > 0.0) { over *= 1.0 - jgIn(l - 0.7 * JG_HOOP * rr, 1.5 * jgPx) * sat(JG_HOOP * 3.0); d = jgRound(d / rr, l / rr) * rr; }
              if (l < rr + 2.0 * jgPx) col = mix(col, jgBall(d / rr, paint, 0.23 * uTime + fj * 1.9 + float(i), air, lit), jgIn(l - rr, 1.5 * jgPx) * over);
            }
          }
        }
      }
    }
  }
  if (JG_SNOW > 0.0) for (int k = 0; k < 3; k++) {
    float f = float(k), S = 30.0 - 7.5 * f;
    vec2 q = p * S + vec2(0.8 * sin(uTime * 0.11 + f) + 0.3 * sin(p.y * 5.0 + uTime * 0.2), uTime * (0.35 + 0.1 * f) + 13.0 * f), c2 = floor(q), o = hash22(c2 + 31.0);
    col = mix(col, jgHour(vec3(1.0), vec3(0.62, 0.70, 0.82), vec3(1.0, 0.9, 0.86)), JG_SNOW * (0.5 + 0.2 * f) * step(0.66, o.x) * jgDown(0.03, 0.08 + S * jgPx, length(q - c2 - 0.2 - 0.6 * fract(o * 7.3))));
  }
  return col;
}

// ---- b ----
const mat2 JG_STEP = mat2(0.9686, 0.2487, -0.2487, 0.9686);     // a turn of a twenty-fifth
const mat2 JG_STEP2 = mat2(0.8763, 0.4818, -0.4818, 0.8763);    // of two twenty-fifths
const float JG_TB[5] = float[5](8.0, 9.0, 10.0, 8.5, 7.5);      // how long a flight
const float JG_TOP[5] = float[5](0.66, 0.78, 1.0, 0.84, 0.92);  // how far under the eye it turns
const float JG_RB[5] = float[5](0.056, 0.047, 0.04, 0.046, 0.042);
const float JG_OUT[5] = float[5](0.80, 0.9, 0.98, 0.88, 1.0);   // how far out it falls
vec3 jgShaft(vec2 p) {
  const float F = 0.62;
  float plumb = sat(-uOwn[2]), aside = sat(uOwn[2]), deep = 10.0 - 4.5 * sat(-uOwn[4]) - 2.2 * JG_DISC, many = exp2(0.6 * uOwn[1]);
  vec2 c = mix(vec2(0.19, 0.05), vec2(0.0), plumb) + vec2(0.14, 0.06) * aside, eye = mix(vec2(0.23, 0.13), vec2(0.0), plumb) + vec2(0.22, 0.10) * aside;
  vec2 q = (p - c) / F;
  // where the look down meets the wall
  float A = max(dot(q, q), 1e-5), B = dot(eye, q), C = dot(eye, eye) - 1.0;
  float near = A / max(sqrt(max(B * B - A * C, 0.0)) - B, 1e-4);      // one over how far down
  vec2 side = abs(q) / (1.0 - eye * sign(q));
  near = mix(near, max(side.x, side.y), sat(uOwn[4]));
  float t = 1.0 / max(near, 1e-3);
  float lamp = 0.8 + 0.5 * uLow + 0.06 * sin(uTime * 0.9) * sin(uTime * 0.37);
  vec3 fire = jgHour(vec3(1.0, 0.50, 0.17), vec3(0.42, 0.72, 1.0), vec3(1.0, 0.62, 0.3)), moonC = jgHour(vec3(0.21, 0.31, 0.45), vec3(0.16, 0.22, 0.36), vec3(0.86, 0.80, 0.72)), col;
  if (JG_DISC > 0.0) fire = mix(fire, jgHour(vec3(0.72, 0.86, 0.95), vec3(0.34, 0.46, 0.72), vec3(1.0, 0.72, 0.5)), JG_DISC);
  if (t < deep) {
    vec2 hit = eye + q * t;
    float ang = atan(hit.y, hit.x) / TAU, row = t / 0.085, foot = t * t / F * jgPx, ri = floor(row);
    vec4 m = piece(vec2(abs(2.0 * fract(ang + 0.25) - 1.0), sat(1.0 - t / 6.0)));
    ang *= 44.0;
    float id = hash21(vec2(mod(floor(ang + 0.5 * mod(ri, 2.0)), 44.0), ri));
    vec2 b = vec2(fract(ang + 0.5 * mod(ri, 2.0)), fract(row));
    float fine = jgDown(0.012, 0.06, foot), e = 0.04 + foot * 9.0;
    float mortar = smoothstep(0.04 - e * 0.4, 0.04 + e, min(b.x, 1.0 - b.x) * 2.0) * smoothstep(0.08 - e * 0.4, 0.1 + e, min(b.y, 1.0 - b.y));
    vec3 brick = mix(vec3(0.24, 0.12, 0.09), vec3(0.46, 0.25, 0.17), id);
    brick = mix(brick, vec3(0.29, 0.24, 0.22), 0.8 * step(0.84, fract(id * 7.3))) * (0.7 + 0.6 * noise(vec2(id * 90.0 + b.x * 7.0, row * 3.0)));
    brick = mix(vec3(0.33, 0.185, 0.13), mix(vec3(0.13, 0.11, 0.10), brick, mortar), fine);
    brick = mix(brick, vec3(0.80, 0.765, 0.70) * (0.75 + 0.6 * jgGrey(brick)), jgDusk * 0.92);
    if (JG_SNOW > 0.0) {
      float n = noise(vec3(hit * 1.6, t * 1.1)), s = sin(t * 7.0 + 5.0 * n + 1.5 * noise(vec3(hit * 5.0, t * 4.0)));
      brick = mix(brick, mix(vec3(0.20, 0.36, 0.45), vec3(0.62, 0.78, 0.82), sat(0.5 + 0.28 * s + 0.5 * (n - 0.5) + 0.35 * (noise(vec3(hit * 15.0, t * 5.0)) - 0.5)) * (0.85 + 0.3 * noise(vec3(hit * 40.0, t * 11.0)))), JG_SNOW);
      float cr = 1.0 - abs(2.0 * noise(vec3(hit * 2.7 + 4.0, t * 3.1 + n)) - 1.0), c2 = 1.0 - abs(2.0 * noise(vec3(hit * 5.5, t * 6.5 + 2.0 * n)) - 1.0);
      brick = mix(brick, vec3(0.86, 0.93, 0.94), JG_SNOW * (0.75 * smoothstep(0.9, 1.0, cr) + 0.45 * smoothstep(0.86, 1.0, c2) * jgDown(0.02, 0.1, foot)));
      brick *= mix(vec3(1.0), mix(vec3(0.45, 0.72, 0.86), vec3(1.1), smoothstep(0.35, 0.65, noise(vec3(hit * 3.3 + 9.0, t * 9.0)))), 0.7 * JG_SNOW);
      mortar *= 1.0 - JG_SNOW;
    }
    if (JG_HIGH > 0.0) {
      vec2 k = abs(b - 0.5);
      vec3 glaze = kindColour(floor(fract(id * 3.7) * 4.99)); glaze *= glaze;
      glaze = mix(glaze, vec3(0.86, 0.83, 0.74), smoothstep(0.47, 0.53 + e, k.x + k.y) * (1.0 - 0.6 * step(0.6, fract(id * 9.1))));
      glaze = mix(vec3(0.36, 0.35, 0.31), glaze, 0.35 + 0.65 * fine);
      brick = mix(brick, glaze * (0.6 + 0.4 * mortar) * mix(1.0, 1.2, fract(id * 5.0)), JG_HIGH);
    }
    // the lower edge of each brick takes the lamp, the upper one the moon
    float edge = smoothstep(0.74, 0.92, b.y) * mortar * fine, lip = jgDown(0.08, 0.26, b.y) * mortar * fine;
    float az = 0.5 + 0.5 * dot(hit, vec2(-0.75, -0.66)), up = (t - mix(0.5, 0.36 * deep, uCue)) / 0.8;
    col = brick * (fire * lamp * (3.6 * exp(-(deep - t) * 0.60) * jgDown(deep - 2.8, deep, t) + 0.004) * (0.7 + 1.5 * edge * (0.5 + id))
      + moonC * exp(-t * 0.5) * (0.04 + 0.16 * jgDusk + 3.0 * az * az * az) * (0.65 + 0.9 * lip)
      + fire * lamp * JG_DISC * (0.95 * exp(-(deep - t) * 1.1) + 0.06)
      + m.rgb * m.a * (0.05 + 0.3 * uEnergy) * exp(-0.3 * t)
      + fire * 0.9 * smoothstep(0.0, 0.25, uCue) * exp(-up * up));      // a cue climbs the wall
  }
  float rim = JG_DISC > 0.0 ? jgIn(near - 1.0 / deep - 1.2 * jgPx / F, 2.4 * jgPx / F) : 0.0;
  if (t >= deep || rim > 0.0) {
    vec2 f = eye + q * deep;
    vec3 wall = col;
    col = fire * lamp * 0.3 * exp(-6.0 * dot(f, f));
    if (JG_DISC > 0.0) {
      vec3 up = jgHour(mix(vec3(0.55, 0.75, 0.92), vec3(0.98, 0.97, 0.95), smoothstep(0.35, 0.75, noise(f * 1.7 + uTime * 0.03))), vec3(0.03, 0.05, 0.12), vec3(1.0, 0.62, 0.36)) * (0.9 + 0.35 * lamp);
      vec2 g = f * 5.0, gi = floor(g), go = hash22(gi + 20.0);
      up += jgNight * step(0.45, go.x) * jgDown(0.05, 0.16, length(g - gi - 0.2 - 0.6 * go)) * 1.4;
      col = mix(col, up, JG_DISC);
      if (t < deep) col = mix(wall, col, rim);
    }
  }
  vec2 from = -eye / deep * F, lq = p - c - from;
  float ld = dot(lq, lq);
  col += (1.0 - 0.94 * JG_DISC) * fire * lamp * (t < deep ? 1.0 : 0.45) * (0.0005 / (ld + 0.0009) + (0.0016 + 0.004 * uMic) / (ld + 0.03)) + vec3(1.0, 0.85, 0.6) * jgDown(0.0045, 0.0075, sqrt(ld)) * 1.5 * (1.0 - JG_DISC);
  // the fountains: each kind throws in five ways, seven balls in each
  vec2 dir = vec2(0.94, 0.34);
  vec4 one = vec4(0.0), two = one;
  vec3 sky = jgHour(vec3(0.36, 0.41, 0.48), vec3(0.28, 0.36, 0.52), vec3(0.75, 0.70, 0.64));
  float z1 = 99.0, z2 = 99.0, spread = exp2(0.7 * uOwn[3] - 0.5 * sat(uOwn[3])), soft = (uOwn[5] < 0.0 ? 1.0 + uOwn[5] : 1.0 + 1.4 * uOwn[5]) * (0.75 + 0.5 * uSpace);
  for (int i = 0; i < 5; i++) {
    float lv = jgMore(i), top = JG_TOP[i] * exp2(0.5 * uOwn[3]), R = JG_RB[i] / many, far = JG_OUT[i] * spread;
    float bulge = 0.26 * F * far / sqrt(top * (deep - top)), reach0 = R * F / top, turn = uTime * 7.0 / JG_TB[i];
    float out1 = 0.1 + 0.5 * far, fan = 0.52 * F * out1 / top;
    vec3 kind = mix(vec3(0.95, 0.92, 0.87), jgPaint(i, 0.0) * (1.5 - 0.45 * max(abs(uOwn[6]), JG_DISC)), 0.5 + 0.45 * max(abs(uOwn[6]), JG_DISC));
    vec2 mid = JG_STEP * (JG_STEP2 * dir), ba = (mid * out1 - eye) / top * F - from;
    vec2 first = dir;
    dir = JG_STEP * (JG_STEP2 * (JG_STEP2 * dir));
    float g = sat(dot(lq, ba) / max(dot(ba, ba), 1e-4));
    vec2 off = lq - ba * g;
    float reach = bulge + reach0 * min(1.0, g + 0.3) + 0.03 * soft + 0.02 + fan * min(1.0, g + 0.25);
    if ((lv > 0.005 || i == 3 || i == 4 && uHits > 0.0) && dot(off, off) < reach * reach)
    for (int w = 0; w < 5; w++) {
      first = JG_STEP * first;
      ba = (first * out1 - eye) / top * F - from;
      g = sat(dot(lq, ba) / max(dot(ba, ba), 1e-4));
      off = lq - ba * g;
      reach = bulge + reach0 * min(1.0, g + 0.3) + 0.03 * soft + 0.01;
      if (dot(off, off) < reach * reach) {
      float beat = turn + float(w) * 0.4, fr = fract(beat), be = floor(beat);
      // only the balls that can be this far along
      float nearest = 1.0 / deep + max(g - reach / max(length(ba), 1e-3), 0.0) * (1.0 / top - 1.0 / deep), half1 = 0.5 * sqrt(sat((1.0 / nearest - top) / (deep - top)));
      int last = int(floor((0.5 + half1) * 7.0 - fr));
      for (int s = int(max(ceil((0.5 - half1) * 7.0 - fr), 0.0)); s <= last; s++) {
        if (s > 6) break;
        float f = (float(s) + fr) / 7.0, z = mix(deep, top, 4.0 * f * (1.0 - f));
        vec2 at = F * (first * (0.1 + far * f) - eye) / z, d = p - c - at;
        float blur = 0.02 * abs(1.0 / z - 0.4) * soft + 1.2 * jgPx, rr = R * F / z, dd = dot(d, d), lim = rr * 1.15 + blur;
        float lit = i == 4 ? (1.0 - smoothstep(0.35, 1.1, abs(f - 0.5) * 7.0)) * uHits * (w == 2 ? 1.0 : 0.0) : 0.0;
        if (dd < lim * lim * (1.0 + 5.0 * lit)) {
        float ball = mod(be - float(s), 7.0) * 5.0 + float(w);
        float see = max(smoothstep(0.0, 1.0, lv * 40.0 * many - ball), lit);
        if (i == 3 && w == 2) see = 1.0;
        rr *= (0.3 + 0.7 * smoothstep(0.0, 0.6, see)) * (0.85 + 0.3 * band(ball / 35.0));
        float l = sqrt(dd), al = see * jgDown(rr - blur, rr + blur, l) * sat((rr * rr + 0.3 * jgPx * jgPx) / (rr * rr + 0.2 * blur * blur));
        col += lit * vec3(1.0, 0.7, 0.35) * 0.9 * exp(-dd / (rr * rr * 1.6));
        if (JG_HOOP > 0.0) { al *= 1.0 - sat(JG_HOOP * 3.0) * jgDown(0.68 * JG_HOOP * rr - blur, 0.68 * JG_HOOP * rr + blur, l); d = jgRound(d / rr, l / rr) * rr; l = length(d); }
        vec3 nn = vec3(d / max(max(rr, l), 1e-4), 0.0); nn.z = sqrt(max(0.0, 1.0 - dot(nn.xy, nn.xy)));
        vec2 toL = from - at; toL /= max(length(toL), 1e-3);
        float rim = smoothstep(0.0, 1.1, dot(nn.xy, toL) - 0.3 * nn.z), glow = exp(-(deep - z) * 0.36);
        vec3 pale = mix(kind, vec3(0.95, 0.92, 0.87), 0.15 * mod(ball, 3.0) * (1.0 - 0.8 * max(abs(uOwn[6]), JG_DISC)));
        vec3 bc = pale * (sky * (0.07 + 1.9 * pow(sat(dot(nn, vec3(-0.56, 0.60, 0.57))), 1.4)) * exp(-z * 0.1) * (1.0 - 0.45 * JG_DISC) + fire * lamp * (1.5 * glow * (1.0 - 0.6 * JG_DISC) + (1.9 + 3.0 * uKeys) * rim + 0.03)) + lit * vec3(1.6, 1.2, 0.75) * (0.4 + 0.6 * nn.z);
        // the nearer ball lies over the farther: the two nearest are kept aside
        vec4 ball4 = vec4(bc, al);
        if (al < 0.002 || z > z2) col = mix(col, bc, al);
        else {
          col = mix(col, two.rgb, two.a); two = z < z1 ? one : ball4; z2 = z < z1 ? z1 : z;
          if (z < z1) { one = ball4; z1 = z; }
        }
        }
      }
      }
    }
  }
  col = screenOf(mix(mix(col, two.rgb, two.a), one.rgb, one.a) * 1.6);
  return mix(col, col * col * (3.0 - 2.0 * col), 0.55);
}
vec3 render(vec2 p) {
  vec3 c = vec3(0.0);
  jgPx = 1.0 / uRes.y;
  jgNight = sat(-uOwn[0]); jgNight *= 2.0 - jgNight; jgDusk = sat(uOwn[0]);
  if (uVar < 0.5) c = jgDay(p);
  if (uVar >= 0.5) c = jgShaft(p);
  return c;
}
