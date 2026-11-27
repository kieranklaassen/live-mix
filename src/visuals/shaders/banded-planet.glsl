// name: Banded planet
// a: Storm belts
// b: Thin rim
// what: Close over a banded giant: belts of cream, rust and slate with curled edges, a great oval storm, the soft line where night begins, and rings seen edge on with their shadow across the clouds; or only its dark edge against the stars, under a thin skin of orange and blue air, with a small half moon just risen.
// follows: The low sounds lie in the southern belts, the high ones in the northern: each is roughened and lit by its own. The kinds tint belts, and strokes of the piece stain the clouds or glow through the night side. A hit is a pale storm or lightning; a cue sends a moon and its shadow across, or the sun breaks over the edge. The loop sways the sun.
// own: 0 1 calm straight belts with no curls, -1 torn and marbled all over; 1 1 many narrow belts, -1 two or three broad ones; 2 1 pale cracked ice, -1 a sea with land and torn cloud; 3 1 far off: the whole globe, small (b: a ring of light), -1 close over it (b: a flat horizon); 4 1 rings opened wide toward us (b: an arch of rings), -1 no rings; 5 1 full daylight, -1 a thin crescent (b: the sun gone, lights over the pole); 6 1 a pale sky like paper, -1 clouds of stars; 7 1 one vast storm, -1 a row of moons; any of them colours the belts as the kinds
float bpCore; vec2 bpIn;      // how far inside an oval storm, and where in it
float bpPale, bpGlow;         // how pale that storm is; how much the belt is heard
vec2 bpW; vec3 bpTex;         // the place after the winds have bent it, and the streaks there
float bpAny, bpMany;          // how far the belts take the kinds' colours; how many times as many belts
vec3 bpSun;                   // where the sun stands, from us
float bpUp(float x) { return max(x, 0.0); }
// Latitude in belts, and how many belts there are to a radian.
float bpS(float lat) { return (lat * 5.2 + 0.3 * sin(lat * 5.0 + 1.0) + 0.13 * sin(lat * 13.0 + 4.0)) * bpMany + 8.0; }
float bpSlope(float lat) { return (5.2 + 1.5 * cos(lat * 5.0 + 1.0) + 1.69 * cos(lat * 13.0 + 4.0)) * bpMany; }
// The colour of a kind of sound as a pigment, deep rather than pale; a green turns to slate or ochre.
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
float bpHeard(float i) { return band((bpMany == 1.0 ? i - 4.0 : (i - 8.0) / bpMany + 4.0) / 11.0); }
// What a belt is made of.
vec3 bpBelt(float i) {
 float h = hash11(i * 1.7 + 0.4);
 vec3 was = mod(i, 2.0) < 0.5
  ? mix(vec3(0.82, 0.72, 0.55), vec3(0.74, 0.74, 0.7), smoothstep(0.35, 0.8, h))
  : h < 0.4 ? vec3(0.42, 0.19, 0.09) : h < 0.7 ? vec3(0.24, 0.27, 0.31) : vec3(0.52, 0.33, 0.17);
 if (bpAny == 0.0) return was;
 vec3 k = uKind[bpKind(i)] * (0.75 + 0.5 * h);
 return mix(was, k * k * (mod(i, 2.0) < 0.5 ? 1.25 : 0.8), 0.9 * bpAny);
}
// A chain of ovals round one latitude: bends the place round each and winds it up.
void bpOvals(inout vec2 w, vec2 at, float lat0, float speed, float n, vec2 size, float wind, float pale, float seed) {
 float per = TAU / n, x = at.x - speed * uTime + seed, id = floor(x / per + 0.5);
 float h = hash11(mod(id, n) * 3.7 + seed);
 size *= 0.72 + 0.4 * h;
 vec2 v = vec2(x - id * per, at.y - lat0) / size;
 float r2 = dot(v, v);
 if (r2 > 9.0) return;
 float g = exp(-r2) - 0.0001234;
 if (uOwn[7] > 0.0) g *= 1.0 - smoothstep(0.6, 1.0, abs(x / per - id) * 2.0) * min(1.0, 8.0 * uOwn[7]);
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
 float calm = 1.0 - bpUp(uOwn[0]), wild = bpUp(-uOwn[0]), stir = calm * (1.0 + 1.6 * wild), big = exp2(1.15 * bpUp(uOwn[7]));
 if (wild > 0.0) {
  vec2 e = vec2(noise(at * 2.1 + vec2(uTime * 0.011, 3.0)), noise(at * 2.3 + vec2(9.0, -uTime * 0.013))) - 0.5;
  w += wild * 0.45 * e;
  w += wild * 0.22 * (vec2(noise(w * 5.0 + 3.0 * e), noise(w * 5.0 + 20.0 - 3.0 * e)) - 0.5);
  w += wild * 0.07 * (vec2(noise(w * 13.0), noise(w * 13.0 + 50.0)) - 0.5);
 }
 bpOvals(w, at, 0.16, 0.0045, 3.0, vec2(0.25, 0.105) * big, 3.4 + 2.0 * bpUp(uOwn[7]), 0.0, 0.14);
 if (uVar > 0.5 && uOwn[7] > 0.0) bpOvals(w, at, 0.58, 0.004, 3.0, vec2(0.62, 0.24) * max(uOwn[7], 0.02), 5.4, 0.0, 0.5);
 bpOvals(w, at, 0.8, -0.004, 5.0, vec2(0.11, 0.055), -3.0, 1.0, 2.0);
 bpOvals(w, at, -0.28, 0.0035, 7.0, vec2(0.085, 0.042), 3.0, 1.0, 4.0);
 w.y += 0.05 * stir * (noise(vec2(at.x * 3.0 - uTime * 0.008, at.y * 4.0)) - 0.5);
 w.x += 0.12 * stir * (noise(vec2(at.x * 4.0 + 9.0, at.y * 7.0 + uTime * 0.01)) - 0.5);
 w.y += 0.022 * stir * (noise(vec2(at.x * 11.0 + uTime * 0.013, at.y * 10.0 + 5.0)) - 0.5);
 bpCurls(w, 1.0, 5.0 * calm);
 bpCurls(w, 2.3, 4.4 * calm);
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
 float ice = bpUp(uOwn[2]), sea = bpUp(-uOwn[2]);
 if (ice > 0.0) {                         // a shell of ice, and the cracks that run over it
  float f = noise(at * 2.7 + 4.0), g = noise(at * 6.1 + 11.0), e = 0.5 * (f + g);
  vec2 lines = abs(vec2(noise(at * vec2(2.3, 3.1) + 1.5 * f), noise(at * vec2(4.7, 3.7) + 1.1 * g + 20.0)) - 0.5);
  float fine1 = abs(noise(at * vec2(9.0, 13.0) + 2.0 * e + 40.0) - 0.5);
  float crack = sat((1.0 - smoothstep(0.004, 0.035, lines.x)) + 0.8 * (1.0 - smoothstep(0.0, 0.03, lines.y)) + 0.5 * (1.0 - smoothstep(0.0, 0.07, fine1)));
  vec3 crust = mix(vec3(0.72, 0.76, 0.78), uKind[1] * uKind[1], 0.45) * (0.62 + 0.5 * g) * mix(vec3(1.0), 0.45 + c, 0.75);
  c = mix(c, mix(crust, uKind[2] * uKind[2] * 0.5, crack * (0.55 + 0.4 * f)) * (1.0 + 0.3 * (1.0 - smoothstep(0.03, 0.1, lines.x)) * (1.0 - crack)), ice);
 }
 if (sea > 0.0) {                         // deep water, some land, and cloud lying along the belts
  float land = fbm(at * vec2(1.7, 2.1) + 2.0), shore = smoothstep(0.5, 0.535, land);
  vec3 water = uKind[0] * uKind[0] * (0.22 + 0.5 * smoothstep(0.4, 0.5, land));
  vec3 earth = mix(uKind[2], uKind[3], smoothstep(0.53, 0.68, land)); earth *= earth * (0.5 + 0.5 * noise(at * 23.0));
  float cloud = smoothstep(0.5, 0.78, 0.5 * tex.x + 0.28 * tex.y + 0.12 * tex.z + 0.3 * mix(mod(k - 1.0, 2.0), mod(k, 2.0), smoothstep(-0.3 - wide, 0.3 + wide, d)));
  c = mix(c, mix(mix(water, earth, shore), vec3(0.9, 0.92, 0.94), 0.93 * cloud), sea);
 }
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
  if (bpAny > 0.0) heart = mix(heart, mix(uKind[3], uKind[4], bpPale) * mix(uKind[3], uKind[4], bpPale) * (0.6 + 0.8 * wheel), 0.8 * bpAny);
  heart = mix(heart, mix(vec3(0.86, 0.78, 0.66), uKind[1], 0.6 * bpAny), smoothstep(0.55, 0.95, l) * 0.6);
  c = mix(c, heart, bpCore * 0.85 * (1.0 - 0.8 * max(ice, sea)));
 }
 return mix(mix(vec3(0.6, 0.48, 0.36), uKind[1] * uKind[1], bpAny), c, sat(z * 8.0));
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
// A far off moon: md is where on it we are, its edge at 1. Its colour, and how much it covers.
vec4 bpMoon(vec2 md, float px, float seed) {
 float l = length(md);
 if (l > 1.1) return vec4(0.0);
 vec3 n = vec3(md, sqrt(max(1.0 - l * l, 0.0)));
 float grey = 0.5 + 0.7 * noise(md * 2.3 + seed * 5.0) - 0.25 * smoothstep(0.55, 0.7, noise(md * 5.0 + seed));
 return vec4(mix(vec3(0.75, 0.72, 0.68), uKind[bpKind(seed)] * uKind[bpKind(seed)], 0.35) * grey * (0.015 + 1.7 * sat(dot(n, bpSun))), 1.0 - smoothstep(1.0 - 2.0 * px, 1.0, l));
}
// What is behind the globe.
vec3 bpSpace(vec2 p) {
 if (uOwn[6] > 0.0) return uOwn[6] * mix(vec3(1.25, 1.1, 0.9), uKind[1] * uKind[1] * 1.9, 0.7) * (1.0 - 0.35 * length(p - vec2(-0.5, 0.3))) * (0.96 + 0.08 * noise(p * 3.0));
 if (uOwn[6] == 0.0) return vec3(0.0);
 vec2 v = rot(0.5) * p; float f = fbm(v * vec2(2.0, 3.2) + 5.0), g = fbm(v * vec2(4.0, 7.0) + 11.0);
 float lane = exp(-9.0 * (v.y - 0.1 + 0.2 * (f - 0.5)) * (v.y - 0.1 + 0.2 * (f - 0.5)));
 vec3 c = (uKind[0] * uKind[0] * smoothstep(0.35, 0.8, f) + uKind[3] * uKind[3] * lane * smoothstep(0.35, 0.7, g)) * 0.22 * (0.2 + lane);
 c *= 1.0 - 0.8 * lane * smoothstep(0.5, 0.62, fbm(v * vec2(3.0, 8.0) + 31.0));
 for (int j = 0; j < 2; j++) {
  vec2 g2 = p * (21.0 + 24.0 * float(j)), id = floor(g2), h = hash22(id + 7.0 * float(j));
  c += step(0.72 - 0.4 * lane, h.x) * (0.02 + 0.6 * pow(h.y, 6.0)) * (1.0 - smoothstep(0.4, 1.4, length(g2 - id - 0.2 - 0.6 * hash22(id + 3.0)) / (21.0 + 24.0 * float(j)) * min(uRes.y, 700.0)));
 }
 return -uOwn[6] * c;
}
vec3 bpStorm(vec2 p) {
 vec2 mid = vec2(0.2, -0.2);
 float R = 0.86;
 if (uOwn[3] > 0.0) { R = mix(R, 0.31, uOwn[3]); mid = mix(mid, vec2(-0.02, 0.0), uOwn[3]); }
 if (uOwn[3] < 0.0) { R = mix(R, 2.1, -uOwn[3]); mid = mix(mid, vec2(0.75, -0.95), -uOwn[3]); }
 vec2 q = (p - mid) / R;
 float px = 1.0 / (uRes.y * R), r = length(q);
 mat3 M = bpFrame(0.25, 0.028 + 0.42 * bpUp(uOwn[4]));
 // the sun swings a little with the loop
 float az = -1.0 + 0.1 * sin(TAU * uLoop) + 0.08 * sin(uTime * 0.02) + 0.8 * bpUp(uOwn[5]) - 1.05 * bpUp(-uOwn[5]);
 vec3 sunP = M * vec3(sin(az), 0.0, cos(az));
 sunP = normalize(vec3(sunP.x, -0.3, sunP.z));
 vec3 sun = sunP * M;
 bpSun = sun;
 float paper = bpUp(uOwn[6]);
 vec3 col = vec3(0.0002, 0.0003, 0.0006) + bpSpace(p);
 if (paper > 0.0) { float f = (r - 1.0 - 0.8 * (1.0 - uHits)) * 4.0; col *= 1.0 - 0.45 * paper * uHits * exp(-f * f) * mix(vec3(1.0), 1.0 - uKind[4] * 0.5, 0.5); }
 float z = sqrt(max(1.0 - r * r, 0.0));
 float side = dot(q, sun.xy) / max(r, 0.001);
 // a moon that crosses on a cue, and where it hangs
 float go = 1.0 - uCue, seen = smoothstep(0.0, 0.14, go) * smoothstep(0.0, 0.25, uCue);
 vec2 along = vec2(cos(0.25), sin(0.25));
 vec3 moon = vec3(along * (-0.62 + 0.55 * go) + vec2(-along.y, along.x) * 0.3, 1.1);
 const float mr = 0.042;
 // the air standing over the edge
 float air = mix(260.0, 110.0, uSpace) / (1.0 + uMic);
 col += mix(vec3(0.5, 0.62, 0.8), uKind[0], bpAny) * (1.0 - bpUp(uOwn[6])) * (0.4 + 0.5 * uMic) * exp(-max(r - 1.0, 0.0) * air) * smoothstep(-0.3, 0.8, side);
 float inside = (1.0 - smoothstep(1.0 - px, 1.0 + px, r));
 if (r < 1.0 + px) {
  vec3 n = vec3(q, z), P = M * n;
  float lat = asin(clamp(P.y, -1.0, 1.0)), lon = atan(P.x, P.z + 1e-5);
  float mu = max(z, 0.04), mu0 = dot(n, sun);
  vec3 c = bpClouds(vec2(lon, lat), z, p, 0.7 + 0.6 * uTone);
  // a hit: a pale storm boils up in a belt and its front runs out
  vec2 at = vec2(-0.48 + 0.28 * sin(uTime * 0.11), 0.22 + 0.05 * sin(uTime * 0.073 + 1.0));
  vec2 v = (mix(bpW, vec2(lon, lat), 0.4) - at) / (vec2(0.15, 0.075) * (1.0 + 1.5 * bpUp(uOwn[3])));
  float l = length(v), front = l - 0.6 - 2.0 * (1.0 - uHits);
  float plume = uHits * exp(-l * l * 0.7) * smoothstep(0.1, 0.75, bpTex.y * 0.6 + bpTex.z * 0.5) + 0.8 * uHits * uHits * exp(-front * front * 5.0) * (0.3 + bpTex.x);
  vec3 pale = mix(vec3(1.0, 0.97, 0.92), bpDye(uKind[4]), 0.22);
  c = mix(c, pale, sat(plume));
  float lit = smoothstep(-0.12, 0.55, mu0) * (0.3 + 0.7 * sat(mu0)) * pow(mu, 0.28);
  // the shadow of the rings, and of the moon
  float t = -P.y / sunP.y;
  float shade = t > 0.0 ? 0.82 * (1.0 - bpUp(-uOwn[4])) * bpRing(length((P + sunP * t).xz), 0.012) : 0.0;
  vec3 dm = n - moon; float b = dot(dm, sun);
  shade = max(shade, b < 0.0 ? 0.95 * seen * (1.0 - smoothstep(mr * 0.7, mr * 1.5, length(dm - sun * b))) : 0.0);
  float open = lit;
  lit *= 1.0 - shade;
  vec3 tone = mix(vec3(1.0, 0.42, 0.18), vec3(1.0, 0.97, 0.92), smoothstep(0.0, 0.42, mu0));
  vec3 disc = c * tone * lit * 2.15 + pale * plume * open * 1.6 + c * vec3(0.0035, 0.005, 0.009);
  disc += c * 0.1 * bpUp(uOwn[6]);
  if (uOwn[2] < 0.0) disc -= uOwn[2] * vec3(1.0, 0.85, 0.6) * 0.4 * pow(sat(dot(n, normalize(sun + vec3(0.0, 0.0, 1.0)))), 60.0) * open * (1.0 - smoothstep(0.1, 0.35, c.g));
  disc += mix(vec3(0.4, 0.5, 0.65), uKind[0], bpAny) * pow(1.0 - z, 4.0) * (0.25 + 0.3 * uMic) * smoothstep(-0.1, 0.5, mu0);
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
  col = mix(col, vec3(0.62, 0.53, 0.43) * (0.62 + 1.5 * uCue + 0.9 * bpAny * uHits * exp(-pow(abs(length(X.xz) - 1.3 - 1.1 * (1.0 - uHits)) * 3.0, 2.0))) * (1.0 - 0.98 * dark) * mix(vec3(1.0), 0.35 + uKind[1] * 1.1, bpAny), a * 0.92 * (1.0 - bpUp(-uOwn[4])));
 }
 if (uOwn[7] < 0.0) for (int j = 0; j < 5; j++) {  // a row of moons round it
  float f = float(j), turn = uTime * (0.012 - 0.0015 * f) + f * 1.35 - 1.1, far = 1.14 + 0.2 * f;
  vec3 at = vec3(sin(turn) * far, 0.02, cos(turn) * far) * M;
  float size = 0.05 + 0.045 * hash11(f + 2.3);
  vec4 m = bpMoon((q - at.xy) / size, px / size, f);
  col = mix(col, m.rgb, m.a * -uOwn[7] * (at.z > 0.0 || r > 1.0 ? 1.0 : 0.0));
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
 float R = 2.2, far = bpUp(uOwn[3]), flat_ = bpUp(-uOwn[3]);
 vec2 mid = vec2(0.35, -2.27);
 if (far > 0.0) { R = mix(R, 0.3, far); mid = mix(mid, vec2(0.0, -0.02), far); }
 if (flat_ > 0.0) { R = mix(R, 5.2, flat_); mid.y = mix(mid.y, -5.36, flat_); }
 vec2 q = (p - mid) / R;
 float r = length(q), px = 1.0 / (uRes.y * R), h = (r - 1.0) * R;
 float az = -0.2 + 0.035 * sin(TAU * uLoop) + 0.03 * sin(uTime * 0.017); // where on the edge the sun waits
 vec2 toSun = vec2(sin(az), cos(az));
 float ang = atan(q.x, max(q.y, 0.01)) - az;
 if (far > 0.0) { float round_ = acos(clamp(dot(q, toSun) / max(r, 1e-4), -1.0, 1.0)); ang = mix(ang, round_ * 0.28, far); }
 vec3 sun = normalize(vec3(toSun * 0.3, -0.954 + 1.45 * bpUp(uOwn[5])));
 bpSun = normalize(vec3(-0.7, -0.45, -0.12 + 0.8 * bpUp(uOwn[5])));
 float gone = bpUp(-uOwn[5]), paper = bpUp(uOwn[6]);
 vec3 col = vec3(0.0002, 0.0003, 0.0007) + bpSpace(p);
 float inside = (1.0 - smoothstep(1.0 - px, 1.0 + px, r));
 // far stars
 vec2 g = p * 13.0, id = floor(g), hs = hash22(id + 3.0);
 float star = step(0.7, hs.x) * (1.0 - smoothstep(0.3, 1.5, length(g - id - 0.15 - 0.7 * hash22(id + 11.0)) / 13.0 * uRes.y * min(1.0, 700.0 / uRes.y)));
 col += star * (1.0 - paper) * (0.02 + 0.45 * pow(hs.y, 7.0)) * mix(vec3(0.7, 0.8, 1.0), vec3(1.0, 0.85, 0.7), hash21(id + 5.0)) * smoothstep(0.02, 0.25, h);
 if (uOwn[7] < 0.0) for (int j = 0; j < 6; j++) {  // more moons, in a long arc
  float f = float(j), size = 0.018 + 0.05 * hash11(f + 1.7);
  vec2 to = p - vec2(-0.82 + 0.3 * f + 0.05 * sin(uTime * 0.008 + f * 2.0), 0.08 + 0.3 * sin(f * 0.62 + 0.15) + 0.03 * sin(uTime * 0.011 + f));
  vec4 m = bpMoon(to / size, 1.0 / (uRes.y * size), f);
  col = mix(col, m.rgb, m.a * -uOwn[7]);
 }
 if (paper > 0.0) { float f = (p.y + 0.1 - 0.5 * (1.0 - uHits) - 0.25 * p.x) * 5.0; col *= 1.0 + paper * (0.35 * uHits * exp(-f * f) + 0.25 * (piece(p / vec2(1.78, 1.0) + 0.5).rgb - 0.3)); }
 // the moon, risen just clear of the air
 vec2 mp = vec2(0.36 + 0.06 * sin(uTime * 0.006), 0.16 + 0.05 * sin(uTime * 0.011));
 const float mr = 0.048;
 vec2 md = (p - mp) / mr; float ml = length(md);
 float hm = (1.0 - smoothstep(1.0 - 2.0 / (uRes.y * mr), 1.0, ml));
 vec3 mn = vec3(md, sqrt(max(1.0 - ml * ml, 0.0)));
 vec3 mtone = vec3(0.9, 0.86, 0.8) * (0.55 + 0.6 * noise(md * 2.2 + 3.0)) * (0.002 + 1.5 * smoothstep(-0.02, 0.95, dot(mn, normalize(vec3(-0.7, -0.45, -0.12)))));
 if (paper > 0.0) mtone += paper * 0.9 * col; // in a pale sky its dark half is the sky's own colour
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
 if (bpAny > 0.0) air = mix(air, uKind[3] * uKind[3] * 2.2 * (glow + 0.06) * (0.8 + 0.8 * uDrone) * exp(-up / (0.007 * tall)) + uKind[0] * uKind[0] * 1.5 * (0.6 + 0.7 * uPad) * (wide * layers + 0.03) * exp(-up / (0.026 * tall)), 0.75 * bpAny);
 if (bpAny > 0.0) air *= 1.0 + bpAny * 1.6 * uHits * exp(-dot(p - vec2(0.2, 0.1), p - vec2(0.2, 0.1)) * 9.0);
 if (gone > 0.0) {                        // no sun: curtains of light stand round the pole
  float fold_ = 2.2 * noise(vec2(ang * 3.0, uTime * 0.03)), ray = noise(vec2(ang * 70.0 + 9.0 * fold_, uTime * 0.12)) * 0.6 + 0.4 * noise(vec2(ang * 170.0, uTime * 0.2));
  float foot = up - 0.03 - 0.045 * noise(vec2(ang * 4.0 + 3.0, uTime * 0.02)) * (0.4 + fold_);
  float veil = smoothstep(-0.008, 0.012, foot) * exp(-max(foot, 0.0) / (0.03 + 0.065 * ray)) * (0.25 + ray) * (0.35 + 0.65 * smoothstep(0.3, 0.7, noise(vec2(ang * 5.0 - uTime * 0.01, 7.0))));
  vec3 lit = mix(uKind[1] * uKind[1], uKind[2] * uKind[2], smoothstep(0.0, 0.2, foot));
  air = mix(air, air * 0.12 + lit * veil * (0.5 + 1.1 * uPad + 0.6 * uLevel + 0.6 * uHits), gone);
 }
 air *= (1.0 - 0.85 * paper) * (1.0 + 1.6 * uCue * wide);
 col += air * (1.0 - inside);
 if (r < 1.0 + px) {
  float z = sqrt(max(1.0 - r * r, 0.0));
  vec3 n = vec3(q, z), P = bpFrame(-0.3, 0.75) * n;
  float lat = asin(clamp(P.y, -1.0, 1.0)), lon = atan(P.x, P.z + 1e-5);
  vec3 c = bpClouds(vec2(lon, lat) * mix(mix(1.6, 1.0, far), 3.4, flat_), z, p, 0.8 + 0.6 * uTone);
  float mu0 = dot(n, sun);
  float lit = smoothstep(-0.12, 0.32, mu0); lit *= lit * (0.2 + 0.8 * max(glow, bpUp(uOwn[5]))) * (1.0 - gone) * (1.0 + 1.8 * uCue * glow);
  vec3 disc = c * mix(mix(vec3(1.0, 0.28, 0.07), uKind[3] * uKind[3], bpAny * 0.7), mix(vec3(1.0, 0.8, 0.55), vec3(1.0, 0.97, 0.92), bpUp(uOwn[5])), smoothstep(0.0, 0.3, mu0)) * lit * 3.0;
  float night = (1.0 - smoothstep(-0.05, 0.1, mu0));
  disc += c * vec3(0.016, 0.024, 0.044) * (1.0 - 0.7 * far);
  disc += c * (0.14 * paper + 0.02 * gone);
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
 if (uOwn[4] > 0.0) {                     // rings, their far side rising behind the globe
  mat3 N = bpFrame(-0.3, mix(0.6, 0.32, far));
  vec3 ro = N * vec3(mix((p - vec2(0.12, -0.42)) / 0.4, q, far), 0.0), rd = N * vec3(0.0, 0.0, 1.0);
  float t = -ro.y / rd.y, zz = sqrt(max(1.0 - r * r, 0.0));
  vec3 X = ro + rd * t;
  float a = bpRing(length(X.xz), min(mix(2.5 / uRes.y, px, far) / abs(rd.y), 0.3)), away = dot(q, toSun);
  if (r > 1.0 || t > zz) col = mix(col, mix(vec3(0.62, 0.53, 0.43), uKind[1], bpAny) * (1.0 + bpAny * uHits * exp(-pow(abs(length(X.xz) - 1.3 - 1.2 * (1.0 - uHits)) * 2.5, 2.0))) * (0.05 + 1.1 * paper * (0.4 + 0.6 * uLevel)  + 0.5 * smoothstep(-0.6, 1.4, away) + 0.3 * bpUp(uOwn[5]) + 0.4 * uCue), a * 0.85 * uOwn[4] * (r > 1.0 ? 1.0 : smoothstep(0.3, 0.7, far)));
 }
 return col + flare;
}
vec3 render(vec2 p) {
 bpMany = exp2(uOwn[1] * (uOwn[1] > 0.0 ? 1.0 : 1.3));
 bpAny = min(1.0, 2.0 * (abs(uOwn[0]) + abs(uOwn[1]) + abs(uOwn[2]) + abs(uOwn[3]) + abs(uOwn[4]) + abs(uOwn[5]) + abs(uOwn[6]) + abs(uOwn[7])));
 return screenOf(uVar < 0.5 ? bpStorm(p) : bpRim(p));
}
