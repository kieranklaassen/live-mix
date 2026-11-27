// name: Bitten bark
// a: Held to light
// b: On blue snow
// what: A torn sheet of birch bark stands against a cold bright window: folded, bitten and opened, it holds sprays of leaves, dragonflies and stars as hundreds of points of light, a frosted wood soft behind it; or a long strip of bark on blue snow in low sun, every bite a small hollow with a lit and a dark side, its end still rolled.
// follows: The piece is folded into it: a bite is as bright or deep as the sound at its place. Drone is the light, pad the warmth of the bark, texture its dark pores. A phrase runs along the vines, the bands lie round the petals, keys and voice wake single bites. A hit bites a new mark and its mirrors. A cue folds the bark and opens it. Travel drifts snow or the roll.
// own: 0 moonlight at -1, sunset at 1; 1 white frost, or falling snow that drifts over the strip, at -1, a green wood or mossy ground at 1; 2 bark pale as paper at -1, dark red bark at 1; 3 a small scrap with one or two stars at -1, a great sheet or broad strip with hems and more stars at 1; 4 close to at -1, small in its surroundings at 1; 5 curled or rolled further at -1, half folded at 1; 6 a round disc bitten in rings at -1, many small scraps at 1 (a: in strings); 7 a dark room, a lamp behind it, or dark boards in lamplight at -1, hung before a lake or afloat on water at 1.
#define NIGHT sat(-uOwn[0])
#define DUSK sat(uOwn[0])
#define WHITE sat(-uOwn[1])
#define GREEN sat(uOwn[1])
#define BARE sat(-uOwn[3])
#define LACE sat(uOwn[3])
#define DISC sat(-uOwn[6])
#define BITS sat(uOwn[6])
#define LAMP sat(-uOwn[7])
#define LAKE sat(uOwn[7])
float btPx;                    // the size of a pixel on the bark
// The nearest tooth mark: how far in its own radius, how deep it may be, its number, its kind, its place along the figure, how it faces the light.
float btD, btW, btI, btK, btT, btG;
float btS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3.0 - 2.0 * x); }
// One tooth mark, o from its middle; l is the way to the light.
void btPut(vec2 o, vec2 l, float r, float w, float id, float k, float t) {
  vec2 e = o * vec2(0.8, 1.0) / (r * (0.82 + 0.36 * fract(id * 0.618 + 0.3)));
  float d = length(e);
  if (d < btD) { btD = d; btW = w; btI = id; btK = k; btT = t; btG = dot(e, l); }
}
void btLeaf(vec2 v, vec2 l, float len, float wid, float n, float rib, float w, float id, float k, float t) {
  float s = v.y < 0.0 ? -1.0 : 1.0;
  v.y *= s; l.y *= s;
  float stp = len / n;
  if (v.x < -stp || v.x > len + stp || v.y > wid * 1.2 + stp) return;
  float x = clamp(floor(v.x / stp + 0.5), 0.0, n), u = x / n;
  float y = wid * 4.0 * u * (1.0 - u) * (1.3 - 0.6 * u);
  btPut(v - vec2(x * stp, y), l, 0.0037, w, id + x * 1.7 + s * 5.3, k, t);
  if (x > 0.5 && y > 0.0095) btPut(v - vec2(x * stp, 0.0), l, 0.0028, w * rib, id + x * 2.3, k, t);
}
void btSpray(vec2 v, vec2 l, float n, float gap, float leaf, float shrink, float w, float id) {
  float len = (n + 0.6) * gap, stp = gap / 4.0, x = clamp(floor(v.x / stp + 0.5), 0.0, floor(len / stp));
  btPut(v - vec2(x * stp, 0.0), l, 0.0037, w, id + x, 3.0, x * stp);
  float s = v.y < 0.0 ? -1.0 : 1.0;
  v.y *= s; l.y *= s;
  mat2 m = rot(0.8);
  float k = clamp(floor((v.x - 0.97 * v.y) / gap + 0.5), 0.0, n);
  float big = leaf * (1.0 - shrink * k / n) * (0.9 + 0.1 * sin(k * 2.4 + id + s));
  vec2 q = m * (v - vec2(k * gap, 0.004)) - vec2(0.008, 0.0);
  l = m * l;
  if (v.x > len && v.y < 0.2 * leaf) { q = v - vec2(len, 0.0); big = leaf * (1.0 - 0.7 * shrink); k = n + 1.0; }
  btLeaf(q, l, big * 0.86, big * 0.2, 7.0, 0.8, w, id + k * 11.0 + s, 2.0, k * gap);
}
void btFly(vec2 v, vec2 l, float z, float w) {
  float s = v.y < 0.0 ? -1.0 : 1.0, x = clamp(floor(v.x / (z * 0.115) + 0.5), -8.0, 2.0);
  v.y *= s; l.y *= s;
  btPut(v - vec2(x * z * 0.115, 0.0), l, 0.0036 + 0.0016 * btS(-2.0, 1.0, x), w, 70.0 + x, 4.0, 0.0);
  btPut(v - vec2(z * 0.32, 0.05 * z), l, 0.0042, w, 70.0, 4.0, 0.0);
  float fore = step(0.06 * z, v.x);
  mat2 m = rot(mix(1.86, 1.32, fore));
  btLeaf(m * (v - z * vec2(0.1 * fore, 0.06)), m * l, z * (0.7 + 0.1 * fore), z * 0.1, 9.0, 0.0, w, 80.0 + fore, 4.0, 0.0);
}
void btFold(inout vec2 v, inout vec2 l, vec2 n) {
  float d = dot(v, n);
  if (d > 0.0) { v -= 2.0 * d * n; l -= 2.0 * dot(l, n) * n; }
}
void btStar(vec2 v, vec2 l, float z, float w, float k) {
  float r = z > 0.04 ? 0.0044 : 0.0036;
  l *= vec2(v.x < 0.0 ? -1.0 : 1.0, v.y < 0.0 ? -1.0 : 1.0); v = abs(v);
  btFold(v, l, vec2(-0.7071, 0.7071));
  btFold(v, l, vec2(-0.38268, 0.92388));
  btPut(v, l, r * 1.15, w, 1.0, k, 0.0);
  const vec2 a = vec2(1.0, 0.0), b = vec2(0.47, 0.195);
  float n = z > 0.04 ? 4.0 : 2.0;
  vec2 ba = (b - a) * z;
  float u = floor(sat(dot(v - a * z, ba) / dot(ba, ba)) * n + 0.5) / n;
  btPut(v - a * z - ba * u, l, r, w, u * 9.0, k, 0.0);
  if (z > 0.04) { float x = clamp(floor(v.x / z * 5.0 + 0.5), 1.0, 4.0); btPut(v - vec2(x * z / 5.0, 0.0), l, r * 0.8, w, x * 3.0, k, 0.0); }
}
// The flower: a star inside a ring of sixteen petals, a band of the spectrum in each.
void btFlower(vec2 v, vec2 l, float z, float w) {
  btStar(v, l, z * 0.47, 1.0, 0.0);
  float part = TAU / 16.0, a = floor((dot(v, v) > 1e-8 ? atan(v.y, v.x) : 0.0) / part + 0.5);
  mat2 m = rot(a * part);
  btLeaf(m * v - vec2(z * 0.55, 0.0), m * l, z * 0.45, z * 0.068, 5.0, 0.0, w, a * 7.0 + 20.0, 1.0, abs(a) / 8.0);
}
void btHem(vec2 v, vec2 l, float w) {
  float x = floor(v.x / 0.0115 + 0.5);
  btPut(v - vec2(x * 0.0115, 0.02 * (0.5 - abs(1.0 - mod(x + 3.0, 6.0) / 3.0))), l, 0.0038, w, x, 2.0, 0.0);
}
// A few teeth of one bite: what a hit presses in.
void btBite(vec2 v, vec2 l) {
  float x = clamp(floor(v.x / 0.016 + 0.5), -2.0, 2.0);
  btPut(v - vec2(x * 0.016, -0.0035 * x * x), l, 0.0072 * sat(0.1 + 2.5 * uHits), 1.0, 900.0, 5.0, 0.0);
}
// The wood outside the glass.
vec3 btWood(vec2 p) {
  float night = NIGHT, dusk = DUSK, green = GREEN, y = p.y;
  vec3 sky = mix(vec3(1.5, 1.75, 2.05), vec3(1.05, 1.38, 1.9), btS(-0.1, 0.5, y));
  sky = mix(sky, mix(vec3(2.3, 1.0, 0.45), vec3(0.55, 0.55, 1.0), btS(-0.1, 0.48, y)), dusk);
  sky = mix(sky, mix(vec3(0.25, 0.36, 0.62), vec3(0.08, 0.13, 0.32), btS(-0.2, 0.5, y)), night);
  vec3 tree = mix(mix(vec3(0.52, 0.66, 0.88), vec3(0.4, 0.22, 0.3), dusk), vec3(0.05, 0.08, 0.17), night);
  vec3 land = mix(mix(vec3(1.35, 1.55, 1.85), vec3(0.95, 0.72, 0.95), dusk), vec3(0.2, 0.28, 0.5), night);
  sky *= mix(vec3(1.0), vec3(0.95, 1.0, 0.72), green); tree *= mix(vec3(1.0), vec3(0.5, 0.72, 0.34), green); land *= mix(vec3(1.0), vec3(0.4, 0.56, 0.2), green);
  vec3 c = sky;
  float crown = noise(p * vec2(8.0, 4.0) + 3.0) * 0.6 + 0.4 * noise(p * vec2(26.0, 11.0));
  c = mix(c, tree * 1.02, (0.8 + 0.2 * green) * btS(0.0, 0.5, crown - 0.15 - 1.3 * y) * btS(-0.22, -0.1, y));
  c = mix(c, land, btS(-0.12, -0.21, y + 0.02 * sin(p.x * 4.0)));
  for (int i = 0; i < 2; i++) {
    float f = float(i), g = (p.x + 0.012 * sin(uTime * 0.05 + f) + f * 0.13) * mix(13.0, 4.6, f), n = floor(g);
    float h = hash11(n + 31.0 * f), m = g - n - 0.35 - 0.3 * h - 0.2 * (h - 0.5) * y;
    float wide = mix(0.09, 0.1, f) * (0.6 + 0.8 * h), soft = mix(0.07, 0.03, f) * (0.8 + uSpace);
    float on = btS(wide + soft, wide - soft, abs(m)) * btS(mix(-0.17, -0.31, f) - 0.06 * h, mix(-0.12, -0.28, f) - 0.06 * h, y) * wide / (wide + 0.5 * soft);
    float scar = btS(0.6, 0.78, noise(vec2(m * 8.0 + n * 7.0, y * 64.0)) * 0.7 + 0.42 * noise(vec2(n * 3.0, y * 10.0)));
    vec3 pale = mix(tree * 1.15, sky * 1.06, btS(wide * 1.1, -wide * 0.7, m)) * (1.0 - 0.6 * scar * (0.6 + 0.4 * h));
    c = mix(c, mix(tree * 0.95, pale, f), on * mix(0.5, 0.92, f));
  }
  float moon = length(p - vec2(0.6, 0.3));
  c += night * vec3(0.9, 1.0, 1.2) * (0.9 * btS(0.034, 0.022, moon) + 0.22 * exp(-moon * 6.0));
  vec2 sun = p - vec2(0.36, -0.02);
  c += dusk * vec3(2.0, 0.8, 0.25) * exp(-dot(sun, sun) * 22.0);
  return mix(c, vec3(1.35, 1.5, 1.65) * (1.0 - 0.7 * night), 0.5 * WHITE);
}
// The bark: how thick, its dark pores, a slow change of tint.
vec3 btBark(vec2 q) {
  q.y += 0.012 * noise(q * vec2(5.0, 2.0));
  float layer = noise(q * vec2(2.6, 11.0) + 4.0) + 0.12 * noise(q * vec2(50.0, 20.0));
  float grain = noise(q * vec2(9.0, 120.0)) - 0.5 + 0.7 * (noise(q * vec2(26.0, 330.0)) - 0.5) * btS(0.004, 0.0015, btPx);
  float t = 1.0 + 0.2 * grain + 0.2 * btS(0.58, 0.6, layer) - 0.16 * btS(0.3, 0.28, layer);
  float pore = 0.0;
  for (int i = 0; i < 2; i++) {
    float f = float(i);
    vec2 g = q * mix(vec2(5.5, 24.0), vec2(13.0, 62.0), f) + vec2(0.0, 0.37 + f);
    g.x += 7.3 * hash11(floor(g.y) + 3.0 * f);
    vec2 n = floor(g), h = hash22(n + 17.0 * f);
    vec2 e = (g - n - 0.5) / vec2(0.12 + 0.36 * h.x * h.x, 0.07 + 0.1 * h.y);
    float body = 1.0 - e.x * e.x, aa = btPx * mix(24.0, 62.0, f) / (0.07 + 0.1 * h.y);
    pore = max(pore, step(0.42, h.y) * btS(-aa - 0.2, aa + 0.2, body - abs(e.y)) * mix(1.0, 0.6, f) * btS(0.0, 0.25, body));
  }
  return vec3(t, pore, noise(q * vec2(1.7, 4.0) + 9.0));
}
// How deep this mark is now, and the colour heard there.
float btDepth(vec4 m, float rest, out vec3 hue) {
  float answer = 0.55 + 0.75 * uEnergy, loud = sat(m.a * answer), v = rest;
  hue = mix(vec3(1.0), m.rgb / max(m.a, 0.004), 0.6 * sat(m.a * 2.0));
  v += 0.75 * loud + 0.4 * uCue;
  if (btK < 0.5) v += 0.22 + 0.2 * uLevel;
  else if (btK < 1.5) { float b = band(btT) * answer; v += 0.9 * b; hue = mix(hue, kindColour(btT * 3.0), 0.5 * sat(b)); }
  else if (btK < 3.5) {
    float run = pow(0.5 + 0.5 * sin(btT * 16.0 - uTravel * 1.1), 6.0);
    v += uPhrase * run * answer * (btK > 2.5 ? 1.3 : 0.8);
    hue = mix(hue, uKind[3], 0.7 * run * uPhrase);
  } else if (btK > 4.5) { v = uHits * 1.5; hue = mix(vec3(1.0), uKind[4], 0.6); }
  float key = btS(0.7, 0.88, hash11(btI * 0.137 + 2.0));
  v += key * (0.12 + uKeys + 0.6 * uMic);
  hue += key * uKeys * vec3(2.4, 1.5, 0.3);
  return min(v, 1.4) * btW;
}
// Bright crystals on the pane, or none.
float btFrost(vec2 p, float much) {
  vec2 v = p - vec2(1.15, -0.75);
  float r = length(v), a = atan(v.x, v.y), n = noise(p * 6.0);
  float fern = noise(vec2(a * 34.0 + 3.0 * n, r * 7.0)) * 0.6 + 0.4 * noise(vec2(a * 110.0 + 5.0 * n, r * 22.0));
  return btS(0.0, 0.5, p.x * 0.5 - p.y * 0.9 - 0.52 + 0.2 * n + much + 0.5 * (fern - 0.5)) * (0.25 + 0.95 * fern);
}
float btFlake(vec2 p) {
  vec2 f = p * 9.0 + vec2(0.5 * sin(uTime * 0.2 + p.y * 5.0), mod(uTravel * 0.45, 64.0)), n = floor(f), h = hash22(vec2(n.x, mod(n.y, 64.0)));
  return btS(0.13, 0.02, length(f - n - 0.25 - 0.5 * h)) * step(0.45, h.y);
}
// The pane in its bars, and the sill with the bark's warm light on it.
vec3 btPane(vec2 p, vec3 day) {
  float px = 1.0 / uRes.y;
  vec3 col = btWood(p) * (0.74 + 0.22 * uDrone + 0.12 * uLevel);
  col = mix(col, day * 1.05, 0.85 * btFrost(p, 0.02 + 0.5 * WHITE - 0.6 * GREEN + 0.05 * sin(uTime * 0.031)));
  col += btFlake(p) * day * 0.3 * (1.0 - 0.8 * GREEN);
  float bar = abs(p.x - 0.535) - 0.021, frame = min(bar, abs(p.y - 0.235) - 0.014);
  vec3 paint = day * (0.1 + 0.03 * noise(p * vec2(60.0, 6.0)) + 0.16 * btS(0.006, 0.0, -frame));
  col = mix(col * (0.72 + 0.28 * btS(0.0, 0.02, frame)), paint, btS(px, -px, frame));
  float sill = p.y + 0.452, d = (p.x + 0.1) * 2.6;
  vec3 board = day * (0.16 + 0.1 * btS(-0.06, 0.0, sill)) * (0.9 + 0.2 * noise(p * vec2(5.0, 90.0)));
  board += day * (vec3(0.3, 0.15, 0.05) * exp(-d * d) * btS(-0.06, 0.0, sill) + 0.3 * btS(-0.006, -0.001, sill));
  return mix(col, board, btS(px, -px, sill));
}
vec3 btLake(vec2 p, vec3 day) {
  float y = p.y + 0.04, n = noise(p * vec2(5.0, 70.0) + vec2(0.05 * uTime, 0.0)) * 0.6 + 0.4 * noise(p * vec2(19.0, 160.0) - vec2(0.07 * uTime, 0.0));
  vec3 sky = mix(day * mix(vec3(0.95), vec3(1.25, 0.95, 0.7), DUSK), day * vec3(0.42, 0.55, 0.75), btS(0.0, 0.55, y));
  vec3 c = mix(sky, day * vec3(0.3, 0.36, 0.42) * (1.0 - 0.5 * GREEN), btS(0.008, -0.004, y - 0.06 - 0.05 * noise(vec2(p.x * 2.3, 5.0)) - 0.01 * noise(vec2(p.x * 30.0, 2.0))));
  vec3 wa = mix(day * vec3(0.55, 0.62, 0.7), day * vec3(0.09, 0.13, 0.16), btS(0.0, -0.5, y));
  float gl = exp(-pow(abs(p.x - 0.36) * 4.0 / max(0.5 - y, 0.001), 2.0));
  wa += day * (0.22 * btS(0.35, 0.8, n) + (0.35 + 0.6 * DUSK) * gl * btS(0.5, 0.75, n) * (1.0 + uHigh));
  c = mix(c, wa * mix(vec3(1.0), vec3(0.75, 1.0, 0.6), GREEN), btS(0.004, -0.004, y));
  for (float i = 0.0; i < 2.0; i++) {
    float x = p.x * (26.0 - 9.0 * i) + 5.0 * i, k = floor(x), h = hash11(k + 9.0 * i), top = -0.42 + 0.34 * h * btS(-0.2, 0.9, abs(p.x - 0.1)) + 0.1 * h;
    float at = x - k - 0.5 - (h - 0.5) * (0.5 + 1.6 * (p.y + 0.5)) - 0.12 * sin(uTime * 0.4 + k) * (p.y + 0.5);
    c = mix(c, day * vec3(0.05, 0.06, 0.05), (0.6 + 0.4 * i) * btS(0.07, 0.02, abs(at) - 0.04 * btS(0.1, 0.0, abs(p.y - top + 0.06))) * btS(top + 0.01, top, p.y));
  }
  return c;
}
// Snow at g, seen from above: how it slopes.
vec2 btDrift(vec2 g) {
  g += 0.15 * vec2(noise(g * 2.0), noise(g * 2.0 + 8.0));
  vec2 a = rot(0.35) * g * vec2(3.2, 8.5), b = rot(0.35) * g * 34.0;
  float n = noise(a), x = noise(a + vec2(0.09, 0.0)), y = noise(a + vec2(0.0, 0.09));
  float m = noise(b), u = noise(b + vec2(0.12, 0.0)), v = noise(b + vec2(0.0, 0.12));
  return vec2(x - n, y - n) * vec2(1.1, 2.6) + 0.5 * vec2(u - m, v - m);
}
// The shadow of a bare branch that hangs somewhere above, 0 to 1.
float btTwig(vec2 g, float soft) {
  g = rot(0.5 + 0.012 * sin(uTime * 0.23)) * (g - vec2(0.1, 0.02 + 0.006 * sin(uTime * 0.31)));
  g.y += 0.06 * sin(g.x * 3.1 + 0.5) + 0.015 * sin(g.x * 11.0);
  float w = 0.0095 - 0.005 * clamp(g.x, -1.0, 1.0), s = btS(w + soft, w - soft * 0.6, abs(g.y));
  float side = g.y < 0.0 ? -1.0 : 1.0, k = clamp(floor((g.x - 0.75 * abs(g.y)) / 0.17 + 0.5), -6.0, 5.0);
  vec2 v = rot(0.86 + 0.12 * sin(k * 5.1 + side)) * vec2(g.x - k * 0.17 - 0.04 * side, abs(g.y));
  float len = 0.22 + 0.1 * sin(k * 3.7 + side * 2.0), z = 0.0045 * (1.3 - min(v.x / len, 1.0));
  v.y -= 0.35 * v.x * v.x - 0.006 * sin(v.x * 50.0);
  float live = btS(-0.01, 0.02, v.x) * btS(len, len - 0.05, v.x);
  return max(s, live * 0.85 * btS(z + soft, z - soft * 0.6, abs(v.y)));
}
void btRings(vec2 q, vec2 l) {
  float r = length(q), part = TAU / 12.0, at = r > 1e-4 ? atan(q.y, q.x) : 0.0, a = floor(at / part + 0.5), c = floor(at / part) + 0.5;
  mat2 m = rot(a * part), k = rot(c * part);
  vec2 v = m * q, w = k * q;
  btLeaf(w - vec2(0.12, 0.0), k * l, 0.085, 0.017, 7.0, 0.8, DISC, c * 7.0, 2.0, abs(c) / 6.0);
  btLeaf(v - vec2(0.185, 0.0), m * l, 0.115, 0.027, 9.0, 0.8, DISC, a * 7.0, 2.0, abs(a) / 6.0);
  btStar(w - vec2(0.262, 0.0), k * l, 0.032, DISC, 2.0);
  btHem(vec2(at / TAU * 198.0 * 0.0115, r - 0.342), rot(at) * l, DISC);
  btPut(v - vec2(0.327, 0.0), m * l, 0.0045, DISC, a, 3.0, abs(a) / 6.0);
}
void btScrap(vec2 v, vec2 l, float h) {
  btD = 9.0; btW = 0.0; btI = 0.0; btK = 2.0; btT = h; btG = 0.0;
  if (h < 0.34) btFlower(v, l, 0.07, 1.0);
  else if (h < 0.56) btFly(v - vec2(0.02, 0.0), l, 0.075, 1.0);
  else if (h < 0.78) { btStar(v, l, 0.048, 1.0, 2.0); btHem(vec2(v.x, abs(v.y) - 0.064), l, 1.0); }
  else btSpray(v + vec2(0.07, 0.0), l, 3.0, 0.036, 0.05, 0.4, 1.0, h);
  if (uHits > 0.003) btBite(v - vec2(0.03), l);
}
// What is bitten at q; gives the way to the bite of a hit.
vec2 btMarks(vec2 q, vec2 l, bool held) {
  float few = (1.0 - BARE) * (1.0 - DISC), id = q.y > 0.0 ? 40.0 : 130.0, up = step(0.0, q.y);
  btD = 9.0; btW = 0.0; btI = 0.0; btK = 2.0; btT = 0.0; btG = 0.0;
  vec2 f = vec2(q.x, abs(q.y)), v, fly, star, hem, hit;
  vec4 kind = vec4(14.0, 0.058, 0.075, 0.35), sz = vec4(0.085, 0.03, few, LACE);   // a spray's numbers; a dragonfly's and a star's
  l.y *= held ? 1.0 : up * 2.0 - 1.0;
  if (held) {
    f.x = 0.46 - abs(abs(q.x) - 0.46);            // folded once more, further out
    sz.y = 0.026;
    if (up > 0.5) {
      v = rot(0.98) * (f - vec2(0.066, 0.097)); v.y += 0.55 * v.x * v.x; kind = vec4(5.0, 0.053, 0.092, 0.45);
      fly = rot(0.35) * (f - vec2(0.3, 0.1));
      if (f.x < 0.17 && f.y > 0.1) { fly = vec2(q.y - 0.265, f.x); sz.x = 0.13; }
      star = f - vec2(0.36, 0.25);
      if (f.x < 0.22) { star = f - vec2(0.09, 0.395); sz.yz = vec2(0.022, LACE); }
    } else {
      v = rot(0.42) * (f - vec2(0.1, 0.06)); v.y -= 0.5 * v.x * v.x; kind = vec4(5.0, 0.043, 0.066, 0.35);
      if (f.x < 0.06) { v = vec2(f.y - 0.13, q.x); kind = vec4(3.0, 0.036, 0.05, 0.3); }
      fly = vec2(9.0);
      star = f - vec2(0.145, 0.235);
      if (f.x > 0.23) { star = f - vec2(0.31, 0.045); sz.yz = vec2(0.02, LACE); }
    }
    hem = f - vec2(0.0, 0.315 + 0.12 * up);
    float ha = 0.75 + 0.5 * sin(uTime * 0.047);
    hit = rot(ha - 1.57) * (f - (0.22 + 0.09 * sin(uTime * 0.071)) * vec2(cos(ha), sin(ha)));
  } else {
    v = vec2(f.x + 0.36, f.y - 0.085 - 0.03 * sin(f.x * 8.0 + 2.2));
    id = 40.0;
    fly = vec2(q.x + 0.16, f.y);
    if (q.x > 0.06) { fly.x = q.x - 0.27; sz.x = 0.07; }
    star = f - vec2(-0.65, 0.11);
    if (q.x > -0.56) { star = f - vec2(0.08, 0.0); sz.yz = vec2(0.039, 1.0 - DISC); }
    if (f.y > 0.195) { star = vec2(f.x - floor(f.x / 0.16 + 0.5) * 0.16, f.y - 0.23); sz.yz = vec2(0.026, LACE); }
    hem = f - vec2(0.0, 0.277);
    hit = f - vec2(-0.1 + 0.4 * sin(uTime * 0.047), 0.1 + 0.04 * sin(uTime * 0.081));
  }
  vec2 l0 = vec2(l.x, l.y * (held ? 1.0 : up * 2.0 - 1.0));
  btSpray(v, l, kind.x, kind.y, kind.z, kind.w, few, id);
  btFly(fly, l, sz.x, few);
  btStar(star, l, sz.y, sz.z, 2.0);
  btHem(hem, l, LACE * (1.0 - DISC));
  if (!held) f.x += 0.5 * (1.0 - DISC);
  else f = q;
  btFlower(f, l, 0.115, max(few, DISC));
  if (uOwn[6] < 0.0) btRings(q, l0);
  if (uHits > 0.003) btBite(hit, l);
  return hit;
}
vec3 render(vec2 p) {
  bool held = uVar < 0.5;
  float dark = uOwn[2], curl = sat(-uOwn[5]), half_ = sat(uOwn[5]), zoom = 1.0 + 0.36 * uOwn[4], c4 = 4.0 * uCue * (1.0 - uCue);
  btPx = zoom / uRes.y;
  // the bark's own place, one half of it on a hinge: standing on the sill, or on the ground seen at a slant
  float broad = btS(0.55, 1.3, uRes.x / uRes.y);
  vec2 at = vec2(-0.05 - 0.185 * broad + 0.03 * uOwn[4], -0.1 - 0.07 * uOwn[4]);
  vec2 g = p * zoom / (1.0 - 0.32 * p.y), L = rot(0.1 * sin(uTime * 0.037)) * vec2(-0.8, 0.6), q, l = vec2(0.0), b;
  float th, lift = 0.0, near = 0.75;
  if (held) {
    q = rot(0.13 + 0.015 * sin(uTime * 0.09)) * (p - at) * zoom;
    th = 0.13 + 0.03 * sin(uTime * 0.13) + 0.62 * half_ + 0.95 * c4 * (1.0 - 0.4 * half_);
    b = q;
  } else {
    mat2 turn = rot(0.2 + 0.008 * sin(uTime * 0.07));
    q = turn * (g - vec2(0.32 - 0.34 * broad, 0.015)); l = turn * L;
    th = min(0.06 + 0.02 * sin(uTime * 0.13) + 0.95 * half_ + c4, 1.2); near = 0.6;
    b = q.yx;
  }
  if (b.x > 0.0) { lift = sin(th); b.x /= cos(th) + near * lift * b.x; b.y *= 1.0 - (held ? near : 0.1) * b.x * lift; }
  if (!held) b = b.yx;
  // torn edges: straight along the grain in a, along the strip in b, ragged across
  float rag2 = noise(vec2(b.y * 110.0, 1.0)), rag = noise(vec2(b.y * 9.0, 2.0)) * 0.06 + noise(vec2(b.y * 36.0, 7.0)) * 0.02 + rag2 * 0.006;
  float lip = b.y > 0.0 ? 5.0 : 15.0;
  lip = noise(vec2(b.x * 3.5, lip)) * 0.03 + noise(vec2(b.x * 28.0, lip + 3.0)) * 0.007;
  float edge, rollEdge, end, R, wide = 0.215 + 0.1 * LACE - 0.06 * BARE, left = 0.83 - 0.14 * BARE;
  if (held) {
    edge = min(b.x + 0.42 + 0.4 * LACE - 0.16 * BARE - rag, min(0.46 + 0.3 * LACE - 0.17 * BARE - lip - 0.05 * btS(0.1, 0.5, b.x) - b.y, b.y + 0.35 - 0.7 * lip));
    edge = min(edge, dot(b + vec2(0.36, 0.22), vec2(0.5, 0.866)) + 0.06 + 0.5 * LACE - 0.012 * rag2 - 2.0 * lip - 0.3 * rag);   // a corner is gone
    end = 0.46 + 0.22 * LACE - 0.1 * BARE - 0.16 * btS(-0.3, 0.5, b.y) - 0.12 * curl + 1.5 * DISC;
    R = 0.008 + 0.07 * btS(-0.42, 0.42, b.y) * (1.0 + 0.7 * curl);
    rollEdge = edge = min(edge, end + R - b.x);
  } else {
    end = 0.6 + 0.05 * sin(uTravel * 0.045) - 0.5 * curl - 0.3 * BARE * (1.0 - curl) + 1.6 * DISC; R = 0.088 + 0.05 * curl;
    edge = min(min(b.x + left - rag, end - b.x), wide - lip - abs(b.y));
    rollEdge = min(R - abs(q.x - end), wide + 0.012 - abs(q.y) - 0.5 * lip);
  }
  vec2 pl = b; float cut = 0.0;
  float bit = 0.0, seed = 0.0, shade = -1.0;
  if (uOwn[6] < 0.0) edge = mix(edge, 0.39 + 0.005 * rag2 - length(b) + 0.016 * noise(b * 11.0), DISC);
  if (uOwn[6] > 0.0) {
    vec2 gr = held ? p * zoom : g, c = held ? vec2(0.29, 0.25) : vec2(0.27), n = floor(gr / c), h = hash22(n + 40.0), v;
    vec2 ctr = (n + 0.5 + (held ? vec2(0.34 * (hash11(n.x) - 0.5) + 0.05 * sin(gr.y * 2.0 + uTime * 0.15 + n.x), 0.1 * (h.y - 0.5)) : 0.3 * (h - 0.5))) * c;
    mat2 m = rot(held ? 0.5 * (h.x - 0.5) + 0.06 * sin(uTime * 0.21 + h.x * 9.0) : 5.0 * h.x);
    v = m * (gr - ctr); seed = hash21(n + 7.0);
    vec2 sz = (vec2(0.088, 0.074) + 0.016 * h) * (BITS * 1.1 - 0.1 - 1.2 * step(h.y, 0.1 + 0.3 * BARE));
    float rg = noise(v * 26.0 + h * 40.0) * 0.014 + noise(v * 90.0) * 0.004, se = min(sz.x - abs(v.x), sz.y - abs(v.y)) - rg;
    se = min(se, 0.135 * BITS + 0.02 * h.x - abs(v.x + v.y * (h.y > 0.5 ? 1.0 : -1.0)));
    edge -= 0.85 * BITS; rollEdge -= 0.85 * BITS;
    vec2 u = v + m * L * (held ? 0.0 : 0.022);
    shade = min(sz.x - abs(u.x), sz.y - abs(u.y)) - 0.01;
    cut = gr.x - ctr.x;
    if (se > edge) { edge = se; b = v; l = m * L; pl = held ? ctr - at : ctr; bit = 1.0; end = 9.0; lift = 0.0; }
  }
  float on = btS(-btPx, btPx, edge), rollOn = btS(-btPx, btPx, rollEdge), z = ((held ? b.x : q.x) - end) / R, zc = clamp(z, -1.0, 1.0), nz = sqrt(1.0 - zc * zc);
  bool rolled = !held && rollOn > 0.5;
  vec3 bk = btBark(held ? b : rolled ? vec2(b.y, end + 0.3 + asin(zc) * R) : b.yx);
  vec2 hit;
  if (uOwn[6] > 0.0 && bit > 0.5) { btScrap(b, l, seed); hit = b - vec2(0.03); bk.z = hash11(seed * 91.0); } else hit = btMarks(b, l, held);
  float r = length(pl), ang = r > 1e-4 ? atan(abs(pl.y), abs(pl.x)) / (0.5 * PI) : 0.0;
  vec3 hue, col;
  float deep = btDepth(piece(held ? vec2(0.02 + 0.96 * ang, sat(r * 2.0)) : vec2(sat((pl.x + 0.8) / 1.45), sat(0.5 - pl.y / (2.0 * mix(wide, 0.45, max(BITS, DISC)))))), held ? 0.3 : 0.65, hue);
  hue = mix(vec3(1.0), hue, sat(deep));
  float struck = uHits * exp(-dot(hit, hit) * (held ? 400.0 : 220.0));
  vec3 strike = mix(vec3(0.8, 0.72, 0.6), uKind[4], 0.5) * struck;
  if (held) {
    vec3 day = mix(mix(vec3(1.45, 1.65, 1.9), vec3(1.8, 1.25, 1.1), DUSK), vec3(0.4, 0.5, 0.75), NIGHT);
    day = mix(day, vec3(1.9, 0.95, 0.42), LAMP);
    vec2 lp = p - at - vec2(0.02, -0.05 + 0.006 * sin(uTime * 0.7));
    col = btPane(p, day);
    if (uOwn[7] > 0.0) col = mix(col, btLake(p, day), btS(0.0, 0.4, LAKE));
    if (uOwn[7] < 0.0) col = mix(col, day * (0.008 + 0.1 * exp(-5.0 * dot(lp, lp))) * (0.8 + 0.4 * noise(p * vec2(3.0, 60.0))), LAMP);
    if (uOwn[6] > 0.0) col *= 1.0 - 0.45 * BITS * btS(1.2 * btPx, 0.3 * btPx, abs(cut));
    else if (uOwn[7] > 0.0) col *= 1.0 - 0.7 * LAKE * btS(1.6 * btPx, 0.5 * btPx, abs(p.x - at.x + 0.02)) * step(at.y, p.y);
    col *= (1.0 - 0.2 * btS(-0.035, 0.0, edge));
    float mark = btS(1.05 + 0.4 * btPx / 0.0038, 0.1, btD), open = btS(-1.0, -1.25, z), t = bk.x + (0.55 + 0.5 * uTexture) * (1.0 + 0.6 * dark) * bk.y;
    // how thick: thin at the torn edge and the creases, thinnest at a bite
    rag2 *= 0.016;
    t -= 0.45 * btS(0.012 + rag2, rag2, edge);
    vec2 f = abs(b);
    float cr = min(f.x, f.y), cr2 = abs(f.x - f.y) * 0.7071;
    t -= 0.2 * exp(-cr * cr / 9e-6) + 0.1 * exp(-cr2 * cr2 / 6e-6) * btS(0.3, 0.1, r);
    t += 0.05 * sign(b.x) * btS(0.0, 0.004, f.x) + 0.04 * sign(b.y) * btS(0.0, 0.004, f.y);
    t += 0.16 * deep * btS(2.1, 1.1, btD) * btS(0.7, 1.1, btD) * open;
    t = mix(t, 0.1, sat(mark * deep * 1.15) * open);
    // the curl: a roll of two or three layers, dark at its limb
    float roll = btS(-1.0 - btPx / R, -1.0, z);
    t += roll * (0.35 + mix(1.0, 0.35, btS(-0.25, -0.3, z + 6.0 * rag2 - 0.2)) * 0.8 / (0.35 + nz)) + 0.25 * btS(-2.6, -1.0, z) * (1.0 - roll);
    vec3 take = mix(vec3(0.62, 1.12, 1.95), vec3(0.56, 1.28, 1.75), bk.z);
    take = mix(take, vec3(0.42, 1.2, 2.5), 0.4 * uPad);
    take = mix(take, dark > 0.0 ? vec3(1.1, 2.4, 3.2) : vec3(0.42, 0.56, 0.78), abs(dark) * 0.85) * (0.85 + 0.3 * uTone);
    // the light behind it, brightest at the upper left
    vec3 behind = day * mix(vec3(0.92, 0.96, 1.0), vec3(1.03, 1.0, 0.97), btS(0.0, -0.4, p.y)) * (1.0 + 0.3 * uDrone + 0.12 * uLevel) * 1.12;
    vec2 low = p - vec2(0.36, -0.02);
    behind += DUSK * vec3(1.2, 0.35, 0.0) * exp(-dot(low, low) * 9.0);
    behind *= mix(vec3(1.0), vec3(0.92, 1.0, 0.72), GREEN) * max(1.06 - 0.5 * dot(p - at, vec2(0.6, -0.6)), 0.5) * (1.0 - 0.3 * lift * lift);
    if (uOwn[7] < 0.0) behind *= mix(1.0, 0.12 + 1.75 * exp(-6.5 * dot(lp, lp)) * (0.8 + 0.3 * uDrone), LAMP);
    vec3 lit = behind * exp(-take * t) * mix(vec3(1.0), hue * 1.35, 0.5 * mark * sat(deep) * open);
    lit += behind * open * (hue * deep * (0.1 * mark + 0.09 * exp(-btD * 0.85)) + 0.6 * strike + uCue * vec3(0.34, 0.25, 0.14) * (exp(-cr * 26.0) + exp(-cr2 * 34.0) * btS(0.3, 0.1, r)));
    lit += day * roll * vec3(0.17, 0.15, 0.145) * pow(sat(0.75 * nz - 0.65 * zc), 1.5) * (1.0 - 0.7 * bk.y);
    col = mix(col, lit, on) * (1.0 - 0.22 * dot(p, p));
    return screenOf(col);
  }
  vec3 sun = mix(mix(vec3(2.35, 1.95, 1.5), vec3(2.6, 1.15, 0.6), DUSK), vec3(0.55, 0.7, 1.0), NIGHT) * (0.82 + 0.25 * uDrone + 0.1 * uLevel) * (1.0 - 0.45 * WHITE);
  vec3 air = mix(mix(vec3(0.2, 0.34, 0.72), vec3(0.26, 0.24, 0.62), DUSK), vec3(0.04, 0.075, 0.2), NIGHT) + WHITE * vec3(0.3, 0.33, 0.36) * (1.0 - 0.85 * NIGHT);
  if (uOwn[7] < 0.0) { vec2 d = g - vec2(-0.35, 0.22); sun = mix(sun, vec3(2.6, 1.35, 0.55) * (0.06 + 1.1 * exp(-3.2 * dot(d, d))) * (0.85 + 0.3 * uPad), LAMP); air = mix(air, vec3(0.05, 0.032, 0.03), LAMP); }
  float sunny = 1.0 - 0.85 * (1.0 - LAMP) * btTwig(g - L * (rolled ? 0.06 : 0.012 * on), 0.003 + 0.01 * uSpace);
  // the snow: its drifts and crests, the shadows of the strip and its roll, its sparks
  float face = sat(0.24 - 1.9 * dot(btDrift(g), L) * (1.0 - 0.5 * WHITE));
  vec2 back = q + l * (0.03 + 0.16 * lift), far = q + l * 0.1;
  float under = min(min(back.x + left - 0.03 - rag, end - back.x + R), wide - 0.012 - lip - abs(back.y));
  under = max(under, min(R - abs(far.x - end), wide - abs(far.y)));
  if (uOwn[6] < 0.0) under = mix(under, 0.38 - length(back), DISC);
  if (uOwn[6] > 0.0) under = max(under - 0.85 * BITS, shade);
  under = btS(-0.012, 0.018, under);
  vec3 snow = mix(vec3(0.86, 0.9, 0.96), vec3(0.16, 0.2, 0.06) * (0.35 + 0.8 * noise(rot(0.7) * g * 31.0) + 0.5 * noise(g * 83.0)), GREEN);
  float wet = 0.0;
  if (uOwn[7] < 0.0) {
    vec2 w = rot(-0.12) * g; float pn = floor(w.y / 0.19), py = abs(fract(w.y / 0.19) - 0.5);
    snow = mix(snow, mix(vec3(0.2, 0.1, 0.055), vec3(0.42, 0.24, 0.13), noise(vec2(w.x * 2.2 + pn * 5.0 + noise(w * vec2(3.0, 20.0)), w.y * 70.0))) * (0.75 + 0.5 * hash11(pn + 3.0)) * (1.0 - 0.75 * btS(0.48, 0.495, py)), LAMP);
    face = mix(face, 0.5, LAMP);
  }
  if (uOwn[7] > 0.0) {
    vec2 w = rot(0.2) * g; w += 0.06 * noise(w * 4.0 + 0.04 * uTime);
    float n = noise(w * vec2(3.5, 13.0) + vec2(0.05, 0.11) * uTime) + 0.45 * noise(w * vec2(13.0, 38.0) - vec2(0.09, 0.05) * uTime) + 0.16 * sin(max(-edge, 0.0) * 75.0 - uTime * 0.8) * exp(edge * (9.0 + 60.0 * BITS)) * (0.5 + uHits);
    vec3 wa = vec3(0.07, 0.12, 0.12) * (air + 0.1 * sun) + air * btS(0.35, 1.15, n) * mix(vec3(0.75, 0.95, 1.0), vec3(0.5, 0.8, 0.4), GREEN) + sun * 0.55 * btS(1.1, 1.4, n);
    wet = LAKE; snow = mix(snow, wa, LAKE); face = mix(face, 0.0, LAKE);
  }
  vec2 sp = floor(g * 150.0);
  float spark = hash21(mod(sp, 256.0));
  spark = btS(0.965, 1.0, spark) * btS(0.45, 0.1, length(g * 150.0 - sp - 0.5)) * (0.5 + 0.5 * sin(uTime * 0.4 + spark * 900.0)) * btS(0.006, 0.003, btPx);
  spark *= 1.0 - max(LAMP, LAKE);
  snow = wet * snow * (1.0 - 0.5 * under) + (1.0 - wet) * snow * (air * (1.0 + 0.5 * face) + sun * face * sunny * (1.0 - 0.9 * under)) + sun * sunny * (1.0 - 0.9 * under) * spark * (0.4 + 0.8 * uHigh) * (1.0 - GREEN);
  // the bark: a bite is a hollow with a lit and a shaded wall and a low rim round it
  float bowl = exp(-btD * btD * 1.1), rim = (btD - 1.5) / 0.35, by = b.y / mix(wide, 0.46, DISC), e1 = (b.y - 0.003) / 0.003, e2 = (b.y + 0.003) / 0.003;
  float tilt = deep * btG * (0.5 * exp(-rim * rim) - 2.6 * bowl);
  float lean = l.y * (0.32 * by * by * by + 0.25 * (exp(-e1 * e1) - exp(-e2 * e2))) - 0.5 * lift * l.y * btS(-0.002, 0.002, b.y);
  vec3 skin = mix(vec3(0.85, 0.66, 0.44), vec3(0.9, 0.62, 0.5), bk.z);
  skin = mix(skin, vec3(0.9, 0.82, 0.74), 0.45 * btS(0.9, 1.25, bk.x));
  skin = mix(skin, skin * vec3(1.05, 0.82, 0.58), 0.5 * uPad);
  skin = mix(skin, dark > 0.0 ? vec3(0.4, 0.17, 0.1) : vec3(0.95, 0.94, 0.93), abs(dark) * 0.85);
  skin *= (1.0 - (0.5 + 0.35 * uTexture) * bk.y) * mix(vec3(1.0), hue, 0.5 * bowl) * (0.94 + 0.12 * uTone);
  vec3 lit = air * (1.15 - 0.5 * bowl * sat(deep)) + sun * (sat(0.46 + 0.5 * tilt + lean + 0.18 * (bk.x - 1.0)) * sunny + strike + uCue * 0.3 * exp(-abs(b.y) * 26.0) + 0.12 * btS(0.006, 0.0, edge));
  col = mix(snow, skin * lit * (1.0 - 0.4 * btS(0.07, 0.0, end - R - b.x)), on);
  // the roll, its chalky outer side up
  vec3 chalk = mix(vec3(0.9, 0.87, 0.85), vec3(0.86, 0.72, 0.66), 0.6 * bk.z);
  chalk = mix(chalk, dark > 0.0 ? vec3(0.42, 0.2, 0.14) : vec3(0.96), abs(dark) * 0.8) * (1.0 - 0.75 * bk.y * btS(0.1, 0.5, nz));
  col = mix(col, chalk * (air * (0.5 + 0.6 * nz) + sun * sat(0.36 * nz + 0.9 * zc * l.x) * sunny), rollOn);
  // in a storm the snow drifts over it, and falls
  float lay = noise(rot(0.35) * g * vec2(2.6, 8.0) + 2.0) * 0.88 + 0.12 * noise(g * 23.0) - 1.4 + 0.86 * WHITE;
  col = mix(col, snow + sun * 0.15 * btS(0.16, 0.04, lay), btS(0.0, 0.1, lay)) + WHITE * btFlake(p) * (air + 0.3 * sun) * 0.6;
  return screenOf(col * (1.0 - 0.25 * dot(p, p)));
}
