// name: Banded planet
// a: Storm belts
// b: Thin rim
// what: Close over a banded giant: belts of cream, rust and slate with curled edges, a great oval storm, the soft line where night begins, and rings seen edge on with their shadow across the clouds; or only its dark edge against the stars, under a thin skin of orange and blue air, with a small half moon just risen.
// follows: The low sounds lie in the southern belts, the high ones in the northern: each is roughened and lit by its own. The kinds tint belts, and strokes of the piece stain the clouds or glow through the night side. A hit is a pale storm or lightning; a cue sends a moon and its shadow across, or the sun breaks over the edge. The loop sways the sun.
float bpCore; vec2 bpIn;      // how far inside an oval storm, and where in it
float bpPale, bpGlow;         // how pale that storm is; how much the belt is heard
vec2 bpW; vec3 bpTex;         // the place after the winds have bent it, and the streaks there
// Latitude in belts, and how many belts there are to a radian.
float bpS(float lat) { return lat * 5.2 + 0.3 * sin(lat * 5.0 + 1.0) + 0.13 * sin(lat * 13.0 + 4.0) + 8.0; }
float bpSlope(float lat) { return 5.2 + 1.5 * cos(lat * 5.0 + 1.0) + 1.69 * cos(lat * 13.0 + 4.0); }
// The colour of a kind of sound as a pigment, deep rather than pale. A green turns to slate or ochre: no cloud is green.
vec3 bpDye(vec3 c) {
  c /= max(max(c.r, max(c.g, c.b)), 0.05);
  float over = max(c.g - max(c.r, c.b), 0.0);
  c += over * vec3(0.35, -0.6, 0.1);
  return c * c * 1.15;
}
int bpKind(float k) { return (int(k) + 10) % 5; }
// How fast a belt slides, in radians a second.
float bpSpeed(float i) { return (mod(i, 2.0) < 0.5 ? 0.006 : -0.005) + 0.006 * (hash11(i + 3.1) - 0.5); }
float bpAmount(float k) { return k < 0.5 ? uDrone : k < 1.5 ? uPad : k < 2.5 ? uTexture : k < 3.5 ? uPhrase : 0.6 * uHits; }
float bpHeard(float i) { return band((i - 4.0) / 11.0); }
// What a belt is made of.
vec3 bpBelt(float i) {
  float h = hash11(i * 1.7 + 0.4);
  return mod(i, 2.0) < 0.5
    ? mix(vec3(0.82, 0.72, 0.55), vec3(0.74, 0.74, 0.7), smoothstep(0.35, 0.8, h))
    : h < 0.4 ? vec3(0.42, 0.19, 0.09) : h < 0.7 ? vec3(0.24, 0.27, 0.31) : vec3(0.52, 0.33, 0.17);
}
// A chain of ovals round one latitude. Bends the place round each and winds it up inside.
void bpOvals(inout vec2 w, vec2 at, float lat0, float speed, float n, vec2 size, float wind, float pale, float seed) {
  float per = TAU / n, x = at.x - speed * uTime + seed, id = floor(x / per + 0.5);
  float h = hash11(mod(id, n) * 3.7 + seed);
  size *= 0.72 + 0.4 * h;
  vec2 v = vec2(x - id * per, at.y - lat0) / size;
  float r2 = dot(v, v);
  if (r2 > 9.0) return;
  float g = exp(-r2) - 0.0001234;
  w += (rot(wind * g) * v * (1.0 - 0.7 * g) - v) * size;
  float c = (1.0 - smoothstep(0.75, 1.15, sqrt(r2)));
  if (c > bpCore) { bpCore = c; bpIn = v; bpPale = pale; }
}
// The row of curls where two belts rub: the edge nearest is wound into whorls that move at its own speed.
void bpCurls(inout vec2 w, float grain, float wind) {
  float s = bpS(w.y), k = floor(s + 0.5), d = s - k;
  float n = floor((16.0 + 12.0 * hash11(k + 7.0)) * grain);
  float x = (w.x - 0.5 * (bpSpeed(k) + bpSpeed(k - 1.0)) * uTime) * n / TAU + hash11(k + grain) * 5.0;
  float j = floor(x), f = x - j - 0.5;
  vec2 h = hash22(vec2(mod(j, n), k * 3.0 + grain * 10.0) + 0.5);
  float win = (1.0 - 4.0 * f * f) * (1.0 - 4.0 * d * d);
  vec2 stretch = vec2(1.9, 1.0);
  vec2 v = vec2((f - 0.4 * (h.x - 0.5)) * TAU / n, d / bpSlope(w.y)) / stretch;
  float r = TAU / n * 0.2, own = 0.35 + 0.75 * hash11(k * 2.3 + 1.1);
  float turn = wind * (0.15 + 1.1 * h.y * h.y) * own * win * win * exp(-dot(v, v) / (r * r)) * (0.85 + 0.3 * bpHeard(k)) * sign(bpSpeed(k - 1.0) - bpSpeed(k));
  w += (rot(turn) * v - v) * stretch;
}
// The fine streaks of one belt, carried along by it.
vec3 bpStreaks(vec2 w, float s, float i, vec2 fine) {
  float x = w.x - bpSpeed(i) * uTime + i * 17.3;
  float a = noise(vec2(x * 4.0, s * 5.0));
  float b = noise(vec2(x * 9.0 + 2.0 * a, s * 15.0));
  float c = noise(vec2(x * 24.0 + 3.0 * b, s * 34.0));
  return vec3(a, mix(0.5, b, fine.x), mix(0.5, c, fine.y));
}
// The cloud tops at a longitude and latitude, as paint. z is how far the place faces us, p where it is in the picture.
vec3 bpClouds(vec2 at, float z, vec2 p, float sharp) {
  vec2 w = at;
  bpCore = 0.0; bpPale = 0.0; bpIn = vec2(0.0);
  bpOvals(w, at, 0.16, 0.0045, 3.0, vec2(0.25, 0.105), 3.4, 0.0, 0.14);
  bpOvals(w, at, 0.8, -0.004, 5.0, vec2(0.11, 0.055), -3.0, 1.0, 2.0);
  bpOvals(w, at, -0.28, 0.0035, 7.0, vec2(0.085, 0.042), 3.0, 1.0, 4.0);
  w.y += 0.05 * (noise(vec2(at.x * 3.0 - uTime * 0.008, at.y * 4.0)) - 0.5);
  w.x += 0.12 * (noise(vec2(at.x * 4.0 + 9.0, at.y * 7.0 + uTime * 0.01)) - 0.5);
  w.y += 0.022 * (noise(vec2(at.x * 11.0 + uTime * 0.013, at.y * 10.0 + 5.0)) - 0.5);
  bpCurls(w, 1.0, 5.0);
  bpCurls(w, 2.3, 4.4);
  float s = bpS(w.y), k = floor(s + 0.5), d = s - k;
  float wide = fwidth(s), e = smoothstep(-0.12 - wide, 0.12 + wide, d); // where the clouds are wound too tight to draw, they are smoothed
  vec2 fine = (1.0 - smoothstep(vec2(0.025, 0.008), vec2(0.07, 0.03), vec2(wide))) * vec2(1.0, smoothstep(0.08, 0.38, z));
  vec3 tex = mix(bpStreaks(w, s, k - 1.0, fine), bpStreaks(w, s, k, fine), e);
  bpW = w; bpTex = tex;
  vec3 c = mix(bpBelt(k - 1.0), bpBelt(k), e);
  float heard = mix(bpHeard(k - 1.0), bpHeard(k), e);
  bpGlow = heard;
  float line = noise(vec2(s * 4.0, 2.5)) + 0.4 * mix(0.5, noise(vec2(s * 11.0, 8.5)), fine.x);
  c *= 0.74 + 0.36 * line;
  c *= 1.0 + sharp * (0.55 + 0.5 * heard) * (0.55 * (tex.x - 0.5) + 0.6 * (tex.y - 0.5) + 0.45 * (tex.z - 0.5));
  c = mix(c, c * vec3(1.22, 0.86, 0.64), smoothstep(0.5, 0.8, tex.x) * 0.5);
  c = mix(c, vec3(dot(c, vec3(0.333))) * vec3(0.84, 1.0, 1.16), smoothstep(0.55, 0.85, tex.y) * 0.45 + 0.5 * smoothstep(0.6, 1.2, abs(at.y)));
  // each belt takes a little of the colour of a kind of sound
  float lum = dot(c, vec3(0.3, 0.55, 0.15));
  float a0 = bpAmount(float(bpKind(k - 1.0))), a1 = bpAmount(float(bpKind(k)));
  vec3 d0 = bpDye(uKind[bpKind(k - 1.0)]), d1 = bpDye(uKind[bpKind(k)]);
  c = mix(c, (0.3 * lum + 0.7 * c) * (0.15 + 1.4 * mix(d0, d1, e)), 0.8 * mix(a0, a1, e) * (1.0 - 0.8 * lum) * (0.4 + 0.9 * tex.x));
  // what is sounding in the piece lies on the belts as a stain, torn by the same winds
  vec2 uv = vec2(p.x / 1.78 + 0.5, 0.5 - p.y) + (w - at) * vec2(0.5, -0.6);
  vec4 pc = piece(uv);
  c = mix(c, (0.35 * lum + 0.65 * c) * (0.15 + 1.4 * bpDye(pc.rgb / max(pc.a, 0.05))), 0.6 * (1.0 - 0.6 * lum) * smoothstep(0.02, 0.8, pc.a) * smoothstep(0.25, 0.65, tex.x * 0.5 + tex.y * 0.5));
  c *= 1.0 + 0.45 * uEnergy * heard;
  // inside an oval: a slow wheel of cloud with a pale collar
  if (bpCore > 0.0) {
    float l = length(bpIn);
    vec2 v = rot(3.0 * l - uTime * 0.04) * bpIn;
    float wheel = noise(v * 3.0 + 4.0) * 0.6 + 0.4 * noise(vec2(l * 9.0, 2.0) + v);
    vec3 heart = mix(mix(vec3(0.55, 0.2, 0.1), vec3(0.72, 0.4, 0.24), wheel), vec3(0.85, 0.82, 0.74) * (0.75 + 0.4 * wheel), bpPale);
    heart = mix(heart, vec3(0.86, 0.78, 0.66), smoothstep(0.55, 0.95, l) * 0.6);
    c = mix(c, heart, bpCore * 0.85);
  }
  return mix(vec3(0.6, 0.48, 0.36), c, sat(z * 8.0));
}
// How much of the sun a ring stops, by how far out it is.
float bpRing(float r, float px) {
  float a = smoothstep(1.26 - px, 1.26 + px, r) * (1.0 - smoothstep(2.26 - px, 2.26 + px, r));
  float inner = 0.25 + 0.65 * smoothstep(1.48 - px, 1.54 + px, r);
  float gap = smoothstep(1.93 - px, 1.94 + px, r) * (1.0 - smoothstep(2.0 - px, 2.01 + px, r));
  float far = mix(1.0, 0.65, smoothstep(1.97 - px, 1.97 + px, r));
  return a * inner * far * (1.0 - 0.92 * gap) * mix(1.0, 0.75 + 0.5 * noise(vec2(r * 26.0, 1.5)), sat(1.0 - px * 20.0));
}
mat3 bpFrame(float turn, float tip) {
  float c = cos(turn), s = sin(turn), a = cos(tip), b = sin(tip);
  return mat3(1.0, 0.0, 0.0, 0.0, a, b, 0.0, -b, a) * mat3(c, -s, 0.0, s, c, 0.0, 0.0, 0.0, 1.0);
}
vec3 bpStorm(vec2 p) {
  vec2 mid = vec2(0.2, -0.2);
  const float R = 0.86;
  vec2 q = (p - mid) / R;
  float px = 1.0 / (uRes.y * R), r = length(q);
  mat3 M = bpFrame(0.25, 0.028);
  // the sun swings a little with the loop
  float az = -1.0 + 0.1 * sin(TAU * uLoop) + 0.08 * sin(uTime * 0.02);
  vec3 sunP = M * vec3(sin(az), 0.0, cos(az));
  sunP = normalize(vec3(sunP.x, -0.3, sunP.z));
  vec3 sun = sunP * M;
  vec3 col = vec3(0.0002, 0.0003, 0.0006);
  float z = sqrt(max(1.0 - r * r, 0.0));
  float side = dot(q, sun.xy) / max(r, 0.001);
  // a moon that crosses on a cue, and where it hangs
  float go = 1.0 - uCue, seen = smoothstep(0.0, 0.14, go) * smoothstep(0.0, 0.25, uCue);
  vec2 along = vec2(cos(0.25), sin(0.25));
  vec3 moon = vec3(along * (-0.62 + 0.55 * go) + vec2(-along.y, along.x) * 0.3, 1.1);
  const float mr = 0.042;
  // the air standing over the edge
  float air = mix(260.0, 110.0, uSpace) / (1.0 + uMic);
  col += vec3(0.5, 0.62, 0.8) * (0.4 + 0.5 * uMic) * exp(-max(r - 1.0, 0.0) * air) * smoothstep(-0.3, 0.8, side);
  float inside = (1.0 - smoothstep(1.0 - px, 1.0 + px, r));
  if (r < 1.0 + px) {
    vec3 n = vec3(q, z), P = M * n;
    float lat = asin(clamp(P.y, -1.0, 1.0)), lon = atan(P.x, P.z + 1e-5);
    float mu = max(z, 0.04), mu0 = dot(n, sun);
    vec3 c = bpClouds(vec2(lon, lat), z, p, 0.7 + 0.6 * uTone);
    // a hit: a pale storm boils up in a belt and its front runs out
    vec2 at = vec2(-0.48 + 0.28 * sin(uTime * 0.11), 0.22 + 0.05 * sin(uTime * 0.073 + 1.0));
    vec2 v = (mix(bpW, vec2(lon, lat), 0.4) - at) / vec2(0.15, 0.075);
    float l = length(v), front = l - 0.6 - 2.0 * (1.0 - uHits);
    float plume = uHits * exp(-l * l * 0.7) * smoothstep(0.1, 0.75, bpTex.y * 0.6 + bpTex.z * 0.5) + 0.8 * uHits * uHits * exp(-front * front * 5.0) * (0.3 + bpTex.x);
    vec3 pale = mix(vec3(1.0, 0.97, 0.92), bpDye(uKind[4]), 0.22);
    c = mix(c, pale, sat(plume));
    float lit = smoothstep(-0.12, 0.55, mu0) * (0.3 + 0.7 * sat(mu0)) * pow(mu, 0.28);
    // the shadow of the rings, and of the moon
    float t = -P.y / sunP.y;
    float shade = t > 0.0 ? 0.82 * bpRing(length((P + sunP * t).xz), 0.012) : 0.0;
    vec3 dm = n - moon; float b = dot(dm, sun);
    shade = max(shade, b < 0.0 ? 0.95 * seen * (1.0 - smoothstep(mr * 0.7, mr * 1.5, length(dm - sun * b))) : 0.0);
    float open = lit;
    lit *= 1.0 - shade;
    vec3 tone = mix(vec3(1.0, 0.42, 0.18), vec3(1.0, 0.97, 0.92), smoothstep(0.0, 0.42, mu0));
    vec3 disc = c * tone * lit * 2.15 + pale * plume * open * 1.6 + c * vec3(0.0035, 0.005, 0.009);
    disc += vec3(0.4, 0.5, 0.65) * pow(1.0 - z, 4.0) * (0.25 + 0.3 * uMic) * smoothstep(-0.1, 0.5, mu0);
    // keys: far lightning under the clouds of the night side
    vec2 kv = (bpW - vec2(0.95 + 0.1 * sin(uTime * 0.2), 0.25 + 0.2 * sin(uTime * 0.13))) / vec2(0.12, 0.07);
    disc += vec3(0.5, 0.6, 1.0) * uKeys * 0.5 * exp(-dot(kv, kv)) * bpTex.y * (1.0 - smoothstep(0.0, 0.35, mu0));
    col = mix(col, disc, inside);
  }
  // the rings, edge on: a line before the globe, and their far side behind it
  vec3 ro = M * vec3(q, 0.0), rd = M * vec3(0.0, 0.0, 1.0);
  float h = -ro.y / rd.y;
  if (r > 1.0 || h > z) {
    vec3 X = ro + rd * h;
    float a = bpRing(length(X.xz), min(px / abs(rd.y), 0.3));
    float b = dot(X, sunP), off = length(X - sunP * b);
    float dark = b < 0.0 ? (1.0 - smoothstep(0.98, 1.02, off)) : 0.0;
    col = mix(col, vec3(0.62, 0.53, 0.43) * (0.62 + 1.5 * uCue) * (1.0 - 0.98 * dark), a * 0.92);
  }
  // the moon
  vec2 md = (q - moon.xy) / mr; float ml = length(md);
  if (ml < 1.2) {
    vec3 mn = vec3(md, sqrt(max(1.0 - ml * ml, 0.0)));
    float grey = 0.6 + 0.5 * noise(md * 2.5 + 3.0);
    col = mix(col, vec3(0.8, 0.77, 0.72) * grey * (0.02 + 1.3 * sat(dot(mn, sun))), seen * (1.0 - smoothstep(1.0 - 2.0 * px / mr, 1.0, ml)));
  }
  return col;
}
// Only the edge of the globe, seen from its night side, with the sun just behind it.
vec3 bpRim(vec2 p) {
  const float R = 2.2;
  vec2 mid = vec2(0.35, -2.27), q = (p - mid) / R;
  float r = length(q), px = 1.0 / (uRes.y * R), h = (r - 1.0) * R;
  float az = -0.2 + 0.035 * sin(TAU * uLoop) + 0.03 * sin(uTime * 0.017); // where on the edge the sun waits
  vec2 toSun = vec2(sin(az), cos(az));
  float ang = atan(q.x, max(q.y, 0.01)) - az;
  vec3 sun = normalize(vec3(toSun * 0.3, -0.954));
  vec3 col = vec3(0.0002, 0.0003, 0.0007);
  float inside = (1.0 - smoothstep(1.0 - px, 1.0 + px, r));
  // far stars
  vec2 g = p * 13.0, id = floor(g), hs = hash22(id + 3.0);
  float star = step(0.7, hs.x) * (1.0 - smoothstep(0.3, 1.5, length(g - id - 0.15 - 0.7 * hash22(id + 11.0)) / 13.0 * uRes.y * min(1.0, 700.0 / uRes.y)));
  col += star * (0.02 + 0.45 * pow(hs.y, 7.0)) * mix(vec3(0.7, 0.8, 1.0), vec3(1.0, 0.85, 0.7), hash21(id + 5.0)) * smoothstep(0.02, 0.25, h);
  // the moon, risen just clear of the air
  vec2 mp = vec2(0.36 + 0.06 * sin(uTime * 0.006), 0.16 + 0.05 * sin(uTime * 0.011));
  const float mr = 0.048;
  vec2 md = (p - mp) / mr; float ml = length(md);
  float hm = (1.0 - smoothstep(1.0 - 2.0 / (uRes.y * mr), 1.0, ml));
  vec3 mn = vec3(md, sqrt(max(1.0 - ml * ml, 0.0)));
  vec3 mtone = vec3(0.9, 0.86, 0.8) * (0.55 + 0.6 * noise(md * 2.2 + 3.0)) * (0.002 + 1.5 * smoothstep(-0.02, 0.95, dot(mn, normalize(vec3(-0.7, -0.45, -0.12)))));
  col = mix(col, mtone, hm);
  // the air: orange against the globe, then blue, then layers thinning into the dark
  float glow = exp(-ang * ang * 14.0), wide = exp(-ang * ang * 4.0), up = max(h, 0.0);
  float tall = mix(0.7, 1.4, uSpace) * (1.0 + 0.5 * uMic);
  float layers = 1.0 + (0.15 + 0.35 * uTexture) * sin(up / tall * 420.0 + 2.0 * noise(vec2(ang * 5.0, uTime * 0.03))) * exp(-up * 22.0);
  vec3 air = vec3(1.0, 0.36, 0.08) * (1.8 * glow + 0.1) * (0.8 + 0.8 * uDrone) * exp(-up / (0.006 * tall));
  air += vec3(1.0, 0.75, 0.5) * 2.0 * glow * glow * exp(-up / (0.0035 * tall));
  air += mix(vec3(0.12, 0.34, 0.9), bpDye(uKind[1]), 0.3 * uPad) * (0.6 + 0.7 * uPad) * (wide * layers + 0.02) * exp(-up / (0.022 * tall));
  air += vec3(0.06, 0.1, 0.4) * 0.2 * wide * exp(-up / (0.09 * tall));
  // a phrase lights a thread of glowing air high over the edge
  float thread = (up - 0.04 * tall - 0.004 * noise(vec2(ang * 9.0, uTime * 0.05))) / 0.007;
  air += bpDye(uKind[3]) * uPhrase * 0.13 * exp(-thread * thread) * wide * smoothstep(0.2, 0.9, noise(vec2(ang * 9.0 + uTime * 0.03, 3.0)));
  // a cue: the sun breaks over the edge as a bead, and light runs out along the rim both ways
  vec2 bead = (q - toSun) * R;
  float run = (abs(ang) - 0.5 * (1.0 - uCue)) * 16.0;
  vec3 flare = uCue * vec3(1.0, 0.72, 0.42) * (1.6 * exp(-dot(bead, bead) * 2600.0) + 0.35 * exp(-length(bead) * 22.0));
  flare += uCue * vec3(1.0, 0.6, 0.3) * 1.6 * exp(-run * run) * exp(-abs(h) * 180.0);
  air *= 1.0 + 1.6 * uCue * wide;
  col += air * (1.0 - inside);
  if (r < 1.0 + px) {
    float z = sqrt(max(1.0 - r * r, 0.0));
    vec3 n = vec3(q, z), P = bpFrame(-0.3, 0.75) * n;
    float lat = asin(clamp(P.y, -1.0, 1.0)), lon = atan(P.x, P.z + 1e-5);
    vec3 c = bpClouds(vec2(lon, lat) * 1.6, z, p, 0.8 + 0.6 * uTone);
    float mu0 = dot(n, sun);
    float lit = smoothstep(-0.12, 0.32, mu0); lit *= lit * (0.2 + 0.8 * glow) * (1.0 + 1.8 * uCue * glow);
    vec3 disc = c * mix(vec3(1.0, 0.28, 0.07), vec3(1.0, 0.8, 0.55), smoothstep(0.0, 0.3, mu0)) * lit * 3.0;
    float night = (1.0 - smoothstep(-0.05, 0.1, mu0));
    disc += c * vec3(0.016, 0.024, 0.044);
    // what sounds in the piece glows up through the night clouds, and each belt with its own part of the spectrum
    vec4 pc = piece(vec2(p.x / 1.78 + 0.5, sat(1.0 + (p.y + 0.02) * 2.0)));
    disc += bpDye(pc.rgb / max(pc.a, 0.05)) * pc.a * (0.004 + 0.13 * smoothstep(0.46, 0.8, 0.5 * bpTex.x + 0.5 * bpTex.y)) * night * (0.4 + uEnergy);
    disc += c * vec3(0.05, 0.045, 0.045) * smoothstep(0.3, 0.8, bpTex.y) * bpGlow * (0.4 + uEnergy) * night;
    // a hit and the keys: lightning under the cloud
    vec2 lp = vec2(0.28 + 0.3 * sin(uTime * 0.13), -0.27 + 0.06 * sin(uTime * 0.09)), lv = (p - lp) / vec2(0.13, 0.06);
    disc += mix(vec3(0.75, 0.8, 1.0), bpDye(uKind[4]), 0.4) * uHits * 1.5 * exp(-dot(lv, lv)) * (0.1 + 1.2 * bpTex.x * bpTex.y);
    vec2 kv = (p + vec2(0.3 + 0.2 * sin(uTime * 0.1), 0.36)) / vec2(0.1, 0.045);
    disc += vec3(0.4, 0.55, 1.0) * uKeys * 0.6 * exp(-dot(kv, kv)) * bpTex.y;
    col = mix(col, disc + air * 0.5 * exp(h * 60.0), inside);
  }
  return col + flare;
}
vec3 render(vec2 p) { return screenOf(uVar < 0.5 ? bpStorm(p) : bpRim(p)); }
