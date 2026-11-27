// name: Street organ
// a: Folding card
// b: Pipe front
// what: A book of buff card, punched with slots, climbs fold by fold out of its stack, runs under the brass keys of a street organ and falls away in lazy zigzags; sun through each slot lays a bar of light on the green bench. Or the organ's front at evening: worn gold and cream pipes, trumpets, bells and drums under an arch of bulbs.
// follows: The piece cuts the slots, loop along and room across, and stains card or pipes. Bands lift sixteen keys or light pipes. Drone sways folds or bellows, pad warms bench or arch, texture is fibre or bulbs, phrase lights rollers or trumpets, notes light keys or bells. A hit runs down the rollers or strikes the drums; a cue throws up a fold or lights the bulbs.
// own: 0 night at -1, a white winter noon at 1; 1 oxblood paint at -1, pale blue-grey paint at 1; 2 few wide slots or pipes at -1, many fine ones at 1; 3 low tight folds, or pipes cut level, at -1; loose high folds, or steep peaks of pipes, at 1; 4 low down beside the card, or square before the front and far, at -1; high above the card, or close and raking along the front, at 1; 5 dark blue card or pipes at -1, brick red at 1
const float boW = 1., boL = .42, boH = .70, boLap = 1.68; // the card: width, one panel, height, one loop along it
const int boN = 22;
vec2 boV[boN + 1]; // where it is folded, seen from the side
int boLo, boHi; // which of those are laid for this ray
float boU0; // how far along the first of them is from the keys
vec3 boSun, boSunC, boSky; // the light, its colour, the colour of shade

float boBox(vec2 q, vec2 b, float r) { vec2 d = abs(q) - b + r; return length(max(d, .0)) + min(max(d.x, d.y), .0) - r; }
float boIn(float d, float w) { return 1. - smoothstep(-w, w, d); }
float boNear(float x) { return abs(fract(x + .5) - .5); }
vec3 boWorld(vec3 c, vec3 lo, vec3 hi, float v) { return mix(mix(c, lo, max(-v, .0)), hi, max(v, .0)); }

