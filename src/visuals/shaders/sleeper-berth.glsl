// name: Sleeping car
// a: Lower berth
// b: Corridor
// what: Lying awake in the lower berth of a night train: a dark veneered wall with a line of inlay, the berth above, a blanket, a glass in a net, a small blue lamp, and bars of light that come in under the blind and walk over it all; or the empty corridor, pools of light in file on the carpet, an amber lamp at its far end.
// follows: Drone is the still moonlight, pad a slow station lamp, phrase a lamp passing by, texture the rain in their light; a hit lights one more lamp for a moment, a cue the reading lamp or a compartment. The bands and the piece light inlay, brass and carpet, low and a voice the lamps inside, keys a glint; travel is the train's pace, the loop swings the moon.
// own: 0 blinds nearly down at -1, up at 1, the corridor's panes wide and bare; 1 clear moonlight and a full moon at -1, first rosy daylight at 1; 2 walls of cream enamel at -1, green buttoned leather at 1; 3 close under the window (berth) or a child's height (corridor) at -1, drawn back or turned to the windows at 1; 4 thick mist that softens every light at -1, snow falling and heaped on the sill at 1; 5 slatted shutters with barred light at -1, standing in a station under a steady warm lamp at 1
const vec3 slBrass = vec3(.85, .55, .2), slWarm = vec3(1., .6, .26), slZ = vec3(.0, .0, 1.);
const vec3 slNight = vec3(-.61, .31, 1.42);  // the night lamp
const vec3 slRead = vec3(-.55, .3, .86);    // the reading lamp
const vec3 slFar = vec3(.1, .36, 7.9);       // the far lamp of the corridor
vec3 slLight[5];   // the lamps outside: colour and strength
vec3 slAt[5];      // a: which way its light comes, and how soft; b: where it stands
vec3 slAll, slSky, slLow, slBlue, slAmber;  // all of them; the night high and low; the lamps inside
float slHem, slSlat, slSoft, slRain, slSnow, slMist, slClock, slDawn, slMoon, slPx, slLeft;

vec3 slRich(vec3 c, float k) { return max(mix(vec3(dot(c, vec3(.3, .59, .11))), c, k), .0); }
float slStep(float x, float a, float b) { return 1. - smoothstep(a, b, x); }
float slCut(float d, float w) { return 1. - smoothstep(-w, w, d); }
float slIn(float x, float a, float b, float w) { return smoothstep(a - w, a + w, x) - smoothstep(b - w, b + w, x); }
float slLine(float x, float r, float w) { return slCut(abs(x) - r, w); }
float slBell(vec2 d, float k) { return exp(-dot(d, d) * k); }
float slOver(float x) { return smoothstep(.0, .15, x) * slStep(x, .85, 1.); } // a lamp comes and goes
float slBox(vec2 p, vec2 b, float r) { vec2 d = abs(p) - b + r; return length(max(d, .0)) + min(max(d.x, d.y), .0) - r; }
float slFacing(vec3 n, vec3 to) { return sat(dot(n, to) * inversesqrt(dot(to, to) + 1e-5)); }
vec3 slInk(int k, vec3 lamp, float own) { vec3 c = slRich(uKind[k], 1.45); c *= c; return mix(lamp, c / (max(c.r, max(c.g, c.b)) + .08), own); }
float slCentre(float x, float pitch) { return (fract(x / pitch) - .5) * pitch; }
float slSlats(float y) { return slSlat * smoothstep(-.4, .4, sin(y * TAU / .12)); }

