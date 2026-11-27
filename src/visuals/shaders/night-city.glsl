// name: Night city
// a: Towers
// b: Basalt
// what: The spectrum as a city at night, low notes on the left and high on the right, flown over low, its lit windows and roof lines mirrored in a wet avenue.
// follows: Each tower is as tall as its band is loud and lights more windows as it rises; travel is the flight; a hit sends a ring of light out across the city from under you.
// own: 0 the eye: 1 low down between them, -1 far above through a long lens; 1 the hour: 1 day with sun and shadows, -1 a great low sun or moon ahead; 2 1 wall to wall (b: many and small), -1 thin needles; 3 1 far taller, -1 low and even; 4 1 round, -1 pitched roofs (b: pointed crystals); 5 1 only edges are drawn, -1 walls glow whole like paper lamps; 6 1 snow lies and falls, -1 mist in the streets (b: a flat sea); 7 1 few and scattered, -1 a valley of terraces (b: rolling hills)
vec3 rich(vec3 c, float k) { return max(mix(vec3(dot(c, vec3(0.33))), c, k), 0.0); }
float HALF = .31; // half the width of a tower; the rest of its square is street
vec3 gGlow; float gRing, gCueRing; vec2 gCam;
// The world's own: where in its square a tower stands, the highest roof, whether forms differ from the plain ones, how round or
// pitched they are, whether it is day or dusk, and how much of the sun gets here.
float oDay, oDusk, oLine, oLamp, oSnow, oSea, oFlat, oTall, oVale, oFew, oRoof, oWide, oThin, oBall;
vec2 gOff = vec2(0.); float gTop = 3.8, gPitch = 0., gSun = 1.; bool gForm = false, gWide = false;
#define ss smoothstep
#define nz normalize
const vec3 UP = vec3(0., 1., 0.), PAPER = vec3(1.02, .98, .9), WARM = vec3(1., .85, .8), NC_SUN = vec3(-.66, .62, -.42), NC_LOW = vec3(0., .16, .987);
// Whether one stays where most are gone.
float left(vec2 id, float h) { return oFew > 0. ? ss(-.12, 0., fract(h * 47.31 + .5 * hash21(id + 3.3)) - .82 * oFew) : 1.; }
void plot(vec2 id) {
 if (!gForm) return;
 HALF = .31 + .185 * oWide + .2 * oThin;
 vec2 h = hash22(id + 9.7);
 HALF *= mix(1., .75 + .6 * h.x, max(oFew, .4 * oRoof));
 HALF = min(HALF, .497);
 gOff = (h.yx - .5) * 2. * (.49 - min(HALF, .49)) * oFew;
}
// Cuts a stretch of a ray down to what lies under a plane.
void under(vec3 N, float d, vec3 o, vec3 rd, inout float tn, inout float tf, inout vec3 n) {
 float v = dot(N, rd), k = d - dot(N, o);
 if (abs(v) < 1e-6) { if (k < 0.) tn = 1e8; return; }
 float t = k / v;
 if (v < 0.) { if (t > tn) { tn = t; n = N; } } else tf = min(tf, t);
}
void inPost(float R, vec3 o, vec3 rd, inout float tn, inout float tf, inout vec3 n) {
 float a = max(dot(rd.xz, rd.xz), 1e-6), b = dot(o.xz, rd.xz), q = b * b - a * (dot(o.xz, o.xz) - R * R);
 if (q <= 0.) { tn = 1e8; return; }
 q = sqrt(q);
 float t1 = (-b - q) / a;
 if (t1 > tn) { tn = t1; n = vec3(o.x + rd.x * t1, 0., o.z + rd.z * t1) / R; }
 tf = min(tf, (q - b) / a);
}

// Which band a column of the city belongs to: low on the left, high on the right, then mirrored on and on.
float bandOf(float i) { float u = (i + 8.5) / 16.0; return 1.0 - abs(mod(u, 2.0) - 1.0); }
float heightOf(vec2 id, out float lv, out float bx) {
  bx = bandOf(id.x);
  lv = band(bx);
  float h = hash21(id * 0.73 + 5.1);
  float H = 0.1 + 0.3 * h + lv * (0.6 + 2.5 * h * h) * (0.55 + 0.6 * uEnergy);
 if (gForm) {
  H = mix(H * (1. + 1.3 * oTall), .22 + .24 * h + .3 * lv, oFlat);
  H += .2 * gPitch;
  H *= left(id, h) * (1. + .5 * oFew);
  float out_ = max(abs(id.x + .5) - 1., 0.);
  H = mix(H, .3 * H + min(out_ * .38, 3.1) * (.35 + .85 * noise(vec2(id.y * .17, sign(id.x + .5) * 7.))), oVale);
  }
  if (abs(id.x + 0.5) < 1.0) { H = 0.0; lv = 0.0; } // the avenue we fly along
  return H;
}
vec3 hueOf(float bx) { return rich(kindColour(bx * 4.0), 1.5); }
float waveAt(vec2 at) {
 float r = length(at - gCam);
 if (gWide) return uHits * exp(-pow((r - gRing) * .5, 2.)) + uCue * exp(-pow((r - gCueRing) * .4, 2.));
 return uHits * exp(-pow((r - gRing) * .9, 2.)) + uCue * exp(-pow((r - gCueRing) * .6, 2.));
}

