// name: Curtains
// a: Night sky
// b: Under water
// what: Curtains of light hanging over a dark shore and mirrored in still water, one curtain for each part of the spectrum; or the same light seen from under the sea, falling in rays through the surface.
// follows: Each band of the spectrum raises and brightens its own curtain, low nearest; a hit flares one stretch of a curtain; a cue runs a surge of light from left to right; under water the spectrum lies across the surface, the fuller the music the deeper the rays reach, and a hit drops a ring of light.
// own: 0 1 broad soft folds (b: a large slow net), -1 hair-fine rays (b: a small close net); 1 a: 1 deep winding folds, -1 straight walls; b: 1 long bands of light side by side, -1 round coins; 2 a: 1 hung from a bright hem above and trailing down, -1 separate pillars standing on the ground; b: 1 the light slants in from the right, -1 one great shaft through a hole; 3 1 pale: they stain a day sky as dye does paper (b: bright milky shallows), -1 an afterglow at the horizon (b: light from the deep); 4 1 crowded close and tall, -1 one alone (b: 1 the light reaches deep, -1 only just under the surface); 5 the eye: 1 turned straight up, -1 level; 6 the land: 1 sharp peaks (b: a sand floor), -1 a wood of spruces (b: kelp); 7 1 snow for water (b: ice overhead), -1 thick with stars (b: with drifting motes); with any of them set the colours are the sounds' own
float auMine, auAmp, auPale;   // how far the colours are the sounds' own, how deep the folds, how pale the ground
float auWave(float x, float i, float t) { // the line a curtain follows over the ground
  return 1.5 * sin(x * 0.23 + i * 2.1 + t * 0.6) + 0.8 * sin(x * 0.57 - i * 1.3 - t) + 0.35 * sin(x * 1.31 + i * 4.0 + t * 1.7);
}
float auWaveDx(float x, float i, float t) {
  return 1.5 * 0.23 * cos(x * 0.23 + i * 2.1 + t * 0.6) + 0.8 * 0.57 * cos(x * 0.57 - i * 1.3 - t) + 0.35 * 1.31 * cos(x * 1.31 + i * 4.0 + t * 1.7);
}
float auStars(vec2 p, float n, float seed) {
  vec2 g = p * n, id = floor(g), f = fract(g) - 0.5;
  vec2 h = hash22(id + seed);
  float d = length(f - (h - 0.5) * 0.7);
  float b = pow(h.x, 14.0) * (0.7 + 0.3 * sin(uTime * (0.8 + 2.0 * h.y) + h.y * 40.0));
  return b * smoothstep(0.08, 0.0, d) * 3.0;
}
// The light of all the curtains along one ray from the shore. rd looks up.
vec3 auFolds(vec3 rd, float back) {
  vec3 col = vec3(0.0);
  float fine = exp2(-1.6 * uOwn[0]), hung = max(uOwn[2], 0.0), post = max(-uOwn[2], 0.0), close = max(uOwn[4], 0.0), alone = max(-uOwn[4], 0.0), over = max(uOwn[5], 0.0);
  float t = uTravel * 0.16;
  vec2 dir = normalize(rd.xz);
  float hitAt = 9.0 * sin(uTime * 0.17 + 2.0), surge = -26.0 + 52.0 * (1.0 - uCue);
  for (int i = 0; i < 6; i++) {
    float fi = float(i), z0 = (6.5 + 2.1 * fi * fi) * (1.0 - 0.45 * close) * (1.0 + 0.5 * alone), id = fi + back;
    float lv = max(max(band(fi / 6.0), band((fi + 0.4) / 6.0)), band((fi + 0.8) / 6.0));
    // where the ray meets this curtain: the curtain is z = z0 + wave(x), found by going back and forth
    float s = z0 / rd.z;
    for (int k = 0; k < 3; k++) s = mix(s, (z0 + auAmp * auWave(rd.x * s, id, t)) / rd.z, 0.8);
    vec3 q = rd * s;
    float slope = auAmp * auWaveDx(q.x, id, t);
    float facing = abs(dir.y - slope * dir.x) * inversesqrt(1.0 + slope * slope);
    float through = 1.0 / max(facing, 0.3); // seen along its fold, a curtain is brighter
    float far = 1.0 + 0.04 * z0; // far curtains have broader rays, or they would shimmer
    float rays = noise(vec2(q.x * 2.2 * fine / far + t * 1.5 + id * 9.0, t * 0.7)), pole = rays;
    rays = rays * rays * (0.5 + noise(vec2(q.x * 8.0 * fine / far - t * 3.0, id))) * 1.9;
    rays = 0.12 + 0.88 * sat(rays);
    rays = mix(rays, 1.3 * smoothstep(0.66, 0.86, pole), post);
    if (uOwn[0] < 0.0) rays = mix(rays, rays * rays * 1.5, -uOwn[0]);
    float ev = uHits * exp(-pow((q.x - hitAt - 2.0 * fi + 5.0) * 0.5, 2.0)) * (i == 1 || i == 3 ? 1.0 : 0.25 + (i == 0 ? 0.75 * alone : 0.0))
             + uCue * exp(-pow((q.x - surge) * 0.22, 2.0));
    float foot = 2.1 + 0.12 * fi + (0.5 + 0.08 * z0) * (noise(vec2(q.x * 0.4 / far + id * 3.0, t * 0.5)) - 0.5) - 0.4 * ev;
    float tall = (0.5 + 0.12 * z0) * (0.5 + 4.2 * lv + 1.5 * ev) * (0.45 + rays);
    if (uOwn[1] != 0.0) foot += (0.5 + 0.08 * z0) * (uOwn[1] < 0.0 ? uOwn[1] : 1.7 * uOwn[1]) * (noise(vec2(q.x * 0.4 / far + id * 3.0, t * 0.5)) - 0.5);
    ev += over * 0.5 * uHits;
    foot = mix(foot, 0.0, post); tall *= (1.0 + 0.9 * close) * (1.0 + 0.5 * post) * (1.0 + 2.6 * over);
    float h = max((q.y - foot) / tall, -1.0);
    float body = smoothstep(-0.02, 0.02, h) * (exp(-h * 2.6) + 1.6 * exp(-h * 14.0)) * smoothstep(1.7, 0.8, h);
    if (hung > 0.0) {
      float hem = foot + (0.9 + 0.14 * z0) * (0.6 + 1.7 * noise(vec2(q.x * 0.21 / far - id * 5.0, t * 0.4)));
      float d = (hem - q.y) / (tall * 1.6);
      body = mix(body, smoothstep(-0.03, 0.03, d) * (0.75 * exp(-max(d, 0.0) * 1.5) + 1.1 * exp(-max(d, 0.0) * 11.0)), hung); h = mix(h, d, hung);
    }
    float glow = (0.035 + 1.2 * lv * (0.45 + 0.7 * lv) + 1.6 * ev) * (0.35 + 0.65 * rays) * through * 0.42;
    vec3 low = i == 0 ? vec3(0.08, 1.0, 0.55) : i == 1 ? vec3(0.3, 1.0, 0.25) : i == 2 ? vec3(0.05, 0.85, 1.0) : i == 3 ? vec3(0.5, 0.3, 1.0) : i == 4 ? vec3(1.0, 0.55, 0.3) : vec3(1.0, 0.2, 0.5);
    low = mix(low, kindColour(fi * 0.75), 0.3 + 0.68 * auMine);
    vec3 high = mix(vec3(0.45, 0.1, 0.95), vec3(0.95, 0.1, 0.3), fi / 5.0);
    high = mix(high, kindColour(4.0 - fi * 0.8) * 0.7, 0.9 * auMine);
    vec3 c = mix(low, high, sat(h * 1.3 - 0.2)) + vec3(1.0, 0.75, 0.9) * exp(-max(h, 0.0) * 30.0) * 0.5 * ev;
    col += c * body * glow * exp(-s * 0.012) * step(0.0, rd.z) * (over > 0.0 ? mix(1.0, 0.95 * exp(-s * 0.03) / (1.0 + pow(abs(rd.x) * z0 / (far * rd.z * rd.z + 1e-3) / uRes.y * 12.0, 2.0)), over) : 1.0) * (1.0 + 0.6 * alone * float(i == 0)) * (i > 0 ? mix(1.0, i == 1 ? 0.12 : 0.0, alone) : 1.0);
  }
  return col;
}
vec3 auSky(vec3 rd, float sharp) {
  vec3 col, was = rd;
  float over = max(uOwn[5], 0.0);
  if (over > 0.0) { // straight up they stand on every side: ahead and behind, and across at the right and left
    float side = mix(1.0, smoothstep(0.28, 0.72, rd.z * rd.z / (rd.x * rd.x + rd.z * rd.z + 1e-5)), over);
    rd.z = mix(rd.z, abs(rd.z) + 0.02, sat(over * 20.0));
    col = vec3(0.0);
    if (side > 0.002) col += side * auFolds(rd, step(was.z, 0.0) * 3.3);
    if (side < 0.998) col += (1.0 - side) * auFolds(vec3(was.z, was.y, abs(was.x) + 0.02), 7.1 + step(was.x, 0.0) * 3.3);
  } else col = auFolds(rd, 0.0);
  // stars, dimmed where the curtains are bright
  vec2 sp = rd.xy / max(rd.z, 0.05);
  if (over > 0.0) sp = mix(sp, was.xz / max(rd.y, 0.05) * 0.8, over);
  float st = auStars(sp, 22.0, 1.0) + 0.5 * auStars(sp * rot(0.3) + 4.0, 47.0, 3.0);
  if (uOwn[7] < 0.0) {
    float way = noise(sp * rot(0.7) * vec2(3.0, 4.3) + 3.0) * (0.6 * noise(sp * rot(-0.5) * 9.0) + 0.4 * noise(sp * rot(0.3) * 21.0)), lane = (sp.x * 0.6 - sp.y + 0.35);
    lane = exp(-lane * lane * 5.0);
    st -= uOwn[7] * (0.8 * auStars(sp * rot(1.1), 33.0, 7.0) + 0.6 * auStars(sp * rot(2.0), 64.0, 9.0) + 0.5 * auStars(sp * rot(2.6), 90.0, 13.0) + lane * (0.015 + 0.3 * way * way));
  }
  st *= 1.0 - auPale;
  col += vec3(0.8, 0.88, 1.0) * st * sharp * (0.6 + 0.6 * uHigh) * smoothstep(0.0, 0.08, rd.y) / (1.0 + 4.0 * dot(col, vec3(1.0)));
  return col;
}
// What the sky itself is behind them: a day they stain, or the glow of one that is over.
vec3 auHour(vec3 c, vec3 rd) {
  float y = max(rd.y, 0.0), glow = max(-uOwn[3], 0.0);
  if (auPale > 0.0) {
    vec3 paper = mix(mix(uKind[3], vec3(1.0), 0.5), mix(uKind[0], vec3(1.0), 0.45), sat(y * 1.2)) * (1.8 - 0.5 * y);
    float m = max(c.r, max(c.g, c.b));
    c = mix(c, paper * exp(-3.2 * (m * 1.24 - c)), auPale);
  }
  return c + glow * (uKind[3] * uKind[3] * 0.85 * exp(-y * 9.0) + uKind[4] * uKind[4] * 0.3 * exp(-y * 3.6) + uKind[0] * uKind[0] * 0.12) * (0.75 + 0.35 * uLevel);
}
// How high the land stands against the sky.
float auLand(float x, float hills) {
  if (uOwn[6] > 0.0) {
    float r = 1.0 - abs(2.0 * noise(vec2(x * 2.3 + 5.0, 1.5)) - 1.0), r2 = 1.0 - abs(2.0 * noise(vec2(x * 6.1, 4.5)) - 1.0);
    hills += uOwn[6] * (0.21 * r * r + 0.075 * r2 * r + 0.02 * noise(vec2(x * 31.0, 8.5)));
  }
  if (uOwn[6] < 0.0) {
    float wood = 0.0;
    for (int k = 0; k < 2; k++) {
      float n = k == 0 ? 17.0 : 29.0, g = x * n + float(k) * 0.37, f = fract(g) - 0.5, u = hash11(floor(g) + 3.0 * float(k));
      float tri = 1.0 - abs(f + 0.2 * (u - 0.5)) * (2.6 + 0.9 * u), tall = (0.06 + 0.15 * u * u) * (k == 0 ? 1.0 : 0.75);
      wood = max(wood, tall * (tri - 0.09 * fract(tri * 7.0)));
    }
    hills = mix(hills, max(hills, wood + 0.01), -uOwn[6]);
  }
  return hills;
}
vec3 auNight(vec2 p) {
  vec3 rd = normalize(vec3(p.x, p.y, 0.8));
  if (uOwn[5] == 0.0) rd.yz = rot(0.36) * rd.yz; else rd.yz = rot(0.36 + (uOwn[5] > 0.0 ? 1.12 : 0.28) * uOwn[5]) * rd.yz; // looking up a little, so the rays lean together overhead
  vec2 flat_ = vec2(atan(rd.x, rd.z), rd.y);
  // a far shore: low black hills
  float hills = 0.012 + 0.03 * noise(vec2(flat_.x * 4.0 + 3.0, 0.5)) + 0.012 * noise(vec2(flat_.x * 13.0, 2.5));
  if (uOwn[6] != 0.0) hills = auLand(flat_.x, hills);
  vec3 col, snowy = vec3(0.0), land = auPale * mix(uKind[0] * 0.14, uKind[1] * 0.3, 0.4);
  if (rd.y > 0.0) {
    col = auHour(auSky(rd, 1.0), rd) * smoothstep(hills, hills + 0.004, rd.y) + land * smoothstep(hills + 0.004, hills, rd.y);
  } else {
    // still water: the same sky, turned over and drawn out by slow ripples
    vec2 w = rd.xz * (0.5 / -rd.y);
    float rip = noise(vec2(w.x * 1.1, w.y * 7.0 + uTime * 0.2)) - 0.5 + 0.5 * (noise(vec2(w.x * 3.0 + 7.0, w.y * 19.0 - uTime * 0.3)) - 0.5);
    vec3 up = normalize(vec3(rd.x + rip * 0.012, -rd.y * (1.0 + rip * 0.5) + 0.002, rd.z));
    float keep = 0.25 + 0.75 * pow(1.0 - up.y, 4.0); // water mirrors best at a low angle
    keep = mix(keep, 0.9, 0.55 * auPale);
    col = auHour(auSky(up, 0.5), up) * keep * 0.85 * smoothstep(hills, hills + 0.006, up.y) + land * 0.7 * smoothstep(hills + 0.006, hills, up.y);
    if (uOwn[7] > 0.0) {
      vec3 amb = uKind[0] * (0.1 + 0.5 * band(0.05)) + uKind[1] * 0.45 * band(0.3) + uKind[2] * 0.4 * band(0.5) + uKind[3] * 0.4 * band(0.75) + uKind[4] * (uHits * 0.4 + 0.3 * uCue);
      float near = 1.0 / (1.0 + 0.1 * w.y), drift = noise(vec2(w.x * 0.45 + 0.3 * w.y, w.y * 1.5)), crust = noise(w * vec2(5.0, 12.0));
      snowy = vec3(0.86, 0.9, 1.0) * (amb * (0.5 - 0.3 * auPale) + 0.05 + auPale * 0.75) * (0.45 + 0.75 * drift + 0.16 * (crust - 0.5) * near) + col * 0.12;
      col = mix(col, auHour(snowy, vec3(0.0, 0.4, 0.0)) * (1.0 - auPale) + snowy * auPale, uOwn[7] * smoothstep(0.0, 0.02, -rd.y));
    }
  }
  return col;
}
float auCaust(vec2 s, float t) {
  s *= exp2(-1.1 * uOwn[0]) * vec2(1.0, 1.0 - 0.9 * max(uOwn[1], 0.0));
  float a = noise(s * 1.1 + vec2(t * 0.35, t * 0.2)), b = noise(s * 1.9 - vec2(t * 0.25, -t * 0.3) + 5.0);
  float c = sat(1.0 - abs(a - b) * 2.6);
  float net = c * c * c;
  if (uOwn[1] < 0.0) net = mix(net, smoothstep(0.6, 0.72, 0.6 * a + 0.4 * b + 0.06) * 0.95, -uOwn[1]);
  if (uOwn[7] > 0.0) net = mix(net, 0.06 + 0.94 * smoothstep(0.05, 0.0, abs(a - 0.5)), uOwn[7]);   // ice: light comes in by its cracks
  return net;
}
vec3 hue2(float x) { return kindColour(sat(x / 14.0 + 0.5) * 4.0) * 1.3; }
vec3 auDeep(vec2 p) {
  const float top = 3.2;
  vec3 ro = vec3(0.0, 0.0, uTravel * 0.25);
  vec3 rd = normalize(vec3(p.x, p.y + 0.42 + (uOwn[5] > 0.0 ? 0.75 : 0.4) * uOwn[5], 0.75));
  vec3 sun = normalize(vec3(0.1 + 0.95 * max(uOwn[2], 0.0), 0.64, 0.6 * (1.0 - 0.75 * max(-uOwn[2], 0.0)))); // the way up to the light
  float t = uTime * 0.5;
  vec2 drop = ro.xz + vec2(1.5 * sin(uTime * 0.13), 4.5 + cos(uTime * 0.1));
  float ring = (1.0 - uHits) * 2.6, ring2 = (1.0 - uCue) * 7.0;
  float end = rd.y > 0.02 ? min(top / rd.y, 16.0) : 16.0, hole = max(-uOwn[2], 0.0), sandy = max(uOwn[6], 0.0), bed = 1e3;
  vec2 mouth = ro.xz + vec2(0.35, 3.4);
  if (sandy > 0.0 && rd.y < -0.01) { bed = mix(6.0, 0.85, sandy) / -rd.y; end = min(end, bed); }
  float dt = end / 28.0, s = dt * hash21(gl_FragCoord.xy);
  vec3 sum = vec3(0.0);
  for (int i = 0; i < 28; i++) {
    vec3 q = ro + rd * s;
    vec2 at = q.xz + sun.xz * (top - q.y) / sun.y; // where this water's light came in through the surface
    float across = (at.x - ro.x) / 14.0 + 0.5;
    float lv = band(across);
    float c = auCaust(at, t); c = c * c * (0.05 + 1.1 * lv);
    if (hole > 0.0) { float m = length(at - mouth); c = mix(c, (0.16 + 0.9 * lv) * (0.35 + 0.65 * min(c * 8.0, 1.0)) * smoothstep(1.75, 0.95, m + 0.35 * noise(at * 1.3)), hole); }
    float dr = length(at - drop);
    c += 1.1 * uHits * exp(-pow((dr - ring) * 3.0, 2.0)) + 0.7 * uCue * exp(-pow((dr - ring2) * 1.6, 2.0)) / (1.0 + 0.3 * ring2);
    float depth = top - q.y;
    vec3 hue = mix(vec3(0.1, 0.75, 0.85), kindColour(across * 4.0), 0.6 + 0.35 * auMine);
    hue = mix(hue * hue * hue * 2.6, mix(vec3(0.01, 0.12, 0.6), uKind[0] * uKind[0] * 0.8, auMine), sat(depth * 0.22));
    float left = sat(1.0 - depth / ((2.0 + 1.3 * uLevel) * exp2(1.2 * uOwn[4]))); // the fuller the music, the deeper the light gets
    sum += hue * c * left * left * exp(-s * 0.2) * dt;
    s += dt;
  }
  vec3 col = sum * 2.6;
  vec3 pool = mix(uKind[1], uKind[0], sat(0.55 - 0.75 * rd.y)), surfHue = mix(vec3(0.05, 0.35, 0.5), uKind[1] * 0.6, auMine);
  float haze = 1.0;
  if (auPale > 0.0) { // light lies in all the water
    pool = mix(pool * pool, vec3(0.8), 0.1 + 0.25 * sat(rd.y)) * (0.5 + 0.5 * rd.y + 0.12 * uLevel);
    haze = mix(1.0, exp(-0.07 * end), auPale); col = col * (1.0 + 0.3 * auPale) + auPale * pool * (1.0 - exp(-0.35 * end));
  }
  if (uOwn[3] < 0.0) col -= uOwn[3] * uKind[0] * uKind[0] * (0.2 + 0.45 * uLow + 0.25 * uLevel) * exp(-3.2 * max(p.y + 0.5, 0.0));
  if (bed < 900.0) { // the floor
    vec3 q = ro + rd * bed;
    vec2 at = q.xz + sun.xz * (top - q.y) / sun.y;
    float lit = auCaust(q.xz * 1.25 + 3.0, t), lv = band((at.x - ro.x) / 14.0 + 0.5), rip = sin(q.z * 5.0 + 2.6 * noise(q.xz * 0.9) + q.x * 0.8);
    float m = mix(1.0, 0.12 + 1.7 * smoothstep(2.4, 0.6, length(at - mouth)), hole);
    vec3 sand = mix(uKind[2], vec3(0.8, 0.74, 0.64), 0.5);
    float grain = 0.85 + 0.3 * noise(q.xz * 23.0);
    col += sand * grain * (0.75 + 0.25 * rip) * (0.06 + 0.12 * uLevel + auPale * 0.5 + (0.22 + 0.9 * lv) * lit * mix(hue2(at.x - ro.x), vec3(1.0), 0.4)) * m * exp(-bed * 0.1) * sandy;
  }
  if (rd.y > 0.02 && top / rd.y < 40.0) {
    // the surface from below: straight up it is a window on the sky, further off a dark mirror
    vec3 q = ro + rd * (top / rd.y);
    float e = 0.12;
    float h0 = auCaust(q.xz, t), hx = auCaust(q.xz + vec2(e, 0.0), t), hz = auCaust(q.xz + vec2(0.0, e), t);
    float line = h0 * h0 * h0;
    vec3 n = normalize(vec3((hx - h0) * 0.5, -1.0, (hz - h0) * 0.5));
    float cosUp = dot(normalize(rd + n * 0.25 + vec3(0.0, 0.25, 0.0)), vec3(0.0, 1.0, 0.0));
    float window = smoothstep(0.62, 0.72, cosUp);
    float lv = band((q.x - ro.x) / 14.0 + 0.5);
    float toSun = sat(dot(normalize(rd + n * 0.3), sun));
    vec3 sky = vec3(0.03, 0.3, 0.5) * (0.12 + 0.2 * uLevel) + vec3(1.0, 0.95, 0.8) * (0.5 + uLevel) * (0.9 * pow(toSun, 16.0) + 3.0 * pow(toSun, 120.0));
    sky = mix(sky, dot(sky, vec3(0.4)) * mix(uKind[3], vec3(1.0), 0.35), auMine);
    vec3 surf = sky * window * (0.3 + 1.4 * line) + surfHue * line * (0.4 + 2.0 * lv) * (1.0 - window);
    if (uOwn[7] > 0.0) { float pl = noise(q.xz * 0.8 + 4.0); surf = mix(surf, mix(uKind[1], vec3(1.0), 0.3) * (0.05 + 0.2 * pl + 0.1 * noise(q.xz * 6.0)) * (0.5 + 0.8 * uLevel) * (0.4 + window) + surf * h0 * 1.6, uOwn[7]); }
    if (hole > 0.0) { float m = length(q.xz - mouth) + 0.35 * noise(q.xz * 1.3); surf = mix(surf, surf * 0.12 + mix(uKind[3], vec3(1.0), 0.4) * (0.5 + 0.9 * uLevel) * (0.5 + 0.5 * line) * smoothstep(1.75, 1.6, m), hole); }
    float dr = length(q.xz - drop);
    surf += vec3(0.8, 0.95, 1.0) * (uHits * exp(-pow((dr - ring) * 5.0, 2.0)) + 0.6 * uCue * exp(-pow((dr - ring2) * 3.0, 2.0)));
    col += surf * exp(-top / rd.y * 0.1) * haze;
  }
  if (uOwn[6] < 0.0) { // kelp: three rows of it, the nearest darkest
    for (int k = 0; k < 3; k++) {
      float fk = float(k), n = 2.2 + 1.7 * fk, sway = 0.09 * sin(uTime * 0.23 + p.y * 2.6 + fk * 2.0) + 0.05 * sin(uTime * 0.31 - p.y * 5.0 + fk);
      float g = p.x * n + sway * (p.y + 0.8) * n * 0.6 + fk * 0.43, u = hash11(floor(g) + 17.0 * fk), f = fract(g) - 0.5 - 0.5 * (u - 0.5);
      float leaf = abs(fract(p.y * (2.6 + 1.2 * fk) + u * 7.0 + 0.5 * step(0.0, f)) - 0.5);
      float wide = 0.022 + 0.13 * smoothstep(0.42, 0.05, leaf) * (0.6 + 0.4 * sin(p.y * 3.0 + u * 20.0));
      float end = smoothstep(0.1, -0.05, p.y - (u * 1.3 - 0.35)), edge = 1.6 * n / uRes.y;
      float in_ = smoothstep(wide + edge, wide - edge, abs(f)) * step(0.2, u) * end;
      col = mix(col, col * (0.1 + 0.2 * fk) + uKind[2] * uKind[2] * (0.012 + 0.03 * auPale + 0.02 * fk), -uOwn[6] * in_);
    }
  }
  float mote = max(-uOwn[7], 0.0);
  // drifting specks catch the light
  for (int k = 0; k < 2; k++) {
    float fk = float(k), n = 26.0 + 22.0 * fk;
    vec2 g = (p + vec2(0.01 * uTime, 0.014 * uTime) * (1.0 + fk) + vec2(0.0, uTravel * 0.02)) * n, id = floor(g), f = fract(g) - 0.5;
    vec2 h = hash22(id + fk * 31.0);
    float d = length(f - (h - 0.5) * 0.8);
    col += (col + 0.01 + 0.05 * mote * uKind[3]) * step(0.93 - 0.55 * mote, h.x) * smoothstep(0.09 + 0.12 * mote * h.y, 0.0, d) * (1.5 + 3.0 * uHigh) * (0.5 + 0.5 * sin(uTime * (0.5 + h.y) + h.y * 30.0));
  }
  return col;
}
vec3 render(vec2 p) {
  auMine = sat(5.0 * (abs(uOwn[0]) + abs(uOwn[1]) + abs(uOwn[2]) + abs(uOwn[3]) + abs(uOwn[4]) + abs(uOwn[5]) + abs(uOwn[6]) + abs(uOwn[7])));
  auAmp = uOwn[1] < 0.0 ? 1.0 + uOwn[1] : 1.0 + 1.3 * uOwn[1]; auPale = max(uOwn[3], 0.0);
  return screenOf(uVar < 0.5 ? auNight(p) : auDeep(p));
}