// The lamps beside the line, and the weather they shine through.
void slSet() {
  slLeft = uVar < .5 ? -.45 : -.55 - .22 * max(uOwn[0], .0);
  slClock = .5 * (uTime + uTravel);
  slDawn = max(uOwn[1], .0); slMoon = max(-uOwn[1], .0);
  slSnow = max(uOwn[4], .0); slMist = max(-uOwn[4], .0); slSlat = max(-uOwn[5], .0);
  float halt = max(uOwn[5], .0), g = .6 + .9 * uEnergy;
  slHem = mix(.15, uOwn[0] > .0 ? .72 : -.15, abs(uOwn[0]));
  slHem = mix(slHem, max(slHem, .7), slSlat);
  slSoft = (.6 + .8 * uSpace) * mix(1.5, .5, uTone) * (1. + .8 * slSnow + .9 * slMist);
  slRain = (1. - slSnow) * (1. - slMist);
  float pu = fract(slClock / 17. + .12), fu = fract(slClock / 13. + .55), qu = fract(uTime / 60. + .1);
  float hu = .5 + .12 * sin(uTime * .05) + .12 * (1. - uHits);
  pu += .06 * sin(TAU * pu);  // the train slows where a station is
  vec3 moon = mix(mix(vec3(.42, .58, .95), vec3(.75, .85, 1.), slMoon), vec3(1., .5, .36), slDawn);
  slLight[0] = slInk(0, moon, .35 * (1. - slDawn)) * (.42 + 1.3 * uDrone * g + 1.6 * slMoon + 2.2 * slDawn);
  slLight[1] = slInk(1, slWarm, .6) * uPad * g * slOver(pu) * 3.4 + slWarm * halt * (1.8 + uPad);
  slLight[2] = vec3(.75, .72, .6) * .65 * slOver(qu) * (1. - .6 * uLevel);  // the far lamp of the quiet
  slLight[3] = slInk(3, vec3(1., .8, .5), .6) * uPhrase * g * slOver(fu) * 3.4;
  slLight[4] = slInk(4, vec3(1., .75, .5), .55) * uHits * g * 2.8;
  pu = mix(pu, .5, halt);
  float turn = .1 * cos(TAU * uLoop);
  if (uVar < .5) {
    slAt[0] = vec3(1.35 + turn, mix(-.05, .1, slMoon), 1. - .3 * slMoon + slDawn);
    slAt[1] = vec3(4.2 * exp(-2.5 * pu), .1, .9);
    slAt[2] = vec3(3. * exp(-2. * qu), -.4, 1.3);
    slAt[3] = vec3(4.2 * exp(-2.5 * fu), -.22, .8);
    slAt[4] = vec3(3.6 * exp(-2.5 * hu), -.36, 1.);
  } else {
    slAt[0] = vec3(1., 1.25 + turn - .6 * slDawn, .35);
    slAt[1] = vec3(3., 3.5, mix(12., -3., pu));
    slAt[2] = vec3(5., .2, mix(14., -2., qu));
    slAt[3] = vec3(2.6, 1.5, mix(11., -3., fu));
    slAt[4] = vec3(2.6, 2.4, mix(7., 1.5, hu));
  }
  slAll = slLight[0] * .4 + slLight[1] + slLight[2] * .5 + slLight[3] + slLight[4] * .5;
  slLow = mix(vec3(.02, .034, .058), vec3(.1, .14, .2), max(slMoon, .6 * slSnow)) + slLight[0] * .02;
  slLow = mix(slLow, vec3(.8, .34, .2), slDawn);
  slSky = mix(mix(vec3(.006, .01, .024), vec3(.02, .04, .085), slMoon), vec3(.24, .21, .3), slDawn);
  slBlue = vec3(.06, .19, .75) * (.85 + .3 * uLow + .7 * uMic) * (1. - .6 * slDawn);
  slAmber = vec3(1., .45, .12) * (.9 + .35 * uLow + .4 * uMic);
}

// What runs down the glass.
float slWet(vec2 w) {
  return smoothstep(.5, .9, noise(vec2(w.x * 48. + .7 * sin(w.y * 8.), w.y * 2.4 + uTime * .1))) * slRain * (.2 + .8 * uTexture);
}
// How far down the blind is: one in the berth, one to every window of the corridor.
float slHemOf(float z) { return uVar < .5 ? slHem : min(.55, .19 + 1.6 * slHem + .16 * (hash11(floor(z / 1.7) + 3.) - .5)); }
// The light of all the lamps outside on a place inside, its edges softer the farther it has come.
vec3 slCome(vec3 P, vec3 n) {
  bool a = uVar < .5; vec3 sum = vec3(.0);
  float d = max(a ? 2.2 - P.z : .66 - P.x, .0), e = (a ? .018 + .05 * d : .02 + .07 * d) * slSoft, wet = .0;
  for (int i = 0; i < 5; i++) {
    vec3 at = slAt[i], to = a ? vec3(at.xy, 1.) : i == 0 ? at : at - P;
    vec2 w = a ? P.xy + to.xy * d : P.zy + to.zy * (d / to.x);
    float s = e * (a ? at.z : i == 0 ? 1.4 - .7 * slMoon : 1.), x = a ? w.x - .45 : slCentre(w.x, 1.7);
    if (i == 1) wet = .75 * slWet(w);
    float m = slIn(w.y, -.22, slHemOf(w.x), s) * slIn(x, slLeft, -slLeft, min(s, .3));
    m *= 1. - slSlats(w.y) * .9 * exp(-s * s * 110.);
    if (a) m = m * (1. - .85 * slIn(x, -.035, .035, s)) + .5 * slIn(x, .435, .475, s + .01) * slIn(w.y, slHem, .8, s); // the post; a gap by the blind
    else m *= i == 0 ? .8 : 1.6 / (1. + .055 * dot(to, to));
    sum += slLight[i] * m * sqrt(slFacing(n, to)) * (i == 1 || i == 3 ? 1. - wet : 1.);
  }
  return sum;
}

