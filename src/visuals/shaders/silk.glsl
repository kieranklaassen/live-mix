// name: Silk
// a: Dark satin
// b: Falling ink
// what: A sheet of black satin moving in slow wind, dyed with the piece so each sound is a band of its own colour that swells as it plays; or the sounds as coloured ink falling and curling through dark water.
// follows: The fuller the music the deeper the folds; each sound lights its own colour where it sits in the piece; a hit sends a ripple out through the cloth, a cue sends a gust across it; in the water each kind of sound pours its own ink.
vec3 skDeep(vec3 c) { return c * c * 2.0 + c * 0.1; }
vec3 skTap; // where the cloth was tapped (x, z) and how far the ripple has gone
// The height of the cloth at x: long folds with round backs and pinched valleys, a second set across them.
float skCloth(vec2 x) {
  float t = uTravel * 0.1 + uTime * 0.02;
  float deep = 0.1 + 0.3 * uLevel + 0.06 * uEnergy;
  vec2 w = vec2(noise(x * 0.3 + vec2(t, 0.0)), noise(x * 0.3 + vec2(5.0, -t)));
  float f1 = x.x * 2.6 + x.y * 0.55 + w.x * 5.0 + t * 1.5;
  float a = abs(sin(f1));
  a = a * (1.6 - 0.6 * a); // round backs, pinched valleys
  float f2 = x.x * 6.1 + x.y * 1.6 + w.y * 7.0 + 1.3 * sin(f1) - t;
  float b = 0.5 + 0.5 * sin(f2);
  float h = deep * (a * (0.5 + 1.0 * w.y) + 0.3 * b * (0.25 + w.x)) + 0.16 * (w.x + w.y - 1.0);
  // a gust: a swell that crosses from left to right
  float gust = x.x - (-8.0 + 16.0 * (1.0 - uCue)) - 0.4 * x.y;
  h += 0.3 * uCue * exp(-gust * gust * 0.6) * (0.6 + a);
  // a tap: a ring going out
  float r = length(x - skTap.xy) - skTap.z;
  h += 0.11 * uHits * sin(r * 7.0) * exp(-r * r * 1.6) / (1.0 + 0.4 * skTap.z);
  return h;
}
vec3 skSatin(vec2 p) {
  vec3 ro = vec3(0.5 * sin(uTime * 0.04), 2.3, -1.4);
  vec3 rd = normalize(vec3(p.x, p.y, 1.0));
  rd.yz = rot(-0.66) * rd.yz;
  skTap = vec3(1.4 * sin(uTime * 0.23), 3.0 + 1.0 * cos(uTime * 0.19), (1.0 - uHits) * 3.0);
  if (rd.y > -0.02) return vec3(0.0);
  float t = (ro.y - 0.7) / -rd.y, back = t, hit = 0.0;
  for (int i = 0; i < 40; i++) {
    vec3 q = ro + rd * t;
    float d = q.y - skCloth(q.xz);
    if (d < 0.0) { hit = 1.0; break; }
    back = t;
    t += max(d * 0.5, 0.008 * t);
    if (t > 40.0) break;
  }
  if (hit > 0.5) for (int i = 0; i < 4; i++) {
    float mid = 0.5 * (back + t); vec3 q = ro + rd * mid;
    if (q.y - skCloth(q.xz) < 0.0) t = mid; else back = mid;
  }
  vec3 q = ro + rd * t;
  float e = 0.006 + 0.003 * t;
  float h = skCloth(q.xz);
  vec3 n = normalize(vec3(h - skCloth(q.xz + vec2(e, 0.0)), e, h - skCloth(q.xz + vec2(0.0, e))));
  vec3 L = normalize(vec3(-0.7, 0.55, -0.2)), V = -rd, H = normalize(L + V);
  float deep = 0.1 + 0.3 * uLevel + 0.06 * uEnergy;
  // does the fold next door stand in the light; and the bottoms of folds are dark
  float lit = sat(1.0 - 5.0 * (skCloth(q.xz + L.xz * 0.2) - h - L.y * 0.12));
  float lap = sat(0.3 + 0.9 * h / deep);
  // the dye: the piece laid on the cloth, across is the loop, far is the back of the room
  vec2 uv = vec2(q.x / (4.2 + 0.6 * q.z) * 0.5 + 0.5, 1.0 - (q.z + 0.7) / 9.5);
  vec4 pc = piece(uv);
  vec3 hue = skDeep(pc.rgb / max(pc.a, 0.02));
  float dye = pc.a * (0.3 + 1.5 * pc.a);
  float facing = sat(dot(n, L));
  vec3 col = hue * dye * (0.06 + 0.9 * facing * facing * lit) * lap;
  // sheen: satin throws a broad soft shine, and at a low angle it turns paler
  float shine = pow(sat(dot(n, H)), 14.0), glint = pow(sat(dot(n, H)), 90.0);
  float graze = pow(1.0 - sat(dot(n, V)), 4.0);
  vec3 pale = mix(vec3(0.42, 0.47, 0.6), mix(hue, vec3(1.0), 0.35), sat(pc.a * 3.0));
  col += pale * shine * (0.16 + 1.3 * dye) * lit * (0.7 + 0.5 * uLevel);
  col += vec3(0.9, 0.95, 1.0) * glint * (0.3 + 0.6 * dye) * lit;
  col += pale * graze * (0.012 + 0.3 * dye) * lap;
  // the tap shows as a ring of light
  float r = length(q.xz - skTap.xy) - skTap.z;
  col += (vec3(1.0, 0.9, 0.85) * 0.6 + hue * dye) * sqrt(uHits) * exp(-r * r * 3.0) * 1.3 * (0.3 + facing);
  return col * exp(-t * 0.07) * smoothstep(30.0, 12.0, t);
}
// Ink: noise curled twice. Where it passes through its middle value there is a thin veil.
float skInk(vec2 x, float fine) {
  vec2 w = vec2(noise(x * 0.8 + 3.0), noise(x * 0.8 + 31.0)) - 0.5;
  x += w * 1.8;
  w = vec2(noise(x * 1.7 + 7.0), noise(x * 1.7 + 19.0)) - 0.5;
  x += w * 0.6;
  return noise(x * 1.1) * 0.85 + 0.15 * fine * noise(x * 3.1 + 2.0) + 0.075 * (1.0 - fine);
}
vec3 skWater(vec2 p) {
  float lv[5] = float[5](uDrone, uPad, uTexture, uPhrase, uHits);
  vec3 col = vec3(0.0);
  float fall = uTravel * 0.08;
  vec2 sway = vec2(0.06 * sin(uTime * 0.07), 0.03 * cos(uTime * 0.05));
  float T = 1.0;
  for (int i = 0; i < 10; i++) {
    float fi = float(i), z = fi / 9.0; // 0 nearest
    int kind = (i * 3 + 1) % 5; // each layer of water holds one plume of ink, of one kind of sound
    float amount = lv[kind], seed = fi * 17.3 + 2.0;
    vec2 x = (p + sway * (1.0 - 2.5 * z)) * (0.75 + 0.9 * z);
    float sharp = 1.0 - sat(abs(z - 0.4) * 1.3); // one depth is in focus
    // the plume: in at the top, further down the louder its sound, spreading as it falls
    float cx = (hash11(seed) - 0.5) * 1.5 * (0.75 + 0.9 * z) + 0.06 * sin(uTime * 0.11 + seed);
    float reach = (0.5 * (0.75 + 0.9 * z) - x.y); // 0 at the top
    float n = skInk(vec2(x.x * 2.0 + seed, x.y * 1.5 + fall * (0.8 + 0.4 * hash11(seed + 1.0))), sharp);
    float len = (0.1 + 1.15 * amount) * (0.75 + 0.5 * hash11(seed + 5.0));
    float wide = 0.035 + 0.15 * sat(reach / max(len, 0.2)) + 0.04 * amount;
    float dx = (x.x - cx + (n - 0.5) * 0.3) / wide;
    float env = exp(-dx * dx) * smoothstep(len, len * 0.55, reach + (n - 0.5) * 0.4) * smoothstep(-0.02, 0.06, reach);
    // veils: each rises slowly to a sharp edge, like a thin sheet seen where it folds over
    float v = fract(n * mix(6.0, 11.0, sharp) + seed);
    float streak = smoothstep(0.25, 0.75, noise(vec2(x.x * 2.5 + seed, x.y * 1.4 + fall) + n * 3.0)); // not every sheet catches the light
    float veil = (v * v * v + 0.8 * pow(v, 16.0) * sharp) * smoothstep(1.0, mix(0.8, 0.95, sharp), v) * (0.15 + 0.85 * streak);
    float body = env * (0.04 + 0.96 * veil);
    vec3 hue = skDeep(uKind[kind]);
    vec3 light = mix(hue, vec3(1.0), 0.25 * sat(veil - 0.6) * env) * body * (0.05 + 1.7 * amount) * (0.45 + 0.55 * sharp);
    // a hit or a cue: a drop bursts into a ring near the depth that is sharp
    vec2 dv = x - vec2(0.4 * sin(uTime * 0.31 + 1.0), 0.02 + 0.14 * cos(uTime * 0.27)) + (n - 0.5) * 0.08;
    float out_ = max(uHits, uCue), ring = length(dv) - 0.4 * (1.0 - out_) * (1.0 + step(uHits, uCue));
    light += (skDeep(uKind[4]) + vec3(0.25)) * out_ * exp(-ring * ring * 300.0) * (0.3 + veil) * exp(-pow((z - 0.35) * 4.0, 2.0)) * 1.3;
    col += T * light;
    T *= 1.0 - 0.6 * body * sat(amount * 3.0);
  }
  return col;
}
vec3 render(vec2 p) {
  return screenOf(uVar < 0.5 ? skSatin(p) : skWater(p));
}
