// name: Belted air
// a: Standing
// b: Squeezed between walls
// what: A great soft body of ochre sailcloth, blown tight and wider at one shoulder, stands in a pale studio, tied by five coloured belts, each at its own tilt, with a buckle and a slack end. Or the same body fills a gap between two plain walls under a low ceiling, pressed flat where they hold it and swelling out toward us.
// follows: Each kind of sound draws in its own belt and the cloth bulges beside it. Loudness and the drone fill it, lows are its breath, texture deepens the creases, the phrase twists it. Bands dimple the tufts, keys light the buttons, a voice the room. A hit flares and snaps one belt, a cue pulls all five. The piece runs in the belts' stripes; the loop sways the sun.
// own: 0 the form: 1 tall and narrow toward its top, -1 low and broad; 1 1 lobed all round like a gourd, -1 a square bale; 2 the belts: 1 as broad as bandages, -1 thin cords; 3 1 drawn in hard, -1 hardly drawn in at all; 4 the stuff: 1 bright foil, -1 a rough pile; 5 the place: 1 a dark room and one low lamp, -1 under open sky on ground in the colour of the drone (b: walls in it); 6 1 striped in the colours of texture and phrase, -1 lit from within; 7 1 a row of them, -1 it floats over the floor. With any of them the cloth is in the colour of texture
float baUp(float x) { return max(x, .0); }
float baDn(float x) { return max(-x, .0); }
vec3 baCl = vec3(.57, .26, .045); // the cloth
float baRow = .0; // where in the row
vec3 baSkew(vec3 q) { return vec3(dot(q, vec3(.6, .5, .62)), dot(q, vec3(-.71, .7, .1)), dot(q, vec3(-.37, -.5, .78))); }
// an if that is stepped over whole
#define BA_IF(c) for (int go = (c) ? 1 : 0; go > 0; go--)
#define BA_FIVE(F) F(0) F(1) F(2) F(3) F(4)
#define BA_DOWN(a, b, x) (1.0 - smoothstep(b, a, x))
bool baB;  // squeezed between walls
vec3 baN[5];  // each belt lies in a plane: its normal,
float baC[5], baT[5], baH[5]; // how far the plane is from the middle, how tight it is, half its width
vec4 baK[5];  // where a belt is buckled, and how long its slack end hangs
float baAir, baSag, baTwist, baWr, baGain, baPx, baSnap;
vec3 baL;
float baF = -.9;  // the floor
const vec3 baGap = vec3(-.97, .9, .64);  // the walls' inner edges and the slab's underside
const vec3 baFront = vec3(-1.26, -1.3, -1.2); // how near to us each of them comes
const vec3 baSeam = vec3(.982, -.19, .0);  // the plane of the seam
float baSide;  // and how far it is from the middle
const vec3 baValve = vec3(-.76, .28, -.585);