// A wall: veneer in mirrored leaves, or cream enamel, or buttoned leather. q is along and up; n is bent by the buttons.
vec3 slWall(vec2 q, vec2 fw, inout vec3 n, vec3 along, float seam) {
  float c = floor(q.x / seam), x = abs(slCentre(q.x, seam)), own = uOwn[2];
  vec2 g = vec2(x * 5. + c * 7.3, q.y * 1.1 + 3. * c);
  float ring = .5 + .5 * sin((noise(g) * 2.6 + .5 * noise(g * 2.3) + x * 4.) * 9.);
  float pore = noise(vec2(x * 190., q.y * 6. + c)) - .5;
  vec3 wood = mix(vec3(.1, .032, .013), vec3(.36, .145, .052), .15 + .7 * ring) * (1. + .7 * exp(-fw.x * 130.) * pore);
  wood *= 1. - .5 * slLine(x - .5 * seam, .002, fw.x);
  if (own < .0) return mix(wood, vec3(.82, .62, .34), -own);
  vec2 f = fract(vec2(q.x + q.y, q.x - q.y) / .19) - .5, co = cos(PI * f), si = sin(PI * f) * co.yx;
  n = normalize(n + own * .5 * (along * (si.x + si.y) + vec3(.0, si.x - si.y, .0)));
  return mix(wood, mix(vec3(.03, .075, .055), vec3(.13, .25, .18), co.x * co.y), own);
}
// The inlay at height y: two brass lines, pale lozenges between. Gives back the glow the music puts in it.
vec3 slInlay(inout vec3 alb, float along, float y, vec2 fw, float there, float map) {
  float loz = there * slCut((abs(slCentre(along, .14)) * .5 + abs(y) - .026) / (fw.x * .5 + fw.y), 1.);
  float brass = there * slLine(abs(y) - .042, .0055, fw.y);
  alb = mix(mix(alb, vec3(.6, .43, .22), loz * .85), slBrass, brass);
  vec3 m = piece(vec2(sat(map), .6)).rgb * .6 + piece(vec2(sat(map), .3)).rgb * .6;
  return (brass * .5 + loz) * (slBrass * band(map) * .3 + m * m * 1.1) * (.3 + uEnergy);
}
// What is seen through a pane: sky, the low land, the lamps going by; then the glass, the blind.
vec3 slOut(vec3 rd, vec2 w, float away, float hem, float px, vec3 through) {
  float cloth = smoothstep(hem - px, hem + px, w.y) * (1. - slSlat);
  through *= vec3(.5, .36, .2) * (1. - .6 * slLine(w.y - hem - .012, .013, px));
  float ridge = -.05 + .05 * noise(vec2(away * 3. + slClock * .05, 4.)) + .02 * noise(vec2(away * 13. + slClock * .16, 9.));
  vec3 c = mix(slLow, slSky, smoothstep(-.02, .3, rd.y));
  c = mix(c, slLow * mix(.2, .85, max(slSnow, slMoon * .8)), slCut(rd.y - ridge, .004 + .02 * slRain));
  c = mix(c, (slLow + .01) * smoothstep(-.7, .4, rd.y + .2 * noise(vec2(away * 2. + uTime * .02, rd.y * 4.))) * 1.3 + slAll * .015, .85 * slMist);
  for (int i = 1; i < 5; i++) {
    vec3 L = normalize(vec3(slAt[i].xy, uVar < .5 ? 1. : slAt[i].z)), x = cross(rd, L);
    float a = dot(x, x);
    if (dot(rd, L) > .0) c += slLight[i] * (exp(-a * 1800.) * .9 + (.06 + .08 * slMist) / (1. + a * 300.));
  }
  c += vec3(.85, .9, 1.) * slMoon * slCut(length(rd - normalize(uVar < .5 ? vec3(.29, .03, 1.) : vec3(1., .28, 1.2))) - .022, .002);
  vec2 b = w * vec2(34., 30.), r = hash22(floor(b)), o = (fract(b) - .3 - .4 * r) / (.3 + .7 * r.y * r.y);
  c = mix(c, c * .5 + (slLow * .9 + slAll * .05) * slStep(o.y, -.25, .1), slRain * slStep(length(o), .14, .3) * step(.5, r.x) * exp(-px * 30.) * .8);
  c += slWet(w) * (slAll * .016 - c * .3);
  if (slSnow > .0) { // it lies on the sill, and falls past
    b = w * 11. + vec2(slClock * .35 + .4 * sin(w.y * 5.), uTime * .28); r = hash22(floor(b));
    c += slSnow * (slLow * 1.2 + slAll * .05) * slStep(length(fract(b) - .25 - .5 * r), .05 * r.x, .06 + .12 * r.y);
    c = mix(c, slLow * 1.6 + slAll * .08 + .01, slSnow * slStep(w.y + .2 - .14 * noise(vec2(w.x * 5., 1.)), -.07, .11));
  }
  return mix(c, through, cloth) * (1. - .8 * slSlats(w.y));
}
// A lamp seen: a globe of radius r, and the glow about it.
void slGlobe(inout vec3 col, vec3 to, vec3 rd, float t, float r, vec3 c, vec3 core) {
  float tc = dot(to, rd), px = tc * slPx; if (tc > t + .1 || tc < .0) return;
  vec3 off = to - rd * tc; float m = dot(off, off);
  col = mix(col, slBrass * c * .5, slLine(sqrt(m) - r * 1.2, r * .2, px));
  col = mix(col, c * .7 + core * exp(-m / (r * r) * 2.6), slCut(sqrt(m) - r, px));
  col += c * .1 / (1. + m * .25 / (r * r));
}

