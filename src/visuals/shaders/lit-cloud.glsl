// name: Lit cloud
// a: Deep space
// b: Window light
// what: A slow flight through glowing cloud among stars, each cloud lit in the colour of one kind of sound; or a dark smoky room where the piece is a window of coloured glass, throwing its shafts of light down through the smoke to the floor.
// follows: Each kind of sound lights its own cloud as far as it is loud; a hit is lightning deep in the cloud, a cue a ring of light spreading through it; in the room each sound is a pane that brightens as it plays, and the smoke thickens with the mix.
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
// Cloud in one sheet of space: curled noise, fine enough to have edges.
float nbCloud(vec2 x) {
  vec2 w = vec2(noise(x * 0.9 + 3.1), noise(x * 0.9 + 17.7)) - 0.5;
  x += w * 1.5;
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { s += a * noise(x); x = rot(0.6) * x * 2.1 + 5.3; a *= 0.5; }
  return s / 0.94;
}
vec3 nbSpace(vec2 p) {
  float tr = uTravel * 0.5;
  vec3 ro = vec3(0.6 * sin(tr * 0.11), 0.4 * cos(tr * 0.14), tr);
  vec3 rd = normalize(vec3(p * rot(0.15 * sin(uTime * 0.04)) + vec2(0.07 * cos(tr * 0.11), -0.05 * sin(tr * 0.14)), 0.95));
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
  float T = 1.0;
  vec3 sum = vec3(0.0);
  for (int i = 0; i < 10; i++) {
    float id = first + float(i), dz = id * gap - tr;
    vec3 q = vec3(ro.xy + slope * dz, id * gap);
    float seed = hash11(id * 3.7);
    float body = noise(q * 0.34); // the big shapes run on from sheet to sheet
    float d = 0.0;
    if (body > thr - 0.17) d = smoothstep(thr, thr + 0.2, body * 0.62 + 0.38 * nbCloud(q.xy * 0.55 + seed * 40.0 + uTime * 0.004));
    d *= smoothstep(0.8 * gap, 4.5 * gap, dz) * smoothstep(10.0 * gap, 8.2 * gap, dz); // a sheet melts away as we reach it, and comes out of the dark far off
    if (d > 0.003) {
      float k = sat((noise(vec2(q.x * 0.42 + q.z * 0.17, q.y * 0.42 - q.z * 0.13) + 40.0) - 0.28) * 2.3) * 3.0; // which kind of sound owns this cloud: drone to phrase
      vec3 hue = nbDeep(kindColour(k));
      float thin = 1.0 - 0.85 * smoothstep(0.35, 1.0, d); // thick cloud is dark dust
      vec3 ds = star - q, ds2 = star2 - q;
      float l1 = dot(ds, ds), l2 = dot(ds2, ds2);
      vec3 light = hue * (0.02 + 0.85 * nbLevel(k)) * thin;
      light += mix(vec3(0.85, 0.92, 1.0), hue, 0.5) * (0.3 + 0.4 * uLevel) * thin * (1.0 / (l1 * 1.3 + 0.2) + 1.0 / (l2 * 1.3 + 0.2));
      float deep = smoothstep(2.5, 5.5, dz);
      light += hitCol * deep * (0.3 + 0.7 * thin) * (uHits * 7.0 * exp(-lb * 11.0) + uCue * 2.2 * exp(-pow((sqrt(lb) - shell) * 6.0, 2.0)));
      light *= exp(-dz * 0.07);
      float a = d * mix(0.45, 0.9, smoothstep(2.5, 6.5, dz));
      sum += T * a * light;
      T *= 1.0 - a;
      if (T < 0.03) break;
    }
  }
  // the lightning's own core, and the stars inside, seen through whatever cloud is in front
  vec3 col = sum;
  col += hitCol * uHits * 0.012 / (lb + 0.006) * T;
  vec3 v = star - ro; float along = dot(v, rd), perp = dot(v, v) - along * along;
  col += vec3(0.8, 0.9, 1.0) * 0.004 / (perp + 0.0015) * (0.25 + 0.75 * T) * smoothstep(0.3, 2.0, along);
  v = star2 - ro; along = dot(v, rd); perp = dot(v, v) - along * along;
  col += vec3(1.0, 0.9, 0.8) * 0.004 / (perp + 0.0015) * (0.25 + 0.75 * T);
  float st = nbStars(slope + 3.0, 14.0, 1.0) + 0.6 * nbStars(slope * rot(0.4) + 9.0, 31.0, 5.0);
  col += T * st * vec3(0.85, 0.92, 1.0) * (0.7 + 0.6 * uHigh);
  return col;
}
float nbSmoke(vec3 q, float drift) {
  vec3 s = q * vec3(1.0, 0.6, 1.0) + vec3(0.3 * drift, -drift, 0.1 * drift);
  float warp = 0.5 + 0.5 * sin(s.x * 0.9 + 1.7 * sin(s.y * 0.7 + s.z * 0.5)); // a cheap curl
  float n = noise(s * 1.3 + warp * 2.2) * 0.62 + 0.38 * noise(s * 3.4 - warp * 3.0);
  return pow(sat(n * 1.7 - 0.38), 2.0);
}
// The window: the piece as coloured glass, in panes. w is the place on the back wall.
vec3 nbGlass(vec2 w, float soft) {
  vec2 uv = vec2((w.x + 4.0) / 8.0, (3.9 - w.y) / 3.6);
  vec4 m = piece(uv);
  vec2 pane = abs(fract(uv * vec2(16.0, 9.0)) - 0.5);
  float bars = mix(smoothstep(0.5, 0.38, pane.x) * smoothstep(0.5, 0.36, pane.y), 0.55 + 0.45 * cos(pane.x * TAU) * cos(pane.y * TAU), soft);
  vec3 hue = m.rgb / max(m.a, 0.02);
  return nbDeep(hue) * m.a * (0.25 + m.a) * bars;
}
vec3 nbRoom(vec2 p) {
  vec3 ro = vec3(0.6 * sin(uTime * 0.06), -0.6, 0.0);
  vec3 rd = normalize(vec3(p.x, p.y + 0.2, 0.85));
  float drift = uTravel * 0.2;
  vec3 ld = normalize(vec3(0.2 * sin(uTime * 0.04), -0.62, -1.0)); // the way the light travels: in at the window, down and toward us
  float wallT = (7.0 - ro.z) / rd.z;
  float floorT = rd.y < -0.001 ? (-1.7 - ro.y) / rd.y : 1e3;
  float far = min(wallT, floorT);
  float phase = 0.3 + 1.2 * pow(sat(dot(rd, -ld)), 3.0);
  float dt = far / 26.0, t = dt * hash21(gl_FragCoord.xy), T = 1.0;
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
  vec3 q = ro + rd * far;
  if (wallT < floorT) col += nbGlass(q.xy, 0.0) * 1.6; // the window itself
  else { float back = (7.0 - q.z) / -ld.z; col += nbGlass(q.xy - ld.xy * back, 0.0) * 0.4 * exp(-back * 0.05) * (0.7 + 0.3 * noise(vec2(q.x * 7.0, q.z * 0.6))); }
  return col;
}
vec3 render(vec2 p) {
  return screenOf(uVar < 0.5 ? nbSpace(p) : nbRoom(p));
}
