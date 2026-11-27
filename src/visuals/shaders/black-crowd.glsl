// name: Black crowd
// a: Skating pond
// b: Ferry landing
// what: A wood block print on cream paper: a crowd of coats and hats run together into one black mass at the edge of a frozen pond at evening, with a few skaters out alone under a leaning lamp; or a black crowd coming down a gangway from a ferry's white side and over a pale quay, steam as bare paper, a bollard cut by the left edge.
// follows: The drone widens the black mass; pads cut gloss into the ground and roll more steam; texture is gouge marks; a phrase bares and tints hats, and sends skaters wider; a hit cuts a white gap that runs through the crowd. A cue bares hats and edges, and draws people out. Bands raise heads at the rim, the piece tints the ground, keys put on red mufflers.
// own: 0 bright day with a bare sky at -1, night with lamps at 1; 1 a few people at -1, a crowd over nearly all the ground at 1; 2 all men in tall hats at -1, all women in wide hats, most of them white, at 1; 3 fog over what is far at -1, slant rain at 1; 4 close among them at -1, far off and high at 1; 5 rose paper with a red second ink at -1, pale green paper with an ochre one at 1; 6 a: open sea, small sails and a great sun half up at -1, a street of gabled houses behind the ice at 1 (b: the ferry small and far out at sea at -1, a towering black liner at 1); 7 the crowd parted down both sides of an empty way at -1, scattered in ones and twos over all the ground in coloured coats at 1
const float bcHz = 0.38; // the horizon
#define bcSea max(-uOwn[6], 0.0)
#define bcTown max(uOwn[6], 0.0)
#define bcApart max(-uOwn[7], 0.0)
#define bcLoose max(uOwn[7], 0.0)
float bcTall, bcVx, bcW, bcPix, bcFrom; // a person's height, vanishing place, width, a pixel, where the crowd begins
float bcHer, bcSide, bcTurn, bcTopHat, bcPale, bcLoad; // who is drawn
const vec2 bcHat = vec2(0.0, 0.845); // where the head sits
const vec3 bcLamp = vec3(1.0, 0.85, 0.5);
vec2 bcHash; 
vec3 bcPaper, bcInk, bcWash, bcDark; float bcNight, bcDay; // paper, black, second ink, night on the ground, the hour
vec3 bcGap; // the gap a hit opens: where, how strong