// Walks the ray across the squares of the city. Returns 0 sky, 1 a tower, 2 the street; t, n and the square are filled in.
int walk(vec3 ro, vec3 rd, int most, out float t, out vec3 n, out vec2 id, out float H) {
  vec2 cell = floor(ro.xz), sg = sign(rd.xz);
  vec2 inv = 1.0 / max(abs(rd.xz), 1e-5);
  vec2 next = (cell + max(sg, 0.0) - ro.xz) * sg * inv;
  float tg = rd.y < 0.0 ? -ro.y / rd.y : 1e9;
  vec3 ird = 1.0 / (abs(rd) + 1e-5) * (step(0.0, rd) * 2.0 - 1.0);
  float came = 0.0;
  for (int i = 0; i < 46; i++) {
    if (i >= most) break;
    float lv, bx;
    H = heightOf(cell, lv, bx);
    vec3 c = vec3(cell.x + 0.5, H * 0.5, cell.y + 0.5), hs = vec3(HALF, H * 0.5, HALF);
    vec3 m = (c - ro) * ird, k = hs * abs(ird);
    vec3 t1 = m - k, t2 = m + k;
    float tn = max(max(t1.x, t1.y), t1.z), tf = min(min(t2.x, t2.y), t2.z);
    if (lv > 0.25) { // the light on a loud roof spills into the air round it
      vec3 top = vec3(c.x, H, c.z) - ro;
      float along = max(dot(top, rd), 0.0);
      vec3 off = top - rd * along;
      gGlow += hueOf(bx) * lv * lv * exp(-dot(off, off) * 16.0) * exp(-along * 0.1) * 0.16;
    }
  vec3 fn = vec3(0.);
  float here = min(next.x, next.y);
  if (gForm && H > .004 && ro.y + rd.y * (rd.y > 0. ? came : here) < H + .001) {
   plot(cell);
   c.xz = cell + .5 + gOff; hs.xz = vec2(HALF);
   m = (c - ro) * ird; k = hs * abs(ird); t1 = m - k; t2 = m + k;
   tn = max(max(t1.x, t1.y), t1.z); tf = min(min(t2.x, t2.y), t2.z);
   fn = -sign(rd) * step(t1.yzx, t1.xyz) * step(t1.zxy, t1.xyz);
   vec3 o = ro - vec3(c.x, 0., c.z);
   if (oBall > 0.) inPost(HALF * mix(1.4143, 1., min(oBall * 1.05, 1.)), o, rd, tn, tf, fn);
   if (gPitch > 0.) {
    vec3 ax = (hash21(cell + 2.2) < .5 ? vec3(1., 0., 0.) : vec3(0., 0., 1.)) * gPitch;
    under(UP + ax, H, o, rd, tn, tf, fn); under(UP - ax, H, o, rd, tn, tf, fn);
      }
  } else if (gForm) tn = 1e9;
    if (tn < tf && tf > 0.0 && tn < tg) {
      t = max(tn, 0.0); id = cell;
   n = gForm ? nz(fn + vec3(0., 1e-9, 0.)) : -sign(rd) * step(t1.yzx, t1.xyz) * step(t1.zxy, t1.xyz);
      return 1;
    }
    float ex = min(next.x, next.y);
    if (tg < ex) { t = tg; n = vec3(0.0, 1.0, 0.0); id = cell; return 2; }
  if (rd.y > 0. && ro.y + rd.y * ex > gTop) break; // above every roof
    came = ex;
    if (next.x < next.y) { next.x += inv.x; cell.x += sg.x; } else { next.y += inv.y; cell.y += sg.y; }
  }
  t = 1e9; return 0;
}
// A line of light of width w at the edge of something, x running up to the edge at 1; it thins out with distance instead of smearing.
float line(float x, float edge, float w, float s) { return smoothstep(edge - w - s, edge - w, x) * w / (w + s); }
// The sky by day and at dusk, in the colours of the sounds.
vec3 ncAir(vec3 rd) {
 float y = max(rd.y, 0.);
 vec3 k0 = uKind[0] * uKind[0], k1 = uKind[1] * uKind[1], k4 = uKind[4] * uKind[4], c = vec3(0.);
 if (oDay > 0.) {
  c += oDay * mix(mix(PAPER, k1 * 1.3, .4), k0 * .9 + .06, ss(0., .5, y)) * (.8 + .2 * uLevel);
  }
 if (oDusk > 0.) {
  float a = dot(rd, NC_LOW);
  vec3 d = mix(k4 * .85 + k1 * .12, k0 * .3, ss(0., .5, sqrt(y) * .85));
  d += k4 * .5 * pow(sat(a), 14.);
  float disc = ss(.9705, .9722, a);
  d = mix(d, mix(k4, vec3(1., .95, .85), .35) * 2.6 * (.45 + .55 * ss(0., .3, y)), disc * ss(0., .07, y));
  c += oDusk * d * (.55 + .65 * uLevel);
  }
  return c;
}
// A matt face by day: its own colour, sunlit or in shade.
vec3 ncMatt(vec3 alb, vec3 n) {
 return alb * ((.19 + .12 * sat(n.y)) * mix(vec3(.75, .88, 1.1), uKind[0] + .3, .3) + gSun * 1.45 * vec3(1., .94, .84) * sat(dot(n, NC_SUN)) + .1 * sat(-n.z));
}
vec3 ncStone(float bx) { vec3 k = kindColour(bx * 4.); return k * k * 1.15; }
// Ink on washed paper.
vec3 ncInk(vec3 n, vec3 hue, float lv, float mark) {
 return PAPER * 1.3 * (.6 + .4 * gSun * sat(dot(n, NC_SUN) * 3.)) * mix(vec3(1.), hue * .95, .25 + .6 * lv) * (1. - .94 * sat(mark));
}
// Lying snow.
vec3 ncSnow(vec3 n, vec3 hue, float lv, vec2 at) {
 float bump = .85 + .3 * noise(at * 2.3) * noise(at * 7.);
 vec3 c = vec3(.3, .4, .62) * (.1 + .1 * uLevel) * (.35 + 1.3 * sat(dot(n, NC_SUN))) + hue * lv * lv * .2 + ncAir(vec3(0., .6, .8)) * .35 * (1. - oDay);
 return bump * mix(c, ncMatt(vec3(.88, .9, .94), n), oDay);
}
// Low mist along a ray as far as t: how much of what is behind is left.
float ncMist(vec3 ro, vec3 rd, float t, float thick) {
 float lev = min(.45 + .1 * uLow, ro.y - .14), at = rd.y < -.01 ? (lev - ro.y) / rd.y : 40.;
 vec3 q = ro + rd * clamp(at, 0., t);
 lev += .35 * (fbm(q.xz * .55 + vec2(uTime * .03, 0.)) - .5);
 float y = 7. * rd.y, a = exp(-7. * max(ro.y - lev, -1.)), b = exp(-7. * max(ro.y + rd.y * t - lev, -1.));
 return exp(-thick * (1.6 * (abs(y) > 1e-3 ? max((a - b) / y, 0.) : a * t) + .02 * t));
}
float ncFlakes(vec2 p) {
 float s = 0.;
 for (int i = 0; i < 3; i++) {
  float f = float(i), n = 9. + 6. * f;
  vec2 g = p * n + vec2(uTime * (.25 + .1 * f) + .4 * sin(uTime * .3 + f), mod(uTime * (.9 + .15 * f), 512.)) + f * 13.7;
  vec2 id = floor(g), h = hash22(id + f * 31.);
  s += ss(.09, .02, length(fract(g) - .5 - (h - .5) * .75)) * (.35 + .4 * h.x) * step(.35, h.y);
  }
 return s;
}
// The face of a tower: dark glass, rows of windows, a line of light round the roof and down the corners.
vec3 tower(vec3 pos, vec3 n, vec3 rd, vec2 id, float H, float t) {
  float lv, bx; heightOf(id, lv, bx);
  vec3 hue = hueOf(bx);
 plot(id);
 vec3 q = vec3(pos.x - id.x - .5 - gOff.x, pos.y, pos.z - id.y - .5 - gOff.y);
  float wave = waveAt(id + 0.5);
  float s = t * 0.006;
  vec3 col;
 vec3 stone = oDay > 0. ? ncStone(bx) * (.75 + .5 * lv) : vec3(0.);
  if (n.y > 0.5) {
  if (oBall > 0. || n.y < .999) {     // a round roof's rim, or a pitched roof's eaves and ridge
   vec2 ax = hash21(id + 2.2) < .5 ? vec2(q.x, q.z) : vec2(q.z, q.x);
   q.x = n.y < .999 ? max(max(abs(ax.x), abs(ax.y)), HALF * (1. - abs(ax.x) / HALF)) : mix(max(abs(q.x), abs(q.z)), length(q.xz), ss(.75, .95, uOwn[4]));
   q.z = 0.;
    }
  float drawn = line(max(abs(q.x), abs(q.z)), HALF, .018 + .008 * oLine, s);
  col = (hue * (.1 + 2. * lv * lv) + WARM * wave) * line(max(abs(q.x), abs(q.z)), HALF, .018, s);
    col += vec3(0.05, 0.08, 0.16) * 0.03;
  if (oLamp > 0.) col += oLamp * hue * hue * (.02 + .3 * lv);
  if (oDay > 0.) {
   vec3 tile = mix(stone * vec3(.86, .84, .84), uKind[2] * uKind[2] * vec3(.9, .85, .8), ss(.99, .9, n.y));
   vec3 d = ncMatt(tile, n) * (1. - .2 * drawn);
   d = mix(d, ncInk(n, hue, lv, drawn * 3.), oLine);
   col = mix(col, d + WARM * wave * .5, oDay);
    }
  if (oSnow > 0.) col = mix(col, ncSnow(n, hue, lv, pos.xz) + WARM * wave * .4, oSnow * .94);
  if (oLine > 0. && oDay < 1.) col += (1. - oDay) * oLine * hue * drawn * (.35 + .6 * lv);
  } else {
    float u = abs(n.x) > 0.5 ? q.z : q.x;
    vec2 w = vec2((u / HALF * 0.5 + 0.5) * 6.0, pos.y * 13.0);
  bool bent = gForm && abs(n.x * n.z) > 1e-5;
  if (gForm) {
   float few = 6. - 2.6 * oFlat;
   w.y *= 1. - .42 * oFlat;
   w.x = (u / HALF * .5 + .5) * max(floor(few * HALF / .31 + .5), 2.);
   if (bent) { u = 0.; w.x = (atan(n.x, n.z) / TAU + .5) * max(floor(3. * few * HALF / .31 + .5), 6.); }
    }
    vec2 wid = floor(w), f = abs(fract(w) - 0.5);
    float pane = smoothstep(0.32 + s * 4.0, 0.32 - s * 4.0, f.x) * smoothstep(0.26 + s * 8.0, 0.26 - s * 8.0, f.y);
  float h = hash21(wid + id * 7.3 + (bent ? vec2(0.) : n.xz * 3.1));
    float floorLit = step(0.82, hash21(vec2(wid.y, id.x * 3.0 + id.y)));           // now and then a whole floor is lit
    float lit = smoothstep(0.0, 0.07, 0.06 + 0.55 * lv + wave + 0.6 * floorLit * lv - h); // windows come on and go off softly
    float kind = fract(h * 13.3);
    vec3 tint = kind < 0.5 ? vec3(1.0, 0.62, 0.3) : kind < 0.75 ? vec3(0.6, 0.8, 1.0) : hue;
    vec3 lamp = mix(tint, hue, 0.35) * (0.08 + 0.45 * lv + 0.8 * wave) * (0.35 + 0.65 * fract(h * 7.7));
    col = lamp * pane * lit * step(pos.y, H - 0.06) * step(0.06, pos.y);
    float roof = line(pos.y, H, 0.018, s), corner = line(abs(u), HALF, 0.012, s);
  col += hue * (roof * (.12 + 2.2 * lv * lv) + corner * (.02 + .5 * lv * lv)) + WARM * wave * (roof + corner);
    col += vec3(0.08, 0.14, 0.3) * pow(1.0 - sat(dot(n, -rd)), 3.0) * 0.06;
  if (oLine > 0.) { roof = line(pos.y, H, .018 + .008 * oLine, s); corner = line(abs(u), HALF, .012 + .006 * oLine, s); }
  float turned = bent ? ss(.35 + s * 4., .1, abs(dot(n, -nz(vec3(rd.x, 1e-5, rd.z))))) : 0.;
  if (oLamp > 0.) {
   float bars = max(ss(.42 - s * 4., .5, f.x) * exp(-s * 14.), ss(.42 - s * 8., .5, abs(fract(pos.y * 6.5) - .5)) * exp(-s * 20.));
   vec3 paper = mix(hue, hue * hue, .6) * (.12 + 1.5 * lv + wave) * (.22 + .78 * ss(.2, .9, h + .4 * lv + .6 * wave)) * (.3 + .7 * exp(-pow((pos.y / max(H, .05) - .35) * 1.9, 2.))) * (.8 + .4 * noise(vec2(u * 9. + id.x, pos.y * 7. + id.y))) * (1. - .75 * bars);
   col = mix(col, paper + hue * roof * lv, oLamp);
    }
  if (oDay > 0.) {
   float glass = pane * step(pos.y, H - .06) * step(.06, pos.y);
   vec3 d = ncMatt(stone, n) * (.92 + .16 * noise(vec2(u * 30., pos.y * 6.))) * (.7 + .3 * ss(0., .5, pos.y));
   d = mix(d, vec3(.05, .06, .07) + .2 * stone + .12 * ncAir(reflect(rd, n)), glass * .82 * (1. - oLamp));
   d += lamp * glass * lit * 1.3 * (1. - oLamp) + oLamp * stone * lv * .8;
   vec3 ink = ncInk(n, hue, lv, max(max(roof, corner), turned) * 3. + .35 * glass * lit);
   col = mix(col, mix(d, ink, oLine) + WARM * wave * (.25 + roof + corner) * .5, oDay);
    }
  if (oLine > 0. && oDay < 1.) {
   vec3 wire = hue * (max(roof, turned) + corner) * (.4 + 1.1 * lv) + hue * hue * .02 + lamp * pane * lit * step(pos.y, H - .06) * .06 + WARM * wave * (roof + corner);
   col = mix(col, mix(wire, col, oDay), oLine);
    }
  }
  return col;
}
vec3 sky(vec3 rd) {
  vec3 haze = mix(vec3(0.2, 0.25, 0.8), vec3(0.9, 0.35, 0.25), uTone);
  vec3 c = haze * exp(-abs(rd.y) * 30.0) * (0.03 + 0.16 * uLevel);
  // a low light at the far end of the avenue
  vec3 end = normalize(vec3(0.0, 0.03, 1.0));
  float a = sat(dot(rd, end));
  c += mix(vec3(0.6, 0.75, 1.0), vec3(1.0, 0.7, 0.45), uTone) * (pow(a, 2500.0) * 3.0 + pow(a, 200.0) * 0.25) * (0.25 + uLevel);
 if (uOwn[1] != 0.) c = c * (1. - abs(uOwn[1])) + ncAir(rd);
  return c;
}

