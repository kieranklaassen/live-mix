// name: Press
// a: One screen
// b: Three plates
// what: A slow liquid body wearing the piece as its skin, lit from the side and printed in dots: the brighter the body, the fatter the dot.
// follows: The low band swells and folds the body, each kind of sound lights its own lamp, the piece colours the skin, a hit kicks a ring across it and knocks the plates out of line.
// own: 0 1 a fine screen of small dots, -1 a few great ones; 1 1 the dots run together into swelling lines, -1 each is an open ring; 2 1 dark ink on pale paper, the shadow printed and the light left bare, -1 the body stands dark before a great lit disc; 3 the form: 1 a ring with a hole, -1 hills that go away to the horizon; 4 1 deeply wrinkled all over, -1 smooth with no fold; 5 1 a heap of many round balls, -1 one body alone; 6 1 drawn up tall, -1 pressed flat and wide; 7 the rows of the screen: 1 turned into a spiral, -1 strewn out of line and of every size
float kick() { return sat(uHits * 1.3) + 0.6 * uCue; }
mat2 turnA, turnB;
float pressIn;   // how much of the body or its shadow is at the place last looked at
float body(vec3 q) {
  float t = uTravel * 0.3;
  vec3 str = vec3(1.0);
  if (uOwn[6] > 0.0) str = mix(str, vec3(1.35, 0.56, 1.35), uOwn[6]);
  if (uOwn[6] < 0.0) str = mix(str, vec3(0.72, 2.3, 0.72), -uOwn[6]);
  q *= str;
  vec3 w = q;
  w.xz = turnA * w.xz; w.xy = turnB * w.xy;
  float fold = 0.2 + 0.13 * uLow + 0.1 * uLevel;
  fold *= 1.0 - 0.6 * max(uOwn[4], 0.0) + min(uOwn[4], 0.0);
  vec3 s = w + fold * sin(w.yzx * 2.3 + vec3(t * 1.3, -t * 0.9, t * 1.1)) + 0.5 * fold * sin(w.zxy * 4.1 + vec3(-t, t * 1.7, t * 0.6));
  float d = length(s) - 0.6 - 0.1 * uLevel;
  if (uOwn[3] > 0.0) { vec3 rq = q; rq.yz = turnB * rq.yz; rq.xz = turnB * rq.xz; rq += 0.45 * (s - w); d = mix(d, length(vec2(length(rq.xy) - 0.8, rq.z)) - 0.2 - 0.09 * uLevel, uOwn[3]); }
  if (uOwn[3] < 0.0) {
    vec2 hp = q.xz + vec2(0.0, 0.25 * t);
    float hg = sin(hp.x * 1.25 + 1.3 * sin(hp.y * 0.5) + 0.6) + 0.8 * sin(hp.y * 1.5 + 1.1 * sin(hp.x * 0.8)) + fold * 2.0 * sin(hp.x * 2.6 - hp.y * 1.9);
    d = mix(d, (q.y + 0.82 - (0.19 + 0.06 * uLow) * hg - 0.07 * max(q.z, 0.0)) * 1.2, -uOwn[3]);
  }
  if (uOwn[4] > 0.0) d += 0.11 * uOwn[4] * sin(7.0 * s.x + 2.0 * sin(3.0 * s.y)) * sin(6.5 * s.y - t) * sin(7.5 * s.z + 2.0 * sin(3.0 * s.x));
  if (uOwn[5] > 0.0) {
    vec3 id = clamp(floor(w / 0.6 + 0.5), -1.0, 1.0), o = w - 0.6 * id;
    float h = hash31(id + 5.0);
    d = mix(d, length(o + 0.07 * sin(t * 0.8 + 6.0 * h + vec3(0.0, 2.0, 4.0))) - 0.15 - 0.15 * h - 0.08 * uLevel, uOwn[5]);
  }
  float alone = 1.2 * max(-uOwn[5], 0.0) + 0.6 * max(uOwn[5], 0.0) + 0.9 * abs(uOwn[3]);
  // three satellites that swim in and out of the body: pad, texture, phrase
  vec3 c1 = 0.98 * vec3(cos(t * 1.1), 0.45 * sin(t * 0.7), sin(t * 1.1));
  vec3 c2 = 0.94 * vec3(cos(t * 0.8 + 2.3), 0.7 * cos(t * 0.9 + 1.0), sin(t * 0.8 + 2.3));
  vec3 c3 = 0.9 * vec3(0.5 * sin(t * 0.6 + 4.0), cos(t * 0.75 + 0.5), 0.8 * sin(t * 0.75 + 0.5));
  d = smin(d, length(q - c1) - 0.16 - 0.2 * uPad + alone, 0.5);
  d = smin(d, length(q - c2) - 0.12 - 0.22 * uTexture + alone, 0.45);
  d = smin(d, length(q - c3) - 0.1 - 0.24 * uPhrase + alone, 0.45);
  // a hit sends a swell from the top of the body to its foot
  float ring = q.y - (1.2 - 2.6 * (1.0 - sat(uHits * 1.3)));
  d -= 0.1 * kick() * exp(-ring * ring * 9.0);
  return d * 0.62 / max(1.0, max(str.x, str.y)) / (1.0 + 0.7 * max(uOwn[4], 0.0));
}
// The scene at one place of the page, as light.
vec3 scene(vec2 p) {
  vec3 ro = vec3(0.0, 0.1, -3.9), rd = normalize(vec3(p - vec2(0.0, 0.03), 1.6));
  vec3 col = vec3(0.0);
  float back = max(-uOwn[2], 0.0);
  pressIn = 0.0;
  // only rays through the ball that holds the body are marched
  float b = dot(ro, rd), c = dot(ro, ro) - 1.75 * 1.75 - 0.6 * abs(uOwn[6]), h = b * b - c;
  float t = -1.0;
  float land = max(-uOwn[3], 0.0);
  if (h > 0.0 || land > 0.0) {
    h = sqrt(max(h, 0.0));
    float tt = -b - h, far = -b + h;
    if (land > 0.0) { tt = mix(tt, 0.9, land); far = mix(far, 14.0, land); }
    for (int i = 0; i < 44 + (uOwn[4] > 0.0 ? 16 : 0) + (uOwn[6] != 0.0 ? 6 : 0) + (uOwn[3] < 0.0 ? 12 : 0); i++) {
      float d = body(ro + rd * tt);
      if (d < 0.004 + 0.005 * land * tt) { t = tt; break; }
      tt += d;
      if (tt > far) break;
    }
  }
  if (t > 0.0) {
    pressIn = exp(-0.16 * land * max(t - 3.0, 0.0));
    vec3 q = ro + rd * t;
    vec2 e = vec2(0.012, -0.012);
    vec3 n = normalize(e.xyy * body(q + e.xyy) + e.yyx * body(q + e.yyx) + e.yxy * body(q + e.yxy) + e.xxx * body(q + e.xxx));
    // the skin: the piece wrapped round, the loop round the waist (now faces us), the room from crown (back) to foot (front)
    vec3 w = q; w.xz = turnA * w.xz;
    vec3 dir = normalize(w);
    vec2 uv = vec2(fract(atan(dir.x, -dir.z) / TAU + uLoop), acos(clamp(dir.y, -1.0, 1.0)) / PI);
    if (land > 0.0) uv = mix(uv, vec2(0.5 + q.x * 0.17, sat(0.80 - 0.15 * q.z)), land);
    uv.y = mix(0.04, 0.96, uv.y);
    vec4 m = piece(uv);
    vec3 skin = m.rgb * (1.2 + 1.2 * m.a);
    skin *= 1.0 - 0.8 * back;
    // lamps: a warm key up left, a violet fill at the right (pads), a teal one from below and behind (drone)
    vec3 l1 = normalize(vec3(-0.65, 0.7, -0.5)), l2 = normalize(vec3(0.9, -0.1, -0.2)), l3 = normalize(vec3(0.2, -0.8, 0.55));
    float key = sat(dot(n, l1)), fill = sat(dot(n, l2)), under = sat(dot(n, l3) * 0.6 + 0.4);
    float fres = pow(1.0 - sat(-dot(n, rd)), 3.0);
    vec3 hv = normalize(l1 - rd);
    float spec = pow(sat(dot(n, hv)), 40.0);
    float wrap = sat(dot(n, l1) * 0.62 + 0.38);
    col = (skin + mix(uKind[0], uKind[1], sat(0.5 + 0.6 * n.y)) * (0.2 + 0.25 * uLevel)) * (0.07 + 1.1 * wrap * wrap);
    col *= 1.0 - 0.75 * back;
    col += vec3(1.0, 0.9, 0.78) * key * key * (0.1 + 0.3 * uLevel) * (1.0 - 0.9 * back);
    col += uKind[1] * fill * fill * (0.06 + 0.9 * uPad);
    col += uKind[0] * under * under * (0.14 + 0.7 * uDrone);
    col += mix(uKind[0], uKind[2], sat(n.x * 0.5 + 0.5)) * fres * (0.25 + 0.5 * uHigh + 0.5 * uTexture);
    col += vec3(1.0, 0.95, 0.9) * spec * (0.9 + 1.5 * uLevel) * (1.0 - 0.9 * back);
    col += back * 1.4 * mix(uKind[2], uKind[1], sat(0.5 - 0.6 * n.y)) * fres * (0.4 + uLevel);
    col += uKind[4] * kick() * 1.4 * exp(-pow((q.y - (1.2 - 2.6 * (1.0 - sat(uHits * 1.3)))) * 3.2, 2.0));
    if (land > 0.0) { float far_ = q.z + 2.0 - 6.0 * (1.0 - sat(uHits * 1.3)); col += land * uKind[4] * 2.5 * kick() * exp(-far_ * far_ * 1.6); col *= pressIn; }
  } else if (rd.y < -0.02 && land < 0.5) {
    // the floor under it: the body's light pooled there, and a dark foot where it stands
    float tf = (-1.35 - ro.y) / rd.y;
    vec3 f = ro + rd * tf;
    float r2 = dot(f.xz, f.xz);
    vec3 pool = (uKind[0] * (0.3 + uDrone) + uKind[1] * uPad * 0.7 + uKind[2] * uTexture * 0.6 + uKind[4] * kick()) * (0.25 + 0.6 * uLevel);
    col = pool * exp(-r2 * 0.42) * (1.0 - 0.75 * exp(-r2 * 1.6)) * mix(0.5, 0.3, uVar);
    float ringr = sqrt(r2) - 3.2 * (1.0 - sat(uHits * 1.3));
    col += uKind[4] * kick() * 0.5 * exp(-ringr * ringr * 14.0) * exp(-r2 * 0.12);
    float pf = max(uOwn[2], 0.0), sf = length((f.xz - vec2(0.55, 0.45)) * vec2(0.8, 1.0));
    pressIn = pf * 0.62 * smoothstep(1.5, 0.2, sf) * (0.8 + 0.2 * uLevel);
    col = mix(col, uKind[0] * (0.12 + 0.2 * sat(sf)) + uKind[4] * kick() * exp(-ringr * ringr * 14.0), pf);
    pressIn = max(pressIn, pf * 0.8 * kick() * exp(-ringr * ringr * 20.0) * exp(-r2 * 0.12));
  }
  if (back > 0.0 && pressIn < 0.5) {
    vec2 dp = p - vec2(0.0, 0.03);
    float dl = length(dp), disc = smoothstep(0.425, 0.405, dl);
    col *= 1.0 - back * disc;
    col += back * disc * mix(uKind[2], uKind[1], smoothstep(0.3, -0.4, dp.y)) * (0.5 + 0.6 * uLevel) * (1.0 - 0.45 * smoothstep(0.1, -0.42, dp.y));
    vec4 m = piece(vec2(dp.x * 1.15 + 0.5, 0.5 - dp.y * 1.1));
    col = mix(col, 1.5 * m.rgb / max(m.a, 0.02), back * disc * 0.6 * sat(m.a));
    col += back * (1.0 - disc) * mix(uKind[2], uKind[1], 0.5) * 0.16 * exp(-7.0 * max(dl - 0.41, 0.0)) * (0.5 + uLevel);
  }
  return col;
}
float dotVary;   // where dots are strewn, how large this one is
// One screen of dots: the place of the nearest dot's middle (on the page) and how far from it we are, in cells.
vec2 cellOf(vec2 p, float rows, float ang, out vec2 f) {
  mat2 r = rot(ang);
  float coil = 2.1 * max(uOwn[7], 0.0);
  if (coil > 0.0) p = rot(coil * length(p)) * p;
  vec2 g = r * p * rows;
  vec2 id = floor(g) + 0.5;
  f = g - id;
  id.x = mix(id.x, g.x, max(uOwn[1], 0.0));
  if (uOwn[7] < 0.0) { vec2 j = hash22(id + 31.0) - 0.5; f += 0.55 * uOwn[7] * j * vec2(1.0 - max(uOwn[1], 0.0), 1.0); dotVary = fract(j.x * 91.7 + 7.0); }
  vec2 at = (id / rows) * r; // r is a turn, so this turns back
  return coil > 0.0 ? rot(-coil * length(at)) * at : at;
}
// How big the dot is for this much light, and how bright its ink.
float dotOf(float v, vec2 f, float edge) {
  float tone = 1.0 - exp(-v * 1.25);
  float r = 0.6 * pow(tone, 0.62), d = length(f) - r;
  if (uOwn[7] < 0.0) d += -uOwn[7] * (r * (1.0 - 1.0 * dotVary) + 0.12 * r);
  if (uOwn[1] > 0.0) d = mix(d, abs(f.y) - 0.86 * r, uOwn[1]);
  if (uOwn[1] < 0.0) d = mix(d, abs(length(f) - 0.16 - 0.36 * r) - 0.05 - 0.14 * r, -uOwn[1]);
  float on = smoothstep(0.004, 0.03, tone);
  return on * ((0.42 + 0.58 * tone) * smoothstep(edge, -edge, d) + tone * tone * 0.22 * exp(-max(d, 0.0) * 6.0));
}
// The same on paper: the darker, the fatter.
float dotPaper(float dark, vec2 f, float edge) {
  float r = 0.66 * pow(max(dark, 0.0), 0.6), d = length(f) - r;
  if (uOwn[7] < 0.0) d += -uOwn[7] * (r * (0.8 - 0.8 * dotVary) + 0.12 * r);
  if (uOwn[1] > 0.0) d = mix(d, abs(f.y) - 0.78 * r, uOwn[1]);
  if (uOwn[1] < 0.0) d = mix(d, abs(length(f) - 0.16 - 0.36 * r) - 0.04 - 0.16 * r, -uOwn[1]);
  return smoothstep(0.01, 0.05, dark) * smoothstep(edge, -edge, d);
}
vec3 render(vec2 p) {
  float t = uTravel * 0.3;
  turnA = rot(t * 0.5); turnB = rot(0.35 * sin(t * 0.4));
  float rows = mix(56.0, 48.0, uVar);
  rows *= exp2(uOwn[0] * (uOwn[0] > 0.0 ? 0.85 : 1.35));
  dotVary = 0.5;
  float paper = max(uOwn[2], 0.0);
  float edge = rows / uRes.y * 1.1;
  vec3 col = vec3(0.0);
  vec2 f;
  if (uVar < 0.5) {
    vec2 c = cellOf(p, rows, 0.42, f);
    vec3 s = scene(c);
    float lum = max(s.r, max(s.g, s.b));
    vec3 ink = pow(s / max(lum, 0.001), vec3(0.75));
    vec3 night = ink * dotOf(lum, f, edge);
    if (paper > 0.0) {
      // on paper the darks are what is printed
      float dark = pressIn * (0.06 + 0.94 * exp(-1.35 * dot(s, vec3(0.35, 0.45, 0.2))));
      float on = sat(dotPaper(dark, f, edge));
      vec3 under = vec3(0.93, 0.91, 0.87) * (0.97 + 0.05 * noise(p * 190.0));
      night = mix(night, mix(under, pow(max(s / max(lum, 0.001), 0.0), vec3(1.5)) * (0.15 + 0.5 * sat(lum)), on), paper);
    }
    return night;
  }
  // b: three plates, each at its own angle and a little out of line; a hit knocks them further out
  float slip = 0.005 + 0.02 * kick() + 0.004 * uLow;
  float soft = sat(abs(uOwn[0]) + abs(uOwn[2]) + abs(uOwn[3]) + abs(uOwn[4]) + abs(uOwn[5]) + abs(uOwn[6]));
  vec3 sheet = vec3(0.94, 0.92, 0.88);
  for (int k = 0; k < 3; k++) {
    float fk = float(k);
    float ang = 0.26 + fk * 1.047;
    vec2 off = slip * vec2(cos(fk * 2.094 + 0.5 + t), sin(fk * 2.094 + 0.5 + t));
    vec2 c = cellOf(p - off, rows, ang, f);
    vec3 s = scene(c);
    float v = k == 0 ? s.r : (k == 1 ? s.g : s.b);
    vec3 plate = k == 0 ? vec3(1.0, 0.12, 0.2) : (k == 1 ? vec3(0.08, 0.95, 0.3) : vec3(0.14, 0.2, 1.0));
    plate = mix(plate, k == 0 ? vec3(0.86, 0.22, 0.16) : k == 1 ? vec3(0.16, 0.72, 0.28) : vec3(0.18, 0.28, 0.82), soft);
    col += plate * dotOf(v, f, edge);
    if (paper > 0.0) {
      float dark = pressIn * (0.05 + 0.95 * exp(-1.9 * v));
      sheet *= 1.0 - 0.86 * (k == 0 ? vec3(0.95, 0.34, 0.16) : k == 1 ? vec3(0.22, 0.90, 0.42) : vec3(0.06, 0.24, 0.92)) * sat(dotPaper(dark, f, edge));
    }
  }
  return mix(min(col, 1.0), sheet, paper);
}
