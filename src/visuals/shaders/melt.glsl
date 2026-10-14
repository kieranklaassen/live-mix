// name: Melt
// a: Mercury table
// b: Wax wall
// what: The piece as beads of liquid metal on a dark table, the loop across and the room going away from you; where it is loud the beads swell and run together into pools.
// follows: The piece sets each bead's size and colour, a crest stands where the loop is now, the low band deepens the swell, a hit sends a ring through that makes beads jump and join.
vec2 NG;           // how many beads across and deep
float ringAt;      // how far the ring of a hit has got, in beads
// The liquid at a place of the grid: its edge (below 0 is inside), which way the edge faces, its colour, bead size and loudness.
float liquid(vec2 g, out vec2 grad, out vec3 hue, out float rad, out float loud) {
  vec2 id0 = floor(g);
  float d = 1e3; grad = vec2(0.0); hue = vec3(0.0); rad = 0.1; loud = 0.0;
  float k = 0.34;
  float kick = sat(uHits * 1.3) + 0.5 * uCue;
  vec2 hitAt = vec2(uLoop * NG.x, 0.3 * NG.y);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 id = id0 + vec2(float(i), float(j));
    vec2 uv = (id + 0.5) / NG;
    vec4 m = piece(uv);
    float a = sat(m.a * (0.65 + 0.6 * uEnergy));
    float h1 = hash21(id), h2 = hash21(id + 31.7);
    // each bead drifts a little and breathes with the low band
    vec2 c = id + 0.5 + (0.05 + 0.1 * a) * vec2(sin(uTime * (0.5 + 0.5 * h1) + h1 * 40.0), cos(uTime * (0.45 + 0.5 * h2) + h2 * 40.0));
    float ring = length(c - hitAt) - ringAt;
    float jolt = kick * exp(-ring * ring * 0.3);
    float swell = sin(c.x * 0.55 + c.y * 0.3 - uTravel * 1.6);          // a slow swell runs through the liquid
    float now = exp(-pow((c.x - uLoop * NG.x) * 0.45, 2.0));            // and a crest stands where the loop is now
    float r = 0.07 + 0.66 * pow(a, 0.75) * (0.9 + (0.07 + 0.16 * uLow) * swell + 0.12 * now) + 0.035 * now + 0.3 * jolt;
    r *= step(-0.5, id.x) * step(id.x, NG.x - 0.5) * step(-0.5, id.y) * step(id.y, NG.y - 0.5) * 0.999 + 0.001;
    vec2 v = g - c;
    float di = (dot(v, v) - r * r) / (2.0 * r);   // a bowl, not a cone: smooth at the middle
    vec2 gi = v / r;
    vec3 hi = m.a > 0.004 ? m.rgb / m.a : vec3(0.55, 0.6, 0.66);
    hi = pow(hi, vec3(1.5)) * 1.25;                  // the piece's colours, a little deeper
    hi = mix(hi, uKind[4] * 1.3, sat(jolt * 0.7));
    float h = sat(0.5 + 0.5 * (di - d) / k);      // the smooth minimum, carrying the rest along with it
    d = mix(di, d, h) - k * h * (1.0 - h);
    grad = mix(gi, grad, h); hue = mix(hi, hue, h); rad = mix(r, rad, h); loud = mix(a + jolt, loud, h);
  }
  return d;
}
// What a bead of mercury mirrors: one broad soft lamp ahead and above, a line of the piece's own colour low all round,
// and the table's glow from underneath.
vec3 room(vec3 r, vec3 hue, float loud) {
  vec3 lampDir = normalize(vec3(-0.25, 0.72, 0.64));
  float l = sat(dot(r, lampDir));
  float lamp = pow(l, 5.0) * 0.55 + smoothstep(0.93, 0.975, l) * 1.5;
  float el = r.y;
  float rim = exp(-el * el * 7.0);
  vec3 c = vec3(1.0, 0.96, 0.9) * lamp * (0.7 + 0.8 * uLevel);
  c += hue * rim * (0.3 + 1.5 * loud);
  c += hue * (0.04 + 0.2 * loud);
  c += vec3(0.4, 0.6, 1.0) * 0.12 * smoothstep(0.0, 0.8, -r.z) * smoothstep(0.0, 0.6, el);
  return c;
}
vec3 render(vec2 p) {
  vec3 col = vec3(0.0);
  float kick = sat(uHits * 1.3) + 0.5 * uCue;
  vec2 grad; vec3 hue; float rad, loud;
  if (uVar < 0.5) {
    // a: a table seen at a slant, the back of the room far away
    NG = vec2(30.0, 18.0);
    ringAt = 13.0 * (1.0 - sat(uHits * 1.3));
    float cell = 0.1;
    vec3 ro = vec3(0.25 * sin(uTime * 0.11), 1.9 + 0.08 * sin(uTime * 0.17), -1.55), ta = vec3(0.0, -0.2, 0.74);
    vec3 fw = normalize(ta - ro), rt = normalize(cross(vec3(0, 1, 0), fw)), up = cross(fw, rt);
    vec3 rd = normalize(fw * 1.8 + rt * p.x + up * p.y);
    if (rd.y > -0.01) return col;
    float t = -ro.y / rd.y;
    vec3 q = ro + rd * t;
    vec2 g = vec2(q.x / cell + 0.5 * NG.x, (1.8 - q.z) / cell);   // the far side is the back of the room
    float d = liquid(g, grad, hue, rad, loud);
    float px = length(fwidth(g)) * 0.7 + 0.002;
    float fog = exp(-max(t - 2.0, 0.0) * 0.35) * smoothstep(-4.0, 0.5, g.y) * smoothstep(-5.0, 0.0, g.x) * smoothstep(NG.x + 5.0, NG.x, g.x);
    float inside = smoothstep(px, -px, d);
    float e = max(-d, 0.0);
    float h = sqrt(2.0 * e * rad + 1e-5);
    float flat_ = 0.42;                                    // big pools go flat on top, as mercury does
    float hh = h / sqrt(1.0 + (h * h) / (flat_ * flat_));
    float slope = pow(1.0 + (h * h) / (flat_ * flat_), -1.5);
    vec3 n = normalize(vec3(grad.x * rad * slope, hh + 0.02, -grad.y * rad * slope)); // grid y runs toward us, world z away
    vec3 r = reflect(rd, n);
    float fres = 0.55 + 0.45 * pow(1.0 - sat(dot(n, -rd)), 3.0);
    vec3 metal = room(r, hue, loud) * fres * mix(vec3(1.0), hue, 0.45);
    metal += hue * loud * loud * 0.25;                     // loud beads glow from inside
    col = metal * inside;
    // the table catches each bead's colour around its foot
    col += hue * (0.02 + 0.3 * loud * loud) * exp(-max(d, 0.0) * 6.0) * (1.0 - inside);
    col *= fog;
    return screenOf(col * 1.25);
  }
  // b: a wall of wax with the lamp behind it, turned a little away from us
  NG = vec2(36.0, 20.0);
  ringAt = 15.0 * (1.0 - sat(uHits * 1.3));
  float yaw = 0.55 + 0.07 * sin(uTime * 0.13);
  vec3 ro = vec3(0.0, 0.0, -1.5), rd = normalize(vec3(p, 1.5));
  vec3 nrm = vec3(sin(yaw), 0.0, -cos(yaw)), tx = vec3(cos(yaw), 0.0, sin(yaw));
  float t = dot(vec3(0.07, 0.0, 0.0) - ro, nrm) / dot(rd, nrm);
  vec3 q = ro + rd * t - vec3(0.07, 0.0, 0.0);
  vec2 w = vec2(dot(q, tx), q.y);
  float cell = 0.78 / NG.y;
  vec2 g = vec2(w.x / cell + 0.5 * NG.x, 0.5 * NG.y - w.y / cell);
  float d = liquid(g, grad, hue, rad, loud);
  float px = length(fwidth(g)) * 0.7 + 0.002;
  float inside = smoothstep(px, -px, d);
  float e = max(-d, 0.0);
  float h = sqrt(2.0 * e * rad + 1e-5);                    // how thick the wax is here, in beads
  vec3 warm = mix(hue, hue * vec3(1.25, 0.95, 0.7) + vec3(0.08, 0.02, 0.0), 0.4);
  // thin wax at the rim lets the lamp through pale and bright; thick wax holds its colour and goes deep
  vec3 through = warm * warm * (0.05 + 0.26 * loud) + (warm + 0.22) * exp(-h * 7.0) * (0.45 + 2.0 * loud);
  vec3 n = normalize(vec3(grad * rad, h + 0.05));
  vec3 lf = normalize(vec3(-0.45, -0.6, 0.66));            // a small lamp in front, up and to the left (grid y runs down)
  float sheen = pow(sat(dot(n, lf)), 30.0);
  col = through * inside * (0.75 + 0.5 * sat(dot(n, lf))) + vec3(1.0, 0.92, 0.82) * sheen * inside * (0.2 + 0.5 * loud);
  col += warm * (0.03 + 0.75 * loud * loud) * exp(-max(d, 0.0) * 3.2) * (1.0 - inside); // the lamp leaks round the edges
  float fog = exp(-max(t - 1.2, 0.0) * 0.55) * smoothstep(-3.0, 0.5, g.x) * smoothstep(NG.x + 3.0, NG.x - 0.5, g.x) * smoothstep(-2.0, 0.5, g.y) * smoothstep(NG.y + 2.0, NG.y - 0.5, g.y);
  return screenOf(col * fog * 1.5);
}