// b: six-sided columns standing close. Returns the place inside the column (xy) and the column's middle (zw).
vec4 hexAt(vec2 p) {
  const vec2 s = vec2(1.0, 1.7320508);
  vec4 c = floor(vec4(p, p - vec2(0.5, 1.0)) / s.xyxy) + 0.5;
  vec4 h = vec4(p - c.xy * s, p - (c.zw + 0.5) * s);
  return dot(h.xy, h.xy) < dot(h.zw, h.zw) ? vec4(h.xy, c.xy * s) : vec4(h.zw, (c.zw + 0.5) * s);
}
float hexDist(vec2 p) { p = abs(p); return max(dot(p, vec2(0.5, 0.8660254)), p.x); }
float columnH(vec2 mid, out float lv, out float bx) {
  bx = bandOf(floor(mid.x * 1.0));
  lv = band(bx);
  float h = hash21(mid * 0.37 + 2.3);
 float H = .25 + .6 * h + lv * (.4 + 1.9 * h) * (.55 + .6 * uEnergy);
 if (gForm) {
  H = mix(H * (1. + 1.2 * oTall), .3 + .1 * h + .35 * lv, oFlat);
  H *= 1. + .4 * oWide;
  H = mix(H, .2 + 3.6 * pow(noise(mid * .17 + 3.), 2.) + .1 * h + .75 * lv, oVale);
  H = mix(.12 + .1 * h, H, left(mid, h));
  if (uOwn[0] > 0.) H = mix(H, min(H, .55 + .4 * h + .55 * max(abs(mid.x) - 1.2, 0.)), min(uOwn[0] * 2., 1.));
  }
  return H;
}
// Walks a ray over columns of any form. 0 nothing, 1 a column, 2 the floor between them.
int hexWalk(vec3 ro, vec3 rd, int most, bool glow, out float t, out vec3 n, out vec4 hx, out float H, out float lv, out float bx) {
 const vec2 N1 = vec2(.5, .8660254), N2 = vec2(-.5, .8660254);
 vec3 b3 = vec3(rd.x, dot(rd.xz, N1), dot(rd.xz, N2));
 b3 = mix(b3, vec3(1e-4), step(abs(b3), vec3(1e-4)));
 float rad = .5 + .31 * oThin, pk = 1.5 * oRoof;
 H = 0.; lv = 0.; bx = 0.; n = UP; hx = vec4(0.);
 t = ro.y > gTop ? (rd.y < -1e-4 ? (gTop - ro.y) / rd.y : 1e3) : 0.;
 float tg = rd.y < -1e-4 ? -ro.y / rd.y : 1e9;
 float r = rad * (1. - .02 * step(1e-4, abs(uOwn[4]) - oThin)); vec3 ib = 1. / b3;
 for (int i = 0; i < 42; i++) {
  if (i >= most || t > 32.) break;
  vec3 q = ro + rd * t;
  hx = hexAt(q.xz);
  H = columnH(hx.zw, lv, bx);
  vec3 a3 = vec3(hx.x, dot(hx.xy, N1), dot(hx.xy, N2));
  vec3 te = (sign(b3) * .5 - a3) / b3;
  float ex = max(min(te.x, min(te.y, te.z)), 0.);
  float top = H + pk * .3;
  if (q.y + min(rd.y * ex, 0.) < top + .001) {
   vec3 o = vec3(hx.x, q.y, hx.y), m, T = -a3 * ib, K = r * abs(ib), t1 = T - K, t2 = T + K, y = step(t1.yzx, t1) * step(t1.zxy, t1);
   float tn = max(t1.x, max(t1.y, t1.z)), tf = min(t2.x, min(t2.y, t2.z));
   y *= -sign(b3);
   m = vec3(y.x + .5 * (y.y - y.z), 0., .8660254 * (y.y + y.z));
   if (pk > 0.) for (int j = 0; j < 6; j++) {
    vec3 N = (j < 3 ? pk : -pk) * (j % 3 == 0 ? vec3(1., 0., 0.) : vec3(j % 3 == 1 ? N1 : N2, 0.).xzy);
    under(N + UP, top, o, rd, tn, tf, m);
   }
   under(UP, top, o, rd, tn, tf, m);
   if (oBall > 0.) inPost(r * mix(1.16, 1., oBall), o, rd, tn, tf, m);
   if (tn < tf && tf > 1e-4 && tn < ex + 1e-3) { t += max(tn, 0.); n = nz(m + UP * 1e-6); return 1; }
  }
  if (tg < t + ex) { t = tg; n = UP; return 2; }
  if (glow && lv > .3) {
   vec3 top3 = vec3(hx.z, H, hx.w) - ro; float al = max(dot(top3, rd), 0.); vec3 off = top3 - rd * al;
   gGlow += hueOf(bx) * lv * lv * exp(-dot(off, off) * 5.) * .07;
    }
  t += ex + .004;
  if (rd.y > 0. && ro.y + rd.y * t > gTop) break;
  }
 t = 1e3; return 0;
}
vec3 ncColumns(vec2 p) {
 float low = max(uOwn[0], 0.), high = max(-uOwn[0], 0.);
 gTop = mix(3.6 * (1. + 1.2 * oTall), 1.1, oFlat) * (1. + .4 * oWide);
 gTop = max(gTop, mix(gTop, 4.9, oVale)) + .5 * oRoof;
 float z = uTravel * 1.1;
 vec3 ro = vec3(1.2 * sin(z * .11) * (1. - .8 * low), 6.2 + .4 * sin(uTime * .07), z);
 ro.y += max(gTop - 3.8, -1.6) * .75;
 ro.y *= 1. + 1.1 * oWide;
 ro.y = mix(ro.y, 1.55 + .08 * sin(uTime * .07), low);
 ro.y = mix(ro.y, ro.y * 1.5 + 2., high);
 vec3 fw = nz(vec3(.15 * sin(uTime * .05), -1. + .08 * sin(uTime * .04), 1.));
 fw = nz(mix(fw, vec3(fw.x, .02, 1.), low));
 fw = nz(mix(fw, vec3(fw.x * .3, -1., .1), high));
 gCam = ro.xz + vec2(0., 5. * (1. - high));
 vec3 rt = nz(cross(UP, fw)), up = cross(fw, rt);
 vec3 rd = nz(fw * (.85 + .5 * high) + rt * p.x + up * p.y);
 float t, H, lv, bx; vec3 n; vec4 hx;
 int hit = hexWalk(ro, rd, 48, true, t, n, hx, H, lv, bx);
 vec3 air = ncAir(nz(vec3(rd.x, 0., max(rd.z, .05)))), col;
 float at = t;
 if (hit == 0) col = sky(rd);
 else {
  vec3 pos = ro + rd * t, hue = hueOf(bx);
  vec2 loc = pos.xz - hx.zw;
  float rad = .5 + .31 * oThin, wave = waveAt(hx.zw), s = t * .004;
  float hd = mix(hexDist(loc), length(loc), ss(.6, 1., uOwn[4])) / rad * .5;
  if (oDay > 0.) {
   vec3 g = gGlow; float t2, H2, lv2, bx2; vec3 n2; vec4 hx2;
   gSun = dot(n, NC_SUN) > 0. && hexWalk(pos + n * .006, nz(NC_SUN), 10, false, t2, n2, hx2, H2, lv2, bx2) == 1 ? 0. : 1.;
   gGlow = g;
    }
  vec3 ember = mix(vec3(1., .25, .05), vec3(1., .5, .15), uTone);
  float isTop = hit == 1 ? ss(.3, .45, n.y) : 0., depth = max(H - pos.y, 0.);
  float rim = isTop * line(hd, .485, .035, s);
  float grain = .6 + .4 * noise(vec2(dot(loc, vec2(-n.z, n.x)) * 14. + hx.z * 3., pos.y * 1.5));
  float facet = oRoof > 0. && n.y > .3 && n.y < .99 ? .25 + .75 * sat(dot(n, NC_SUN)) : 0.;
  if (hit == 2) col = hue * .02 + ember * .6 * (.15 + uLow) * exp(-3. * sat(hexDist(loc) - rad)) * .4;
  else {
   vec3 side = vec3(.1, .17, .4) * (.02 + .12 * sat(dot(n.xz, nz(vec2(-.75, -.65))))) * grain * (.5 + uLevel) * sat(.3 + pos.y * .5);
   side += hue * (.02 + 1.1 * lv * lv) * (exp(-depth * 6.) + .25 * exp(-depth * 1.2)) * grain + WARM * wave * exp(-depth * 3.) * .6;
   side += ember * exp(-pos.y * 4.5) * (.3 + 2. * uLow) * grain * (1. - oSea) * (1. - oSnow) * (1. - oLamp);
   vec3 top = (hue * (.06 + 2.6 * lv * lv) + WARM * wave) * rim + hue * lv * lv * (.08 + 1.3 * hd * hd);
   top += vec3(.1, .16, .35) * (.012 + .03 * noise(pos.xz * 3.)) * (.5 + uLevel) + hue * facet * facet * (.08 + .9 * lv);
   col = mix(side, top, isTop);
    }
  if (oLamp > 0.) {
   vec3 lit = mix(hue, hue * hue, .7) * (.06 + .85 * lv + wave) * mix(.25 + .75 * exp(-depth * .9), .75 + .5 * exp(-hd * hd * 12.), isTop) * mix(grain + .2, 1., isTop);
   lit *= 1. - .5 * rim;
   col = mix(col, hit == 2 ? hue * .08 : lit * (.75 + .35 * sat(dot(n, -rd))), oLamp);
    }
  if (oDusk > 0.) col += ncAir(reflect(rd, n)) * .5 * pow(1. - sat(dot(n, -rd)), 4.);
  if (oDay > 0.) {
   vec3 stone = ncStone(bx) * (.75 + .5 * lv);
   if (hit == 2) stone = uKind[0] * uKind[0] * .6;
   stone *= mix(.65 + .5 * grain, .9 + .2 * noise(pos.xz * 11.), isTop) * (.4 + .6 * ss(-.2, 1.6, pos.y + .9 * isTop));
   vec3 d = ncMatt(stone, n) * (1. + .25 * rim) + oLamp * stone * (.4 + lv);
   vec3 ink = ncInk(n, hue, lv, rim * 3.);
   col = mix(col, mix(d, ink, oLine) + WARM * wave * .3, oDay);
    }
  if (oLine > 0. && oDay < 1.) {
   float turned = n.y < .3 ? ss(.4, .1, abs(dot(n, -rd))) * oBall : 0.;
   vec3 wire = hue * (rim * (.45 + 1.4 * lv) + turned * .3) + hue * hue * .015 + WARM * wave * rim;
   col = mix(col, mix(wire, col, oDay), oLine);
    }
  if (oSnow > 0.) col = mix(col, ncSnow(n, hue, lv, pos.xz) * (1. + .25 * rim) + WARM * wave * .3, oSnow * .94 * (hit == 2 ? 1. : isTop));
  if (oSea > 0.) {              // a flat sea: what is under it fades into its colour, and it breaks round each column
   float lev = 1.5 * oSea * mix(1., .35, oFlat) - .05;
   float wet = lev - pos.y;
   if (wet > 0. && rd.y < -.01) {
    vec3 q = ro + rd * ((lev - ro.y) / rd.y);
    float way = length(pos - q);
    vec3 k = uKind[0] * uKind[0];
    float rip = noise(q.xz * 3. + vec2(uTime * .25, 0.)) * noise(q.xz * 7. - vec2(0., uTime * .2));
    vec3 wn = nz(vec3(.2 * (rip - .25), 1., .25 * (noise(q.xz * 5. + uTime * .2) - .5)));
    vec3 rr = reflect(rd, wn); rr.y = abs(rr.y);
    vec3 water = k * (.1 + .5 * rip) * (.35 + .9 * oDay + .5 * uLevel) + (ncAir(rr) + sky(rr) * (1. - oDay)) * (.06 + .8 * pow(1. - sat(-rd.y), 4.));
    col = mix(water, col * mix(vec3(1.), k + .35, .7), exp(-way * (1.1 + .8 * oSea)));
    float shelf = exp(-wet * 9.) * isTop + exp(-way * 14.);
    col += (.25 + .9 * oDay + .5 * uLevel) * vec3(.8, .88, .9) * .4 * sat(shelf) * (.3 + .7 * ss(.3, .7, noise(q.xz * 6. + .1 * uTime)));
    at = t - way;
      }
    }
  }
 float keep = exp(-at * .07 / (1. + .8 * oWide + .6 * high + 2.5 * oDay));
 if (hit != 0) col = mix(air * mix(1., .8, oDusk), col, keep);
 col += gGlow * (1. - oDay) * (1. - oLine);
 if (oSnow > 0.) col += oSnow * ncFlakes(p) * (.1 + .35 * oDay + .2 * uLevel);
  return screenOf(col);
}

