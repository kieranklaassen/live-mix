// name: Cut paper shapes
// a: With its hole
// b: Folded cut
// what: Sheets brushed with gouache laid edge to edge, each with holes snipped by big scissors; the shapes that came out are pinned on the next panel, and a painted sheet shows through the holes; or one red sheet, folded, cut and opened off centre on a pale wall, its half leaves turned back on their hinges, three pods pinned beside it.
// follows: Each kind has its own paint: as it sounds the colour deepens, and its shapes sway, grow and lift on their pins, or its flaps open wider. The piece shows through the holes as brush strokes. The mix warms the plain panels and the window light; a voice lifts the paper; a hit lifts one flap, a cue brightens a row; keys light the pins; space deepens the shadows.
// own: 0 1 many small sheets, -1 close up on a few; 1 1 round pebbles and petals, -1 lobed fronds that wave; 2 1 sheet under sheet, holes stepped down and shapes stepped up, -1 all pricked full of small holes; 3 the ground: 1 one dark sheet, -1 pale paper (b: a painted wall); 4 the paint: 1 the sounds' own colours, -1 bare white paper; 5 the light: 1 from behind through the holes, -1 a low sun, long shadows; 6 1 blown loose (b: flaps flung open), -1 the shapes back in their holes (b: flaps shut); 7 1 a wheel of sheets (b: a star folded six times), -1 long narrow strips
vec2 clL = vec2(-.6, .8); // where the light is
const vec3 clRed = vec3(.84, .23, .16);
float clPx, clLong;
vec2 clAt, clCell;        // the place on the wall, which repeat
int clTurn;               // how far its colours move round
float clMax(vec4 v) { v.xy = max(v.xy, v.zw); return max(v.x, v.y); }
float clIn(float d) { return (1.0 - smoothstep(-clPx, clPx, d)); }
float clOff(float x) { return abs(x) < .05 ? (x < 0.0 ? -.05 : .05) : x; } // never 0, to divide by
// Six outlines: 0 a pod, 1 a bean, 2 half a leaf, 3 a pebble, 4 a leaf with two snips, 5 a paring: how deep sixteen cuts go, then what is bitten out.
struct ClForm { vec4 a, b, c, d, dx, dy, dc, ex, ey, ec; float one, two; };
ClForm clForm(int o) {
  ClForm f;
  f.one = o == 1 || o == 4 || o == 5 ? 0.0 : 9.0;
  f.two = o == 4 ? 0.0 : 9.0;
  f.dx = o == 1 ? vec4(-.76,-1.,-.73,-.73) : o == 4 ? vec4(-.39,-.43,-.43,-.43) : vec4(.89,1.,.99,.92);
  f.dy = o == 1 ? vec4(-.65,.1,.68,.68) : o == 4 ? vec4(-.92,.9,.9,.9) : vec4(.45,.09,-.13,-.39);
  f.dc = o == 1 ? vec4(-.11,-.36,-.28,-.28) : o == 4 ? vec4(-.34,.2,.2,.2) : vec4(.21,.1,.12,.26);
  f.ex = vec4(-.71,-.31,-.31,-.31); f.ey = vec4(-.71,.95,.95,.95); f.ec = vec4(.03,-.29,-.29,-.29);
  f.a = o == 0 ? vec4(.42,.46,.57,.86) : o == 1 ? vec4(.61,.64,.73,.84) : o == 2 ? vec4(.32,.34,.42,.72) : o == 3 ? vec4(.62,.63,.74,.87) : o == 4 ? vec4(.51,.52,.57,.83) : vec4(.44,.46,.53,.76);
  f.b = o == 0 ? vec4(.96,.62,.44,.4) : o == 1 ? vec4(.96,.73,.67,.6) : o == 2 ? vec4(1.02,.8,.53,.33) : o == 3 ? vec4(.89,.78,.69,.65) : o == 4 ? vec4(.98,.64,.5,.46) : vec4(1.,.74,.46,.29);
  f.c = o == 0 ? vec4(.38,.43,.57,.85) : o == 1 ? vec4(.61,.64,.69,.85) : o == 2 ? vec4(.23,.39,.62,.92) : o == 3 ? vec4(.62,.62,.64,.75) : o == 4 ? vec4(.46,.45,.58,.83) : vec4(.18,.37,.6,.91);
  f.d = o == 0 ? vec4(.94,.63,.46,.43) : o == 1 ? vec4(.97,.86,.72,.64) : o == 2 ? vec4(.94,.53,.35,.32) : o == 3 ? vec4(.83,.67,.65,.63) : o == 4 ? vec4(.98,.64,.53,.52) : vec4(.95,.64,.5,.45);
  return f;
}
// cut round, or lobed as a frond
float clSoft(vec2 q, ClForm f) {
  float w = .5 * (f.a.x + f.c.x);
  if (uOwn[1] > 0.0) {
    w = .66 * w + .27;
    vec2 e = vec2((q.x - .5 * (f.a.x - f.c.x)) / w, q.y / .95);
    e.x += (f.one < 1.0 ? .4 : .12) * (e.y * e.y - .4);
    return (length(e) - 1.0) * w * .9;
  }
  float x = abs(q.x - .07 * (q.y + 1.0) * sin(q.y * 2.6 - uTime * .4 + w * 20.0)), o = q.y * 10.0 - x * 7.0 + w * 9.0;
  float t = sqrt(sat(1.0 - q.y * q.y * .98)), g = 2.1 * t * cos(o);
  return max((x - t * (.1 + .18 * (1.0 + sin(o)) * (.7 + w))) / sqrt(1.0 + g * g), abs(q.y) - 1.0);
}
float clPrick(vec2 q) {
  q = rot(.4) * q / .034;
  q.x += .5 * mod(floor(q.y), 2.0);
  return (length(fract(q) - .5) - .12 - .2 * noise(floor(q) * .31)) * .034;
}
float clPoly(vec2 q, ClForm f) {
  vec4 u = vec4(.999, .972, .877, .559) * q.x + vec4(.044, .234, .481, .829) * q.y, v = vec4(-.214, -.765, -.938, -.991) * q.x + vec4(.977, .644, .346, .135) * q.y;
  float d = clMax(max(max(u - f.a, v - f.b), max(-u - f.c, -v - f.d)));
  d = max(d, -min(clMax(f.dx * q.x + f.dy * q.y - f.dc) + f.one, clMax(f.ex * q.x + f.ey * q.y - f.ec) + f.two));
  return uOwn[1] == 0.0 ? d : mix(d, clSoft(q, f), abs(uOwn[1]));
}
// Sheet under sheet from the colour a to b.
vec3 clSteps(vec3 a, vec3 b, float d, float dS, float n, float way) {
  const float st = .0155;
  float t = -d / st, i = clamp(floor(t), 0.0, n), x = max(t - i, 0.0);
  vec3 c = mix(mix(a, b, (i - 1.0) / n), mix(a, b, i / n), smoothstep(0.0, clPx / st * 1.5 + .01, x));
  float lit = clamp((dS - d) / st * 1.4, -1.0, 1.0);
  float sh = way > 0.0 ? (i < n ? smoothstep(1.0, .45, 1.0 - x) * sat(-lit) : 0.0) : exp(-x * 2.2) * sat(lit);
  return c * (1.0 - .5 * sh) + .12 * exp(-x * x * 60.0) * step(.5, i) * lit * way;
}
// Gouache: what the flat brush did at q, in the sheet's own frame. x how thick, y how dry.
vec2 clBrush(vec2 q, float seed) {
  seed = fract(seed * .618) * 8.0;
  q = rot(floor(seed) * .78 + .2 * fract(seed * 5.0)) * q + seed;
  float u = q.x + .007 * sin(q.y * 6.0 + seed * 5.0), l = u / .066, i = floor(l), f = l - i;
  float own = hash11(i + seed), tone = mix(hash11(i - 1.0 + seed), own, smoothstep(0.0, .22, f)) - .5;
  float y = q.y + 9.0 * own;
  float fine = noise(vec2(u * 380.0, y * 10.0)), wide = noise(vec2(u * 120.0, y * 2.6));
  return vec2(tone + .7 * (wide - .5), fine * .6 + wide * .4);
}
float clKind(int k) { return k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : k == 3 ? uPhrase : uHits; }
// The five kinds' own, then the plain panels.
const vec3 clPot[13] = vec3[13](vec3(.1,.25,.66),vec3(.78,.27,.52),vec3(.96,.69,.14),vec3(.13,.5,.3),vec3(.88,.25,.15),
vec3(.96,.75,.7),vec3(.09,.11,.17),vec3(.64,.81,.89),vec3(.8,.89,.76),vec3(.97,.84,.42),vec3(.86,.87,.8),vec3(.95,.58,.38),vec3(.36,.28,.52));
// A kind's paint has some of its colour in it, and dries paler when the kind is quiet.
vec3 clPaint(int k) {
  k = (k + clTurn) % 5;
  vec3 c = mix(clPot[k], uKind[k], .22 + .74 * max(uOwn[4], 0.0));
  if (uOwn[4] < 0.0) c = mix(c, vec3(.9, .89, .86) + .08 * uKind[k], -uOwn[4]);
  return mix(mix(c, vec3(.95, .91, .84), .19), c, sat(clKind(k) * (1.1 + uEnergy)));
}
// The sheet at the very back: the piece in wide brush strokes, the loop across, the room downwards.
vec3 clUnder(vec2 p, vec3 paper) {
  float dry = noise(vec2(p.x * 5.0, p.y * 190.0)), l = (p.y + .008 * sin(p.x * 5.0) + .004 * dry) / .058, i = floor(l), f = l - i;
  float own = hash11(i + 41.0), x = .5 + p.x / 1.8 + .03 * (own - .5);
  vec4 m = mix(piece(vec2(x, .5 - (i - .5) * .058)), piece(vec2(x, .5 - (i + .5) * .058)), smoothstep(0.0, .14, f));
  vec3 ink = m.rgb / max(m.a, .02);
  ink = ink * ink * .4 + ink * .6;
  ink = max(mix(vec3(dot(ink, vec3(.333))), ink, 1.18), .02);
  ink *= .84 + .16 * own + .14 * dry;
  return mix(paper, ink, .96 * smoothstep(dry * .4, dry * .4 + .12, m.a * 1.15 - .04));
}
// A pin; a note on the keys lights its head.
vec3 clPin(vec3 col, vec2 q) {
  col *= 1.0 - .4 * (1.0 - smoothstep(.003, .011, length(q + clL * .009)));
  vec3 head = mix(vec3(.16, .16, .18), vec3(.95), (1.0 - smoothstep(0.0, .004, length(q - clL * .0025)))) + uKeys * vec3(.9, .75, .4);
  return mix(col, head, clIn(length(q) - .0062 - .002 * uKeys));
}
// a: where each shape was cut, where it hangs now (its middle, the way its tip points by its size)
const vec4 clHole[8] = vec4[8](vec4(-.7,.17,-.041,.257),vec4(.0,.25,.039,.191),vec4(.595,.345,-.058,.105),vec4(.67,.125,.071,.036),vec4(-.385,-.25,-.02,.199),vec4(-.215,-.27,-.026,-.183),vec4(.365,-.23,-.021,.214),vec4(.8,.27,.019,.189));
const vec4 clPut[8] = vec4[8](vec4(-.345,.215,.062,.253),vec4(.325,.27,-.039,.191),vec4(.595,-.315,.012,.119),vec4(.63,-.075,.063,.05),vec4(-.795,-.3,.069,.188),vec4(-.6,-.3,-.071,-.171),vec4(.06,-.25,.072,.203),vec4(.825,-.2,.038,.186));
const int clOut[8] = int[8](0, 1, 3, 3, 2, 5, 4, 2);
const int clWho[8] = int[8](0, 1, 2, 2, 3, 3, 4, 2);
// the panels, undermost first: middle and half size, and their paint
const vec4 clBox[14] = vec4[14](
vec4(-.33,.2,.22,.36),vec4(-.72,.21,.215,.34),vec4(.32,.25,.19,.3),vec4(-.015,.26,.19,.265),
vec4(.71,-.15,.215,.3),vec4(.71,.3,.225,.275),vec4(.06,-.27,.22,.268),vec4(-.7,-.335,.225,.2),
vec4(-.295,-.295,.19,.25),vec4(.72,-.52,.225,.075),vec4(.36,-.275,.152,.285),
vec4(-1.23,-.15,.32,.5),vec4(1.23,.3,.31,.34),vec4(1.23,-.35,.31,.31));
const int clTint[14] = int[14](5, 0, 6, 1, 7, 2, 8, 9, 3, 5, 4, 10, 11, 12);
vec3 clGround(vec3 c) { return mix(c, uKind[0] * (.06 + .22 * uKind[0]), max(uOwn[3], 0.0)); }
vec3 clPanel(int k) {
  int t = clTint[k];
  if (uOwn[3] != 0.0 || uOwn[4] != 0.0) {
    float h = hash11(float(k));
    vec3 u = uKind[(t + clTurn) % 5], c = t < 5 ? clPaint(t) : mix(clPot[t], t % 4 == 2 ? u * .3 : mix(u, vec3(.93, .91, .86), .62), max(uOwn[4], 0.0));
    c = mix(c, vec3(.86, .855, .83) + .06 * h, max(-uOwn[4], 0.0));
    c = mix(c, vec3(.93, .91, .86) - .05 * h, max(-uOwn[3], 0.0));
    return clGround(c) * (1.0 + max(uOwn[3], 0.0) * (.25 * h - .07)) * mix(vec3(.95, .975, 1.0), vec3(1.03, 1.0, .93), uLevel);
  }
  return t < 5 ? clPaint(t) : clPot[t] * mix(vec3(.95, .975, 1.0), vec3(1.03, 1.0, .93), uLevel);
}
// which shape is nearest: far from the line down its middle
float clNear(vec4 h, vec2 p) {
  vec2 q = p - h.xy;
  q -= h.zw * clamp(dot(q, h.zw) / dot(h.zw, h.zw), -.65, .65);
  return dot(q, q);
}
// how it hangs: back in its hole, or blown loose
vec4 clHung(int k) {
  vec4 h = clPut[k];
  if (uOwn[6] == 0.0) return h;
  float i = float(k), o = max(uOwn[6], 0.0), a = hash11(i + 3.0) - .5;
  h = mix(h, clHole[k] * vec4(1.0, 1.0, .97, .97) + vec4(.028, -.02, .012, 0.0), max(-uOwn[6], 0.0));
  h.zw = rot(o * (3.4 * a + .12 * sin(uTime * .17 + i * 1.9))) * h.zw;
  h.xy += o * (vec2(.14, .16) * (vec2(fract(a * 37.3), fract(a * 91.1)) - .5) + .02 * vec2(sin(uTime * .13 + i), cos(uTime * .11 + i * 2.0)));
  return h;
}
vec3 clA(vec2 p) {
  float sh = mix(.004, .008, uSpace) * clLong, deep = sh + .005, nh = 1e3, np = 1e3, nn = 1e3;
  int ih = 0, ip = 0;
  for (int i = 0; i < 8; i++) {
    float a = clNear(clHole[i], p), b = clNear(clHung(i), p);
    if (a < nh) { nh = a; ih = i; }
    if (b < np) { nn = np; np = b; ip = i; } else nn = min(nn, b);
  }
  // the hole
  vec4 h = clHole[ih];
  float z = length(h.zw);
  vec2 ay = h.zw / z, q0 = p - h.xy, toL;
  mat2 r = mat2(ay.y, ay.x, -ay.x, ay.y);
  ClForm fm = clForm(clOut[ih]);
  float dh = clPoly(r * q0 / z, fm) * z, dhS = clPoly(r * (q0 + clL * deep) / z, fm) * z;
  if (uOwn[2] < 0.0) {
    float dp = clPrick(p) + .03 * (1.0 + uOwn[2]), dq = clPrick(p + clL * deep * .4) + .03 * (1.0 + uOwn[2]);
    dh = min(dh, dp); dhS = min(dhS, dq);
  }
  // the panels: which lies on top here, which under it, and their shadows
  float shade = 1.0, cov = 0.0, pd = 0.0, pds = 0.0;
  int top = 0, under = 0;
  for (int k = 0; k < 14; k++) {
    vec4 b = clBox[k];
    float tilt = (fract(float(k) * .618 + .3) - .5) * .05 * (1.0 + uOwn[6] * (uOwn[6] > 0.0 ? 6.0 : 1.0));
    vec2 q = p - b.xy;
    q += tilt * vec2(-q.y, q.x);
    vec2 e = abs(q) - b.zw, es = abs(q + clL * sh) - b.zw;
    float d = max(e.x, e.y), ds = max(es.x, es.y), c = clIn(d);
    shade = mix(shade * (1.0 - .42 * (1.0 - smoothstep(-sh, sh, ds))), 1.0, c);
    if (c > 0.0) { under = top; top = k; cov = c; pd = d; pds = ds; }
  }
  vec2 bc = p - clBox[top].xy;
  float seed = float(top) * 3.7 + 1.0, paint = clIn(dh) > .5 ? .15 : 1.0;
  vec3 col = mix(clPanel(under), clPanel(top), cov) * shade;
  col += .10 * smoothstep(-.0025, 0.0, pd) * clamp((pds - pd) / sh, -1.0, 1.0) + .10 * (1.0 - smoothstep(0.0, .0025, abs(dh))) * clamp((dh - dhS) / deep, -1.0, 1.0);
  vec3 back = clUnder(clAt, vec3(.955, .935, .89));
  if (uOwn[2] > 0.0 || uOwn[5] > 0.0) {
    vec3 was = back;
    if (uOwn[2] > 0.0) back = mix(back, dh < -.062 ? back * (1.0 - .5 * exp(min(dhS + .062, 0.0) * 90.0)) : clSteps(clPanel(top) * .93, mix(clPaint((ih + 2) % 5), back, .35) * .75, dh, dhS, 4.0, -1.0), uOwn[2]);
    back *= 1.0 + 3.6 * max(uOwn[5], 0.0) * vec3(1.0, .88, .68);
    col += max(uOwn[5], 0.0) * was * (.5 * exp(-max(dh, 0.0) * 22.0) + .25 * col);
  }
  col = mix(col, back * (1.0 - .45 * smoothstep(-deep, deep * .8, dhS)), clIn(dh));
  // the shape on its pin
  h = clHung(ip);
  int who = clWho[ip];
  float s = ip == 6 ? 0.0 : clKind(who), fi = float(ip);
  z = length(h.zw); ay = h.zw / z; q0 = p - h.xy;
  r = rot((.012 + .05 * s) * sin(uTime * (.43 + .06 * fi) + fi * 2.1)) * mat2(ay.y, ay.x, -ay.x, ay.y);
  z *= 1.0 + .07 * s;
  vec2 q = r * q0, pq = q - vec2(ip == 6 ? -.02 : 0.0, .42 * z);
  float up = (.004 + sh * (.8 + 1.4 * s + uMic + .2 * sin(uTime * .31 + fi))) * (.35 + 1.1 * length(pq) / z) * clLong * (1.0 + 1.2 * max(uOwn[6], 0.0));
  toL = r * clL;
  vec2 qs = q + toL * up;
  vec3 c = clPaint(who);
  fm = clForm(clOut[ip]);
  float d = clPoly(q / z, fm) * z, ds = clPoly(qs / z, fm) * z;
  ds = max(ds, length(qs) - 1.03 * z);
  bool crease = ip == 6;
  float df = 9.0, flapShade = 1.0, cs = 1.0;
  if (crease) {
    // folded down its middle: one half is the flap a hit lifts
    d = max(d, q.x); ds = max(ds, qs.x);
    float th = .45 + .08 * sin(uTime * .37) + 6.0 * uHits * (1.0 - uHits), sn = sin(th);
    cs = clOff(cos(th));
    float den = clOff(cs - toL.x * .55 * sn), v = q.x / den;
    df = max(clPoly(vec2(q.x / cs, q.y) / z, fm) * z * abs(cs), -q.x * sign(cs));
    float dfs = max(clPoly(vec2(v, q.y + toL.y * .55 * sn * v) / z, fm) * z, -v) * abs(den);
    flapShade = 1.0 - .42 * (1.0 - smoothstep(-.012, .012, dfs)) * smoothstep(.05, .2, abs(den));
  }
  float body = clIn(d), flap = clIn(df), face = clamp((ds - d) / up, -1.0, 1.0);
  if (clLong > 1.0 || uOwn[6] > 0.0) ds += .08 * smoothstep(.008, 0.0, nn - np);
  col *= mix((1.0 - .45 * (1.0 - smoothstep(-up * .8, up * .8, ds))) * flapShade, 1.0, max(body, flap));
  vec3 front = c * (1.02 - (.08 + .08 * s) * (q.x * .8 - q.y * .4) / z) + .10 * face * smoothstep(-.0025, 0.0, d);
  front *= 1.0 + 1.6 * max(uOwn[5], 0.0);
  if (uOwn[2] > 0.0) front = mix(front, clSteps(front * .86, mix(front, vec3(.97, .94, .87), .5), d, ds, 4.0, 1.0), uOwn[2]);
  if (uOwn[2] < 0.0 && !crease) body *= 1.0 - clIn(clPrick(q + 3.0) + .03 * (1.0 + uOwn[2])) * .8;
  col = mix(col, front * flapShade, body);
  if (crease) {
    vec3 fl = cs > 0.0 ? c * (.78 + .3 * cs) : mix(vec3(.97, .9, .84), c, .12) * (.9 - .12 * cs);
    col = mix(col, fl + uKind[4] * uHits * .3, flap);
  }
  vec2 fp = p - clPut[6].xy;
  col += uKind[4] * uHits * .16 * exp(-dot(fp, fp) * 30.0) * (1.0 - body);
  if (min(d, df) < 0.0) { bc = q; seed = fi * 2.3 + 7.0; paint = 1.0; }
  col = clPin(col, pq);
  vec2 g = clBrush(bc, seed);
  col *= 1.0 - .10 * paint * g.x;
  col = mix(col, col * .75 + .25, .2 * paint * smoothstep(.55, .85, g.y));
  // a cue brightens the lower row
  float go = p.x + 1.0 - 2.4 * (1.0 - uCue);
  return mix(col, min(col * 1.3 + .05, 1.0), uCue * (1.0 - smoothstep(-.06, .06, p.y)) * exp(-1.44 * go * go));
}
// b: the cuts in half the folded sheet: where its hinge starts and the way it runs; how long, how deep, and whose
const vec4 clCut[7] = vec4[7](vec4(.36,.06,-.0, 1.0),vec4(.36,-.34,-.0, 1.0),vec4(.31,.4,-1.0,-.0),vec4(.07,-.4, 1.0,.0),vec4(.085,-.29,.557,.83),vec4(.085,-.06,.557,.83),vec4(.085,.135,.697,.717));
const vec3 clDeep[7] = vec3[7](vec3(.27,.1, 1.0),vec3(.32,.105,.0),vec3(.22,.08, 3.0),vec3(.23,.075, 2.0),vec3(.24,.085, 1.0),vec3(.24,.085,.0),vec3(.215,.075, 4.0));
// how far outside a half leaf: u along its hinge, v out from it
float clHalf(float u, float v, float len, float dp) {
  float x = u / len;
  float d = clMax((v - dp * (vec4(0.0, .36, 1.66, 3.1) + vec4(3.2, 1.4, -1.05, -3.1) * x)) * vec4(.65, .89, .93, .67));
  d = max(max(d, -v), v - dp * (1.0 - .06 * x));
  if (uOwn[1] == 0.0) return d;
  float e = 2.0 * x - 1.0, t = sqrt(sqrt(sat(1.0 - e * e))), g = 1.2 * t * sin(e * 9.4);
  float n = uOwn[1] > 0.0 ? (length(vec2(e, v / dp)) - 1.0) * dp : max((v - dp * 1.15 * t * (.45 + .55 * abs(cos(e * 4.7 + .2 * sin(uTime * .3))))) / sqrt(1.0 + g * g), (abs(e) - 1.0) * len * .5);
  return mix(d, max(n, -v), abs(uOwn[1]));
}
const vec2 clFold[3] = vec2[3](vec2(-.275,.09),vec2(-.035,.12),vec2(.23,.13));
// a pod cut across a fold, so both its sides are the same
float clPod(vec2 q, float l) {
  float x = abs(q.x), y = q.y / l;
  float d = max((x - l * .52 * (1.0 - y)) * .887, max((x - l * .9 * (1.0 + y)) * .743, x - l * (.4 - .1 * y)));
  if (uOwn[1] == 0.0) return d;
  float n = uOwn[1] > 0.0 ? (length(vec2(x / .6, q.y)) - l) * .6 : (x - l * .6 * sqrt(sat(1.0 - y * y)) * (.5 + .5 * abs(cos(y * 4.7)))) * .6;
  return mix(d, max(n, abs(q.y) - l), abs(uOwn[1]));
}
vec3 clB(vec2 p) {
  vec3 col = vec3(.885, .88, .855) * (.985 + .03 * noise(p * 14.0)), red = clRed;
  float many = sat(3.0 * max(uOwn[0], -uOwn[7])), star = max(uOwn[7], 0.0), own = hash21(clCell + 2.3);
  if (uOwn[3] < 0.0) col = mix(col, (uKind[1] * .75 + .08) * (.94 + .12 * clBrush(clAt, 3.0).y), -uOwn[3]);
  col = clGround(col);
  if (uOwn[4] > 0.0) red = mix(red, uKind[(clTurn + 4) % 5], uOwn[4]);
  if (uOwn[4] < 0.0) red = mix(red, vec3(.93, .92, .89), -uOwn[4]);
  mat2 r = rot(-.09 + .004 * sin(uTime * .21) + .3 * max(uOwn[6], 0.0) + .09 * max(-uOwn[6], 0.0) + max(uOwn[0], 0.0) * (.2 * own - .1 + .03 * sin(uTime * .4 + own * 9.0)));
  vec2 q = r * (p - vec2(-.2, -.01)), L = r * clL, bc = p;
  float seed = 0.0, paint = 0.0, wide = 0.0, far = 1.0;
  if (star > 0.0) {
    float a = atan(q.x, q.y), b = mod(a + PI / 6.0, PI / 3.0) - PI / 6.0, l = length(q);
    mat2 t = rot(a - b);
    q = mix(q, vec2(sin(b), cos(b)) * l * 1.85 - vec2(0.0, .385), star);
    L = mix(L, t * L, star); wide = .5 * star; far = 1.0 + .85 * star;
    clPx *= far;
  }
  vec3 back = clUnder(clAt, vec3(.93, .915, .87)), was = back;
  float inside = max(abs(q.x) - .35 - wide, abs(q.y) - .39);
  if (uOwn[5] > 0.0) {
    back *= 1.0 + 3.6 * uOwn[5] * vec3(1.0, .88, .68);
    col += uOwn[5] * (uKind[1] + .3) * (.4 + .6 * uLevel) * exp(-max(inside, 0.0) * 4.5);
  }
  col = mix(col, back, clIn(inside));
  // the nearest cut and pod: the hand slipped a little between the halves
  float side = q.x < 0.0 ? -1.0 : 1.0, near = 9.0;
  vec2 m = vec2(q.x * side, q.y + (q.x > 0.0 ? .005 : 0.0)), Lm = vec2(L.x * side, L.y), w = vec2(9.0), lw = L;
  int at = 0;
  for (int i = 0; i < 7; i++) {
    vec4 k = clCut[i];
    vec2 a = k.zw, o = m - k.xy, u = vec2(dot(o, a), a.x * o.y - a.y * o.x);
    float d = clHalf(u.x, abs(u.y), clDeep[i].x, clDeep[i].y);
    if (d < near) { near = d; w = u; lw = vec2(dot(Lm, a), a.x * Lm.y - a.y * Lm.x); at = i; }
  }
  float len = clDeep[at].x, dp = clDeep[at].y, fi = float(at);
  int who = int(clDeep[at].z + .5);
  vec2 fold = q.y < -.17 ? clFold[0] : q.y < .1 ? clFold[1] : clFold[2];
  // the sheet
  float z = (.008 + .02 * sat(q.x / .4) + .008 * sat(-q.x / .4)) * (.6 + .8 * uSpace + .3 * uMic) * clLong;
  vec2 e = abs(q) - vec2(.36 + wide, .40), es = abs(q + L * z) - vec2(.36 + wide, .40);
  float d = max(max(max(e.x, e.y), -clHalf(w.x, w.y, len, dp)), -clPod(q - vec2(0.0, fold.x), fold.y));
  float ds = max(max(max(es.x, es.y), -clHalf(w.x + lw.x * z, w.y + lw.y * z, len, dp)), -clPod(q + L * z - vec2(0.0, fold.x), fold.y));
  if (uOwn[2] != 0.0) {
    float hd = min(clHalf(w.x, w.y, len, dp), clPod(q - vec2(0.0, fold.x), fold.y)), hs = min(clHalf(w.x + lw.x * z, w.y + lw.y * z, len, dp), clPod(q + L * z - vec2(0.0, fold.x), fold.y));
    if (uOwn[2] > 0.0) col = mix(col, hd < -.0465 ? col * (1.0 - .5 * exp(min(hs + .0465, 0.0) * 60.0)) : clSteps(red * .85, mix(clPaint(who), col, .4), hd, hs, 3.0, -1.0), uOwn[2] * clIn(inside) * step(hd, 0.0));
    else { d = max(d, -clPrick(q) - .03 * (1.0 + uOwn[2])); ds = max(ds, -clPrick(q + L * z * .4) - .03 * (1.0 + uOwn[2])); }
  }
  float cov = clIn(d);
  col *= 1.0 - .36 * (1.0 - smoothstep(-z * .6, z * .6, ds));
  vec3 c = red * (q.x < 0.0 ? 1.0 : .88);
  c *= 1.0 + .16 * side * (1.0 - smoothstep(0.0, .03, abs(q.x - .006))) - .05 * (1.0 - smoothstep(0.0, .02, abs(q.y))) * sign(q.y);
  c += .10 * smoothstep(-.0025, 0.0, d) * clamp((ds - d) / z, -1.0, 1.0);
  if (uOwn[5] > 0.0) c += uOwn[5] * was * (.45 * exp(min(d, 0.0) * 30.0) + .5 * c);
  col = mix(col, c, cov);
  if (cov > .5) { bc = q; seed = 5.0; paint = 1.0; }
  // a cue brightens the row across the middle
  float go = q.x + .6 - 1.4 * (1.0 - uCue);
  col = mix(col, min(col * 1.35 + .05, 1.0), uCue * (1.0 - smoothstep(.09, .17, abs(q.y + .02))) * (1.0 - smoothstep(.34, .36, abs(q.x))) * exp(-4.0 * go * go));
  // the flap, turned back on its hinge
  bool hit = who == 4 && side > 0.0;
  float s = who == 4 ? 0.0 : clKind(who);
  float th = 2.0 + .85 * s + .07 * sin(uTime * (.33 + .05 * fi) + fi * 1.7 + side) + .14 * side * sin(fi * 2.3 + .6);
  th += hit ? 3.4 * uHits * (1.0 - uHits) : 0.0;
  if (uOwn[6] != 0.0) th = uOwn[6] > 0.0 ? mix(th, 2.75 + .2 * s + .1 * sin(uTime * .3 + fi), uOwn[6]) : mix(th, .3 + .5 * s + .1 * sin(uTime * .3 + fi) + (hit ? 2.4 * uHits * (1.0 - uHits) : 0.0), -uOwn[6]);
  float cs = clOff(cos(th)), sn = sin(th), den = clOff(cs - lw.y * .6 * sn), v = w.y / den;
  float df = clHalf(w.x, w.y / cs, len, dp) * abs(cs), dfs = clHalf(w.x + lw.x * .6 * sn * v, v, len, dp) * abs(den), bl = .003 + .012 * sn;
  float flap = clIn(df);
  col *= 1.0 - .36 * (1.0 - smoothstep(-bl, bl, dfs)) * smoothstep(.05, .3, abs(den)) * (1.0 - flap);
  vec3 N = vec3(0.0, -sn, cs) * sign(cs);
  vec3 f = cs < 0.0 ? mix(vec3(.96, .93, .87), clPaint(who), .45 + .5 * (hit ? uHits : s)) : red;
  f *= clamp(dot(N, normalize(vec3(lw, 1.3))) * 1.26, .6, 1.12);
  if (hit) f = mix(f, uKind[4] * 1.25, .6 * uHits);
  vec2 g = q - vec2(.16, .2);
  col += (uKind[4] * .3 + .06) * uHits * exp(-dot(g, g) * 70.0);
  col = mix(col, f, flap);
  if (flap > .5) { bc = w; seed = fi + 20.0; paint = .8; }
  // the pods that fell out of the fold, pinned beside it
  int n = p.y < -.16 ? 0 : p.x > .58 ? 1 : 2;
  float fn = float(n), l = clFold[n].y * (1.0 - .999 * many);
  clPx /= far;
  vec2 o = p - (n == 0 ? vec2(.47, -.27) : n == 1 ? vec2(.67, -.03) : vec2(.47, .19));
  mat2 t = rot((n == 0 ? .5 : n == 1 ? -.3 : .16) + .03 * sin(uTime * (.35 + .07 * fn) + fn * 2.0));
  w = t * o;
  float rise = .004 + .06 * abs(w.x), dd = clPod(w, l), dS = clPod(w + t * clL * rise, l), pod = clIn(dd);
  col *= 1.0 - .36 * (1.0 - smoothstep(-rise, rise, dS)) * (1.0 - pod);
  col = mix(col, red * (1.0 - .14 * smoothstep(-clPx, clPx, w.x)) + .1 * smoothstep(-.0025, 0.0, dd) * clamp((dS - dd) / rise, -1.0, 1.0), pod);
  if (pod > .5) { bc = w; seed = 40.0 + fn; paint = 1.0; }
  col = clPin(col, p.x > .36 ? w - vec2(.01, l * .4) : vec2(m.x - .335, q.y - .375) + star * 9.0);
  g = clBrush(bc, seed);
  col *= 1.0 - .09 * paint * g.x;
  return mix(col, col * .75 + .25, .18 * paint * smoothstep(.55, .85, g.y));
}
vec3 render(vec2 p) {
  float back = uVar < .5 ? 1.0 : clamp(.8 * uRes.y / uRes.x, 1.0, 1.4);
  p = p * back - vec2(.5 * (back - 1.0), 0.0);
  clPx = .75 * back / uRes.y;
  clL = vec2(-.6, .8); clAt = p; clCell = vec2(0.0); clTurn = 0;
  clLong = 1.0 + 2.4 * max(-uOwn[5], 0.0);
  vec2 q = p;
  float disc = 9.0, px = clPx;
  if (uOwn[5] < 0.0) clL = mix(clL, vec2(-.97, .25), -uOwn[5]);
  if (uOwn[0] != 0.0 || uOwn[7] != 0.0) {
    float s = uOwn[0] > 0.0 ? 1.0 + 1.5 * uOwn[0] : exp2(.9 * uOwn[0]);
    vec2 c = vec2(1.84, 1.08), o = vec2(0.0, .01), drawn = exp2(max(-uOwn[7], 0.0) * (uVar < .5 ? vec2(1.0, -.75) : vec2(.9, -.22)));
    if (uVar > .5) { c = mix(vec2(2.8, 1.6), vec2(.96, 1.03), sat(3.0 * max(uOwn[0], -uOwn[7]))); o = vec2(.2, .01); }
    else if (uOwn[7] > 0.0) {
      vec2 w = p + vec2(.16, .06);
      float l = max(length(w), .01);
      vec2 e = normalize(w + 1e-5);
      q = mix(q, .5857 * vec2(atan(w.x, w.y), log(l / .36)), uOwn[7]);
      disc = l;
      clL = mix(clL, vec2(clL.x * e.y - clL.y * e.x, dot(clL, e)), uOwn[7]);
      clPx *= mix(1.0, .5857 / l, uOwn[7]);
    }
    if (uOwn[0] < 0.0) q += uOwn[0] * (uVar < .5 ? vec2(.33, -.02) : vec2(.2, 0.0));
    q *= s * drawn;
    clL *= drawn; clPx *= s * max(drawn.x, 1.0) * .8 + .2;
    if (uVar < .5 || uOwn[0] > 0.0 || uOwn[7] < 0.0) {
      q += o;
      clCell.y = floor(q.y / c.y + .5);
      q.x += .5 * c.x * mod(clCell.y, 2.0);
      clCell.x = floor(q.x / c.x + .5);
      q -= clCell * c;
      clTurn = int(mod(clCell.x * 2.0 + clCell.y * 3.0, 5.0) + .5);
      if (uVar < .5 && mod(clCell.x, 2.0) > .5) { q.x = -q.x; clL.x = -clL.x; }
      q -= o;
    }
  }
  vec3 col = uVar < .5 ? clA(q) : clB(q);
  if (disc < 9.0) {
    clTurn = 0; clPx = px;
    col *= 1.0 - .4 * uOwn[7] * smoothstep(.17, .135, disc);
    col = mix(col, clPaint(3) * (1.0 - .08 * clBrush(clAt, 2.0).x), uOwn[7] * clIn(disc - .145));
    col = mix(col, clPaint(0), uOwn[7] * clIn(disc - .07));
  }
  if (uOwn[5] > 0.0) col *= mix(vec3(1.0), vec3(.27, .25, .28), uOwn[5]);
  // daylight from a window at the upper left
  float fall = length(p - vec2(-.5, .4));
  col *= mix(vec3(1.06, 1.04, 1.0), vec3(.85, .845, .89), smoothstep(.1, 1.7, fall));
  vec2 w = rot(.5) * p + vec2(.06 * sin(uTime * .011), .03 * sin(uTime * .017));
  float e = mix(.07, .015, uTone), x = abs(w.x + .12);
  float pane = (1.0 - smoothstep(.31 - e, .31 + e, x)) * smoothstep(.004, .02 + e, x) * smoothstep(0.0, .02 + e, abs(abs(w.y) - .22));
  if (uOwn[5] != 0.0) {
    if (uOwn[5] > 0.0) pane *= 1.0 - uOwn[5];
    else { col *= mix(vec3(1.0), vec3(.6, .58, .68), -uOwn[5]); pane *= 1.0 - 8.0 * uOwn[5]; }
  }
  return col * (1.0 + vec3(.12, .095, .04) * pane * (.8 + .5 * uLevel));
}
