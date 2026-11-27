// name: Bent tubes
// a: Wall drawing
// b: By day
// what: One line of bent glass tube - a wave, a big loop, a leaf with its veins, a flourish - clipped to bare concrete, mostly grey and unlit until its gas glows and the colour falls on the wall; or a tangle of thin clear tube hung from two wires in a white workshop, window sun on the wall, a few lengths lit pale.
// follows: Drone is the loop, pad the wave, texture the leaf, phrase its veins, with keys and voice; by day each has a length of the tangle. Each glows as loud as it sounds, stronger where the piece is loud along the line, with a bright place at now. Bands brighten a bead in each tube. A hit lights the flourish or the inner ring; a cue runs along the whole line.
// own: 0 1 fern stems that curl (b: one pipe up and down), -1 rings (b: hung from one point); 1 1 many small copies, -1 laid down and running away (b: seen along the wall); 2 1 thick as rope, -1 thin; 3 1 pale day (b: a night room), -1 open dusk air (b: a wall in the drone's colour); 4 1 solid twisted stuff, -1 beads; 5 1 still water below, -1 sways like weed; 6 1 fivefold lines, -1 stitches; 7 the light on the wall: 1 leaf shade, -1 slats
float btStep(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3.0 - 2.0 * x); }
vec2 btStep(vec2 a, vec2 b, vec2 x) { x = sat((x - a) / (b - a)); return x * x * (3.0 - 2.0 * x); }
vec2 btStep(float a, float b, vec2 x) { return btStep(vec2(a), vec2(b), x); }
// The bends of both drawings, each going on from the last: radius (below 0 to the right), cosine of its turn, line before it.
const vec3 btArc[48] = vec3[48](vec3(.0976,-.75767,0.),vec3(-.0792,-.76816,.237),vec3(.0852,-.67733,.431),vec3(-1.947,.99106,.628),vec3(-.0803,-.89477,.889),vec3(-.043,-.54392,1.104),vec3(.1822,.48844,1.196),vec3(.3075,-.90268,1.39),vec3(.4578,.96479,2.219),vec3(.2712,-.39895,2.341),vec3(.7391,.74429,2.878),vec3(-.1411,.98499,3.419),vec3(.1296,-.03185,3.443),vec3(-.4671,.04556,3.651),vec3(-.089,-.20784,4.363),vec3(-.4955,.27618,4.522),vec3(.3329,.75424,5.161),vec3(.0374,-.52718,5.4),vec3(.0374,-.52718,5.479),vec3(.1154,.62936,5.559),vec3(-.1027,.56927,5.661),vec3(-.0421,-.43498,5.761),vec3(-.0421,-.43498,5.846),vec3(-.2418,.87123,5.931),vec3(.2269,.88138,6.055),vec3(.042,-.62578,6.167),vec3(.042,-.62578,6.261),vec3(.1748,.23168,6.355),vec3(.1566,-.23046,6.589),vec3(.0524,.59423,6.872),vec3(.0363,-.04918,6.921),vec3(.0363,-.04918,6.979),vec3(.1289,.31181,7.038),vec3(.13,-.95071,0.),vec3(.28,-.91617,.367),vec3(.19,-.85725,1.132),vec3(.19,-.85725,1.626),vec3(.28,-.15428,2.12),vec3(.28,-.15428,2.603),vec3(.19,-.37934,3.086),vec3(.23,-.06753,3.459),vec3(.23,-.06753,3.835),vec3(.16,-.7693,4.212),vec3(.28,-.99149,4.604),vec3(.13,-.78071,5.447),vec3(.19,.28646,5.768),vec3(-.13,-.82155,6.011),vec3(-.13,-.82155,6.341));
const float btAllA = 7.2, btAllB = 6.67;
const vec4 btC[7] = vec4[7](vec4(-.115,-.117,-.074,-.224), vec4(.19,-.335,.265,-.33), vec4(.489,-.163,.422,-.133), vec4(.489,-.163,.457,-.254), vec4(-.816,-.213,-.8,-.95), vec4(.77,-.311,.83,-.95), vec4(.686,.345,.722,.377));
const float btSag[7] = float[7](-.045, -.022, .033, .028, -.05, .05, .012);
const float btForm[96] = float[96](.06,.3,.2,.16,2.4,.36,2.5,.275,2.8,.196,3.,.111,-.14,.42,-.42,.28,-2.7,.499,-2.9,.334,-3.,.18,.1,.5,-.4,.2,-2.7,.365,-2.9,.246,-3.,.135,-.6,.1,.8,.12,-.8,.12,.8,.12,-.6,.12,.5,.1,2.2,.187,2.2,.145,2.2,.11,2.2,.081,2.2,.059,2.2,.04,.06,.38,2.6,.221,2.6,.161,2.6,.109,2.6,.062,.02,.46,-3.14,.195,-.02,.46,3.14,.195,.02,.46,-3.14,.195,-.02,.46,3.14,.195,.02,.46,-3.14,.195,-.02,.46,3.14,.195,.02,.46,-3.14,.195,-.02,.322);
const vec4 btFrom[14] = vec4[14](vec4(-.12,-.56,1.651,.771),vec4(.232,.362,2.571,1.215),vec4(-.3,-.56,1.621,1.172),vec4(.285,-.195,.971,1.811),vec4(.34,-.56,1.571,.83),vec4(-.192,.176,3.971,.937),vec4(.74,-.56,1.771,.912),vec4(.172,.035,1.771,.77),vec4(-.6,-.56,1.591,1.529),vec4(-.037,-.082,-.429,.926),vec4(-.46,-.33,1.571,.731),vec4(0.,.36,3.142,1.185),vec4(.033,.135,1.591,.743),vec4(0.,.36,3.142,1.333));
const float btRing[10] = float[10](.43,.345,.26,.175,.09,.39,.26,.15,.325,.2);
bool btDayOn, btNew;
float btT, btR, btZ, btSp;   // own: how thick, a tube's half width, where a run's lengths begin, how far apart its strands

