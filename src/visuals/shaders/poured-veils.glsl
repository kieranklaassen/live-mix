// name: Poured veils
// a: Veils
// b: Dried pools
// what: Thin paint poured on raw cotton from the upper left: veils fan out, fall, dry with darker rims and run on in tongues, the many layers going bronze where they lie over one another, the right of the cloth bare; or the cloth lay flat and four puddles dried into nested tide rims, one over another.
// follows: Drone, pad, texture and phrase each have a veil or puddle that spreads and deepens as it sounds; the spectrum sets how far tongues run, or how dark rims are; the piece opens its colours in the paint. A hit lets one run down, or one drop fall; a cue sends a wet sheen across. Keys wet the lips, a voice widens the halo, Tone darkens rims, Space softens edges.
// own: 0 the ground: 1 black, and the paint lies on it bright, -1 cloth dyed deep in the drone's colour with the paint laid over it; 1 the layout: 1 a straight curtain right across (b: the pools in a row), -1 poured from the middle out all round (b: the pools one inside another); 2 1 many narrow pours (b: many small pools), -1 few and broad; 3 1 even, straight and round, -1 ragged and wandering; 4 the edges: 1 only drawn rims, the inside all but bare, -1 no rims, a soft bleeding cloud; 5 the material: 1 thick glossy enamel that stands up and catches a lamp, -1 a stipple of fine dots; 6 the eye: 1 low along the cloth as it lies, -1 the cloth hangs in pleats; 7 1 long runs (b: the pools run down), -1 short, with no runs (b: blown out sideways)
// What a point of the cloth has soaked up, as how much of each light it swallows.
vec3 pvSoak;
float pvWet;       // how much wet film lies there
float pvPx;        // one pixel
vec3 pvHalo;       // the binder that creeps out past a stain
float pvGlint;     // the streaks a wet stream shines in
float pvFilm;      // 1 where there is paint
vec4 pvOpen;       // a colour the dark opens to, and how far
vec3 pvOver;       // the paint seen as opaque, laid one over the other
float pvLay;       // how much of it lies there
float pvHigh;      // how high it stands
vec3 pvTint;       // the colour of what is being laid
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
// The same paint as a body colour, over what lies there already.
void pvFilmOf(vec3 k, float w) { pvOver = mix(pvOver, k, w); pvLay += (1.0 - pvLay) * w; }
void pvBody(vec3 k, float amt, float a) { pvFilmOf(k, a * 0.94 * (1.0 - exp(-3.4 * max(amt, 0.0)))); }
// Lays one stain: d is how far inside its edge we are, soft how far it bleeds, body what lies in its middle.
void pvStain(float d, float soft, float body, float rim, vec3 ink, float amt) {
  soft += 0.05 * max(-uOwn[4], 0.0);
  body *= 1.0 - 0.9 * max(uOwn[4], 0.0); rim *= 1.0 + 0.6 * max(uOwn[4], 0.0) - max(-uOwn[4], 0.0);
  float s = smoothstep(-soft - pvPx, soft + pvPx, d);
  float x = max(d - 0.6 * soft, 0.0);
  float tide = (x - 0.026) / 0.015, deep = 1.0 / (1.0 + x * 22.0);
  float edge = 1.4 * exp(-x / 0.0055) + 0.24 * max(1.0 - tide * tide, 0.0) + 0.38 * deep * deep;
  pvSoak += ink * amt * s * (body + rim * (0.5 + uTone) * edge / (1.0 + soft * 60.0));
  pvBody(pvTint, amt * s * (0.75 * body + 0.55 * rim * edge), 1.0);
  pvHigh += min(amt, 1.2) * 0.6 * (1.0 - exp(-max(d + 0.012, 0.0) * max(d + 0.012, 0.0) / 0.0016));
  float halo = 1.0 + abs(d) / (0.020 + 0.016 * uMic);
  pvSoak += pvHalo * amt / (halo * halo * halo);
}
void pvVeils(vec2 p) {
  float t = uTime * 0.02;
  float even = max(uOwn[3], 0.0), wild = max(-uOwn[3], 0.0), way = 1.0 - even + 1.6 * wild;
  vec2 q = p + (0.02 * (1.0 - even) + 0.09 * wild) * (vec2(noise(p * 4.0 + t), noise(p * 4.0 + 19.0 - t)) - 0.5) + (0.006 * (1.0 - even) + 0.035 * wild) * (noise(p * 21.0) - 0.5);
  float fibre = noise(p * vec2(150.0, 34.0)) + noise(p * vec2(34.0, 150.0)) - 1.0;
  // the pour: every stream leaves one mouth above the upper left, fans out and bends to fall
  float l = max(0.80 - q.y, 0.02);
  float h = pow(l, 0.66), hx = h * min(pvTall, 1.0);
  float wide = max(uOwn[1], 0.0), round_ = max(-uOwn[1], 0.0);
  h = mix(h, 1.75, wide); hx = mix(hx, 1.75 * pvTall, wide);
  float s = (q.x / pvTall + mix(0.62, 0.80, wide)) / h;
  if (round_ > 0.0) {
    float rr = length(q - vec2(0.0, 0.06)), an = rr > 1e-4 ? atan(q.x, 0.06 - q.y) : 0.0;
    l = mix(l, 2.3 * rr + 0.02, round_); hx = mix(hx, 4.8 * rr, round_);
    s = mix(s, 0.42 + an * 0.205 + 0.02 * sin(rr * 5.0), round_);
  }
  float many = max(uOwn[2], 0.0), few = max(-uOwn[2], 0.0), pour = 0.0;
  if (many > 0.0) {
    float each = mix(3.0, 1.22, many), more = 1.0 + 2.4 * many;
    s = s * more + 0.17; hx /= more;
    pour = floor(s / each); s -= pour * each + 0.17;
  }
  s += way * (0.018 * sin(l * 5.0 + s * 6.0) + 0.01 * sin(l * 9.0 - s * 11.0 + 2.0));
  if (s > 1.22 || s < -0.36) return;
  if (uOwn[6] > 0.0 && q.y > 0.79) return;
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
    float fi = float(i), sd = fi * 7.31 + 1.7 + pour * 3.7;
    float lev = i == 0 ? uDrone : i == 1 ? uPad : i == 2 ? uTexture : i == 3 ? uPhrase : 0.5 * uLevel;
    vec3 k = many > 0.0 && pour != 0.0 ? uKind[int(hash21(vec2(fi, pour + 0.5)) * 4.99)] : i < 4 ? uKind[i] : i == 4 ? vec3(0.80, 0.50, 0.26) : uKind[4];
    float a = PV_A[i], b = PV_B[i] + 0.06 * lev, L = PV_L[i] + 0.08 * lev;
    L += -0.22 * max(uOwn[7], 0.0) + 0.38 * min(uOwn[7], 0.0) + many * 0.34 * (hash21(vec2(fi, pour)) - 0.5);
    float at6 = i == 0 ? 0.0 : i == 1 ? 2.0 : i == 2 ? 4.0 : i == 3 ? 1.0 : i == 4 ? 3.0 : 5.0;
    a = mix(a, -0.16 + 0.205 * at6, wide * wide); b = mix(b, 0.08 + 0.205 * at6 + 0.05 * lev, wide * wide);
    a = mix(a, -0.14 + 0.185 * at6, round_ * round_); b = mix(b, 0.06 + 0.185 * at6 + 0.03 * lev, round_ * round_);
    L = mix(L, 1.14 + 0.12 * lev + 0.10 * sin(at6 * 2.2), round_ * round_);
    a += many * 0.3 * (hash21(vec2(fi + 9.0, pour)) - 0.5); b += many * 0.3 * (hash21(vec2(fi + 5.0, pour)) - 0.5);
    if (i == 3) { a += 0.16 * few * wide; b += 0.55 * few * wide; } if (i == 0) { a -= 0.1 * few * wide; b += 0.16 * few * wide; }
    float gone = i == 0 || i == 3 ? 0.0 : few, thin = max(0.3 * (b - a), 0.0) * many * (1.0 - wide) * (1.0 - round_);
    if (gone >= 1.0) continue;
    a += thin - (i == 3 ? 0.04 : 0.0) * few; b -= thin - 0.1 * few;
    vec4 mine = fract(sd * vec4(0.731, 0.417, 0.913, 0.279)) - 0.5;
    float wa = way * dot(along, mine * vec4(0.07, 0.07, 0.04, 0.04));
    float wb = way * dot(along, mine.yxwz * vec4(0.08, -0.08, 0.04, -0.04));
    float side = smin((s - a - wa) * hx, (b + wb - s) * hx, 0.05);
    if (side < -0.12) continue;
    float foot = L - 0.42 * (1.0 - 0.8 * wide) * (1.0 - round_) * max(s, 0.0) + way * dot(over, mine.zwxy * vec4(0.20, 0.20, 0.12, 0.12));
    float brink = (1.0 - smoothstep(0.0, 0.30, b - s)), hang = foot;
    foot -= 0.26 * brink * brink;
    float d = smin(side, foot - l, 0.20);
    // the tongues that ran on from its foot
    if (l > foot - 0.15 && l < foot + 0.56 + 0.8 * max(uOwn[7], 0.0)) {
      float c0 = floor(s * 10.0 + sd - 0.5);
      for (int j = 0; j <= 1; j++) {
        float id = c0 + float(j), r1 = hash21(vec2(id, sd)), r2 = fract(r1 * 37.7);
        float sc = (id + 0.35 + 0.3 * r2 - sd) / 10.0;
        float inb = smoothstep(0.06, 0.12, min(sc - a, b - sc));
        float hem = (1.0 - smoothstep(0.0, 0.30, b - sc));
        float Lc = hang - 0.26 * hem * hem + (0.02 + 0.34 * mix(r2 * r2 * r2, r2, max(uOwn[7], 0.0))) * (0.75 + 0.6 * heard) * (1.0 + 1.2 * max(uOwn[7], 0.0)) * (1.0 - 0.95 * max(-uOwn[7], 0.0)) * inb * inb;
        float rd = (0.008 + 0.028 * r1 * r1) * (0.8 + 0.4 * (1.0 - smoothstep(0.0, 0.10, abs(l - Lc))));
        vec2 v = vec2((s - sc) * hx, max(l - Lc, 0.0));
        d = pvMax(d, rd * inb - 0.08 * (1.0 - inb) - length(v), 0.03 + 0.02 * r2);
      }
    }
    d += (0.0025 + 0.3 * bleed) * (1.0 + 3.0 * wild) * fibre;
    if (d < -0.07) continue;
    float st = streak[i % 3], st2 = mix(n1, n2, fract(sd * 1.37));
    float body = 0.14 + 0.34 * st * st + 0.14 * st2;
    pvTint = i == 4 ? mix(uKind[1], uKind[2], 0.5) : k;
    pvStain(d, bleed, body, 0.42, pvInk(k), (0.58 + 1.0 * lev) * (1.0 - gone));
    all = max(all, d);
  }
  // where the film is thickest, just inside the lower lip of it all, it still holds the light
  float at = (all - 0.010) / 0.0035;
  float lip = exp(-at * at) * smoothstep(0.75, 1.0, l);
  lip *= 1.0 - max(-uOwn[4], 0.0); if (lip > 0.01) pvWet += lip * smoothstep(0.50 - 0.3 * uKeys, 0.80, noise(vec2(s * 6.0 - t * 2.0, l * 4.0 - t * 3.0))) * (0.4 + 0.6 * uKeys);
  float run = noise(vec2(s * 85.0, l * 3.5 - t * 4.0)) * noise(vec2(s * 9.0 + t, l * 1.7 - t * 2.0));
  pvFilm = smoothstep(0.0, 0.04, all); pvGlint = smoothstep(0.2, 0.6, run);
  pvWet += 0.32 * pvFilm * smoothstep(0.38, 0.75, run);
  // the piece lies along the streams, its beginning at the mouth: where it sounds the bronze opens to its colour
  float lm = l + 0.22 * (n2 - 0.5) + 0.06 * (n1 - 0.5);
  vec4 m = piece(vec2((lm - 0.3) / 1.05, 0.05 + 0.9 * sat((s + 0.02 * (n1 - 0.5) + 0.14) / 0.75)));
  pvOpen = vec4(m.rgb / max(m.a, 0.02), sat(m.a * (0.5 + 0.5 * uEnergy)) * (0.15 + 0.8 * n1) * smoothstep(0.3, 0.5, lm));
  // a hit lets one fresh run down an old dry track
  for (int k = 0; k < 3; k++) {
    float fk = float(k), sc = 0.44 + 0.20 * fk, end = 1.16 - 0.10 * fk - 0.36 * max(-uOwn[7], 0.0);
    float w = 0.5 + 0.5 * cos(TAU * (uLoop - fk / 3.0)); w = smoothstep(0.60, 0.88, w);
    float wd = (s - sc - 0.006 * sin(l * 17.0 + fk)) * hx;
    if (abs(wd) > 0.17) continue;
    float old = 0.0040 + 0.004 * smoothstep(end - 0.08, end, l) - length(vec2(wd, max(l - end, 0.0)));
    pvTint = uKind[4];
    pvStain(old, 0.001, 0.25, 0.3, pvInk(uKind[4]), 0.5);
    float tip = mix(0.80, end + 0.04, 1.0 - uHits * uHits);
    vec2 tv = vec2(wd, max(l - tip, 0.0));
    float head = 0.011 + 0.011 * smoothstep(tip - 0.16, tip, l);
    float f = sat(w * uHits) * smoothstep(-0.002, 0.002, head - length(tv));
    float spread = sat(w * uHits) * exp(-dot(tv, tv) / 0.0060) * (0.4 + 0.6 * n1);
    pvOpen = mix(pvOpen, vec4(uKind[4], 1.0), max(f, 0.7 * spread));
    pvSoak += pvInk(uKind[4]) * (1.3 * f + 0.55 * spread);
    pvBody(uKind[4], 1.3 * f + 0.4 * spread, 1.0); pvHigh += 0.6 * f;
    pvWet += 1.5 * f * (1.0 - smoothstep(0.001, 0.007, length(vec2(wd + 0.006, max(abs(l - tip + 0.03) - 0.03, 0.0)))));
    pvFilm = max(pvFilm, f);
  }
}
// One puddle that dried where it lay: a wash, and the tide rims it left as it drew in.
void pvPool(vec2 p, vec2 c, float R, float sd, vec3 k, float turn, float lev, float bleed, float fine, vec4 ns) {
  vec2 v = p - c;
  float even = max(uOwn[3], 0.0), wild = max(-uOwn[3], 0.0);
  if (uOwn[7] > 0.0 && v.y < 0.0) { float f7 = noise(vec2(v.x * 9.0 + sd * 5.0, sd)); f7 = smoothstep(0.35, 0.95, f7); v.y /= 1.0 + uOwn[7] * (0.25 + 3.2 * f7) * smoothstep(0.0, -0.6 * R, v.y); }
  if (uOwn[7] < 0.0) { float f7 = noise(vec2(v.y * 8.0 + sd * 5.0, sd)); f7 = f7 * f7; float k7 = 1.0 - uOwn[7] * (0.3 + 2.4 * f7) * smoothstep(-0.3 * R, 0.6 * R, v.x); v.x /= k7; }
  float reach = R * 1.5 + 0.05;
  if (dot(v, v) > reach * reach) return;
  v += 0.42 * (1.0 - even) * R * (vec2(noise(v * 1.5 / R + sd), noise(v * 1.5 / R + sd + 21.0)) - 0.5);
  if (wild > 0.0) v += wild * R * (0.8 * (vec2(noise(v * 3.6 / R + sd), noise(v * 3.6 / R + sd + 31.0)) - 0.5) + 0.35 * (vec2(noise(v * 9.0 / R - sd), noise(v * 9.0 / R + sd + 11.0)) - 0.5));
  float grow = R * (1.0 + 0.10 * lev);
  vec2 e0 = vec2(cos(sd * 2.4), sin(sd * 2.4)), e1 = vec2(-e0.y, e0.x);   // which way its lobes lie
  float d = length(v) - 0.78 * grow;
  d = smin(d, length(v - 0.66 * R * e0) - 0.46 * grow, 0.3 * R);
  d = smin(d, length(v - 0.80 * R * (0.427 * e1 - 0.904 * e0)) - 0.24 * grow, 0.3 * R);
  d = mix(d, length(v) - 0.98 * grow, even);
  d = -d + (0.003 * (ns.z - 0.5) + fine) * (1.0 - 0.8 * even);
  float amt = 0.6 + 0.9 * lev;
  float s = smoothstep(-bleed - pvPx, bleed + pvPx, d);
  pvSoak += pvHalo * exp(-abs(d) / (0.015 + 0.012 * uMic));
  if (d < -0.04) return;
  vec3 i0 = pvInk(hueShift(k, -turn)), i1 = pvInk(hueShift(k, turn));
  float gran = noise(p * 6.0 + sd * 3.0 + 0.011 * uTime), grain = ns.z;
  pvFilm = max(pvFilm, s);
  vec3 lay = mix(i0, i1, gran) * s * (0.05 + 0.32 * gran * gran + 0.10 * grain * grain) * (1.0 - 0.85 * max(uOwn[4], 0.0) + 1.0 * max(-uOwn[4], 0.0));
  float off = 0.0;
  for (int n = 0; n < 4; n++) {
    if (n > 2 && R < 0.2) break;
    float fn = float(n), hn = fract(sd * 3.31 + fn * 0.618);
    float nw = mix(ns.x, ns.y, fract(hn * 7.0));
    float x = d - off * R - fn * 0.11 * R * (nw - 0.4) * (1.0 - even);
    off += 0.10 + 0.15 * fract(sd * 5.17 + fn * 0.381);
    if (x < -0.04) continue;
    float on = smoothstep(-bleed - pvPx, bleed + pvPx, x);
    x = max(x, 0.0);
    float fade = 1.0 / (1.0 + x / (0.04 + 0.06 * hn));
    float edge = (0.5 + uTone) * 1.2 * exp(-x / 0.0055) + 0.48 * fade * fade;
    // a rim that came later is fainter in places: the water left there last
    float here = n == 0 ? 0.8 : (0.12 + 0.45 * hn * hn + 0.5 * band((fn + 0.5) / 4.0)) * smoothstep(0.15, 0.60, mix(ns.y, 1.0 - ns.x, fract(hn * 19.0)));
    lay += mix(i0, i1, fn / 3.0) * on * (0.04 + edge * (1.0 - 0.6 * max(uOwn[4], 0.0) * smoothstep(0.012, 0.03, x)) * here * (1.0 + 1.0 * max(uOwn[4], 0.0)) * (1.0 - 0.96 * max(-uOwn[4], 0.0)));
    float lx = (x - 0.011) / 0.007, lip = max(1.0 - lx * lx, 0.0) * on;
    pvWet = max(pvWet, (0.2 + 0.8 * uKeys) * lip * smoothstep(0.5, 0.8, n % 2 == 0 ? ns.w : 1.0 - ns.w));
  }
  // in the two big ones clean water ran back in and pushed the colour out to a frayed edge
  if (R > 0.3 && even < 0.99 && uOwn[4] > -0.99) {
    vec2 bv = p - c - 0.42 * R * (-0.307 * e0 - 0.952 * e1);
    bv += 0.22 * R * (vec2(noise(p * 5.0 + sd), noise(p * 5.0 - sd)) - 0.5);
    if (dot(bv, bv) < 0.25 * R * R) {
    float ba = atan(bv.y, bv.x + 1e-5);
    float lobe = abs(sin(ba * 2.5 + sd)) * 0.45 + abs(sin(ba * 6.5 + sin(ba * 2.0 + sd))) * 0.15 + abs(sin(ba * 14.5 + 1.5 * sin(ba * 3.0))) * 0.05 * gran;
    float bx = R * (0.22 + 0.15 * lobe) - length(bv) + 0.7 * fine;
    float in_ = smoothstep(-2.0 * bleed - pvPx, 2.0 * bleed + pvPx, bx), by = max(bx, 0.0);
    in_ *= (1.0 - even) * (1.0 - max(-uOwn[4], 0.0));
    lay *= 1.0 - 0.45 * in_ * smoothstep(-0.005, 0.02, bx) * smoothstep(0.0, 0.10, d);
    lay += mix(i0, i1, 0.7) * in_ * smoothstep(0.02, 0.10, d) * (0.35 * exp(-by / 0.005) + 0.16 * exp(-by / 0.025));
    }
  }
  pvSoak += lay * amt;
  pvBody(mix(hueShift(k, -turn), hueShift(k, turn), gran), amt * dot(lay, vec3(0.5)), 1.0);
  float dh = max(d - fine + 0.010, 0.0); pvHigh += min(amt, 1.2) * 0.75 * (1.0 - exp(-dh * dh / 0.003)) * (0.9 + 0.1 * gran);
}
void pvPools(vec2 p) {
  // in a tall picture the cloth is turned a quarter
  vec2 q = uRes.x < uRes.y ? vec2(-p.y, p.x) * 1.4 : p;
  if (uRes.x < uRes.y) pvPx *= 1.4;
  // unevenness of the cloth that every puddle meets alike
  vec4 ns = vec4(noise(q * 3.4 + 0.012 * uTime), noise(q * 3.1 + 50.0 - 0.009 * uTime), noise(rot(0.6) * q * 64.0), noise(q * 4.0 + vec2(uTime * 0.03, -uTime * 0.02)));
  float fine = 0.010 * (noise(q * 23.0 + 5.0) - 0.5) + 0.006 * (ns.z - 0.5);
  float bleed = noise(p * 2.3 + 5.0);
  bleed = 0.05 * max(-uOwn[4], 0.0) + 0.0015 + (0.008 + 0.02 * uSpace) * bleed * bleed * bleed;
  vec4 cx = vec4(-0.46, 0.14, 0.05, 0.56), cy = vec4(-0.15, 0.15, -0.27, -0.20), rs = vec4(0.50, 0.38, 0.25, 0.14);
  float row = max(uOwn[1], 0.0), nest = max(-uOwn[1], 0.0), many = max(uOwn[2], 0.0), few = max(-uOwn[2], 0.0);
  cx = mix(cx, vec4(-0.63, -0.20, 0.22, 0.62), row); cy = mix(cy, vec4(-0.02, 0.03, -0.01, 0.02), row); rs = mix(rs, vec4(0.22, 0.20, 0.19, 0.17), row);
  cx = mix(cx, vec4(0.0, 0.03, -0.03, 0.02), nest); cy = mix(cy, vec4(0.0, -0.02, 0.02, 0.0), nest); rs = mix(rs, vec4(0.52, 0.38, 0.26, 0.13), nest);
  rs *= 1.0 - 0.52 * many + few * vec4(0.45, 0.35, -0.94, -0.94);
  cx += few * vec4(0.10, 0.26, 0.2, 0.3); cy += few * vec4(0.02, 0.10, 0.0, 0.0);
  cx += many * vec4(0.0, 0.10, -0.3, 0.1) * (1.0 - nest) * (1.0 - row);
  pvPool(q, vec2(cx.x, cy.x), rs.x, 1.3, uKind[0], 0.05, uDrone, bleed, fine, ns);
  pvPool(q, vec2(cx.y, cy.y), rs.y, 4.1, uKind[1], 0.06, uPad, bleed, fine, ns);
  pvPool(q, vec2(cx.z, cy.z), rs.z, 0.4, uKind[2], 0.05, uTexture, bleed, fine, ns);
  pvPool(q, vec2(cx.w, cy.w), rs.w, 3.6, uKind[3], 0.05, uPhrase, bleed, fine, ns);
  if (many > 0.0) {
    // the small ones lie in places of a wide lattice, each a little out of its place
    vec2 g = q / vec2(0.27, 0.25) + 100.0, id = floor(g);
    for (int k = 0; k < 4; k++) {
      vec2 n = floor(g - 0.5) + vec2(float(k & 1), float(k >> 1));
      float h = hash21(n), h2 = fract(h * 53.7), h3 = fract(h * 171.3);
      vec2 at2 = (n - 100.0 + 0.5 + 0.5 * (1.0 - row) * (vec2(h2, h3) - 0.5)) * vec2(0.27, 0.25);
      int kd = int(h * 3.99);
      pvPool(q, at2, many * (0.045 + 0.06 * h2), 2.0 + 9.0 * h3, uKind[kd], 0.05, 0.75 * (kd == 0 ? uDrone : kd == 1 ? uPad : kd == 2 ? uTexture : uPhrase), bleed, fine, ns);
    }
  }
  // the piece lies over the cloth, its beginning at the left: where it sounds, its colour blooms in the damp
  vec2 at = vec2(q.x / 1.7 + 0.5, 0.5 - q.y * 0.95) + 0.13 * (ns.xy - 0.5);
  vec4 m = piece(at) * smoothstep(0.0, 0.12, at.x) * (1.0 - smoothstep(0.88, 1.0, at.x));
  pvSoak += pvInk(m.rgb / max(m.a, 0.02)) * sat(m.a) * pvFilm * (0.1 + 0.8 * uEnergy) * (0.15 + 0.75 * ns.y * ns.y + 0.3 * ns.z);
  pvFilmOf(m.rgb / max(m.a, 0.02), sat(m.a) * pvFilm * (0.1 + 0.5 * uEnergy) * ns.y);
  // a hit is one drop let fall: a wet ring that runs out from a small dry spot
  for (int k = 0; k < 3; k++) {
    float fk = float(k);
    vec2 c = k == 0 ? vec2(0.64, 0.19) : k == 1 ? vec2(-0.22, 0.33 - 0.27 * max(uOwn[6], 0.0)) : vec2(0.36, -0.36 + 0.26 * max(uOwn[6], 0.0));
    float dd = length(q - c) + 1.5 * fine;
    if (dd > 0.30) continue;
    float w = 0.5 + 0.5 * cos(TAU * (uLoop - fk / 3.0)); w = smoothstep(0.60, 0.88, w);
    pvTint = uKind[4];
    pvStain(0.013 + 0.006 * fk - dd - 0.012 * (noise(q * 60.0) - 0.5), 0.001, 0.2, 0.5, pvInk(uKind[4]), 0.6);
    float e = dd - 0.115 - 0.07 * (1.0 - uHits) + 0.05 * (noise(q * 7.0 + fk) - 0.5);
    pvSoak += pvInk(uKind[4]) * sat(w * uHits) * (1.1 * exp(-e * e / 0.00012) + (1.0 - smoothstep(-0.004, 0.004, e)) * (0.24 + 0.40 * exp(min(e, 0.0) / 0.03)));
    pvBody(uKind[4], sat(w * uHits) * (1.3 * exp(-e * e / 0.00012) + 0.35 * (1.0 - smoothstep(-0.004, 0.004, e))), 1.0);
  }
}
vec3 render(vec2 p) {
  pvPx = 1.0 / uRes.y;
  pvTall = clamp(0.5 * uRes.x / uRes.y / 0.89, 0.4, 1.2);
  pvHalo = vec3(0.010, 0.030, 0.075);
  pvSoak = vec3(0.0); pvWet = 0.0; pvFilm = 0.0; pvGlint = 0.0; pvOpen = vec4(0.0);
  pvOver = vec3(0.0); pvLay = 0.0; pvHigh = 0.0; pvTint = vec3(0.0);
  // how the cloth lies: along the floor away from the eye, or hung in pleats
  vec2 px0 = vec2(length(vec2(dFdx(p.x), dFdy(p.x))), length(vec2(dFdx(p.y), dFdy(p.y))));
  float shade = 1.0, far = 0.0;
  if (uOwn[6] > 0.0) {
    float dn = max(1.0 - 1.25 * uOwn[6] * (p.y + 0.08), 0.22);
    far = uOwn[6] * (1.0 - smoothstep(0.4, 1.2, dn));
    p = mix(p, vec2(p.x, p.y * 1.15) / dn, min(4.0 * uOwn[6], 1.0)); pvPx *= 1.0 / dn;
  }
  if (uOwn[6] < 0.0) {
    float am = -uOwn[6], wd = 0.9 * noise(vec2(p.x * 2.4, p.y * 0.5 + 4.0)) + 0.06 * sin(uTime * 0.09 + p.y * 2.0);
    float ph = p.x * 15.0 + 9.0 * wd, deep = 0.55 + 0.45 * sin(p.x * 3.1 + 1.0);
    float f = sin(ph) + 0.3 * sin(2.0 * ph + 1.0);
    shade = 1.0 + am * deep * (0.24 * f - 0.12) - 0.14 * am * (1.0 - smoothstep(-1.2, 0.4, f));
    p += am * deep * vec2(0.034 * cos(ph), 0.012 * f);
  }
  vec2 cl = pvCloth(p);
  if (uVar < 0.5) pvVeils(p);
  else pvPools(p);
  // a cue: one wet sheen crosses the cloth
  float across = dot(p, vec2(0.86, -0.5)) - mix(-0.45, 0.85, 1.0 - uCue);
  float wave = uCue * exp(-across * across * 40.0);
  vec3 cloth = vec3(0.965, 0.928, 0.850) * (1.0 + cl.x) * (1.02 - 0.12 * length(p - vec2(-0.3, 0.25))) * (1.0 - 0.09 * wave);
  float dots = 1.0;
  if (uOwn[5] < 0.0) {
    // each dot is as large as there is paint for
    float there = max(1.0 - exp(-0.75 * dot(pvSoak, vec3(0.4))), 0.0), g = 0.019;
    there = mix(there, max(there, 0.8 * pvLay), abs(uOwn[0]));
    vec2 gp = rot(0.35) * p / g, gi = floor(gp);
    float jr = hash21(gi), r = 0.62 * sqrt(there) * (0.8 + 0.4 * jr);
    vec2 o = gp - gi - 0.5 - 0.2 * (vec2(jr, fract(jr * 41.0)) - 0.5);
    float aa = min(1.5 * pvPx / g, 0.5);
    float mk = (1.0 - smoothstep(r - aa, r + aa, length(o))) * smoothstep(0.03, 0.08, there);
    dots = mix(1.0, mk, -uOwn[5]);
    pvSoak *= mix(1.0, 1.7 * dots, -uOwn[5]);
  }
  // many stains together never go black: they end in bronze
  vec3 most = mix(vec3(1.45, 2.05, 2.6) * (0.85 + 0.3 * uTone), 0.4 + 1.25 * pvInk(pvOpen.rgb), pvOpen.a);
  pvSoak = most * (1.0 - exp(-pvSoak / most));
  vec3 col = cloth * exp(-pvSoak * (0.86 + 0.3 * cl.y));
  float solid = max(abs(uOwn[0]), max(uOwn[5], 0.0));
  if (solid > 0.0) {
    // the paint as a body colour, on the ground there is
    vec3 under = cloth;
    under = mix(under, vec3(0.020, 0.021, 0.026) * (1.0 + 5.0 * cl.x) * (1.3 - 0.8 * length(p)), max(uOwn[0], 0.0));
    under = mix(under, uKind[0] * (0.62 + 1.6 * cl.x) * (1.05 - 0.35 * length(p - vec2(-0.3, 0.25))), max(-uOwn[0], 0.0));
    vec3 over = mix(pvOver / max(pvLay, 0.001), pvOpen.rgb, 0.8 * pvOpen.a);
    over = over * (0.96 + 0.5 * (cl.y - 0.2) * 0.3 * (1.0 - 0.9 * max(uOwn[5], 0.0))) * (0.72 + 0.4 * pvLay);
    vec3 laid = mix(under, over, sat(pvLay * 1.05) * dots);
    laid += 0.10 * exp(-12.0 * abs(pvLay - 0.3)) * over * max(uOwn[0], 0.0) * dots;
    col = mix(col, laid, solid);
  }
  if (uOwn[5] > 0.0) {
    // it stands up thick and catches a lamp from the upper left
    float hh = 0.05 * (1.0 - exp(-1.1 * pvHigh));
    vec2 gr = vec2(dFdx(hh), dFdy(hh)) / max(px0, 1e-5);
    gr /= 1.0 + 0.45 * length(gr);
    vec3 nn = normalize(vec3(-gr, 1.1));
    vec3 ld = normalize(vec3(-0.5, 0.6, 0.75));
    float dif = dot(nn, ld) / 0.69, sp = pow(max(dot(nn, normalize(ld + vec3(0.0, 0.0, 1.0))), 0.0), 34.0);
    float on = smoothstep(0.05, 0.6, pvLay);
    col *= mix(1.0, clamp(0.35 + 0.65 * dif, 0.25, 1.35), uOwn[5] * on);
    col += uOwn[5] * on * ((0.42 + 0.6 * uHits) * sp * smoothstep(0.02, 0.2, length(gr)) + (0.07 + 0.2 * uHits) * max(nn.y, 0.0));
  }
  col *= shade;
  pvWet += wave * pvFilm * (0.5 + 1.3 * (uVar < 0.5 ? 2.0 * pvGlint : 0.5 * cl.y));
  col += vec3(0.95, 0.97, 1.0) * sat(pvWet) * 0.34 * (1.0 - col);
  if (far > 0.0) col *= 1.0 - 0.35 * far;
  return col;
}
