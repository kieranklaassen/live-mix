// name: One-sided road
// a: Twisted lane
// b: Knotted canal
// what: A broad band of land hangs in a pale morning sky with one half turn in it: a lane, striped fields, red roofs, poplars, washing and a yellow bus; where the land rolls over, houses stand sideways and the lane runs on along what was beneath. Or a stone canal on arches tied in a knot over evening mist, with lamps and barges.
// follows: The bus goes twice round, both faces, in one loop; barges drift on. The piece flowers in the fields or tints the water. Each kind lights its houses or lamps; bands raise poplars or brighten lamps; pad brings cloud or mist. A hit puffs chimneys or rings the water; a cue turns it and sends light round. Keys open flowers or glints, a voice lights windows.
// own: 0 deep snow at -1, autumn or thick moss at 1; 1 moonlit night at -1, rose evening over the lane or clear morning over the canal at 1; 2 a narrow way at -1, a broad one at 1; 3 seen edge on or from close by the water at -1, from high above at 1; 4 bare fields or a thread of water at -1, tall houses or deep walls at 1; 5 the land rolled to stand like a wall at -1, turned under at 1, the knot pressed flat at -1, pulled high at 1.
const float osN = 60., osM = 48.; // plots along both faces; arches of the canal
vec2 osP;                 // the roll of the band where it is nearest
float osFat, osCut, osW, osBuild, osPx, osInk, osGlow, osGlowK;
float osR1, osR2, osDeep; // the canal: how far it swings out, up, how deep its arches
vec3 osSun; vec4 osB;
// what was met: 0 ground, 1 wall, 2 roof, 3 tree, 4 bus, 5 lamp, 6 chimney, 7 boat, 8 water, 9 washing
int osIt; vec3 osQ, osSize, osTree; vec2 osF, osD; float osS, osU, osH, osR, osLen, osId, osLamp, osTop;