// How high the blanket lies.
float slBlanket(vec2 q) {
  float h = -.45 + .1 * smoothstep(.3, 1.2, q.y) * slBell(vec2(q.x + .12 - .05 * q.y, .0), 14.) + .13 * slBell(q - vec2(-.2, 1.7), 40.) + .15 * slBell(q - vec2(.06, 1.75), 45.);
  h += .12 * slBell(q - vec2(-.22, 1.12), 15.) + .012 * sin(q.x * 15. + q.y * 9. + 2. * sin(q.y * 5.)) * slStep(abs(q.x - .1), .1, .45);
  float deep = smoothstep(.5, 1.1, q.y); // creases that run down from the knees
  h -= deep * (.03 * slBell(vec2(q.x - .1 + .3 * (q.y - 1.1) + .02 * sin(q.y * 11.), .0), 260.) + .022 * slBell(vec2(q.x + .33 - .4 * (q.y - 1.3), .0), 300.));
  return h - .8 * smoothstep(.32, .74, q.x);
}
// A card at A that looks at the eye: where on it the ray comes through, and how far off.
vec3 slCard(vec3 A, vec3 ro, vec3 rd) {
  vec3 b = normalize(vec3(ro.x - A.x, .0, ro.z - A.z));
  float t = dot(A - ro, b) / min(dot(rd, b), -1e-4); vec3 q = ro + rd * t - A;
  return vec3(dot(q, vec3(-b.z, .0, b.x)), q.y, t);
}

