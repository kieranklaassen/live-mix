// name: Lit cloud
// a: Deep space
// b: Window light
// what: A slow flight through glowing cloud among stars, each cloud lit in the colour of one kind of sound; or a dark smoky room where the piece is a window of coloured glass, throwing its shafts of light down through the smoke to the floor.
// follows: Each kind of sound lights its own cloud as far as it is loud; a hit is lightning deep in the cloud, a cue a ring of light spreading through it; in the room each sound is a pane that brightens as it plays, and the smoke thickens with the mix.
// own: 0 1 many small clouds (b: many small panes), -1 a few vast ones (b: a few great panes); 1 1 broad pale day behind the cloud (b: a limewashed room), -1 dusk over a dark sea (b: a room of the drone's colour with a wet floor); 2 1 drawn out in level bands (b: tall slits for windows), -1 drawn up into pillars (b: one round window); 3 1 cut flat with hard edges (b: clean blades of light), -1 combed into fine wisps (b: thick rolling smoke); 4 1 a great sun ahead, behind the cloud (b: the light falls steeply), -1 lit from above with no star inside (b: the light comes level at us); 5 1 the cloud is a floor seen from over it (b: the eye close under the window), -1 a ceiling seen from below (b: far down the room); 6 moves upward at 1, sideways at -1 (b: the light slants to one side, or the other); 7 1 dark ridges along the foot (b: two rows of pillars), -1 snow falls through it
float nbLevel(float k) {
  float l[5] = float[5](uDrone, uPad, uTexture, uPhrase, uHits);
  k = clamp(k, 0.0, 4.0); int i = int(floor(k));
  return mix(l[i], l[min(i + 1, 4)], fract(k));
}
vec3 nbDeep(vec3 c) { return c * c * c * 3.0 + c * 0.06; } // the piece's colours, richer, for light
float nbStars(vec2 p, float n, float seed) {
  vec2 g = p * n, id = floor(g), f = fract(g) - 0.5;
  vec2 h = hash22(id + seed);
  float d = length(f - (h - 0.5) * 0.7);
  float b = pow(h.x, 16.0) * (0.75 + 0.25 * sin(uTime * (0.6 + 2.0 * h.y) + h.y * 40.0));
  return b * smoothstep(0.07, 0.0, d) * 3.0 + b * b * 0.006 / (d * d * 30.0 + 0.01);
}
// The sky past all the cloud: pale day, or dusk with the sea under it.
vec3 nbSky(vec2 s) {
  vec3 hi = uKind[0] * uKind[0], mi = mix(uKind[1], uKind[2], 0.5);
  mi *= mi;
  vec3 day = mix(mix(vec3(1.0, 0.97, 0.92), mi, 0.55) * 1.2, hi * 0.6, smoothstep(-0.4, 0.42, s.y));
  float y = s.y + 0.16, up = abs(y);
  vec3 dusk = mix(mi * 1.25, hi * 0.16, smoothstep(0.0, 0.62, sqrt(up + 0.0004))) + uKind[3] * uKind[3] * 0.6 * exp(-up * 9.0) * exp(-s.x * s.x * 1.4);
  if (y < 0.0) dusk *= 0.5 + 0.16 * noise(vec2(s.x * 2.0 / (up + 0.03), log2(up + 0.012) * 9.0 + uTime * 0.12)) ;
  return (uOwn[1] > 0.0 ? day : dusk) * abs(uOwn[1]) * (0.68 + 0.5 * uLevel);
}
// What stands or falls in front: ridges along the foot (w), or snow.
float nbSnow(vec2 p, float n, float fall) {
  vec2 g = vec2(p.x, p.y + fall) * n; g.x += 0.35 * sin(g.y * 0.4 + uTime * 0.2);
  vec2 id = floor(g), h = hash22(id + 11.0), f = fract(g) - 0.5 - 0.6 * (h - 0.5);
  return smoothstep(0.1 + 0.08 * h.x, 0.02, length(f)) * step(0.45, fract(h.x * 7.3 + h.y));
}
// Cloud in one sheet of space: curled noise, fine enough to have edges.
float nbCloud(vec2 x) {
  vec2 w = vec2(noise(x * 0.9 + 3.1), noise(x * 0.9 + 17.7)) - 0.5;
  x += w * 1.5;
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { s += a * noise(x); x = rot(0.6) * x * 2.1 + 5.3; a *= 0.5; }
  return s / 0.94;
}
vec3 nbSpace(vec2 p) {
  float on_ = uTravel * 0.5, tr = on_ * (1.0 - 0.9 * abs(uOwn[6]));
  vec2 side = on_ * 0.45 * vec2(max(-uOwn[6], 0.0), -max(uOwn[6], 0.0));
  vec3 ro = vec3(0.6 * sin(tr * 0.11), 0.4 * cos(tr * 0.14), tr);
  vec2 drawn = exp2(uOwn[0] * (uOwn[0] > 0.0 ? 1.1 : 0.9) + vec2(-1.35, 0.75) * max(uOwn[2], 0.0) + vec2(0.85, -1.3) * max(-uOwn[2], 0.0));
  float hard = max(uOwn[3], 0.0), wisp = max(-uOwn[3], 0.0), sun = max(uOwn[4], 0.0), above = max(-uOwn[4], 0.0), day = max(uOwn[1], 0.0), dusk = max(-uOwn[1], 0.0);
  vec3 rd = normalize(vec3(p * rot(0.15 * sin(uTime * 0.04) * (1.0 - 0.9 * max(max(abs(uOwn[5]), abs(uOwn[1])), uOwn[7]))) + vec2(0.07 * cos(tr * 0.11), -0.05 * sin(tr * 0.14)), 0.95));
  vec2 slope = rd.xy / rd.z;
  const float gap = 1.2;
  float first = floor(tr / gap) + 1.0;
  float thr = 0.665 - 0.025 * uLevel;
  // a star inside the cloud lights it from within; one every seven units along the way
  float cell = floor((tr + 1.0) / 7.0);
  vec3 star = vec3(1.6 * (hash11(cell) - 0.5), 1.2 * (hash11(cell + 7.7) - 0.5), cell * 7.0 + 4.6);
  vec3 star2 = vec3(1.6 * (hash11(cell + 1.0) - 0.5), 1.2 * (hash11(cell + 8.7) - 0.5), cell * 7.0 + 11.6);
  // lightning: a place ahead that drifts slowly, so each hit falls in other cloud
  vec2 bolt = vec2(0.5 * sin(uTime * 0.11 + 1.0), 0.24 * cos(uTime * 0.13)); // where on the sky; it lights the far cloud there, behind the near
  vec3 hitCol = mix(vec3(1.0, 0.85, 0.8), nbDeep(uKind[4]), 0.5);
  float shell = (1.0 - uCue) * 0.9;
  vec2 sd = slope - bolt; float lb = dot(sd, sd);
  vec3 sky = vec3(0.0);
  if (uOwn[1] != 0.0) sky = nbSky(slope);
  vec2 sunAt = slope - vec2(0.2, 0.1 - 0.17 * dusk * sun);
  float sunR = 0.05 + 0.115 * sun, sunI = min(sun * 2.0, 1.0);
  sunI *= mix(1.0, smoothstep(-0.165, -0.155, slope.y), dusk);
  float sunD = length(sunAt);
  vec3 sunCol = mix(vec3(1.0, 0.93, 0.82), uKind[3], 0.45); sunCol *= sunCol;
  star.xy += side; star2.xy += side; ro.xy += side;
  float T = 1.0;
  vec3 sum = vec3(0.0);
  for (int i = 0; i < 10; i++) {
    float id = first + float(i), dz = id * gap - tr;
    vec3 q = vec3(ro.xy + slope * dz, id * gap);
    float seed = hash11(id * 3.7);
    vec2 qd = q.xy * drawn;
    float body = noise(vec3(qd, q.z) * 0.34); // the big shapes run on from sheet to sheet
    float d = 0.0;
    float at = thr - 0.06 * max(day, 0.6 * dusk);
    if (uOwn[5] != 0.0) at += 0.34 * abs(uOwn[5]) * (smoothstep(-0.75, 0.35, (q.y - ro.y) * sign(uOwn[5]) + 0.35) - 0.45);
    float form = 0.0;
    if (body > at - 0.17) {
      vec2 cq = qd * 0.55 + seed * 40.0 + uTime * 0.004;
      form = nbCloud(cq);
      if (wisp > 0.0) form = mix(form, 0.5 * form + 0.5 * noise(vec2(cq.x * 1.3 + form * 2.0, cq.y * 13.0 + form * 9.0)), wisp);
      form = body * 0.62 + 0.38 * form;
      d = smoothstep(at + 0.02 * hard, at + 0.2 - 0.175 * hard, form);
    }
    d *= smoothstep(0.8 * gap, 4.5 * gap, dz) * smoothstep(10.0 * gap, 8.2 * gap, dz); // a sheet melts away as we reach it, and comes out of the dark far off
    if (d > 0.003) {
      float k = sat((noise(vec2(q.x * 0.42 + q.z * 0.17, q.y * 0.42 - q.z * 0.13) + 40.0) - 0.28) * 2.3) * 3.0; // which kind of sound owns this cloud: drone to phrase
      vec3 hue = nbDeep(kindColour(k));
      float thin = 1.0 - 0.85 * smoothstep(0.35, 1.0, d); // thick cloud is dark dust
      vec3 ds = star - q, ds2 = star2 - q;
      float l1 = dot(ds, ds), l2 = dot(ds2, ds2);
      float rim = thin;
      vec3 light = hue * (0.02 + 0.85 * nbLevel(k)) * thin;
      light += mix(vec3(0.85, 0.92, 1.0), hue, 0.5) * (0.3 + 0.4 * uLevel) * thin * (1.0 / (l1 * 1.3 + 0.2) + 1.0 / (l2 * 1.3 + 0.2));
      float deep = smoothstep(2.5, 5.5, dz);
      if (above > 0.0) light *= 1.0 - 0.75 * above;
      if (hard > 0.0) light = mix(light, hue * (0.16 + 0.75 * nbLevel(k)) * (0.55 + 0.9 * smoothstep(0.1, 0.0, form - at) + 0.3 * smoothstep(0.02, 0.2, form - at)), hard * (1.0 - 0.6 * day));
      float top = 0.5;
      if (above + day + dusk + abs(uOwn[5]) > 0.0) top = sat(0.5 + 4.2 * (body - noise(vec3(qd + vec2(0.1, 0.75), q.z) * 0.34)));
      vec3 soft = kindColour(k); soft *= soft;
      light += above * soft * (0.02 + 2.2 * top * top * top) * (0.35 + 0.9 * nbLevel(k));
      if (day > 0.0) light = mix(light, mix(vec3(1.0), soft * 1.2, 0.2 + 0.7 * nbLevel(k)) * mix(0.2, 2.6, smoothstep(0.05, 0.95, top)) * mix(0.7, 1.05, thin) * (0.5 + 0.35 * uLevel + 0.45 * nbLevel(k)), day);
      if (uOwn[5] != 0.0) light *= mix(1.0, 0.25 + 1.6 * top, abs(uOwn[5]) * (1.0 - day));
      if (dusk > 0.0) light = light * mix(1.0, 0.8, dusk) + dusk * (sky * 0.35 + soft * uKind[2] * 0.5 * (1.0 - top) * (0.4 + nbLevel(k)));
      light += sunI * sunCol * (0.2 + 1.5 * thin) * exp(-sunD * 3.2) * (0.6 + 0.6 * uLevel);
      light += hitCol * deep * (0.3 + 0.7 * thin) * (uHits * 7.0 * exp(-lb * 11.0) + uCue * 2.2 * exp(-pow((sqrt(lb) - shell) * 6.0, 2.0)));
      light *= exp(-dz * 0.07);
      if (uOwn[1] != 0.0) light = mix(light, mix(sky * 0.95, light * exp(dz * 0.07), exp(-dz * (0.1 - 0.02 * hard))), max(day, 0.7 * dusk));
      float a = d * mix(0.45, 0.9, smoothstep(2.5, 6.5, dz));
      a = mix(a, d * mix(0.75, 0.97, smoothstep(1.5, 3.0, dz)), max(hard, 0.5 * day));
      sum += T * a * light;
      T *= 1.0 - a;
      if (T < 0.03) break;
    }
  }
  // the lightning's own core, and the stars inside, seen through whatever cloud is in front
  vec3 col = sum;
  col += hitCol * uHits * 0.012 / (lb + 0.006) * T;
  vec3 v = star - ro; float along = dot(v, rd), perp = dot(v, v) - along * along;
  float lamps = (1.0 - above) * (1.0 - 0.85 * dusk) * (1.0 - 0.8 * day);
  col += lamps * vec3(0.8, 0.9, 1.0) * 0.004 / (perp + 0.0015) * (0.25 + 0.75 * T) * smoothstep(0.3, 2.0, along);
  v = star2 - ro; along = dot(v, rd); perp = dot(v, v) - along * along;
  col += lamps * vec3(1.0, 0.9, 0.8) * 0.004 / (perp + 0.0015) * (0.25 + 0.75 * T);
  float st = nbStars(slope + 3.0, 14.0, 1.0) + 0.6 * nbStars(slope * rot(0.4) + 9.0, 31.0, 5.0);
  col += T * st * vec3(0.85, 0.92, 1.0) * (0.7 + 0.6 * uHigh) * (1.0 - day) * (1.0 - 0.8 * dusk * smoothstep(0.35, -0.1, slope.y)) * (1.0 - dusk * smoothstep(-0.1, -0.2, slope.y)) * (1.0 - smoothstep(sunR * 2.0, sunR * 0.95, sunD) * sunI);
  col += T * sky;
  if (sun > 0.0) col += sunI * (0.06 + 0.94 * T * T) * sunCol * (1.5 * smoothstep(sunR + 0.004, sunR - 0.004, sunD) + 0.3 * exp(-sunD * 5.0)) * (0.75 + 0.35 * uLevel);
  if (uOwn[7] > 0.0) {                            // two ridges of trees, the far one in the air between
    float x = p.x * 1.1 + 0.15 * side.x;
    vec3 pale = mix(uKind[0] * uKind[0] * 0.05, sky * 0.45, max(day, dusk));
    float tx = x * 34.0, th = hash11(floor(tx) + 3.0), tv = abs(fract(tx) - 0.5) * 2.0, tx2 = x * 23.0 + 0.4, th2 = hash11(floor(tx2) + 51.0), tv2 = abs(fract(tx2) - 0.5) * 2.0;
    float tree = max(0.085 * (0.3 + th) * (1.0 - tv) * (0.55 + 0.45 * (1.0 - tv)), 0.11 * (0.2 + th2) * (1.0 - tv2) * (1.0 - 0.5 * tv2));
    float far = -0.36 + 0.17 * noise(vec2(x * 2.1, 9.0)) + 0.03 * noise(vec2(x * 11.0, 4.0)) - p.y, near = -0.52 + 0.2 * noise(vec2(x * 1.3 + 5.0, 1.0)) + tree - p.y;
    col = mix(col, pale + sum * 0.2, smoothstep(0.0, 0.004, far) * uOwn[7] * (1.0 - 0.5 * smoothstep(0.0, 0.25, far) * max(day, dusk)));
    col = mix(col, uKind[0] * uKind[0] * mix(0.02, 0.07, day) + pale * 0.04, smoothstep(0.0, 0.004, near) * uOwn[7]);
  }
  if (uOwn[7] < 0.0) {
    float fl = nbSnow(p, 7.0, uTime * 0.1) + 0.8 * nbSnow(p + 3.3, 15.0, uTime * 0.075) + 0.5 * nbSnow(p + 8.1, 29.0, uTime * 0.05);
    col = mix(col, vec3(0.5) * mix(0.35 + uLevel, 3.4, day) + sum * 0.8, sat(fl) * -uOwn[7] * 0.8);
  }
  return col;
}
vec2 nbMany;
float nbSmoke(vec3 q, float drift) {
  vec3 s = q * vec3(1.0, 0.6, 1.0) + vec3(0.3 * drift, -drift, 0.1 * drift) * (1.0 - abs(uOwn[6])) + drift * 2.0 * vec3(-min(uOwn[6], 0.0), -max(uOwn[6], 0.0), 0.0);
  float warp = 0.5 + 0.5 * sin(s.x * 0.9 + 1.7 * sin(s.y * 0.7 + s.z * 0.5)); // a cheap curl
  float n = noise(s * 1.3 + warp * 2.2) * 0.62 + 0.38 * noise(s * 3.4 - warp * 3.0);
  float m = pow(sat(n * 1.7 - 0.38), 2.0);
  return mix(m, uOwn[3] > 0.0 ? 0.13 : 1.9 * smoothstep(0.5, 0.78, n), abs(uOwn[3]));
}
// The window: the piece as coloured glass, in panes. w is the place on the back wall.
vec3 nbGlass(vec2 w, float soft) {
  vec2 uv = vec2((w.x + 4.0) / 8.0, (3.9 - w.y) / 3.6);
  vec4 m = piece(uv);
  vec2 pane = abs(fract(uv * vec2(16.0, 9.0) * nbMany) - 0.5);
  soft *= 1.0 - 0.85 * max(uOwn[3], 0.0);
  float open_ = 1.0;
  if (uOwn[2] > 0.0) { float sx = abs(fract(w.x * 0.625 + 0.5) - 0.5), head = 3.75 - 3.2 * sx * sx * 4.0; open_ = mix(1.0, smoothstep(0.25, 0.22 - 0.1 * soft, sx) * smoothstep(0.0, -0.1, w.y - head), uOwn[2]); }
  if (uOwn[2] < 0.0) { vec2 c = w - vec2(0.0, 2.1); float r = length(c); open_ = mix(1.0, smoothstep(1.85, 1.8 - 0.25 * soft, r), -uOwn[2]);
    pane = mix(pane, abs(fract(vec2(r * 1.7 * nbMany.y, atan(c.y, c.x + 1e-5) / TAU * 12.0)) - 0.5), step(0.5, -uOwn[2])); }
  float bars = mix(smoothstep(0.5, 0.38, pane.x) * smoothstep(0.5, 0.36, pane.y), 0.55 + 0.45 * cos(pane.x * TAU) * cos(pane.y * TAU), soft);
  vec3 hue = m.rgb / max(m.a, 0.02);
  vec3 c = nbDeep(hue) * m.a * (0.25 + m.a) * bars;
  if (uOwn[2] < 0.0 || uOwn[2] > 0.0) c = (c + abs(uOwn[2]) * bars * 0.05 * uKind[1] * step(0.0, uv.y) * step(uv.y, 1.0)) * open_;
  return c;
}
vec3 nbRoom(vec2 p) {
  float near = max(uOwn[5], 0.0), away = max(-uOwn[5], 0.0), pale = max(uOwn[1], 0.0), wet = max(-uOwn[1], 0.0);
  nbMany = vec2(exp2(uOwn[0]));
  vec3 ro = vec3(0.6 * sin(uTime * 0.06), -0.6, 0.0);
  vec3 rd = normalize(vec3(p.x, p.y + 0.2, 0.85));
  ro += vec3(-1.6 * near, -0.6 * near + 0.5 * away, 2.2 * near - 4.2 * away);
  if (uOwn[5] != 0.0) { rd = normalize(vec3(p.x + 0.38 * near, p.y + 0.2 + 0.42 * near - 0.13 * away, 0.85 + 0.1 * away)); }
  float drift = uTravel * 0.2;
  vec3 ld = normalize(vec3(0.2 * sin(uTime * 0.04) + 0.75 * uOwn[6], -0.62 - 0.55 * max(uOwn[4], 0.0) + 0.4 * max(-uOwn[4], 0.0), -1.0)); // the way the light travels: in at the window, down and toward us
  float wallT = (7.0 - ro.z) / rd.z;
  float floorT = rd.y < -0.001 ? (-1.7 - ro.y) / rd.y : 1e3;
  float far = min(wallT, floorT), sideT = 1e3, roofT = 1e3;
  float post = 0.0; vec3 pn = vec3(0.0);
  if (uOwn[1] != 0.0) {
    sideT = (5.4 * sign(rd.x) - ro.x) / (abs(rd.x) > 1e-4 ? rd.x : 1e-4);
    roofT = rd.y > 1e-3 ? (5.0 - ro.y) / rd.y : 1e3;
    far = min(far, min(sideT, roofT));
  }
  if (uOwn[7] > 0.0) {                            // two rows of pillars
    for (int i = 0; i < 8; i++) {
      vec2 c = vec2((i & 1) == 0 ? -2.6 : 2.6, 6.2 - 1.75 * float(i >> 1)) - ro.xz, dir = rd.xz;
      float a = dot(dir, dir), b = dot(c, dir), r = 0.4 * uOwn[7], disc = b * b - a * (dot(c, c) - r * r);
      if (disc > 0.0) { float tp = (b - sqrt(disc)) / a; if (tp > 0.0 && tp < far) { far = tp; post = 1.0; pn = vec3((dir * tp - c) / r, 0.0); } }
    }
  }
  float phase = 0.3 + 1.2 * pow(sat(dot(rd, -ld)), 3.0);
  float jit = hash21(gl_FragCoord.xy);
  if (abs(uOwn[0]) + abs(uOwn[1]) + abs(uOwn[2]) + abs(uOwn[3]) + abs(uOwn[4]) + abs(uOwn[5]) + abs(uOwn[6]) + abs(uOwn[7]) > 0.0) jit = fract(52.983 * fract(dot(gl_FragCoord.xy, vec2(0.06711, 0.00584)))); // a finer grain
  float dt = far / 26.0, t = dt * jit, T = 1.0;
  vec3 sum = vec3(0.0);
  for (int i = 0; i < 26; i++) {
    vec3 q = ro + rd * t;
    float back = (7.0 - q.z) / -ld.z; // how far this light has come from the window
    vec3 glass = nbGlass(q.xy - ld.xy * back, 1.0);
    if (glass.r + glass.g + glass.b > 0.003) {
      float dens = 0.05 + 2.6 * nbSmoke(q, drift) * (0.6 + 0.6 * uLevel);
      sum += glass * dens * dt * exp(-back * 0.05);
    }
    t += dt;
  }
  vec3 col = sum * phase * (1.6 - 0.7 * uLevel);
  if (uOwn[1] != 0.0 || post > 0.0) {
    // the room itself, as its walls have the light that has come in
    vec3 h = ro + rd * far, wash = mix(vec3(0.92, 0.89, 0.83), uKind[0], mix(0.22, 0.85, wet)); wash *= wash;
    float at = mix(0.4, 1.25, smoothstep(-2.5, 7.0, h.z)) * mix(1.0, 0.5, wet) * mix(0.75, 1.0, smoothstep(5.0, -1.7, h.y));
    float face = far == floorT ? 1.1 : far == roofT ? 0.62 : far == sideT ? 0.78 : 0.9;
    float corner = min(min(5.4 - abs(h.x), 7.05 - h.z), min(h.y + 1.7, 5.0 - h.y));
    float ao = 1.0 - 0.35 * exp(-max(corner, 0.0) * 1.6);
    if (post > 0.0) { face = 0.35 + 0.65 * sat(0.5 + 0.5 * pn.y) + 0.12 * pn.x * sign(h.x); ao = 1.0; }
    vec3 room = wash * at * face * ao * (pale * 1.15 * (0.8 + 0.3 * uLevel) + wet * 0.17 * (0.4 + uLevel) + 0.05);
    if (far == floorT && post < 0.5) room *= 1.0 - 0.16 * smoothstep(0.46, 0.495, abs(fract(h.x * 0.9) - 0.5)) - 0.12 * (hash11(floor(h.x * 0.9 + 0.5)) - 0.5);
    col *= 1.0 - 0.45 * pale * (1.0 - wet);
    room *= 0.95 + 0.08 * noise(h.xz * 3.0 + h.y * 4.0);
    col += room;
    if (post > 0.0) { float back = (7.0 - h.z) / -ld.z; col += nbGlass(h.xy - ld.xy * back, 1.0) * max(pn.y, 0.0) * 0.5; }
  }
  vec3 q = ro + rd * far;
  if (wallT < floorT) { vec3 pane = nbGlass(q.xy, 0.0); col += pane * 1.6 * (far == wallT ? 1.0 : 0.0);
    if (pale > 0.0 && far == wallT) col += pane * 1.0; } // the window itself
  else if (far == floorT) { float back = (7.0 - q.z) / -ld.z; col += nbGlass(q.xy - ld.xy * back, 0.0) * 0.4 * exp(-back * 0.05) * (0.7 + 0.3 * noise(vec2(q.x * 7.0, q.z * 0.6)));
    if (wet > 0.0) { vec3 up = vec3(rd.x, -rd.y, rd.z); up.x += 0.03 * (noise(q.xz * vec2(3.0, 7.0) + uTime * 0.2) - 0.5); vec3 m = q + up * ((7.0 - q.z) / max(up.z, 0.05)); col += wet * nbGlass(m.xy, 0.2) * 0.75; } }
  return col;
}
vec3 render(vec2 p) {
  vec3 c = uVar < 0.5 ? nbSpace(p) : nbRoom(p);
  if (uVar > 0.5 && uOwn[7] < 0.0) {
    float fl = nbSnow(p, 6.0, uTime * 0.07) + 0.8 * nbSnow(p + 3.3, 13.0, uTime * 0.055) + 0.5 * nbSnow(p + 8.1, 27.0, uTime * 0.04);
    c += sat(fl) * -uOwn[7] * (c * 1.6 + 0.04 * (1.0 + 4.0 * max(uOwn[1], 0.0)));
  }
  return screenOf(c);
}
