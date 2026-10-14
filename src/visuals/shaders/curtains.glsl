// name: Curtains
// a: Night sky
// b: Under water
// what: Curtains of light hanging over a dark shore and mirrored in still water, one curtain for each part of the spectrum; or the same light seen from under the sea, falling in rays through the surface.
// follows: Each band of the spectrum raises and brightens its own curtain, low nearest; a hit flares one stretch of a curtain; a cue runs a surge of light from left to right; under water the spectrum lies across the surface, the fuller the music the deeper the rays reach, and a hit drops a ring of light.
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
vec3 auSky(vec3 rd, float sharp) {
  vec3 col = vec3(0.0);
  float t = uTravel * 0.16;
  vec2 dir = normalize(rd.xz);
  float hitAt = 9.0 * sin(uTime * 0.17 + 2.0), surge = -26.0 + 52.0 * (1.0 - uCue);
  for (int i = 0; i < 6; i++) {
    float fi = float(i), z0 = 6.5 + 2.1 * fi * fi;
    float lv = max(max(band(fi / 6.0), band((fi + 0.4) / 6.0)), band((fi + 0.8) / 6.0));
    // where the ray meets this curtain: the curtain is z = z0 + wave(x), found by going back and forth
    float s = z0 / rd.z;
    for (int k = 0; k < 3; k++) s = mix(s, (z0 + auWave(rd.x * s, fi, t)) / rd.z, 0.8);
    vec3 q = rd * s;
    float slope = auWaveDx(q.x, fi, t);
    float facing = abs(dir.y - slope * dir.x) * inversesqrt(1.0 + slope * slope);
    float through = 1.0 / max(facing, 0.3); // seen along its fold, a curtain is brighter
    float far = 1.0 + 0.04 * z0; // far curtains have broader rays, or they would shimmer
    float rays = noise(vec2(q.x * 2.2 / far + t * 1.5 + fi * 9.0, t * 0.7));
    rays = rays * rays * (0.5 + noise(vec2(q.x * 8.0 / far - t * 3.0, fi))) * 1.9;
    rays = 0.12 + 0.88 * sat(rays);
    float ev = uHits * exp(-pow((q.x - hitAt - 2.0 * fi + 5.0) * 0.5, 2.0)) * (i == 1 || i == 3 ? 1.0 : 0.25)
             + uCue * exp(-pow((q.x - surge) * 0.22, 2.0));
    float foot = 2.1 + 0.12 * fi + (0.5 + 0.08 * z0) * (noise(vec2(q.x * 0.4 / far + fi * 3.0, t * 0.5)) - 0.5) - 0.4 * ev;
    float tall = (0.5 + 0.12 * z0) * (0.5 + 4.2 * lv + 1.5 * ev) * (0.45 + rays);
    float h = (q.y - foot) / tall;
    float body = smoothstep(-0.02, 0.02, h) * (exp(-h * 2.6) + 1.6 * exp(-h * 14.0)) * smoothstep(1.7, 0.8, h);
    float glow = (0.035 + 1.2 * lv * (0.45 + 0.7 * lv) + 1.6 * ev) * (0.35 + 0.65 * rays) * through * 0.42;
    vec3 low = i == 0 ? vec3(0.08, 1.0, 0.55) : i == 1 ? vec3(0.3, 1.0, 0.25) : i == 2 ? vec3(0.05, 0.85, 1.0) : i == 3 ? vec3(0.5, 0.3, 1.0) : i == 4 ? vec3(1.0, 0.55, 0.3) : vec3(1.0, 0.2, 0.5);
    low = mix(low, kindColour(fi * 0.75), 0.3);
    vec3 high = mix(vec3(0.45, 0.1, 0.95), vec3(0.95, 0.1, 0.3), fi / 5.0);
    vec3 c = mix(low, high, sat(h * 1.3 - 0.2)) + vec3(1.0, 0.75, 0.9) * exp(-max(h, 0.0) * 30.0) * 0.5 * ev;
    col += c * body * glow * exp(-s * 0.012) * step(0.0, rd.z);
  }
  // stars, dimmed where the curtains are bright
  vec2 sp = rd.xy / max(rd.z, 0.05);
  float st = auStars(sp, 22.0, 1.0) + 0.5 * auStars(sp * rot(0.3) + 4.0, 47.0, 3.0);
  col += vec3(0.8, 0.88, 1.0) * st * sharp * (0.6 + 0.6 * uHigh) * smoothstep(0.0, 0.08, rd.y) / (1.0 + 4.0 * dot(col, vec3(1.0)));
  return col;
}
vec3 auNight(vec2 p) {
  vec3 rd = normalize(vec3(p.x, p.y, 0.8));
  rd.yz = rot(0.36) * rd.yz; // looking up a little, so the rays lean together overhead
  vec2 flat_ = vec2(atan(rd.x, rd.z), rd.y);
  // a far shore: low black hills
  float hills = 0.012 + 0.03 * noise(vec2(flat_.x * 4.0 + 3.0, 0.5)) + 0.012 * noise(vec2(flat_.x * 13.0, 2.5));
  vec3 col;
  if (rd.y > 0.0) {
    col = auSky(rd, 1.0) * smoothstep(hills, hills + 0.004, rd.y);
  } else {
    // still water: the same sky, turned over and drawn out by slow ripples
    vec2 w = rd.xz * (0.5 / -rd.y);
    float rip = noise(vec2(w.x * 1.1, w.y * 7.0 + uTime * 0.2)) - 0.5 + 0.5 * (noise(vec2(w.x * 3.0 + 7.0, w.y * 19.0 - uTime * 0.3)) - 0.5);
    vec3 up = normalize(vec3(rd.x + rip * 0.012, -rd.y * (1.0 + rip * 0.5) + 0.002, rd.z));
    float keep = 0.25 + 0.75 * pow(1.0 - up.y, 4.0); // water mirrors best at a low angle
    col = auSky(up, 0.5) * keep * 0.85 * smoothstep(hills, hills + 0.006, up.y);
  }
  return col;
}
float auCaust(vec2 s, float t) {
  float a = noise(s * 1.1 + vec2(t * 0.35, t * 0.2)), b = noise(s * 1.9 - vec2(t * 0.25, -t * 0.3) + 5.0);
  float c = sat(1.0 - abs(a - b) * 2.6);
  return c * c * c;
}
vec3 auDeep(vec2 p) {
  const float top = 3.2;
  vec3 ro = vec3(0.0, 0.0, uTravel * 0.25);
  vec3 rd = normalize(vec3(p.x, p.y + 0.42, 0.75));
  vec3 sun = normalize(vec3(0.1, 0.64, 0.6)); // the way up to the light
  float t = uTime * 0.5;
  vec2 drop = ro.xz + vec2(1.5 * sin(uTime * 0.13), 4.5 + cos(uTime * 0.1));
  float ring = (1.0 - uHits) * 2.6, ring2 = (1.0 - uCue) * 7.0;
  float end = rd.y > 0.02 ? min(top / rd.y, 16.0) : 16.0;
  float dt = end / 28.0, s = dt * hash21(gl_FragCoord.xy);
  vec3 sum = vec3(0.0);
  for (int i = 0; i < 28; i++) {
    vec3 q = ro + rd * s;
    vec2 at = q.xz + sun.xz * (top - q.y) / sun.y; // where this water's light came in through the surface
    float across = (at.x - ro.x) / 14.0 + 0.5;
    float lv = band(across);
    float c = auCaust(at, t); c = c * c * (0.05 + 1.1 * lv);
    float dr = length(at - drop);
    c += 1.1 * uHits * exp(-pow((dr - ring) * 3.0, 2.0)) + 0.7 * uCue * exp(-pow((dr - ring2) * 1.6, 2.0)) / (1.0 + 0.3 * ring2);
    float depth = top - q.y;
    vec3 hue = mix(vec3(0.1, 0.75, 0.85), kindColour(across * 4.0), 0.6);
    hue = mix(hue * hue * hue * 2.6, vec3(0.01, 0.12, 0.6), sat(depth * 0.22));
    float left = sat(1.0 - depth / (2.0 + 1.3 * uLevel)); // the fuller the music, the deeper the light gets
    sum += hue * c * left * left * exp(-s * 0.2) * dt;
    s += dt;
  }
  vec3 col = sum * 2.6;
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
    vec3 surf = sky * window * (0.3 + 1.4 * line) + vec3(0.05, 0.35, 0.5) * line * (0.4 + 2.0 * lv) * (1.0 - window);
    float dr = length(q.xz - drop);
    surf += vec3(0.8, 0.95, 1.0) * (uHits * exp(-pow((dr - ring) * 5.0, 2.0)) + 0.6 * uCue * exp(-pow((dr - ring2) * 3.0, 2.0)));
    col += surf * exp(-top / rd.y * 0.1);
  }
  // drifting specks catch the light
  for (int k = 0; k < 2; k++) {
    float fk = float(k), n = 26.0 + 22.0 * fk;
    vec2 g = (p + vec2(0.01 * uTime, 0.014 * uTime) * (1.0 + fk) + vec2(0.0, uTravel * 0.02)) * n, id = floor(g), f = fract(g) - 0.5;
    vec2 h = hash22(id + fk * 31.0);
    float d = length(f - (h - 0.5) * 0.8);
    col += (col + 0.01) * step(0.93, h.x) * smoothstep(0.09, 0.0, d) * (1.5 + 3.0 * uHigh) * (0.5 + 0.5 * sin(uTime * (0.5 + h.y) + h.y * 30.0));
  }
  return col;
}
vec3 render(vec2 p) {
  return screenOf(uVar < 0.5 ? auNight(p) : auDeep(p));
}