float osBox(vec2 d) { return length(max(d, .0)) + min(max(d.x, d.y), .0); }
float osBox3(vec3 d) { return length(max(d, .0)) + min(max(d.x, max(d.y, d.z)), .0); }
float osGap(float a, float b) { return fract(a - b + .5) - .5; }
float osUp(float lo, float hi, float x) { x = sat((x - lo) / (hi - lo)); return x * x * (3. - 2. * x); }
float osIn(float d, float e) { return 1. - smoothstep(-e, e, d); }
vec3 osVivid(float k) { vec3 c = kindColour(k); return c / max(max(c.r, max(c.g, c.b)), .1); }
float osKind(float k) { return k < .5 ? uDrone : k < 1.5 ? uPad : k < 2.5 ? uTexture : k < 3.5 ? uPhrase : uHits; }
// Which way round, and half that turn.
vec2 osTurn(vec3 p) {
 osR = length(p.xz) + 1e-4; osD = p.zx / osR;
 vec2 k = sqrt(max(vec2(1. + osD.x, 1. - osD.x) * .5, .0)), j = vec2(.5 * abs(osD.y) / max(k, .5));
 k = osD.x > .0 ? vec2(k.x, j.x) : vec2(j.y, k.y);
 return vec2(k.x, osD.y < .0 ? -k.y : k.y);
}
// The turn as a number, -.5 to .5.
float osRound(vec2 k) { float x = k.y / (1. + k.x), y = x * x; return x * (.63338 + y * (.05028 * y - .18366)); }
// Across and above the band, which rolls over once as it goes round.
vec2 osRoll(vec3 p, vec2 k) {
 osF = vec2(k.x * osP.x - k.y * osP.y, k.y * osP.x + k.x * osP.y); vec2 q = vec2(osR - 1., p.y);
 return vec2(dot(osF, q), osF.x * q.y - osF.y * q.x);
}
float osShellA(vec3 p) { return osBox(abs(osRoll(p, osTurn(p))) - vec2(osW, .19 + .1 * max(osBuild, .0))) * .9; }
float osFarA(vec3 p) { return osBox(abs(osRoll(p, osTurn(p))) - vec2(osW, .03)); }
// How far the nearest thing is, asked all along the way, and what it is, asked at the end.
#define OS_FAR(d, i, v) best = min(best, d);
#define OS_WHAT(d, i, v) { float y = d; if (y < best) { best = y; osIt = i; osQ = v; } }
// What stands on the land: c counts plots along, len is how long one is, up and u are above and across. A house or washing
// on a plot; between two, a poplar as tall as its band is loud, or a lamp by the lane.
#define OS_PLOT(NAME, T) float NAME(float c, float len, float up, float u) { \
 float au = abs(u), side = u < .0 ? 1. : .0, best = max(up, au - osW); \
 osIt = 0; osId = floor(c); \
 vec2 h = hash22(vec2(osId + 3., side * 7. + 1.)); \
 vec3 a = vec3((fract(c) - .45 - .1 * h.x) * len, up + .3 * max(-1.6 * osBuild - .6 * h.y, .0), au - .15 - max(osW - .25, .0) * h.y); \
 a = h.x > .5 ? a.zyx : a; \
 float kind = fract(h.y * 5.), no = kind < .7 ? .0 : 9., cl = kind > .7 && kind < .84 ? .0 : 9.; \
 vec3 s = vec3(.038 + .024 * h.y, (.075 + .05 * fract(h.x * 7.)) * (1. + max(osBuild, .0) * (.4 + h.y)), .034); \
 osSize = s; \
 vec2 w = abs(a.xz) - s.xz; float m = max(w.x, w.y) + no, slope = (a.y + .8 * abs(a.z) - s.y) * .78; \
 T(max(m, slope), 1, a) \
 T(max(m - .01, abs(slope) - .006), 2, a) \
 T(max(max(abs(a.x - s.x * .5), abs(a.z)) - .008, abs(a.y - s.y) - .026) + no, 6, a) \
 float ax = abs(a.x), sway = .012 * sin(uTime + h.x * 40. + a.x * 30.) * sat(1. - a.y * 12.); \
 T(cl + .8 * min(max(max(max(ax - .056, abs(a.y - .052) - .02), abs(a.z + sway) - .0015 - osFat), .005 - osFat - abs(fract(a.x * 36. + .5) - .5) / 36.), max(max(abs(ax - .062), abs(a.z)) - .002, a.y - .08)), 9, a) \
 float c2 = mod(c + .5, osN), x = (fract(c2) - .5) * len; vec2 g = hash22(vec2(floor(c2), side + 40.)); \
 float b = fract(g.y * 11.); b = b < .5 ? (b < .25 ? osB.x : osB.y) : b < .75 ? osB.z : osB.w; \
 s = vec3(.02 + .012 * fract(g.x * 31.), .05 + .04 * g.y + .04 * b, .0).xyx; osTree = s; \
 vec3 t = vec3(x, up + .01 - s.y, au - .125 - (osW - .17) * fract(g.x * 13.)); \
 T((length(t / s) - 1.) * s.x * .9 + (g.x < .66 ? .0 : 9.), 3, t) \
 t = vec3(x, up - .095, au - .082); \
 no = g.x > .66 && side > .5 && osFat < .001 ? .0 : 9.; \
 osLamp = length(t + vec3(.0, .0, .012)) + no; \
 T(min(max(max(abs(t.x), abs(t.z)) - .0022 + no, t.y), osLamp - .008), 5, vec3(osLamp)) \
 return best; }
OS_PLOT(osPlot, OS_FAR)
OS_PLOT(osPlotIs, OS_WHAT)
#define OS_LAND(NAME, PLOT, T) float NAME(vec3 p) { \
 vec2 k = osTurn(p), q = osRoll(p, k); \
 osS = .25 + .5 * osRound(k) + (q.y < .0 ? .5 : .0); \
 osU = q.y < .0 ? -q.x : q.x; osH = abs(q.y); osLen = 2. * TAU / osN * osR; \
 float best = PLOT(osS * osN, osLen, osH - .03, osU); \
 vec3 b = vec3(osGap(osS, uLoop) * 2. * TAU * osR, osH - .067, osU - .03); \
 T(osBox3(abs(b) - vec3(.06, .027, .017)) - .005, 4, b) \
 return best; }
