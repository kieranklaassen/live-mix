// name: Press
// a: One screen
// b: Three plates
// what: A slow liquid body wearing the piece as its skin, lit from the side and printed in dots: the brighter the body, the fatter the dot.
// follows: The low band swells and folds the body, each kind of sound lights its own lamp, the piece colours the skin, a hit kicks a ring across it and knocks the plates out of line.
float kick() { return sat(uHits * 1.3) + 0.6 * uCue; }
mat2 turnA, turnB;
float body(vec3 q) {
  float t = uTravel * 0.3;
  vec3 w = q;
  w.xz = turnA * w.xz; w.xy = turnB * w.xy;
  float fold = 0.2 + 0.13 * uLow + 0.1 * uLevel;
  vec3 s = w + fold * sin(w.yzx * 2.3 + vec3(t * 1.3, -t * 0.9, t * 1.1)) + 0.5 * fold * sin(w.zxy * 4.1 + vec3(-t, t * 1.7, t * 0.6));
  float d = length(s) - 0.6 - 0.1 * uLevel;
  // three satellites that swim in and out of the body: pad, texture, phrase
  vec3 c1 = 0.98 * vec3(cos(t * 1.1), 0.45 * sin(t * 0.7), sin(t * 1.1));
  vec3 c2 = 0.94 * vec3(cos(t * 0.8 + 2.3), 0.7 * cos(t * 0.9 + 1.0), sin(t * 0.8 + 2.3));
  vec3 c3 = 0.9 * vec3(0.5 * sin(t * 0.6 + 4.0), cos(t * 0.75 + 0.5), 0.8 * sin(t * 0.75 + 0.5));
  d = smin(d, length(q - c1) - 0.16 - 0.2 * uPad, 0.5);
  d = smin(d, length(q - c2) - 0.12 - 0.22 * uTexture, 0.45);
  d = smin(d, length(q - c3) - 0.1 - 0.24 * uPhrase, 0.45);
  // a hit sends a swell from the top of the body to its foot
  float ring = q.y - (1.2 - 2.6 * (1.0 - sat(uHits * 1.3)));
  d -= 0.1 * kick() * exp(-ring * ring * 9.0);
  return d * 0.62;
}
// The scene at one place of the page, as light.
vec3 scene(vec2 p) {
  vec3 ro = vec3(0.0, 0.1, -3.9), rd = normalize(vec3(p - vec2(0.0, 0.03), 1.6));
  vec3 col = vec3(0.0);
  // only rays through the ball that holds the body are marched
  float b = dot(ro, rd), c = dot(ro, ro) - 1.75 * 1.75, h = b * b - c;
  float t = -1.0;
  if (h > 0.0) {
    h = sqrt(h);
    float tt = -b - h, far = -b + h;
    for (int i = 0; i < 44; i++) {
      float d = body(ro + rd * tt);
      if (d < 0.004) { t = tt; break; }
      tt += d;
      if (tt > far) break;
    }
  }
  if (t > 0.0) {
    vec3 q = ro + rd * t;
    vec2 e = vec2(0.012, -0.012);
    vec3 n = normalize(e.xyy * body(q + e.xyy) + e.yyx * body(q + e.yyx) + e.yxy * body(q + e.yxy) + e.xxx * body(q + e.xxx));
    // the skin: the piece wrapped round, the loop round the waist (now faces us), the room from crown (back) to foot (front)
    vec3 w = q; w.xz = turnA * w.xz;
    vec3 dir = normalize(w);
    vec2 uv = vec2(fract(atan(dir.x, -dir.z) / TAU + uLoop), acos(clamp(dir.y, -1.0, 1.0)) / PI);
    uv.y = mix(0.04, 0.96, uv.y);
    vec4 m = piece(uv);
    vec3 skin = m.rgb * (1.2 + 1.2 * m.a);
    // lamps: a warm key up left, a violet fill at the right (pads), a teal one from below and behind (drone)
    vec3 l1 = normalize(vec3(-0.65, 0.7, -0.5)), l2 = normalize(vec3(0.9, -0.1, -0.2)), l3 = normalize(vec3(0.2, -0.8, 0.55));
    float key = sat(dot(n, l1)), fill = sat(dot(n, l2)), under = sat(dot(n, l3) * 0.6 + 0.4);
    float fres = pow(1.0 - sat(-dot(n, rd)), 3.0);
    vec3 hv = normalize(l1 - rd);
    float spec = pow(sat(dot(n, hv)), 40.0);
    float wrap = sat(dot(n, l1) * 0.62 + 0.38);
    col = (skin + mix(uKind[0], uKind[1], sat(0.5 + 0.6 * n.y)) * (0.2 + 0.25 * uLevel)) * (0.07 + 1.1 * wrap * wrap);
    col += vec3(1.0, 0.9, 0.78) * key * key * (0.1 + 0.3 * uLevel);
    col += uKind[1] * fill * fill * (0.06 + 0.9 * uPad);
    col += uKind[0] * under * under * (0.14 + 0.7 * uDrone);
    col += mix(uKind[0], uKind[2], sat(n.x * 0.5 + 0.5)) * fres * (0.25 + 0.5 * uHigh + 0.5 * uTexture);
    col += vec3(1.0, 0.95, 0.9) * spec * (0.9 + 1.5 * uLevel);
    col += uKind[4] * kick() * 1.4 * exp(-pow((q.y - (1.2 - 2.6 * (1.0 - sat(uHits * 1.3)))) * 3.2, 2.0));
  } else if (rd.y < -0.02) {
    // the floor under it: the body's light pooled there, and a dark foot where it stands
    float tf = (-1.35 - ro.y) / rd.y;
    vec3 f = ro + rd * tf;
    float r2 = dot(f.xz, f.xz);
    vec3 pool = (uKind[0] * (0.3 + uDrone) + uKind[1] * uPad * 0.7 + uKind[2] * uTexture * 0.6 + uKind[4] * kick()) * (0.25 + 0.6 * uLevel);
    col = pool * exp(-r2 * 0.42) * (1.0 - 0.75 * exp(-r2 * 1.6)) * mix(0.5, 0.3, uVar);
    float ringr = sqrt(r2) - 3.2 * (1.0 - sat(uHits * 1.3));
    col += uKind[4] * kick() * 0.5 * exp(-ringr * ringr * 14.0) * exp(-r2 * 0.12);
  }
  return col;
}
// One screen of dots: the place of the nearest dot's middle (on the page) and how far from it we are, in cells.
vec2 cellOf(vec2 p, float rows, float ang, out vec2 f) {
  mat2 r = rot(ang);
  vec2 g = r * p * rows;
  vec2 id = floor(g) + 0.5;
  f = g - id;
  return (id / rows) * r; // r is a turn, so this turns back
}
// How big the dot is for this much light, and how bright its ink.
float dotOf(float v, vec2 f, float edge) {
  float tone = 1.0 - exp(-v * 1.25);
  float r = 0.6 * pow(tone, 0.62), d = length(f) - r;
  float on = smoothstep(0.004, 0.03, tone);
  return on * ((0.42 + 0.58 * tone) * smoothstep(edge, -edge, d) + tone * tone * 0.22 * exp(-max(d, 0.0) * 6.0));
}
vec3 render(vec2 p) {
  float t = uTravel * 0.3;
  turnA = rot(t * 0.5); turnB = rot(0.35 * sin(t * 0.4));
  float rows = mix(56.0, 48.0, uVar);
  float edge = rows / uRes.y * 1.1;
  vec3 col = vec3(0.0);
  vec2 f;
  if (uVar < 0.5) {
    vec2 c = cellOf(p, rows, 0.42, f);
    vec3 s = scene(c);
    float lum = max(s.r, max(s.g, s.b));
    vec3 ink = pow(s / max(lum, 0.001), vec3(0.75));
    return ink * dotOf(lum, f, edge);
  }
  // b: three plates, each at its own angle and a little out of line; a hit knocks them further out
  float slip = 0.005 + 0.02 * kick() + 0.004 * uLow;
  for (int k = 0; k < 3; k++) {
    float fk = float(k);
    float ang = 0.26 + fk * 1.047;
    vec2 off = slip * vec2(cos(fk * 2.094 + 0.5 + t), sin(fk * 2.094 + 0.5 + t));
    vec2 c = cellOf(p - off, rows, ang, f);
    vec3 s = scene(c);
    float v = k == 0 ? s.r : (k == 1 ? s.g : s.b);
    vec3 plate = k == 0 ? vec3(1.0, 0.12, 0.2) : (k == 1 ? vec3(0.08, 0.95, 0.3) : vec3(0.14, 0.2, 1.0));
    col += plate * dotOf(v, f, edge);
  }
  return min(col, 1.0);
}