// The card from the side: from the keys it runs straight, rises, bends down and shuts into zigzags, till it stands in a stack.
struct boRun { float slope, k, shut, tail, r, de; vec2 d; };
vec2 boSide(float u, float side, boRun f) {
  float full = (1. - f.shut) / f.k, v = clamp(u - .62, .0, full), c = 1. - f.k * v;
  float s = min(u, .62) + v - .5 * f.k * v * v + f.tail * max(u - .62 - full, .0) - .5;
  float g = min(s, f.slope), bend = f.r * (f.de + .5 * PI), th = clamp(s - f.slope, .0, bend) / f.r;
  vec2 d = f.d, e = d; if (th > .0) e = vec2(cos(f.de - th), sin(f.de - th));
  vec2 q = vec2(.5, boH - max(s - f.slope - bend, .0)) + g * d + f.r * vec2(d.y - e.y, e.x - d.x);
  return u < .5 ? vec2(u, boH) : q + vec2(-e.y, e.x) * .5 * boL * sqrt(max(1. - c * c, .0)) * side;
}
// Where the card is folded now, as far as is wanted from x = lo to x = hi.
void boFold(float lo, float hi) {
  float feed = fract(uLoop * 2.) * 2. * boL, j0 = floor(feed / boL), flip = 4. * uCue * (1. - uCue);
  float loose = uOwn[3], sway = .02 * sin(uTime * .23) + .05 * uDrone * sin(uTime * .17);
  boU0 = (j0 - 7.) * boL - feed;
  boHi = hi < .75 ? clamp(int((max(hi, -.5) - boU0) / boL) + 1, 1, boN) : boN;
  boLo = lo > -.75 ? clamp(int((min(lo, .45) - boU0) / boL), 0, boN - 1) : 0;
  boRun f = boRun(.22 + .06 * loose, .53 - .12 * loose, .08, .0, .3, .5 + .24 * loose + sway, vec2(1.));
  boRun h = boRun(.45, .40 - sway, .24 + .1 * loose, .24 + .1 * loose, .45, .16 + .25 * loose - sway, vec2(1.));
  f.d = vec2(cos(f.de), sin(f.de)); h.d = vec2(cos(h.de), sin(h.de));
  float full = (1. - f.shut) / f.k;
  f.tail = max(boH - .09 - full + .5 * f.k * full * full + f.slope + f.slope * sin(f.de) + f.r * (f.de + .5 * PI - cos(f.de)), .05) / (4.98 - full);
  for (int i = boLo; i <= boHi; i++) {
    float u = boU0 + float(i) * boL;
    boRun w = f; if (u < .0) w = h;
    boV[i] = boSide(abs(u), ((i + int(j0)) & 1) == 0 ? 1. : -1., w) * vec2(u < .0 ? -1. : 1., 1.);
    boV[i].y += .17 * flip * exp(-(u - 1.3) * (u - 1.3) * 5.); // a cue throws one fold up
  }
}
// A slot of the card: its distance (below 0 is hole), the same dz further back, the piece there.
float boSlot(vec2 at, float dz, out float wall, out vec4 m) {
  float R = 15. * exp2(.8 * uOwn[2]), zc = (at.y - .5) * R, row = floor(zc + .5);
  float h = hash11(row + 41.3), n = floor(5.5 + 25. * h * h), x = fract(at.x) * n, c = floor(x);
  m = piece(vec2((c + .5) / n, .5 - row / R));
  vec2 g = hash22(vec2(c + 3., row + 60.));
  float own = smoothstep(.5, .54, g.x) * (.1 + .34 * g.y);
  float hl = .43 * max(own, sat(m.a * 1.25) * smoothstep(.22, .3, g.y)), there = smoothstep(.0, .05, hl);
  vec2 b = vec2(hl * boLap / n, .31 / R * there), q = vec2((x - c - .5) * boLap / n, (zc - row) / R);
  float off = .004 * (1. - there), r = min(b.y * .7, b.x);
  wall = boBox(q + vec2(.0, dz), b, r) + off;
  return max(boBox(q, b, r) + off, abs(at.y - .5) - .465);
}
// How much sun comes past the card, and its colour.
float boLight(vec3 pos, int me, out vec3 tint) {
  vec2 d = boSun.xy, at = vec2(.0); float tr = 1., best = .0, bc = .0, w; vec4 m;
  for (int i = boLo; i < boHi; i++) {
    vec2 e = boV[i + 1] - boV[i], r = boV[i] - pos.xy;
    float k = d.x * e.y - d.y * e.x;
    k = abs(k) < 1e-3 ? 1e-3 : k;
    float t = (r.x * e.y - r.y * e.x) / k, s = (r.x * d.y - r.y * d.x) / k;
    if (t < .004 || i == me || abs(s - .5) > .62) continue;
    float soft = .004 + .03 * t, z = pos.z + boSun.z * t;
    float c = smoothstep(-soft, .0, min(s, 1. - s) * boL) * smoothstep(-soft, soft, min(z, boW - z));
    if (c > bc) { tr *= 1. - bc; bc = c; best = t; at = vec2(boU0 + (float(i) + s) * boL, z); } else tr *= 1. - c;
  }
  float ds = boSlot(vec2(uLoop + at.x / boLap, at.y), .0, w, m), soft = (.002 + .016 * best) * (1.2 - .4 * uTone), hole = boIn(ds, soft) * step(1e-3, bc);
  tint = mix(vec3(1.), .25 + 1.9 * m.rgb / max(m.a, .01), sat(m.a * 1.6) * hole * .85);
  return tr * (1. - bc * (1. - hole));
}
vec3 boBrass(vec3 n, vec3 rd) {
  float up = reflect(rd, n).y, s = sat(dot(reflect(rd, n), boSun)); s *= s * s * s;
  vec3 e = boSky * (.3 + 1.4 * smoothstep(-.1, .9, up)) + boSunC * (.06 + .5 * s + 4. * pow(s, 16.) + .2 * sat(dot(n, boSun)));
  e += boSunC * vec3(.10, .09, .05) * smoothstep(.1, .7, -up);
  return e * (.25 + .75 * smoothstep(.0, .3, abs(up + .05))) * vec3(1.15, .66, .20);
}
// House fronts, out of focus.
vec3 boStreet(vec3 rd) {
  float x = rd.x / max(rd.z, .2) * 2.4 + .4, f = boNear(x), y = fract(rd.y * 7. + .3) - .5, night = max(-uOwn[0], .0);
  float win = boIn(abs(fract(x * 3.) - .5) - .23, .13) * boIn(abs(y) - .29, .13) * smoothstep(.0, .2, f);
  vec3 c = mix(vec3(.62, .72, .80), mix(vec3(.86, .80, .68), vec3(.58, .68, .72), step(.5, hash11(floor(x)))), .85 * smoothstep(.0, .3, f));
  c = mix(c, vec3(.26, .38, .46), win * .6);
  return c * (boSunC * .8 * (1. - night) + boSky) + vec3(1., .62, .22) * win * night * step(.5, hash11(floor(x * 3.)));
}
vec3 boCard(vec2 at, vec3 n, float s, vec4 m, float d, float sh, vec3 tint) {
  vec3 alb = boWorld(vec3(.60, .40, .20), vec3(.10, .15, .27), vec3(.46, .13, .07), uOwn[5]);
  float edge = min(s, 1. - s) * boL; edge *= edge;
  alb *= 1. + (.14 + .3 * uTexture) * (noise(vec2(at.x * 24., at.y * 150.)) - .5);
  alb *= (1. - .35 * exp(-edge * 9000.) + .10 * exp(-edge * 400.)) * (1. - .25 * smoothstep(.44, .5, abs(at.y - .5)));
  alb = mix(alb, alb * (.2 + 1.7 * m.rgb / max(m.a, .01)), sat(m.a * 1.6) * exp(-max(d, .0) * 30.) * .85);
  float l = dot(n, boSun);
  vec3 lit = boSunC * sat(l) * sh * tint + boSky * (.62 + .38 * n.y);
  lit += boSunC * vec3(1., .72, .42) * (sat(-l) * .22 * sh + .10 + .10 * uDrone * uEnergy + .7 * uCue * exp(-(at.x - 1.3) * (at.x - 1.3) * 3.));
  vec2 hit = vec2(at.x * 1.6, (at.y - 1. + uHits) * 5.); lit += boSunC * 1.5 * uHits * exp(-dot(hit, hit));
  vec3 near = (vec3(at.x) - vec3(-.36, .32, -.14)) / .06;
  return alb * lit * (1. - dot(vec3(.6, .6, .35), exp(-near * near)));
}