OS_LAND(osMapA, osPlot, OS_FAR)
OS_LAND(osIsA, osPlotIs, OS_WHAT)
// Across and above the nearer strand of the knot; z is which strand, w how much it slants.
vec4 osKnot(vec3 p, out vec2 k) {
 k = osTurn(p);
 float c = k.x * (4. * k.x * k.x - 3.), s = k.y * (3. - 4. * k.y * k.y);
 vec2 q = vec2(osR - 1., p.y), m = vec2(osR1 * c, osR2 * s);
 float g = dot(q + vec2(.0, .5 * osDeep - .04), m);
 osCut = abs(g) / length(m) + .07 + .2 * abs(m.x); g = g > .0 ? 1. : -1.;
 osF = vec2(-osR1 * s, osR2 * c) * 1.5 * g; // the way the strand runs: out, up
 q -= g * m;
 float sl = osF.x / max(osR, .4), n = inversesqrt(1. + sl * sl), climb = osF.y / max(osR, .4);
 return vec4(q.x * n, q.y * inversesqrt(1. + climb * climb), g, n);
}
float osFarB(vec3 p) { vec2 k; vec4 v = osKnot(p, k); return osBox(abs(vec2(v.x, v.y + .5 * osDeep)) - vec2(osW, .5 * osDeep + .03)); }
float osShellB(vec3 p) { vec2 k; vec4 v = osKnot(p, k); return min(osBox(abs(vec2(v.x, v.y + .5 * osDeep - .04)) - vec2(osW + .02, .5 * osDeep + .1)) * .62, osCut); }
// The trough of stone, its wall and its arches: along, above, across.
float osStone(vec3 q, float len) {
 float au = abs(q.z), ra = (.36 - .2 * max(osBuild, .0)) * len, hc = -.07 - ra, low = max(hc - q.y, .0);
 float best = max(max(au - osW, abs(q.y + .01) - .045), -max(au - osW + .04, -q.y));
 best = min(best, max(au - osW - .01, abs(q.y + .05) - .008));
 float arch = low > .0 ? abs(q.x) - ra - .1 * len * low * low / (osDeep * osDeep) : length(vec2(q.x, q.y - hc)) - ra;
 return min(best, max(max(au - osW + .015, max(q.y + .04, -q.y - .07 - osDeep)), -arch));
}
// Water in the trough, lamps on the piers, left and right by turns, and five barges.
#define OS_CANAL(NAME, T) float NAME(vec3 p) { \
 vec2 k; vec4 v = osKnot(p, k); \
 osS = fract(.5 * osRound(k) + (v.z < .0 ? .5 : .0)); \
 osU = v.x; osH = v.y; osLen = TAU / osM * 2. * osR / v.w; \
 float c = osS * osM, au = abs(v.x), best = osStone(vec3((fract(c) - .5) * osLen, osH, osU), osLen); \
 osIt = 0; osQ = vec3(.0); \
 T(max(osH - .005, max(au - osW + .03, -osH - .02)), 8, vec3(.0)) \
 float c2 = mod(c + .5, osM); osId = floor(c2); \
 vec3 l = vec3((fract(c2) - .5) * osLen, osH - .115, osU * (mod(osId, 2.) - .5) * 2. - osW + .02); \
 osTop = l.x; osLamp = length(l); \
 T(.6 * min(max(length(l.xz) - .002, abs(l.y + .06) - .06), osLamp - .009), 5, vec3(osLamp)) \
 vec3 b = vec3((fract(osS * 5. - uLoop) - .5) * osLen * osM / 5., osH - .014 - .002 * sin(uTime * .9), osU); \
 float e = b.x / .16, wide = max(.052 * (1. - e * e * e * e), .0), hull = max(max(abs(b.z) - wide, abs(b.x) - .16), abs(b.y) - .022 - .014 * e * e); \
 hull = max(hull, -max(max(abs(b.z) - wide + .007, abs(b.x) - .145), .006 - b.y)); \
 T(min(hull * .8, osBox3(abs(b - vec3(-.045, .024, .0)) - vec3(.06, .032, .03)) - .003), 7, b) \
 l = b - vec3(.115, .08, .0); e = length(l); \
 T(min(max(length(l.xz) - .0025, abs(l.y + .045) - .045), e - .012), 5, vec3(-e)) \
 osId = e < osLamp ? 3. : osId; osLamp = min(osLamp, e); \
 return best; }
OS_CANAL(osMapB, OS_FAR)
OS_CANAL(osIsB, OS_WHAT)
// The way to the first thing met, or -1; a dark line where it grazes an edge, and how near it passed a lamp.
#define OS_MARCH(NAME, SHELL, MAP, N, K) float NAME(vec3 ro, vec3 rd, float t, float far) { \
 float last = 1., hit = -1., d = 1.; \
 for (int i = 0; i < N && t < far && hit < .0; i++) { \
  for (int j = 0; j < 9 && t < far; j++) { d = SHELL(ro + rd * t); if (d < .02) break; t += d; } \
  float e = osPx * t; osLamp = 9.; d = d < .02 ? min(MAP(ro + rd * t) * K, .06) : d; \
  osGlowK = osLamp < osGlow ? osId : osGlowK; osGlow = min(osLamp, osGlow); \
  float y = d * d / (2. * last + 1e-5), near = d < last * 1.8 ? sqrt(max(d * d - y * y, .0)) : 9.; \
  if (d < e * .75) hit = t; else if (d > last) osInk = max(osInk, 1. - near / (e * 1.6)); \
  last = d; t += d; } \
 return hit; }