vec3 render(vec2 p) {
 oDay = max(uOwn[1], 0.); oDusk = max(-uOwn[1], 0.); oLine = max(uOwn[5], 0.); oLamp = max(-uOwn[5], 0.);
 oSnow = max(uOwn[6], 0.); oSea = max(-uOwn[6], 0.); oFlat = max(-uOwn[3], 0.); oTall = max(uOwn[3], 0.);
 oVale = max(-uOwn[7], 0.); oFew = max(uOwn[7], 0.); oRoof = max(-uOwn[4], 0.); oWide = max(uOwn[2], 0.); oThin = min(uOwn[2], 0.); oBall = max(uOwn[4], 0.);
  gRing = (1.0 - uHits) * 16.0; gCueRing = (1.0 - uCue) * 24.0;
  gGlow = vec3(0.0);
  vec3 col = vec3(0.0);
 gForm = abs(uOwn[0]) + abs(uOwn[2]) + abs(uOwn[3]) + abs(uOwn[4]) + abs(uOwn[7]) > 0.;
 gWide = gForm || abs(uOwn[1]) + abs(uOwn[5]) + abs(uOwn[6]) > 0.;
  if (uVar < 0.5) {
  if (gForm) {
   gPitch = 1.15 * oRoof;
   gTop = mix(3.8 * (1. + 1.3 * oTall) * (1. + .5 * oFew), 1.2, oFlat) + 3.5 * oVale + .3 * gPitch;
    }
    float z = uTravel * 1.3;
    vec3 ro = vec3(0.3 * sin(z * 0.2), 0.85 + 0.2 * sin(uTime * 0.08), z);
    gCam = ro.xz;
    vec3 fw = normalize(vec3(0.2 * sin(uTime * 0.06), -0.15 + 0.04 * sin(uTime * 0.05), 1.0));
  float lens = .72;
  if (uOwn[0] > 0.) {
   ro.y = mix(ro.y, .15, uOwn[0]);
   fw = nz(mix(fw, vec3(fw.x, .22, 1.), uOwn[0])); lens = .72 - .08 * uOwn[0];
    }
  if (uOwn[0] < 0.) {
   ro.y = mix(ro.y, gTop * .75 + 4.5, -uOwn[0]);
   fw = nz(mix(fw, vec3(.62 + fw.x * .3, -.95, .75), -uOwn[0])); lens = .72 - .75 * uOwn[0];
    }
    vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)), up = cross(fw, rt);
  vec3 rd = nz(fw * lens + rt * p.x + up * p.y);
  if (gWide) gCam += fw.xz * (min(ro.y / max(-fw.y, .15), 12.));
    float t, H; vec3 n; vec2 id;
    int what = walk(ro, rd, 46, t, n, id, H);
    vec3 pos = ro + rd * t;
  if (oDay > 0. && what != 0) {
   vec3 g = gGlow; float t2, H2; vec3 n2; vec2 id2;
   gSun = dot(n, NC_SUN) > 0. && (what == 1 || oSea < .99) && walk(pos + n * .004, nz(NC_SUN), 10, t2, n2, id2, H2) == 1 ? 0. : 1.;
   gGlow = g;
    }
  float sun = gSun;
    if (what == 1) col = tower(pos, n, rd, id, H, t);
    else if (what == 2) {
      // the wet street: it mirrors the towers and their light, broken a little by the water
      vec3 before = gGlow;
   gSun = 1.;
      vec2 rip = vec2(noise(pos.xz * vec2(9.0, 3.0)), noise(pos.xz * vec2(9.0, 3.0) + 31.0)) - 0.5;
      vec3 rr = reflect(rd, normalize(vec3(rip.x * 0.09, 1.0, rip.y * 0.03)));
      rr.y = abs(rr.y) + 0.002;
      float t2, H2; vec3 n2; vec2 id2;
      int w2 = oSea > .99 ? 0 : walk(pos + vec3(0.0, 0.002, 0.0), rr, 14, t2, n2, id2, H2);
      vec3 mir = w2 == 1 ? tower(pos + rr * t2, n2, rr, id2, H2, t + t2) * exp(-t2 * 0.1) : sky(rr);
      mir += (gGlow - before) * 1.5;
      gGlow = before;
      float fres = 0.4 + 0.6 * pow(1.0 - sat(-rd.y), 4.0);
      col = mir * fres * (0.6 + 0.4 * noise(pos.xz * 1.7));
   gSun = sun;
   if (oDay > 0.) {
    vec3 k = uKind[0] * uKind[0];
    vec3 paved = ncMatt(mix(vec3(.42, .4, .37), k, .4) * (.85 + .3 * noise(pos.xz * 3.) * noise(pos.xz * 17.)), n);
    paved = mix(paved, PAPER * (.82 + .18 * gSun), oLine);
    float canal = ss(1.02, .98, abs(pos.x)) * (1. - oLine);      // by day the water keeps to the avenue
    vec3 water = mix(k * (.25 + .25 * gSun), mir, .25 + .6 * pow(1. - sat(-rd.y), 3.));
    col = mix(col, mix(paved, water, canal), oDay);
      }
   if (oSnow > 0.) {
    float lv, bx, lh = heightOf(id, lv, bx); plot(id);
    vec3 lying = ncSnow(n, hueOf(bx), lv * exp(-3. * max(max(abs(pos.x - id.x - .5), abs(pos.z - id.y - .5)) - HALF, 0.)), pos.xz);
    col = mix(col, lying, oSnow * .96);
      }
      float rg = length(pos.xz - gCam);
      col += vec3(1.0, 0.8, 0.7) * (uHits * exp(-pow((rg - gRing) * 9.0, 2.0)) + uCue * exp(-pow((rg - gCueRing) * 6.0, 2.0))) * 0.8;
    } else col = sky(rd);
  if (uOwn[0] < 0.) t /= 1. - 1.2 * uOwn[0];
  if (uOwn[1] != 0. && what != 0) {
   vec3 air = ncAir(nz(vec3(rd.x, 0., rd.z)));
   col = mix(air, col, exp(-t * .05 / (1. + 2.5 * oDay)));
   gGlow *= 1. - oDay;
  } else
    if (what != 0) col *= exp(-t * 0.05);
  if (uOwn[5] > 0.) gGlow *= 1. - uOwn[5];
  if (uOwn[6] < 0.) {
   float left = ncMist(ro, rd, what == 0 ? 40. : length(pos - ro), oSea);
      vec3 m = (uKind[1] * uKind[1] + uKind[0] * uKind[0] + .06) * .5 * (.22 + .5 * uLevel) * (1. - abs(uOwn[1])) + ncAir(nz(vec3(rd.x, .12, abs(rd.z) + .05))) * .9 + gGlow * 1.5;
   m *= .75 + .4 * noise(rd.xy * vec2(5., 16.) / (1. + rd.z) + uTime * .012);
   col = mix(m, col, left);
    }
    col += gGlow;
  if (oSnow > 0.) col += oSnow * ncFlakes(p) * (.1 + .35 * oDay + .2 * uLevel);
 } else if (gWide) { gForm = true; return ncColumns(p);
  } else {
    float z = uTravel * 1.1;
    vec3 ro = vec3(1.2 * sin(z * 0.11), 6.2 + 0.4 * sin(uTime * 0.07), z);
    vec3 fw = normalize(vec3(0.15 * sin(uTime * 0.05), -1.0 + 0.08 * sin(uTime * 0.04), 1.0));
    gCam = ro.xz + vec2(0.0, 5.0);
    vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)), up = cross(fw, rt);
    vec3 rd = normalize(fw * 0.85 + rt * p.x + up * p.y);
    if (rd.y > -0.02) return screenOf(sky(rd));
    // walk from column to column: either we come in below its top (its side), or we land on its top, or we pass over
    const vec2 N1 = vec2(0.5, 0.8660254), N2 = vec2(-0.5, 0.8660254);
    vec3 b3 = vec3(rd.x, dot(rd.xz, N1), dot(rd.xz, N2));
    b3 = mix(b3, vec3(1e-4), step(abs(b3), vec3(1e-4)));
    float t = max((3.0 - ro.y) / rd.y, 0.0), H = 0.0, lv = 0.0, bx = 0.0;
    vec4 hx; int hit = 0; vec2 sn = vec2(0.0);
    for (int i = 0; i < 44; i++) {
      vec3 q = ro + rd * t;
      hx = hexAt(q.xz);
      H = columnH(hx.zw, lv, bx);
      if (q.y < H) { hit = 2; break; }
      vec3 a3 = vec3(hx.x, dot(hx.xy, N1), dot(hx.xy, N2));
      vec3 te = (sign(b3) * 0.5 - a3) / b3;
      float ex = min(te.x, min(te.y, te.z));
      float tt = (q.y - H) / -rd.y;
      if (tt < ex) { t += tt; hit = 1; break; }
      if (lv > 0.3) { // light off a loud top spills into the air
        vec3 top = vec3(hx.z, H, hx.w) - ro; float al = dot(top, rd); vec3 off = top - rd * al;
        gGlow += hueOf(bx) * lv * lv * exp(-dot(off, off) * 5.0) * 0.07;
      }
      sn = te.x <= ex ? vec2(-sign(b3.x), 0.0) : te.y <= ex ? -sign(b3.y) * N1 : -sign(b3.z) * N2;
      t += ex + 0.004;
      if (t > 30.0) break;
    }
    if (hit > 0) {
      vec3 pos = ro + rd * t;
      vec2 loc = pos.xz - hx.zw;
      float hd = hexDist(loc);
      vec3 hue = hueOf(bx);
      float wave = waveAt(hx.zw);
      float s = t * 0.004;
      vec3 ember = mix(vec3(1.0, 0.25, 0.05), vec3(1.0, 0.5, 0.15), uTone);
      if (hit == 1) {
        // the top: wet black stone, lit round its rim in its band's colour
    col = (hue * (.06 + 2.6 * lv * lv) + WARM * wave) * line(hd, .485, .035, s);
        col += hue * lv * lv * (0.08 + 1.3 * hd * hd);
        col += vec3(0.1, 0.16, 0.35) * (0.012 + 0.03 * noise(pos.xz * 3.0)) * (0.5 + uLevel);
      } else {
        // the side: dark, hot far down in the cracks, catching light near the top
        float depth = H - pos.y;
        float moon = sat(dot(sn, normalize(vec2(-0.75, -0.65))));
        float grain = 0.6 + 0.4 * noise(vec2(dot(loc, vec2(-sn.y, sn.x)) * 14.0 + hx.z * 3.0, pos.y * 1.5));
        col = vec3(0.1, 0.17, 0.4) * (0.02 + 0.12 * moon) * grain * (0.5 + uLevel) * sat(0.3 + pos.y * 0.5);
        col += hue * (0.02 + 1.1 * lv * lv) * (exp(-depth * 6.0) + 0.25 * exp(-depth * 1.2)) * grain;
    col += WARM * wave * exp(-depth * 3.) * .6;
        col += ember * exp(-pos.y * 4.5) * (0.3 + 2.0 * uLow) * grain;
      }
    }
    col *= exp(-t * 0.07);
    col += gGlow;
  }
  return screenOf(col);
}
