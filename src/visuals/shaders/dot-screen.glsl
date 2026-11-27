// name: Dot screen
// a: Flat
// b: Staggered, glowing
// what: The piece as a wall of dots, flat on. Across is the loop, down is the room; a dot is as big as the sound there.
// follows: Each stroke of the piece swells as it plays; a cue leaves a spreading spot; Glow makes every dot bigger.
// own: 0 1 three times as many, fine dots, -1 a few great ones; 1 1 strewn out of line and of every size, -1 the rows bent into long slow waves; 2 1 the dots run together into lines across, -1 into upright lines; 3 the ground: 1 pale paper, -1 a deep coloured dusk with great dots out of focus far behind; 4 1 round solid beads under a lamp, casting shadows, -1 hollow rings one inside another; 5 1 the screen lies down as a floor going away from you, -1 it hangs in folds like a curtain; 6 1 flowers of five to seven petals, -1 square tiles; 7 the picture the resting dots make: 1 a great disc over water, -1 ridges of hills in mist
// The screen in another world. With every number of its own at 0 none of this is asked for.
float dsLine, dsUp, dsAsp, dsDisc;
// What the dots show where nothing sounds, at a place of the screen: a colour, and how big the dots are there.
vec4 dsPicture(vec2 w) {
  vec4 o = vec4(0.0); dsDisc = 0.0;
  if (uOwn[7] > 0.0) {                              // a disc over water
    vec2 at = vec2(0.24, 0.1);
    float far = length(w - at), rad = 0.235, disc = smoothstep(rad + 0.012, rad - 0.012, far), sea = smoothstep(-0.2, -0.215, w.y);
    float sky = 0.1 + 0.34 * exp(-max(far - rad, 0.0) * 4.5) + 0.12 * noise(w * vec2(2.2, 6.0) + vec2(uTime * 0.03, 0.0));
    float deep = sat((-0.2 - w.y) / 0.3), path = exp(-abs(w.x - at.x) / (0.07 + 0.3 * deep));
    float glint = smoothstep(0.35, 0.75, noise(vec2(w.x * 7.0, w.y * 34.0 + uTime * 0.35)) * 0.7 + 0.3 * path);
    float water = 0.2 + 0.1 * noise(vec2(w.x * 3.0, w.y * 19.0 - uTime * 0.12)) + 0.55 * glint * path;
    vec3 c = mix(uKind[1], uKind[3], exp(-max(far - rad, 0.0) * 5.0) * 0.6);
    float full = mix(mix(sky, 0.72 + 0.1 * uLevel, disc), water, sea), bare = mix(mix(0.43 + 0.35 * w.y + 0.1 * noise(w * vec2(2.2, 6.0) + vec2(uTime * 0.03, 0.0)), 0.0, disc), 0.8 - 0.8 * glint * path - 0.3 * deep + 0.2 * noise(vec2(w.x * 3.0, w.y * 19.0 - uTime * 0.12)), sea);
    c = mix(c, uKind[4], disc); dsDisc = disc * uOwn[7];
    o = vec4(mix(c, mix(uKind[0], uKind[4], path * glint * 0.9), sea), mix(full, max(bare, 0.0), sat(uOwn[3])) * uOwn[7]);   // on paper the disc is left bare
  }
  if (uOwn[7] < 0.0) {                              // ridges, each paler and higher than the one before it
    vec3 c = mix(uKind[3], uKind[1], 0.2); float s = 0.1 + 0.12 * sat(0.5 - w.y);
    for (int k = 0; k < 4; k++) {
      float f = float(k), n = noise(vec2(w.x * (1.5 + 0.6 * f) + f * 9.7 + uTime * 0.008 * (f + 1.0), f * 3.1));
      float n2 = noise(vec2(w.x * (5.0 + 2.0 * f) + f * 5.3 + uTime * 0.02 * (f + 1.0), f * 7.7));
      float crest = 0.24 - 0.2 * f + (0.36 - 0.05 * f) * (n - 0.42) + 0.09 * (n2 - 0.5), below = crest - w.y;
      float in_ = smoothstep(-0.008, 0.008, below);
      s = mix(s, (0.36 + 0.1 * f) * (0.3 + 0.7 * exp(-max(below, 0.0) * (6.5 - f))) + 0.05, in_);
      c = mix(c, kindColour(2.4 - f * 0.8), in_);
    }
    o = vec4(c, s * -uOwn[7]);
  }
  return o;
}
struct Spot { float d, s, r, a, loud, h; vec2 v, n; vec3 hue; };
// The dot nearest a place g of a screen of so many rows; also how far into a shadow the place is (s).
Spot dsSpot(vec2 g, float rows, float rest) {
  Spot o; o.d = 9.0; o.s = 9.0; o.r = 0.1; o.a = 0.0; o.loud = 0.0; o.h = 0.0; o.v = vec2(0.0); o.n = vec2(0.0); o.hue = uKind[0];
  float strewn = max(uOwn[1], 0.0), square = max(-uOwn[6], 0.0), petal = max(uOwn[6], 0.0);
  vec2 thin = vec2(1.0 - dsLine, 1.0 - dsUp);
  for (int j = 0; j <= 1; j++) for (int i = 0; i <= 1; i++) {
    float row = floor(g.y - 0.5) + float(j), shift = uVar > 0.5 && mod(row, 2.0) > 0.5 ? 0.5 * (1.0 - dsUp) : 0.0;
    vec2 id = vec2(floor(g.x + shift - 0.5) + float(i), row), c = id + 0.5 - vec2(shift, 0.0);
    float h = hash21(id + 3.1), h2 = hash21(id + 47.7);
    if (dsLine > 0.0) { h = mix(h, hash21(vec2(0.5, row)), dsLine); h2 = mix(h2, hash21(vec2(9.5, row)), dsLine); }
    if (dsUp > 0.0) { h = mix(h, hash21(vec2(id.x, 0.5)), dsUp); h2 = mix(h2, hash21(vec2(id.x, 9.5)), dsUp); }
    c += strewn * (0.62 * vec2(fract(h * 57.31) - 0.5, fract(h2 * 91.7) - 0.5) + 0.07 * vec2(sin(uTime * (0.2 + 0.2 * h) + h * 40.0), cos(uTime * (0.17 + 0.2 * h2) + h2 * 40.0)));
    vec2 at = vec2(mix(c.x, g.x, dsLine), mix(c.y, g.y, dsUp));
    vec2 uv = at / vec2(rows * dsAsp, rows);
    if (uOwn[1] < 0.0 || uOwn[5] < 0.0) uv = clamp(uv, 0.0, 1.0);
    vec4 m = piece(uv);
    if (uOwn[7] != 0.0) {                           // the sound comes into the picture without edges
      vec4 wide = piece(uv + vec2(0.07, 0.03)) + piece(uv + vec2(-0.07, -0.03)) + piece(uv + vec2(0.03, -0.1)) + piece(uv + vec2(-0.03, 0.1));
      m = mix(m, 0.1 * m + 0.2 * wide, abs(uOwn[7]));
    }
    float loud = sat(m.a * (0.6 + 0.6 * uEnergy));
    vec3 hue = m.rgb / max(m.a, 0.001);
    float r = 0.56 * sqrt(loud), still = rest * (0.6 + 0.7 * h2);
    vec3 own = mix(uKind[0], uKind[1], sat(h * 1.4 - 0.2));
    if (uOwn[7] != 0.0) {
      vec4 pic = dsPicture(vec2((uv.x - 0.5) * dsAsp, 0.5 - uv.y));
      own = mix(own, pic.rgb, abs(uOwn[7])); still = mix(still, pic.a * 0.66, abs(uOwn[7]));
      r *= 1.0 - 0.8 * dsDisc * max(uOwn[3], 0.0);
    }
    hue = mix(own, hue, smoothstep(0.0, 0.12, m.a) * mix(1.0, (uOwn[7] < 0.0 ? 0.34 : 0.72 - 0.5 * dsDisc) * smoothstep(0.0, 1.2, r * r / (still * still + 0.02)), abs(uOwn[7])));
    r = sqrt(r * r + still * still);
    if (uOwn[7] != 0.0 && square > 0.0) r = mix(r, 0.33 + 0.16 * sqrt(sat(2.0 * r)), square * abs(uOwn[7]));
    if (uOwn[4] > 0.0 && strewn > 0.0) r = mix(r, 0.48 * r / (0.2 + r), uOwn[4] * strewn);
    r *= mix(1.0, 0.45 + 0.85 * h * h, strewn);
    if (strewn > 0.0) r = mix(r, min(r, 0.56), strewn);
    r = mix(r, 0.1 + 0.26 * sqrt(r), max(dsLine, dsUp) * 0.4);
    vec2 v = (g - c) * thin;
    vec2 a = abs(v);
    float l = length(v), d = l - r;
    if (square > 0.0) d = mix(d, max(a.x, a.y) - min(r * 0.92, 0.46), square);
    if (petal > 0.0) {
      vec2 t = rot(h * TAU + 0.25 * sin(uTime * 0.2 + h2 * 20.0)) * v;
      float ang = l > 1e-4 ? atan(t.y, t.x) : 0.0, lobe = abs(cos(ang * 0.5 * floor(5.0 + 3.0 * fract(h2 * 13.7))));
      d = mix(d, l - r * (0.42 + 0.72 * sqrt(lobe + 0.001)), petal);
    }
    bool top = strewn > 0.0 && d < 0.0 && o.d < 0.0 ? h > o.h : d < o.d;   // where strewn dots lie on one another, one of them is on top
    if (top) { o.d = d; o.r = max(r, 0.02); o.a = m.a; o.loud = loud; o.h = h; o.v = v; o.hue = hue; }
    float away = length((v - vec2(0.3, 0.34) * r * thin)) - r;
    if (square > 0.0) away = mix(away, max(abs(v.x - 0.16 * thin.x), abs(v.y - 0.18 * thin.y)) - min(r * 0.92, 0.46), square);
    o.s = min(o.s, away);
  }
  o.n = o.v / o.r;
  return o;
}
// The great dots out of focus, far behind.
vec3 dsFar(vec2 w, vec2 p) {
  float up = sat(0.5 + p.y);
  vec3 c = mix(uKind[0], uKind[1], mix(smoothstep(0.1, 0.9, up), 1.0, max(uOwn[6], 0.0))) * (0.17 + 0.3 * exp(-dot(p - vec2(0.25, -0.05), p - vec2(0.25, -0.05)) * 2.5)) * (0.75 + 0.5 * noise(w * 2.7 + vec2(uTime * 0.02, 0.0)));
  for (int k = 0; k < 2; k++) {
    float f = float(k), rows = 4.2 + 2.6 * f;
    vec2 g = rot(0.4 + f) * (w + vec2(uTime * 0.006 * (f + 1.0), 0.004 * uTime)) * rows, id = floor(g - 0.5);
    for (int j = 0; j <= 1; j++) for (int i = 0; i <= 1; i++) {
      vec2 cell = id + vec2(float(i), float(j)); float h = hash21(cell + 11.0 * f), h2 = hash21(cell + 71.0);
      vec2 at = cell + 0.5 + 0.5 * vec2(fract(h * 31.3) - 0.5, h2 - 0.5);
      float l = length(g - at), r = 0.3 + 0.45 * h2, on = smoothstep(0.4, 0.9, h) * (0.65 + 0.35 * sin(uTime * 0.2 + h * 50.0));
      c += kindColour(4.0 * fract(h * 7.7 + h2)) * on * 0.24 * (1.0 - 0.9 * max(uOwn[5], 0.0)) * smoothstep(r, r - 0.09, l) * (0.65 + 0.5 * l * l / (r * r)) * (0.7 + 0.7 * uLevel);
    }
  }
  return c;
}
vec3 dsOther(vec2 p) {
  dsAsp = uRes.x / uRes.y; dsLine = max(uOwn[2], 0.0); dsUp = max(-uOwn[2], 0.0);
  vec2 q = p;
  float pale = max(uOwn[3], 0.0), deep = max(-uOwn[3], 0.0), bead = max(uOwn[4], 0.0), ring = max(-uOwn[4], 0.0);
  float lay = max(uOwn[5], 0.0), hang = max(-uOwn[5], 0.0), shade = 1.0, sheen = 0.0, far = 0.0, over = 0.0, depth = 1.0;
  if (hang > 0.0) {                                 // a curtain: the cloth stands in folds that sway
    float ph = p.x * 8.0 + 0.5 * sin(p.y * 1.7 + uTime * 0.17) + 0.8 * sin(p.x * 2.3 + 1.0) + 0.35 * sin(uTime * 0.11);
    q.x += hang * 0.066 * sin(ph); q.y += hang * 0.028 * cos(ph) * (0.6 - p.y);
    float face = 0.5 + 0.5 * sin(ph - 0.9);
    shade = mix(1.0, 0.3 + 0.95 * face, hang); sheen = hang * pow(face, 9.0);
  }
  if (lay > 0.0) {                                  // a floor: the screen turned back about its lower edge
    float th = 1.25 * lay, s = sin(th), c = cos(th), den = c - p.y * s, t = (c + 0.5 * s) / max(den, 0.02);
    vec2 f = vec2(p.x * t, (p.y * t + 0.5) * c + (t - 1.0) * s);
    q = mix(vec2(1.0), vec2(0.62, 0.62), lay) * f - vec2(0.0, 0.5);
    far = smoothstep(2.2, 8.0, t) * lay; over = smoothstep(0.06, 0.02, den) * lay; depth = 1.0 / max(den, 0.02);
  }
  if (uOwn[1] < 0.0) q += -uOwn[1] * vec2(0.03 * sin(q.y * 7.0 + uTime * 0.09), 0.075 * sin(q.x * 3.1 + 0.8 * sin(q.y * 4.0 + uTime * 0.07) - uTime * 0.12) + 0.035 * sin(q.x * 7.3 + q.y * 5.0 + uTime * 0.1));
  float rows = mix(27.0, 36.0, uVar) * exp2(uOwn[0] * (uOwn[0] > 0.0 ? 1.55 : 1.7));
  vec2 g = vec2(q.x / dsAsp + 0.5, 0.5 - q.y) * vec2(rows * dsAsp, rows);
  vec2 wide = fwidth(g);
  float edge = clamp(0.6 * max(wide.x * (1.0 - dsLine), wide.y * (1.0 - dsUp)), 0.01, 0.6);
  float rest = 0.2 * max(max(max(abs(uOwn[3]), abs(uOwn[4])), abs(uOwn[6])), hang) * (1.0 + 1.1 * max(uOwn[6], 0.0));
  Spot o = dsSpot(g, rows, rest);
  float d = o.d, most = 1.0;
  if (ring > 0.0) {
    float w = 0.022 + 0.045 * o.r;
    d = mix(d, min(abs(d + w) - w, min(abs(d + 0.4 * o.r) - 0.7 * w, min(abs(d + 0.7 * o.r) - 0.5 * w, length(o.v) - 0.09 * o.r + 0.4 * max(0.2 - o.r, 0.0)))), ring);
  }
  float cov = smoothstep(edge, -edge, d);
  // the ground
  vec3 paper = vec3(0.0);
  float lamp = 1.04 - 0.34 * dot(p - vec2(-0.35, 0.25), p - vec2(-0.35, 0.25));
  if (pale > 0.0) paper = mix(vec3(0.95, 0.925, 0.87), vec3(0.8) + 0.2 * uKind[3], 0.3) * lamp * (0.95 + 0.05 * noise(q * vec2(90.0, 190.0)) + 0.05 * (fbm(q * 5.0) - 0.5)) * mix(1.0, shade, 0.75);
  vec3 ground = paper * pale;
  if (deep > 0.0 && over < 0.999) ground += deep * dsFar(q, p) * mix(1.0, shade, 0.8);
  // the dots
  float a = max(o.a, abs(uOwn[7]) * 0.5);
  vec3 lit = o.hue * mix(0.4 + 0.75 * o.a, 0.42 + 0.75 * a + 0.34 * max(uOwn[6], 0.0) * (1.0 - a), max(max(deep, bead), max(abs(uOwn[7]), abs(uOwn[6]))));
  vec3 ink = mix(o.hue * 0.82, o.hue * (0.35 + 0.5 * o.hue), 0.5 + 0.3 * o.loud);
  vec3 col = mix(lit, ink, pale);
  if (uOwn[6] > 0.0) {                              // the flower's eye, and its petals paler at the tips
    float l = length(o.n);
    col *= mix(1.0, 0.62 + 0.55 * l, uOwn[6]);
    col = mix(col, mix(uKind[4], uKind[3], o.h) * (0.75 + 0.4 * (1.0 - pale)), uOwn[6] * smoothstep(0.3, 0.2, l) * (1.0 - 0.8 * sat(edge * 2.5)));
  }
  if (bead > 0.0) {
    vec2 n2 = clamp(o.n, -1.0, 1.0);
    if (uOwn[6] < 0.0) n2 = mix(n2, n2 * n2 * n2 * 0.8, -uOwn[6]);
    vec3 n = vec3(n2, sqrt(max(1.0 - dot(n2, n2), 0.0)) + 0.05); n /= length(n);
    const vec3 sun = vec3(-0.53, -0.6, 0.6);
    float wrap = sat(dot(n, sun) * 0.72 + 0.28), gloss = pow(sat(dot(n, normalize(sun + vec3(0.0, 0.0, 1.0)))), 46.0);
    vec3 ball = o.hue * (0.1 + 0.24 * pale + (1.15 - 0.2 * pale) * wrap * wrap) * (0.72 + 0.6 * o.loud) + o.hue * o.hue * (0.22 + 0.5 * o.loud) * pow(1.0 - n.z, 2.0) + vec3(1.0, 0.97, 0.93) * gloss * 0.7;
    col = mix(col, ball, bead);
  }
  col *= mix(1.0, shade, mix(0.85, 0.6, pale)); col += o.hue * sheen * 0.16;
  float dark = bead * smoothstep(0.16, -0.16, o.s);
  ground *= 1.0 - 0.55 * dark;
  float spill = exp(-max(o.d, 0.0) * mix(9.0, 4.0 + 9.0 * max(uOwn[1], 0.0), uVar)) * max(uVar, 0.0);
  ground += o.hue * o.loud * o.loud * 0.5 * spill * (1.0 - pale);
  vec3 c = mix(ground, col, cov * mix(1.0, 0.94, pale));
  c += vec3(0.05) * smoothstep(0.05 + edge, 0.05 - edge, length(o.v)) * step(o.a, 0.02) * (1.0 - pale);
  // a floor fades into its own distance
  if (lay > 0.0) {
    vec3 mean = mix(ground, col, 0.3);
    c = mix(c, mix(mean, ground, 0.4), far * 0.8);
    float away = max(over, smoothstep(5.0, 14.0, depth) * lay);
    if (away > 0.0) {
      vec3 sky = pale * mix(vec3(0.95, 0.925, 0.87), vec3(0.75) + 0.25 * uKind[1], 0.5) * (0.82 + 0.35 * p.y);
      if (deep > 0.0) sky += deep * dsFar(p, p);
      sky += (1.0 - max(pale, deep)) * mix(uKind[0], uKind[1], 0.5) * 0.1 * exp(-max(p.y - 0.3, 0.0) * 9.0);
      c = mix(c, sky, away);
    }
  }
  return c;
}
vec3 render(vec2 p) {
  if (uOwn[0] != 0.0 || uOwn[1] != 0.0 || uOwn[2] != 0.0 || uOwn[3] != 0.0 || uOwn[4] != 0.0 || uOwn[5] != 0.0 || uOwn[6] != 0.0 || uOwn[7] != 0.0) return dsOther(p);
  float asp = uRes.x / uRes.y;
  vec2 uv = vec2(p.x / asp + 0.5, 0.5 - p.y); // across 0 to 1, down 0 to 1
  float rows = mix(27.0, 36.0, uVar);
  vec2 g = uv * vec2(rows * asp, rows);
  float shift = uVar > 0.5 && mod(floor(g.y), 2.0) > 0.5 ? 0.5 : 0.0; // every other row half a dot along
  g.x += shift;
  vec2 id = floor(g), f = fract(g) - 0.5;
  vec4 m = piece(vec2((id.x + 0.5 - shift) / (rows * asp), (id.y + 0.5) / rows));
  float loud = sat(m.a * (0.6 + 0.6 * uEnergy));
  float r = 0.56 * sqrt(loud), d = length(f) - r;
  float edge = rows / uRes.y * 1.2;
  vec3 hue = m.rgb / max(m.a, 0.001);
  vec3 col = hue * (0.4 + 0.75 * m.a) * smoothstep(edge, -edge, d);
  col += hue * loud * loud * 0.5 * exp(-max(d, 0.0) * mix(9.0, 4.0, uVar)) * uVar; // b: light spills past the dot
  col += vec3(0.05) * smoothstep(0.05 + edge, 0.05 - edge, length(f)) * step(m.a, 0.02); // a speck where nothing sounds
  return col;
}
