// name: Dew web
// a: One orb
// b: Gorse at dawn
// what: A spider's wheel hung between dry stalks at first light, torn on one side, every thread strung with drops that each hold a small upside-down dawn, the sun's disc just behind its middle. Or a slope of gorse in mist, the sun low ahead, dozens of small white webs spread on the spines, and one wheel hanging dark against the sun.
// follows: A drop swells and takes colour where the piece sounds: round the wheel is the loop, middle to edge is the room. On the slope the webs do. The drone sways the webs, the pad widens the haze, texture brings finer dew, the phrase runs a light along, bands draw threads bright. A hit plucks a spoke, or lights one place; a cue lifts the sun. Keys glint.
// own: 0 white fog with grey light at -1, a moonlit blue night at 1; 1 a rose and violet dawn at -1, a green summer one at 1; 2 the whole wheel seen small, or the slope from farther off, at -1, very near at 1; 3 almost bare silk at -1, heavy wet drops and sagging webs at 1; 4 an unbroken wheel and webs on every bush at -1, a wheel in rags and only a few webs at 1; 5 the wheel turned far aside, or the sun at the right and the slope falling the other way, at -1, the wheel flat before us, or a level moor, at 1
const float dwN = 25.;  // the spokes
const float dwSp = .064; // from one turn of the spiral to the next
float dwPx, dwFog, dwNight, dwRose, dwGreen, dwCue;
vec3 dwSunC, dwHaze, dwCool, dwEarth;