OS_MARCH(osGoA, osShellA, osMapA, 36, .92)
OS_MARCH(osGoB, osShellB, osMapB, 46, .8)

float osFleece(vec2 q) { return .54 * noise(q) + .27 * noise(q * 2.03 + 7.1); }
vec3 osSky(vec3 rd, vec3 c0, vec3 c1, vec3 sc, float glow) {
 float sun = max(dot(rd, vec3(-.75, .12, -.65)), .0); sun *= sun;
 vec3 c = mix(c0, c1, osUp(-.5 + .55 * glow, .3 + .2 * glow, rd.y));
 return mix(mix(c, c1 * .75 + c0 * .15, glow * osUp(-.25, -.85, rd.y)), sc, glow * sun * sun * osUp(-.5, .0, rd.y));
}
// The face of a box that is met, q from its middle in its halves.
vec3 osFace(vec3 q) { q *= q * q * q * q; return normalize(q + vec3(.0, 1e-5, .0)); }
vec3 render(vec2 p) {
 bool canal = uVar > .5;
 float snow = max(-uOwn[0], .0), warm = max(uOwn[0], .0), night = max(-uOwn[1], .0), day = max(uOwn[1], .0), up5 = uOwn[5];
 float turn = .14 * 4. * uCue * (1. - uCue), F = 1.35 * mix(.62, 1., osUp(.2, .8, .5 * uRes.x / uRes.y));
 osBuild = uOwn[4]; osPx = 1. / (uRes.y * F); osB = vec4(band(.08), band(.35), band(.6), band(.85)); osInk = osFat = .0; osGlow = 9.; osGlowK = .0;
 osW = canal ? .14 + .06 * uOwn[2] : .4 + (uOwn[2] < .0 ? .17 : .08) * uOwn[2];
 osP = vec2(cos(-.15 + 1.2 * up5), sin(-.15 + 1.2 * up5));
 osR1 = .47 + .06 * up5; osR2 = .3 + .1 * up5; osDeep = .26 + (uOwn[4] < .0 ? .22 : .3) * uOwn[4];
 // the hour
 vec3 c0 = canal ? mix(vec3(.9, .74, .68), vec3(.96, .95, .9), day) : mix(vec3(.99, .92, .82), vec3(1., .7, .52), day);
 vec3 c1 = canal ? mix(vec3(.38, .45, .66), vec3(.6, .78, .9), day) : mix(vec3(.62, .8, .92), vec3(.62, .62, .8), day);
 vec3 sc = canal ? mix(vec3(.95, .52, .26), vec3(.7, .6, .46), day) : mix(vec3(.82, .69, .48), vec3(.85, .45, .2), day);
 c0 = mix(c0, vec3(.27, .34, .54), night); c1 = mix(c1, vec3(.1, .15, .34), night); sc = mix(sc, vec3(.3, .36, .5), night);
 // the eye
 vec3 ro = canal ? vec3(.15, 1.25 + .8 * uOwn[3], 2.2 - .7 * max(uOwn[3], .0)) : vec3(.0, .75, 2.1), ta = canal ? vec3(.0, -.12, .15) : vec3(.0, .05, .0);
 vec3 w = normalize(ta - ro), uu = normalize(cross(w, vec3(.0, 1., .0))), v = cross(uu, w), rd = normalize(p.x * uu + p.y * v + F * w);
 // the sky: cloud, or mist lying in bars
 float dr = uTravel * .0004 + uTime * .0001;
 vec2 cq = (canal ? vec2(p.x * 1.2, p.y * 7.) : vec2(p.x * 1.5 + .4 * p.y, p.y * 2.7)) + 40. * vec2(cos(dr), sin(dr));
 float lo = osFleece(cq), c = lo + .14 * noise(cq * 4.1 + 3.3), body = osUp(.46, .6, c + .05 * uPad), slope = osUp(-.1, .12, lo - osFleece(cq + vec2(.2, .1)) + .02);
 vec3 back = osSky(rd, c0, c1, sc, canal ? .8 - .64 * night : .0), white = mix(vec3(1., .95, .88), osVivid(1.), .1 * uPad);
 vec3 cloud = mix(c1 * .7 + .22, mix(white, sc, .2), slope) * (1. - .5 * night), mist = mix(c0, vec3(dot(c0, vec3(.34))) * vec3(1.1, 1.12, 1.2), .4);
 back = canal ? mix(back, mist, osUp(.4, .7, c) * osUp(.1, -.35, rd.y) * .7) : mix(back, cloud, .85 * body);
 vec2 sg = p * 60.; float sh0 = hash21(floor(sg));
 back += night * (1. - body) * step(.93, sh0) * osIn(length(fract(sg) - .5) - .06, .05) * (.5 + .5 * sin(uTime * .7 + sh0 * 900.)) * vec3(.7, .75, .8) * osUp(-.1, .1, rd.y + (canal ? .0 : .4));
 // the land is hung askew in it
 osSun = normalize(canal ? vec3(-.75, .35, -.2) : vec3(.8, .42, .25));
 mat2 tz = rot(canal ? .0 : .44), tx = rot(canal ? .0 : -.2 - .55 * uOwn[3]), ty = rot(turn);
 ro.xy *= tz; rd.xy *= tz; osSun.xy *= tz; ro.yz *= tx; rd.yz *= tx; osSun.yz *= tx; ro.xz *= ty; rd.xz *= ty; osSun.xz *= ty;
 float bb = dot(ro, rd), big = canal ? 1.3 + osR1 + osW : 1.2 + osW, disc = sqrt(max(bb * bb - dot(ro, ro) + big * big, .0));
 float t0 = max(.05, -bb - disc), t1 = disc > .0 ? disc - bb : -1.;
 float tA = osGoA(ro, rd, t0, canal ? -1. : t1), t = osGoB(ro, rd, t0, canal ? t1 : -1.);
 t = max(t, tA); bool met = t > .0;
 float ink = osInk, glow = exp(-osGlow * 76.), gk = mod(osGlowK, 5.);
 vec3 x = ro + rd * (met ? t : 3.), q, m = vec3(.0, 1., .0), sz; int it;
 if (canal) osIsB(x); else osIsA(x);
 it = osIt; q = osQ; sz = osSize; float plot = osId;
 float s = osS, u = osU, h = osH, len = osLen, lx = osTop, au = abs(u), us = u < .0 ? -1. : 1., lamp = q.x, sl = q.y + .8 * abs(q.z) - sz.y;
 // which way is along, above and across there, and which way the thing met faces
 vec3 er = vec3(osD.y, .0, osD.x), et = vec3(osD.x, .0, -osD.y), eh, eu, aq = abs(q) - sz;
 if (canal) {
  et = normalize(et * osR + er * osF.x + vec3(.0, osF.y, .0)); eu = normalize(vec3(-et.z, .0, et.x)); eu *= dot(eu, er) < .0 ? -1. : 1.;
  eh = cross(eu, et); eh *= eh.y < .0 ? -1. : 1.;
 } else { eh = vec3(.0, osF.x, .0) - er * osF.y; eu = vec3(.0, osF.y, .0) + er * osF.x; float fl = s > .5 ? -1. : 1.; eh *= fl; eu *= fl; }
 float px = (fract(s * osM) - .5) * len, ra = (.36 - .2 * max(osBuild, .0)) * len, hc = -.07 - ra, hid = hash22(vec2(osId + 3., u < .0 ? 8. : 1.)).x;
 bool edge = !canal && it == 0 && au - osW > h - .03, far1 = aq.x > aq.z;
 vec3 fx = vec3(sign(q.x), .0, .0), fz = vec3(.0, .0, sign(q.z)), fy = vec3(.0, .78, .62 * sign(q.z));
 if (it == 0) m = canal ? (h > .03 ? m : au > osW - .02 ? vec3(.0, .0, us) : h < -.06 ? normalize(vec3(-px, min(hc - h, .0) * (h > hc ? 1. : .0), 1e-4)) : vec3(.0, .0, -us)) : edge ? vec3(.0, .0, us) : m;
 else if (it == 1) m = max(aq.x, aq.z) > sl * .78 ? (far1 ? fx : fz) : fy;
 else if (it == 2) m = max(aq.x, aq.z) - .01 > abs(sl * .78) - .006 ? (far1 ? fx : fz) : fy * sign(sl);
 else if (it == 3) m = normalize(q / (osTree * osTree) + 1e-4);
 else if (it == 7 && q.y < .012) m = vec3(.0, .3, .95 * us);
 else if (it == 4 || it == 6 || it == 7) m = osFace(it == 4 ? q / vec3(.065, .032, .022) : it == 6 ? vec3(q.x - sz.x * .5, (q.y - sz.y) * .3, q.z) / .008 : (q + vec3(.045, -.024, .0)) / vec3(.063, .035, .033));
 else if (it == 9) m = vec3(.0, .0, 1.);
 if (hid > .5 && (it == 1 || it == 2 || it == 6 || it == 9)) m = m.zyx;
 if (!canal && it != 0) m.z *= us;
 vec3 n = m.x * et + m.y * eh + m.z * eu; n *= dot(n, rd) > .0 ? -1. : 1.;
 float ndl = dot(n, osSun), sh = met && ndl > .0 ? 1. : .0, st = .02, pw = osPx * max(t, .1) * 1.3 / max(-dot(n, rd), .2);
 // shade: from what stands near by, then from the far side of the loop
 vec3 ls = vec3(dot(osSun, et), dot(osSun, eh), dot(osSun, eu));
 osFat = .012;
 for (int i = 0; i < 7 && !canal && sh > .02 && st < .3; i++) { float d = osPlot(mod(s * osN + ls.x * st / len, osN), len, h - .026 + ls.y * st, u + ls.z * st); sh = min(sh, sat(.5 + 12. * d / st)); st += clamp(d, .012 + .2 * st, .09); }
 for (int i = 0; i < 4 && canal && sh > .02 && st < .3; i++) { float d = osStone(vec3((fract((px + ls.x * st + m.x * .006) / len + .5) - .5) * len, h + m.y * .006 + ls.y * st, u + m.z * .006 + ls.z * st), len); sh = min(sh, sat(.5 + 12. * d / st)); st += clamp(d, .03, .1); }
 for (int i = 0; i < 5 && sh > .02 && st < 2.6; i++) { vec3 y = x + osSun * st; float d = canal ? osFarB(y) : osFarA(y); sh = min(sh, sat(.5 + 14. * d / st)); st += max(d, .1); }
 float pier = floor(s * osM + .5), kk = canal ? mod(pier, 5.) : it == 9 ? mod(floor(q.x * 36. + .5) + 20., 5.) : mod(floor(plot / 3.), 5.);
 if (canal && lamp < .0) kk = 3.;
 float loud = osKind(kk), grain = noise(it == 3 ? vec2(q.x - q.z, q.y * .7) * 170. : canal ? vec2(s * 300., h * 20.) : vec2(s * 900., u * 70. + h * 160.));
 vec3 alb = vec3(.35, .36, .4), own = vec3(.0), kc = osVivid(kk), lc = mix(vec3(1., .72, .36), kc, .28);
 vec4 pc = piece(vec2(s, sat(.5 + .5 * u / osW))); pc *= osUp(.0, .02, s) * osUp(1., .98, s);
 vec3 bloom = pc.rgb / max(max(pc.r, max(pc.g, pc.b)), .04);
 float lit = (.4 + 1.3 * loud + .6 * osB[int(mod(pier, 4.))] + night) * (.5 + uEnergy), side = u * (mod(pier, 2.) - .5) * 2. - osW + .02, hh = fract(hid * 17.);
 if (it == 0 && canal) {
  float course = h * 42., ci = floor(course), bx = s * osM * 5. + .5 * mod(ci, 2.);
  alb = vec3(.8, .72, .65) * (.85 + .22 * hash21(vec2(floor(bx), ci)));
  alb *= 1. - .3 * max(osUp(.4, .5, abs(fract(course) - .5)), osUp(.42, .5, abs(fract(bx) - .5))) * osIn(pw - .008, .004);
  alb = mix(alb, mix(vec3(.42, .5, .34), vec3(.48, .62, .26), warm), (.5 + .5 * warm) * osUp(.55 - .3 * warm, .75 - .3 * warm, grain + .1 * uTexture) * osUp(.1 + .2 * warm, -.15, h));
  alb = mix(alb, vec3(.97), snow * osUp(.2, .7, m.y));
 } else if (edge) {
  alb = mix(vec3(.6, .44, .34), vec3(.8, .68, .55), grain);
  alb = mix(alb, mix(vec3(.45, .56, .28), vec3(.96), snow), osUp(.006, .02, h - .014 * grain));
 } else if (it == 0) {
  float f = s * osN * .5, fh = hash21(vec2(floor(f), u < .0 ? 3. : 5.)), ff = abs(fract(f) - .5);
  vec3 crop = fh < .3 ? vec3(.66, .78, .4) : fh < .55 ? vec3(.99, .87, .52) : fh < .75 ? vec3(.54, .69, .4) : vec3(.86, .86, .6);
  crop = mix(crop, mix(vec3(.7, .5, .34), vec3(.97, .75, .38), fract(fh * 7.)), .85 * warm);
  bool along = fract(fh * 9.) < .55;
  float row = along ? au * 52. : s * osN * 11., rw = pw * (along ? 52. : 11. * osN / (2. * TAU)), rr = abs(fract(row) - .5), keen = osIn(rw - .5, .25);
  crop *= 1. + .14 * (rr * 4. - 1.) * keen;
  // the piece in flower, row by row
  crop = mix(crop, bloom * .6 + .35, sat(pc.a * 1.6) * mix(.45, osUp(.3, .1, rr) * (.6 + .4 * grain), keen * .8) * .7);
  alb = mix(vec3(.65, .73, .43), crop, osUp(.118 - pw, .118 + pw, au));
  alb = mix(alb, vec3(.36, .5, .3), .8 * osIn(.5 - ff - .03, .02) * osUp(.118, .13, au)) * (.93 + .14 * grain);
  alb = mix(alb, vec3(.95), .88 * snow);
  alb = mix(alb, vec3(1., .95, .8), uKeys * osUp(.66, .8, grain) * osUp(.085, .1, au));
  alb = mix(alb, vec3(.94, .88, .76), osIn(au - .085, pw));
  alb = mix(alb, vec3(.64, .64, .69) + .16 * snow, osIn(au - .062, pw));
  alb = mix(alb, vec3(.98, .97, .93), osIn(au - .0035, pw * .7) * osUp(-.15, .15, sin(s * TAU * osN * 3.)));
 } else if (it == 1) {
  float wx = far1 ? q.z : q.x, hw = far1 ? sz.z : sz.x;
  float pane = osIn(max(abs(abs(wx) - hw * .52) - .008, abs(mod(q.y, .042) - .023) - .011), pw) * step(q.y + .02, sz.y - (far1 ? abs(wx) : .02));
  alb = mix(hh < .4 ? vec3(.97, .86, .7) : vec3(.99, .95, .88), vec3(.36, .42, .5), pane);
  alb = mix(alb, kc * .6, osIn(max(abs(wx) - .008, q.y - .03), pw));
  own = pane * mix(vec3(1., .75, .4), kc, .5) * (1.1 * loud * (.5 + uEnergy) + step(.3, hh) * (.8 * night + .7 * uMic));
 } else if (it == 2) alb = mix(mix(vec3(.86, .36, .25), kc * .7 + vec3(.2, .05, .0), .12 + .25 * loud), vec3(.97), .92 * snow);
 else if (it == 3) alb = mix(mix(vec3(.35, .5, .27), vec3(.76, .46, .18), .85 * warm) * (.85 + .7 * grain), vec3(.78, .81, .87), snow * .7);
 else if (it == 4) {
  float win = osIn(abs(q.y - .011) - .008, pw) * osUp(.1, .2, abs(fract(q.x * 36.) - .5));
  alb = mix(vec3(1., .79, .16), vec3(.25, .33, .42), win); own = win * vec3(1., .8, .45) * (.25 * uLevel + night);
  alb = mix(alb, vec3(.2), osIn(length(vec2(abs(q.x) - .037, q.y + .028)) - .011, pw));
 } else if (it == 5) own = step(abs(lamp), .012 + 1.3 * osPx * t) * (canal ? lc * (lamp < .0 ? .9 + uPhrase + uHits : .7 + .2 * lit) : vec3(1., .85, .6) * (.4 + night));
 else if (it == 6) alb = vec3(.7, .48, .4);
 else if (it == 7) {
  alb = mix(q.y > .014 ? vec3(.78, .32, .24) : vec3(.2, .27, .34), vec3(.97), .8 * snow * step(.5, m.y));
  own = osIn(max(abs(abs(q.x + .045) - .026) - .011, abs(q.y - .032) - .009), pw) * step(.5, abs(m.z)) * vec3(1., .7, .35) * (.7 + uMic);
 } else if (it == 9) alb = mix(vec3(.97, .95, .92), kc, .2 + .4 * loud);
 vec3 amb = canal ? mix(c0 * .75, c1, .5 + .5 * n.y) * .72 : mix(c0 * vec3(.5, .54, .62), c1 * vec3(.66, .72, .88), .5 + .5 * n.y) * (it == 0 ? 1. : .72 + .28 * osUp(-.03, .06, h - .03));
 float pool = osUp(.5, .25, abs(lx) / len);
 if (canal) own += alb * lc * lit * .5 * pool * exp(-(lx * lx + side * side + h * h) * 200.);
 vec3 col = alb * (amb + sc * max(ndl, .0) * sh) + own;
 if (it == 8) {
  vec2 g = vec2(sin(x.x * 41. + 1.6 * sin(x.z * 23. + uTime * .4)), sin(x.z * 37. + 1.7 * sin(x.x * 29. - uTime * .3)));
  vec3 r = reflect(rd, normalize(vec3(g.x * .06, 1., g.y * .06))); r.y = abs(r.y);
  col = mix(vec3(.08, .16, .24) * (1. - .5 * night), osSky(r, c0, c1, sc, .7), .3 + .7 * (1. + min(rd.y, .0)) * (1. + min(rd.y, .0))) * mix(.6, 1., sh);
  col = mix(col, vec3(.86, .92, .97) * (c1 + .3), .7 * snow);
  col = mix(col, bloom * .8, .4 * sat(pc.a * 1.5) * (.7 + .3 * g.y));
  col += lc * lit * pool * exp(-lx * lx * 1800. + side * 10. + g.x * .6) * .4 + uKeys * osUp(1.3, 1.9, g.x + g.y) * vec3(.8, .75, .6);
 }
 // a hit: rings go out along the water from every barge
 float bx = (fract(s * 5. - uLoop) - .5) * len * osM / 5., ring = length(vec2(bx, u)) - .2 - .6 * (1. - uHits);
 if (it == 8) col += vec3(1., .85, .6) * uHits * exp(-ring * ring * 450.) * 1.6;
 // a cue sends light round
 float dc = osGap(s, 1. - .5 * uCue);
 col += (.2 + .8 * alb) * (vec3(.55, .45, .25) * uCue * exp(-dc * dc * 260.));
 if (canal) {
  float far = 1. - exp(-max(t - 1.65, .0) * (.2 + .25 * uSpace + .15 * uPad));
  col = mix(col, back, max(far, osUp(.0, -.8, x.y + .3 * (c - .5)) * .9));
 } else col = mix(col, mix(c0, c1, .6), (.12 + .3 * uSpace) * osUp(1., 3.2, t));
 col = met ? col : back;
 col = mix(col, mix(vec3(.22, .15, .18), vec3(.02, .03, .08), night), ink * .24);
 col += glow * (canal ? mix(vec3(1., .72, .36), osVivid(gk), .3) * (.22 + .4 * osKind(gk) + .3 * night + .4 * uMic) : vec3(1., .77, .45) * (.1 + .9 * night));
 // a hit: four chimneys puff
 for (int i = 0; i < 8 && !canal && uHits > .01; i++) {
  vec3 at = i < 2 ? vec3(12.6, -.28, .16) : i < 4 ? vec3(16.6, -.17, .15) : i < 6 ? vec3(12.6, .17, .15) : vec3(15.6, .29, .15); float go = 1. - uHits, j = float(i % 2), a = at.x / osN * 2. * TAU - PI;
  vec2 f = vec2(cos(.5 * a), sin(.5 * a)); f = vec2(f.x * osP.x - f.y * osP.y, f.y * osP.x + f.x * osP.y);
  vec3 e = vec3(sin(a), .0, cos(a)), y = e + (e * f.x + vec3(.0, f.y, .0)) * at.y + (vec3(.0, f.x, .0) - e * f.y) * (at.z + .02 + (.1 + .07 * j) * go) - ro;
  float al = dot(y, rd), r = .075 + .015 * j + .05 * go;
  if (tA < .0 || al < tA + .05) col = mix(col, vec3(.99, .96, .92) * (1. - .5 * night), .88 * sqrt(uHits) * (1. + min(osBuild, .0)) * osUp(1.1, -.2, (dot(y, y) - al * al) / (r * r)));
 }
 return mix(col, smoothstep(.0, 1., col), .3 * (uTone - .4));
}
