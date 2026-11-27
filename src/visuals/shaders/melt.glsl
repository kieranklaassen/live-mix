// name: Melt
// a: Mercury table
// b: Wax wall
// what: The piece as beads of liquid metal on a dark table, the loop across and the room going away from you; where it is loud the beads swell and run together into pools.
// follows: The piece sets each bead's size and colour, a crest stands where the loop is now, the low band deepens the swell, a hit sends a ring through that makes beads jump and join.
// own: 0 1 a fine field of many small beads, -1 a few great ones; 1 1 strewn out of line and of every size, -1 staggered rows that run slowly down; 2 1 drawn out into streams away from you (b: downward), -1 drawn out sideways into bars; 3 the ground: 1 a pale lit surface with shadows, -1 a rough stone in the colour of the drone; 4 1 clear glass, -1 dull stone lit from one side; 5 the eye: 1 low along the ground (b: along the wall), -1 from straight above (b: facing it); 6 1 hollow rings and outlines, -1 square tiles; 7 1 the liquid lies everywhere, -1 most beads are gone and few are left
float meMany;      // how many times as many beads as the plain picture has
vec2 NG;           // how many beads across and deep
float ringAt;      // how far the ring of a hit has got, in beads
// The liquid at a place of the grid: its edge (below 0 is inside), which way the edge faces, its colour, bead size and loudness.
float liquid(vec2 g, out vec2 grad, out vec3 hue, out float rad, out float loud) {
  // the rows may run, the beads be drawn out
  vec2 run = vec2(0.0, uTime * 0.3 * max(-uOwn[1], 0.0));
  vec2 id0 = floor(g - run), drawn = exp2(0.95 * uOwn[2] * vec2(1.0, -1.0));
  float strewn = max(uOwn[1], 0.0), rows = max(-uOwn[1], 0.0);
  float d = 1e3; grad = vec2(0.0); hue = vec3(0.0); rad = 0.1; loud = 0.0;
  float near = 1e3, next = 1e3;
  float k = 0.34 - 0.22 * max(-uOwn[6], 0.0);
  float kick = sat(uHits * 1.3) + 0.5 * uCue;
  vec2 hitAt = vec2(uLoop * NG.x, 0.3 * NG.y);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 id = id0 + vec2(float(i), float(j)), at = id + run;
    vec2 uv = (at + 0.5) / NG;
    vec4 m = piece(uv);
    float a = sat(m.a * (0.65 + 0.6 * uEnergy));
    float h1 = hash21(id), h2 = hash21(id + 31.7);
    // each bead drifts a little and breathes with the low band
    vec2 c = at + 0.5 + (0.05 + 0.1 * a) * vec2(sin(uTime * (0.5 + 0.5 * h1) + h1 * 40.0), cos(uTime * (0.45 + 0.5 * h2) + h2 * 40.0));
    if (uOwn[1] != 0.0) c += strewn * 0.8 * vec2(fract(h1 * 57.31) - 0.5, fract(h2 * 91.7) - 0.5) + vec2(rows * (0.5 * mod(id.y, 2.0) - 0.25), 0.0);
    float ring = length(c - hitAt) - ringAt;
    float jolt = kick * exp(-ring * ring * 0.3);
    float swell = sin(c.x * 0.55 + c.y * 0.3 - uTravel * 1.6);          // a slow swell runs through the liquid
    float now = exp(-pow((c.x - uLoop * NG.x) * 0.45, 2.0));            // and a crest stands where the loop is now
    float r = 0.07 + 0.66 * pow(a, 0.75) * (0.9 + (0.07 + 0.16 * uLow) * swell + 0.12 * now) + 0.035 * now + 0.3 * jolt;
    if (strewn > 0.0) r *= mix(1.0, 0.45 + 1.0 * h1 * h1, strewn);
    if (uOwn[7] > 0.0) r = mix(r, sqrt(r * r + 0.24 * (0.6 + 0.8 * h2)), uOwn[7]);
    if (uOwn[7] < 0.0) {
      float left = smoothstep(0.66, 0.74, fract(h1 * 31.7 + h2));
      r = mix(r, left * sqrt(r * r * 2.2 + 0.035), -uOwn[7]);
    }
    if (rows > 0.0) r *= smoothstep(-0.9, -0.1, at.y) * smoothstep(NG.y - 0.1, NG.y - 0.9, at.y) * step(-0.5, id.x) * step(id.x, NG.x - 0.5) * 0.999 + 0.001;
    else r *= step(-0.5, id.x) * step(id.x, NG.x - 0.5) * step(-0.5, id.y) * step(id.y, NG.y - 0.5) * 0.999 + 0.001;
    if (uOwn[7] < 0.0 || rows > 0.0) r = max(r, 0.004);
    if (uOwn[1] != 0.0 || uOwn[2] != 0.0 || uOwn[7] != 0.0) r = r > 0.5 ? 0.5 + 0.32 * (1.0 - exp((0.5 - r) / 0.32)) : r;
    vec2 v = (g - c) * drawn;
    float di = (dot(v, v) - r * r) / (2.0 * r);   // a bowl, not a cone: smooth at the middle
    vec2 gi = v / r;
    if (uOwn[6] < 0.0) {                          // square: the same bowl by a four cornered measure
      vec2 v2 = v * v;
      float m2 = sqrt(dot(v2, v2) + 1e-8);
      di = mix(di, (m2 - r * r * 0.95) / (2.0 * r), -uOwn[6]);
      gi = mix(gi, v * v2 / (m2 * r), -uOwn[6]);
    }
    gi *= drawn;
    if (uOwn[1] != 0.0 || uOwn[2] != 0.0 || uOwn[7] != 0.0) {   // a great bead lets go before its neighbours stop asking after it
      di += 1.6 * smoothstep(0.8, 1.5, length(g - at - 0.5));
    }
    vec3 hi = m.a > 0.004 ? m.rgb / m.a : vec3(0.55, 0.6, 0.66);
    if (uOwn[7] > 0.0 || uOwn[3] != 0.0) hi = mix(hi, mix(uKind[0], uKind[1], h2), max(max(uOwn[7], 0.0), abs(uOwn[3])) * 0.7 * smoothstep(0.1, 0.0, m.a));
    hi = pow(hi, vec3(1.5)) * 1.25;                  // the piece's colours, a little deeper
    hi = mix(hi, uKind[4] * 1.3, sat(jolt * 0.7));
    if (di < near) { next = near; near = di; } else next = min(next, di);
    float h = sat(0.5 + 0.5 * (di - d) / k);      // the smooth minimum, carrying the rest along with it
    d = mix(di, d, h) - k * h * (1.0 - h);
    grad = mix(gi, grad, h); hue = mix(hi, hue, h); rad = mix(r, rad, h); loud = mix(a + jolt, loud, h);
  }
  if (uOwn[6] > 0.0) {                            // hollow: only the rim of it is left, and a wall where two meet
    const float wall = 0.085;
    grad *= mix(1.0, clamp((d + wall) / 0.06, -1.0, 1.0), uOwn[6]);
    d = mix(d, min(abs(d + wall) - wall, max(d, 0.5 * (next - near) - wall * 0.8)), uOwn[6]);
    rad = mix(rad, 0.16, uOwn[6]);
  }
  return d;
}
// The ground the beads lie on, at a place of it (in beads), in the light of one lamp.
vec3 ground(vec2 w, vec2 p, float far) {
  float pale = max(uOwn[3], 0.0), rough = max(-uOwn[3], 0.0);
  float lamp = 0.55 + 0.75 * exp(-dot(p - vec2(-0.35, 0.3), p - vec2(-0.35, 0.3)) * 1.1) + 0.12 * uLevel;
  vec3 c = vec3(0.0);
  if (pale > 0.0) c = pale * vec3(1.14, 1.08, 1.0) * lamp * mix(0.94 + 0.1 * noise(w * 9.0), 1.0, sat(far));
  if (rough > 0.0) {
    float bed = fbm(w * vec2(0.35, 0.6)), grit = mix(noise(w * 7.0), 0.5, sat(far));
    vec3 k = uKind[0] * uKind[0];
    c = rough * (0.1 + 0.75 * k) * (0.25 + 0.9 * bed) * (0.7 + 0.6 * grit) * lamp * 0.85;
  }
  return c;
}
// The liquid on a ground of its own, and of another stuff than metal or wax: what is seen there.
// was: the plain liquid there; n: its face, x and y as the ground has them and z off the ground; v: from the eye.
vec3 stuff(vec3 was, vec3 under, vec2 w, vec2 p, float d, vec2 grad, vec3 n, vec3 v, float thick, float inside, vec3 hue, float loud, vec3 leak) {
  const vec3 sun = vec3(-0.55, -0.5, 0.67);
  float clear = max(uOwn[4], 0.0), dull = max(-uOwn[4], 0.0), lie = abs(uOwn[3]), pale = max(uOwn[3], 0.0);
  float gl = length(grad), away = gl > 1e-4 ? -dot(grad / gl, normalize(sun.xy)) : 0.0;
  // the shadow lies on the far side of the lamp, with light let through in it when the bead is clear
  float sh = exp(-max(d - 0.12 * away, 0.0) * 7.0) * (0.5 + 0.5 * away);
  float foot = exp(-max(d, 0.0) * 14.0);
  vec3 lit = under * (1.0 - 0.62 * sh * (1.0 - 0.6 * clear)) * (1.0 - 0.45 * foot);
  lit += clear * hue * hue * (0.25 + 1.1 * loud) * exp(-max(d, 0.0) * 4.0) * (0.35 + 0.65 * max(away, 0.0)) * (0.35 + lie);
  lit += leak * (1.0 - 0.75 * pale);
  // dull stone, lit from one side
  float wrap = sat(dot(n, sun) * 0.75 + 0.25), gloss = pow(sat(dot(reflect(v, n), sun)), 40.0);
  vec3 body = was;
  if (dull > 0.0) {
    float grain = noise(w * 11.0) * 0.6 + noise(w * 29.0) * 0.4;
    vec3 stone = (0.06 + hue * hue) * (0.1 + 1.25 * wrap * wrap) * (0.8 + 0.4 * grain) * (0.75 + 0.9 * loud);
    stone *= 1.0 - 0.45 * exp(-thick * 6.0);
    body = mix(body, stone, dull);
  }
  if (clear > 0.0) {
    float edge = 1.0 - sat(n.z);
    vec3 glass = under * mix(vec3(1.0), (0.3 + hue) * (0.35 + 0.8 * hue), sat(0.35 + thick * 1.6)) * (1.0 - 0.75 * edge * edge);
    glass += hue * hue * (0.3 + 1.3 * loud) * (0.12 + 0.9 * sat(-dot(n.xy, sun.xy)) * edge);   // gathered on the far side
    glass += hue * hue * (0.16 + 0.5 * loud) * sat(thick * 1.5) * (1.0 - 0.5 * pale);
    glass += hue * 0.35 * edge * edge * edge * (0.3 + loud);
    glass += vec3(1.0, 0.97, 0.92) * (gloss * 1.6 + 0.5 * pow(sat(dot(n, normalize(vec3(0.5, 0.45, 0.75)))), 30.0) * 0.5);
    body = mix(body, glass, clear);
  }
  if (pale > 0.0) {                                             // metal and wax are dark on it, and mirror it on top
    vec3 m = normalize(n + vec3(0.5 * (noise(w * 0.9 + 3.0) - 0.5), 0.5 * (noise(w * 0.9 + 40.0) - 0.5), 0.0));
    float e = dot(m, vec3(-0.36, -0.31, 0.88)), back = dot(m, vec3(0.62, 0.55, 0.56));
    vec3 tint = hue * (0.35 + 0.65 * hue);
    vec3 dark = tint * (0.05 + 0.5 * loud) * (0.4 + 0.6 * wrap);
    dark += mix(tint, vec3(1.0), 0.45) * (1.5 * smoothstep(0.7, 1.02, e) + 0.3 * smoothstep(0.6, 0.85, back) * (1.0 - n.z)) + gloss;
    body = mix(body, dark, pale * (1.0 - max(clear, dull)));
  }
  return mix(lit, body, inside);
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
  meMany = exp2(uOwn[0] * (uOwn[0] > 0.0 ? 0.9 : 1.4));
  vec2 grad; vec3 hue; float rad, loud;
  if (uVar < 0.5) {
    // a: a table seen at a slant, the back of the room far away
    NG = vec2(30.0, 18.0) * meMany;
    ringAt = 13.0 * (1.0 - sat(uHits * 1.3)) * meMany;
    float cell = 0.1 / meMany;
    vec3 ro = vec3(0.25 * sin(uTime * 0.11), 1.9 + 0.08 * sin(uTime * 0.17), -1.55), ta = vec3(0.0, -0.2, 0.74);
    if (uOwn[5] > 0.0) { ro = mix(ro, vec3(ro.x, 0.62, -1.15), uOwn[5]); ta = mix(ta, vec3(0.0, -0.12, 0.74), uOwn[5]); }
    if (uOwn[5] < 0.0) { ro = mix(ro, vec3(0.0, 2.75, 0.55), -uOwn[5]); ta = mix(ta, vec3(0.0, 0.0, 0.88), -uOwn[5]); }
    vec3 fw = normalize(ta - ro), rt = normalize(cross(vec3(0, 1, 0), fw)), up = cross(fw, rt);
    vec3 rd = normalize(fw * 1.8 + rt * p.x + up * p.y);
    if (rd.y > -0.01) {
      if (uOwn[3] == 0.0) return col;
      return screenOf(ground(vec2(0.0), p, 1.0) * mix(0.55, 0.75, max(uOwn[3], 0.0)) * 1.25);
    }
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
    if (uOwn[3] != 0.0 || uOwn[4] != 0.0) {
      vec2 wg = q.xz / 0.1;
      float far = smoothstep(2.0, 5.0, t), ends = smoothstep(-1.0, 0.4, g.y) * smoothstep(-1.0, 0.4, g.x) * smoothstep(NG.x + 1.0, NG.x - 0.4, g.x) * smoothstep(NG.y + 1.0, NG.y - 0.4, g.y);
      vec3 under = ground(wg, p, far), leak = hue * (0.02 + 0.3 * loud * loud) * exp(-max(d, 0.0) * 6.0);
      vec3 other = stuff(metal, under, g, p, d, grad, normalize(vec3(n.x, -n.z, n.y)), vec3(rd.x, -rd.z, rd.y), h, inside, hue, loud, leak);
      other = mix(under, other, ends);
      other = mix(other * mix(fog, 1.0, abs(uOwn[3])), ground(wg, p, 1.0) * mix(0.55, 0.75, max(uOwn[3], 0.0)), far);
      return screenOf(mix(col * fog, other, max(abs(uOwn[3]), abs(uOwn[4]))) * 1.25);
    }
    col *= fog;
    return screenOf(col * 1.25);
  }
  // b: a wall of wax with the lamp behind it, turned a little away from us
  NG = vec2(36.0, 20.0) * meMany;
  ringAt = 15.0 * (1.0 - sat(uHits * 1.3)) * meMany;
  float yaw = 0.55 + 0.07 * sin(uTime * 0.13) + 0.36 * max(uOwn[5], 0.0) - 0.55 * max(-uOwn[5], 0.0);
  vec3 ro = vec3(0.0, 0.0, -1.5 + 0.28 * max(-uOwn[5], 0.0) + 0.42 * max(uOwn[5], 0.0)), rd = normalize(vec3(p, 1.5));
  vec3 nrm = vec3(sin(yaw), 0.0, -cos(yaw)), tx = vec3(cos(yaw), 0.0, sin(yaw));
  if (uOwn[5] > 0.0 && dot(rd, nrm) > -0.03) return screenOf(ground(vec2(0.0), p, 1.0) * 1.35);
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
  if (uOwn[3] != 0.0 || uOwn[4] != 0.0) {
    vec2 wg = w / 0.039;
    float ends = smoothstep(-1.0, 0.4, g.y) * smoothstep(-1.0, 0.4, g.x) * smoothstep(NG.x + 1.0, NG.x - 0.4, g.x) * smoothstep(NG.y + 1.0, NG.y - 0.4, g.y);
    vec3 under = ground(wg, p, smoothstep(1.5, 4.0, t)), leak = warm * (0.03 + 0.75 * loud * loud) * exp(-max(d, 0.0) * 3.2);
    vec3 nn = normalize(vec3(grad * rad, h + 0.05));
    vec3 other = stuff(col, under, g, p, d, grad, nn, vec3(0.0, 0.0, -1.0), h, inside, hue, loud, leak);
    other = mix(under, other, ends) * mix(fog, 1.0, abs(uOwn[3]));
    return screenOf(mix(col * fog * 1.5, other * 1.35, max(abs(uOwn[3]), abs(uOwn[4]))));
  }
  return screenOf(col * fog * 1.5);
}