void dwSet() {
 dwPx = 1. / uRes.y;
 dwFog = sat(-uOwn[0]); dwNight = sat(uOwn[0]);
 dwRose = sat(-uOwn[1]); dwGreen = sat(uOwn[1]);
 dwCue = 4. * uCue * (1. - uCue);
 dwSunC = mix(vec3(1., .74, .42), vec3(1., .56, .42), dwRose);
 dwHaze = mix(mix(vec3(.70, .40, .16), vec3(.72, .27, .24), dwRose), vec3(.50, .53, .20), dwGreen);
 dwCool = mix(mix(vec3(.125, .155, .20), vec3(.15, .11, .25), dwRose), vec3(.20, .29, .23), dwGreen);
 dwEarth = mix(mix(vec3(.017, .019, .018), vec3(.034, .014, .03), dwRose), vec3(.012, .040, .012), dwGreen);
 dwHaze = mix(mix(dwHaze, vec3(.80, .80, .77), dwFog), vec3(.085, .12, .19), dwNight);
 dwCool = mix(mix(dwCool, vec3(.56, .585, .61), dwFog), vec3(.012, .020, .042), dwNight);
 dwEarth = mix(mix(dwEarth, vec3(.19, .20, .21), dwFog), vec3(.004, .007, .013), dwNight);
 dwSunC = mix(mix(dwSunC, vec3(1., .97, .92), dwFog), vec3(.55, .68, .85), dwNight);
}
float dwHash(float n) { return hash11(mod(n, 977.) + .37); }
// The light far behind, all out of focus: sky, slope, hedge, the sun's disc.
vec3 dwFar(vec2 p, vec2 S) {
 float d = length(p - S), open = .8 + .6 * uPad + 1.3 * uCue + .3 * uMic;
 vec3 c = mix(dwCool * (.85 + .5 * p.y), dwHaze, exp(-d * d * 3.2));
 c += dwHaze * open * (1. - .6 * dwFog) * (.75 * exp(-d * 6.5) + (.12 + .08 * uPad) * exp(-d * 1.8));
 c += dwSunC * (1. - smoothstep(.056, .076, d)) * (1.5 + .9 * uCue) * (1. - .6 * dwFog);
 float x = p.x - S.x, left = (1. - smoothstep(-.42, -.17, x));
 float ridge = S.y - .05 + .15 * x + .02 * sin(p.x * 3.1 + 1.) + left * (.05 + .075 * noise(vec2(p.x * 8., 2.)) + .05 * noise(vec2(p.x * 19., 5.)));
 float g = (1. - smoothstep(-.03, .03, p.y - ridge)), down = max(S.y - .05 + .15 * x - p.y, .0);
 vec3 mist = mix(dwHaze * .36, dwCool * .6, .25);
 float m = exp(-down * (6.5 + 3.5 * uLevel)) * (.10 + .90 * exp(-d * 2.1));
 vec3 slope = mix(dwEarth, mist, sat(.05 + .9 * m));
 slope *= .75 + .5 * noise(vec2(p.x * 2.4 + p.y * 3., p.y * 9.));
 slope = mix(slope, dwEarth * .6 + mist * .14, left * (1. - smoothstep(-.05, .03, p.y - ridge)) * exp(-down * 9.) * .8);
 // dew on the far grass, as soft discs
 vec2 gq = p * 13., id = floor(gq), o = hash22(id + 3.);
 float rd = length(fract(gq) - .3 - .4 * o), sp = step(.62, o.y) * (1. - smoothstep(.16, .24, rd));
 slope += sp * mix(dwHaze, uKind[2] * .5, .4) * smoothstep(.1, .35, down) * (.05 + .5 * uTexture * (.5 + uEnergy)) * (.5 + .5 * sin(uTime * .3 + o.x * 30.));
 return mix(c, slope, g);
}
// One drop: q is the place in it (edge at 1), to is which way the sun lies. A small upside-down dawn.
vec3 dwDrop(vec2 q, vec2 to, vec3 dye, float loud) {
 float r2 = min(dot(q, q), 1.);
 float v = -q.y * (.8 + .7 * r2) + .12 * q.x;
 vec3 c = mix(dwEarth * .9, dwCool * 1.5 + dwHaze * .6, smoothstep(-.10, .12, v));
 c += dwHaze * 1.3 * exp(-abs(v - .06) * 6.);
 float tl = length(to);
 vec2 e = q + to / (tl + .35) * .72;
 float sun = exp(-dot(e, e) * 22.);
 c = mix(c, c * (.25 + 1.4 * dye), loud * .75) + dye * loud * (.25 + .5 * uEnergy) * (1. - .6 * r2);
 c += dwSunC * sun * (2.2 - 1.2 * dwFog) / (.6 + tl);
 c *= 1. - .82 * smoothstep(.55, 1., r2); // the dark rim
 float lip = smoothstep(.62, .95, r2) * (1. - smoothstep(.95, 1., r2));
 c += dwSunC * lip * sat(dot(q, to) / (tl + .1)) * .8 / (.6 + tl); // and its lit edge
 e = q - vec2(-.32, .42);
 return c + (dwCool + .12) * 1.6 * exp(-dot(e, e) * 40.);
}
vec3 dwOrb(vec2 p) {
 float t = uTime, vant = uOwn[2], water = uOwn[3];
 float halfW = .5 * uRes.x * dwPx;
 vec2 H = mix(vec2(min(halfW * .46, .43), .10), vec2(.04, .03), sat(-vant));
 float zoom = .80 * exp(vant * .6);
 vec2 S = H + vec2(.085, .045 + .035 * dwCue);
 vec3 col = dwFar(p, S);
 // the plane of the web, leaning: near at the lower left
 vec2 q = (p - H) / zoom;
 q += (.004 + .016 * uDrone) * vec2(sin(t * .23 + q.y * 2.), .7 * sin(t * .31 + q.x * 2.4)) * exp(-dot(q, q));
 vec2 lean = mix(mix(vec2(-.24, -.20), vec2(.0), sat(uOwn[5])), vec2(-1.15, .10), sat(-uOwn[5]));
 float mag = clamp(1. + dot(q, lean), .35, 1.9);
 vec2 w = q / mag;
 float r = length(w) + 1e-4;
 vec2 dir = w / r;
 float stretch = .93 - .17 * dot(dir, vec2(.6, .8)); // it hangs low to the left
 w /= stretch; r /= stretch;
 float unit = mag * zoom * stretch, px = dwPx / unit; // one of the web on the screen
 float coc = min(.0012 + .034 * abs(mag - 1.16) * (.7 + .6 * uSpace), .0145);
 // which two spokes
 mat2 J = inverse(mat2(dFdx(w), dFdy(w)) / dwPx + mat2(1e-4, .0, .0, 1e-4)) / unit; // from the web back to the screen
 float th = atan(w.y, w.x); if (th < .0) th += TAU;
 float i = floor(th * dwN / TAU);
 float a0 = (i + .5 * dwHash(mod(i, dwN))) * TAU / dwN;
 if (th < a0) i -= 1.;
 if (i < .0) { i += dwN; th += TAU; }
 a0 = (i + .5 * dwHash(i)) * TAU / dwN;
 float i1 = mod(i + 1., dwN), a1 = (i + 1. + .5 * dwHash(i1)) * TAU / dwN;
 float half_ = .5 * (a1 - a0), mid = .5 * (a0 + a1), th1 = tan(half_);
 vec2 md = vec2(cos(mid), sin(mid)), td = vec2(-md.y, md.x);
 float b0 = uBands[int(mod(i, 16.))], b1 = uBands[int(mod(i1, 16.))];
 // a hit plucks the spoke where the loop is: a shiver goes out along it
 float ang = (fract(th / TAU - uLoop + .5) - .5) * TAU, age = 1. - uHits;
 float pl = exp(-ang * ang * 22.) * uHits;
 float wave = pl * (.45 + exp(-pow(abs(r - age * 1.6) * 4., 2.)));
 w += vec2(-dir.y, dir.x) * .022 * uHits * age * exp(-ang * ang * 16.) * sin(r * 13. - age * 22.) * smoothstep(.1, .4, r);
 float x0 = dot(w, md), y0 = dot(w, td);
 float u = clamp(y0 / max(x0 * th1, 1e-4), -1., 1.);
 float f = .5 + .5 * u;
 // where the web ends: five long threads, hung with drops, that run on to the stalks
 float edge = -9., second = -9., ek = .0;
 vec2 en = vec2(1., .0);
 for (int k = 0; k < 5; k++) {
  vec4 e = k == 0 ? vec4(-.985, .17, .99, .0) : k == 1 ? vec4(-.30, -.954, 1., 1.) : k == 2 ? vec4(.72, -.69, 1.02, 2.) : k == 3 ? vec4(.82, .57, 1., 3.) : vec4(-.45, .893, 1., 4.);
  float de = dot(w, e.xy) - e.z, t1 = dot(w, vec2(-e.y, e.x));
  de += .07 * (1. - t1 * t1 * 1.2) - (e.y > .0 ? .0 : .02);
  if (de > edge) { second = edge; edge = de; en = e.xy; ek = e.w; } else second = max(second, de);
 }
 // the threads of the spiral hang a little between spokes; loud bands draw them taut
 float sag = x0 * th1 * (.17 + .22 * max(water, .0)) * (1. - .6 * mix(b0, b1, f));
 vec2 w2 = w + vec2(.0, sag * (1. - u * u));
 float R = dot(w2, md), R0 = R / dwSp - (i + f) / dwN;
 vec4 pc = piece(vec2(fract(th / TAU), sat((r - .15) / .85)));
 float loud = sat(pc.a * 1.5);
 vec3 dye = pc.rgb / max(max(pc.r, max(pc.g, pc.b)), .03);
 dye = mix(vec3(1.), dye * dye, sat(pc.a * 8.));
 vec2 to = (S - p) * 1.7;
 float tl = length(to), glow = exp(-tl * 1.5);
 vec2 tn = to / (tl + 1e-3);
 float lit = glow * smoothstep(-.5, .7, dot(tn, vec2(-.6, .8))) * (1. - dwFog); // threads flare below the sun and to its right
 vec3 silk = mix(mix(dwCool * 1.3 + dwHaze * .3, dwEarth * 1.5, smoothstep(.055, .11, dot(col, vec3(.33)))), dwEarth * .25, dwFog); // pale on the dark, dark on the light
 float we = max(.0010 * (1. + .4 * max(water, .0)), .65 * px) + coc * .6, thin = sat(.0022 / we + .15);
 // the stalks the web is hung on
 for (int k = 0; k < 2; k++) {
  float sg = k == 0 ? -1. : 1., sy = q.y;
  float sx = q.x - (k == 0 ? -1.36 + .10 * sy + .05 * sin(sy * 2.3) : 1.02 - .16 * sy + .04 * sin(sy * 2. + 1.));
  float ny = (fract(sy * 1.1 + .3 * float(k)) - .5) * 16., node = exp(-ny * ny);
  float sw = .017 + .005 * node - .004 * sy, so = .012;
  float cs = 1. - smoothstep(sw - so, sw + so, abs(sx));
  float rim = smoothstep(.1, .9, -sg * sx / sw) * cs;
  col = mix(col, dwEarth * (.5 + .7 * noise(vec2(sx * 90., sy * 7.))) + dwHaze * rim * .30 * (.5 + glow), cs);
 }
 // spokes
 float inside = (1. - smoothstep(-.006, .004, edge));
 float ds = x0 * th1 * (1. - abs(u)) * cos(half_);
 float bs = u < .0 ? b0 : b1, is = u < .0 ? i : i1;
 float spk = (1. - smoothstep(.3 * we, we * 1.2, ds)) * smoothstep(.035 + .02 * dwHash(is + 3.), .06, r) * inside;
 float flare = pow(abs(dir.x * tn.y - dir.y * tn.x), 6.);
 vec3 sc = silk + dwHaze * bs * (.3 + .8 * uEnergy) * (1. - dwFog) + dwSunC * flare * 1.8 * lit + pc.rgb * loud * .3 + mix(dwSunC, uKind[4], .5) * wave * 3.;
 col = mix(col, sc, spk * thin * (.8 + .2 * bs));
 // the fine dust of water on them
 float al = fract(r / .015 + dwHash(is) * 3.) - .5, dz = .0024 * (1. + .5 * uTexture);
 float dust = (1. - smoothstep(dz * .6, dz + coc + px, length(vec2(al * .015, ds)))) * inside * smoothstep(.1, .3, r) * sat(1. + water);
 col = mix(col, (dwCool + dwHaze * .7) * 1.3 + dwSunC * glow + uKind[2] * uTexture * .7, dust * (.4 + .5 * uTexture) * dz / (dz + coc * .6));
 // the hub: a small knot of rings with a hole in it
 float hr = r / .021 - th / TAU + .35 * sin(th * 3.), hub = (1. - smoothstep(.25 * we, we, abs(fract(hr) - .5) * .021)) * smoothstep(.034, .045, r) * (1. - smoothstep(.11, .125, r));
 col = mix(col, silk + dwSunC * .5 * lit, hub * thin * .7);
 // the long threads at the edge
 float fl2 = pow(abs(en.x * tn.x + en.y * tn.y), 6.);
 float fc = (1. - smoothstep(.4 * we, we * 1.4, abs(edge))) * (1. - smoothstep(.22, .30, length(w) - 1.));
 fc = max(fc, (1. - smoothstep(.4 * we, we * 1.4, abs(second))) * step(.0, edge) * (1. - smoothstep(.4, .5, edge)));
 col = mix(col, silk + dwSunC * fl2 * lit, fc * thin);
 // the spiral and its drops, two turns at once, then the drops along the edge
 float run0 = fract(uTravel * .04) * 21. - 1.5;
 for (int k = 0; k < 3; k++) {
  bool rimT = k == 2;
  float n = floor(R0) + float(k), m = n * dwN + i, dy, dt, whole = 1., len, cnt, lf = f, run = .0;
  vec2 tt = td, nn = md;
  if (rimT) {
   if (edge < -.1 || edge > .1) break;
   tt = vec2(-en.y, en.x); nn = en; dy = edge; dt = .0;
   len = 3.; cnt = 62.; lf = dot(w, tt) / len + .5; m = 700. + ek;
   whole = step(second, -.02);
  } else {
   if (n < 3. || n > 17.) continue;
   float j0 = dwHash(m), j1 = dwHash(m + 1.), away = abs(mod(i - 12. + dwN * .5, dwN) - dwN * .5);
   dt = .4 * dwSp * (j1 - j0) + dwSp / dwN;
   dy = R - dwSp * (n + (i + f) / dwN + .4 * (mix(j0, j1, f) - .5));
   // the torn sector, and here and there a lost thread
   float torn = 1.2 - away * .75 + .08 * (n - 8.) + .8 * (dwHash(m * 1.7 + 5.) - .5) + .9 * step(.93, dwHash(m * 2.3 + 11.));
   whole = (1. - smoothstep(-.1, .1, torn + 1.4 * uOwn[4] - .35)) * (1. - smoothstep(-.03, -.01, edge));
   if (whole < .01) continue;
   len = 2. * R * th1; cnt = max(floor(2. * dwSp * n * th1 / .042), 1.);
   dt /= len;
   float back = run0 - n - (i + f) / dwN;
   run = uPhrase * smoothstep(.0, .04, back) * exp(-back * 2.5);
   float fl = pow(abs(td.x * tn.y - td.y * tn.x), 8.);
   float cov = (1. - smoothstep(.3 * we, we * 1.2, abs(dy))) * whole;
   col = mix(col, silk + dwSunC * fl * 1.7 * lit + mix(dwSunC, uKind[3], .6) * run * 2. + pc.rgb * loud * .25, cov * thin * .9);
  }
  float fb = lf * cnt, kb = floor(fb), side = fract(fb) < .5 ? -1. : 1.;
  for (int b = 0; b < 2; b++) {
   float kk = kb + float(b) * side;
   if (kk < .0 || kk > cnt - .5) continue;
   float h = hash21(vec2(m, kk + 2.)), h2 = fract(h * 37.3), fcn = (kk + .5 + .25 * (h2 - .5)) / cnt;
   float big = .0098 + .0065 * h * h + (h2 > .88 ? .004 : .0);
   if (rimT) big *= .85;
   big *= water < .0 ? 1. + .85 * water : 1. + water * (1.3 * h2 - .1);
   big *= 1. + .5 * loud + .35 * wave + .06 * uLow;
   float bx = (lf - fcn) * len;
   // how the thread slopes here, so the drop sits round on it
   float sl = rimT ? .0 : -md.y * sag * (u + 2. * fcn - 1.) / max(x0 * th1, 1e-3) - dt;
   vec2 qq = J * (tt * bx + nn * (dy - sl * bx));
   float dq = length(qq), rr = max(big, .7 * px) + coc;
   if (dq > rr + px) continue;
   float soft = coc * .8 + px * .5, dens = big * big / (rr * rr);
   float cv = (1. - smoothstep(rr - soft, rr + px * .5, dq)) * whole;
   vec3 dc = dwDrop(qq / rr, to, dye, loud);
   float gl = smoothstep(.90, 1., h2) * uKeys * (.5 + .5 * sin(t * .7 + h * 60.));
   dc += mix(dwSunC, uKind[3], .4) * (run * 1.6 + gl * 2.) + mix(dwSunC, uKind[4], .5) * wave * 1.6;
   col = mix(col, dc + dwSunC * .5 * (1. - dens) * glow * (1. - dwFog), cv * mix(.4, 1., dens));
  }
 }
 // the drop a hit lets fall
 float fa = age * age, fs = uHits * smoothstep(.02, .1, age);
 if (fs > .01) {
  float an = uLoop * TAU;
  vec2 fq = p - H - zoom * .62 * vec2(cos(an), sin(an)) + vec2(.0, .02 + 1.3 * fa);
  float fd = length(vec2(fq.x, fq.y > .0 ? fq.y * .5 : fq.y)) / .012;
  col = mix(col, dwDrop(fq / .012, to, uKind[4], .7) + dwSunC * .5, fs * (1. - smoothstep(.85, 1. + dwPx / .012, fd)));
 }
 return col;
}
// The top of the bushes of one row at a place along it.
float dwTop(float x, float k) {
 return .07 + .24 * abs(sin(x * 2.6 + k + 1.1 * sin(x * 1.3 + k * 2.))) * (.65 + .35 * sin(x * .9 + k)) + .10 * abs(sin(x * 7.1 + k * 4.));
}
// A small wheel of dark threads before the sun: how much of it covers.
float dwWheel(vec2 q, float R, float px) {
 float r = length(q) + 1e-4, th = atan(q.y, q.x); if (th < .0) th += TAU;
 if (r > R * 1.9) return .0;
 const float N = 19.;
 float s = th * N / TAU, i = floor(s), f = fract(s) - .5, ang = f * TAU / N;
 float we = max(.0008, px * .6);
 float dsp = r * sin((.5 - abs(f)) * TAU / N), far = R * (1. + .18 * sin(th * 2. + .6) + .06 * sin(th * 5.));
 float is = mod(floor(s + .5), N), long_ = step(.78, fract(is * .382));
 float bb = uBands[int(min(is, 15.))];
 float c = (1. - smoothstep(.3 * we, we * 1.3, dsp)) * (1. - smoothstep(far - .002, far + .004, r - long_ * R)) * (.75 + .25 * bb);
 float x = r * cos(ang) + .05 * r * (.25 - f * f) * 4. * sin(th), sp = R / 11., n = x / sp - (i + f + .5) / N;
 float torn = step(.12, dwHash(floor(n + .5) * N + i + 20.));
 float dr = abs(fract(n + .5) - .5) * sp, bead = .5 + .5 * cos(r * ang * 520.);
 float w2 = we * (.8 + .9 * bead);
 return max(c, (1. - smoothstep(.3 * w2, w2 * 1.2, dr)) * .9 * torn * (1. - smoothstep(far - .006, far, x)) * smoothstep(.018, .026, r));
}
// Straight needles, all of one slant in a tuft, each at its own place along it.
float dwSpine(vec2 q, float slant, float k, float px) {
 float v = q.y, u = q.x + slant * v + 2.2 * sin(v * .11 + q.x * .08 + k), id = floor(u), h = hash21(vec2(id, k));
 float n = v * .4 + h * 17., g = hash21(vec2(floor(n), id + k)), f = fract(n);
 float w = .14 * (1. - f) + .02;
 return sat((w - abs(fract(u) - .3 - .4 * g)) / (px + .1) + .5) * smoothstep(.0, .1, f) * (.1 + .9 * g) * sat(1.3 - px);
}
// Sprigs, each a fan of needles from one place, for the bushes that are near.
float dwSprig(vec2 q, float k, float px) {
 float row = floor(q.y);
 q.x += .5 * mod(row, 2.) + .6 * dwHash(row + k + 50.);
 vec2 id = vec2(floor(q.x), row), f = vec2(fract(q.x) - .5, fract(q.y) + .22), h = hash22(id + k);
 f.x += .3 * (h.x - .5);
 float rr = length(f), s = (atan(f.x, f.y) + .5 * (h.y - .5)) * 6., g = hash21(vec2(floor(s) + 9., id.x * 7. + id.y * 13. + k));
 float w = .036 * (1. - rr / (.7 + .5 * g)), d = abs(fract(s) - .3 - .4 * g) / 6. * rr;
 return sat((w - d) / (px + .012) + .3) * step(.0, w) * smoothstep(.1, .3, rr) * (1. - smoothstep(.36, .5, abs(f.x))) * (.3 + .7 * h.y) * sat(1.3 - 8. * px);
}
// The webs of one row: handkerchiefs of gauze, held out by their corners on the spines, lit through.
vec4 dwSheet(float X, float Y, int k, float px, vec2 p, float sd, vec3 struck) {
 const float cell = .36;
 float t = uTime, water = uOwn[3], fk = float(k), row = fk * 13., id = floor(X / cell), fx = X / cell - id;
 float h = hash21(vec2(id, fk * 3. + 1.)), h2 = fract(h * 53.7), h3 = fract(h * 331.9);
 float here = smoothstep(-.03, .03, .82 - .62 * uOwn[4] - h3) * smoothstep(.0, .12, min(fx, 1. - fx));
 if (here < .01) return vec4(.0);
 float cx = (id + .38 + .24 * h2) * cell, a = (.09 + .07 * h * h2 + .03 * fract(h * 17.)) * (1. - .15 * uOwn[4]) * (1. + .28 * water);
 vec2 l = vec2(X - cx, Y - dwTop(cx, row) + .02 + .24 * h3) / a;
 if (abs(l.y) > 1.5) return vec4(.0);
 float one = max(1. - l.x * l.x, .0);
 l.y += (.06 + .08 * uDrone) * sin(t * .4 + h * 40.) * one * one;
 l = rot(.9 * (h2 - .5)) * l;
 float belly = (.22 + .30 * h3 + .26 * water) * (k < 3 ? 1.1 : .5) * one * one;
 vec2 m = vec2(l.x, (l.y + belly) / (.34 + .22 * fract(h * 71.)));
 float rho = length(m) + 1e-3, ang = atan(m.y, m.x + 1e-5) / TAU + .5;
 ang = fract(ang + .07 * sin(TAU * ang + h * 60.) + h2);
 float si = floor(ang * 7.), f = fract(ang * 7.);
 float r0 = .55 + .45 * dwHash(si + h * 400.), r1 = .55 + .45 * dwHash(mod(si + 1., 7.) + h * 400.);
 float edge = mix(r0, r1, f) * (1. - .22 * sin(PI * f)), k1 = rho / edge, e = px / a;
 float in_ = 1. - smoothstep(1. - 2. * e, 1. + 2. * e, k1);
 // the threads it is held by
 float guy = .0;
 if (k < 4) guy = (1. - smoothstep(.3 * e, 1.3 * e + .006, min(f, 1. - f) * rho * .9)) * (1. - smoothstep(1., 1.9, k1)) * .4;
 if (in_ + guy < .01) return vec4(.0);
 vec4 pc = piece(vec2(.5 + p.x / 1.78, 1. - fk / 6.5));
 float loud = sat(pc.a * 1.5), near = exp(-sd * 1.6), low = (1. - smoothstep(-.9, .6, m.y));
 float hem = exp(-abs(1. - k1) * 14.), net = .5;
 if (k < 4) {
  vec2 nq = m * 8. + h * 30.;
  float n1 = abs(noise(nq) - .5), n2 = abs(noise(nq.yx * 1.9 + 9.) - .5);
  net = mix(.45, max(1. - smoothstep(.0, .12, n1), 1. - smoothstep(.0, .14, n2)), 1. - .22 * fk);
  vec2 dq = m * vec2(20., 13.), di = floor(dq), dh = hash22(di + h * 91.);
  net += (1. - smoothstep(.06, .2 + e * 20., length(fract(dq) - .25 - .5 * dh))) * (.8 + 1.5 * uTexture) * (1. + water) * step(.5, dh.x);
 }
 float thorn = k < 2 ? dwSpine(vec2(X, Y) * 26., 1.4 * (h2 - .5), fk + 30., px * 26.) : .0;
 float fold = noise(vec2(m.x * 2.5 + h * 50., m.y * 5. + m.x * 3.));
 float alpha = in_ * (.24 + .36 * low * fold + .36 * hem + .36 * fold * fold + .2 * net) * (1. - .7 * thorn) * (1. + .72 * min(water, .0) + .4 * max(water, .0)) * smoothstep(.0, .35, length(m - vec2(.15 - .3 * h2, .1)));
 vec3 c = (dwCool * 2.1 + dwHaze * (.5 + 2.6 * near)) * (.35 + .5 * hem + .5 * low * fold + .6 * net * (.4 + near));
 vec3 dye = pc.rgb / max(max(pc.r, max(pc.g, pc.b)), .03);
 c = mix(c, c * (.25 + 1.3 * dye * dye), loud * .7) + pc.rgb * loud * (.15 + .5 * uEnergy);
 c *= 1. + .8 * uBands[int(h2 * 15.99)] + 1.2 * uKeys * smoothstep(.6, 1., sin(h * 70. + t * .6));
 float ph = p.x * .5 + .5 - uLoop;
 c += mix(dwSunC, uKind[3], .6) * exp(-ph * ph * 60.) * sin(PI * uLoop) * uPhrase * 1.2 + struck * (.4 + net);
 return vec4(c, sat(max(alpha, guy)) * here);
}
vec3 dwGorse(vec2 p) {
 float t = uTime, vant = uOwn[2], water = uOwn[3];
 float turn = smoothstep(.0, 1., -uOwn[5]);
 float side = min(.36, .22 * uRes.x * dwPx);
 vec2 S = vec2(mix(-side, side, turn), .17 + .03 * dwCue + .04 * sat(uOwn[5]));
 float yh = .13, zoom = exp(vant * .35);
 float sd = length(p - S), open = .8 + .6 * uPad + .8 * uCue + .3 * uMic;
 vec3 glowC = dwHaze * open * (1. - .6 * dwFog) * (.8 * exp(-sd * 5.) + .35 * exp(-sd * 1.7));
 vec3 sky = mix(dwCool * (1. + .6 * p.y), dwHaze, exp(-sd * sd * 2.4)) + glowC;
 float disc = 1. - smoothstep(.079, .083, sd);
 sky = mix(sky, dwSunC * (1.9 + .8 * uCue), disc * (1. - .6 * dwFog));
 // one wheel hangs dark before the sun, between two dry stems
 vec2 o = p - S + vec2(.012, -.005) + .004 * (uDrone + .3) * sin(t * vec2(.3, .23) + p.yx * 9.);
 float x1 = o.x + .215 - .06 * o.y + .02 * sin(o.y * 9.), x2 = o.x - .225 - .10 * o.y + .015 * sin(o.y * 7. + 2.);
 float stem = max((1. - smoothstep(-dwPx, dwPx, abs(x1) - .009 * (.29 - o.y))), (1. - smoothstep(-dwPx, dwPx, abs(x2) - .009 * (.23 - o.y))));
 float dark = max(stem, dwWheel(rot(.1) * o, .14, dwPx) * .8 * step(x2, .0) * step(.0, x1));
 float hx = p.x - .5 * sin(TAU * uLoop);
 vec3 struck = mix(dwSunC, uKind[4], .6) * exp(-hx * hx * 14.) * uHits; // a hit lights what stands where the loop is
 vec3 col = vec3(.0);
 float T = 1., z = 1.;
 for (int k = 0; k < 6; k++, z *= 1.47) {
  float fk = float(k);
  float s = zoom / z, px = dwPx / s;
  float yb = yh - .60 * s + (.16 - .10 * s) * (p.x - .2) * (1. - 2. * turn - sat(uOwn[5])) + .02 * sin(p.x * 3. + fk * 2.);
  float X = (p.x - .1) / s + fk * 7.31 + .15 * sin(t * .013) / z, Y = (p.y - yb) / s;
  float fog = 1. - exp(-max(z - .6, .0) * .23 * (1. + .5 * uSpace - .4 * uLevel));
  vec3 air = mix(dwCool * .9, dwHaze * .9, exp(-sd * 1.7)) + glowC * .6;
  if (k == 2) { col += T * dark * (dwEarth * .5 + dwHaze * .12); T *= 1. - dark; }
  float row = fk * 13.;
  if (Y < .58) {
   float deep = dwTop(X, row) - Y;
   if (deep < .66) {
    vec4 web = dwSheet(X, Y, k, px, p, sd, struck);
    col += T * web.a * mix(web.rgb, air, fog * .7);
    T *= 1. - web.a;
   }
   // the bushes, all spines
   float e = deep, tex = .3;
   if (k < 5) {
    float s1 = X * 47. + sin(X * 9.) * Y * 16., s2 = X * 83. - sin(X * 7. + 2.) * Y * 30.;
    e += .06 * pow(dwHash(floor(s1) + fk * 31.), 2.) * (1. - abs(2. * fract(s1) - 1.)) + .035 * dwHash(floor(s2) + fk * 17.) * (1. - abs(2. * fract(s2) - 1.)) - .02;
   }
   else e += .09 * (noise(vec2(X * 7., 3.)) - .5) + .05 * (noise(vec2(X * 23., 1.)) - .5);
   float cov = smoothstep(-px, px, e);
   if (cov > .0) {
    if (k < 2) {
     tex = max(dwSprig(rot(.45) * vec2(X, Y) * 13., fk * 7., px * 13.), dwSprig(rot(-.35) * vec2(X, Y) * 17., fk * 7. + 3., px * 17.));
     tex = max(tex, .5 * dwSpine(vec2(X, Y) * 52., -.5 + X, fk * 7., px * 52.));
    } else if (k < 4) {
     tex = max(dwSpine(vec2(X, Y) * 46., -.5, fk * 7., px * 46.), dwSpine(vec2(X, Y) * 57., .45, fk * 7. + 2., px * 57.));
     tex = mix(.3, tex, 1. - .22 * fk);
    }
    float clump = .15 + .85 * smoothstep(.3, .7, noise(vec2(X, Y) * vec2(6., 8.) + fk * 9.));
    float rim = exp(-e * 34.) * .35 + tex * clump * (exp(-e * 5.) * .8 + .04);
    rim *= 1. + (water > .0 ? 1.5 : .6) * water; // wet needles shine
    vec3 c = dwEarth * (.35 + 2.2 * tex * clump) * mix(vec3(.55, 1.1, 1.1), vec3(1.), dwFog) + (struck * .5 + dwHaze * 1.2 * exp(-sd * 1.4) + dwCool * .55) * rim;
    c = mix(c, air, sat(fog + .75 * smoothstep(.03, .4, e) * sat(z * .45 - .45)));
    col += T * cov * c;
    T *= 1. - cov;
   }
  }
  if (T < .01) break;
 }
 return col + T * sky;
}
vec3 render(vec2 p) {
 dwSet();
 vec3 c = sat(screenOf((uVar < .5 ? dwOrb(p) : dwGorse(p)) * (1.25 + .5 * uTone)));
 return mix(c, c * c * (3. - 2. * c), .75 - .35 * dwFog); // deeper darks, clearer lights
}