#define WHEN(c) for (bool when_ = (c); when_; when_ = false)
float bcCut(float d, float w) { return smoothstep(-w, w, -d); }
float bcOn(float d) { return bcCut(d, bcPix); }
void bcBlack(inout vec3 c, float d) { c = mix(c, bcInk, bcOn(d)); }
void bcBare(inout vec3 c, float d) { c = mix(c, bcPaper, bcOn(d)); }
float bcSeg(vec2 p, vec2 a, vec2 b, float r) {
  vec2 e = b - a, q = p - a;
  return length(q - e * sat(dot(q, e) / max(dot(e, e), 1e-6))) - r;
}
float bcRip(float x) { return 0.5 + 0.25 * (sin(x) + sin(x * 2.3 + 1.0)); }
float bcBox(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
float bcEgg(vec2 p, vec2 r) { float k = length(p / r); return (k - 1.0) * min(r.x, r.y); }
vec3 bcOf(vec3 c, float k) { return bcPaper * mix(vec3(1.0), c, k); }
vec3 bcRich(vec3 c, float k) { return max(mix(vec3(dot(c, vec3(0.3, 0.59, 0.11))), c, k), 0.0); }

// Who stands in this cell of the crowd.
void bcWho(vec2 id) {
  vec2 a = hash22(id + 3.7);
  bcHash = fract(a.yx * vec2(57.3, 91.7));
  bcHer = smoothstep(0.42, 0.58, a.x + 0.55 * uOwn[2]);
  bcTopHat = smoothstep(0.45, 0.55, fract(a.x * 37.0) + 0.1 - 0.4 * uOwn[2]);
  bcTurn = a.y;
  bcSide = fract(a.x * 17.0) < 0.5 ? -1.0 : 1.0;
  bcPale = max(uCue, (1.0 - smoothstep(0.28, 0.36, fract(a.y * 23.0) - 0.6 * max(uOwn[2], 0.0) - 0.3 * uPhrase)));
  bcLoad = fract(a.y * 41.0);
}
float bcCoat(float y) {
  float below = sat((0.52 - y) / 0.52), man = 0.1 + 0.045 * sat(1.25 - 2.5 * y) + 0.035 * smoothstep(0.45, 0.64, y);
  float her = 0.06 + 0.15 * below * sqrt(below) + 0.09 * smoothstep(0.5, 0.65, y);
  float cap = sat((y - 0.64) / 0.15);
  return mix(man, her, bcHer) * (1.0 - cap * cap);
}
float bcHatOnly(vec2 q) {
  vec2 c = q - bcHat;
  float up = mix(mix(0.034, 0.066 - 0.04 * min(uOwn[2], 0.0), bcTopHat), 0.03, bcHer), man = 1.0 - bcHer;
  vec2 k = vec2(c.x - 0.1 * bcSide * bcHash.x * (c.y - 0.1), c.y - 0.042 - up);
  float d = bcBox(k, vec2(0.056 + 0.1 * k.y * bcTopHat, up), min(up, mix(0.034, 0.008, bcTopHat * man)));
  float lie = c.y - 0.045 - (0.12 * bcHash.x - 0.04) * c.x * bcSide - 1.2 * c.x * c.x * (1.0 - 1.9 * bcHer);
  d = min(d, bcBox(vec2(c.x, lie), vec2(mix(0.082, 0.135, bcHer), 0.011), 0.01));
  return min(d, bcEgg(mat2(0.88, 0.48 * bcSide, -0.48 * bcSide, 0.88) * (c - vec2(0.06 * bcSide, 0.1)), vec2(0.075, 0.034) * bcHer * (0.4 + bcHash.y) + 0.002));
}
float bcParcel(vec2 q) { return bcBox(q - vec2(0.16 * bcSide, 0.34), vec2(0.075, 0.062), 0.008) + step(0.22, bcLoad); }
float bcPerson(vec2 q) {
  float w = bcCoat(q.y), e = (q.y - 0.5) / 0.15, leg = 0.03 + 0.05 * bcHash.x;
  w += 0.05 * bcHash.y * sat(0.5 + 9.0 * q.x * bcSide) * sat(1.0 - e * e); // an elbow
  float hem = mix(0.15, 0.015, bcHer) + 0.012 * sin(q.x * 34.0 + 6.0 * bcHash.x);
  float d = min(max(max((abs(q.x) - w) * 0.85, hem - q.y), q.y - 0.79), bcParcel(q));
  WHEN(q.y < 0.25) d = min(d, bcSeg(vec2(abs(q.x), q.y), vec2(0.05, 0.2), vec2(0.05 + leg, 0.015), 0.024));
  WHEN(q.y > 0.7) d = min(d, min(bcEgg(q - bcHat, vec2(0.06, 0.076)), bcHatOnly(q)));
  return d;
}
// The knife's marks in a person, and their muffler. `fine` is a pixel in their height.
vec2 bcMarks(vec2 q, float d, float fine, float deep) {
  float w = 0.0, scarf = 0.0, thin = max(0.006, 0.7 * fine) * (1.0 + 2.0 * uCue), cuts = sat((bcHash.y - 0.75 * deep) * 8.0 + 0.2 + uCue), s = q.x * bcSide;
  WHEN(q.y > 0.64) {
    // a face, a shirt front, a hat left bare or its band
    vec2 c = q - bcHat, f = vec2(s - 0.013, c.y);
    float man = step(bcHer, 0.5), seen = step(0.36, bcTurn), beard = step(bcHash.x, 0.4) * man, band_ = bcCut(abs(c.y - 0.062) - 0.008, fine);
    w = bcCut(max(bcEgg(f + vec2(0.0, 0.014), vec2(0.042, 0.053)), max(c.y - 0.022, mix(-0.2, -0.03, beard) - c.y - 4.0 * s * s)), fine);
    float ink = min(length(vec2(abs(f.x) - 0.015, c.y * 1.4)) - 0.006, bcSeg(f, vec2(0.004, 0.0), vec2(0.011, -0.022), 0.003));
    ink = min(ink, bcEgg(f - vec2(0.0, -0.034), vec2(0.022, 0.0065) * man + 0.0005));
    w *= seen * (1.0 - bcCut(ink, fine) * step(fine, 0.02));
    w = max(w, step(0.5, bcHash.y) * man * seen * bcCut(max(abs(q.x) - 0.42 * (q.y - 0.66), abs(q.y - 0.71) - 0.045), fine));
    w = max(w, mix(step(0.6, bcHash.x) * man * step(d, -0.008) * band_, bcCut(d + 0.013, fine) * (1.0 - band_), bcPale) * step(0.885, q.y));
  }
  WHEN(q.y < 0.79) {
    // where the sleeve turns, the lamp's side of the coat, a muff, a parcel
    float t = sat((q.y - 0.4) / 0.28), run = cuts * sat(1.0 - abs(q.y - 0.3 - 0.4 * bcHash.x) * 5.0);
    float line = abs(s + 0.075 - 0.05 * t * t) - cuts * thin * 4.0 * t * (1.0 - t) + step(t, 0.0);
    line = min(line, abs(d + 0.02) - thin * 1.3 * run + step(q.x, 0.02) + step(run, 0.1) + step(q.y, 0.22));
    w = max(w, bcCut(line, fine));
    float muff = bcCut(max(bcEgg(q - vec2(0.02 * bcSide, 0.5), vec2(0.085, 0.048)), 0.004 - abs(fract(q.x * 26.0) - 0.5) * 0.04), fine);
    w = max(w, muff * step(0.5, min(bcHer, bcHash.x)) * step(0.36, bcTurn));
    float box = bcParcel(q);
    w = mix(w, bcCut(max(box + 0.014, 0.004 - min(abs(s - 0.16), abs(q.y - 0.34))), fine), step(box, 0.0));
    scarf = bcCut(min(bcBox(vec2(q.x, q.y - 0.752 - 0.1 * s), vec2(0.075, 0.03), 0.01), bcBox(vec2(s - 0.055, q.y - 0.62), vec2(0.02, 0.13), 0.01)), fine);
  }
  return vec2(w, scarf);
}
vec2 bcEdge(float D) {
  float grow = 0.16 * uDrone + 0.05 * uLow + 0.5 * uOwn[1] + 0.72 * uCue * (1.0 - uCue) + 0.015 * sin(uTime * 0.11 + D * 4.0);
  if (uVar > 0.5) return vec2(mix(0.13, 0.55, sat((D - 0.38) / 0.6)) * bcW + grow * 0.8, mix(-0.02, 0.2, sat((D - 0.4) / 0.55)) * bcW - 0.05 * sin(D * 9.0));
  return vec2((mix(-0.62, 0.2, smoothstep(0.14, 0.75, D)) + 0.12 * sin(D * 8.5 + 0.6) - 0.1 * smoothstep(0.8, 1.2, D) - 0.5 * smoothstep(0.17, 0.3, 0.47 - D)) * bcW + grow, 0.0);
}
float bcMass(vec2 e, float x, float D) {
  float m = (e.x - (uVar < 0.5 ? x : abs(x - e.y))) / (0.16 * D + 0.05), more = 0.16 * uDrone + 0.5 * uOwn[1] + 0.72 * uCue * (1.0 - uCue);
  WHEN(uOwn[7] < 0.0) m = mix(m, (abs(x - 0.1 * bcW - 0.16 * bcW * sin(D * 3.4 + 2.5)) - (0.34 * D + 0.07 - 0.3 * more)) / (0.16 * D + 0.05), bcApart);
  WHEN(uOwn[7] > 0.0) m = mix(m, 0.55 * sin(x / D * 2.1 + 5.0 * D) * sin(x / D * 1.3 - D * 9.0 + 1.0) - 0.42 + more, smoothstep(0.0, 0.8, bcLoose));
  return m;
}
#define bcWide max(abs(uOwn[7]), -uOwn[1])
float bcFlash(vec2 p) {
  WHEN(uOwn[7] < 0.0) p.x = mix(p.x, uVar < 0.5 ? -abs(p.x) : abs(p.x) - 0.5, bcApart);
  vec2 q = (p - bcGap.xy + vec2(-0.2 * bcLoose, 0.18 + 0.3 * bcLoose) * bcWide) * vec2(1.0, 0.55);
  return bcGap.z * exp(-dot(q, q) * 60.0 * exp2(0.8 * bcApart - 1.4 * bcLoose - 1.8 * bcWide));
}
vec3 bcPrint(vec2 q, float d, float fine, vec2 p, float red, float deep) {
  vec2 m = vec2(0.0);
  WHEN(fine < 0.06) m = bcMarks(q, d, fine, deep) * (1.0 - smoothstep(0.03, 0.06, fine));
  float hatch = abs(fract((q.x + 0.35 * q.y) * 9.0) - 0.5) * 2.0;
  m.x = max(m.x, bcCut(d + 0.02, fine) * smoothstep(-0.12, 0.12, bcFlash(p) * 1.4 - 0.1 - hatch) * step(q.y, 0.79));
  vec3 bare = mix(bcPaper, bcPaper * bcRich(uKind[3], 0.8), 0.6 * sat(uPhrase * 1.3) * bcPale * step(0.86, q.y));
  vec3 coat = bcInk;
  WHEN(uOwn[7] > 0.0) {
    float n = floor(bcLoad * 6.0);
    vec3 dye = bcRich(uKind[int(min(n, 4.0))], 0.75) * mix(vec3(1.0), bcPaper, 0.6);
    dye = mix(dye, dye * 0.55, step(0.5, fract(bcLoad * 6.0)));
    coat = mix(bcInk, dye, bcLoose * step(n, 4.5) * bcCut(d + 0.016, fine) * step(q.y, 0.79));
    coat = mix(coat, bcPaper, bcLoose * step(4.5, n) * bcCut(d + 0.016, fine) * step(q.y, 0.79));
  }
  return mix(mix(coat, bare, m.x), vec3(0.74, 0.16, 0.12), m.y * smoothstep(0.72, 0.76, bcLoad) * red);
}
vec2 bcBest, bcBestQ, bcBestId; float bcDeep;
void bcTry(vec2 p, vec2 at, float size, vec2 id, float deep) {
  vec2 q = (p - at) / size;
  WHEN(abs(q.x) < 0.25 && q.y < 1.2 && q.y > -0.04) {
    bcWho(id);
    float d = bcPerson(q);
    if (d < bcBest.x) { bcBest = vec2(d, bcPix / size); bcBestQ = q; bcBestId = id; bcDeep = deep; }
  }
}
void bcUnder(inout vec4 acc, vec3 c, float a) { acc += (1.0 - acc.a) * a * vec4(c, 1.0); }
// One row of them, on the ground or on the gangway.
void bcRow(inout vec4 acc, vec2 p, float red, float row, float D, vec2 edge, bool plank) {
  float H = bcTall * D, lane = H * 0.3, go = plank ? uTravel * 0.12 : hash11(row * 1.7) * 9.0 + (hash11(row + 5.0) - 0.5) * uTravel * 0.025;
  float u = (p.x - bcVx) / lane + go, k = floor(u), nb = u - k < 0.5 ? -1.0 : 1.0;
  bcBest = vec2(1e3, 1.0);
  for (int j = 0; j < 2 && bcBest.x > -0.01; j++) {
    float at = k + float(j) * nb;
    vec2 id = mod(vec2(at, row), 512.0), h = hash22(id + 11.0);
    float cx = bcVx + (at + 0.32 + 0.35 * h.x - go) * lane, f = fract(h.x * 31.0), e = cx / (0.42 * bcW) + 0.143;
    float m = plank ? 0.6 + uDrone + uOwn[1] : bcMass(edge, cx, D);
    float here = sat((m + 1.7 * (h.y - 0.62)) * 10.0 - 0.5) * (plank ? (1.0 - smoothstep(0.94, 1.02, e + 2.2 * bcSea)) * smoothstep(-0.12, 0.0, e) : smoothstep(bcFrom, bcFrom + 0.05, D));
    float tall = mix(0.9, 1.09, f) * (f < 0.1 ? 0.72 : 1.0) * here * (2.0 - here);
    tall *= 1.0 + 0.15 * band(0.5 + 0.55 * cx / bcW + 0.3 * (h.y - 0.5)) * (1.0 - smoothstep(0.5, 3.2, m));
    float foot = (plank ? 0.155 * e - 0.035 : bcHz - D + (h.y - 0.5) * 0.1 * D) + 0.012 * H * sin(uTravel * 1.1 + f * TAU);
    WHEN(here > 0.03) bcTry(p, vec2(cx, foot), H * tall, id, smoothstep(0.6, 2.4, m));
  }
  WHEN(bcBest.x < 2.0 * bcBest.y) {
    bcWho(bcBestId);
    bcUnder(acc, bcPrint(bcBestQ, bcBest.x, bcBest.y, p, red, bcDeep), bcCut(bcBest.x, bcBest.y));
  }
}
vec4 bcCrowd(vec2 p, float red) {
  float T = uVar * uTravel * 0.045, n = floor(T);
  float G = max(bcHz - p.y, 0.001), i0 = max(0.0, ceil(T - n - log(G / (1.75 - 2.38 * bcTall)) / log(1.27)));
  float D = 1.75 * pow(1.27, T - n - i0), last = max(bcFrom, G / 1.06);
  vec4 acc = vec4(0.0);
  for (int i = 0; i < 5 && D > last && acc.a < 0.99; i++) {
    vec2 e = bcEdge(D);
    WHEN(bcMass(e, p.x, D) > -1.05) bcRow(acc, p, red, float(i) + i0 + n, D, e, false);
    D /= 1.27;
  }
  WHEN(G > bcFrom && acc.a < 0.99) {
    float cut = abs(fract(log2(G) * 14.0 + 0.5 * bcRip(p.x * 19.0 + p.y * 9.0)) - 0.5);
    float on = smoothstep(0.0, 0.1, min(bcMass(bcEdge(G), p.x, G) - 1.5, (G - bcFrom - 0.05) * 30.0) + cut);
    bcUnder(acc, mix(bcInk, bcPaper, sat(bcFlash(p) * 1.5) * step(0.3, cut)), on);
  }
  return acc;
}
float bcDash(vec2 g, float on, float aa) {
  vec2 i = mod(floor(g), 512.0), f = fract(g) - 0.5;
  float h = hash21(i + 7.0);
  if (h >= on) return 0.0;
  float s = sat((on - h) * 5.0), t = (f.x + 0.3 * (hash21(i + 19.0) - 0.5)) / (0.2 + 0.25 * fract(h * 37.0));
  return bcCut(abs(f.y + 0.5 * (fract(h * 91.0) - 0.5) + 0.08 * t) - 0.16 * s * (1.0 - t * t), aa) * step(abs(t), 1.0) * step(0.001, s);
}
vec3 bcGouge(vec3 c, vec2 p, float D) {
  float l = log2(max(D, 0.0001));
  c = mix(c, c * bcWash, 0.8 * bcDash(vec2(p.x / D * 1.5, l * 11.0), 0.08 + 0.4 * uPad, 0.06));
  return mix(c, bcInk, bcDash(vec2(p.x / D * 6.0, l * 22.0 + 3.0), 0.02 + 0.32 * uTexture, 0.12));
}

vec3 bcSky(vec3 c, vec2 p, float low, float out_) {
  float y = p.y * 62.0 + 1.4 * bcRip(p.x * 6.0 + p.y * 21.0), th = mix(0.14, 0.62 - 0.1 * uTone, smoothstep(low, low + 0.27, p.y)) * (1.0 - 0.95 * bcDay) + 0.4 * bcNight;
  return mix(c, c * mix(bcWash, bcWash * 0.4, bcNight), bcCut(abs(fract(y) - 0.5) - th, 62.0 * bcPix) * (1.0 - out_));
}
vec4 bcTint(vec2 uv) { vec4 m = piece(clamp(uv, 0.0, 1.0)); return vec4(bcRich(m.rgb / max(max(m.r, max(m.g, m.b)), 0.05), 0.8), sat(m.a * 1.4)); }
float bcSkater(vec2 q, float way) {
  q.x -= 0.22 * way * q.y * (1.0 - 0.3 * q.y);
  float hem = mix(0.26, 0.13, bcHer) - 0.1 * way * q.x;
  float d = max(max((abs(q.x + 0.12 * way * sat(0.55 - q.y)) - bcCoat(q.y)) * 0.85, hem - q.y), q.y - 0.79);
  d = min(d, min(bcEgg(q - bcHat, vec2(0.06, 0.076)), bcHatOnly(q)));
  d = min(d, min(bcSeg(q, vec2(0.04 * way, 0.3), vec2(0.0, 0.015), 0.028), bcSeg(q, vec2(-0.03 * way, 0.3), vec2(-0.22 * way, 0.22), 0.03)));
  d = min(d, min(bcSeg(q, vec2(-0.22 * way, 0.22), vec2(-0.37 * way, 0.2), 0.02), bcSeg(q, vec2(-0.4 * way, 0.24), vec2(-0.36 * way, 0.15), 0.012)));
  return min(d, bcSeg(q, vec2(-0.2 * way, 0.57), vec2(0.2 * way, 0.6), 0.03));
}
// Gabled fronts behind the ice.
void bcHouses(inout vec3 c, vec2 q) {
  for (int i = 0; i < 2; i++) {
    float fi = float(i), w = 0.15 + 0.03 * fi, u = q.x / w + 0.37 * (fi + 1.0), n = floor(u), h = hash11(n + 31.0 * fi + 3.0), g = fract(h * 37.0);
    float x = (u - n - 0.5) * w, tall = (0.145 + 0.09 * h - 0.045 * fi) * bcTown, hw = w * (0.41 + 0.06 * fi), dark = step(0.45, fract(h * 13.0));
    float rise = g < 0.35 ? floor((hw - abs(x)) / hw * 5.0) * 0.017 : g < 0.7 ? (hw - abs(x)) * 1.25 : 0.07 * sqrt(sat(1.0 - x * x / (hw * hw * 0.7)));
    float d = max(abs(x) - hw, q.y - tall - rise * bcTown);
    bcBlack(c, bcBox(vec2(x - hw * 0.55, q.y - tall - 0.06 * bcTown), vec2(0.008, 0.032 * bcTown), 0.001));
    c = mix(c, mix(bcOf(mix(bcWash, bcRich(uKind[1 + i], 0.8), 0.4), 0.5 * step(0.5, fract(h * 71.0))), bcInk, max(dark, bcNight)), bcOn(d));
    vec2 ws = vec2(hw * 2.0 / 3.0, 0.044), k = vec2(x, q.y - 0.012) / ws + vec2(0.5, 0.0), id = floor(k);
    float on = step(0.4 - 0.3 * uEnergy, hash21(id + n * 7.0 + fi * 3.0));
    vec3 glass = mix(mix(bcInk, bcPaper, dark), bcPaper * bcLamp, max(bcNight, 0.3 * dark));
    WHEN(id.y > -0.5 && (id.y + 1.0) * ws.y < tall) c = mix(c, mix(glass, bcInk, (1.0 - on) * bcNight), bcOn(bcBox((fract(k) - 0.5) * ws, vec2(0.0095, 0.0135), 0.001)) * step(abs(x), hw * 0.98) * smoothstep(0.3, 0.6, bcTown));
    bcBlack(c, abs(d) - 0.0026);
    WHEN(q.y > tall && abs(x) < hw - 0.004) c = mix(c, bcOf(bcDark, 0.3), bcOn(abs(d + 0.008) - 0.004) * bcTown);
  }
}
float bcSail(vec2 q, float way) {
  float m = max(max(way * q.x - 0.34 * (1.0 - q.y), -way * q.x), max(0.16 - q.y, q.y - 1.0));
  float j = max(max(-way * q.x - 0.05 - 0.26 * (0.8 - q.y), way * q.x + 0.05), max(0.2 - q.y, q.y - 0.8));
  return min(min(m, j), max(abs(q.y - 0.06) - 0.07, abs(q.x) - 0.3 - 0.8 * q.y));
}
vec3 bcPond(vec2 p, vec4 crowd, float red) {
  vec3 c = bcPaper;
  float D = max(bcHz - p.y, 0.02), shore = 0.215 + 0.012 * sin(p.x * 5.0 + 1.0);
  vec2 foot = vec2(0.52 * bcW, 0.19), top = vec2(0.45 * bcW, 0.395), r;
  float lx = mix(foot.x, 0.34 * bcW, bcSea);
  WHEN(uOwn[6] < 0.0) { foot.x += 1.4 * bcSea; top.x += 1.4 * bcSea; }
  r = p - top;
  WHEN(p.y < shore) {
    float far = shore - p.y, sn = log2(D) * 9.0 + 0.6 * bcRip(p.x * 11.0 + p.y * 17.0), strip = abs(fract(sn) - 0.5) * 2.0;
    float lie = bcCut(abs(p.x - lx + 0.1 * far) - (0.07 + 0.1 * uPad + 0.35 * far) * (0.4 + strip), 0.004) * (0.25 + 0.75 * (1.0 - smoothstep(0.2, 0.75, far)));
    vec4 m = bcTint(vec2(0.14 + 0.9 * p.x / bcW, 1.23 - 1.4 * exp2(floor(sn) / 9.0)));
    c = mix(c, c * bcDark, 0.9 - 0.72 * lie);
    c = mix(c, bcPaper * mix(bcLamp, m.rgb, 0.8 * m.a), lie * (0.85 - 0.6 * bcDay) * bcCut(0.28 - strip, 18.0 * bcPix / D));
    c = bcGouge(c, p, D);
  }
  WHEN(p.y >= shore) {
    float glow = 0.0;
    WHEN(dot(r, r) < 0.1 && dot(r, r) > 1e-6) {
      float ray = abs(fract(atan(r.y, r.x) * 30.0 / TAU + 0.1 * sin(length(r) * 50.0)) - 0.5) * 2.0;
      glow = (0.085 + 0.015 * uPad + 0.05 * uCue + 0.03 * uMic) * (0.5 + 0.75 * ray * ray) * (1.0 - 0.6 * bcDay);
    }
    WHEN(uOwn[6] < 0.0) {
      vec2 k = p - vec2(0.34 * bcW, shore - 0.3 + 0.33 * bcSea);
      float l = length(k), R = 0.21 + 0.015 * uPad, ray = abs(fract(atan(k.y, k.x) * 44.0 / TAU + 0.06 * sin(l * 40.0)) - 0.5) * 2.0;
      float out_ = bcOn(l - R - (0.05 + 0.04 * uPad + 0.05 * uCue + 0.03 * uMic) * (0.35 + ray * ray));
      c = bcSky(c, p, 0.24, max(out_, bcOn(length(r) - glow)));
      c = mix(c, bcOf(bcRich(uKind[0], 0.95), 0.8), bcOn(l - R));
      c = mix(c, bcPaper, bcCut(abs(fract(p.y * 62.0 + 1.4 * bcRip(p.x * 6.0 + p.y * 21.0)) - 0.5) - 0.34 * (1.0 - smoothstep(0.0, 0.13, p.y - shore)), 62.0 * bcPix) * bcOn(l - R));
    }
    WHEN(uOwn[6] >= 0.0) c = bcSky(c, p, 0.24, bcOn(length(r) - glow));
    float bank = shore + (0.035 + 0.03 * bcRip(p.x * 8.0) + 0.016 * bcRip(p.x * 47.0)) * (1.0 - 0.93 * bcSea), d = p.y - bank;
    float tx = p.x * 7.0 + 0.3, h = hash11(floor(tx) + 2.0), tall = max((0.09 + 0.16 * h) * (1.0 - bcSea), 0.001);
    vec2 q = vec2((fract(tx) - 0.5 - 0.3 * (h - 0.5)) / 7.0, p.y - shore);
    q.x += 0.06 * (h - 0.5) * q.y / tall;
    WHEN(uOwn[6] > -0.99 && h > 0.3 && q.y < tall + 0.06) {
      d = min(d, bcSeg(q, vec2(0.0), vec2(0.0, tall), 0.007 - 0.0056 * sat(q.y / tall)));
      vec2 b = vec2(abs(q.x), q.y - 0.42 * tall - 0.015 * step(q.x, 0.0));
      for (float i = 0.0; i < 4.0; i++) d = min(d, bcSeg(b, vec2(0.0, 0.14 * tall * i), vec2(0.045 - 0.008 * i, 0.14 * tall * i + 0.055), 0.0022));
    }
    float lit = step(0.55, hash11(floor(p.x * 11.0))) * step(p.y, bank) * bcOn(bcBox(vec2((fract(p.x * 11.0) - 0.5) / 11.0, p.y - shore - 0.016), vec2(0.0065, 0.008), 0.001));
    c = mix(c, mix(bcInk, bcPaper * bcLamp, lit), bcOn(d));
    WHEN(uOwn[6] > 0.0) bcHouses(c, vec2(p.x, p.y - shore));
  }
  bcBlack(c, abs(p.y - shore) - 0.0035 - 0.004 * bcRip(p.x * 33.0));
  vec2 k = rot(-0.3) * r;
  float box = bcBox(k, vec2(0.016, 0.022), 0.006);
  float pole = min(min(bcSeg(p, foot, top, 0.0045), bcBox(p - foot, vec2(0.022, 0.006), 0.006)), min(box, bcBox(k - vec2(0.0, 0.028), vec2(0.025, 0.005), 0.003)));
  c = mix(c, bcPaper, bcOn(pole - 0.004) * step(p.y, 0.295 + bcTown));
  bcBlack(c, pole);
  c = mix(c, bcPaper * mix(bcLamp, bcTint(vec2(uLoop, 0.5)).rgb, 0.3 * uEnergy), bcOn(box + 0.005));
  WHEN(uOwn[6] < 0.0) for (int i = 0; i < 4; i++) {
    float n = float(i), H = (0.05 + 0.035 * n) * bcSea + 1e-4, x = -0.62 + 0.36 * n + 0.09 * n * n + 0.1 * sin(uTravel * 0.04 + n * 2.0 + 0.4 * sin(TAU * uLoop));
    vec2 q = (p - vec2(x * bcW, shore - 0.018 - 0.012 * n * n)) / H;
    q = rot(0.06 * sin(uTime * 0.4 + n * 2.0)) * q;
    WHEN(abs(q.x) < 0.5 && q.y > -0.3 && q.y < 1.1) bcBlack(c, bcSail(q, n < 1.5 ? 1.0 : -1.0) * H);
  }
  // the skaters, each on a round of their own
  for (int i = 0; i < 3; i++) {
    float n = float(i), a = uTravel * (0.11 + 0.017 * n) + n * 1.75 + 2.2 + 0.35 * sin(TAU * uLoop + n);
    float Ds = 0.28 + 0.16 * n + (0.04 + 0.025 * n) * sin(a), H = bcTall * Ds * 1.05 * max(1.0 - bcSea, 1e-4);
    vec2 q = (p - vec2((0.36 + 0.05 * n + (0.24 + 0.02 * n + 0.05 * uSpace + 0.07 * n * uPhrase) * cos(a)) * bcW, bcHz - Ds)) / H;
    WHEN(abs(q.x) < 0.75 && q.y > -0.12 && q.y < 1.2) {
      float way = -1.35 * sin(a) / (0.35 + abs(sin(a))), fine = bcPix / H;
      bcWho(vec2(n * 3.0 + 2.0, 77.0));
      bcPale = 0.0; bcLoad = 0.95; bcSide = -1.0;
      float d = bcSkater(q, way);
      c = mix(c, bcInk, 0.85 * bcCut(bcEgg(q - vec2(-0.16, -0.02), vec2(0.42, 0.016)), fine));
      q.x -= 0.22 * way * q.y * (1.0 - 0.3 * q.y);
      WHEN(d < 2.0 * fine) c = mix(c, bcPrint(q, d, fine, vec2(9.0), i == 1 ? 1.0 : red, 0.0), bcCut(d, fine));
    }
  }
  return c * (1.0 - crowd.a) + crowd.rgb;
}
float bcSteam(vec2 p, vec2 from, float big) {
  float d = 1e3, t = uTime * 0.05, n = floor(t);
  for (int i = 0; i < 10; i++) {
    float s = (float(i) + t - n) / 10.0, h = hash11(mod(float(i) - n, 1000.0) + 1400.0);
    vec2 c = from + vec2(-1.25 * s * bcW, 0.15 * min(s, 0.3) - 0.07 * s + 0.12 * (h - 0.5) * s);
    d = min(d, length((p - c) * vec2(0.8, 1.0)) - (0.03 + 0.14 * s * (0.55 + 0.9 * h)) * big * (1.0 - smoothstep(0.85, 1.0, s)));
  }
  return d;
}
void bcGangway(inout vec4 acc, vec2 p, float red) {
  float w = 0.42 * bcW, x = p.x + 0.06 * bcW, y = p.y + 0.035 - 0.155 * x / w, inside = max(-x, x - w * (1.0 - 2.2 * bcSea)), rail = max(abs(y - 0.042) - 0.0022, inside);
  WHEN(inside < 0.06 && abs(y - 0.06) < 0.12) {
    bcUnder(acc, bcInk, bcOn(rail));
    bcUnder(acc, bcPaper, bcOn(rail - 0.0022));
    bcRow(acc, p, red, 613.0, 0.36, vec2(0.0), true);
    bcUnder(acc, bcInk, bcOn(max(abs(y + 0.01) - 0.011, inside)));
  }
}
vec3 bcFerry(vec2 p, vec4 crowd, float red) {
  float hw = 0.89 * bcW;
  vec3 c = bcPaper;
  vec2 post = vec2(-hw + 0.07, -0.5), b = p - post;
  float neck = 0.12 + 0.03 * sat(1.0 - b.y * 4.0), ty = b.y - 0.11 + 0.9 * b.x * b.x;
  float turns = max(abs(ty) - 0.062, abs(b.x) - neck - 0.014);
  float bol = min(min(max(abs(b.x) - neck, b.y - 0.28), bcBox(b - vec2(0.0, 0.3), vec2(0.185, 0.05), 0.045)), turns);
  vec2 from = post + vec2(0.12, 0.12), e = vec2(max(-0.3 * bcW - from.x, 0.05), 0.056 - from.y);
  float rx = (p.x - from.x) / e.x, rope = (p.y - from.y - e.y * rx + 0.3 * rx * (1.0 - rx)) / length(vec2(1.0, e.y / e.x));
  rope = max(abs(rope) - 0.0065 + 0.004 * sat(rx), abs(rx - 0.5) - 0.5);
  WHEN(uOwn[6] > -0.6) bcGangway(crowd, p, red);
  float y = p.y + 0.035 * p.x;
  WHEN(uOwn[6] < 0.0) rope += 0.02 * bcSea;
  vec2 land = p;
  float pix = bcPix;
  WHEN(y < 0.0) {
    float D = max(bcHz - p.y, 0.02), bx = (p.x - bcVx) / D * 2.6 + 0.5, bi = floor(bx), shift = hash11(bi) * 5.0;
    float along = log2(D) * 3.0 + shift, Dm = exp2((floor(along) + 0.5 - shift) / 3.0);
    float seam = min((0.5 - abs(fract(bx) - 0.5)) / 2.6 * D, (0.5 - abs(fract(along) - 0.5)) * 0.23 * D);
    vec4 m = bcTint(vec2(0.5 + (bcVx + bi / 2.6 * Dm) / (2.0 * hw), 0.1 + 1.1 * (Dm - 0.35)));
    c = mix(c, c * bcDark, 0.85);
    c = mix(c, c * m.rgb, 0.4 * m.a * bcOn(0.008 * D - seam));
    c = bcGouge(mix(c, c * bcWash, 0.8 * bcOn(seam - 0.0016)), p, D);
  }
  WHEN(y >= 0.0) {
    c = bcSky(c, p, 0.19, 0.0);
    WHEN(uOwn[6] < 0.0) {
      float hz = 0.15 * bcSea;
      vec3 sea = bcGouge(bcOf(bcWash, 0.6) * mix(vec3(1.0), bcDark, 0.8), p, 0.3 + hz - y);
      float wv = abs(fract(y * 46.0 + 1.6 * bcRip(p.x * 12.0 + 0.1 * uTime + floor(y * 9.0) * 2.0)) - 0.5);
      sea = mix(sea, bcInk, bcCut(wv - 0.11 - 0.06 * bcRip(p.x * 5.0 - 0.2 * uTime), 46.0 * bcPix));
      c = mix(c, sea, bcOn(y - hz));
      bcBlack(c, abs(y - hz) - 0.002);
      float k = exp2(2.1 * bcSea);
      p = (p - vec2(0.16 * bcW * bcSea, hz * 0.9)) * k;
      y = p.y + 0.035 * p.x * (1.0 - bcSea);
      bcPix *= k;
    }
    WHEN(uOwn[6] > 0.0) { float k = exp2(-1.05 * bcTown); p = (p - vec2(0.36 * bcW, 0.0)) * k + vec2(0.36 * bcW, 0.0); y = p.y + 0.035 * p.x; bcPix *= k; }
    float st = bcSteam(p, vec2(0.42 * bcW, 0.425), 0.85 + 0.45 * uPad + 0.2 * uMic);
    vec2 fn = p - vec2(0.44 * bcW, 0.3);
    fn.x += 0.14 * fn.y;
    float fun = min(bcBox(fn, vec2(0.07, 0.115), 0.006), bcBox(fn - vec2(0.0, 0.115), vec2(0.078, 0.007), 0.004));
    float hull = y - 0.15 - 0.05 * p.x * p.x, house = bcBox(vec2(p.x - 0.25 * bcW, y - 0.18), vec2(0.5 * bcW, 0.075), 0.004);
    bcBare(c, house);
    bcBlack(c, abs(house) - 0.0028);
    vec3 pane = mix(bcInk, bcPaper * bcLamp, bcNight * step(0.35, hash11(floor(p.x * 14.0))));
    c = mix(c, pane, step(house, -0.01) * bcCut(bcBox(vec2(fract(p.x * 14.0) - 0.5, (y - 0.216) * 14.0), vec2(0.26), 0.05), 14.0 * bcPix));
    bcBare(c, st);
    bcBlack(c, abs(st) - 0.0022 - 0.003 * bcRip(p.x * 24.0 + p.y * 13.0));
    vec3 stack = mix(mix(bcInk, bcPaper, bcOn(abs(fn.x - 0.045) - 0.0035)), bcOf(bcRich(uKind[0], 0.9), 0.75), bcOn(abs(fn.y - 0.045) - 0.024));
    c = mix(c, stack, bcOn(max(fun, -house)));
    float end_ = -1.0;
    WHEN(uOwn[6] < 0.0) end_ = abs(p.x - 0.1 * bcW) - (0.85 + 0.5 * y) * bcW - 3.0 * (1.0 - bcSea);
    WHEN(uOwn[6] < 0.0) hull = max(hull, end_);
    WHEN(hull > 0.0 && hull < 0.08 && end_ < 0.0) {
      float h = hash11(floor(p.x * 30.0) + 3.0), hb = fract(h * 23.0);
      vec2 k = vec2((fract(p.x * 30.0) - 0.5 + 0.2 * (hb - 0.5)) / 30.0, hull - 0.016 - 0.014 * fract(h * 9.0));
      float who = min(min(bcEgg(k, vec2(0.012, 0.027)), length(k - vec2(0.0, 0.028)) - 0.008), bcBox(k - vec2(0.0, 0.037), vec2(0.012 - 0.004 * hb, 0.002 + 0.006 * hb), 0.002));
      bcBlack(c, who + step(h, 0.45));
      float rail = min(min(abs(hull - 0.04), abs(hull - 0.02)) - 0.0014, abs(fract(p.x * 22.0) - 0.5) / 22.0 - 0.0016);
      bcBlack(c, max(rail, hull - 0.0414));
    }
    WHEN(uOwn[6] < 0.0) hull = max(hull, -y);
    bcBare(c, hull);
    WHEN(uOwn[6] > 0.0) bcBlack(c, max(hull, y - 0.118 * bcTown));
    bcBlack(c, min(abs(hull) - 0.004, abs(hull + 0.028) - 0.0016));
    float hole = length(vec2(fract(p.x * 9.0) - 0.5, (y - 0.088) * 9.0));
    WHEN(uOwn[6] > 0.0) {
      float ly = floor(y / 0.036), lx = p.x * 18.0 + 0.5 * ly;
      c = mix(c, bcOf(bcLamp, bcNight), bcCut(length(vec2(fract(lx) - 0.5, (fract(y / 0.036) - 0.5) * 0.65)) - 0.085 * bcTown, 18.0 * bcPix) * bcOn(max(y - 0.107, 0.03 - y)) * step(0.3, bcTown) * step(0.25, hash11(floor(lx) + 9.0 * ly)));
      hole += bcTown;
    }
    WHEN(end_ < 0.0) c = mix(c, pane, bcCut(hole - 0.12, 9.0 * bcPix));
    WHEN(uOwn[6] > 0.0) p = land;
    float door = bcBox(p - vec2(0.36 * bcW + 0.012, 0.17), vec2(0.028, 0.066), 0.02);
    WHEN(uOwn[6] > 0.0) bcBare(c, door - 0.006);
    bcBlack(c, door);
    float sh = abs(fract(y * 110.0 + 0.7 * bcRip(p.x * 14.0)) - 0.5) - 0.6 * (1.0 - smoothstep(0.02, 0.075, y));
    c = mix(c, c * mix(bcWash, bcWash * 0.5, bcNight), bcCut(sh, 110.0 * bcPix) * step(y, 0.07) * step(end_, 0.0) * step(uOwn[6], 0.0) * (uOwn[6] < 0.0 ? step(0.0, y) : 1.0));
    WHEN(uOwn[6] >= 0.0) bcBlack(c, y - 0.02 - 0.006 * bcRip(p.x * 33.0));
    WHEN(uOwn[6] < 0.0) { bcBlack(c, max(max(y - 0.05, end_), -y)); }
    p = land; y = p.y + 0.035 * p.x; bcPix = pix;
  }
  bcBlack(c, abs(y - 0.009) - 0.012);
  bcBlack(c, bcEgg(p - from - e, vec2(0.016, 0.011)) + 0.1 * bcSea);
  bcBlack(c, rope);
  c = c * (1.0 - crowd.a) + crowd.rgb;
  float w = bcOn(abs(length((b - vec2(0.0, 0.29)) * vec2(0.27, 1.0)) - 0.044) - 0.004 * smoothstep(0.0, 0.16, b.x)) * step(0.3, b.y);
  w = mix(w, bcCut(0.1 - abs(fract(b.x * 22.0 + ty * 34.0) - 0.5), 0.05), bcOn(turns + 0.004));
  return mix(c, mix(bcInk, bcPaper, w), bcOn(bol));
}
vec3 render(vec2 p) {
  float zoom = exp2(0.5 * uOwn[4]);
  bcPix = zoom / uRes.y;
  bcW = clamp(uRes.x / uRes.y / 1.78, 0.42, 1.25);
  bcTall = 0.32 * exp2(-0.12 * uOwn[4]); bcVx = -0.05 * bcW; bcFrom = mix(0.19, 0.38, uVar); bcNight = sat(uOwn[0]); bcDay = sat(-uOwn[0]);
  vec2 eye = vec2(-0.05 * bcW, 0.1), page = p;
  p = (p - eye) * zoom + eye;
  p += 0.0008 * (sin(p.yx * 71.0 + 2.0 * sin(p * 43.0)) + sin(p.yx * 133.0 + p * 29.0));
  float t = 1.0 - uHits;
  bcGap = uVar < 0.5 ? vec3(mix(-0.7, -0.05, t) * bcW, mix(0.0, -0.25, t), uHits) : vec3(mix(0.0, 0.4, t) * bcW, mix(-0.1, -0.4, t), uHits);
  bcPaper = mix(vec3(0.935, 0.885, 0.78), uOwn[5] < 0.0 ? vec3(0.93, 0.79, 0.7) : vec3(0.8, 0.85, 0.8), abs(uOwn[5]));
  bcWash = mix(vec3(0.47, 0.58, 0.6), uOwn[5] < 0.0 ? vec3(0.8, 0.36, 0.24) : vec3(0.86, 0.68, 0.22), abs(uOwn[5]));
  bcWash = mix(bcWash, bcRich(uKind[1], 0.6), 0.18);
  bcDark = mix(vec3(1.0), mix(bcWash, vec3(0.2, 0.25, 0.36), 0.4), bcNight);
  float grain = 1.3 * bcRip(p.y * 400.0 + 5.0 * sin(p.x * 4.0)) * bcRip(p.x * 11.0 + p.y * 57.0);
  bcInk = vec3(0.075, 0.065, 0.065) + 0.05 * smoothstep(0.62, 0.9, grain);
  bcPaper *= 0.985 + 0.02 * grain;
  float rain = sat(uOwn[3]), fog = sat(-uOwn[3]), red = sat(uKeys * 1.5);
  vec4 crowd = bcCrowd(p, red);
  vec3 c = crowd.rgb;
  WHEN(uVar < 0.5 && crowd.a < 0.99) c = bcPond(p, crowd, red);
  WHEN(uVar > 0.5) c = bcFerry(p, crowd, red);
  // fog, line by line
  WHEN(fog > 0.0) {
    float y = p.y * 80.0 + 1.4 * bcRip(p.x * 7.0 + p.y * 9.0), gone = fog * mix(0.1, 1.0, (1.0 - smoothstep(0.25, 0.75, bcHz - p.y + 0.06 * sin(p.x * 4.0 + 0.1 * uTime))));
    c = mix(c, bcPaper, bcCut(abs(fract(y) - 0.5) - 0.5 * gone, 80.0 * bcPix) * smoothstep(0.02, 0.1, gone));
  }
  WHEN(rain > 0.0) {
    c *= mix(vec3(1.0), bcWash + 0.15, 0.8 * rain);
    c = mix(c, bcPaper, bcDash(vec2(dot(page, vec2(0.3, 1.0)) * 4.0 + mod(uTime * 0.8, 512.0), dot(page, vec2(1.0, -0.3)) * 46.0), 0.5 * rain, 46.0 / uRes.y));
  }
  return c;
}
