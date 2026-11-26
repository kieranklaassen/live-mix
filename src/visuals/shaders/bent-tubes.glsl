// name: Bent tubes
// a: Wall drawing
// b: By day
// what: One line of bent glass tube - a wave, a big loop, a leaf with its veins, a flourish - clipped to bare concrete, mostly grey and unlit until its gas glows and the colour falls on the wall; or a tangle of thin clear tube hung from two wires in a white workshop, window sun on the wall, a few lengths lit pale.
// follows: Drone is the loop, pad the wave, texture the leaf, phrase its veins, with keys and voice; by day each has a length of the tangle. Each glows as loud as it sounds, stronger where the piece is loud along the line, with a bright place at now. Bands brighten a bead in each tube. A hit lights the flourish or the inner ring; a cue runs along the whole line.
// A soft step that may also run downward.
float btStep(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3.0 - 2.0 * x); }
vec2 btStep(vec2 a, vec2 b, vec2 x) { x = sat((x - a) / (b - a)); return x * x * (3.0 - 2.0 * x); }
vec2 btStep(float a, float b, vec2 x) { return btStep(vec2(a), vec2(b), x); }
// Both drawings are bends of tube, each going on from the last: its radius (below 0 it turns right), the cosine of
// how far it turns, and how much of the line lies before it. First the wall's five tubes, then the tangle.
const vec3 btArc[48] = vec3[48](vec3(.0976,-.75767,0.),vec3(-.0792,-.76816,.237),vec3(.0852,-.67733,.431),vec3(-1.947,.99106,.628),vec3(-.0803,-.89477,.889),vec3(-.043,-.54392,1.104),vec3(.1822,.48844,1.196),vec3(.3075,-.90268,1.39),vec3(.4578,.96479,2.219),vec3(.2712,-.39895,2.341),vec3(.7391,.74429,2.878),vec3(-.1411,.98499,3.419),vec3(.1296,-.03185,3.443),vec3(-.4671,.04556,3.651),vec3(-.089,-.20784,4.363),vec3(-.4955,.27618,4.522),vec3(.3329,.75424,5.161),vec3(.0374,-.52718,5.4),vec3(.0374,-.52718,5.479),vec3(.1154,.62936,5.559),vec3(-.1027,.56927,5.661),vec3(-.0421,-.43498,5.761),vec3(-.0421,-.43498,5.846),vec3(-.2418,.87123,5.931),vec3(.2269,.88138,6.055),vec3(.042,-.62578,6.167),vec3(.042,-.62578,6.261),vec3(.1748,.23168,6.355),vec3(.1566,-.23046,6.589),vec3(.0524,.59423,6.872),vec3(.0363,-.04918,6.921),vec3(.0363,-.04918,6.979),vec3(.1289,.31181,7.038),vec3(.13,-.95071,0.),vec3(.28,-.91617,.367),vec3(.19,-.85725,1.132),vec3(.19,-.85725,1.626),vec3(.28,-.15428,2.12),vec3(.28,-.15428,2.603),vec3(.19,-.37934,3.086),vec3(.23,-.06753,3.459),vec3(.23,-.06753,3.835),vec3(.16,-.7693,4.212),vec3(.28,-.99149,4.604),vec3(.13,-.78071,5.447),vec3(.19,.28646,5.768),vec3(-.13,-.82155,6.011),vec3(-.13,-.82155,6.341));
const float btAllA = 7.2, btAllB = 6.67;
// Cables: the ends of each, and how far it bows.
const vec4 btC[7] = vec4[7](vec4(-.115,-.117,-.074,-.224), vec4(.19,-.335,.265,-.33), vec4(.489,-.163,.422,-.133), vec4(.489,-.163,.457,-.254), vec4(-.816,-.213,-.8,-.95), vec4(.77,-.311,.83,-.95), vec4(.686,.345,.722,.377));
const float btSag[7] = float[7](-.045, -.022, .033, .028, -.05, .05, .012);
bool btDayOn;
vec4 btGas[5];            // the colour of each kind's gas, and how brightly it burns where the whole line begins
vec3 btEnds[5];           // where its length of the line begins, how long it is, and how the brightness climbs along it
float btPx; // a pixel
vec3 btN; // the wall's stains
float btAll, btCueAt, btCueOn, btNowOn;

