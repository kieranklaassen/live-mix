// name: Poured veils
// a: Veils
// b: Dried pools
// what: Thin paint poured on raw cotton from the upper left: veils fan out, fall, dry with darker rims and run on in tongues, the many layers going bronze where they lie over one another, the right of the cloth bare; or the cloth lay flat and four puddles dried into nested tide rims, one over another.
// follows: Drone, pad, texture and phrase each have a veil or puddle that spreads and deepens as it sounds; the spectrum sets how far tongues run, or how dark rims are; the piece opens its colours in the paint. A hit lets one run down, or one drop fall; a cue sends a wet sheen across. Keys wet the lips, a voice widens the halo, Tone darkens rims, Space softens edges.
// What a point of the cloth has soaked up, as how much of each light it swallows.
vec3 pvSoak;
float pvWet;       // how much wet film lies there
float pvPx;        // one pixel
vec3 pvHalo;       // the binder that creeps out past a stain
float pvGlint;     // the streaks a wet stream shines in
float pvFilm;      // 1 where there is paint
vec4 pvOpen;       // a colour the dark opens to, and how far
float pvTall;      // 1 in a picture as wide as a screen, less in a narrow one
// A kind's colour as a stain: what it swallows per unit of paint.
vec3 pvInk(vec3 k) {
  k /= max(max(k.r, max(k.g, k.b)), 0.05);
  return 0.10 + clamp(-1.6 * log(max(k, 0.01)), 0.03, 2.2);
}
// Each veil's left side, right side and the depth of its foot.
const float PV_A[6] = float[6](-0.17, 0.10, -0.08, 0.22, -0.13, 0.02);
const float PV_B[6] = float[6](0.46, 0.84, 0.64, 1.00, 0.75, 0.55);
const float PV_L[6] = float[6](1.12, 1.16, 1.22, 1.10, 1.04, 1.36);
float pvMax(float a, float b, float k) { return -smin(-a, -b, k); }
// The cloth: cotton duck, over and under, with slubs. x is its shade, y how readily a place drinks.
vec2 pvCloth(vec2 p) {
  float weft = noise(p * vec2(8.0, 210.0)), warp = noise(p * vec2(210.0, 8.0) + 3.0);
  vec2 t = p * 150.0 + 0.35 * vec2(weft, warp);
  vec2 f = sin(PI * t);
  float over = 0.5 + 0.5 * cos(PI * (floor(t.x) + floor(t.y)));
  float fine = (1.0 - smoothstep(0.3, 0.75, 150.0 * pvPx));
  float w = mix(0.5, mix(f.y * f.y, f.x * f.x, over), fine);
  float slub = weft * weft + warp * warp - 0.6;
  return vec2((w - 0.5) * 0.050 * (0.4 + weft + warp) + slub * 0.034 * fine, w * 0.6 + 0.2 + slub * 0.35);
}
// Lays one stain: d is how far inside its edge we are, soft how far it bleeds, body what lies in its middle.
void pvStain(float d, float soft, float body, float rim, vec3 ink, float amt) {
  float s = smoothstep(-soft - pvPx, soft + pvPx, d);
  float x = max(d - 0.6 * soft, 0.0);
  float tide = (x - 0.026) / 0.015, deep = 1.0 / (1.0 + x * 22.0);
  float edge = 1.4 * exp(-x / 0.0055) + 0.24 * max(1.0 - tide * tide, 0.0) + 0.38 * deep * deep;
  pvSoak += ink * amt * s * (body + rim * (0.5 + uTone) * edge / (1.0 + soft * 60.0));
  float halo = 1.0 + abs(d) / (0.020 + 0.016 * uMic);
  pvSoak += pvHalo * amt / (halo * halo * halo);
}
void pvVeils(vec2 p) {
  float t = uTime * 0.02;
  vec2 q = p + 0.02 * (vec2(noise(p * 4.0 + t), noise(p * 4.0 + 19.0 - t)) - 0.5) + 0.006 * (noise(p * 21.0) - 0.5);
  float fibre = noise(p * vec2(150.0, 34.0)) + noise(p * vec2(34.0, 150.0)) - 1.0;
  // the pour: every stream leaves one mouth above the upper left, fans out and bends to fall
  float l = max(0.80 - q.y, 0.02);
  float h = pow(l, 0.66), hx = h * min(pvTall, 1.0);
  float s = (q.x / pvTall + 0.62) / h;
  s += 0.018 * sin(l * 5.0 + s * 6.0) + 0.01 * sin(l * 9.0 - s * 11.0 + 2.0);
  if (s > 1.22 || s < -0.36) return;
  float bleed = noise(p * 2.3 + 5.0);
  bleed = 0.0008 + (0.006 + 0.016 * uSpace) * bleed * bleed * bleed;
  float n1 = noise(vec2(s * 55.0, l * 1.8 - t * 1.5)), n2 = noise(vec2(s * 80.0 + 40.0, l * 1.8 - t * 1.5));
  // how every side and foot wanders; each veil takes its own share of these
  vec4 along = sin(vec4(l * 5.5 + t, l * 5.5 + 1.57 - t, l * 12.0, l * 12.0 + 1.57));
  vec4 over = sin(vec4(s * 7.5, s * 7.5 + 1.57, s * 16.0, s * 16.0 + 1.57));
  float heard = band(sat(s + 0.15));
  float streak[3] = float[3](noise(vec2(s * 13.0, l * 1.1 - t)), noise(vec2(s * 15.0 + 9.0, l * 0.9 - t)), noise(vec2(s * 11.0 + 30.0, l * 1.3 - t)));
  float all = -1.0;
  for (int i = 0; i < 6; i++) {
    float fi = float(i), sd = fi * 7.31 + 1.7;
    float lev = i == 0 ? uDrone : i == 1 ? uPad : i == 2 ? uTexture : i == 3 ? uPhrase : 0.5 * uLevel;
    vec3 k = i < 4 ? uKind[i] : i == 4 ? vec3(0.80, 0.50, 0.26) : uKind[4];
    float a = PV_A[i], b = PV_B[i] + 0.06 * lev, L = PV_L[i] + 0.08 * lev;
    vec4 mine = fract(sd * vec4(0.731, 0.417, 0.913, 0.279)) - 0.5;
    float wa = dot(along, mine * vec4(0.07, 0.07, 0.04, 0.04));
    float wb = dot(along, mine.yxwz * vec4(0.08, -0.08, 0.04, -0.04));
    float side = smin((s - a - wa) * hx, (b + wb - s) * hx, 0.05);
    if (side < -0.12) continue;
    float foot = L - 0.42 * max(s, 0.0) + dot(over, mine.zwxy * vec4(0.20, 0.20, 0.12, 0.12));
    float brink = (1.0 - smoothstep(0.0, 0.30, b - s)), hang = foot;
    foot -= 0.26 * brink * brink;
    float d = smin(side, foot - l, 0.20);
    // the tongues that ran on from its foot
    if (l > foot - 0.15 && l < foot + 0.56) {
      float c0 = floor(s * 10.0 + sd - 0.5);
      for (int j = 0; j <= 1; j++) {
        float id = c0 + float(j), r1 = hash21(vec2(id, sd)), r2 = fract(r1 * 37.7);
        float sc = (id + 0.35 + 0.3 * r2 - sd) / 10.0;
        float inb = smoothstep(0.06, 0.12, min(sc - a, b - sc));
        float hem = (1.0 - smoothstep(0.0, 0.30, b - sc));
        float Lc = hang - 0.26 * hem * hem + (0.02 + 0.34 * r2 * r2 * r2) * (0.75 + 0.6 * heard) * inb * inb;
        float rd = (0.008 + 0.028 * r1 * r1) * (0.8 + 0.4 * (1.0 - smoothstep(0.0, 0.10, abs(l - Lc))));
        vec2 v = vec2((s - sc) * hx, max(l - Lc, 0.0));
        d = pvMax(d, rd * inb - 0.08 * (1.0 - inb) - length(v), 0.03 + 0.02 * r2);
      }
    }
    d += (0.0025 + 0.3 * bleed) * fibre;
    if (d < -0.07) continue;
    float st = streak[i % 3], st2 = mix(n1, n2, fract(sd * 1.37));
    float body = 0.14 + 0.34 * st * st + 0.14 * st2;
    pvStain(d, bleed, body, 0.42, pvInk(k), 0.58 + 1.0 * lev);
    all = max(all, d);
  }
  // where the film is thickest, just inside the lower lip of it all, it still holds the light
  float at = (all - 0.010) / 0.0035;
  float lip = exp(-at * at) * smoothstep(0.75, 1.0, l);
  if (lip > 0.01) pvWet += lip * smoothstep(0.50 - 0.3 * uKeys, 0.80, noise(vec2(s * 6.0 - t * 2.0, l * 4.0 - t * 3.0))) * (0.4 + 0.6 * uKeys);
  float run = noise(vec2(s * 85.0, l * 3.5 - t * 4.0)) * noise(vec2(s * 9.0 + t, l * 1.7 - t * 2.0));
  pvFilm = smoothstep(0.0, 0.04, all); pvGlint = smoothstep(0.2, 0.6, run);
  pvWet += 0.32 * pvFilm * smoothstep(0.38, 0.75, run);
  // the piece lies along the streams, its beginning at the mouth: where it sounds the bronze opens to its colour
  float lm = l + 0.22 * (n2 - 0.5) + 0.06 * (n1 - 0.5);
  vec4 m = piece(vec2((lm - 0.3) / 1.05, 0.05 + 0.9 * sat((s + 0.02 * (n1 - 0.5) + 0.14) / 0.75)));
  pvOpen = vec4(m.rgb / max(m.a, 0.02), sat(m.a * (0.5 + 0.5 * uEnergy)) * (0.15 + 0.8 * n1) * smoothstep(0.3, 0.5, lm));
  // a hit lets one fresh run down an old dry track
  for (int k = 0; k < 3; k++) {
    float fk = float(k), sc = 0.44 + 0.20 * fk, end = 1.16 - 0.10 * fk;
    float w = 0.5 + 0.5 * cos(TAU * (uLoop - fk / 3.0)); w = smoothstep(0.60, 0.88, w);
    float wd = (s - sc - 0.006 * sin(l * 17.0 + fk)) * hx;
    if (abs(wd) > 0.17) continue;
    float old = 0.0040 + 0.004 * smoothstep(end - 0.08, end, l) - length(vec2(wd, max(l - end, 0.0)));
    pvStain(old, 0.001, 0.25, 0.3, pvInk(uKind[4]), 0.5);
    float tip = mix(0.80, end + 0.04, 1.0 - uHits * uHits);
    vec2 tv = vec2(wd, max(l - tip, 0.0));
    float head = 0.011 + 0.011 * smoothstep(tip - 0.16, tip, l);
    float f = sat(w * uHits) * smoothstep(-0.002, 0.002, head - length(tv));
    float spread = sat(w * uHits) * exp(-dot(tv, tv) / 0.0060) * (0.4 + 0.6 * n1);
    pvOpen = mix(pvOpen, vec4(uKind[4], 1.0), max(f, 0.7 * spread));
    pvSoak += pvInk(uKind[4]) * (1.3 * f + 0.55 * spread);
    pvWet += 1.5 * f * (1.0 - smoothstep(0.001, 0.007, length(vec2(wd + 0.006, max(abs(l - tip + 0.03) - 0.03, 0.0)))));
    pvFilm = max(pvFilm, f);
  }
}
// One puddle that dried where it lay: a wash, and the tide rims it left as it drew in.
void pvPool(vec2 p, vec2 c, float R, float sd, vec3 k, float turn, float lev, float bleed, float fine, vec4 ns) {
  vec2 v = p - c;
  float reach = R * 1.5 + 0.05;
  if (dot(v, v) > reach * reach) return;
  v += 0.42 * R * (vec2(noise(v * 1.5 / R + sd), noise(v * 1.5 / R + sd + 21.0)) - 0.5);
  float grow = R * (1.0 + 0.10 * lev);
  vec2 e0 = vec2(cos(sd * 2.4), sin(sd * 2.4)), e1 = vec2(-e0.y, e0.x);   // which way its lobes lie
  float d = length(v) - 0.78 * grow;
  d = smin(d, length(v - 0.66 * R * e0) - 0.46 * grow, 0.3 * R);
  d = smin(d, length(v - 0.80 * R * (0.427 * e1 - 0.904 * e0)) - 0.24 * grow, 0.3 * R);
  d = -d + 0.003 * (ns.z - 0.5) + fine;
  float amt = 0.6 + 0.9 * lev;
  float s = smoothstep(-bleed - pvPx, bleed + pvPx, d);
  pvSoak += pvHalo * exp(-abs(d) / (0.015 + 0.012 * uMic));
  if (d < -0.04) return;
  vec3 i0 = pvInk(hueShift(k, -turn)), i1 = pvInk(hueShift(k, turn));
  float gran = noise(p * 6.0 + sd * 3.0 + 0.011 * uTime), grain = ns.z;
  pvFilm = max(pvFilm, s);
  vec3 lay = mix(i0, i1, gran) * s * (0.05 + 0.32 * gran * gran + 0.10 * grain * grain);
  float off = 0.0;
  for (int n = 0; n < 4; n++) {
    if (n > 2 && R < 0.2) break;
    float fn = float(n), hn = fract(sd * 3.31 + fn * 0.618);
    float nw = mix(ns.x, ns.y, fract(hn * 7.0));
    float x = d - off * R - fn * 0.11 * R * (nw - 0.4);
    off += 0.10 + 0.15 * fract(sd * 5.17 + fn * 0.381);
    if (x < -0.04) continue;
    float on = smoothstep(-bleed - pvPx, bleed + pvPx, x);
    x = max(x, 0.0);
    float fade = 1.0 / (1.0 + x / (0.04 + 0.06 * hn));
    float edge = (0.5 + uTone) * 1.2 * exp(-x / 0.0055) + 0.48 * fade * fade;
    // a rim that came later is fainter in places: the water left there last
    float here = n == 0 ? 0.8 : (0.12 + 0.45 * hn * hn + 0.5 * band((fn + 0.5) / 4.0)) * smoothstep(0.15, 0.60, mix(ns.y, 1.0 - ns.x, fract(hn * 19.0)));
    lay += mix(i0, i1, fn / 3.0) * on * (0.04 + edge * here);
    float lx = (x - 0.011) / 0.007, lip = max(1.0 - lx * lx, 0.0) * on;
    pvWet = max(pvWet, (0.2 + 0.8 * uKeys) * lip * smoothstep(0.5, 0.8, n % 2 == 0 ? ns.w : 1.0 - ns.w));
  }
  // in the two big ones clean water ran back in and pushed the colour out to a frayed edge
  if (R > 0.3) {
    vec2 bv = p - c - 0.42 * R * (-0.307 * e0 - 0.952 * e1);
    bv += 0.22 * R * (vec2(noise(p * 5.0 + sd), noise(p * 5.0 - sd)) - 0.5);
    if (dot(bv, bv) < 0.25 * R * R) {
    float ba = atan(bv.y, bv.x + 1e-5);
    float lobe = abs(sin(ba * 2.5 + sd)) * 0.45 + abs(sin(ba * 6.5 + sin(ba * 2.0 + sd))) * 0.15 + abs(sin(ba * 14.5 + 1.5 * sin(ba * 3.0))) * 0.05 * gran;
    float bx = R * (0.22 + 0.15 * lobe) - length(bv) + 0.7 * fine;
    float in_ = smoothstep(-2.0 * bleed - pvPx, 2.0 * bleed + pvPx, bx), by = max(bx, 0.0);
    lay *= 1.0 - 0.45 * in_ * smoothstep(-0.005, 0.02, bx) * smoothstep(0.0, 0.10, d);
    lay += mix(i0, i1, 0.7) * in_ * smoothstep(0.02, 0.10, d) * (0.35 * exp(-by / 0.005) + 0.16 * exp(-by / 0.025));
    }
  }
  pvSoak += lay * amt;
}
void pvPools(vec2 p) {
  // in a tall picture the cloth is turned a quarter
  vec2 q = uRes.x < uRes.y ? vec2(-p.y, p.x) * 1.4 : p;
  if (uRes.x < uRes.y) pvPx *= 1.4;
  // unevenness of the cloth that every puddle meets alike
  vec4 ns = vec4(noise(q * 3.4 + 0.012 * uTime), noise(q * 3.1 + 50.0 - 0.009 * uTime), noise(rot(0.6) * q * 64.0), noise(q * 4.0 + vec2(uTime * 0.03, -uTime * 0.02)));
  float fine = 0.010 * (noise(q * 23.0 + 5.0) - 0.5) + 0.006 * (ns.z - 0.5);
  float bleed = noise(p * 2.3 + 5.0);
  bleed = 0.0015 + (0.008 + 0.02 * uSpace) * bleed * bleed * bleed;
  pvPool(q, vec2(-0.46, -0.15), 0.50, 1.3, uKind[0], 0.05, uDrone, bleed, fine, ns);
  pvPool(q, vec2(0.14, 0.15), 0.38, 4.1, uKind[1], 0.06, uPad, bleed, fine, ns);
  pvPool(q, vec2(0.05, -0.27), 0.25, 0.4, uKind[2], 0.05, uTexture, bleed, fine, ns);
  pvPool(q, vec2(0.56, -0.20), 0.14, 3.6, uKind[3], 0.05, uPhrase, bleed, fine, ns);
  // the piece lies over the cloth, its beginning at the left: where it sounds, its colour blooms in the damp
  vec2 at = vec2(q.x / 1.7 + 0.5, 0.5 - q.y * 0.95) + 0.13 * (ns.xy - 0.5);
  vec4 m = piece(at) * smoothstep(0.0, 0.12, at.x) * (1.0 - smoothstep(0.88, 1.0, at.x));
  pvSoak += pvInk(m.rgb / max(m.a, 0.02)) * sat(m.a) * pvFilm * (0.1 + 0.8 * uEnergy) * (0.15 + 0.75 * ns.y * ns.y + 0.3 * ns.z);
  // a hit is one drop let fall: a wet ring that runs out from a small dry spot
  for (int k = 0; k < 3; k++) {
    float fk = float(k);
    vec2 c = k == 0 ? vec2(0.64, 0.19) : k == 1 ? vec2(-0.22, 0.33) : vec2(0.36, -0.36);
    float dd = length(q - c) + 1.5 * fine;
    if (dd > 0.30) continue;
    float w = 0.5 + 0.5 * cos(TAU * (uLoop - fk / 3.0)); w = smoothstep(0.60, 0.88, w);
    pvStain(0.013 + 0.006 * fk - dd - 0.012 * (noise(q * 60.0) - 0.5), 0.001, 0.2, 0.5, pvInk(uKind[4]), 0.6);
    float e = dd - 0.115 - 0.07 * (1.0 - uHits) + 0.05 * (noise(q * 7.0 + fk) - 0.5);
    pvSoak += pvInk(uKind[4]) * sat(w * uHits) * (1.1 * exp(-e * e / 0.00012) + (1.0 - smoothstep(-0.004, 0.004, e)) * (0.24 + 0.40 * exp(min(e, 0.0) / 0.03)));
  }
}
vec3 render(vec2 p) {
  pvPx = 1.0 / uRes.y;
  pvTall = clamp(0.5 * uRes.x / uRes.y / 0.89, 0.4, 1.2);
  pvHalo = vec3(0.010, 0.030, 0.075);
  pvSoak = vec3(0.0); pvWet = 0.0; pvFilm = 0.0; pvGlint = 0.0; pvOpen = vec4(0.0);
  vec2 cl = pvCloth(p);
  if (uVar < 0.5) pvVeils(p);
  else pvPools(p);
  // a cue: one wet sheen crosses the cloth
  float across = dot(p, vec2(0.86, -0.5)) - mix(-0.45, 0.85, 1.0 - uCue);
  float wave = uCue * exp(-across * across * 40.0);
  vec3 cloth = vec3(0.965, 0.928, 0.850) * (1.0 + cl.x) * (1.02 - 0.12 * length(p - vec2(-0.3, 0.25))) * (1.0 - 0.09 * wave);
  // many stains together never go black: they end in bronze
  vec3 most = mix(vec3(1.45, 2.05, 2.6) * (0.85 + 0.3 * uTone), 0.4 + 1.25 * pvInk(pvOpen.rgb), pvOpen.a);
  pvSoak = most * (1.0 - exp(-pvSoak / most));
  vec3 col = cloth * exp(-pvSoak * (0.86 + 0.3 * cl.y));
  pvWet += wave * pvFilm * (0.5 + 1.3 * (uVar < 0.5 ? 2.0 * pvGlint : 0.5 * cl.y));
  col += vec3(0.95, 0.97, 1.0) * sat(pvWet) * 0.34 * (1.0 - col);
  return col;
}
