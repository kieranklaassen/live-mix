// name: Smoke streams
// a: Five bodies
// b: Broken wake
// what: Fine silver threads of smoke fall side by side through a black box and part round five unseen round bodies: pressed bright at their sides, closing again below, the smoke that touched a body carrying its colour down; or the threads cross the box past one body and, behind it, roll up into slow curls to either side.
// follows: Each kind of sound is a body, larger and more coloured the louder it is; in the wake it is a curl, wound tighter, and the body grows with the whole mix. Bands brighten their own threads, the low end sways them, puffs travel along. A hit sends a bright front down all threads, a cue moves a body across the stream, keys make threads tremble, a voice lays haze.
// own: 0 1 many hair fine threads, -1 a few broad ones; 1 1 broad bands of colour side by side, -1 threads broken into beads that drift along; 2 1 dark threads on pale paper, -1 a ground in the colour of the drone; 3 1 ridges in relief lit from one side, -1 wide soft veils; 4 1 the bodies are solid stones in the light, -1 lamps that glow in the smoke; 5 1 one great body in the middle (b: a great one near), -1 five small ones in a row (b: a small one far upstream); 6 1 the stream winds round every body (b: the curls wound tight), -1 the whole stream bends in an arc (b: the curls opened to waves); 7 1 laid down flat to a horizon, -1 the threads dyed side by side in the colours of the sounds
float ssWide; // half the width of the picture
float ssPx;   // how much of the stream one pixel covers
float ssFlash; // a hit's front passing here
vec3 ssN;     // where in a body a place is, and how far inside
vec3 ssSkin, ssHalo;  // that body's colour; the light the bodies give
vec2 ssMul(vec2 a, vec2 b) { return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x); }
vec2 ssInv(vec2 d) { return vec2(d.x, -d.y) / max(dot(d, d), 1e-5); }
float ssKind(int i) { return i == 0 ? uDrone : i == 1 ? uPad : i == 2 ? uTexture : i == 3 ? uPhrase : 4.0 * uHits * (1.0 - uHits); }
// A kind's colour as smoke carries it: light, half washed out.
vec3 ssDye(int i) { vec3 k = uKind[i]; k /= max(max(k.r, max(k.g, k.b)), 0.05); return mix(vec3(dot(k, vec3(0.3, 0.55, 0.15))), k, 0.85); }
// How many threads there are to the height: fewer in a small picture, so that each can be seen.
float ssMany(float n) { float m = clamp(floor(uRes.y / 6.0), 12.0, n); return uOwn[0] == 0.0 ? m : m * exp2(1.25 * uOwn[0]); }
// Smoke from the labels: psi says which thread, steep how far the threads are pressed together, age how far it has frayed,
// run how far along it is. x: the fine core, y: the veil round it.
vec2 ssSmoke(float psi, float steep, float press, float age, float run, float n) {
  float px = ssPx, u = psi * n, id = floor(u), d = abs(u - id - 0.5), g = max(steep, 0.25);
  float h = hash11(mod(id, 97.0) + 3.0), own = 0.6 + 0.4 * h + 0.5 * h * h * h * h;
  float ph = mod(uTravel * 0.9, TAU) + h * 40.0;
  float puff = smoothstep(0.3, 1.9, sin(run * 11.0 - ph) + sin(run * 18.0 - 2.0 * ph + h * 9.0));
  float real = mix(0.0019, 0.0011, uTone) * (0.8 + 1.3 * age) * (0.8 + 0.4 * h + 0.3 * puff) / g;
  if (uOwn[0] != 0.0) real *= exp2(-1.15 * uOwn[0]);
  float soft = max(real, 0.68 * px), dist = d / (n * g), fine = smoothstep(1.9, 3.6, 1.0 / (n * g * px));
  // as it frays a thread opens into two filaments
  float split = dist - 0.0024 * age * age * (0.4 + h) / g;
  float core = exp(-split * split / (soft * soft)) * min(real / soft, 1.0);
  // pressed closer than the eye can part them they are one veil
  core = mix(min(1.77 * real * n * g, 0.6), core, fine);
  float veil = mix(0.5, exp(-d * d * mix(38.0, 12.0, age)), fine);
  float give = press * mix(0.85, own * (0.85 + 0.6 * puff * (0.3 + 0.7 * uLevel)), fine);
  vec2 was = vec2(core * (1.0 - 0.4 * age), veil) * give;
  if (uOwn[1] < 0.0) {  // beads, each with its tail
    float v = run * n * 0.42 - uTravel * 0.5 + h * 7.0, iv = floor(v), fv = fract(v) - 0.5, hv = hash21(vec2(mod(id, 97.0), mod(iv, 211.0)));
    float rad = 0.16 + 0.26 * hv * hv, at = length(vec2(u - id - 0.5, (fv < 0.0 ? 0.5 : 1.0) * fv / 0.42)), w = max(n * g * px, 0.03);
    float bead = (1.0 - smoothstep(rad - w, rad + w, at)) * step(0.22, hv) * (0.5 + 0.9 * puff + 0.4 * h);
    was = mix(was, vec2(mix(0.08, bead * 0.85, fine), 0.3 * veil) * mix(1.0, give, 0.3), -uOwn[1]);
  }
  if (uOwn[3] < 0.0) {  // out of focus
    float wide = exp(-d * d * 14.0) * (0.5 + h + 0.5 * puff);
    was = mix(was, vec2(0.0, mix(0.6, wide, fine) * 5.0) * give, -uOwn[3]);
  }
  return was;
}
// From the smoke to the screen: warm silver near the lamp, and thin smoke blue as thin smoke is.
vec3 ssLight(vec2 s, float haze, vec3 dye, float amount, float lamp, float far) {
  vec3 core = mix(mix(vec3(1.0, 0.95, 0.86), vec3(0.8, 0.88, 1.0), far), dye * 1.2, amount * 0.8);
  vec3 thin = mix(vec3(0.42, 0.56, 0.8), dye, amount * 0.9);
  if (uOwn[3] < 0.0) thin = mix(thin, thin * thin * 1.25, -0.8 * uOwn[3]);
  return lamp * (core * s.x * 1.45 + thin * s.y * (0.03 + 0.03 * uSpace + 0.12 * amount) + thin * haze);
}
// The threads dyed side by side in the colours of the sounds.
void ssAcross(float psi, float wide, inout vec3 dye, inout float all) {
  float t = sat(0.5 + 0.5 * psi / wide) * 5.0, i = floor(t), f = smoothstep(0.35, 0.65, fract(t));
  vec3 k = mix(ssDye(int(min(i, 4.0))), ssDye(int(min(i + 1.0, 4.0))), f);
  float loud = 0.6 + 0.4 * piece(vec2(sat(0.5 + 0.5 * psi / wide), 0.5)).a;
  dye = mix(dye, k * loud, -uOwn[7]); all = mix(all, 1.0, -uOwn[7]);
}
// The same stream of another stuff. face: which way psi rises on the picture; shade: 0 where a body throws its shadow.
vec3 ssOther(vec3 was, vec2 p, float psi, vec2 face, float steep, float n, vec2 s, vec3 dye, float all, float far, float shade, float hole) {
  float paper = max(uOwn[2], 0.0), deep = max(-uOwn[2], 0.0), broad = max(uOwn[1], 0.0), relief = max(uOwn[3], 0.0), stone = max(uOwn[4], 0.0), glow = max(-uOwn[4], 0.0);
  float u = psi * n, id = floor(u), f = u - id, w = max(n * steep * ssPx, 0.001), fine = smoothstep(0.35, 0.9, w), lit = 1.12 - 0.42 * far;
  vec3 drone = uKind[0], ground = vec3(0.04), col = was;
  float heard = 0.72 + 0.75 * band(sat(0.5 + 0.5 * psi / ssWide));
  if (paper > 0.0) {
    vec3 sheet = mix(vec3(0.95, 0.925, 0.87), drone, 0.12) * lit * (0.97 + 0.05 * noise(p * 70.0)) * mix(0.72, 1.0, shade);
    vec3 ink = mix(vec3(0.1, 0.1, 0.13), dye * mix(0.75, 0.5, dot(dye, vec3(0.33))), sat(all) * 0.9);
    ground = mix(ground, sheet, paper);
    vec3 on = sheet * (1.0 - sat(s.y * 0.16) * (1.0 - mix(vec3(0.5), dye, sat(all))));
    col = mix(col, mix(on, ink, sat(s.x * 2.0 * heard)), paper);
  }
  if (deep > 0.0) {
    ground = mix(ground, drone * (0.28 + 0.75 * lit * lit * mix(0.45, 1.0, shade)) * (0.9 + 0.2 * noise(p * vec2(3.0, 5.0))), deep);
    col = mix(col, 1.0 - (1.0 - min(ground, 1.0)) * (1.0 - min(was, 1.0)), deep);
  }
  vec3 fill = mix(mix(drone * 0.75 + 0.06, ground, max(paper, deep)), dye, 0.55 * sat(all));
  if (broad > 0.0) {
    vec3 a = vec3(0.0);
    for (int k = -1; k <= 1; k++) {
      float j = mod(id + float(k) + 388.0, 97.0), h = hash11(j + 11.0), h2 = hash11(j + 29.0), g = f - float(k);
      float part = smoothstep(-0.5 * w, 0.5 * w, g + 0.0) - smoothstep(-0.5 * w, 0.5 * w, g - 1.0);
      vec3 c = uKind[int(h * 4.99)] * (0.62 + 0.6 * h2);
      a += part * c * mix(1.0, 0.72 + 0.4 * sat(1.0 - 3.0 * (g - 0.35) * (g - 0.35)), 1.0 - fine);
    }
    vec3 mean = 0.22 * (uKind[0] + uKind[1] + uKind[2] + uKind[3]);
    a = mix(a, mean, smoothstep(0.7, 1.6, w));
    a = mix(a, a * 0.4 + dye * 0.65, 0.6 * sat(all)) * (0.75 + 0.35 * lit) * mix(0.5, 1.0, shade) * (1.0 + 0.5 * min(s.x, 1.0) * (0.3 + uLevel));
    fill = mix(fill, a, broad);
    col = mix(col, mix(a, a * (0.5 + 0.8 * paper), 0.35 * exp(-min(f, 1.0 - f) * min(f, 1.0 - f) * 160.0) * (1.0 - fine)), broad);
  }
  if (relief > 0.0) {
    vec2 up = face / max(length(face), 1e-4);
    float h = hash11(mod(id, 97.0) + 3.0), side = -sin(TAU * f) * dot(up, normalize(vec2(-0.7, 0.55))) * (1.0 - fine), top = mix(0.5 - 0.5 * cos(TAU * f), 0.5, fine);
    float grain = noise(p * 190.0) * 0.6 + noise(p * 83.0) * 0.4;
    float soft = 1.0 - 0.45 * paper;
    vec3 r = fill * (0.6 + 0.22 * paper + 0.42 * soft * side + 0.28 * soft * top + 0.22 * (grain - 0.5)) * (0.85 + 0.25 * lit) * mix(0.5, 1.0, shade);
    r += (0.06 + 0.25 * fill) * smoothstep(0.35, 0.95, side) * (0.6 + 0.6 * h + 0.6 * uLevel);
    r *= 1.0 + 0.5 * min(s.x, 1.5) * top * (0.25 + 0.5 * uLevel);
    col = mix(col, r, relief);
  }
  // the bodies
  vec3 hollow = mix(was * 0.0 + 0.045, paper > 0.0 ? mix(vec3(0.045), ground, paper) : ground, max(paper, deep));
  vec3 dark = hollow * mix(1.0, 0.16, max(paper, deep));
  dark = mix(dark, uKind[1] * (0.75 + 0.6 * sat(0.5 + p.y)) + 0.1, deep * max(uOwn[7], 0.0));   // a pool holds the sky
  if (broad > 0.0) {                                                     // a knot has rings of its own
    float q = length(ssN.xy) * (1.0 + 0.1 * noise(p * 14.0)), y = q * (3.0 + n * 0.05);
    vec3 k = mix(uKind[2], uKind[0], smoothstep(0.2, 0.8, abs(fract(y) * 2.0 - 1.0))) * (0.25 + 0.5 * q * q) * (0.8 + 0.5 * uLevel);
    dark = mix(dark, k, broad);
  }
  float hit = 1.0 - exp(-0.8 * ssFlash);
  col = mix(col, mix(uKind[4] + 0.15, uKind[4] * 0.7, paper), 0.55 * hit * hole);
  if (relief > 0.0 || broad > 0.0 || paper > 0.0 || deep > 0.0) col = mix(dark, col, hole);
  if (ssN.z > 0.0 && stone > 0.0) {
    float q = min(dot(ssN.xy, ssN.xy), 1.0), z = sqrt(1.0 - q), l = dot(vec3(ssN.xy, z), normalize(vec3(-0.6, 0.62, 0.6)));
    vec2 tx = ssN.xy * (1.0 + 0.35 * q);
    float vein = noise(tx * 3.0 + ssSkin.xy * 9.0) * 0.6 + noise(tx * 9.0 + 4.0) * 0.25 + noise(tx * 30.0) * 0.15;
    vec3 c = mix(vec3(0.34, 0.33, 0.33), ssSkin * 0.75, 0.55) * (0.65 + 0.7 * vein);
    c *= 0.1 + 1.15 * sat(0.12 + 0.88 * l) + 0.22 * (1.0 - z) * max(paper, deep);
    c += 0.28 * pow(sat(l), 24.0) * (0.5 + uLevel);
    col = mix(col, c, stone * ssN.z);
  }
  if (glow > 0.0) {
    float q = sat(1.0 - dot(ssN.xy, ssN.xy));
    col = mix(col, ssSkin * (0.5 + 0.55 * q) + 0.35 * q * q, glow * ssN.z);
    col += glow * ssHalo * (1.0 - ssN.z) * (1.0 - 0.75 * paper);
    col = mix(col, col * mix(vec3(1.0), 0.7 + 0.6 * ssHalo, 0.6), glow * paper);
  }
  return col;
}
// A hit: a bright front that runs down every thread at once, each a little before or behind its neighbour.
float ssFront(float psi, float n, float T, float from, float to) {
  float s = T + 0.06 * (hash11(mod(floor(psi * n), 89.0) + 7.0) - 0.5) - mix(from, to, 1.0 - uHits);
  return uHits * exp(-s * s * (s > 0.0 ? 2600.0 : 70.0)) * 5.0 * (0.6 + uEnergy);
}
// The shadow a body throws through the smoke: how far away from it, how far to the side of its line, how big it is.
float ssShade(float away, float side, float a) {
  float blur = 0.035 + 0.11 * max(away, 0.0);
  return 0.6 * smoothstep(0.0, a, away) * (1.0 - smoothstep(-blur, blur, side - a * 0.87)) * exp(-1.6 * max(away, 0.0));
}
vec3 ssBodies(vec2 p) {
  vec2 z = vec2(-p.y, p.x);
  float fit = smoothstep(0.3, 0.8, ssWide), roll = 4.0 * uCue * (1.0 - uCue);
  vec2 c[5]; float a[5]; vec2 m[5]; float mid[5];
  // where they stand (down, across), in a wide and in a tall picture
  c[0] = mix(vec2(0.16, -0.12), vec2(0.13, -0.4), fit);
  c[1] = mix(vec2(-0.14, 0.12), vec2(-0.13, 0.33), fit);
  c[2] = mix(vec2(-0.33, -0.1), vec2(-0.22, -0.06), fit);
  c[3] = mix(vec2(0.33, 0.14), vec2(0.2, 0.62), fit);
  c[4] = mix(vec2(-0.08, -0.2), vec2(-0.17, -0.7), fit);
  for (int i = 0; i < 5; i++) {
    float f = float(i), k = ssKind(i);
    float rest = i == 0 ? 0.074 : i == 1 ? 0.052 : i == 2 ? 0.028 : i == 3 ? 0.04 : 0.024;
    float full = i == 0 ? 0.095 : i == 1 ? 0.075 : i == 2 ? 0.045 : i == 3 ? 0.055 : 0.02;
    a[i] = (rest + full * k) * mix(0.62, 1.0, fit);
    c[i] += 0.02 * vec2(sin(uTime * 0.031 + f * 2.4), sin(uTime * 0.043 + f * 1.7));
    if (uOwn[5] > 0.0) { // one great one
      float g = uOwn[5];
      if (i == 1) { c[i] = mix(c[i], vec2(0.0, 0.04 * sin(uTime * 0.04)), g); a[i] = mix(a[i], (0.2 + 0.05 * uLevel) * mix(0.62, 1.0, fit), g); }
      else a[i] = max(a[i] * (1.0 - g), 0.004);
    }
    if (uOwn[5] < 0.0) { // a row of small ones
      c[i] = mix(c[i], vec2(0.02 + 0.07 * sin(f * 2.4 + 0.5) + 0.01 * sin(uTime * 0.05 + f), ((i == 0 ? 1.0 : i == 1 ? 3.0 : i == 2 ? 2.0 : i == 3 ? 4.0 : 0.0) - 2.0) * 0.34 * min(ssWide, 0.9)), -uOwn[5]);
      a[i] = mix(a[i], (0.034 + 0.03 * k) * mix(0.62, 1.0, fit), -uOwn[5]);
    }
    if (i == 1) c[i].y -= 0.2 * roll * mix(0.5, 1.0, fit) * (1.0 - 0.6 * max(uOwn[5], 0.0));
  }
  // the low band leans the whole stream
  float sway = 0.012 + 0.05 * uLow, wt = uTime * 0.21, k = 3.1;
  float lean = 0.06 * sin(uTime * 0.05) * (0.3 + uLow);
  float psi = z.y - lean * z.x + sway * 0.4 * sin(k * z.x - wt), T = z.x;
  vec2 W = vec2(1.0, -lean + sway * 0.4 * k * cos(k * z.x - wt));
  for (int i = 0; i < 5; i++) {
    vec2 v = vec2(1.0, lean - sway * 0.4 * k * cos(k * c[i].x - wt));
    mid[i] = c[i].y - lean * c[i].x + sway * 0.4 * sin(k * c[i].x - wt);
    for (int j = 0; j < 5; j++) if (j != i) {
      vec2 q = ssInv(c[i] - c[j]), q2 = ssMul(q, q);
      v += a[j] * a[j] * vec2(-q2.x, q2.y);
      mid[i] += a[j] * a[j] * q.y;
    }
    m[i] = a[i] * a[i] * v;
  }
  vec2 lampAt = vec2(-0.34, -0.5 - ssWide), bent = vec2(1.0, 0.0), z0 = z;
  if (uOwn[6] < 0.0) { // bent in an arc, the angles kept
    float b = -0.7 * uOwn[6];
    z0 = z; z += b * ssMul(vec2(0.35, 0.1) + z, vec2(0.35, 0.1) + z) - b * vec2(0.16, 0.11);
    bent = vec2(1.0, 0.0) + 2.0 * b * (vec2(0.35, 0.1) + z0);
    psi = z.y - lean * z.x + sway * 0.4 * sin(k * z.x - wt); T = z.x;
    W = vec2(1.0, -lean + sway * 0.4 * k * cos(k * z.x - wt));
  }
  float hole = 1.0, lag = 0.0, all = 0.0, fray = 0.0, shade = 1.0, called = 0.0; vec3 dye = vec3(0.0);
  for (int i = 0; i < 5; i++) {
    vec2 d = z - c[i], q = ssInv(d), f = ssMul(m[i], q);
    float r = length(d);
    psi += f.y; W -= ssMul(f, q); T -= f.x;
    if (i == 1) { float spin = 0.05 * roll; psi += spin * log(max(r, 0.02)); W += spin * vec2(-q.y, q.x); }
    if (uOwn[6] > 0.0) { float spin = uOwn[6] * (0.55 + 0.45 * hash11(float(i) + 2.0)) * a[i] * (i == 1 || i == 3 ? -2.1 : 2.1); psi += spin * log(max(r, 0.02) / 0.4); W += spin * vec2(-q.y, q.x); }
    float edge = r - a[i] + (uOwn[5] > 0.0 && i != 1 ? 0.014 * uOwn[5] : 0.0);
    if (uOwn[4] != 0.0 || uOwn[1] > 0.0) {
      float in1 = 1.0 - smoothstep(-0.004, 0.004, edge), k = ssKind(i);
      if (in1 > 0.0) { ssN = vec3(d.y, -d.x, 0.0) / a[i]; ssN.z = in1; ssSkin = ssDye(i) * (uOwn[4] < 0.0 ? 0.45 + 0.6 * sat(k + (i == 4 ? uHits : 0.0)) : 1.0); }
      ssHalo += ssDye(i) * (0.12 + 0.6 * sat(k)) * exp(-max(edge, 0.0) / (0.25 * a[i] + 0.05)) * smoothstep(0.002, 0.02, a[i]);
    }
    hole *= smoothstep(0.0, 0.009, edge);
    vec2 to = normalize(c[i] - lampAt); float away = dot(d, to), side = abs(to.x * d.y - to.y * d.x);
    shade *= 1.0 - ssShade(away, side, a[i]);
  }
  for (int i = 0; i < 5; i++) {
    vec2 d = z - c[i];
    float s = (psi - mid[i]) / a[i], along = d.x / a[i];
    float past = 0.5 + 0.5 * along / sqrt(along * along + 0.6);
    lag += 0.5 * a[i] / (0.25 + s * s) * past;
    float on = exp(-s * s * 1.3) * smoothstep(-2.2, 0.6, along) * exp(-max(along, 0.0) * 0.12);
    float loud = ssKind(i); if (i == 4) loud = uHits;
    fray += past * exp(-s * s * 2.0) * exp(-max(along, 0.0) * 0.2);
    if (i == 1) called = uCue * exp(-s * s * 0.5);
    on *= 0.12 + sat(loud * 1.4);
    dye += on * ssDye(i); all += on;
  }
  dye /= max(all, 1e-3);
  float age = sat(0.75 * sat(z.x + 0.5) + 0.5 * fray);
  if (uOwn[6] < 0.0) W = ssMul(W, bent);
  if (uOwn[7] < 0.0) ssAcross(psi, ssWide, dye, all);
  if (uOwn[7] > 0.0) ssPx = max(ssPx, 0.7 * fwidth(psi) / max(length(W), 0.25));
  psi += (0.0028 + 0.004 * uKeys) * age * sin(z.x * 34.0 - mod(uTime * 2.1, TAU) + sin(psi * 23.0) * 2.0);
  T += lag + 0.16 * psi * psi;
  float many = ssMany(32.0), press = pow(clamp(length(W), 0.3, 2.6), 0.9);
  vec2 s = ssSmoke(psi, length(W), press, age, T, many);
  float b = band(sat(0.5 + 0.5 * psi / ssWide)), far = sat(0.6 * length(z - lampAt) / (0.6 + ssWide));
  float lamp = shade * (0.8 + 0.75 * b * (0.5 + uEnergy)) * (1.35 - 1.2 * far);
  lamp *= 1.0 + ssFront(psi, many, T, -0.34, 0.9) + 2.0 * called;
  float haze = 0.004 + 0.03 * uMic + 0.006 * uLevel + 0.02 * fray;
  vec3 col = screenOf(hole * ssLight(s, haze, dye, sat(all), lamp, far) + vec3(0.0011, 0.0012, 0.0015));
  ssFlash = ssFront(psi, many, T, uOwn[7] > 0.0 ? mix(-0.34, 0.1, uOwn[7]) : -0.34, 0.9);
  if (uOwn[1] > 0.0 || uOwn[2] != 0.0 || uOwn[3] > 0.0 || uOwn[4] != 0.0) col = ssOther(col, p, psi, vec2(W.x, -W.y), length(W), many, s * (1.0 + called), dye, all, far, shade, hole);
  return col;
}
vec3 ssWake(vec2 p) {
  bool tall = ssWide < 0.5; // in a tall picture the stream falls
  if (tall) p = vec2(-p.y, p.x);
  float roll = 4.0 * uCue * (1.0 - uCue), fit = (tall ? 0.6 : 1.0) * (uOwn[5] > 0.0 ? 1.0 + 0.75 * uOwn[5] : 1.0 + 0.45 * uOwn[5]), len = tall ? 0.5 : min(ssWide, 0.9);
  float a = (0.085 + 0.045 * uLevel) * fit;
  vec2 c = vec2(tall ? -0.3 : -0.5, tall ? 0.02 : 0.07);
  if (uOwn[5] != 0.0) c = mix(c, uOwn[5] > 0.0 ? vec2(tall ? -0.3 : -0.42, -0.06) : vec2(tall ? -0.4 : -0.68, 0.1), abs(uOwn[5]));
  c.y += 0.012 * sin(uTime * 0.05) - 0.13 * roll * fit;
  vec2 q = p; float gap = 0.27 * fit, go = uTravel * 0.035 / gap, first = floor(go);
  mat2 J = mat2(1.0); // how the turning has stretched the smoke here
  float turned = 0.0, all = 0.0; vec3 dye = vec3(0.0);
  // the curls, each thrown off by the body in turn, left and right, and each a kind of sound
  for (int i = 5; i >= 0; i--) {
    float j = first - float(i), x = (go - j) * gap, side = mod(j, 2.0) * 2.0 - 1.0;
    int kind = int(mod(j, 5.0) + 0.5);
    float loud = ssKind(kind);
    float grown = smoothstep(0.14, 0.5, x / fit) * (1.0 - smoothstep(5.0, 5.9, x / gap)), old = smoothstep(0.4, 1.4, x / fit);
    vec2 o = vec2(c.x + a * 0.6 + x, c.y * (1.0 - 0.6 * old) - side * (0.06 + 0.03 * old) * fit * (1.0 + 2.0 * a / fit));
    vec2 d = q - o; float R = (0.1 + 0.04 * old) * fit * (1.0 + 0.22 * loud), r2 = dot(d, d) / (R * R);
    float e = exp(-r2);
    float force = side * grown * (3.2 + 2.4 * loud) * (uOwn[6] > 0.0 ? 1.0 + 0.9 * uOwn[6] : 1.0 + 0.82 * uOwn[6]), e2 = exp(-2.6 * r2), ang = force * (0.4 * e + 0.9 * e2);
    vec2 slope = -2.0 * d * force * (0.4 * e + 2.34 * e2) / (R * R);
    mat2 turn = rot(ang); vec2 to = turn * d;
    J = (turn + outerProduct(vec2(to.y, -to.x), slope)) * J;
    q = o + to;
    turned += grown * e;
    if (kind == 4) loud = uHits;
    float on = e * grown * (0.12 + 1.3 * loud) * (1.0 - 0.4 * old);
    dye += on * ssDye(kind); all += on;
  }
  dye /= max(all, 1e-3);
  vec2 d = q - c; float behind = smoothstep(-0.2, 1.0, d.x / a), slow = d.x > 0.0 ? 0.45 : 1.0;
  d.x *= slow;
  float r2 = max(dot(d, d), 1e-4), k = a * a / r2, spin = 0.05 * roll, low = 0.008 * (0.2 + uLow), wave = q.x * 4.0 - uTime * 0.2;
  float psi = d.y * (1.0 - k) + 0.5 * spin * log(r2) + low * sin(wave);
  vec2 up = vec2((2.0 * d.y * k + spin) * d.x / r2 * slow + low * 4.0 * cos(wave), 1.0 - k + (2.0 * d.y * k + spin) * d.y / r2);
  float steep = length(up * J);
  float s1 = psi / a, T = q.x - 0.9 * k * d.x + 0.5 * a / (0.2 + s1 * s1) * behind + 0.45 * psi * psi;
  float age = smoothstep(c.x, c.x + 1.5 * fit, p.x);
  psi += 0.003 * uKeys * age * sin(q.x * 34.0 - mod(uTime * 2.1, TAU));
  float pocket = 1.0 - smoothstep(0.98, 1.2, sqrt(r2) / a); // the still air the body holds behind it
  if (uOwn[7] < 0.0) ssAcross(psi, 0.5, dye, all);
  if (uOwn[7] > 0.0) ssPx = max(ssPx, 0.7 * fwidth(psi) / max(steep, 0.25));
  float many = ssMany(36.0) / fit * (1.0 - 0.3 * max(-uOwn[5], 0.0)), press = pow(clamp(steep, 0.3, 2.2), 0.8) * (1.0 - pocket) * (1.0 - 0.2 * age);
  vec2 s = ssSmoke(psi, steep, press, age, T, many);
  float hole = smoothstep(0.0, 0.009, length(p - c) - a);
  float b = band(sat(0.5 + psi / (tall ? 2.0 * ssWide : 1.0)));
  vec2 lampAt = vec2(0.1 * len, 0.72); float far = sat(length(p - lampAt) / (0.75 + len));
  vec2 m = p - c, to = normalize(c - lampAt); float away = dot(m, to), across = abs(to.x * m.y - to.y * m.x);
  float shade = 1.0 - ssShade(away, across, a);
  float lamp = shade * (0.8 + 0.75 * b * (0.5 + uEnergy)) * (1.75 - 1.7 * far) * (1.0 - 0.35 * smoothstep(0.15, 0.45, abs(psi)));
  if (uOwn[3] < 0.0) lamp *= 1.0 - 0.9 * uOwn[3] * uHits * sat(turned);
  lamp *= 1.0 + ssFront(psi, many, T, 0.17 - len, 1.1) + 2.0 * uCue * exp(-s1 * s1 * 0.5) * (1.0 - 0.7 * age);
  float haze = 0.004 + 0.03 * uMic + 0.02 * sat(turned) * age + 0.011 * pocket * exp(-0.9 * max(p.x - c.x - a, 0.0) / a);
  vec3 col = screenOf(hole * ssLight(s, haze, dye, sat(all), lamp, far) + vec3(0.0011, 0.0012, 0.0015));
  if (uOwn[1] > 0.0 || uOwn[2] != 0.0 || uOwn[3] > 0.0 || uOwn[4] != 0.0) {
    ssFlash = ssFront(psi, many, T, 0.17 - len, 1.1);
    float edge = length(m) - a;
    ssN = vec3(m / a, 1.0 - smoothstep(-0.004, 0.004, edge)); if (tall) ssN.xy = vec2(ssN.y, -ssN.x);
    vec3 k = mix(ssDye(0), ssDye(1), 0.5 + 0.5 * sin(uTime * 0.06));
    ssSkin = k * (uOwn[4] < 0.0 ? 0.5 + 0.6 * uLevel : 1.0); ssHalo = k * (0.2 + 0.6 * uLevel) * exp(-max(edge, 0.0) / (0.4 * a + 0.05));
    vec2 face = up * J; if (tall) face = vec2(face.y, -face.x);
    col = ssOther(col, p, psi, face, steep, many, s, dye, all, far, shade, hole);
  }
  return col;
}
vec3 render(vec2 p) {
  ssWide = 0.5 * uRes.x / uRes.y;
  ssPx = 1.0 / uRes.y; ssN = vec3(0.0); ssSkin = vec3(0.5); ssHalo = vec3(0.0);
  if (uOwn[7] <= 0.0) return uVar < 0.5 ? ssBodies(p) : ssWake(p);
  // laid down flat: the stream seen along the ground, and air over its far end
  float lie = uOwn[7], w = 1.0 - lie * 2.3 * (p.y + 0.16), wc = max(w, 0.05);
  vec2 q = vec2(p.x, p.y) / wc * (1.0 - 0.12 * lie) + vec2(0.0, -0.1 * lie);
  ssPx = ssPx / wc;
  vec3 c = uVar < 0.5 ? ssBodies(q) : ssWake(q);
  float paper = max(uOwn[2], 0.0), deep = max(-uOwn[2], 0.0), up = p.y - (1.0 / max(2.3 * lie, 0.01) - 0.16);
  vec3 air = mix(mix(vec3(0.02, 0.022, 0.028), vec3(0.17, 0.18, 0.2), exp(-9.0 * abs(up))), mix(vec3(0.9, 0.88, 0.84), mix(uKind[1], vec3(0.95), 0.55), sat(up * 3.5)), paper);
  air = mix(air, mix(uKind[1] * 1.05 + 0.16, uKind[0] * 0.6, sat(up * 2.6)), deep);
  return mix(air, c, smoothstep(0.06, 0.34, w));
}