float btBump(float x) { x = 1.0 + x * x; return 1.0 / (x * x); }
// Loose cable, a bow from a to b that hangs c off the straight way: how far q is from it, and r.
vec2 btCable(vec2 q, vec2 r, vec2 a, vec2 b, float c) {
  vec2 e = 0.5 * (b - a), m = 0.5 * (a + b), n = vec2(-e.y, e.x);
  float L = dot(e, e), k = inversesqrt(L);
  q -= m; r -= m;
  vec2 x = vec2(dot(q, e), dot(r, e)) / L, y = vec2(dot(q, n), dot(r, n)) * k, g = 2.0 * c * k * x;
  return abs(y - c * (1.0 - x * x)) * inversesqrt(1.0 + g * g) + 9.0 * max(abs(x) - 1.0,0.0);
}
// Smooth noise, with the way it slopes: y and z.
vec3 btSlope(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f), du = 6.0 * f * (1.0 - f);
  float a = hash21(i), b = hash21(i + vec2(1,0)), c = hash21(i + vec2(0,1)), k = a - b - c + hash21(i + vec2(1,1));
  return vec3(a + (b - a) * u.x + (c - a) * u.y + k * u.x * u.y, du * vec2(b - a + k * u.y, c - a + k * u.x));
}
// The pits the air left in the concrete.
float btPits(vec2 q) {
  vec2 c = floor(q), o = hash22(c), v = fract(q) - 0.3 - 0.4 * o.yx;
  float r = o.x > 0.26 ? -1.0 : 0.05 + 0.15 * o.y * o.y * o.y, e = btPx * 21.0;
  return btStep(r + e, r - e, length(v)) * btStep(0.05,0.1,r);
}
// The place looked at and the place whose shadow falls here; how far off the wall the glass hangs; the wall's slope.
vec2 btQ, btS, btSlant;
float btH, btSh, btCount, btReach;
vec3 btFall;                          // the light the tubes throw on the wall
vec4 btU0, btU1, btA0, btA1; // the last two tubes right here: from its middle to here, the way it begins; its arc, its kind
// Goes round one tube's bends, i to end in the list, from a place and the way it runs there. A lit line's light is cut off
// at both ends of a bend, so that bend after bend adds up to one line. Far from its box a tube does nothing.
void btRun(int i, int end, vec4 w, vec4 box, vec4 gas, vec3 ends, float k) {
  vec2 p = btQ - w.xy, b = btS - w.xy, way = w.zw, o = max(abs(btQ - box.xy) - box.zw, 0.0);
  float fade = btStep(0.078,0.004,dot(o, o)), hh = btH * btH, sum = 0.0;
  float a0 = dot(p, way), v0 = dot(b, way), e0 = dot(p, p) + hh, r0 = a0 * inversesqrt(e0), cue = k < 4.5 ? btCueOn : 0.0;
  vec4 hu = vec4(0.0);
  vec3 ha = vec3(0.0);
  if (fade <= 0.0) end = i;
  for (; i < end; i++) {
    vec3 r = btArc[i];
    float R = abs(r.x), sn = sqrt(max(1.0 - r.y * r.y, 0.0)) * sign(r.x);
    vec2 n = r.x * vec2(-way.y, way.x), u = p - n, us = b - n, way1 = vec2(way.x * r.y - way.y * sn, way.x * sn + way.y * r.y);
    p = u + r.x * vec2(-way1.y, way1.x); b = us + p - u;
    float l = length(u), d = l - R, a = dot(u, way1), v = dot(us, way1), e = dot(p, p) + hh, rr = a * inversesqrt(e);
    bool here = a0 > 0.0 && a < 0.0;
    float D = here ? d * d + hh : min(e0, e), c = r.z + 0.4 * R, cc = c - btCueAt * btAll;
    // beside one end of a bend, the other end is as good as endless
    float n1 = (e - e0) / (e + e0), n2 = n1 * n1, near = n1 < 0.0 ? r0 + n2 * (1.0 - r0) - rr : r0 - rr + n2 * (1.0 + rr);
    if (!btDayOn) sum += (gas.w + ends.z * c + cue / (1.0 + 4.0 * cc * cc)) * max(near, 0.0) / D * max(btH - dot(u, btSlant) * d / max(l, 1e-3), 0.0);
    if (v0 > 0.0 && v < 0.0) btSh = min(btSh, abs(length(us) - R));
    if (here && abs(d) < btReach) { hu = vec4(u, way); ha = r; }
    a0 = a; v0 = v; e0 = e; r0 = rr; way = way1;
  }
  btFall += gas.rgb * sum * fade * btH;
  if (ha.x != 0.0) { btU1 = btU0; btA1 = btA0; btU0 = hu; btA0 = vec4(ha, k); btCount += 1.0; }
}
void btStart(vec2 q, vec2 s, float h, vec2 slant) {
  btQ = q; btS = s; btH = h; btSlant = slant;
  btFall = vec3(0.0); btSh = 1.0; btReach = btDayOn ? 0.0068 + btPx : 0.0105; btCount = 0.0;
  btU0 = btU1 = vec4(1.0,0.0,1.0,0.0); btA0 = btA1 = vec4(1.0,1.0,0.0,5.0);
}
// The kind that fills the tangle at a length along it (5 is none).
int btFills(float s) { return s > .366 && s < 1.131 ? 2 : s > 2.119 && s < 3.085 ? 0 : s > 3.458 && s < 4.211 ? 1 : s > 4.603 && s < 5.446 ? 3 : s > 6.01 && s < 6.669 ? 4 : 5; }
// The tubes right here, the farthest first. What hangs before the wall, how the glass takes the room's light and its
// neighbours'; by day, what comes through the glass, its glints, the lit gas.
vec3 btOver, btThrough;
vec2 btTake;
float btHung, btHi;
vec4 btLit;
const vec2 btLamp = vec2(-0.55,0.83);   // the dim light in the room comes this way
void btHang(vec2 q) {
  btOver = vec3(0.0); btThrough = vec3(1.0); btTake = vec2(0.0); btHung = btHi = 0.0; btLit = vec4(0.0);
  for (int n = int(max(2.0 - btCount, 0.0)); n < 2; n++) {
    vec4 t = btU0, o = btA0;
    if (n == 0) { t = btU1; o = btA1; }
    int k = btDayOn ? btFills(o.z) : int(o.w);
    vec4 gas = k == 0 ? btGas[0] : k == 1 ? btGas[1] : k == 2 ? btGas[2] : k == 3 ? btGas[3] : btGas[4];
    vec3 sp = k == 0 ? btEnds[0] : k == 1 ? btEnds[1] : k == 2 ? btEnds[2] : k == 3 ? btEnds[3] : btEnds[4];
    float turn = o.x < 0.0 ? -1.0 : 1.0, R = abs(o.x);
    vec2 u = t.xy, w = t.zw;
    float l = length(u), d = l - R, off = abs(d), g = o.z + R * atan(dot(u, w), turn * (u.x * w.y - u.y * w.x));
    u /= max(l, 1e-4);
    // how brightly the gas burns here: its level, the place in the piece that sounds now, a cue running along the line,
    // and a bead that slides along inside, as bright as its part of the spectrum
    float f = (g - sp.x) / sp.y, e = min(g - sp.x, sp.x + sp.y - g), fk = float(min(k, 4));
    float at = fract(uTravel * (0.05 + 0.007 * fk) + 0.37 * fk);
    float b = gas.w + sp.z * g + btNowOn * btBump((g / btAll - uLoop) * 26.0) + btCueOn * btBump((g / btAll - btCueAt) * 9.0);
    b += 6.0 * at * (1.0 - at) * uEnergy * band(0.06 + 0.21 * fk) * btBump((f - at) * sp.y * 9.0);
    b *= btStep(-0.01,0.05,f) * btStep(1.01,0.95,f);
    if (k > 4) { b = btCueOn * btBump((g / btAll - btCueAt) * 9.0); gas.rgb = mix(btGas[4].rgb, vec3(1.0,0.95,0.85), 0.6); }
    float boot = btDayOn ? 0.0 : btStep(0.034 + btPx, 0.034 - btPx, e), r = btDayOn ? 0.0066 : 0.0082 * (1.0 + 0.22 * boot), x = d / r;
    float cov = btStep(r + btPx, r - btPx, off), nz = sqrt(max(1.0 - x * x, 0.0));
    if (btDayOn) {
      float side = dot(u, vec2(-0.8,0.6));
      btThrough *= mix(vec3(1.0), mix(vec3(0.84,0.895,0.88), vec3(0.16,0.21,0.22), btStep(0.3,1.0,abs(x))), cov);
      btHi += 0.6 * btStep(0.3,0.0,abs(x * side - 0.5)) * abs(side) * cov;
      btLit = mix(btLit, vec4(gas.rgb * (0.6 + 0.4 * b) * (0.75 + 0.5 * nz) + nz * nz * (0.2 + 0.45 * b), 1.0), cov * sat(b * 1.6));
      // a dark sleeve where a filled length is joined on
      float sl = k > 4 ? 0.0 : btStep(0.013 + btPx, 0.013 - btPx, abs(e - 0.013)) * cov;
      btThrough *= 1.0 - 0.8 * sl; btLit.a *= 1.0 - 0.9 * sl; btHi *= 1.0 - 0.7 * sl;
    } else {
      vec3 n3 = vec3(u * x, nz);
      float dif = sat(dot(n3, vec3(btLamp, 0.55) * 0.876)), glint = btStep(0.12,0.0,abs(dot(n3.xy, btLamp) - 0.62)) * abs(dot(u, btLamp));
      vec3 lit = gas.rgb * b * (0.9 + 1.1 * nz) + vec3(1.0,0.96,0.92) * b * b * nz * nz * nz * mix(0.6,1.3, uTone);
      vec2 take = vec2((0.06 + 0.5 * dif) * (0.45 + 0.55 * nz) + 1.1 * glint, 0.05 + 0.05 * nz) * mix(1.0,0.35, sat(b * 1.4)) * (1.0 - 0.8 * boot);
      btOver = mix(btOver, mix(lit, vec3(0.012), boot), cov); btTake = mix(btTake, take, cov); btHung = max(btHung, cov);
      // clips of bent wire
      float gap = sp.y / floor(sp.y / 0.3), cl = abs(fract((g - sp.x) / gap) - 0.5) * gap;
      cl = btStep(0.0032 + btPx, 0.0032 - btPx, cl) * btStep(0.0105,0.0105 - 2.0 * btPx, off);
      btOver = mix(btOver, vec3(0.02), cl); btTake = mix(btTake, vec2(0.15 + 1.2 * btStep(0.004,0.0,abs(d - 0.004)), 0.15), cl); btHung = max(btHung, cl);
    }
  }
}
// The wall drawing: concrete, and what hangs on it.
vec3 btWall(vec2 q) {
  float h = mix(0.03,0.066, uSpace);
  vec2 off = -btLamp * mix(0.034,0.052, uSpace);
  // panels poured one by one, a hole where each tie went through
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
  vec3 nn = normalize(vec3(-gr * 0.02,1.0));
  btStart(q, q - off, h, nn.xy / nn.z);
  btRun(0,6, vec4(-.8156,-.212,.3097,-.9508), vec4(-.428,-.142,.388,.144), btGas[1], btEnds[1], 1.0); // a wave
  btRun(6,11, vec4(-.0742,-.2226,.8865,-.4628), vec4(-.067,.009,.316,.342), btGas[0], btEnds[0], 0.0); // a loop
  btRun(11,16, vec4(.2648,-.3301,.8914,.4531), vec4(.518,.053,.253,.383), btGas[2], btEnds[2], 2.0); // a leaf
  btRun(16,28, vec4(.4217,-.1332,.5434,.8395), vec4(.54,.106,.142,.239), btGas[3], btEnds[3], 3.0); // its veins
  btRun(28,33, vec4(.4573,-.2528,.6242,-.7813), vec4(.614,-.245,.157,.066), btGas[4], btEnds[4], 4.0); // a flourish
  btHang(q);
  // the cables from tube to tube, lying on the wall
  float cb = 1.0, cs = 1.0;
  for (int i = q.y < -0.09 ? 0 : 6; i < 7; i++) {
    vec2 d = btCable(q, q - off * 0.25, btC[i].xy, btC[i].zw, btSag[i]);
    cb = min(cb, d.x); cs = min(cs, d.y);
  }
  float pit = max(btPits(q * 21.0), 1.8 * btStep(0.0085 + btPx, 0.0085 - btPx, length(q - vec2(0.724,0.378))));
  float cloud = 0.5 * btN.y + 0.3 * btN.z + 0.2 * rough.x;
  float alb = 0.36 + 0.5 * (cloud - 0.47) + 0.26 * (btN.x - 0.5) + 0.05 * (hash21(floor(vec2(q.x + 0.44, q.y + 0.375) / vec2(0.88,0.75)) + 3.0) - 0.5) + 0.05 * (fine.x - 0.5);
  alb = max(alb * (1.0 - 0.5 * pit) * (1.0 - 0.6 * groove) * (1.0 - 0.75 * hole), 0.02);
  vec3 tint = mix(vec3(1.03,0.99,0.93), vec3(0.95,0.99,1.03), cloud);
  // dim light from high on the left, with a soft edge
  float beam = q.y * 0.55 + q.x;
  vec2 hi2 = q - vec2(-0.5,0.5);
  float room = 0.05 + 0.09 * exp(-dot(hi2, hi2)) + 0.3 * btStep(-1.15,-0.72,beam) * btStep(0.32,-0.3,beam) * btStep(-0.75,0.6,q.y);
  room *= mix(0.8,1.2, uTone);
  float ndl = sat(dot(nn, vec3(btLamp, 0.8) * 0.782)) * 1.6;
  float shade = (1.0 - 0.62 * btStep(0.022,0.004,btSh)) * (1.0 - 0.6 * btStep(0.014,0.002,cs));
  vec3 light = vec3(0.8,0.92,1.06) * room * ndl * shade + btFall * 1.2 * (1.0 - 0.5 * btStep(0.012,0.003,cs));
  vec3 col = alb * tint * light;
  float cz = sat(1.0 - cb * cb / 1.76e-5);
  col = mix(col, vec3(0.015) + (0.08 * room + 0.06 * btFall) * cz, btStep(0.0042 + btPx, 0.0042 - btPx, cb));
  return screenOf(mix(col, btOver + btHung * (btTake.x * room * 4.0 + btTake.y * btFall), btHung));
}
// The light a filled ring throws on the wall behind it.
vec3 btPool(vec2 q, float x, float y, float r, float g, vec4 gas, float climb) {
  float d = length(q - vec2(x, y) - vec2(0.015,-0.01)) - r;
  float c = g / btAll - btCueAt;
  return gas.rgb * (gas.w + climb * g + 1.5 * btCueOn / (1.0 + 60.0 * c * c)) * 0.006 / (0.006 + d * d);
}
// The workshop: a white wall with the window's sun, lengths of tube leaning, the tangle on two wires.
vec3 btDay(vec2 p, float wide) {
  float s = min(1.0, wide / 0.48);
  vec2 mid = vec2(0.085 * min(1.0, wide / 0.6), 0.06), off = vec2(0.1,-0.075) * mix(0.75,1.25, uSpace);
  // it hangs, and turns a little this way and that
  float turn = 0.3 * sin(uTime * 0.053), tip = 0.012 * sin(uTime * 0.21);
  vec2 q = (p - mid) / s, m = q - off;
  mat2 lean = rot(tip);
  q = lean * (q - vec2(0.0,0.6)) + vec2(0.0,0.6);
  q.x /= cos(turn); q.y += 0.06 * sin(turn) * q.x;
  // and the sun throws its shadow, another way about
  m = vec2(m.x * 1.03 + (0.1 - 0.2 * turn) * m.y, m.y * 1.06 - 0.05 * m.x);
  m = lean * (m - vec2(0.0,0.6)) + vec2(0.0,0.6);
  btPx /= s;
  btStart(q, m, 0.09, vec2(0.0));
  if (max(abs(q.x), abs(q.y)) < 0.52 || max(abs(m.x), abs(m.y)) < 0.52) { // near the glass or its shadow
    btRun(33,42, vec4(-.0899,.1051,.7609,.6488), vec4(0.0,0.0,9.0,9.0), vec4(0.0), vec3(0.0), 5.0);
    btRun(42,48, vec4(.2839,.0021,.2661,.9639), vec4(0.0,0.0,9.0,9.0), vec4(0.0), vec3(0.0), 5.0);
  }
  btHang(q);
  float x = btSh / 0.0075; x *= x;
  float shade = exp(-x) * 0.85 - 0.5 * exp(-x * 8.0);
  vec3 glow = vec3(0.0);
  glow += btPool(q, -.117,.065,.28,.75, btGas[2], btEnds[2].z);
  glow += btPool(q, -.039,.016,.28,2.603, btGas[0], btEnds[0].z);
  glow += btPool(q, .062,.063,.23,3.835, btGas[1], btEnds[1].z);
  glow += btPool(q, .198,-.054,.28,5.026, btGas[3], btEnds[3].z);
  glow += 2.4 * btPool(q, -.027,-.096,.13,6.341, btGas[4], btEnds[4].z);
  // its wires, and theirs
  vec2 hang = vec2(q.x + 0.195 + 0.06 * (q.y - 0.328), q.x - 0.049 - 0.03 * (q.y - 0.27));
  vec2 wire = btStep(0.0013 + btPx, 0.0013 - btPx, abs(hang)) * step(vec2(0.328,0.268), vec2(q.y));
  hang = vec2(m.x + 0.195 + 0.06 * (m.y - 0.328), m.x - 0.049 - 0.03 * (m.y - 0.27)) / 0.005;
  hang = exp(-hang * hang) * btStep(vec2(0.318,0.258), vec2(0.335,0.275), vec2(m.y));
  shade = sat(shade + 0.4 * max(hang.x, hang.y));
  // the wall and the bench
  float edge = p.y + 0.405, bench = btStep(-btPx, btPx, -edge);
  vec3 wall = mix(vec3(0.93,0.925,0.9), vec3(0.9,0.84,0.75), bench) * (0.96 + btN.x * 0.02 + btN.y * 0.03);
  // the sun through a window of small panes
  vec2 pw = p; pw.y += bench * (0.6 * edge);
  vec2 v = vec2(pw.x + 0.42 * pw.y + 0.06 * sin(uTime * 0.011), pw.y - 0.2 * pw.x - 0.02);
  vec2 pane = vec2(0.31,0.27), cell = abs(fract(v / pane + vec2(0.2,0.4)) - 0.5) * pane;
  float blur = mix(0.016,0.008, uTone);
  vec2 gap = btStep(-blur, blur, 0.5 * pane - 0.012 - cell) * btStep(-0.02,0.02,vec2(0.62,0.45) - abs(v));
  float sky = (0.33 + 0.2 * btStep(0.9,-0.9,p.x) + 0.1 * p.y) * (1.0 - 0.25 * btStep(-0.03,0.0,edge) * btStep(0.05,0.0,edge)) + bench * (0.02 - 1.2 * edge);
  // straight lengths leaning at the left
  vec3 pipe = vec3(1.0);
  float shine = 0.0;
  for (int i = 0; i < 4; i++) {
    float n = float(i), top = 0.1 + 0.16 * fract(n * 0.62), y = (p.y + 0.43 - 0.006 * n) / (top + 0.43);
    float lx = p.x + 0.795 - 0.04 * n - 0.012 * n * n + (0.012 * n - 0.05) * y, r = 0.0062, d = lx / r, in_ = btStep(0.0,0.004,y) * btStep(1.0,0.996,y);
    float c = btStep(r + btPx, r - btPx, abs(lx)) * in_;
    pipe *= mix(vec3(1.0), mix(vec3(0.86,0.91,0.895), vec3(0.2,0.25,0.26), btStep(0.3,1.0,abs(d))), c);
    shine += 0.4 * btStep(0.3,0.0,abs(d + 0.45)) * c;
    float sx = (lx - 0.03 - 0.02 * y) / 0.01;
    sky *= 1.0 - 0.2 * exp(-sx * sx) * in_ * (1.0 - bench);
  }
  vec3 light = vec3(0.86,0.95,1.06) * sky * (1.0 - 0.22 * shade) + vec3(1.12,1.0,0.84) * mix(0.46,0.54, uTone) * gap.x * gap.y * (1.0 - shade);
  vec3 col = wall * (light + glow * 0.36) * pipe + shine * 0.6;
  col = mix(col, vec3(0.13), max(wire.x, wire.y));
  col = col * btThrough + btHi;
  return screenOf(mix(col, btLit.rgb, btLit.a) * 1.25);
}
// How one kind burns: its level, with the piece read where its length of the line begins and ends.
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
  float rest = (day ? 0.3 : 0.17) * (1.0 - sat(uDrone)) * (0.9 + 0.1 * sin(uTime * 0.3));
  btDayOn = day; btAll = day ? btAllB : btAllA;
  btGas[0] = btSet(uDrone, uKind[0], vec4(1.1964,2.2223,2.1199,.9664), .8, rest, btEnds[0]);
  btGas[1] = btSet(uPad, uKind[1], vec4(0.,1.1964,3.4586,.7537), .66,0.0, btEnds[1]);
  btGas[2] = btSet(uTexture, uKind[2], vec4(3.4186,1.7428,.3674,.7642), .52,0.0, btEnds[2]);
  btGas[3] = btSet(max(uPhrase, 0.8 * uMic) + 0.45 * uKeys, uKind[3], vec4(5.1615,1.4277,4.6041,.8431), .38,0.0, btEnds[3]);
  btGas[4] = btSet(uHits, uKind[4], vec4(6.5892,.6106,6.0111,.6591), .24,0.0, btEnds[4]);
  // the drawing turns on its side in a tall picture, and shrinks to fit
  vec2 q = p;
  float s = min(1.0, wide / 0.87);
  if (wide < 0.5) { q = vec2(p.y, -p.x); s = min(0.5 / 0.87, wide / 0.47); }
  q /= s;
  btN = vec3(noise(q * vec2(3.1,0.9) + 3.1), noise(q * 4.2 + 11.0), day ? 0.0 : noise(q * 10.4 + 5.0));
  vec3 c = vec3(0.0);
  if (day) c = btDay(p, wide);
  if (!day) { btPx /= s; c = btWall(q); }
  return c;
}