vec3 boFolding(vec2 p) {
  float v4 = uOwn[4], front = -.62, snow = max(uOwn[0], .0);
  boSun = normalize(vec3(-.34 + .10 * sin(uTime * .013), .80, .30));
  boSunC = boWorld(vec3(1.75, 1.45, 1.02), vec3(1.2, .66, .26), vec3(1.5), uOwn[0]) * (.95 + .15 * uLevel) * (1. - .85 * max(-uOwn[0], .0) * smoothstep(.1, .8, length(p)));
  boSky = boWorld(vec3(.15, .185, .22), vec3(.02, .035, .09), vec3(.40, .44, .50), uOwn[0]) * (.85 + .3 * uSpace);
  float el = .56 + .5 * max(v4, .0) + .17 * min(v4, .0) + .012 * sin(uTime * .05), az = -.30 + .2 * min(v4, .0) + .02 * sin(uTime * .037);
  vec3 ta = vec3(-.10, .32, .42), fw = -vec3(sin(az) * cos(el), sin(el), -cos(az) * cos(el)), ro = ta - (3.95 + .5 * min(v4, .0)) * fw;
  vec3 rt = normalize(cross(vec3(0, 1, 0), fw)), rd = normalize(fw * 2.15 + rt * p.x + cross(fw, rt) * p.y);
  float pix = 1. / (uRes.y * 2.15), tf = rd.y < -.001 ? -ro.y / rd.y : 1e4, dl = length(rd.xy);
  vec3 pos = ro + rd * tf, col = vec3(.0);
  bool bench = pos.z < 1.75 && pos.z > front;
  float tb = bench ? tf : pos.z < front ? (front - ro.z) / rd.z : 1e4;
  // the stretch of the card this ray can meet
  vec2 xs = ro.x + rd.x * (vec2(.0, boW) - ro.z) / rd.z;
  xs = vec2(min(xs.x, xs.y), max(xs.x, xs.y));
  if (pos.z < boW && pos.z > -.6) xs = vec2(min(xs.x, pos.x), max(xs.y, pos.x));
  boLo = boHi = 0;
  if (pos.z > -.65) boFold(xs.x + boSun.x / boSun.y * 1.05, xs.y);
  // its two nearest panels; and how near its cut edge passes
  vec2 ts = vec2(1e4), cs = vec2(.0), ss = vec2(.0); ivec2 is = ivec2(0);
  float zf = -ro.z / rd.z, fe = 1e4; vec2 fq = ro.xy + rd.xy * zf;
  for (int i = boLo; i < boHi; i++) {
    vec2 a = boV[i], e = boV[i + 1] - a, r = a - ro.xy, g = fq - a;
    g -= e * sat(dot(g, e) / dot(e, e)); fe = min(fe, dot(g, g));
    float k = rd.x * e.y - rd.y * e.x;
    k = abs(k) < 1e-3 ? 1e-3 : k;
    float t = (r.x * e.y - r.y * e.x) / k, s = (r.x * rd.y - r.y * rd.x) / k;
    if (t < .1 || t > tb || abs(s - .5) > .62) continue;
    float z = ro.z + rd.z * t, px = pix * t, fx = px / max(abs(k) / (dl * boL), .05);
    float c = smoothstep(-fx, .0, min(s, 1. - s) * boL) * smoothstep(-px, px * 2., min(z, boW - z));
    if (c <= .0) continue;
    if (t < ts.x) { ts = vec2(t, ts.x); cs = vec2(c, cs.x); ss = vec2(s, ss.x); is = ivec2(i, is.x); }
    else if (t < ts.y) { ts.y = t; cs.y = c; ss.y = s; is.y = i; }
  }
  // its slots, and the sun where this ray ends
  vec2 cov = vec2(.0), ds = vec2(.0), rims = vec2(.0); vec4 ms[2]; vec3 spot = pos, tint = vec3(1.), over = vec3(.0); int me = -1; float al = .0, sh = 1.;
  for (int k = 0; k < 2; k++) {
    float wall, t = ts[k], px = pix * t * 1.4; ms[k] = vec4(.0);
    if (cs[k] <= .0 || al > .98) continue;
    ds[k] = boSlot(vec2(uLoop + (boU0 + (float(is[k]) + sat(ss[k])) * boL) / boLap, ro.z + rd.z * t), .012 * rd.z / max(abs(rd.y), .2), wall, ms[k]);
    float hole = boIn(ds[k], px);
    rims[k] = hole * smoothstep(-px, px, wall); cov[k] = cs[k] * (1. - hole + rims[k]);
    if (al < .5 && al + cov[k] > .5) { spot = ro + rd * t; me = is[k]; }
    al += (1. - al) * cov[k];
  }
  if (me >= 0 || (bench && pos.z < boW && pos.z > -.5)) sh = boLight(spot, me, tint);
  al = .0;
  for (int k = 0; k < 2; k++) {
    if (cov[k] <= .0) continue;
    vec2 e = normalize(boV[is[k] + 1] - boV[is[k]]); if (dot(vec2(-e.y, e.x), rd.xy) > .0) e = -e;
    vec3 c = boCard(vec2(boU0 + (float(is[k]) + sat(ss[k])) * boL, ro.z + rd.z * ts[k]), vec3(-e.y, e.x, .0), sat(ss[k]), ms[k], ds[k], sh, tint);
    over += (1. - al) * cov[k] * mix(c, vec3(.36, .25, .14) * (boSky + boSunC * .16), rims[k]); // the card is thick in a slot
    al += (1. - al) * cov[k];
  }
  // the bench, its front board, the street
  if (al < .99) {
    vec3 paint = boWorld(vec3(.045, .16, .09), vec3(.26, .04, .03), vec3(.40, .50, .54), uOwn[1]);
    float y = -(ro.y + rd.y * tb), pl = pos.z * 3.2 + .3, seam = boNear(pl), id = floor(pl + .5);
    float gr = noise(bench ? vec2(pos.x * 5. + id * 17., pos.z * 90.) : vec2(pos.x * 3., y * 40.));
    float big = noise(pos.xz * vec2(2.3, 5.) + id), leaf = smoothstep(.36, .62, noise(pos.xz * vec2(2.6, 3.4) + vec2(.4 * sin(uTime * .11), .3 * sin(uTime * .07))));
    vec3 a = mix(paint * (.82 + .3 * gr), vec3(.30, .25, .16), smoothstep(.40, .62, big * gr + .22 * boIn(seam - .06, .06)) * .6);
    a = mix(a, vec3(.82, .86, .90), snow * smoothstep(.25, .55, big + .2 * gr)) * (1. - .55 * boIn(seam - .01, .01));
    vec2 pile = abs(pos.xz - vec2(1.02, .5)) - vec2(.21, .5), w = pos.xz - vec2(-.5, -.1);
    float ao = 1. - .55 * exp(-8. * length(max(pile, .0))), bars = 1. + .9 * boIn(abs(pos.z - .28) - .2, .15);
    col = a * (boSunC * (boSun.y * sh * tint * mix(.7, 1.15, leaf) * bars + .05 * ao) + boSky * ao + vec3(1.6, 1., .5) * uPad * uEnergy * exp(-dot(w, w) * 1.2));
    if (!bench) col = tb < 9e3 ? a * (boSky * .9 + boSunC * (.06 + .4 * boIn(y - .012, .01))) : boStreet(rd);
  }
  col = col * (1. - al) + over;
  if (zf < tb) col = mix(col, vec3(.80, .62, .40) * (boSky * .9 + boSunC * .22), boIn(sqrt(fe) - .0055, pix * zf) * .9);
  // brass: two rollers, and the bar the keys hang on
  vec3 bn = vec3(.0, 1., .0), add = vec3(.0); float mul = 1., ba = .0, px = pix * 3.6;
  for (int k = 0; k < 3; k++) {
    vec3 cy = k < 2 ? vec3(k == 0 ? .34 : -.34, boH + .052, .048) : vec3(.13, boH + .15, .03);
    vec2 o = ro.xy - cy.xy, dd = rd.xy / dl;
    float dist = abs(o.x * dd.y - o.y * dd.x), far = -dot(o, dd) - sqrt(max(cy.z * cy.z - dist * dist, .0)), z = ro.z + rd.z * far / dl;
    float c = boIn(dist - cy.z, px) * smoothstep(-px, px, min(z + .04, boW + .04 - z)), g = (z - 1. + uHits) / .16;
    if (c <= .0) continue;
    bn = vec3((o + dd * far) / cy.z, .0); ba = max(ba, c);
    mul = k < 2 ? .82 + .18 * smoothstep(.1, .25, boNear(z * 12.)) : 1.;
    add = float(k < 2) * vec3(1., .75, .4) * (uHits * exp(-g * g) * (.5 + uEnergy) + .2 * uMic + .3 * uPhrase) * sat(bn.y);
  }
  // sixteen brass keys, each lifted by its own band
  vec2 H = vec2(.13, boH + .165), e, r; float t = (boH + .09 - ro.y) / rd.y, s = .0, id = .0, b = .0, z;
  if (abs(ro.x + rd.x * t) < .5) {
    for (int k = 0; k < 2; k++) {
      z = ro.z + rd.z * t; id = clamp(floor(z * 16.), .0, 15.); b = uBands[int(id)];
      e = vec2(-.30, -.145 + .08 * b * (.6 + .6 * uEnergy)); r = H - ro.xy;
      float kk = min(rd.x * e.y - rd.y * e.x, -1e-3);
      t = (r.x * e.y - r.y * e.x) / kk; s = (r.x * rd.y - r.y * rd.x) / kk;
    }
    z = ro.z + rd.z * t;
    float f = z - (id + .5) / 16., le = length(e), c = boIn(boBox(vec2((s - .5) * le, f), vec2(.5 * le, mix(.029, .023, s)), .012), px);
    if (c > .5) {
      bn = normalize(vec3(e.y, -e.x, f * 10.)); mul = 1.1;
      add = (piece(vec2(uLoop, 1. - z)).rgb * .5 + vec3(1., .8, .45) * (b * .35 + 1.1 * uKeys * step(.6, hash11(id + 5.)))) * uEnergy * smoothstep(.1, .9, s);
    }
    ba = max(ba, c);
  }
  // the near side of the frame
  t = (-.045 - ro.z) / rd.z; vec2 q = ro.xy + rd.xy * t - vec2(.0, boH), hub = vec2(abs(q.x) - .34, q.y - .052);
  float d = min(boBox(q + vec2(.0, .015), vec2(.42, .05), .03), length(hub) - .05);
  d = smin(d, boBox(q - vec2(.13, .08), vec2(.028, .09), .02), .03);
  d = smin(d, boBox(hub + vec2(.0, .412), vec2(.026, .35), .01), .04);
  float side = boIn(d, px) * step(t, tb), bev = smoothstep(-.014, .0, d) * step(-.07, q.y);
  if (side > .5) {
    float leg = q.y < -.066 ? clamp(hub.x * sign(q.x) * 30., -.8, .8) : .25 * sin(q.x * 6.);
    bn = normalize(vec3(leg, .30 + .5 * bev + .6 * q.y, -.8)); mul = 1.25;
    add = vec3(.16, .09, .03) * boSunC * (.6 + .4 * leg);
  }
  ba = max(ba, side);
  if (ba > .0) col = mix(col, boBrass(bn, rd) * mul + add, ba);
  return screenOf(col * 1.05);
}

