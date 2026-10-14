// name: Sunflower
// a: Seed dome
// b: Funnel
// what: The piece set out as the seeds of a sunflower head: once round is the loop, from the middle to the rim is the room from back to front, and a seed is as big and bright as the sound there.
// follows: The head turns once a loop so that now is always nearest you, the piece sizes and colours the seeds, the low band sends a swell outward, a hit runs a ring from the middle to the rim.
const float GOLD = 1.61803398875;
float SEEDS;                       // seeds on the whole ball (dome), or down the whole funnel
const float SLANT = 2.45, DEEP = 3.0, CA = 0.848, SA = 0.53; // the funnel: its length along the wall, how far off its point is, its angle
// Where seed number i sits, each one the golden angle on from the last.
vec3 seedAt(float i, float cone) {
  float ph = TAU * fract(i * (GOLD - 1.0));
  if (cone < 0.5) {
    float zz = 1.0 - (2.0 * i + 1.0) / SEEDS, sr = sqrt(1.0 - zz * zz);
    return vec3(cos(ph) * sr, sin(ph) * sr, zz);
  }
  float s = SLANT * sqrt((i + 0.5) / SEEDS);
  return vec3(cos(ph) * s * SA, sin(ph) * s * SA, DEEP - s * CA);
}
// The seed nearest to p. phi is p's angle round the middle, ic the seed number that would sit at its distance out,
// and q says how many seeds go round there for each one going out (it picks which two spirals to walk along).
float seedNear(vec3 p, float phi, float ic, float q, float last, float cone, out vec3 at) {
  float k = max(2.0, floor(log(sqrt(5.0) * max(q, 1.0)) / log(GOLD * GOLD)));
  float Fk = pow(GOLD, k) / sqrt(5.0);
  vec2 F = vec2(round(Fk), round(Fk * GOLD));
  vec2 dphi = TAU * (fract(F * (GOLD - 1.0) + 0.5) - 0.5);
  mat2 B = mat2(dphi.x, F.x, dphi.y, F.y);
  vec2 c = floor(inverse(B) * vec2(phi, ic));
  float best = 1e3, bi = 0.0;
  at = seedAt(0.0, cone);
  for (int s = 0; s < 4; s++) {
    vec2 o = vec2(float(s & 1), float(s >> 1));
    float i = clamp(dot(F, c + o), 0.0, last);
    vec3 s3 = seedAt(i, cone);
    float d2 = dot(s3 - p, s3 - p);
    if (d2 < best) { best = d2; bi = i; at = s3; }
  }
  return bi;
}
// The light from one point of the head. p is the point in the head's own frame; nw is the way the head faces there,
// in the room, for the lamp. Returns colour, and in a how much of the pixel the seed covers.
vec4 seeds(vec3 p, vec3 nw, float i, vec3 at, float N, float gap, float px, float dim) {
  float v = sqrt((i + 0.5) / N);                           // the middle is the back of the room, the rim the front
  float place = fract(atan(at.y, at.x) / TAU);             // once round is the loop
  float row = mix(0.03, 0.97, v);
  vec4 m = piece(vec2(place, row));
  float join = min(place, 1.0 - place);                    // where the loop's end meets its start, blend the two
  if (join < 0.02) m = mix(0.5 * (piece(vec2(0.004, row)) + piece(vec2(0.996, row))), m, smoothstep(0.0, 0.02, join));
  float loud = sat(m.a * (0.65 + 0.6 * uEnergy));
  float kick = sat(uHits * 1.3) + 0.6 * uCue;
  float ringV = 1.15 * (1.0 - sat(uHits * 1.3));
  float ring = kick * exp(-pow((v - ringV) * 8.0, 2.0));
  float swell = 0.5 + 0.5 * sin(v * 13.0 - uTravel * 1.7);
  float r = gap * (0.13 + 0.42 * pow(loud, 0.6) * (0.88 + 0.24 * uLow * swell) + 0.03 * uLow * swell + 0.2 * ring);
  vec3 off = p - at;
  float d = length(off);
  float cover = smoothstep(r + px, r - px, d);
  vec3 hue = m.a > 0.004 ? pow(m.rgb / m.a, vec3(1.4)) * 1.2 : vec3(0.5, 0.42, 0.3);
  hue = mix(hue, uKind[4] * 1.3, sat(ring));
  // each seed is a little dome of its own, lit from up and to the left
  float rho = sat(d / max(r, 1e-4));
  vec3 lamp = normalize(vec3(-0.5, 0.75, -0.45));
  float body = sat(dot(nw, lamp) * 0.7 + 0.3);
  float glint = pow(sat(1.0 - length(off.xy / max(r, 1e-4) - vec2(-0.3, 0.35)) * 1.6), 3.0);
  vec3 col = hue * (0.05 + 0.12 * body) * (1.0 - 0.6 * rho * rho);                // a quiet seed: dark, just catching the lamp
  col += hue * loud * (0.5 + 1.3 * loud) * (0.45 + 0.55 * (1.0 - rho * rho)) * (0.3 + 0.7 * body); // a sounding seed glows
  col += vec3(1.0, 0.95, 0.85) * glint * (0.1 + 0.5 * loud + 0.5 * ring) * body;
  col += hue * ring * 0.8;
  col *= cover;
  col += hue * (loud * loud * 0.55 + ring * 0.5) * exp(-max(d - r, 0.0) / gap * 5.0) * (1.0 - cover); // light past the seed's edge
  return vec4(col * dim, cover);
}
vec3 render(vec2 p) {
  vec3 col = vec3(0.0);
  vec3 at;
  if (uVar < 0.5) {
    // a: a shallow dome leaning toward us, seen from a little above its rim
    float spin = PI * 0.5 - TAU * uLoop;
    float tau = 0.86 + 0.05 * sin(uTime * 0.13);
    vec3 a = vec3(0.0, sin(tau), -cos(tau)), e1 = vec3(1.0, 0.0, 0.0), e2 = vec3(0.0, -cos(tau), -sin(tau));
    vec3 ro = vec3(0.0, 0.72, -3.0), rd = normalize(vec3(p.x, p.y - 0.1, 3.0));
    float b = dot(ro, rd), c = dot(ro, ro) - 1.0, h = b * b - c;
    if (h < 0.0) return col;
    float t = -b - sqrt(h);
    vec3 pw = ro + rd * t;
    vec3 pl = vec3(dot(pw, e1), dot(pw, e2), dot(pw, a));
    float capZ = 0.86;                                     // the dome is the top of the ball down to here
    SEEDS = 13000.0;
    float N = floor(SEEDS * (1.0 - capZ) * 0.5);
    float edge = pl.z - capZ;
    if (edge < -0.03) return col;
    pl.xy = rot(spin) * pl.xy;
    float px = length(fwidth(pl)) * 0.75;
    float fog = exp(-(t - 2.2) * 1.6);
    float i = seedNear(pl, atan(pl.y, pl.x), (1.0 - pl.z) * SEEDS * 0.5 - 0.5, PI * SEEDS * (1.0 - pl.z * pl.z), N - 1.0, 0.0, at);
    vec4 s = seeds(pl, pw, i, at, N, sqrt(4.0 * PI / SEEDS), px, fog);
    col = s.rgb * smoothstep(-0.004, 0.004, edge);
    return screenOf(col * 1.3);
  }
  // b: the same seeds down the inside of a funnel; we look in from its mouth, and the back of the room is far off at its point
  float spin = -PI * 0.5 - TAU * uLoop;
  SEEDS = 1700.0;
  vec2 sway = 0.035 * vec2(sin(uTime * 0.13), cos(uTime * 0.1));
  vec3 rd = normalize(vec3(p + sway, 0.9));
  float ta = SA / CA;
  float t = ta * DEEP / (length(rd.xy) + ta * rd.z);
  vec3 pw = rd * t;
  float s = (DEEP - pw.z) / CA;                            // how far up the wall from the point
  vec3 pl = pw; pl.xy = rot(spin) * pl.xy;
  float phi = atan(pl.y, pl.x);
  vec3 nw = vec3(-CA * normalize(pw.xy + 1e-5), -SA);      // the wall faces the middle and us
  float ic = SEEDS * (s / SLANT) * (s / SLANT) - 0.5;
  float px = length(fwidth(pw)) * 0.75;
  float i = seedNear(pl, phi, ic, 4.0 * PI * SA * (ic + 0.5), SEEDS - 1.0, 1.0, at);
  float gap = sqrt(PI * SLANT * SLANT * SA / SEEDS);
  float fog = exp(-(t - 1.0) * 0.55);
  // the lamp is at the mouth, up and to the left; the facing is bent a little so the far wall still takes some of it
  vec4 sd = seeds(pl, normalize(nw + vec3(-0.3, 0.5, -0.6)), i, at, SEEDS, gap, px, fog);
  col = sd.rgb;
  // a small light at the far point, where the back of the room is
  col += (uKind[0] * (0.3 + uDrone) + uKind[1] * uPad + uKind[4] * (sat(uHits * 1.3) + uCue)) * 0.05 * exp(-length(p + sway) * 30.0);
  return screenOf(col * 1.3);
}