vec3 render(vec2 p) {
  slSet();
  bool a = uVar < .5;
  float up = max(uOwn[3], .0), near = max(-uOwn[3], .0), t, s, lens = a ? 1.12 : .95; int id;
  vec3 ro = .004 * vec3(sin(uTime * .31), sin(uTime * .43), .0);
  vec2 eye = a ? vec2(.28, -.03) - near * vec2(.2, .1) : vec2(-.13 - .36 * up, .05 + .03 * near);
  ro += a ? near * vec3(.1, -.06, .6) + up * vec3(.12, .16, -.7) : -vec3(.2 * up, .62 * near, .3 * up);
  vec3 rd = normalize(vec3(p - eye, lens));
  slPx = 1. / (uRes.y * lens);
  vec2 safe = (step(.0, rd.xy) * 2. - 1.) * max(abs(rd.xy), 1e-5);
  float down = (-1. - ro.y) / safe.y, A = dot(safe, safe);
  // which side is met. 0 the long wall, 1 the window wall
  if (a) {
    t = (2.2 - ro.z) / rd.z; id = 1;
    s = (-.65 - ro.x) / safe.x; if (rd.x < .0 && s < t) { t = s; id = 0; }
    s = min(rd.x > .0 ? (1.3 - ro.x) / safe.x : 9., rd.y < .0 ? 1.3 * down : 9.); if (s < t) { t = s; id = 2; }
    s = (.57 - ro.y) / safe.y; if (rd.y > .0 && s < t && ro.x + rd.x * s < .32) { t = s; id = 3; }
    if (rd.y < -.03) { // the blanket
      float far = max((-.1 - ro.y) / safe.y, .1), end = min(min(t, 2.8 + up), .72 * down), was = .1, last = far;
      for (int i = 0; i < 32; i++) {
        vec3 P = ro + rd * far; float g = P.y - slBlanket(P.xz);
        if (g < .0) { t = mix(last, far, was / max(was - g, 1e-4)); id = 4; break; }
        if (far >= end) break;
        was = g; last = far; far = min(far + max(.6 * g, .03 + .013 * far), end);
      }
    }
  } else {
    t = (8.5 - ro.z) / rd.z; id = 7;
    s = ((rd.x > .0 ? .66 : -.42) - ro.x) / safe.x; if (s < t) { t = s; id = rd.x > .0 ? 1 : 0; }
    if (rd.y < .0 && down < t) { t = down; id = 5; }
    vec2 oc = ro.xy - vec2(.12, .1); float B = dot(oc, rd.xy);
    s = (-B + sqrt(max(B * B - A * (dot(oc, oc) - .561), .0))) / A;
    if (rd.y > .0 && ro.y + rd.y * t > .62 && s < t) { t = s; id = 6; }
  }
  vec3 P = ro + rd * t, n = vec3(.0, sign(-rd.y), .0), alb = vec3(.07, .03, .018), add = vec3(.0);
  float gloss = .3, px = t * slPx, shade = 1.;
  if (id < 2) {
    bool ahead = a && id == 1;
    n = ahead ? -slZ : vec3(id == 1 ? -1. : 1., .0, .0);
    vec3 flat_ = n;
    float x = a ? P.x - .45 : slCentre(P.z, 1.7);
    vec2 q = ahead ? P.xy + .2 : P.zy, fw = vec2(px / max(abs(dot(n, rd)), .05), px); float fx = fw.x * .5;
    alb = slWall(q, fw, n, ahead ? vec3(1., .0, .0) : slZ, .425); gloss = .5;
    if (id == 0) {
      float there = 1.;
      if (a) {
        shade = mix(.45, 1., smoothstep(.0, .12, 2.2 - q.x)) * mix(.35, 1., smoothstep(.0, .25, .57 - q.y)) * mix(.4, 1., smoothstep(-.5, -.25, q.y));
        shade *= (1. - .4 * slBell(q - vec2(1.08, -.1), 90.)) * mix(.4, 1., smoothstep(.35, 1.1, q.x));
      } else { // the compartments' doors; behind one somebody puts the light on
        float dx = abs(x), panel = slBox(vec2(x, P.y + .55), vec2(.25, .26), .03), pane = slBox(vec2(x, P.y - .2), vec2(.25, .33), .06), in_ = slCut(pane, fx), bay = floor(P.z / 1.7);
        alb *= (1. - .6 * slLine(dx - .37, .008, fx)) * (1. - .5 * slLine(panel, .012, fx));
        alb = mix(alb, slBrass * .8, max(slLine(pane - .012, .008, fx), slLine(length(vec2((x - .31) * 1.4, P.y + .14)), .035, fx)));
        alb = mix(alb, vec3(.1, .12, .15) * (1. + .5 * sin(x * 230.) * exp(-fx * 160.)), in_); n = normalize(mix(n, flat_, in_));
        add = in_ * slWarm * ((bay == 1. ? uCue : .0) + (bay == 2. ? uMic * .6 : .0));
        there = smoothstep(.45 - fx, .45 + fx, dx);
        shade = mix(.35, 1., smoothstep(-1., -.7, P.y));
      }
      add += slInlay(alb, q.x, a ? q.y - .13 : q.y + .16, fw, there, a ? 1. - q.x / 2.2 : q.x / 8.);
    } else {
      float pane = a ? slBox(vec2(x, P.y - .28), vec2(.45, .5), .03) : slBox(vec2(x, P.y - .165), vec2(-slLeft, .385), .04), in_ = slCut(pane, fx), hem = slHemOf(P.z);
      float cu = a ? slIn(abs(x), .5, .76, .004) * step(-.75, P.y) : slIn(abs(x), .47 - .6 * (.55 + slLeft), .64 - .6 * (.55 + slLeft), .01 + fx) * slIn(P.y, -.24, .58, px) * smoothstep(-.75, -.57, slLeft), pl = x * (a ? 52. : 150.);
      alb = mix(alb * mix(.4, 1., smoothstep(.0, .1, pane)), slBrass * .7, slLine(pane - .012, .008, fx));
      vec3 through = slLow * .3 + slAll * (a ? .0 : .07); // what comes through the blind
      if (a) for (int i = 0; i < 5; i++) through += .26 * slLight[i] * slBell(vec2(x + .15 - .5 * log(max(slAt[i].x, .05)), P.y - .15 - slAt[i].y), 7.);
      vec3 o = slOut(rd, vec2(x, P.y), a ? rd.x / rd.z : rd.z / max(rd.x, .05) * .2, hem, px, through);
      if (a) o *= 1. - slLine(x, .032, px) * mix(.85, .35, smoothstep(-px, px, P.y - hem));
      in_ *= 1. - cu;
      add = o * in_ * (.4 + .6 * smoothstep(.0, .03, -pane)); alb *= 1. - in_; gloss *= 1. - .8 * max(in_, cu);
      alb = mix(alb, vec3(.34, .05, .06) * (.65 + .35 * sin(pl) * exp(-fx * 120.)), cu); // curtains drawn back
      n = normalize(mix(n, flat_, max(in_, cu)));
      shade = a ? mix(.4, 1., smoothstep(-.65, -.5, P.x)) : mix(.35, 1., smoothstep(-1., -.7, P.y));
    }
  } else if (id == 3) { // the berth above: a painted shell in panels, with ribs of brass
    float fz = px / max(rd.y, .08), k = slCentre(P.z, .62);
    alb = mix(vec3(.27, .25, .215), vec3(.5, .45, .36), max(-uOwn[2], .0)) * (1. - .45 * exp(-k * k * 2500.));
    alb = mix(alb, slBrass * .8, max(slLine(k, .008, fz), slLine(abs(P.x + .16) - .38, .005, px * 1.5)));
    shade = mix(.3, 1., smoothstep(-.65, -.4, P.x)) * mix(.5, 1., smoothstep(.0, .3, 2.2 - P.z)) * mix(.35, 1., slStep(P.x, .24, .26));
  } else if (id == 4) {
    vec2 q = P.xz; float h = slBlanket(q);
    n = normalize(vec3(h - slBlanket(q + vec2(.006, .0)), .006, h - slBlanket(q + vec2(.0, .006))));
    float fz = px / max(dot(-rd, n), .12), z = q.y + .1 * h, nap = .85 + .3 * noise(q * 150.) * exp(-fz * 120.);
    float stripe = max(slLine(z - 1.05, .026, .004 + fz), slLine(abs(z - 1.05) - .06, .007, .003 + fz));
    alb = mix(vec3(.115, .115, .15), vec3(.5, .42, .3), stripe * .9) * nap;
    shade = mix(.35, 1., smoothstep(.0, .3, q.x + .65)) * mix(.5, 1., smoothstep(-.5, -.25, h)); gloss = .0;
  } else if (id == 5) { // a runner of carpet on lino
    float fz = px / max(-rd.y, .05), u = abs(P.x - .12), nap = .75 + .5 * noise(P.xz * vec2(170., 90.)) * exp(-fz * 60.), rug = slCut(u - .37, px);
    vec2 d = abs(fract(vec2(P.x - .12 + P.z, P.x - .12 - P.z) / .13) - .5);
    vec3 pile = mix(vec3(.2, .03, .028), vec3(.34, .2, .09), slStep(length(d), .1, .12 + fz * 12.) * exp(-fz * 14.) * .5);
    pile = mix(pile, vec3(.45, .28, .1), slLine(u - .31, .016, px));
    vec3 m = piece(vec2(sat((P.z - .8) / 5.), sat(.5 + (P.x - .12) / .74))).rgb; add = m * m * pile * rug * nap * (.15 + .5 * uEnergy);
    alb = mix(vec3(.05, .035, .03), pile * nap, rug); gloss = .55 * (1. - rug);
    shade = mix(.3, 1., smoothstep(.0, .16, .54 - u));
  } else if (id == 6) { // the vault
    n = vec3(.12 - P.x, .1 - P.y, .0) / .749;
    float fz = px / max(dot(-rd, n), .05), rib = abs(slCentre(P.z + .85, 1.7));
    alb = mix(vec3(.36, .33, .27), vec3(.5, .45, .36), max(-uOwn[2], .0));
    alb = mix(mix(alb, vec3(.14, .06, .03), slCut(rib - .05, fz)), slBrass * .8, slLine(rib - .06, .008, fz));
    shade = mix(.45, 1., smoothstep(.62, .75, P.y));
  } else if (id == 7) { // the end of the carriage, a door with a lit pane
    n = -slZ;
    vec2 w = P.xy - vec2(.12, .0);
    alb = vec3(.4, .16, .052) * (1. - .7 * slLine(slBox(w + vec2(.0, .22), vec2(.3, .8), .2), .02, px));
    add = slCut(slBox(w - vec2(.0, .1), vec2(.17, .3), .12), px) * slAmber * (.35 + .5 * smoothstep(-.3, .4, w.y));
  }
  if (id == 2 && P.x > 1.29) { // the wall at the sleeper's side
    n = vec3(-1., .0, .0); shade = .7;
    alb = slWall(P.zy, vec2(px / max(rd.x, .05), px), n, slZ, .425);
  }
  // the light: from outside, a blue night lamp, the reading lamp or the lit compartment, the amber lamp
  vec3 lit = slCome(P, n), b = a ? slNight + vec3(.1, .0, .0) - P : vec3(.12 - P.x, .72 - P.y, -slCentre(P.z, 3.4));
  vec3 l = (a ? slRead + vec3(.04, .0, .0) : vec3(-.42, -.1, 2.55)) - P, L = slFar - P;
  float l2 = dot(l, l) + 1e-4;
  lit += slAll * .024 + slBlue * .025 + .004 + slLow * (.4 * slDawn + .45 * slSnow + .8 * slMist);
  lit += slBlue * (.22 + .78 * slFacing(n, b)) * (a ? .17 : .2) / (dot(b, b) + (a ? .04 : .1));
  lit += slWarm * uCue * (a ? .42 * smoothstep(.6, .86, l.y * inversesqrt(l2)) : id == 0 ? .0 : .8) * (.3 + .7 * slFacing(n, l)) / (l2 + .1);
  if (!a) lit += slAmber * ((.12 + .88 * slFacing(n, L)) * 1.5 / (.35 + dot(L, L) * .9) + .006);
  vec3 col = alb * lit * shade + add;
  // a lamp stands in the varnish again
  float sp = pow(slFacing(reflect(rd, n), a ? b : L), 16.0) * gloss;
  col += a ? slBlue * sp * .3 : slAmber * sp * (sp * 1.2 + .16) * shade * (.05 + .6 * pow(1.0 - sat(dot(-rd, n)), 3.0));
  slGlobe(col, (a ? slNight : vec3(.12, .79, rd.y > .3 * (.79 - ro.y) * rd.z ? 1.7 : 5.1)) - ro, rd, t, a ? .037 : .05, slBlue, vec3(.25, .5, .9) * (1.0 - .6 * slDawn));
  if (!a) {
    slGlobe(col, slFar - ro, rd, t, .11, slAmber, vec3(.9, .7, .4));
    vec3 to = cross(slFar - ro, rd); col += slAmber * .2 * exp(-dot(to, to) * 9.0);
    // the brass rail under the windows: the bands run along it, the keys glint on it
    float tr = dot(vec2(.59, -.31) - ro.xy, rd.xy) / A; vec3 Q = ro + rd * tr;
    float u = clamp((Q.y + .31) / .013, -1.0, 1.0), z = Q.z / 8.0, m = exp(-u * u * 5.0);
    vec3 rail = (slBlue * .5 + slAll * .1) * (.1 + .4 * smoothstep(-.2, .9, u)) + slAmber * (.05 + .5 * z * m) + m * (band(z) * .5 + uKeys * 5.0 * smoothstep(.3, 1.0, sin(Q.z * 5.3 + 1.0))) * (.3 + uEnergy);
    float away = length(Q.xy - vec2(.59, -.31));
    if (tr > .0) col += slWarm * uKeys * smoothstep(.4, 1.0, sin(Q.z * 5.3 + 1.0)) * .35 * exp(-away * away * 500.0);
    if (tr > .0 && tr < t) col = mix(col, slBrass * rail, slCut(away - .013, tr * slPx));
    return screenOf(col * 1.5);
  }
  // the reading lamp, a small brass bell
  vec3 q = slCard(slRead, ro, rd); float f = q.z * slPx, w = .026 + .03 * slStep(q.y, .0, .07);
  if (q.z > .0 && q.z < t) {
    vec3 shine = slBrass * (slBlue * .35 + slAll * .06 + .012 + slWarm * uCue * .2) * (.3 + 1.6 * slLine(q.x / w - .4, .1, .15));
    col = mix(col, shine, slLine(q.x, w, f) * slIn(q.y, .0, .085, f));
    col += slWarm * uCue * (slLine(q.y, .006, f) * slLine(q.x, w, f) * 1.6 + .25 * slBell(q.xy, 90.0));
  }
  // a net with a glass in it, that trembles with the train
  q = slCard(vec3(-.53, -.09, 1.02), ro, rd); f = q.z * slPx;
  if (q.z > .0 && q.z < t && abs(q.x) < .2 && abs(q.y) < .25) {
    float sway = sin(uTime * 2.7 + 1.0);
    q.y -= .07; q.xy = rot(.012 * sin(uTime * 1.9) + (.008 + .014 * uLevel) * sway) * q.xy; q.y += .07;
    vec3 here = lit + slBlue * .3 + slAll * .06 + .02;
    float r = .0425 + .025 * q.y, gx = q.x / r, body = slLine(q.x, r, f) * slIn(q.y, -.085, .115, f), top = q.y - .035 + .004 * gx * sway;
    float shine = .1 * smoothstep(.7, 1.0, abs(gx)) + .35 * slLine(gx - .6, .09, .07) + .3 * slLine(top, .0025, f);
    col = mix(col, col * .6, body * .7) + body * (shine * here + slBlue * .4 * slLine(gx + .62, .1, .06));
    col += .3 * here * slLine(length(vec2(gx, (q.y - .115) / .011)) - 1.0, .12, f * 55.0);
    vec2 k = abs(q.xy - vec2(.02, .1));
    col += (2.5 * uKeys + .1) * vec3(1.0, .95, .85) * (exp(-k.x * 260.0 - k.y * 30.0) + exp(-k.y * 260.0 - k.x * 30.0) + .3 * slBell(k, 250.0));
    // cords, hung from a brass bar
    float edge = min(abs(q.x) / .11, 1.0), deep = .16 - .06 * edge * edge * edge + .02 * exp(-q.x * q.x * 500.0), v = (.07 - q.y) / deep;
    vec2 c = abs(fract(q.x * 34.0 * (1.0 + .25 * v) + vec2(5.0, -5.0) * v) - .5);
    float cord = max(slStep(min(c.x, c.y), .04, .04 + f * 45.0) * step(.0, v) * step(v, 1.0), slLine(.07 - q.y - deep, .003, f)) * slLine(q.x, .11, f);
    col = mix(col, vec3(.26, .21, .15) * here, cord * .7);
    col = mix(col, slBrass * here * (.4 + .6 * slLine(q.y - .0745, .002, f)), slLine(q.y - .072, .006, f) * slLine(q.x, .12, f));
  }
  return screenOf(col * 1.5);
}