// Laid from back to front: colour, facing, own light, brass, how open.
vec3 boAlb, boNrm, boGive; float boMetal, boOpen, boEdge;
const vec3 boFace = vec3(.0, .0, 1.), boNone = vec3(.0);
float boAt(float d) { return boIn(d, boEdge); }
float boLay(float d, float near, vec3 a, vec3 n, vec3 give, float metal, float open) {
  float c = boAt(d);
  boOpen = mix(boOpen * mix(1., smoothstep(-near, near, d), .6), open, c); boAlb = mix(boAlb, a, c); boNrm = mix(boNrm, n, c);
  boGive = mix(boGive, give, c); boMetal = mix(boMetal, metal, c);
  return c;
}
float boRod(vec2 q, vec2 a, vec2 b) { q -= a; b -= a; return length(q - b * sat(dot(q, b) / dot(b, b))); }

vec3 boFront(vec2 p) {
  float night = max(-uOwn[0], .0), yaw = -.46 - .26 * min(uOwn[4], .0) - .16 * max(uOwn[4], .0) + .02 * sin(uTime * .041), zoom = 1. + .28 * uOwn[4];
  // a wall turned away; each thing on it stands a little before it
  vec3 rd = vec3(p / zoom + vec2(.0, .06 * uOwn[4]), 1.5), tx = vec3(cos(yaw), .0, sin(yaw));
  float k = dot(rd, vec3(-tx.z, .0, tx.x)), tw = 1.5 * tx.x / k, strike = 4. * uHits * (1. - uHits);
  vec2 at = vec2(-1.5 * tx.z + dot(rd, tx) * tw, rd.y * tw), par = vec2(dot(rd, tx), rd.y) / k;
  boEdge = tw / (uRes.y * zoom) * 1.2;
  vec3 board = boWorld(vec3(.15, .24, .20), vec3(.28, .06, .05), vec3(.46, .50, .50), uOwn[1]), trim = vec3(.60, .49, .30), brass = vec3(.60, .39, .12), glow = vec3(1., .62, .25);
  boAlb = board * .3; boNrm = boFace; boGive = boNone; boMetal = .0; boOpen = .5;
  // two ranks of pipes, the back one taller and darker
  for (int r = 0; r < 2; r++) {
    float fr = float(r), P = (.118 - .024 * fr) * exp2(-.6 * uOwn[2]);
    vec2 q = at - par * (.03 + .10 * fr);
    float x = q.x / P + .5 * fr, i = floor(x), X = (i + .5 - .5 * fr) * P, h = hash11(i + 31. + 70. * fr), town = .5 + .5 * cos(X * 8.5 + 1.);
    float b = uBands[int(mod(i + 8., 16.))], steep = 1. + .8 * min(uOwn[3], .0) + .6 * max(uOwn[3], .0);
    float top = .42 - .22 * fr - steep * (.06 + .19 * town + .24 * abs(X - .16 - .1 * fr)) + .05 * h + .02 * b;
    float mouth = -.13 - .05 * fr - .08 * town, toe = smoothstep(.0, .16, mouth - .035 - q.y), wide = mix(.46, .09, toe), s = clamp((x - i - .5) / wide, -1., 1.), up = sqrt(1. - s * s);
    top = max(top, mouth + .14);
    vec4 m = piece(vec2(.5 + X / 1.9, .5 - q.y));
    vec3 a = fract(i * .5 + .25 + .5 * step(.55, town)) < .5 ? vec3(.56, .38, .13) : vec3(.74, .64, .46);
    a = boWorld(a, vec3(.08, .12, .24) + .25 * a, vec3(.52, .16, .10) + .15 * a, uOwn[5]);
    vec2 u = vec2(abs(x - i - .5) * P, q.y - mouth);
    float ring = min(abs(abs(q.y - top + .05) - .012), abs(u.y - .12)) - .004;
    a = mix(a, trim * vec3(.8, .36, .26), .7 * boAt(ring)) * (.9 + .2 * h) * (.6 + .4 * fr);
    a = mix(a, a * (.3 + 1.5 * m.rgb / max(m.a, .01)), sat(m.a * 1.3) * .75);
    // the mouth: a dark slot under a pointed leaf
    float slot = boAt(max(u.x - .27 * P, max(-u.y - .022, u.y - .012)));
    a *= (1. - .3 * boAt(max(u.x - .27 * P, max(-u.y, u.y - .10 + u.x * 2.4)))) * (1. - .98 * slot);
    float shine = exp(-(s + .35) * (s + .35) * 10.) * (1. - toe) * (1. - slot);
    boLay(max((abs(x - i - .5) - wide) * P, q.y - top - .012 * up), .03, a, vec3(s, -.1 * toe, up + .05),
      (glow * slot * (.04 * uDrone + .05 * b * b) + (m.rgb * .2 + vec3(.3, .2, .1) * b) * shine) * uEnergy, .5 * (1. - slot), (.5 + .5 * fr) * (.45 + .55 * up));
  }
  // the fan of brass trumpets
  for (int i = 0; i < 5; i++) {
    float f = float(i), a = .20 + .27 * f, len = .50 - .05 * abs(f - 1.8);
    vec2 d = vec2(cos(a), sin(a)), q = at - par * .24 + vec2(.80, .36); q = vec2(dot(q, d), dot(q, vec2(-d.y, d.x)));
    float g = sat(q.x / len), w = .007 + .013 * g; g *= g; g *= g; w += .045 * g * g;
    float s = clamp(q.y / w, -1., 1.), mo = length((q - vec2(len, .0)) * vec2(2.4, 1.)) - .056;
    boLay(min(max(abs(q.y) - w, q.x - len), mo - .009), .03, brass, vec3(-d.y * s, d.x * s, sqrt(1.02 - s * s)), boNone, 1., 1.);
    boLay(mo, .002, vec3(.05, .03, .02), boFace, mix(glow, uKind[3], .6) * uPhrase * (.2 + .5 * uEnergy) * sat(-mo * 17.), .0, 1.);
  }
  // the scrolled rail, and the bellows
  vec2 q = at - par * .20;
  float d = q.y + .30 + .022 * cos(q.x * 14.) + .02 * cos(q.x * 28. + .4), breath = .05 * sin(uTime * .21) + .25 * uDrone * (.6 + .4 * sin(uTime * .13));
  float pl = fract((q.y + .70) / (.034 + .0085 * breath)) * 2. - 1., low = boIn(q.y + .378, .002);
  boLay(d, .05, mix(mix(board, trim, boAt(abs(d + .022) - .005)), vec3(.26, .13, .08), low), vec3(.0, mix(.2, pl, low), 1.), boNone, .0, mix(1., 1. - .65 * abs(pl), low));
  // a row of bells
  q = at - par * .26;
  float n = clamp(floor(q.x / .085), -3., 3.), sz = .030 - .0022 * n;
  q = rot(.25 * uKeys * sin(uTime * 5. + n * 2.1)) * (q - vec2((n + .5) * .085, -.275)) + vec2(.0, sz);
  float v = q.y / sz, w = sz * (v > .0 ? .72 * sqrt(max(1. - v * v, .0)) : .72 + .36 * v * v), s = clamp(q.x / max(w, 1e-3), -1., 1.);
  boLay(max(max(abs(q.x) - w, -q.y - sz), q.y - sz), .02, brass, vec3(s, .5 * v, sqrt(1.05 - s * s)), glow * uKeys * uEnergy * .5 * sat(.6 - s), 1., 1.);
  // two drums with jointed sticks
  for (int i = 0; i < 2; i++) {
    float f = float(i), R = .155 - .06 * f; q = at - par * (.28 + .04 * f) - vec2(.66 - .255 * f, -.24 - .06 * f);
    float l = length(q), wave = (l - R * (1. - uHits)) / .02, rim = smoothstep(.0, .02, abs(l - R * .86));
    vec2 J = vec2(-.9, 1.05) * R, B = J + rot((.55 + .2 * f) * strike) * vec2(.85, -.95) * R;
    boLay(l - R, .06, vec3(.36, .08, .05), vec3(q / R * .6, 1.), boNone, .0, .4 + .6 * rim);
    boLay(l - R * .86, .004, vec3(.80, .66, .45) * (1. - .25 * smoothstep(.0, R, l)), boFace, mix(glow, uKind[4], .5) * uHits * (.10 + .45 * exp(-wave * wave)), .0, .7 + .3 * rim);
    boLay(min(boRod(q, J, B), boRod(q, J, J + vec2(.4, .5) * R)) - .006, .02, vec3(.30, .17, .08), vec3(.0, .3, 1.), boNone, .3, 1.);
    boLay(length(q - B) - .020, .02, vec3(.62, .50, .34), vec3((q - B) / .02, 1.), boNone, .0, 1.);
  }
  // the arch over all, and its one row of bulbs
  q = at - par * .34 - vec2(.06, -.74);
  float da = length(q) - 1.10, ang = atan(q.x, q.y + 1e-5) / PI * 26. + .5, id = floor(ang);
  vec2 bq = vec2((ang - id - .5) / 26. * PI * 1.1, da); float bl = length(bq) - .017, chase = .5 + .5 * sin(id * .8 - uTime * .55); chase *= chase;
  vec4 m = piece(vec2(.5 + id / 16., .5));
  vec3 glass = mix(mix(glow, kindColour(mod(id + 20., 5.)), .5), m.rgb / max(m.a, .01), sat(m.a) * .4); glass *= glass * 1.3;
  boLay(-.055 - da, .16, board * .4, boFace, boNone, .0, 1.);
  boLay(abs(da) - .055, .03, mix(board, trim, boAt(abs(abs(da) - .044) - .006)), boFace, boNone, .0, 1.);
  boLay(bl - .006, .02, brass * .6, vec3(bq / .023, 1.), boNone, .6, 1.);
  float lamp = (.30 + .55 * chase * chase + .8 * sat(m.a) + 1.3 * uCue + .4 * uTexture * hash11(id + 9.)) * (.35 + .65 * uEnergy) * (.85 + night), core = exp(-dot(bq, bq) * 9000.), halo = sat(1. - bl * 20.);
  boLay(bl, .004, glass * .5, vec3(bq / .017, .7), (glass * .8 + core * (.15 + glass)) * lamp, 1., 1.);
  boGive += glass * lamp * .3 * halo * halo * halo * smoothstep(.0, .01, bl);
  // chalky paint, worn through here and there
  float g1 = noise(at * vec2(160., 60.)), g2 = noise(at * vec2(9., 13.) + 4.);
  boAlb = mix(boAlb * (.78 + .22 * g1 + .22 * g2), vec3(.26, .20, .14), smoothstep(.82, .90, g2 * .7 + g1 * .4) * .5 * (1. - boMetal) * step(.8, boOpen));
  // evening from the left, the cool street, the bulbs above
  boNrm = normalize(boNrm);
  vec3 L = normalize(vec3(-.72, .36, .55)), key = boWorld(vec3(1.9, 1.15, .62), vec3(.16, .18, .30), vec3(1.7, 1.6, 1.4), uOwn[0]) * boOpen * (.25 + .75 * boIn(at.x - .7 * at.y + .1, .75));
  float play = (at.x / 1.9 + .5 - uLoop) * 9., sp = sat(dot(boNrm, normalize(L + boFace))); sp *= sp; sp *= sp; sp *= sp;
  vec3 lit = key * sat(dot(boNrm, L)) + boWorld(vec3(.11, .12, .19), vec3(.03, .04, .09), vec3(.42, .46, .52), uOwn[0]) * boOpen * (.7 + .3 * boNrm.y);
  lit += boOpen * (glow * (.14 + .30 * uPad * uEnergy + .5 * uCue + .2 * night + .1 * uMic) * exp(-abs(da) * 2.4) * (.6 + .4 * boNrm.y) + vec3(.5, .36, .2) * exp(-play * play) * uLevel * sin(PI * uLoop));
  return screenOf((boAlb * lit + boMetal * (.2 + boAlb) * key * sp * (.35 + .5 * sp * sp * sp) * (.7 + .6 * uTone) + boGive) * 1.35);
}

vec3 render(vec2 p) {
  if (uVar < .5) return boFolding(p);
  return boFront(p);
}