// How far from the walls and the slab.
float baWalls(vec3 q) {
 vec3 a = max(vec3(q.x - baGap.x, baGap.y - q.x, baGap.z - q.y), baFront - q.z);
 return min(min(a.x, a.y), a.z);
}
// A place in the room to a place in the untwisted cloth.
vec3 baTurn(vec3 q) { float a = baTwist * q.y; q.xz = (q.xz + a * vec2(-q.z, q.x)) * (1.0 - .5 * a * a); return q; }
// The body as it would be with no belts, P how far they draw it in.
float baBag(vec3 q, float y0, float P) {
 q /= baAir;
 float side = q.x * 1.6; side /= sqrt(1.0 + side * side);
 float low = sat(-.15 - q.y);
 vec3 r = baB ? vec3(1.46, 1.12, 1.33) : vec3(1.1 + .3 * side * q.y, 1.06 + .16 * (q.x - .3) * sat(q.y * 1.5), 1.0);
 r.xz *= 1.0 + (.12 + .2 * baSag) * low;
 r.y *= 1.0 - .06 * baSag;
 if (uOwn[0] > .0) r.xz *= 1.0 - .42 * uOwn[0] * clamp(q.y - .1, baB ? -.1 : -.5, 1.0);
 vec3 a = q / r; a *= a;
 float d = (sqrt(mix(a.x + a.y + a.z, sqrt(dot(a, a)), .6)) - 1.0) * .95 * P;
 if (uOwn[1] > .0) { float l = length(q.xz); float a5 = abs(sin(4.5 * atan(q.x, q.z + 1e-5))); d = (d - .15 * uOwn[1] * (sqrt(a5 * a5 * .4 + a5 * .6 + .02) - .75) * l / (l + .3)) * (1.0 - .2 * uOwn[1]); }
 if (uOwn[1] < .0) { a *= a * 2.2; d = mix(d, (sqrt(sqrt(sqrt(dot(a, a) + 1e-6))) - 1.0) * .9 * P, -uOwn[1]); }
 return -smin(-d, y0 - baF, .16);
}
// A belt draws the cloth in towards its own middle, in its own plane.
void baTie(inout vec3 q, inout float P, vec3 o, vec3 n, float c, float h, float tight) {
 float s = dot(n, o), g = 1.0 / (1.0 + 6.0 * max(abs(s - c) - h, .0)), m = tight * g * g;
 q += (o - n * s) * (m + m * m);
 P = min(P, 1.0 - m);
}
// The body without its creases.
float baBody(vec3 q0) {
 vec3 q = baTurn(q0), o = q;
 float P = 1.0;
#define BA_TIE(k) baTie(q, P, o, baN[k], baC[k], baH[k], baT[k]);
 BA_FIVE(BA_TIE)
 float d = baBag(q, q0.y, P);
 return baB ? -smin(-d, baWalls(q0) - .012, .14) : d;
}
// The nearest of the sixteen tufts on the seam: across, along, its number, how near.
vec4 baTuft(vec3 q) {
 float s = dot(q, baSeam) + baSide, l = length(q.yz), f = (atan(q.y, -q.z + 1e-4) + 1.1) / .155;
 float i = clamp(floor(f), .0, 15.0);
 float y = f - i - .5, c = cos(PI * clamp(y, -.5, .5));
 return vec4(s, y * .155 * l, i, c * c * c * c);
}
// Creases running out from under a belt.
void baFold(inout float h, inout float bare, inout float up, vec3 q, vec3 n, float c, float wide, float tight, float seed) {
 float s = dot(n, q) - c, x = abs(s) - wide;
 BA_IF(x < .32) {
  bare *= sat((x + .004) * 60.0);
  up = max(up, sat(.5 - x / max(.0083, 1.5 * baPx)));
  x = max(x, .0);
  vec3 e = q - n * s; e /= length(e) + 1e-3;
  vec2 ev = vec2(e.x * n.y - e.y * n.x, e.z) + seed + (s > .0 ? 3.1 : .0);
  float n1 = 2.0 * noise(ev * 5.5 + s * .8) - 1.0, n2 = .0;
  n1 = sqrt(n1 * n1 + .012);
  BA_IF(x < .15) n2 = (abs(2.0 * noise(ev * 12.0 + 5.0) - 1.0) - .4) * (1.0 - 6.7 * x);
  float a = (.45 + 1.6 * tight + .4 * baWr) * (1.0 - 3.12 * x), fall = 1.0 / (1.0 + x * 8.0);
  h += a * fall * (.09 * (n1 - .4) + .05 * n2 * fall * fall);
 }
}
// Creases, dents, the seam: how far the cloth stands out.
float baFine(vec3 q0) {
 vec3 q = baTurn(q0);
 float h = .0, bare = 1.0, up = .0, wave = abs(dot(baN[4], q) - baC[4]);
#define BA_FOLD(k) baFold(h, bare, up, q, baN[k], baC[k], baH[k], baT[k], float(k) * 7.3);
 BA_FIVE(BA_FOLD)
 float w = baB ? 1.0 - 1.4 * baWalls(q0) : .0;
 BA_IF(w > .0) {
  float c = 2.0 * noise(vec2((q0.y + q0.x) * 5.0, q0.z - .7 * w)) - 1.0;
  h += (.07 + .05 * baWr) * (sqrt(c * c + .02) - .4) * w * w * w;
 }
 h += (.05 + .02 * baSag) * .36 * sin(q.x * 6.0 + q.z * 5.0 + 7.0 * q.y * (q.y - q.x));
 BA_IF(baSnap > .0) h += .02 * baSnap * sin(wave * 26.0 - uHits * 14.0) * exp(-wave * 2.5);
 BA_IF(q.z < .0) {
  float a = abs(dot(q, baSeam) + baSide), v = length(q - baValve * dot(q, baValve));
  BA_IF(a < .2) {
   vec4 u = baTuft(q);
   h -= .016 * exp(-a * a * 900.0) + (.012 + .22 * uBands[int(u.z)] * baGain) * exp(-u.x * u.x * 120.0) * u.w;
  }
  h += .03 * BA_DOWN(.075, .062, v) - .012 * BA_DOWN(.045, .036, v) + .03 * BA_DOWN(.026, .02, v);
 }
 if (uOwn[4] < .0) h -= uOwn[4] * (.034 * noise(baSkew(q * 14.0)) + .017 * noise(baSkew(q * 31.0)) + .007 * noise(baSkew(q * 73.0)));
 return h * bare * .85 + up * .014;
}
const float baLean[5] = float[5](.059, -.018, -.033, .065, -.063); // which way each slack end hangs
float baSwing[5];  // and how it sways
// The slack ends: each hangs in a slanting plane from its buckle. How much is here, and where.
float baStrap(int k, vec3 ro, vec3 rd, float soft, out vec3 uv) {
 vec4 b = baK[k];
 float t = (b.z - ro.z + .16 * (ro.y - b.y)) / (rd.z - .16 * rd.y);
 vec3 q = ro + rd * t;
 float down = b.y - q.y, m = .0;
 uv = vec3(.0, down, q.x - b.x);
 BA_IF(t > .0 && down > -.03 && down < b.w + .1 && abs(q.x - b.x) < .26) {
  float fk = float(k), far = down / b.w, f2 = far * far;
  float x = q.x - b.x - baLean[k] * down - f2 * baSwing[k] - .03 * sin(down * 5.0 + fk);
  float w = baH[k] * (.49 + .25 * cos(f2 * (1.2 + .4 * fk)));
  uv.x = x / w;
  m = sat(.5 + .5 * min(min(w - abs(x), b.w - down - .3 * x), min(down, q.y - baF)) / soft);
 }
 return m;
}
// The shadow of one bulge on the next.
float baShade(vec3 q, float soft) {
 float s = 1.0, t = .06;
 for (int i = 0; i < 5; i++) {
  s = min(s, .5 + .5 * baBody(q + baL * t) * soft / t);
  if (s < .02) break;
  t *= 1.87;
 }
 return smoothstep(.0, 1.0, s);
}
// The shadow of the whole bag on the floor.
float baCast(vec3 q, float t, float far, float soft) {
 float s = 1.0, dt = (far - t) / 6.0;
 t += .5 * dt;
 for (int i = 0; i < 6; i++) {
  s = min(s, .5 + .5 * baBag(q + baL * t, 1.0, .95) * soft / clamp(t, .4, 1.4));
  t += dt;
 }
 return smoothstep(.0, 1.0, s);
}
// What the left wall and the slab keep of the light.
float baShut(vec3 q) {
 float a = max(q.x - baGap.x, .0) / max(-baL.x, .05), b = max(baGap.z - q.y, .0) / max(baL.y, .05);
 return sat(.5 + (baFront.x - q.z - baL.z * a) / (.04 + .2 * a)) * sat(.5 + (baFront.z - q.z - baL.z * b) / (.04 + .2 * b));
}
vec3 baDye(int k) {
 vec3 c = uKind[k];
 c = max(mix(vec3(dot(c, vec3(.3, .59, .11))), c, 1.2), .0);
 return c * c * (k == 2 ? .2 : .5) + .015;
}
// Webbing: ribs across, a pale stripe along each side that carries the piece.
vec3 baWeb(int k, float u, float along, float lit) {
 vec3 c = baDye(k);
 c *= 1.0 - .2 * (.5 + .5 * sin(along * 190.0)) * BA_DOWN(.012, .003, baPx);
 c = mix(c, mix(c, vec3(.75, .7, .58), .7), BA_DOWN(.12, .06, abs(abs(u) - .55)) * (.2 + .8 * lit)) * (.85 + .45 * lit);
 c *= 1.0 - .4 * smoothstep(.75, 1.0, abs(u));
 return c * (k == 4 ? 1.0 + 2.5 * uHits : 1.0) * (1.0 + .8 * uCue);
}
vec3 baLightAt(vec3 n, float sun, float ao) {
 vec3 key = mix(vec3(1.5, 1.34, 1.12), vec3(1.5, 1.47, 1.4), uTone) * (.88 + .12 * uLevel);
 vec3 sky = vec3(.3, .33, .38) * (.6 + .4 * n.y) * (1.0 + .3 * uMic);
 vec3 side = vec3(.12, .125, .13) * sat(.5 + .5 * n.x);
 vec3 under = vec3(.26, .23, .18) * sat(.4 - .6 * n.y);
 float nt = baUp(uOwn[5]);
 key *= mix(vec3(1.0), vec3(1.25, .88, .55), nt) * (1.0 - .75 * baDn(uOwn[6])); sky *= 1.0 - .88 * nt; side *= 1.0 - nt; under *= 1.0 - .9 * nt;
 return key * sat(dot(n, baL) * .9 + .1) * sun + (sky + side + under) * ao;
}
void baFace(inout float t, inout vec3 n, inout vec3 alb, float s, vec3 m, float a) { if (s < t) { t = s; n = m; alb = vec3(a); } }
// The room without the body.
vec3 baRoom(vec3 ro, vec3 rd, out vec3 q, out vec3 n) {
 float t = rd.y < .0 ? (baF - ro.y) / min(rd.y, -1e-4) : 60.0;
 vec3 alb = vec3(.8, .8, .795);
 n = vec3(.0, 1.0, .0);
 const vec3 us = vec3(.0, .0, -1.0);
 BA_IF(!baB) {
  // the floor runs up into the wall in one soft bend
  float tw = (3.4 + 60.0 * baDn(uOwn[5]) - ro.z) / rd.z, k = smoothstep(-1.2, 1.2, t - tw);
  t = smin(t, tw, 1.2);
  n = normalize(mix(n, us, k));
 }
 BA_IF(baB) {
  vec3 tz = (baFront - ro.z) / rd.z, h = ro.xxy + rd.xxy * tz;
  alb = vec3(.6, .59, .57);
  vec3 s = (baGap - ro.xxy) / mix(vec3(-1e-4, 1e-4, 1e-4), rd.xxy, vec3(rd.x < .0, rd.x > .0, rd.y > .0));
  if (h.x < baGap.x) baFace(t, n, alb, tz.x, us, .745);
  if (h.y > baGap.y) baFace(t, n, alb, tz.y, us, .525);
  if (h.z > baGap.z) baFace(t, n, alb, tz.z, us, .63);
  if (s.x > tz.x) baFace(t, n, alb, s.x, vec3(1.0, .0, .0), .6);
  if (s.y > tz.y) baFace(t, n, alb, s.y, vec3(-1.0, .0, .0), .6);
  if (s.z > tz.z) baFace(t, n, alb, s.z, vec3(.0, -1.0, .0), .6);
 }
 q = ro + rd * t;
 if (uOwn[5] < .0) { vec3 k = uKind[0] * uKind[0]; float g = baB ? .6 * noise((q + vec3(baRow, .0, .0)) * 2.5) + .4 * noise(q * 17.0) : noise((q.xz + vec2(baRow, .0)) * vec2(1.2, 3.5) + noise(q.xz + vec2(baRow, .0))); alb = mix(alb, k * (baB ? alb * 1.5 : vec3(1.1)) * (.75 + .5 * g) + .02, -uOwn[5]); }
 if (baB) alb *= 1.0 - .8 * smoothstep(-.3, .8, q.z) * step(abs(n.z), .5);
 return alb;
}
vec3 baSky(vec3 rd) { return mix(sqrt(uKind[3]) * .95, uKind[1] * uKind[1], smoothstep(-.02, .28, rd.y / length(rd) + .06 * noise(rd.xy * vec2(2.0, 9.0) / rd.z))); }
vec3 render(vec2 p) {
 float many = baUp(uOwn[7]), fl = baDn(uOwn[7]), kk = uOwn[0], own = abs(kk);
 p = (p - vec2(.0, -.4)) / vec2(1.0 - .3 * baUp(kk) + .35 * baDn(kk), 1.0 + .1 * baUp(kk) - .36 * baDn(kk)) + vec2(.0, -.4);
 own = sat(6.0 * (own + abs(uOwn[1]) + abs(uOwn[2]) + abs(uOwn[3]) + abs(uOwn[4]) + abs(uOwn[5]) + abs(uOwn[6]) + many + fl));
 baCl = mix(baCl, uKind[2] * uKind[2] * .8 + .015, own);
 baF = -.9 - .75 * fl;
 baB = uVar > .5;
 baSide = baB ? -.36 : .42;
 baGain = .4 + 1.3 * uEnergy;
 float g = baGain, pull = 4.0 * uCue * (1.0 - uCue);
 baSnap = 4.0 * uHits * (1.0 - uHits);
 baSag = 1.0 - sat(1.4 * uLevel + .3 * uDrone);
 baAir = 1.0 + .012 * sin(uTime * .628) + .06 * uLevel + .035 * uDrone + .03 * uLow;
 baTwist = .05 * sin(uTime * .11) + .32 * uPhrase * g * sin(uTime * .19 + .8);
 if (baB) baTwist *= .5;
 baWr = uTexture * g;
 float lv[5] = float[5](sat(uDrone * g), sat(uPad * g), sat(uTexture * g), .85 * sat(uPhrase * g), .8 * baSnap);
 vec2 sway = .05 * sin(uTime * vec2(.31, .23));
 // the belts in their order: drone, pad, texture, phrase, hit; standing, then squeezed
 float baTg = 1.0 + 1.1 * baUp(uOwn[3]) - .92 * baDn(uOwn[3]), baWd = uOwn[2] == .0 ? 1.0 : uOwn[2] > .0 ? 1.0 + 1.3 * uOwn[2] : 1.0 + .8 * uOwn[2];
#define BA_BELT(k, n, o, e, m, r, f) baN[k] = baB ? m : n; baC[k] = baB ? r.x : o.x; baH[k] = baB ? r.y : o.y; baT[k] = (.1 + .18 * lv[k] + .07 * pull) * (baB ? .72 : 1.0) * baTg; if (uOwn[3] > .0) baT[k] = min(baT[k], .48); baH[k] *= baWd; baK[k] = baB ? f : e; baK[k].z = baK[k].z * baAir * (1.0 - baT[k]) - .03; baSwing[k] = k == 0 ? .0 : k < 3 ? sway.x : sway.y;
 BA_BELT(0, vec3(.122, .985, .122), vec2(-.5, .07), vec4(.12, -.417, -.972, .6), vec3(.359, .928, .1), vec2(-.5, .075), vec4(.36, -.586, -1.134, .6))
 BA_BELT(1, vec3(-.202, .969, -.141), vec2(-.12, .082), vec4(.56, -.131, -.955, .6), vec3(-.141, .985, -.101), vec2(0, .085), vec4(-.14, -.107, -1.176, .62))
 BA_BELT(2, vec3(.162, .982, .101), vec2(.36, .042), vec4(-.5, .537, -.942, .5), vec3(.55, .829, .1), vec2(.6, .045), vec4(.24, .667, -1.112, .5))
 BA_BELT(3, vec3(-.9, .42, .12), vec2(.04, .055), vec4(.12, .595, -.948, 1), vec3(-.756, .647, .099), vec2(-.12, .06), vec4(.46, .482, -1.146, .8))
 BA_BELT(4, vec3(-.08, .984, .163), vec2(.57, .05), vec4(.5, .761, -.863, .4), vec3(.975, .223, .0), vec2(-.6, .055), vec4(-.66, .195, -1.115, .55))
 baL = normalize(baB ? vec3(-.7, .62, -.6) : vec3(-.8, .66, -.36));
 baL = normalize(baL + vec3(.0, 1.3 * many - .34 * baUp(uOwn[5]), .0));
 baL.xz *= rot((baB ? .16 : .3) * sin(TAU * uLoop));

 float asp = uRes.x / uRes.y;
 float D = (baB ? 4.6 : 6.6) * (1.0 + .65 * many + .12 * fl), foc = (baB ? 1.7 : 2.34) * min(mix(1.06, .94, uSpace), asp * .85);
 float az = .1 * sin(uTime * .037) + (baB ? .26 : .08);
 vec3 ta = baB ? vec3(-.16, -.02, -.4) : vec3(.1, .06, .0);
 vec3 ro = ta + vec3(sin(az) * D, baB ? .1 : .7, -cos(az) * D);
 vec3 fw = normalize(ta - ro), rt = normalize(cross(vec3(.0, 1.0, .0), fw)), up = cross(fw, rt);
 vec3 rd = normalize(fw * foc + rt * p.x + up * p.y);
 if (many > .0) {
  float S = mix(9.0, baB ? 2.5 : 2.75, many), id = floor((ro.x + rd.x * ((baB ? -1.25 : .0) - ro.z) / rd.z) / S + .5);
  baRow = id * S; ro.x -= baRow;
  if (id != .0) { float h = hash11(id); baAir *= .86 + .22 * h; baTwist += (h - .5) * .5; for (int k = 0; k < 5; k++) if (!baB) { baN[k].x *= 1.4 - 2.2 * h; baN[k] = normalize(baN[k]); } }
 }
 baPx = D / (foc * uRes.y);

 // the body, marched inside a ball
 vec3 hold = baB ? vec3(.55, .66, .56) : vec3(.57, .69, .6);
 vec3 eo = ro * hold, ed = rd * hold;
 float ea = dot(ed, ed), bb = dot(eo, ed) / ea, disc = bb * bb - (dot(eo, eo) - 1.0) / ea;
 float best = 1.0, tb = 1e3, cover = .0;
 vec3 tw = (baFront - ro.z) / rd.z, h = ro.xxy + rd.xxy * tw;
 if (disc > .0) {
  float t = -bb - sqrt(disc), tEnd = -bb + sqrt(disc);
  if (rd.y < .0) tEnd = min(tEnd, (baF - ro.y) / rd.y);
  if (baB) tEnd = min(min(tEnd, h.x < baGap.x ? tw.x : 99.0), min(h.y > baGap.y ? tw.y : 99.0, h.z > baGap.z ? tw.z : 99.0));
  if (baB && (h.x < baGap.x - .2 || h.y > baGap.y + .2)) tEnd = .0;
  // to the bag first
  for (int i = 0; i < 9 && t < tEnd; i++) {
   float d = baBag(baTurn(ro + rd * t), 1.0, 1.0);
   t += max(d, .004);
   if (d < .02) break;
  }
  int far = uOwn[1] > .0 ? 60 : 20;
  for (int i = 0; i < far && t < tEnd; i++) {
   float d = baBody(ro + rd * t);
   if (d < best) { best = d; tb = t; }
   if (d < .001) break;
   t += max(d * .88, far > 20 ? max(.004, 1.2 * baPx) : .004);
  }
  cover = best < .001 ? 1.0 : BA_DOWN(.8, .0, best / baPx);
 }
 vec2 hang = ro.xy + rd.xy * (-1.05 - ro.z) / rd.z + vec2(.06, -.05);
 bool near = abs(hang.x) < .95 && abs(hang.y + .15) < 1.3;
 vec3 col = vec3(.0), uv, more = col;
 vec2 at0 = vec2(.0);
 // the room
 BA_IF(cover < 1.0) {
  vec3 q, n, alb = baRoom(ro, rd, q, n), n0 = n;
  float sh = 1.0, hol = 1.0;
  BA_IF(n.y > .5) alb *= .97 + .05 * noise(q.xz * vec2(2.0, 5.0));
  BA_IF(near && fl == .0 && n.y > .5 && abs(q.x - baK[0].x) < .5 && q.z < -.8) {
   // the lowest belt's end runs out over the floor
   vec4 b = baK[0];
   float dn = b.y - baF, u = b.z - .16 * dn - q.z;
   float x = q.x - b.x - baLean[0] * dn - .03 * sin(dn * 5.0) + .5 * u * u + .05 * sin(u * 8.0), w = baH[0] * .66;
   float run = BA_DOWN(baPx, -baPx, abs(x) - w) * step(.0, u) * BA_DOWN(.55 + baPx, .55 - baPx, u + .3 * x);
   sh *= 1.0 - .5 * BA_DOWN(.03, -.01, abs(x - .025) - w) * smoothstep(-.05, .0, u) * BA_DOWN(.58, .54, u);
   hol = mix(1.0, 1.4, run);
   alb = mix(alb, baWeb(0, x / w, u, .3), run);
  }
  float t0 = .05, b = dot(q, baL), c = dot(q, q) - 2.5, r = b * b - c, t1 = .0;
  if (c < .0 || (b < .0 && r > .0)) { r = sqrt(max(r, .0)); t0 = max(-b - r, .03); t1 = -b + r; }
  float d = 1.0;
  BA_IF(!baB && dot(q, q) < 7.0) d = baBag((q + n0 * .22) * vec3(1.14, 1.0, 1.14), 1.0, 1.0);
  BA_IF(baB && dot(q, q) < 3.6) d = baBody(q + n0 * .22);
  if (baB) d = mix(1.0, d, BA_DOWN(3.6, 2.2, dot(q, q)));
  float mid = many > .0 ? mix(1.0, BA_DOWN(1.25, .75, abs(q.x)), many) : 1.0;
  if (many > .0) d = mix(1.0, d, mid);
  float ao = clamp(.3 + d / .5, .06, 1.0) * hol;
  BA_IF(baB && abs(n.z) < .5) { sh *= baShut(q + n0 * .01); ao *= 1.0 - .5 * smoothstep(-1.1, -.1, q.z); }
  BA_IF(t1 > .0 && n.y > -.5 && (!baB || n.y > .5)) sh *= mix(1.0, baCast(q, t0, t1, mix(4.0, 11.0, uTone)), smoothstep(.0, 1.0, t1 - t0) * mid);
  col = alb * baLightAt(n, sh, ao) * (1.0 - .14 * (1.0 - many) * smoothstep(-2.0, 3.0, q.x));
  col += mix(vec3(.1, .05, .01), baCl * .2, own) * (1.0 - sat(d / .5)) * ao * (1.0 + 5.0 * baDn(uOwn[6])); // thrown back by the cloth
  col *= mix(1.0, .05 + .95 * exp(-.2 * mix(dot(q, q), dot(q.yz, q.yz), many)), baUp(uOwn[5]));
  if (uOwn[6] < .0) col -= uOwn[6] * baCl * alb * (.5 + uPad) * exp(-.5 * dot(q, q) + .6) * mid;
  if (uOwn[5] < .0 && !baB) col = mix(col, baSky(rd), -uOwn[5] * smoothstep(9.0, 34.0, length(q - ro)));
 }
 // the body
 BA_IF(cover > .0) {
  vec3 q = ro + rd * tb, n0 = vec3(.0, 1e-7, .0);
  float shine = .0, pinch = 1.0;
  const float e = .006;
  for (int i = 0; i < 3; i++) { vec3 o = vec3(i == 0, i == 1, i == 2); n0 += o * (baBody(q + o * e) - best); }
  if (best > .001) cover = BA_DOWN(.8, .0, best * e / (baPx * max(length(n0), 1e-5)));
  n0 = normalize(n0);
  vec3 ta1 = normalize(cross(n0, vec3(.13, .31, .94))), ta2 = cross(n0, ta1), hf = vec3(.0);
  for (int i = 0; i < 3; i++) { vec3 o = vec3(i == 0, i == 1, i == 2); hf += o * baFine(q + (ta1 * o.y + ta2 * o.z) * e); }
  float f0 = hf.x;
  vec3 n = normalize(n0 - (ta1 * (hf.y - f0) + ta2 * (hf.z - f0)) * (1.0 - .45 * baUp(uOwn[4])) / e);
  vec3 w = baTurn(q), alb = baCl * (.84 + .32 * noise(w.xy * 1.7 + 8.0 + w.z));
  // the sail is sewn from panels
  float across = dot(w, baSeam) + baSide, pl = abs(abs(fract(across / .56 + .5) - .5) * .56 - .28);
  if (uOwn[6] > .0) alb = mix(alb, uKind[3] * uKind[3] * .85 + .02, uOwn[6] * smoothstep(-.06, .06, sin(PI * (across / .56 + .5) + .001)));
  alb *= 1.0 - .3 * sat(1.0 - pl / (.004 + baPx)) + .08 * sat(1.0 - abs(pl - .022) / .02);
  BA_IF(w.z < .0 && abs(across) < .15) {
   // the seam's two rows of stitches and its buttons
   vec4 u = baTuft(w);
   float st = BA_DOWN(.007 + baPx, .004, abs(abs(u.x) - .026)) * smoothstep(.1, .3, abs(fract(u.y * 26.0) - .5));
   alb = mix(alb, mix(vec3(.75, .55, .28), alb * 1.5, own), .6 * st);
   alb *= 1.0 - .6 * BA_DOWN(.005 + baPx, .002, abs(u.x));
   float r = length(u.xy), bt = BA_DOWN(.027 + baPx, .027 - baPx, r);
   alb += mix(vec3(.5, .3, .1), baCl, own) * uKeys * BA_DOWN(.15, .02, r);
   alb = mix(alb * (1.0 - .4 * BA_DOWN(.05, .02, r)), mix(vec3(.2, .075, .03), baCl * .35, own) * (1.0 + 9.0 * uKeys + 3.0 * uBands[int(u.z)]), bt);
   shine = bt;
  }
  float v = length(w - baValve * dot(w, baValve)) + step(.0, w.z);
  BA_IF(v < .12) {
   // the valve
   float vm = BA_DOWN(.072 + baPx, .072 - baPx, v);
   alb = mix(alb * (1.0 - .3 * BA_DOWN(.1, .07, v)), mix(vec3(.17, .16, .15), vec3(.4, .38, .34), BA_DOWN(.03, .024, v)), vm);
   shine = max(shine, vm);
  }
  float near = .0, belt = .0, bu = .0;
  int which = 0;
#define BA_SKIN(k) { float s = dot(baN[k], w) - baC[k], lean = dot(baN[k], n0), x = abs(s) * inversesqrt(max(1.0 - lean * lean, .07)) - baH[k]; \
   float m = sat(.5 - .5 * x / baPx), far = max(x, .0), dark = sat(1.0 - far * 5.0); pinch *= 1.0 - .5 * dark * dark * dark * sat((x + .01) * 70.0); \
   if (k == 4) near = exp(-far * 5.0) * (1.0 - m); \
   if (m > .0) { belt = m; which = k; bu = s / baH[k]; pinch = mix(pinch, 1.0, m); } }
  BA_FIVE(BA_SKIN)
  BA_IF(belt > .0) {
   float al = atan(w.z, w.x * baN[which].y - w.y * baN[which].x + 1e-5);
   at0 = vec2(fract(al / TAU + .5), .1 + .2 * float(which));
   vec3 web = baWeb(which, bu, al, .0);
   more = (baWeb(which, bu, al, 1.0) - web) * belt;
   alb = mix(alb, web, belt);
   shine *= 1.0 - belt;
  }
  vec3 glow = baDye(4) * uHits * near;
  float hol = pinch * sat(1.0 + f0 * 8.0 * (1.0 - belt) * (1.0 - shine));
  float sh = mix(.35, 1.0, pinch), d = baBody(q + n0 * .22);
#define BA_SHADE(k) sh *= 1.0 - .7 * baStrap(k, q + n0 * .01, baL, .02, uv);
  BA_IF(dot(n0, baL) > -.1 && n0.z < .0) { BA_FIVE(BA_SHADE) }
  float ao = sat(.35 + d / .3) * hol;
  BA_IF(baB) { sh *= baShut(q + n0 * .01); ao *= 1.0 - .5 * smoothstep(-1.1, -.1, q.z); }
  if (dot(n0, baL) > -.1) sh *= baShade(q + n0 * .03, mix(5.5, 15.0, uTone));
  vec3 li = baLightAt(n, sh, ao), c = alb * li;
  more *= li * cover;
  c += alb * alb * .6 * (1.0 - ao) * (.3 + sh);
  if (uOwn[4] > .0) {
   vec3 rf = reflect(normalize(rd), n);
   float lamp = dot(rf, baL), f = 1.0 + dot(normalize(rd), n);
   float env = (mix(.12, .62, smoothstep(-.35, .25, rf.y + .25 * noise(rf * 3.0))) + .5 * smoothstep(.3, .9, rf.x * .6 + rf.y)) * (1.0 - .75 * baUp(uOwn[5])) * ao + (.7 * smoothstep(.55, .8, lamp) + 2.5 * smoothstep(.93, .97, lamp)) * (.25 + .75 * sh);
   c = mix(c, (sqrt(alb) * (1.0 - .5 * f * f * f) + .5 * f * f * f) * env * 1.25 * vec3(1.0, .98, .95), uOwn[4] * (1.0 - .8 * belt));
  }
  if (uOwn[4] < .0) { float f = 1.0 + dot(normalize(rd), n0); c = mix(c, c * (.85 + .3 * noise(baSkew(w * 23.0))) + alb * f * f * (.5 + sh) * .9 * ao, -uOwn[4]); }
  if (uOwn[6] < .0) { float f = sat(-dot(normalize(rd), n)); c = mix(c, (baCl * (.35 + 1.9 * f * f) + .5 * baCl * baCl * f * f * f) * (.7 + .6 * uPad + .4 * uLevel + .3 * uCue) * (.4 + .6 * hol), -uOwn[6] * (1.0 - .85 * belt)); }
  c += alb * glow * 3.0 + .5 * shine * pow(sat(dot(n, normalize(baL - rd))), 40.0) * sh;
  col = mix(col, c, cover);
 }
 col += more * sat(piece(at0).a * g);
 // the walls' sharp edges, drawn soft
 BA_IF(baB) {
  vec3 s = vec3(h.x - baGap.x, baGap.yz - h.yz);
  float e = min(min(s.x, s.y), s.z);
  vec2 a = e == s.x ? vec2(.745, tw.x) : e == s.y ? vec2(.525, tw.y) : vec2(.63, tw.z);
  e = sat(1.0 - e / (.75 * baPx)) * step(.0, e) * step(baF, ro.y + rd.y * a.y) * (tb < a.y ? 1.0 - cover : 1.0);
  col = mix(col, a.x * baLightAt(vec3(.0, .0, -1.0), 1.0, .9) * (1.0 - .14 * smoothstep(-2.0, 3.0, h.x)), e);
 }
 // the slack ends and the buckles
 BA_IF(near) {
#define BA_END(k) { float m = baStrap(k, ro, rd, baPx, uv); if (m > .0) { which = k; best = m; at = uv.xy; } if (dot(uv.yz, uv.yz) < .03) { on = k; o = vec2(uv.z, -uv.y); } }
  int which = -1, on = -1;
  vec2 at = vec2(.0), o = at;
  BA_FIVE(BA_END)
  BA_IF(which >= 0) col = mix(col, baWeb(which, at.x, at.y, .3) * baLightAt(normalize(vec3(.3 * at.x, .15, -1.0)), .9, .9), best);
  BA_IF(on >= 0) {
   vec2 d = normalize(vec2(baN[on].y, -baN[on].x));
   o = vec2(dot(o, d), dot(o, vec2(-d.y, d.x)));
   float h = baH[on] * 1.12;
   vec2 a = abs(o) - vec2(h * .72, h) + .018;
   float f = length(max(a, .0)) + min(max(a.x, a.y), .0) - .018;
   float m = BA_DOWN(baPx, -baPx, abs(f + .009) - .011);
   m = max(m, BA_DOWN(baPx, -baPx, max(abs(o.y) - .007, abs(o.x) - h * .66)));
   col *= 1.0 - .35 * BA_DOWN(.02, -.01, abs(f + .01)) * (1.0 - m);
   col = mix(col, mix(vec3(.26, .23, .19), vec3(1.0, .95, .85), smoothstep(.2, 1.0, .5 - (o.x - o.y) / h * .5) * .7), m);
  }
 }
 col = 1.0 - exp(-1.4 * max(col, .0));
 return pow(col, vec3(.4545));
}