vec4 btGas[5];  
vec3 btEnds[5];
float btPx; // a pixel
vec3 btN; // the wall's stains
float btAll, btCueAt, btCueOn, btNowOn, btBare;

float btBump(float x) { x = 1.0 + x * x; return 1.0 / (x * x); }
// Loose cable from a to b: how far q is from it, and r.
vec2 btCable(vec2 q, vec2 r, vec2 a, vec2 b, float c) {
  vec2 e = 0.5 * (b - a), m = 0.5 * (a + b), n = vec2(-e.y, e.x);
  float L = dot(e, e), k = inversesqrt(L);
  q -= m; r -= m;
  vec2 x = vec2(dot(q, e), dot(r, e)) / L, y = vec2(dot(q, n), dot(r, n)) * k, g = 2.0 * c * k * x;
  return abs(y - c * (1.0 - x * x)) * inversesqrt(1.0 + g * g) + 9.0 * max(abs(x) - 1.0,0.0);
}
vec3 btSlope(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f), du = 6.0 * f * (1.0 - f);
  float a = hash21(i), b = hash21(i + vec2(1,0)), c = hash21(i + vec2(0,1)), k = a - b - c + hash21(i + vec2(1,1));
  return vec3(a + (b - a) * u.x + (c - a) * u.y + k * u.x * u.y, du * vec2(b - a + k * u.y, c - a + k * u.x));
}
float btPits(vec2 q) {
  vec2 c = floor(q), o = hash22(c), v = fract(q) - 0.3 - 0.4 * o.yx;
  float r = o.x > 0.26 ? -1.0 : 0.05 + 0.15 * o.y * o.y * o.y, e = btPx * 21.0;
  return btStep(r + e, r - e, length(v)) * btStep(0.05,0.1,r);
}
vec2 btQ, btS, btSlant;
float btH, btSh, btCount, btReach;
vec3 btFall;                          // the light the tubes throw on the wall
vec4 btU0, btU1, btA0, btA1; // the last two tubes right here
// The kind that fills the tangle at a length along it (5 is none).
int btFills(float s) { return s > .366 && s < 1.131 ? 2 : s > 2.119 && s < 3.085 ? 0 : s > 3.458 && s < 4.211 ? 1 : s > 4.603 && s < 5.446 ? 3 : s > 6.01 && s < 6.669 ? 4 : 5; }
float btFold(float d) { return btSp > 0.0 ? d - btSp * clamp(floor(d / btSp + 0.5), -2.0, 2.0) : d; }
// Goes round one tube's bends, i to end, from a place and a way. Far from its box a tube does nothing.
void btRun(int i, int end, vec4 w, vec4 box, vec4 gas, vec3 ends, float k) {
  float m = abs(uOwn[0]), S = 1.0, z = btArc[i].z, turns = btDayOn ? 2.08 : 6.28 / float(end - i);
  if (m > 0.0) {                 // on its way to another drawing
    int j = 2 * (k < 4.5 ? int(k) : i < 40 ? 5 : 6);
    vec4 f = uOwn[0] > 0.0 ? btFrom[j] : btFrom[j + 1];
    float an = atan(w.w, w.z);
    S = 1.0 / mix(1.0, f.w, m);
    w.xy = mix(w.xy, f.xy, m); an = mix(an, f.z, m); w.zw = vec2(cos(an), sin(an));
    box = vec4(0.0, 0.0, 9.0, 9.0);
  }
  vec2 p = btQ - w.xy, b = btS - w.xy, way = w.zw, o = max(abs(btQ - box.xy) - box.zw, 0.0);
  if (m > 0.99 && !btDayOn) o = vec2(1.6 * max(uOwn[0] < 0.0 ? abs(length(btQ) - btRing[int(k)]) - 0.06 : abs(btQ.x - w.x) - 0.33, 0.0), 0.0);
  float fade = btStep(0.078,0.004,dot(o, o)), hh = btH * btH, sum = 0.0;
  float a0 = dot(p, way), v0 = dot(b, way), e0 = dot(p, p) + hh, r0 = a0 * inversesqrt(e0), cue = k < 4.5 ? btCueOn : 0.0;
  vec4 hu = vec4(0.0);
  vec3 ha = vec3(0.0);
  if (fade <= 0.0) end = i;
  if (uOwn[2] > 0.0 && end > i) btSh = min(btSh, length(b));
  for (; i < end; i++) {
    vec3 r = btArc[i];
    float mid = 0.4 * abs(r.x), tw;
    if (m > 0.0) {
      vec2 f = vec2(btForm[2 * i], btForm[2 * i + 1]);
      if (uOwn[0] < 0.0) f = turns * vec2(1.0, btRing[k < 4.5 ? int(k) : i / 3 - 6]);
      float th = f.x, len = f.y;
      if (m < 1.0) { th = acos(clamp(r.y, -1.0, 1.0)); len = mix(abs(r.x) * th, f.y, m); th = mix(r.x < 0.0 ? -th : th, f.x, m); }
      if (abs(th) < 0.01) th = th < 0.0 ? -0.01 : 0.01;
      tw = sin(0.5 * th); r = vec3(len / th, 1.0 - 2.0 * tw * tw, z); tw *= 2.0 * cos(0.5 * th); mid = 0.4 * len * S; z += len * S;
    }
    float R = abs(r.x), sn = sqrt(max(1.0 - r.y * r.y, 0.0)) * sign(r.x);
    if (m > 0.0) sn = tw;
    vec2 n = r.x * vec2(-way.y, way.x), u = p - n, us = b - n, way1 = vec2(way.x * r.y - way.y * sn, way.x * sn + way.y * r.y);
    p = u + r.x * vec2(-way1.y, way1.x); b = us + p - u;
    float l = length(u), d = l - R, a = dot(u, way1), v = dot(us, way1), e = dot(p, p) + hh, rr = a * inversesqrt(e);
    bool here = a0 > 0.0 && a < 0.0;
    float D = here ? d * d + hh : min(e0, e), c = r.z + mid, cc = c - btCueAt * btAll;
    float n1 = (e - e0) / (e + e0), n2 = n1 * n1, near = n1 < 0.0 ? r0 + n2 * (1.0 - r0) - rr : r0 - rr + n2 * (1.0 + rr);
    if (!btDayOn) sum += (gas.w + ends.z * c + cue / (1.0 + 4.0 * cc * cc)) * max(near, 0.0) / D * max(btH - dot(u, btSlant) * d / max(l, 1e-3), 0.0);
    if (btDayOn && m > 0.0) { int f = btFills(c); if (f < 5) btFall += btGas[f].rgb * (btGas[f].w + btEnds[f].z * c) * max(near, 0.0) / D * btH * btH * 0.5; }
    if (v0 > 0.0 && v < 0.0) btSh = min(btSh, abs(length(us) - R));
    if (here && abs(d) < btReach) { hu = vec4(u, way); ha = r; if (btNew) ha.y = S; }
    a0 = a; v0 = v; e0 = e; r0 = rr; way = way1;
  }
  if (uOwn[2] > 0.0 && fade > 0.0) btSh = min(btSh, length(b));
  btFall += gas.rgb * sum * fade * btH;
  if (ha.x != 0.0) { btU1 = btU0; btA1 = btA0; btU0 = hu; btA0 = vec4(ha, k); btCount += 1.0; }
}
void btStart(vec2 q, vec2 s, float h, vec2 slant) {
  btQ = q; btS = s; btH = h; btSlant = slant;
  btFall = vec3(0.0); btSh = 1.0; btReach = btDayOn ? 0.0068 + btPx : 0.0105; btReach *= btT * (1.0 + 1.6 * max(-uOwn[4], 0.0)); btReach += 2.0 * btSp; btCount = 0.0;
  btU0 = btU1 = vec4(1.0,0.0,1.0,0.0); btA0 = btA1 = vec4(1.0,1.0,0.0,5.0);
}
// The tubes right here, the farthest first: what hangs before the wall, the light it takes; by day, what comes through it, glints, lit gas.
vec3 btOver, btThrough;
float btAir = 0.35;       // how light it is where solid stuff hangs
vec2 btTake;
float btHung, btHi;
vec4 btLit;
const vec2 btLamp = vec2(-0.55,0.83);   // the dim light in the room comes this way
void btHang(vec2 q) {
  btOver = vec3(0.0); btThrough = vec3(1.0); btTake = vec2(0.0); btHung = btHi = 0.0; btLit = vec4(0.0);
  for (int n = int(max(2.0 - btCount, 0.0)); n < 2; n++) {
    vec4 t = btU0, o = btA0;
    if (n == 0) { t = btU1; o = btA1; }
    if (!btNew) o.y = 1.0;
    int k = btDayOn ? btFills(o.z) : int(o.w);
    vec4 gas = k == 0 ? btGas[0] : k == 1 ? btGas[1] : k == 2 ? btGas[2] : k == 3 ? btGas[3] : btGas[4];
    vec3 sp = k == 0 ? btEnds[0] : k == 1 ? btEnds[1] : k == 2 ? btEnds[2] : k == 3 ? btEnds[3] : btEnds[4];
    float turn = o.x < 0.0 ? -1.0 : 1.0, R = abs(o.x);
    vec2 u = t.xy, w = t.zw;
    float l = length(u), d = l - R, off = abs(d), g = o.z + R * o.y * atan(dot(u, w), turn * (u.x * w.y - u.y * w.x));
    u /= max(l, 1e-4);
    float sa = 0.0, keep = 1.0, wet = sat(2.0 * uOwn[4]), bead = max(-uOwn[4], 0.0);
    d = btFold(d); off = abs(d);
    if (uOwn[6] < 0.0) keep = btStep(-btPx, btPx, mix(0.06, 0.034, -uOwn[6]) - 0.11 * abs(fract(g / (0.11 * o.y)) - 0.5));
    if (bead > 0.0) { float per = btR * 6.5 * o.y, at = (floor(g / per) + 0.5) * per; sa = (g - at) / o.y; g = mix(g, at, bead); }
    // how brightly the gas burns here
    float f = (g - sp.x) / sp.y, e = min(g - sp.x, sp.x + sp.y - g), fk = float(min(k, 4));
    float at = fract(uTravel * (0.05 + 0.007 * fk) + 0.37 * fk);
    float b = gas.w + sp.z * g + btNowOn * btBump((g / btAll - uLoop) * 26.0) + btCueOn * btBump((g / btAll - btCueAt) * 9.0);
    b += 6.0 * at * (1.0 - at) * uEnergy * band(0.06 + 0.21 * fk) * btBump((f - at) * sp.y * 9.0);
    b *= btStep(-0.01,0.05,f) * btStep(1.01,0.95,f);
    if (k > 4) { b = btCueOn * btBump((g / btAll - btCueAt) * 9.0); gas.rgb = mix(btGas[4].rgb, vec3(1.0,0.95,0.85), 0.6); }
    float boot = btDayOn ? 0.0 : btStep(0.034 + btPx, 0.034 - btPx, e), r = btDayOn ? 0.0066 : 0.0082 * (1.0 + 0.22 * boot * (1.0 - wet));
    r *= btT;
    float x = d / r;
    float cov = btStep(r + btPx, r - btPx, off), nz = sqrt(max(1.0 - x * x, 0.0));
    vec2 nx = u * x;
    cov *= keep;
    boot *= 1.0 - max(bead, max(uOwn[6], 0.0));
    if (bead > 0.0) {            // beads on a thread
      float rb = btR * 2.5 * bead, v = length(vec2(sa, d)), in_ = btStep(rb + btPx, rb - btPx, v);
      cov = mix(cov, btStep(r * 0.25 + btPx, r * 0.25 - btPx, off), bead);
      nx = mix(nx, (u * d + vec2(-u.y, u.x) * turn * sa) / rb, in_); x = mix(x, v / rb, in_); cov = max(cov, in_); 
      nz = sqrt(max(1.0 - x * x, 0.0));
    }
    if (btNew || wet > 0.0) b += 1.6 * uHits * btStep(0.5,1.0,f);
    vec3 stuff = kindColour(k > 4 ? 1.0 : fk);
    if (wet > 0.0) {             // and stuff that is no glass
      float l3 = 0.12 + sat(dot(vec3(nx, nz), vec3(btLamp, 0.7) * 0.82));
      stuff = stuff * stuff * btAir * l3 * (0.75 + 0.35 * sat(2.0 * uOwn[4] - 1.0) * sin(g / (btR * o.y) * 1.6 + x * 2.6)) * (0.4 + 0.6 * nz) * 2.4 + stuff * stuff * b * 0.55 * nz;
    }
    if (btDayOn) {
      float side = dot(u, vec2(-0.8,0.6));
      btThrough *= mix(vec3(1.0), mix(vec3(0.84,0.895,0.88), vec3(0.16,0.21,0.22), btStep(0.3,1.0,abs(x))), cov);
      btHi += 0.6 * btStep(0.3,0.0,abs(x * side - 0.5)) * abs(side) * cov;
      btLit = mix(btLit, vec4(gas.rgb * (0.6 + 0.4 * b) * (0.75 + 0.5 * nz) + nz * nz * (0.2 + 0.45 * b), 1.0), cov * sat(b * 1.6));
      if (wet > 0.0) { btThrough *= 1.0 - wet * cov; btHi *= 1.0 - wet * cov; btLit = mix(btLit, vec4(stuff, 1.0), wet * cov); }
      float sl = k > 4 ? 0.0 : btStep(0.013 + btPx, 0.013 - btPx, abs(e - 0.013)) * cov * (1.0 - max(wet, max(bead, uOwn[6])));
      btThrough *= 1.0 - 0.8 * sl; btLit.a *= 1.0 - 0.9 * sl; btHi *= 1.0 - 0.7 * sl;
    } else {
      vec3 n3 = vec3(nx, nz);
      float dif = sat(dot(n3, vec3(btLamp, 0.55) * 0.876)), glint = btStep(0.12,0.0,abs(dot(n3.xy, btLamp) - 0.62)) * abs(dot(u, btLamp));
      vec3 lit = gas.rgb * b * (0.9 + 1.1 * nz) + vec3(1.0,0.96,0.92) * b * b * nz * nz * nz * mix(0.6,1.3, uTone);
      vec2 take = vec2((0.06 + 0.5 * dif) * (0.45 + 0.55 * nz) + 1.1 * glint, 0.05 + 0.05 * nz) * mix(1.0,0.35, sat(b * 1.4)) * (1.0 - 0.8 * boot);
      if (wet > 0.0) { lit = mix(lit, stuff, wet); take *= 1.0 - wet; boot *= 1.0 - wet; }
      btOver = mix(btOver, mix(lit, vec3(0.012), boot), cov); btTake = mix(btTake, take, cov); btHung = max(btHung, cov);
      float gap = sp.y / floor(sp.y / 0.3), cl = abs(fract((g - sp.x) / gap) - 0.5) * gap;
      cl = btStep(0.0032 + btPx, 0.0032 - btPx, cl) * btStep(0.0105,0.0105 - 2.0 * btPx, off) * (1.0 - btBare) * (1.0 - wet);
      btOver = mix(btOver, vec3(0.02), cl); btTake = mix(btTake, vec2(0.15 + 1.2 * btStep(0.004,0.0,abs(d - 0.004)), 0.15), cl); btHung = max(btHung, cl);
    }
  }
}
// Where of the drawing is seen at a place: many copies of it, or swaying. And the light that falls through leaves or slats.
vec2 btMany(vec2 q, float wide, float high) {
  if (uOwn[1] > 0.0) {
    vec2 W = vec2(wide, high);
    q = W - abs(mod(q * (1.0 + 1.4 * uOwn[1]) + W, 4.0 * W) - 2.0 * W);
  }
  if (uOwn[5] < 0.0) q -= uOwn[5] * vec2(0.09 * sin(q.y * 5.0 + uTime * 0.5) + 0.03 * sin(q.y * 11.0 - uTime * 0.37), 0.06 * sin(q.x * 6.0 + uTime * 0.41));
  return q;
}
float btFell(vec2 q) {
  if (uOwn[7] > 0.0) { q += 0.02 * sin(q.yx * 3.0 + uTime * vec2(0.4,0.31)); return btStep(0.36,0.66, 0.5 * noise(rot(0.6) * q * 6.0 + 2.0) + 0.3 * noise(q * 13.0) + 0.2 * noise(rot(1.1) * q * 25.0)); }
  return btStep(-0.35,0.35, sin(46.0 * q.y + 14.0 * q.x));
}
// The wall drawing: concrete, and what hangs on it.
vec3 btWall(vec2 q) {
  float h = mix(0.03,0.066, uSpace);
  vec2 off = -btLamp * mix(0.034,0.052, uSpace);
  vec3 rough = btSlope(q * 21.0), fine = btSlope(q * 115.0);
  vec2 gr = rough.yz * 1.6 + fine.yz * 1.8;
  vec2 seam = vec2(q.x + 0.44, q.y + 0.375);
  seam -= floor(seam / vec2(0.88,0.75) + 0.5) * vec2(0.88,0.75);
  vec2 as = abs(seam);
  float groove = btStep(0.0022 + btPx, 0.0008, min(as.x, as.y));
  vec2 tie = as - vec2(0.2,0.16);
  float tr = length(tie), hole = btStep(0.0125 + btPx, 0.0125 - btPx, tr);
  gr += tie * sign(seam) / max(tr, 1e-4) * 30.0 * btStep(0.005,0.0,abs(tr - 0.0105));
  gr -= sign(seam) * btStep(0.005,0.001,as) * 14.0;
  float pale = max(uOwn[3], 0.0), air = max(-uOwn[3], 0.0);
  vec3 nn = normalize(vec3(-gr * 0.02 * (1.0 - 0.8 * pale),1.0));
  float wide = mix(0.87,0.46, max(-uOwn[0], 0.0));
  btStart(btMany(q, wide, 0.45), btMany(q - off, wide, 0.45), h, nn.xy / nn.z);
  btAir = mix(0.35,0.95, max(pale, air * 0.6));
  btRun(0,6, vec4(-.8156,-.212,.3097,-.9508), vec4(-.428,-.142,.388,.144), btGas[1], btEnds[1], 1.0); // a wave
  btRun(6,11, vec4(-.0742,-.2226,.8865,-.4628), vec4(-.067,.009,.316,.342), btGas[0], btEnds[0], 0.0); // a loop
  btRun(11,16, vec4(.2648,-.3301,.8914,.4531), vec4(.518,.053,.253,.383), btGas[2], btEnds[2], 2.0); // a leaf
  btRun(16,28, vec4(.4217,-.1332,.5434,.8395), vec4(.54,.106,.142,.239), btGas[3], btEnds[3], 3.0); // its veins
  btRun(28,33, vec4(.4573,-.2528,.6242,-.7813), vec4(.614,-.245,.157,.066), btGas[4], btEnds[4], 4.0); // a flourish
  btHang(q);
  float cb = 1.0, cs = 1.0;
  for (int i = q.y < -0.09 ? 0 : 6; i < 7; i++) {
    vec2 d = btCable(q, q - off * 0.25, btC[i].xy, btC[i].zw, btSag[i]);
    cb = min(cb, d.x); cs = min(cs, d.y);
  }
  float pit = max(btPits(q * 21.0), 1.8 * btStep(0.0085 + btPx, 0.0085 - btPx, length(q - vec2(0.724,0.378))));
  cb += btBare; cs += btBare; pit *= 1.0 - pale; groove *= 1.0 - pale; hole *= 1.0 - pale;
  float cloud = 0.5 * btN.y + 0.3 * btN.z + 0.2 * rough.x;
  float alb = 0.36 + 0.5 * (cloud - 0.47) + 0.26 * (btN.x - 0.5) + 0.05 * (hash21(floor(vec2(q.x + 0.44, q.y + 0.375) / vec2(0.88,0.75)) + 3.0) - 0.5) + 0.05 * (fine.x - 0.5);
  alb = max(alb * (1.0 - 0.5 * pit) * (1.0 - 0.6 * groove) * (1.0 - 0.75 * hole), 0.02);
  vec3 tint = mix(vec3(1.03,0.99,0.93), vec3(0.95,0.99,1.03), cloud);
  float beam = q.y * 0.55 + q.x;
  vec2 hi2 = q - vec2(-0.5,0.5);
  float room = 0.05 + 0.09 * exp(-dot(hi2, hi2)) + 0.3 * btStep(-1.15,-0.72,beam) * btStep(0.32,-0.3,beam) * btStep(-0.75,0.6,q.y);
  if (uOwn[7] != 0.0) room = mix(room, 0.06 + 0.42 * btFell(q), abs(uOwn[7]));
  room *= mix(0.8,1.2, uTone);
  alb = mix(alb, 0.8 + 0.3 * (cloud - 0.5) + 0.06 * (fine.x - 0.5), pale);
  float ndl = sat(dot(nn, vec3(btLamp, 0.8) * 0.782)) * 1.6;
  float shade = (1.0 - (0.62 - 0.4 * max(-uOwn[6], 0.0)) * btStep(0.022 * btT,0.004 * btT,abs(btFold(btSh)))) * (1.0 - 0.6 * btStep(0.014,0.002,cs));
  btFall *= 1.0 - 0.75 * max(uOwn[4], 0.0);
  vec3 light = mix(vec3(0.8,0.92,1.06) * room, vec3(1.0,0.98,0.94) * (0.68 + 1.1 * room), pale) * ndl * shade + btFall * mix(1.2,0.4, pale) * (1.0 - 0.5 * btStep(0.012,0.003,cs));
  vec3 col = alb * tint * light;
  if (air > 0.0) {             // no wall: the last light low in the air, and a haze
    float low = 0.5 + q.y;
    col = mix(col, uKind[0] * uKind[0] * (0.05 + 0.75 * exp(-2.6 * max(low, 0.0))) * (0.75 + 0.5 * btN.y) + uKind[1] * uKind[1] * 0.14 * exp(-low * low * 4.0) + btFall * 0.1, air);
  }
  float cz = sat(1.0 - cb * cb / 1.76e-5);
  col = mix(col, vec3(0.015) + (0.08 * room + 0.06 * btFall) * cz, btStep(0.0042 + btPx, 0.0042 - btPx, cb));
  return screenOf(mix(col, btOver + btHung * (btTake.x * (pale > 0.0 ? mix(room, 0.2, pale) : room) * 4.0 + btTake.y * btFall + pale * 0.4 * col * (1.0 - max(uOwn[4], 0.0))), btHung));
}
vec3 btPool(vec2 q, float x, float y, float r, float g, vec4 gas, float climb) {
  float d = length(q - vec2(x, y) - vec2(0.015,-0.01)) - r;
  float c = g / btAll - btCueAt;
  return gas.rgb * (gas.w + climb * g + 1.5 * btCueOn / (1.0 + 60.0 * c * c)) * 0.006 / (0.006 + d * d);
}
// The workshop: a white wall, the window's sun, the tangle.
vec3 btDay(vec2 p, float wide) {
  float s = min(1.0, wide / 0.48);
  vec2 mid = vec2(0.085 * min(1.0, wide / 0.6), 0.06), off = vec2(0.1,-0.075) * mix(0.75,1.25, uSpace);
  float turn = 0.3 * sin(uTime * 0.053), tip = 0.012 * sin(uTime * 0.21);
  vec2 q = (p - mid) / s, m = q - off;
  mat2 lean = rot(tip);
  q = lean * (q - vec2(0.0,0.6)) + vec2(0.0,0.6);
  q.x /= cos(turn); q.y += 0.06 * sin(turn) * q.x;
  m = vec2(m.x * 1.03 + (0.1 - 0.2 * turn) * m.y, m.y * 1.06 - 0.05 * m.x);
  m = lean * (m - vec2(0.0,0.6)) + vec2(0.0,0.6);
  btPx /= s;
  btAir = 1.0 - 0.75 * max(uOwn[3], 0.0);
  q = btMany(q, 0.52, 0.52); m = btMany(m, 0.52, 0.52);
  btStart(q, m, 0.09, vec2(0.0));
  if (btNew || max(abs(q.x), abs(q.y)) < 0.52 || max(abs(m.x), abs(m.y)) < 0.52) {
    btRun(33,42, vec4(-.0899,.1051,.7609,.6488), vec4(0.0,0.0,9.0,9.0), vec4(0.0), vec3(0.0), 5.0);
    btRun(42,48, vec4(.2839,.0021,.2661,.9639), vec4(0.0,0.0,9.0,9.0), vec4(0.0), vec3(0.0), 5.0);
  }
  btHang(q);
  float x = abs(btFold(btSh)) / (0.0075 * btT); x *= x;
  float shade = exp(-x) * 0.85 - 0.5 * exp(-x * 8.0) * (1.0 - max(uOwn[4], 0.0));
  vec3 glow = vec3(0.0);
  glow += btPool(q, -.117,.065,.28,.75, btGas[2], btEnds[2].z);
  glow += btPool(q, -.039,.016,.28,2.603, btGas[0], btEnds[0].z);
  glow += btPool(q, .062,.063,.23,3.835, btGas[1], btEnds[1].z);
  glow += btPool(q, .198,-.054,.28,5.026, btGas[3], btEnds[3].z);
  glow += 2.4 * btPool(q, -.027,-.096,.13,6.341, btGas[4], btEnds[4].z);
  if (uOwn[0] != 0.0) glow = mix(glow, btFall, abs(uOwn[0]));
  vec2 hang = vec2(q.x + 0.195 + 0.06 * (q.y - 0.328), q.x - 0.049 - 0.03 * (q.y - 0.27));
  vec2 wire = btStep(0.0013 + btPx, 0.0013 - btPx, abs(hang)) * step(vec2(0.328,0.268), vec2(q.y)) * (1.0 - btBare);
  hang = vec2(m.x + 0.195 + 0.06 * (m.y - 0.328), m.x - 0.049 - 0.03 * (m.y - 0.27)) / 0.005;
  hang = exp(-hang * hang) * btStep(vec2(0.318,0.258), vec2(0.335,0.275), vec2(m.y)) * (1.0 - btBare);
  shade = sat(shade + 0.4 * max(hang.x, hang.y));
  float edge = p.y + 0.405 + 0.4 * btBare, bench = btStep(-btPx, btPx, -edge);
  vec3 wall = mix(vec3(0.93,0.925,0.9), vec3(0.9,0.84,0.75), bench) * (0.96 + btN.x * 0.02 + btN.y * 0.03);
  vec2 pw = p; pw.y += bench * (0.6 * edge);
  vec2 v = vec2(pw.x + 0.42 * pw.y + 0.06 * sin(uTime * 0.011), pw.y - 0.2 * pw.x - 0.02);
  vec2 pane = vec2(0.31,0.27), cell = abs(fract(v / pane + vec2(0.2,0.4)) - 0.5) * pane;
  float blur = mix(0.016,0.008, uTone);
  vec2 gap = btStep(-blur, blur, 0.5 * pane - 0.012 - cell) * btStep(-0.02,0.02,vec2(0.62,0.45) - abs(v));
  float sky = (0.33 + 0.2 * btStep(0.9,-0.9,p.x) + 0.1 * p.y) * (1.0 - 0.25 * btStep(-0.03,0.0,edge) * btStep(0.05,0.0,edge)) + bench * (0.02 - 1.2 * edge);
  vec3 pipe = vec3(1.0);
  float shine = 0.0;
  for (int i = 0; i < 4; i++) {
    float n = float(i), top = 0.1 + 0.16 * fract(n * 0.62), y = (p.y + 0.43 - 0.006 * n) / (top + 0.43);
    float lx = p.x + 0.795 - 0.04 * n - 0.012 * n * n + (0.012 * n - 0.05) * y, r = 0.0062, d = lx / r, in_ = btStep(0.0,0.004,y) * btStep(1.0,0.996,y) * (1.0 - btBare);
    float c = btStep(r + btPx, r - btPx, abs(lx)) * in_;
    pipe *= mix(vec3(1.0), mix(vec3(0.86,0.91,0.895), vec3(0.2,0.25,0.26), btStep(0.3,1.0,abs(d))), c);
    shine += 0.4 * btStep(0.3,0.0,abs(d + 0.45)) * c;
    float sx = (lx - 0.03 - 0.02 * y) / 0.01;
    sky *= 1.0 - 0.2 * exp(-sx * sx) * in_ * (1.0 - bench);
  }
  float sun = gap.x * gap.y, night = max(uOwn[3], 0.0);
  if (uOwn[7] != 0.0) sun = mix(sun, btFell(pw), abs(uOwn[7]));
  glow *= 1.0 - 0.75 * max(uOwn[4], 0.0);
  vec3 light = vec3(0.86,0.95,1.06) * sky * (1.0 - 0.22 * shade) * mix(vec3(1.0), vec3(0.05,0.065,0.09), night) + mix(vec3(1.12,1.0,0.84), vec3(0.2,0.28,0.4), night) * mix(0.46,0.54, uTone) * sun * (1.0 - shade);
  if (uOwn[3] < 0.0) wall *= mix(vec3(1.0), uKind[0] * (0.35 + 0.65 * uKind[0]) * 1.4, -uOwn[3]);
  vec3 col = wall * (light + glow * mix(0.36,0.7, night)) * pipe + shine * 0.6;
  btHi *= 1.0 - 0.75 * night;
  col = mix(col, vec3(0.13), max(wire.x, wire.y));
  col = col * btThrough + btHi;
  return screenOf(mix(col, btLit.rgb, btLit.a) * 1.25);
}
vec4 btSet(float l, vec3 c, vec4 sp, float y, float rest, out vec3 ends) {
  if (btDayOn) sp.xy = sp.zw;
  l = sat(l);
  float m = piece(vec2(sp.x / btAll + 0.02, y)).a, n = piece(vec2((sp.x + sp.y) / btAll - 0.02, y)).a;
  l = (0.32 + 1.0 * uEnergy) * l * (1.45 - 0.45 * l);
  ends = vec3(sp.xy, l * 0.6 * (n - m) / sp.y);
  c *= c; c = max(c - 0.6 * min(c.r, min(c.g, c.b)), 0.0);
  return vec4(c / max(max(c.r, max(c.g, c.b)), 0.05), l * (0.75 + 0.6 * m) - ends.z * sp.x + rest);
}
vec3 render(vec2 p) {
  bool day = uVar > 0.5;
  float wide = 0.5 * uRes.x / uRes.y;
  btPx = 0.7 / uRes.y;
  btCueAt = 1.04 - 1.08 * uCue; btCueOn = 1.6 * btStep(0.0,0.35,uCue);
  btNowOn = 0.5 * uLevel * btStep(0.0,0.05,uLoop) * btStep(1.0,0.95,uLoop);
  btT = exp2((uOwn[2] > 0.0 ? 1.7 : 1.1) * uOwn[2]); btR = (day ? 0.0066 : 0.0082) * btT; btSp = 3.4 * btR * max(uOwn[6], 0.0);
  btBare = max(abs(uOwn[0]), max(abs(uOwn[1]), max(abs(uOwn[4]), abs(uOwn[6]))));
  btNew = uOwn[0] != 0.0; btPx *= 1.0 + 1.4 * max(uOwn[1], 0.0);
  float gone = 0.0;
  if (uOwn[5] > 0.0) {
    gone = mix(-0.95,-0.24, uOwn[5]) - p.y;
    if (gone > 0.0) { p.x += gone * (0.25 * noise(vec2(p.x * 2.0, gone * 60.0 - uTime * 0.25)) - 0.125); p.y += 2.0 * gone; }
  }
  if (uOwn[1] < 0.0) {
    vec2 run = day ? vec2(-1.1 * uOwn[1],0.0) : vec2(0.0,1.25 * uOwn[1]);
    float n = 1.0 / max(1.0 + dot(run, p), 0.12);
    p = p * n; btPx *= n;
  }
  float rest = (day ? 0.3 : 0.17) * (1.0 - sat(uDrone)) * (0.9 + 0.1 * sin(uTime * 0.3));
  btDayOn = day; btAll = day ? btAllB : btAllA;
  btGas[0] = btSet(uDrone, uKind[0], vec4(1.1964,2.2223,2.1199,.9664), .8, rest, btEnds[0]);
  btGas[1] = btSet(uPad, uKind[1], vec4(0.,1.1964,3.4586,.7537), .66,0.0, btEnds[1]);
  btGas[2] = btSet(uTexture, uKind[2], vec4(3.4186,1.7428,.3674,.7642), .52,0.0, btEnds[2]);
  btGas[3] = btSet(max(uPhrase, 0.8 * uMic) + 0.45 * uKeys, uKind[3], vec4(5.1615,1.4277,4.6041,.8431), .38,0.0, btEnds[3]);
  btGas[4] = btSet(uHits, uKind[4], vec4(6.5892,.6106,6.0111,.6591), .24,0.0, btEnds[4]);
  vec2 q = p;
  float s = min(1.0, wide / 0.87);
  if (wide < 0.5) { q = vec2(p.y, -p.x); s = min(0.5 / 0.87, wide / 0.47); }
  q /= s;
  btN = vec3(noise(q * vec2(3.1,0.9) + 3.1), noise(q * 4.2 + 11.0), day ? 0.0 : noise(q * 10.4 + 5.0));
  vec3 c = vec3(0.0);
  if (day) c = btDay(p, wide);
  if (!day) { btPx /= s; c = btWall(q); }
  if (gone > 0.0) c *= 1.0 - btStep(0.0,0.05,gone) * mix(0.3,0.65, sat(gone * 1.6));
  return c;
}
