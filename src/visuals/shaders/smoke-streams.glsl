// name: Smoke streams
// a: Five bodies
// b: Broken wake
// what: Fine silver threads of smoke fall side by side through a black box and part round five unseen round bodies: pressed bright at their sides, closing again below, the smoke that touched a body carrying its colour down; or the threads cross the box past one body and, behind it, roll up into slow curls to either side.
// follows: Each kind of sound is a body, larger and more coloured the louder it is; in the wake it is a curl, wound tighter, and the body grows with the whole mix. Bands brighten their own threads, the low end sways them, puffs travel along. A hit sends a bright front down all threads, a cue moves a body across the stream, keys make threads tremble, a voice lays haze.
float ssWide; // half the width of the picture
vec2 ssMul(vec2 a, vec2 b) { return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x); }
vec2 ssInv(vec2 d) { return vec2(d.x, -d.y) / max(dot(d, d), 1e-5); }
float ssKind(int i) { return i == 0 ? uDrone : i == 1 ? uPad : i == 2 ? uTexture : i == 3 ? uPhrase : 4.0 * uHits * (1.0 - uHits); }
// A kind's colour as smoke carries it: light, half washed out.
vec3 ssDye(int i) { vec3 k = uKind[i]; k /= max(max(k.r, max(k.g, k.b)), 0.05); return mix(vec3(dot(k, vec3(0.3, 0.55, 0.15))), k, 0.85); }
// How many threads there are to the height: fewer in a small picture, so that each can be seen.
float ssMany(float n) { return clamp(floor(uRes.y / 6.0), 12.0, n); }
// Smoke from the labels: psi says which thread, steep how far the threads are pressed together, age how far it has frayed,
// run how far along it is. x: the fine core, y: the veil round it.
vec2 ssSmoke(float psi, float steep, float press, float age, float run, float n) {
  float px = 1.0 / uRes.y, u = psi * n, id = floor(u), d = abs(u - id - 0.5), g = max(steep, 0.25);
  float h = hash11(mod(id, 97.0) + 3.0), own = 0.6 + 0.4 * h + 0.5 * h * h * h * h;
  float ph = mod(uTravel * 0.9, TAU) + h * 40.0;
  float puff = smoothstep(0.3, 1.9, sin(run * 11.0 - ph) + sin(run * 18.0 - 2.0 * ph + h * 9.0));
  float real = mix(0.0019, 0.0011, uTone) * (0.8 + 1.3 * age) * (0.8 + 0.4 * h + 0.3 * puff) / g;
  float soft = max(real, 0.68 * px), dist = d / (n * g), fine = smoothstep(1.9, 3.6, 1.0 / (n * g * px));
  // as it frays a thread opens into two filaments
  float split = dist - 0.0024 * age * age * (0.4 + h) / g;
  float core = exp(-split * split / (soft * soft)) * min(real / soft, 1.0);
  // pressed closer than the eye can part them they are one veil
  core = mix(min(1.77 * real * n * g, 0.6), core, fine);
  float veil = mix(0.5, exp(-d * d * mix(38.0, 12.0, age)), fine);
  float give = press * mix(0.85, own * (0.85 + 0.6 * puff * (0.3 + 0.7 * uLevel)), fine);
  return vec2(core * (1.0 - 0.4 * age), veil) * give;
}
// From the smoke to the screen: warm silver near the lamp, and thin smoke blue as thin smoke is.
vec3 ssLight(vec2 s, float haze, vec3 dye, float amount, float lamp, float far) {
  vec3 core = mix(mix(vec3(1.0, 0.95, 0.86), vec3(0.8, 0.88, 1.0), far), dye * 1.2, amount * 0.8);
  vec3 thin = mix(vec3(0.42, 0.56, 0.8), dye, amount * 0.9);
  return lamp * (core * s.x * 1.45 + thin * s.y * (0.03 + 0.03 * uSpace + 0.12 * amount) + thin * haze);
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
    if (i == 1) c[i].y -= 0.2 * roll * mix(0.5, 1.0, fit);
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
  vec2 lampAt = vec2(-0.34, -0.5 - ssWide);
  float hole = 1.0, lag = 0.0, all = 0.0, fray = 0.0, shade = 1.0, called = 0.0; vec3 dye = vec3(0.0);
  for (int i = 0; i < 5; i++) {
    vec2 d = z - c[i], q = ssInv(d), f = ssMul(m[i], q);
    float r = length(d);
    psi += f.y; W -= ssMul(f, q); T -= f.x;
    if (i == 1) { float spin = 0.05 * roll; psi += spin * log(max(r, 0.02)); W += spin * vec2(-q.y, q.x); }
    hole *= smoothstep(0.0, 0.009, r - a[i]);
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
  psi += (0.0028 + 0.004 * uKeys) * age * sin(z.x * 34.0 - mod(uTime * 2.1, TAU) + sin(psi * 23.0) * 2.0);
  T += lag + 0.16 * psi * psi;
  float many = ssMany(32.0), press = pow(clamp(length(W), 0.3, 2.6), 0.9);
  vec2 s = ssSmoke(psi, length(W), press, age, T, many);
  float b = band(sat(0.5 + 0.5 * psi / ssWide)), far = sat(0.6 * length(z - lampAt) / (0.6 + ssWide));
  float lamp = shade * (0.8 + 0.75 * b * (0.5 + uEnergy)) * (1.35 - 1.2 * far);
  lamp *= 1.0 + ssFront(psi, many, T, -0.34, 0.9) + 2.0 * called;
  float haze = 0.004 + 0.03 * uMic + 0.006 * uLevel + 0.02 * fray;
  return screenOf(hole * ssLight(s, haze, dye, sat(all), lamp, far) + vec3(0.0011, 0.0012, 0.0015));
}
vec3 ssWake(vec2 p) {
  bool tall = ssWide < 0.5; // in a tall picture the stream falls
  if (tall) p = vec2(-p.y, p.x);
  float roll = 4.0 * uCue * (1.0 - uCue), fit = tall ? 0.6 : 1.0, len = tall ? 0.5 : min(ssWide, 0.9);
  float a = (0.085 + 0.045 * uLevel) * fit;
  vec2 c = vec2(tall ? -0.3 : -0.5, tall ? 0.02 : 0.07);
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
    float force = side * grown * (3.2 + 2.4 * loud), e2 = exp(-2.6 * r2), ang = force * (0.4 * e + 0.9 * e2);
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
  float many = ssMany(36.0) / fit, press = pow(clamp(steep, 0.3, 2.2), 0.8) * (1.0 - pocket) * (1.0 - 0.2 * age);
  vec2 s = ssSmoke(psi, steep, press, age, T, many);
  float hole = smoothstep(0.0, 0.009, length(p - c) - a);
  float b = band(sat(0.5 + psi / (tall ? 2.0 * ssWide : 1.0)));
  vec2 lampAt = vec2(0.1 * len, 0.72); float far = sat(length(p - lampAt) / (0.75 + len));
  vec2 m = p - c, to = normalize(c - lampAt); float away = dot(m, to), across = abs(to.x * m.y - to.y * m.x);
  float shade = 1.0 - ssShade(away, across, a);
  float lamp = shade * (0.8 + 0.75 * b * (0.5 + uEnergy)) * (1.75 - 1.7 * far) * (1.0 - 0.35 * smoothstep(0.15, 0.45, abs(psi)));
  lamp *= 1.0 + ssFront(psi, many, T, 0.17 - len, 1.1) + 2.0 * uCue * exp(-s1 * s1 * 0.5) * (1.0 - 0.7 * age);
  float haze = 0.004 + 0.03 * uMic + 0.02 * sat(turned) * age + 0.011 * pocket * exp(-0.9 * max(p.x - c.x - a, 0.0) / a);
  return screenOf(hole * ssLight(s, haze, dye, sat(all), lamp, far) + vec3(0.0011, 0.0012, 0.0015));
}
vec3 render(vec2 p) {
  ssWide = 0.5 * uRes.x / uRes.y;
  return uVar < 0.5 ? ssBodies(p) : ssWake(p);
}
