// name: Endless shelves
// a: Down the shaft
// b: Ladder row
// what: Leaning over a worn rail and a pile of old books, we look down a five-sided well of shelves and small round lamps that pales to a milky glow; on a landing below somebody's lamp walks, and a leaf of paper falls. Or, from floor height, a long aisle of books with a ladder across a far pin of daylight, one wall nearly bare.
// follows: The piece lights the spines where it sounds and stains them: across is the loop, down or along the room. Drone is the glow or the daylight, pad the lamps, texture dust and scuffed leather, phrase moves the far lamp or the ladder; each kind has a binding. Bands light lamps, keys the gilt, a hit drops a sheet, a cue lights all lamps in turn.
// own: 0 a blue moonlit night at -1, pale painted shelves by day at 1; 1 all but empty shelves at -1, every book in pale vellum at 1; 2 low storeys or small rows at -1, tall storeys or great folios at 1; 3 a narrow well or aisle at -1, a wide one at 1; 4 clear air over a dark foot, the far door dark, at -1, milky mist at 1; 5 looking more plumb down, or lower, at -1, looking across, or down from a height, at 1; 6 rolled scrolls in stacks at -1, glass jars with light in them at 1, in place of books; 7 still water below that doubles it all at -1, leaves grown over everything in the colour of texture at 1 (6 and 7 also dye the light as drone, the wood as pad, the lamps as phrase)
float esOff(float lo, float hi, float x) { return 1. - smoothstep(lo, hi, x); }
#define esNight max(-uOwn[0], 0.)
#define esDay max(uOwn[0], 0.)
#define esBare (0.8 * max(-uOwn[1], 0.))
#define esPale max(uOwn[1], 0.)
#define esClear max(-uOwn[4], 0.)
#define esMilk max(uOwn[4], 0.)
#define ES_JAR max(uOwn[6], 0.)
#define ES_ROLL max(-uOwn[6], 0.)
#define ES_WET max(-uOwn[7], 0.)
#define ES_LEAF max(uOwn[7], 0.)
#define ES_DYE max(abs(uOwn[6]), abs(uOwn[7]))
float esPx; bool esWet;   // a pixel; seen in the water
float esNx, esUp, esOcc, esPull; vec3 esSelf, esTone; // of a shelf: its faces, how open, its own light, what sounds there
vec3 esWood, esLamp, esAmb, esGlow;
float esKind(int k) { return k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : k == 3 ? uPhrase : uHits; }
float esIn(float d, float w) { return sat(0.5 - d / max(w, 1e-5)); }
float esWave(float x) { x = abs(fract(x) - 0.5) * 4.0 - 1.0; return x * (1.5 - 0.5 * x * x); }
// An own number as a size.
float esOwn(float v, float low, float high) { return 1.0 + (v < 0.0 ? low : high) * v; }
// A colour as a dye in old leather: deep, never pastel.
vec3 esDye(vec3 c) { c /= max(max(c.r, max(c.g, c.b)), 0.05); return c * c * c; }
// Hide, linen, green, oxblood, slate: one binding to a kind.
vec3 esBinding(int k, float age) {
 vec3 c = k == 0 ? vec3(0.20, 0.095, 0.04) : k == 1 ? vec3(0.46, 0.36, 0.22) : k == 2 ? vec3(0.115, 0.15, 0.075) : k == 3 ? vec3(0.24, 0.05, 0.035) : vec3(0.09, 0.11, 0.14);
 c = mix(c, esDye(uKind[k]) * (0.03 + 0.8 * dot(c, vec3(0.333))), 0.2 + 0.3 * esKind(k));
 c = mix(c, uKind[k] * uKind[k] * (0.45 + 0.4 * esKind(k)), 0.7 * ES_DYE);
 return c * (0.55 + 0.9 * age);
}
float esEdge(float i, float row) { return i + 0.6 * (hash21(vec2(i, row)) - 0.5); }
void esHear(vec2 at) { vec4 c = piece(at); esPull = sat(c.a * 1.3); esTone = esDye(c.rgb); }
// Leaf by leaf.
float esFine(vec2 q) {
 q.x += 0.5 * mod(floor(q.y), 2.0);
 vec2 i = floor(q), h = hash22(i), e = rot(h.x * 6.3) * (q - i - 0.3 - 0.4 * h.yx) * vec2(1.0, 1.7);
 return mix(0.12, 0.5 + 0.5 * h.y, esOff(0.3, 0.5, length(e) + 0.1 * e.y)) * (1.0 - 0.35 * esOff(0.0, 0.12, abs(e.y)));
}
// A shelf. q: along and up; s: how the ray goes along and up for each metre inward; fw: a pixel;
// rh: a row's height; bl: a bay's length; w: a book's width; bare: how empty.
vec3 esShelf(vec2 q, vec2 s, vec2 fw, float rh, float bl, float w, float bare, float seed) {
 w *= 1.0 + 0.8 * abs(uOwn[6]);
 float row = floor(q.y / rh), bay = floor(q.x / bl);
 float y = q.y - row * rh, x = q.x - bay * bl, bd = 0.035 + 0.03 * rh, up = 0.07, id0 = row * 17.0 + seed;
 esNx = 0.0; esUp = 0.0; esOcc = 1.0; esSelf = vec3(0.0);
 float front = max(esIn(y - bd, fw.y), max(esIn(x - up * 0.5, fw.x), esIn(bl - up * 0.5 - x, fw.x)));
 float rec = mix(0.09 - 0.03 * esPull, 0.2, smoothstep(0.1, 0.6, bare));
 // to the back, a board or an upright
 float dB = s.y > 0.0 ? (rh - y) / s.y : s.y < 0.0 ? (y - bd) / -s.y : 1e3;
 float dU = s.x > 0.0 ? (bl - up * 0.5 - x) / s.x : s.x < 0.0 ? (x - up * 0.5) / -s.x : 1e3;
 vec3 wood = esWood * (0.8 + 0.35 * noise(q * vec2(3.0, 23.0) + seed)), c;
 if (rec <= min(dB, dU)) {
  vec2 b = vec2(x, y) + s * rec;
  float gx = b.x + bay * bl, h = rh - bd, yy = b.y - bd;
  float lean = 0.45 * smoothstep(0.2, 0.5, bare) * (hash21(vec2(bay, id0)) - 0.25);
  float u = (gx - lean * yy) / w, i = floor(u);
  float b0 = esEdge(i, id0), b1 = esEdge(i + 1.0, id0), L = b0, R = b1, n = i;
  if (u < b0) { n = i - 1.0; R = b0; L = esEdge(n, id0); }
  else if (u > b1) { n = i + 1.0; L = b1; R = esEdge(i + 2.0, id0); }
  vec2 r = hash22(vec2(n * 1.7, id0 + 3.0));
  float r2 = fract(r.x * 57.3 + r.y * 13.1), group = hash21(vec2(floor(n / 7.0), id0 + 9.0)), there = smoothstep(0.0, 0.12, group * 0.9 + 0.2 * r2 - bare - 0.02);
  float tall = h * (0.60 + 0.12 * group + 0.24 * r.x) * there;
  float lod = smoothstep(0.3, 0.8, fw.x / w), nx = clamp(2.0 * (u - L) / max(R - L, 0.05) - 1.0, -1.0, 1.0);
  float gap = esIn(abs(nx) - 0.93, 2.0 * fw.x / w / max(R - L, 0.05)) * (1.0 - lod) + lod;
  float jr = 0.0, jy = 0.0, jm = 1.0;
  if (uOwn[6] < 0.0) {
   // rolled scrolls, end on, in stacks
   float dia = max((R - L) * w, 0.02), yr = yy / dia;
   tall = mix(tall, floor(tall / dia + 0.45) * dia, ES_ROLL);
   jy = 2.0 * fract(yr) - 1.0; jr = length(vec2(nx, jy));
   jm = mix(1.0, esIn(jr - 0.97, 3.0 * fw.x / dia), ES_ROLL * (1.0 - lod));
  }
  if (uOwn[6] > 0.0) {
   // jars: a round shoulder, a neck, a lid
   tall = mix(tall, h * (0.52 + 0.3 * r.x) * there, ES_JAR); jy = yy / max(tall, 0.02);
   float wd = jy > 0.9 ? 0.66 : jy > 0.8 ? 0.5 : 0.5 + 0.4 * sqrt(sat(1.0 - pow(max(jy - 0.55, 0.0) * 4.0, 2.0)));
   jr = abs(nx) / wd;
   jm = mix(1.0, esIn(abs(nx) - wd, 2.0 * fw.x / w / max(R - L, 0.05)), ES_JAR * (1.0 - lod));
  }
  float isBook = esIn(yy - tall, fw.y) * jm;
  int k = int(fract(r.y * 91.7 + r.x * 5.3) * 4.99);
  vec3 cover = mix(esBinding(k, r.y), esBinding(int(mod(row + bay, 3.0)), 0.5), lod * 0.6);
  float ry = (fract(yy / max(tall, 0.05) * 4.0 + 0.2) - 0.5) * tall * 0.25, some = step(0.35, r2) * (1.0 - lod);
  float rib = esIn(abs(ry) - 0.007, fw.y) * some;
  cover = mix(cover, vec3(0.50, 0.43, 0.32) * (0.7 + 0.4 * r.x), 0.92 * esPale);
  cover *= 1.0 + 0.25 * rib - 0.3 * esIn(abs(ry + 0.014) - 0.007, fw.y) * some;
  cover *= 1.0 - (0.24 + 0.25 * uTexture) * smoothstep(0.4, 0.95, noise(vec2(gx * 9.0, yy * 0.6) / w + seed)) * (1.0 - lod);
  cover *= 0.8 + 0.4 * smoothstep(0.0, 0.03, tall - yy);
  cover *= mix(sqrt(1.0 - 0.88 * nx * nx) * 1.15, 0.85, lod);
  cover = mix(cover, dot(cover, vec3(0.55)) * esTone * vec3(0.8, 0.6, 0.4), 0.5 * esPull);
  if (uOwn[6] < 0.0) {
   float an = fract(atan(jy, nx + 1e-4) / TAU);
   vec3 pap = mix(vec3(0.62, 0.52, 0.36), uKind[k] * uKind[k], 0.45) * (0.7 + 0.4 * r.x) * (0.62 + 0.38 * cos((jr * 3.5 - an) * TAU)) * (1.0 - 0.7 * esIn(jr - 0.14, 0.1)) * (1.15 - 0.5 * jr * jr);
   cover = mix(cover, mix(pap, vec3(0.42, 0.35, 0.25) * uKind[k], lod), ES_ROLL * (1.0 - 0.4 * esPull));
  }
  vec3 jarLit = vec3(0.0);
  if (uOwn[6] > 0.0) {
   float lid = step(0.9, jy), fill = esIn(jy - 0.35 - 0.4 * r2, 0.03), nj = min(jr, 1.0);
   vec3 dye = uKind[k] * uKind[k];
   vec3 gl = mix(vec3(0.16, 0.17, 0.17), dye * (0.5 + 0.35 * (1.0 - nj * nj)), fill) * (1.0 - lid) + lid * esWood * 0.8;
   gl += vec3(0.5) * esIn(abs(nj * sign(nx) + 0.55) - 0.07, 0.1) * step(0.12, jy) * esIn(jy - 0.6, 0.1) * (1.0 - lod);
   cover = mix(cover, gl, ES_JAR);
   jarLit = ES_JAR * dye * fill * (1.0 - lid) * (1.1 - 0.75 * nj * nj) * (0.16 + 0.45 * step(0.72, r.x) + 1.2 * (0.3 + uEnergy) * esKind(k) + 0.8 * esPull) * mix(1.0, 0.45, lod);
  }
  c = mix(wood * 0.55, cover, isBook);
  esOcc = mix(0.75 - 0.5 * sat(yy / h), (0.45 + 0.55 * smoothstep(0.0, 0.35, yy / h)) * (0.25 + 0.75 * gap), isBook);
  esOcc *= 1.0 - 0.55 * smoothstep(0.45, 1.0, yy / h) * (1.0 - esPull);
  esNx = nx * isBook * (1.0 - lod);
  esSelf = isBook * (c * esOcc * (esPull * (0.4 + 0.9 * uEnergy) * vec3(1.0, 0.82, 0.6) + 0.06 * esDye(uKind[k]) * esKind(k)) + vec3(0.45, 0.34, 0.14) * (rib + 0.12 * lod) * uKeys);
  if (uOwn[6] > 0.0) esSelf += isBook * jarLit;
  if (uOwn[6] != 0.0) esNx *= 1.0 - 0.7 * abs(uOwn[6]);
 } else if (dB < dU) {
  c = wood * 0.8; esUp = s.y > 0.0 ? -1.0 : 1.0; esOcc = s.y > 0.0 ? 0.22 : 0.75 - 1.5 * max(dB, 0.0);
 } else { c = wood * 0.9; esOcc = 0.9; esNx = -sign(s.x); }
 if (front > 0.0) {
  c = mix(c, wood * 1.25, front); esOcc = mix(esOcc, 0.9, front);
  esNx *= 1.0 - front; esUp *= 1.0 - front; esSelf *= 1.0 - front;
 }
 if (uOwn[7] > 0.0) {
  // leaves hanging from every board
  float big = noise(q * vec2(0.9, 0.6) + seed), drop = 1.0 - sat(y / rh), g = noise(q * vec2(7.0, 4.5) + seed), fine = max(esFine(q * 17.0), 0.85 * esFine(rot(0.6) * q * 23.0)); fine = mix(fine, 0.55, 0.8 * smoothstep(0.3, 0.9, fw.x * 19.0));
  float lv = smoothstep(0.52, 0.66, 0.5 * g + 0.55 * big + 0.55 * (big - 0.55) + 0.28 * (1.0 - drop) + 0.22 * front + 0.16 * (fine - 0.5) - 0.2 + 0.18 * ES_LEAF) * ES_LEAF;
  vec3 leaf = mix(vec3(0.05, 0.09, 0.03), uKind[2] * uKind[2], 0.75) * (0.35 + 1.1 * fine) * (0.7 + 0.5 * g);
  c = mix(c, leaf, lv); esOcc = mix(esOcc, 0.45 + 0.6 * fine, lv); esSelf *= 1.0 - lv; esNx *= 1.0 - lv;
 }
 return c;
}
// A sheet of paper turning as it falls.
void esSheet(inout vec3 col, vec2 p, vec2 at, float size, float turn, float flip, float there, float light) {
 vec2 q = rot(turn) * (p - at) / size;
 float w = max(abs(cos(flip)), 0.12);
 q.y += 0.18 * q.x * q.x * sin(flip);
 vec2 e = abs(q) - vec2(0.36, 0.5 * w);
 vec3 paper = mix(vec3(0.40, 0.345, 0.26), vec3(0.30, 0.34, 0.42), esNight) * (1.0 + esDay) + 0.12 * uKind[4] * uHits;
 col = mix(col, paper * light * (0.45 + 0.55 * abs(sin(flip + 0.6)) + 0.25 * q.x), esIn(max(e.x, e.y), 1.5 * esPx / size) * there);
}
// How bright a bay's lamp is: two are awake, a cue lights all by floors.
float esOn(float bay, float k) {
 float h = hash11(bay * 7.0 - k * 3.0 + 1.0), on = 0.10 + 0.42 * (1.0 - min(mod(bay + k * 2.0 + 60.0, 5.0), 1.0));
 on += (0.25 + 0.75 * h) * 1.3 * uPad * (0.6 + uEnergy) + 0.4 * uBands[int(mod(bay - 5.0 * k + 160.0, 16.0))] * (0.5 + uEnergy);
 if (bay < 0.5 && k == -2.0) on += 1.1;
 if (bay == 1.0 && k == -1.0) on += 1.3;
 float wv = (1.0 - uCue) * 13.0 + k + 1.0;
 on += uCue * (3.0 * exp(-wv * wv * 0.35) + 0.4 * smoothstep(-0.5, 0.5, wv));
 return on * (1.0 - 0.7 * esDay);
}
// A round lamp. m: metres to a frame's height there.
void esGlobe(inout vec3 col, vec2 c, float m, float size, vec3 light, float keep) {
 if (m < 0.5) return;
 float r = length(c) * m;
 col = mix(col, (esLamp * 0.12 + light * 2.3) * (1.35 - 0.75 * sat(r * r / (size * size))), esIn(r - size, esPx * m * 1.4) * keep);
 col += light * keep * size * size * 2.4 / (0.03 + r * r) * esOff(0.2, 1.5, r);
}
void esLay(inout vec3 col, vec3 c, float a, float mist, vec3 glow, inout float fog) { col = mix(col, mix(c, glow, mist), a); fog *= 1.0 - a; }
// Five uneven sides: the way each faces, how far.
const vec3 esSide[5] = vec3[5](vec3(0.1219, 0.9925, 4.7), vec3(-0.8480, 0.5299, 4.0), vec3(-0.7660, -0.6428, 3.5), vec3(0.4695, -0.8829, 3.7), vec3(0.9816, 0.1908, 4.0));
// Where the lamp of a bay stands.
vec3 esAt(int i, float k, float H, float open) {
 vec2 n = esSide[i].xy, q = n * (esSide[i].z * open - 0.12) + vec2(-n.y, n.x) * 0.35 * (hash11(float(i) * 7.0 - k * 3.0 + 2.0) - 0.5);
 return vec3(q.x, k * H + 1.3, q.y);
}
const vec2 esTop = vec2(0.09, -0.2);    // where straight down is in the frame
vec3 esShaft(vec2 p) {
 float H = 3.0 * esOwn(uOwn[2], 0.36, 0.7), open = esOwn(uOwn[3], 0.34, 0.8), sl = 0.34;
 vec3 o = vec3(-0.75 * open, 1.75 - 0.5 * esWave(uTravel * 0.012), -1.9 * open);
 float pitch = 2.19 - esOwn(uOwn[5], 0.3, 0.55), f = 0.56 + 0.05 * (0.5 - uSpace);
 vec2 s0 = rot(0.05 + 0.03 * esWave(uTime * 0.009)) * (p - vec2(0.09, 0.0));
 vec3 fwd = vec3(0.0, -sin(pitch), cos(pitch)), upv = vec3(0.0, cos(pitch), sin(pitch));
 vec3 d = normalize(fwd * f + vec3(s0.x, 0.0, 0.0) + upv * s0.y);
 if (abs(d.y) < 1e-3) d.y = -1e-3;
 float yW = -2.75 * H + 0.4;
 if (uOwn[7] < 0.0 && d.y < 0.0) {
  // the water far down
  float tW = (yW - o.y) / d.y, in_ = 1e3; vec3 q = o + d * tW;
  for (int i = 0; i < 5; i++) in_ = min(in_, esSide[i].z * open - dot(esSide[i].xy, q.xz));
  if (in_ > 0.0) {
   esWet = true;
   d.xz += 0.035 * (vec2(noise(q.xz * 1.6 + uTime * 0.13), noise(q.xz * 1.6 + 9.0 - uTime * 0.11)) + 0.5 * vec2(noise(q.xz * 4.3 - uTime * 0.2), noise(q.zx * 4.3 + uTime * 0.17)) - 0.75) * ES_WET;
   d.y = -d.y; o = q - d * tW; fwd.y = -fwd.y; upv.y = -upv.y;
  }
 }
 // where the ray leaves the well, and the shelves behind
 float tw = 1e4, tb = 1e4; int wi = 0, bi = 0;
 for (int i = 0; i < 5; i++) {
  float dn = dot(esSide[i].xy, d.xz);
  if (dn > 1e-5) {
   float a = (esSide[i].z * open - dot(esSide[i].xy, o.xz)) / dn, b = a + 1.5 / dn;
   if (a < tw) { tw = a; wi = i; }
   if (b < tb) { tb = b; bi = i; }
  }
 }
 vec3 P = o + d * tw, hit;
 float pxm = esPx / f, k = floor(P.y / H), v = P.y - k * H;
 vec3 nrm = esSide[wi]; vec2 tan2 = vec2(-nrm.y, nrm.x);
 float u = dot(P.xz, tan2), dn = max(dot(nrm.xy, d.xz), 0.02);
 vec2 fw = vec2(1.0, 1.0 / dn) * pxm * tw;
 float slack = 1e3;
 for (int i = 0; i < 5; i++) if (i != wi) slack = min(slack, esSide[i].z * open - dot(esSide[i].xy, P.xz));
 float bay = float(wi), seedB = bay * 7.0 - k * 3.0, lampOn = esOn(bay, k);
 vec3 lampAt = esAt(wi, k, H, open), alb, self = vec3(0.0);
 float tf = d.y < 0.0 ? (k * H - o.y) / d.y : ((k + 1.0) * H - sl - o.y) / d.y;
 float lu = dot(lampAt.xz, tan2), occ, facing = 1.0, along = 0.0;
 esHear(vec2(atan(P.x, -P.z) / TAU + 0.5, sat((3.5 - P.y) / (5.0 * H))));
 if (tf < tb) {
  hit = o + d * tf;
  alb = esWood * (0.75 + 0.3 * hash11(floor(dot(hit.xz, tan2) * 5.0) + seedB));
  occ = 0.35 + 0.65 * smoothstep(0.0, 0.6, (tb - tf) * dn);
  facing = d.y < 0.0 ? 1.0 : 0.4;
 } else {
  hit = o + d * tb;
  vec3 nb = esSide[bi]; vec2 tb2 = vec2(-nb.y, nb.x);
  float bn = max(dot(nb.xy, d.xz), 0.05), rh = (H - sl) * 0.2;
  alb = esShelf(vec2(dot(hit.xz, tb2) + 50.0, hit.y - k * H), vec2(dot(d.xz, tb2), d.y) / bn, pxm * tb / vec2(1.0, max(bn, 0.3)), rh, 1.6, 0.2 * rh, 0.05 + esBare, seedB * 3.0 + float(bi));
  occ = esOcc; along = esNx; self = esSelf;
 }
 vec3 toL = lampAt - hit; float l2 = dot(toL, toL);
 vec3 lit = esAmb * (0.5 + 0.5 * occ) + esLamp * lampOn * 3.6 / (0.45 + l2) * occ * facing * sat(0.7 + 0.7 * along * dot(toL.xz, tan2) / sqrt(l2 + 0.01));
 vec3 col = alb * lit + self;
 float prof = abs(fract(u / 0.17) - 0.5) * 0.17 - 0.018 - 0.016 * esWave(v * 1.2 + 0.2);
 float post = mix(esIn(prof, fw.x), 0.26, smoothstep(0.06, 0.14, fw.x)) * esIn(v - 1.02, fw.y), hand = esIn(abs(v - 1.02) - 0.055, fw.y);
 float rail = max(max(post, hand), max(esIn(v - 0.10, fw.y), esIn(slack - 0.13, fw.x))), off = (u - lu) * (u - lu);
 col = mix(col, esWood * 1.1 * (esAmb * (0.8 + 1.2 * hand) + esLamp * lampOn * 0.3 * (0.35 + 0.65 * hand) / (0.12 + off + (v - 1.3) * (v - 1.3))), rail);
 if (v > H - sl) {
  col = esWood * (0.6 + 0.6 * esOff(0.1, sl, H - v)) * (esAmb * 1.2 + esLamp * lampOn * 0.16 / (0.3 + off));
 }
 if (uOwn[7] > 0.0) {
  // leaves over the rails
  float g = noise(vec2(u * 2.3 + seedB, v * 0.7)), fine = max(esFine(vec2(u, v) * 13.0), 0.85 * esFine(rot(0.6) * vec2(u, v) * 17.0)), lv = ES_LEAF * smoothstep(0.5, 0.62, 0.62 * g + 0.3 * noise(vec2(u * 0.7 + seedB * 3.0, k)) + 0.25 * fine - 0.1) * step(v, 1.15 + 0.3 * g);
  lv = max(lv, ES_LEAF * smoothstep(0.35, 0.5, g - 1.1 * max(H - sl - v, 0.0) + 0.2 * fine));
  vec3 leaf = mix(vec3(0.05, 0.09, 0.03), uKind[2] * uKind[2], 0.75) * (0.35 + 1.1 * fine) * (0.7 + 0.5 * g);
  col = mix(col, leaf * (esAmb * 1.2 + esLamp * lampOn * 0.4 / (0.25 + off + (v - 1.3) * (v - 1.3))), lv);
 }
 float dep = max(esWet ? (P.y - yW) * 0.6 + 2.2 * H : o.y - P.y, 0.0) / H, far = 6.4 * (1.0 - 0.3 * uDrone) * (1.0 + 0.9 * esClear - 0.62 * esMilk) * (0.8 + 0.4 * uSpace);
 dep = mix(dep, min(4.3 * open * -d.y / (length(d.xz) + 1e-3) / H, 60.0), d.y < 0.0 ? 0.45 : 0.0);
 float x = max(dep - 1.2, 0.0) / far, fog = 1.0 - exp(-esMilk * 0.5 * x) / (1.0 + x * x * (1.0 + 0.2 * esWave(dep * 0.11 - uTime * 0.013)));
 vec3 glow = esGlow * (0.8 + 0.5 * uDrone * (0.4 + uEnergy) + 0.15 * uMic) * (1.0 - 0.93 * esClear);
 vec3 core = glow; glow *= mix(vec3(0.13, 0.095, 0.07) * (1.0 + 4.0 * esMilk + 5.0 * esDay), vec3(1.0), x * x / (1.6 + x * x));
 col += esWood * core * 0.6 * smoothstep(0.1, 1.4, x) * occ;
 // a landing two floors down, and the lamp that walks there
 vec3 nl = esSide[4]; vec2 tl = vec2(-nl.y, nl.x);
 float yL = -2.0 * H, eo = nl.z * open - dot(nl.xy, o.xz), ed = -dot(nl.xy, d.xz);
 float walk = clamp(0.75 * esWave(uTime * 0.011 + 0.1) + 0.9 * (uPhrase - 0.3), -1.05, 1.05);
 vec3 fl = vec3(nl.xy * (nl.z * open - 1.05) + tl * walk, yL + 0.7).xzy;
 vec3 fCol = mix(esLamp, uKind[3] * 1.2, 0.35 * uPhrase) * (1.3 + 1.6 * uPhrase + 0.8 * uMic);
 float tl0 = (yL - o.y) / d.y, tE = abs(ed) > 1e-4 ? (1.9 - eo) / ed : -1.0;
 float xl = max((o.y - yL) / H - 1.2, 0.0) / far, fogL = 1.0 - exp(-esMilk * 0.5 * xl) / (1.0 + xl * xl);
 vec3 wood = esWood * (esAmb + fCol * 0.3);
 if (d.y < 0.0) {
  // its boards, with the shadow of who carries the lamp
  vec3 q = o + d * tl0, lq = fl - q; float e = eo + ed * tl0, uu = dot(q.xz, tl), fp = pxm * tl0, v2 = e - 1.05, u2 = uu - walk, sv = (v2 + 0.35 * u2) / 0.16;
  vec3 lc = esWood * (0.8 + 0.3 * hash11(floor(e * 6.0))) * (esAmb + fCol * 0.9 / (0.35 + dot(lq, lq)) * (1.0 - 0.85 * exp(-sv * sv) * smoothstep(0.05, 0.25, -u2)));
  esLay(col, lc, esIn(e - 1.9, fp) * esIn(abs(uu) - 1.35, fp) * step(-0.2, e), fogL, glow, fog);
 }
 if (tE > 0.0) {
  vec3 q = o + d * tE; float uu = dot(q.xz, tl), vv = q.y - yL, fp = pxm * tE, fv = fp / max(abs(ed), 0.1);
  float bars = esIn(abs(fract(uu * 5.0) - 0.5) * 0.2 - 0.02, fp) * step(0.0, vv) * esIn(vv - 1.0, fv);
  esLay(col, wood, esIn(abs(uu) - 1.35, fp) * max(bars, esIn(abs(vv + 0.12) - 0.15, fv)), fogL, glow, fog);
 }
 tl0 = (yL + 1.0 - o.y) / d.y;
 if (d.y < 0.0) {
  vec3 q = o + d * tl0; float e = eo + ed * tl0, uu = abs(dot(q.xz, tl)) - 1.35, fp = pxm * tl0;
  esLay(col, wood * 1.5, max(esIn(abs(e - 1.9) - 0.05, fp) * esIn(uu, fp), esIn(abs(uu) - 0.05, fp) * esIn(e - 1.9, fp) * step(0.0, e)), fogL, glow, fog);
 }
 if (uOwn[7] < 0.0 && esWet) fog *= 1.0 - 0.55 * ES_WET;
 col = mix(col, glow, fog);
 for (int j = -1; j < 2; j++) {
  float kk = k + float(j); vec3 L = esAt(wi, kk, H, open);
  float xd = max((o.y - L.y) / H - 1.2, 0.0) / far, keep = exp(-xd * xd) * (esWet ? 0.75 : 1.0);
  L -= o; float m = dot(L, fwd) / f;
  esGlobe(col, s0 - vec2(L.x, dot(L, upv)) / max(m, 0.01), m, 0.12, esLamp * esOn(bay, kk), keep);
 }
 fl -= o; float m = dot(fl, fwd) / f;
 esGlobe(col, s0 - vec2(fl.x, dot(fl, upv)) / max(m, 0.01), m, 0.10, fCol, 1.0 - fogL);
 if (uOwn[7] < 0.0 && esWet) col = col * mix(vec3(0.66), uKind[0] * 0.9, 0.35) + esGlow * 0.012;
 return col;
}
vec3 esNear(vec3 col, vec2 p) {
 float age = fract(uTime / 46.0 + 0.16), z = 1.6 + 15.0 * age, life = smoothstep(0.0, 0.04, age) * (1.0 - smoothstep(0.75, 1.0, age));
 vec2 at = esTop + vec2(0.68 + 0.1 * esWave(uTime * 0.06), 0.6) / z;
 esSheet(col, p, at, 0.17 / z + 0.004, uTime * 0.21, uTime * 0.5, life, 0.8);
 float fall = 1.0 - uHits; z = 1.5 + 6.0 * fall;
 at = esTop + vec2(-0.15 + 0.2 * fall, 0.46) / z;
 esSheet(col, p, at, 0.24 / z, 0.4 + fall * 2.2, 0.5 + fall * 4.0, smoothstep(0.02, 0.4, uHits), 1.6);
 // our own rail, worn by hands
 vec2 A = p - vec2(-0.95, 0.03);
 float l = dot(A, vec2(0.8805, -0.474)), th = 0.046, s = dot(A, vec2(0.474, 0.8805)) - 0.012 * esWave(l * 0.55 + 0.1);
 if (s < 0.0) {
  col = mix(col, esWood * (0.25 + 0.25 * hash11(floor((s + l * 0.02) * 14.0))) * (esAmb * 1.3 + esLamp * 0.2), esIn(s + 0.02, esPx));
  // the leaning pile
  for (int i = 0; i < 5; i++) {
   float fi = float(i);
   vec2 c = vec2(-0.70, -0.36) + vec2(0.030, 0.034) * fi;
   float an = -0.45 + 0.68 * (hash11(fi + 4.0) - 0.5) * min(fi, 1.0) - 0.05 * fi;
   vec2 hs = vec2(0.150, 0.105) * (1.0 - 0.07 * fi), b = rot(an) * (p - c);
   vec2 off = rot(an) * vec2(-0.02, -0.035);
   float dBody = 1.0;
   for (int j = 1; j < 6; j++) { vec2 e = abs(b - off * float(j) * 0.2) - hs; dBody = min(dBody, max(e.x, e.y)); }
   vec3 lm = esAmb * 2.0 + esLamp * (0.30 + 0.25 * uPad + 0.4 * esKind(i));
   col = mix(col, lm * vec3(0.19, 0.15, 0.09) * (0.62 + 0.3 * noise(vec2(b.y * 420.0, b.x * 8.0))), esIn(dBody, esPx * 1.5));
   float top = max(abs(b.x) - hs.x, abs(b.y) - hs.y);
   vec3 tc = esBinding(i, 0.6) * lm * (1.0 + 2.0 * dot(p - c, vec2(0.6, 0.8))) + (esLamp * 0.07 + 0.5 * vec3(1.0, 0.75, 0.3) * uKeys * step(3.5, fi)) * esIn(abs(top + 0.016) - 0.0016, esPx);
   col = mix(col, tc, esIn(top, esPx * 1.5));
  }
 }
 float nY = clamp(s / th, -1.0, 1.0), worn = exp(-11.0 * (l - 0.55) * (l - 0.55)), grain = noise(vec2(l * 5.0, s * 160.0));
 vec3 rl = esAmb * 1.2 + esGlow * 0.2 * smoothstep(-0.2, 1.0, nY) * (0.6 + uDrone) + esLamp * 0.16 * sat(1.0 - abs(nY - 0.1));
 vec3 rc = esWood * (0.8 + 0.45 * grain) * (1.0 + vec3(0.5, 0.28, 0.1) * worn) * rl * (1.2 - 0.7 * nY * nY);
 rc += (esGlow * 0.10 + esLamp * 0.05) * exp(-51.0 * (nY - 0.45) * (nY - 0.45)) * (0.35 + 0.65 * worn) * (0.6 + 0.4 * grain);
 col = mix(col, rc, esIn(abs(s) - th, esPx * 1.5));
 return col;
}
vec3 esAisle(vec2 p) {
 float wide = esOwn(uOwn[3], 0.38, 1.1), rh = 0.46 * esOwn(uOwn[2], 0.4, 0.9), XL = 1.15 * wide, XR = 1.3 * wide, f = 0.86 + 0.1 * (0.5 - uSpace);
 vec3 o = vec3(0.16 * wide, esOwn(uOwn[5], 0.22, 2.2) - 0.64, 0.5 * esWave(uTravel * 0.011));
 vec2 vp = vec2(0.10, esOwn(uOwn[5], 0.14, 0.34) - 1.22), s = p - vp;
 vec3 d = vec3(s / f, 1.0);
 if (uOwn[7] < 0.0 && d.y < 0.0) {
  float tW = -o.y / d.y; vec3 q = o + d * tW;
  if (q.x > -XL && q.x < XR) {
   esWet = true;
   float rip = noise(vec2(q.x * 2.2, q.z * 1.3 + uTime * 0.15)) + 0.6 * noise(vec2(q.x * 5.0 - uTime * 0.12, q.z * 3.1)) - 0.8;
   d.x += 0.03 * ES_WET * rip * smoothstep(0.0, 0.2, -d.y); d.y = max(-d.y + (0.05 + 0.04 * uLow) * ES_WET * rip * smoothstep(0.0, 0.2, -d.y), 2e-3);
   o = q - d * tW; s = d.xy * f;
  }
 }
 float pxm = esPx / f, side = d.x < 0.0 ? -1.0 : 1.0, X = side < 0.0 ? XL : XR;
 float tx = abs(d.x) > 1e-5 ? (X - side * o.x) / abs(d.x) : 1e4, ty = d.y < -1e-5 ? -o.y / d.y : 1e4, t = min(min(tx, ty), 46.0);
 vec3 P = o + d * t, alb = esWood, self = vec3(0.0), n = vec3(0.0, 1.0, 0.0);
 float occ = 1.0, gloss = 0.0;
 if (tx <= ty && t < 46.0) {
  float bare = max(esBare, side > 0.0 ? 0.76 * (1.0 - 0.95 * abs(uOwn[6])) * esOff(0.0, 0.05, abs(P.z - 5.2) - 3.85) : 0.0), ad = max(abs(d.x), 0.012);
  if (P.y > 0.16) {
   esHear(vec2(sat(P.z / 15.0), sat(1.0 - P.y / 3.2)));
   alb = esShelf(vec2(P.z + 20.0, P.y - 0.16), vec2(1.0, d.y) / ad, vec2(1.0 / ad, 1.0) * pxm * t, rh, 1.9, 0.085 * rh / 0.46, 0.05 + bare, side * 40.0 + 80.0);
   n = normalize(vec3(-side * (1.0 - abs(esUp) * 0.8), esUp, 0.9 * esNx));
   occ = esOcc; self = esSelf;
  } else { n = vec3(-side, 0.0, 0.0); occ = 0.6 + 2.0 * P.y; }
 } else if (t < 46.0) {
  // the floor, worn pale along its middle
  float bw = 0.19, bx = P.x / bw + 40.0, id = floor(bx), lod = smoothstep(0.3, 0.9, pxm * t / bw);
  alb = esWood * mix(0.75 + 0.5 * hash21(vec2(id, floor(P.z / 2.3 + hash11(id) * 5.0))), 1.0, lod);
  alb *= 0.85 + 0.3 * noise(vec2(P.x * 45.0, P.z * 1.6));
  alb *= 1.0 - 0.6 * esIn((0.5 - abs(fract(bx) - 0.5)) * bw - 0.006, pxm * t) * (1.0 - lod);
  alb *= 1.0 + 1.1 * exp(-P.x * P.x * 5.0 / (wide * wide));
  if (uOwn[7] > 0.0) {
   float g = noise(P.xz * 1.7), fine = max(esFine(P.xz * 15.0), 0.85 * esFine(rot(0.6) * P.xz * 19.0));
   alb = mix(alb, mix(vec3(0.06, 0.09, 0.03), uKind[2] * uKind[2], 0.75) * (0.4 + fine) * (0.7 + 0.5 * g), ES_LEAF * smoothstep(0.35, 0.6, g + 0.25 * abs(P.x) / wide + 0.2 * (fine - 0.5)));
  }
  occ = smoothstep(-0.1, 0.5, X - side * P.x);
  gloss = 1.0 - ES_LEAF;
 }
 // one lamp to a bay, left and right in turn
 vec3 lit = esAmb * (0.35 + 0.65 * occ), lampP[7]; float lampI[7];
 for (int i = 0; i < 7; i++) {
  float fi = float(i), sd = mod(fi, 2.0) < 0.5 ? -1.0 : 1.0;
  vec3 L = vec3(sd < 0.0 ? -XL + 0.2 : XR - 0.2, 0.52, 2.75 + fi * 1.9);
  float on = 0.07 + 0.12 * hash11(fi + 2.0) + (0.5 + 0.5 * hash11(fi + 7.0)) * 1.2 * uPad * (0.5 + uEnergy);
  on += (i == 0 ? 0.9 : i == 1 ? 1.5 * uHits : i == 3 ? 1.2 : 0.0) + 0.35 * uBands[i * 2 + 1];
  float wv = (1.0 - uCue) * 10.0 - fi; on += uCue * (2.4 * exp(-wv * wv * 0.4) + 0.5 * smoothstep(-0.5, 0.5, wv));
  on *= 1.0 - 0.65 * esDay;
  vec3 w = L - P; float r2 = dot(w, w), nd = dot(n, w) / sqrt(r2 + 1e-4);
  lit += esLamp * on * 1.35 / (0.16 + r2) * sat(0.25 + 0.75 * nd) * occ;
  lampP[i] = L; lampI[i] = on;
 }
 vec3 day = esGlow * (0.8 + 0.8 * uDrone * (0.4 + uEnergy) + 0.15 * uMic) * (1.0 - 0.94 * esClear);
 lit += day * 0.16 * occ * smoothstep(0.0, 34.0, P.z) * (0.6 + 0.4 * abs(n.x));
 vec3 col = alb * lit + self;
 float far = 20.0 * (1.0 - 0.3 * esClear) * (0.75 + 0.5 * uSpace), x = t / far;
 col += gloss * day * 0.34 * exp(-abs(s.x - 0.01) * 34.0 / (0.35 + 1.6 * sat(-s.y * 2.0))) * exp(s.y * 5.0) * (0.6 + 0.5 * noise(vec2(P.x * 30.0, P.z)));
 float fog = 1.0 - exp(-x * x * 0.9 - esMilk * 0.22 * t * (1.2 - 0.5 * sat(P.y * 0.3)));
 vec3 air = day * mix(0.055, 0.4, esMilk) * (1.0 - 0.6 * (1.0 - esDay) * smoothstep(0.0, 0.5, s.y));
 col = mix(col, air, fog);
 // the pin of light: a tall door at the end
 vec2 dq = abs(s - vec2(0.004, 0.012)) - vec2(0.0085, 0.028);
 float dd = length(max(dq, 0.0));
 col += day * (1.5 * esIn(max(dq.x, dq.y), esPx * 1.5) + 0.25 * exp(-dd * 70.0) + 0.09 * exp(-dd * 9.0));
 // a ladder on wheels, leaning across the light
 float zl = 6.6 + 1.6 * esWave(uTime * 0.007 + 0.2) + 1.2 * (uPhrase - 0.2);
 vec3 foot = vec3(XR * 0.42, 0.0, zl), A = vec3(-XL + 0.1, 3.7, zl + 0.5) - foot, R = vec3(0.80, 0.0, 0.60), N = cross(A, R);
 float den = dot(d, N), tl = abs(den) > 1e-4 ? dot(foot - o, N) / den : -1.0;
 if (tl > 0.0 && tl < t) {
  vec3 q = o + d * tl - foot; float a = q.y / A.y, r = abs(dot(q - A * a, R)), fz = pxm * tl * 1.2;
  float body = esIn(abs(r - 0.27) - 0.034, fz), rung = esIn(r - 0.27, fz) * esIn(abs(fract(a * 11.0) - 0.5) * 0.38 - 0.026, fz);
  body = max(body, rung) * esIn(a - 1.0, 0.01) * esIn(0.02 - a, 0.005);
  body = max(body, esIn(length(vec2(r - 0.27, q.y - 0.06)) - 0.065, fz));
  vec3 w = lampP[2] - o - d * tl;
  col = mix(col, esWood * (esAmb * 0.5 + esLamp * lampI[2] * 0.5 / (0.3 + dot(w, w)) + 0.06 * day * (0.4 + 0.6 * rung)), body * exp(-esMilk * 0.16 * tl));
 }
 // a bridge high up, from wall to wall
 float zb = 8.6 - o.z;
 if (zb < t) {
  vec2 q = o.xy + d.xy * zb - vec2(0.0, 3.0); float fz = pxm * zb;
  float b = max(esIn(abs(q.y) - 0.07, fz), esIn(abs(q.y - 0.85) - 0.03, fz));
  b = max(b, esIn(abs(fract(q.x / 0.22) - 0.5) * 0.22 - 0.014, fz) * esIn(abs(q.y - 0.42) - 0.42, fz));
  col = mix(col, esWood * (esAmb * 0.8 + day * 0.05 * esIn(q.y, 0.1)), b * exp(-esMilk * 0.16 * zb));
 }
 for (int i = 6; i >= 0; i--) {
  vec3 w = lampP[i] - o; if (w.z < 0.4) continue;
  float m = w.z / f; vec2 c = s * m - w.xy; float px = esPx * m * 1.4;
  float keep = exp(-w.z * w.z / (far * far) - esMilk * 0.12 * w.z) * esOff(0.3, 0.9, w.z - t);
  float stem = max(esIn(abs(c.x) - 0.008, px) * step(-0.52, c.y) * esIn(c.y, px), esIn(max(abs(c.x) - 0.07, abs(c.y + 0.5) - 0.014), px));
  col = mix(col, mix(air, esWood * 0.35 + esLamp * lampI[i] * 0.05, keep), stem);
  esGlobe(col, c / m, m, 0.07, esLamp * lampI[i] * 0.9, keep);
 }
 float age = fract(uTime / 38.0 + 0.45), life = smoothstep(0.0, 0.06, age) * (1.0 - smoothstep(0.9, 1.0, age));
 esSheet(col, p, vp + vec2(-0.10 + 0.05 * esWave(uTime * 0.07), 0.62 - 0.72 * age), 0.034, 0.4 * esWave(uTime * 0.05), uTime * 0.55, life, 0.65);
 if (uOwn[7] < 0.0 && esWet) col = col * mix(vec3(0.7), uKind[0] * 0.9, 0.3) + esGlow * 0.008;
 float fall = 1.0 - uHits;
 esSheet(col, p, vp + vec2(-0.10 + 0.1 * sin(fall * 4.0), 0.48 - 0.56 * fall), 0.18, 0.5 + fall * 1.6, 0.5 + fall * 4.0, smoothstep(0.02, 0.4, uHits), 1.6);
 return col;
}
float esDust(vec2 p) {
 p = p * 13.0 + vec2(0.4 * esWave(uTime * 0.017), 60.0 + esWave(uTime * 0.011));
 vec2 h = hash22(floor(p)), q = fract(p) - 0.2 - 0.6 * h;
 return esOff(0.0, 0.055, length(q)) * (0.5 + 0.5 * esWave(h.x * 7.0 + uTime * 0.06)) * step(0.45, h.y);
}
vec3 render(vec2 p) {
 esPx = 1.0 / uRes.y;
 esWood = mix(mix(vec3(0.155, 0.078, 0.036), vec3(0.10, 0.085, 0.08), esNight), vec3(0.70, 0.64, 0.54), esDay);
 esLamp = vec3(1.0, 0.60, 0.25) * (1.0 - 0.45 * esNight) * mix(0.85, 1.15, uTone);
 esAmb = mix(mix(vec3(0.062, 0.047, 0.036), vec3(0.05, 0.10, 0.22), esNight), vec3(0.75, 0.74, 0.70), esDay) * mix(0.8, 1.25, uTone);
 esGlow = mix(mix(vec3(1.0, 0.82, 0.58), vec3(0.34, 0.52, 0.95), esNight), vec3(1.0, 1.0, 0.98) * 1.7, esDay);
 if (ES_DYE > 0.0) {
  esWood = mix(esWood, uKind[1] * uKind[1] * mix(0.16, 0.8, esDay), 0.75 * ES_DYE);
  esGlow = mix(esGlow, uKind[0] * mix(1.0, 1.5, esDay), 0.75 * ES_DYE);
  esLamp = mix(esLamp, uKind[3] * uKind[3] * (1.0 - 0.4 * esNight), 0.6 * ES_DYE);
  esAmb = mix(esAmb, (0.5 * uKind[0] + 0.5) * dot(esAmb, vec3(0.333)), 0.6 * ES_DYE);
 }
 vec3 c = uVar < 0.5 ? esNear(esShaft(p), p) : esAisle(p);
 c += esLamp * esDust(p) * (0.03 + (uVar < 0.5 ? 2.2 : 1.2) * uTexture * (0.3 + uEnergy)) * esOff(0.2, 1.1, length(p - esTop));
 return screenOf(c * 1.35);
}
