// name: Clouds
// a: Heaps
// b: Rain
// what: A wide calm sky of great soft heaps of cloud drifting over a low strip of land, lit from one side by a low sun; or rain coming over open land from a dark bank, grey veils slanting down with light under the cloud's edge.
// follows: The mix is how much cloud there is and the low band swells the heaps; each kind of sound tints the light on one bank of cloud; the tone dial moves the day from blue afternoon to rose evening; a hit or a cue is a slow shaft of sun breaking through; in the rain each veil is one kind of sound and the bank comes lower as the music fills.
// own: 0 1 many small heaps (b: many thin veils), -1 one great one; 1 1 smooth plates, -1 long torn streamers (b: hanging pouches and long rolls); 2 the land: 1 still water (b: dry sand), -1 mountains; 3 1 bright midday, -1 night; 4 1 a floor of cloud below, -1 a rippled ceiling above; 5 1 tall firs along the near edge, -1 no near land; 6 1 drawn in ink lines, -1 cut in flat tones; 7 1 a great disc stands in the sky, -1 lit from below. Any of them lets the piece's own colours in
float clAll; // how far any of its own numbers is from rest
float clLv(int k) { return k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : k == 3 ? uPhrase : uHits; }
float clH1(float n) { n = fract(n*0.1031); n *= n + 33.33; n *= n + n; return fract(n); }
float clN1(float x) { float i = floor(x), f = fract(x); f = f*f*(3.0 - 2.0*f); return mix(clH1(i), clH1(i + 1.0), f); }
vec3 clDay(vec3 a, vec3 b, vec3 c) { return uTone < 0.5 ? mix(a, b, uTone*2.0) : mix(b, c, uTone*2.0 - 1.0); }
// Round lumps with creases between them, as the top of a heap of cloud has. x is the whole of it, y only its broad shapes.
const mat2 clM = mat2(1.73, 1.19, -1.19, 1.73);
vec2 clLumps(vec2 q, float t) {
 float s = 0.0, a = 0.5;
 for (int i = 0; i < 3; i++) { s += a*abs(2.0*noise(q + t) - 1.0); q = clM*q + 3.3; a *= 0.5; t = -t*1.6; }
 float broad = s*1.1;
 for (int i = 0; i < 2; i++) { s += a*abs(2.0*noise(q + t) - 1.0); q = clM*q + 3.3; a *= 0.5; t = -t*1.6; }
 return vec2(s, broad);
}
float clBroad(vec2 q, float t) {
 float s = 0.0, a = 0.5;
 for (int i = 0; i < 3; i++) { s += a*abs(2.0*noise(q + t) - 1.0); q = clM*q + 3.3; a *= 0.5; t = -t*1.6; }
 return s*1.1;
}
// How tall the heaps of a bank stand at x (in the bank's own measure: a heap is about 0.6 tall); 0 where there is none.
float clTall(float x, float seed, float cover, float swell) {
 float n = clN1(x*0.42 + seed) + 0.3*clN1(x*1.1 + seed*3.0);
 float e = smoothstep(cover, cover + 0.3, n);
 e *= 2.0 - e; // round shoulders, not a tent
 return max(e*(0.5 + 0.55*clN1(x*0.8 + seed*5.0))*0.84*swell - 0.05, 0.0);
}
// How deep inside the bank the place q is, given its lumps there. clEdge is how far it is from the top and sides alone.
float clEdge, clBase;
float clBank(vec2 q, float seed, float tall, float lumps) { // seed: how ragged the base is here
 float there = min(1.0, tall*5.0);
 clEdge = (tall - q.y)/0.6 + (min(lumps, 0.61) - 0.36)*1.35*there - 0.1*(1.0 - there);
 clBase = q.y + 0.09*lumps + seed;
 return min(clEdge, clBase*4.5);
}
float clUp(float x) { return max(x, 0.0); }
// A colour's own hue at no particular lightness, let in as far as any number is set.
vec3 clHue(vec3 k, float much) { k *= k; return mix(vec3(1.0), k/max(dot(k, vec3(0.3, 0.5, 0.2)), 0.02), much*clAll); }
// The range seen at p (its foot at y 0): its colour, and how much of it is there.
vec4 clRange(vec2 p, float seed, float high, vec3 light, vec3 dark, vec3 air, float far) {
 float px = 1.2/uRes.y, h = 0.0, top = 0.0, c0 = 0.0, W = high*1.05, id = floor(p.x/W), px1 = p.x + 0.22*high*(noise(vec2(p.x*2.0, p.y*6.0)/high + seed) - 0.5);
 float bite = 0.16*high*(clN1(p.x*5.0/high + seed) - 0.5) + 0.07*high*(clN1(p.x*17.0/high + seed) - 0.5);
 for (int j = -2; j <= 2; j++) { // each peak a roof of its own, the highest here is seen
  float k = id + float(j), r1 = clH1(k + seed), c = (k + 0.5 + 0.7*(clH1(k*1.7 + seed + 40.0) - 0.5))*W, hh = high*(0.45 + 0.55*r1), v = hh - abs(px1 - c)*(0.6 + 0.3*clH1(k + seed + 9.0));
  if (v > h) { h = v; top = hh; c0 = c; }
 }
 h = max(h + bite*smoothstep(0.0, 0.1, h), 0.0);
 float in1 = smoothstep(px, -px, p.y - h);
 if (in1 <= 0.0 || h <= 0.0) return vec4(0.0);
 float down = top - p.y, rock = 0.5*noise(vec2(p.x*9.0/high + p.y*6.0/high, p.y*12.0/high + seed)) + 0.28*noise(p*24.0/high) + 0.22*noise(p*61.0/high);
 float crest = c0 + down*0.5*(noise(vec2(down*7.0/high, c0*9.0)) - 0.4) + 0.1*high*(rock - 0.5), face = smoothstep(0.04*high, -0.04*high, p.x - crest + 0.12*high*(rock - 0.5));
 float snow = smoothstep(0.1, -0.1, down/high - 0.34 + 0.42*(rock - 0.5));
 vec3 c = mix(dark*(0.5 + 0.6*rock), mix(light*0.2, light*0.6, snow), 0.1 + 0.9*face)*(0.6 + 0.4*rock);
 c = mix(c, dark*1.7, snow*(1.0 - face)*0.6);
 return vec4(mix(c, air, sat(far + 0.6*smoothstep(0.3*high, 0.0, p.y))), in1);
}
// Firs along the near edge, two rows of them.
float clFirs(vec2 p) {
 float a = 0.0;
 for (int k = 0; k < 2; k++) {
  float fk = float(k), n = 9.0 + 6.0*fk, x = p.x*n + 3.7*fk, id = floor(x), r1 = hash21(vec2(id, fk + 2.0)), r2 = hash21(vec2(id, fk + 7.0));
  float tall = (0.12 + 0.34*r1*r1)*(0.35 + 0.9*smoothstep(0.25, 0.75, noise(vec2(id/n*1.3 + 4.0, 3.0 + fk))))*(1.0 - 0.25*fk);
  float up = (p.y + 0.53)/max(tall, 0.01);
  float dx = abs(fract(x) - 0.5 - 0.25*(r2 - 0.5) - 0.02*up*sin(uTime*0.4 + id))/n;
  float bough = 0.5 + 0.35*fract(-up*(9.0 + 6.0*r2)*(0.6 + tall) + 0.5*r1) + 0.55*noise(vec2(x*5.0, p.y*70.0));
  float wide = min(0.085*tall*clUp(1.0 - up)*(1.0 - 0.45*smoothstep(0.35, 0.0, up))*bough, 0.42/n) + 0.0014;
  a = max(a, smoothstep(1.2/uRes.y, -1.2/uRes.y, dx - wide)*step(up, 1.0));
 }
 return max(a, smoothstep(-0.46, -0.48, p.y + 0.02*noise(vec2(p.x*9.0, 1.0))));
}
float clStars(vec2 p) {
 vec2 g = p*46.0, id = floor(g), h = hash22(id);
 float d = length(fract(g) - 0.5 - 0.6*(h - 0.5));
 return step(0.8, h.x)*smoothstep(0.11, 0.0, d)*(0.3 + 0.7*h.y)*(0.75 + 0.25*sin(uTime*(0.5 + h.y) + 40.0*h.x));
}
// A ceiling or a floor of small clouds in rows, at a place of it: x how thick, y how it faces the light ahead.
vec2 clRows(vec2 q) {
 vec2 w = q + 0.35*vec2(noise(q*0.9 + 3.0), noise(q*0.9 + 17.0));
 float rows = 0.5 + 0.5*sin(w.y*7.5 + 1.2*sin(w.x*0.7)), beads = 0.5 + 0.5*sin(w.x*5.0 + 2.2*floor(w.y*7.5/TAU) + 5.0*noise(w*0.8));
 float s = rows*(0.45 + 0.55*beads) + 0.3*(noise(q*5.0) - 0.5);
 return vec2(s, cos(w.y*7.5 + 1.2*sin(w.x*0.7)));
}
vec3 clHeaps(vec2 p) {
 float lvl = uLevel, day = clUp(uOwn[3]), night = clUp(-uOwn[3]), floor1 = clUp(uOwn[4]), ceil1 = clUp(-uOwn[4]), disc = clUp(uOwn[7]), under = clUp(-uOwn[7]), plate = clUp(uOwn[1]), torn = clUp(-uOwn[1]);
 vec2 sun = vec2(-0.5, mix(0.02, -0.2, uTone));
 float wet = clUp(uOwn[2]), horizon = -0.4 + 0.22*wet;
 vec3 sunC = clDay(vec3(1.0, 0.9, 0.72), vec3(1.0, 0.6, 0.28), vec3(1.0, 0.32, 0.15))*1.4;
 vec3 zen = clDay(vec3(0.008, 0.04, 0.15), vec3(0.006, 0.022, 0.1), vec3(0.01, 0.01, 0.055));
 vec3 mid = clDay(vec3(0.03, 0.11, 0.26), vec3(0.035, 0.085, 0.19), vec3(0.085, 0.045, 0.14));
 vec3 low = clDay(vec3(0.16, 0.28, 0.4), vec3(0.46, 0.3, 0.15), vec3(0.45, 0.14, 0.1));
 vec3 shade = clDay(vec3(0.03, 0.055, 0.12), vec3(0.028, 0.04, 0.1), vec3(0.04, 0.025, 0.075));
 if (clAll > 0.0) {
  sunC = mix(mix(sunC, vec3(1.5, 1.45, 1.35), day), vec3(0.3, 0.34, 0.42), night)*clHue(uKind[3], 0.35);
  zen = mix(mix(zen, vec3(0.05, 0.16, 0.4), day), vec3(0.003, 0.006, 0.016), night)*clHue(uKind[0], 0.7);
  mid = mix(mix(mid, vec3(0.22, 0.42, 0.66), day), vec3(0.012, 0.022, 0.05), night)*clHue(uKind[0], 0.5);
  low = mix(mix(low, vec3(0.75, 0.85, 0.9), day), vec3(0.04, 0.055, 0.085), night)*clHue(uKind[2], 0.6);
  shade = mix(mix(shade, vec3(0.26, 0.31, 0.4), day), vec3(0.008, 0.012, 0.025), night)*clHue(uKind[1], 0.5);
  sun = mix(sun, vec2(-0.42, 0.36), day); sun = mix(sun, vec2(-0.34, 0.22), night); sun = mix(sun, vec2(0.16, 0.1), disc);
 }
 // in still water the sky is seen again, upside down
 float deep = horizon - p.y; vec2 real = p;
 if (wet > 0.0 && deep > 0.0) {
  float dd = 0.05/max(deep, 0.002), rip = noise(vec2(p.x*dd*6.0, dd*18.0 + uTime*0.12)) - 0.5;
  p = vec2(p.x + rip*0.03, horizon + deep*1.9 + rip*0.09*sat(deep*6.0));
 }
 // the sky
 float up = sat((p.y - horizon)*1.3);
 vec3 col = mix(mix(low, mid, smoothstep(0.0, 0.3, up)), zen, smoothstep(0.2, 0.9, up));
 float ds = length(p - sun);
 float ev = max(uHits, uCue);
 vec3 sunGlow = sunC*(0.9 + 0.5*ev)*exp(-ds*11.0);
 vec3 paleC = mix(sunC, vec3(0.7, 0.85, 0.9), 0.55);
 col += paleC*0.26*exp(-ds*2.0) + sunC*0.3*exp(-ds*4.5);
 vec3 air = col + sunGlow*0.4;
 if (night > 0.0) col += night*vec3(0.8, 0.85, 1.0)*clStars(p)*smoothstep(0.0, 0.5, up);
 col += sunGlow + sunC*(5.0*(1.0 - disc) + 3.0*night)*smoothstep(0.034, 0.03, ds);
 if (disc > 0.0) {
  vec2 dq = p - sun; float R = 0.25, rr = length(dq)/R, at = smoothstep(1.0 + 3.0/uRes.y/R, 1.0 - 3.0/uRes.y/R, rr);
  float spot = fbm(dq*7.0 + 3.0), ball = sqrt(clUp(1.0 - rr*rr));
  vec3 face = mix(sunC, uKind[3]*uKind[3]*1.6, 0.6)*(0.5 + 0.5*ball)*(0.75 + 0.5*spot)*(0.8 + 0.3*lvl);
  col = mix(col, mix(face, air, 0.25 + 0.45*smoothstep(0.1, -0.35, p.y)), at*disc);
  col += disc*face*0.3*exp(-clUp(rr - 1.0)*5.0)*(1.0 - at);
 }
 // thin high cloud
 vec2 cq = vec2(p.x*1.5 + uTime*0.003, p.y*7.0 + p.x*1.2);
 float ci = 0.55*noise(cq) + 0.3*noise(cq*2.1 + 5.0) + 0.15*noise(cq*4.3 + 9.0);
 col += mix(low, sunC, 0.5)*smoothstep(0.5, 0.85, ci)*smoothstep(0.0, 0.3, p.y)*0.1;
 if (ceil1 > 0.0) { // rows of small clouds that go away overhead
  float e = clUp(p.y - horizon), z = 0.5/(e + 0.06);
  vec2 q = vec2(p.x*z + (uTravel*0.02 + uTime*0.004)*2.0, z*1.3)*(1.0 + 0.5*uOwn[0])*3.6;
  vec2 rows = clRows(q), k = vec2(clLv(1), clLv(2));
  float thick = smoothstep(0.28, 0.8, rows.x + 0.55*(noise(q*0.35 + 8.0) - 0.45) + 0.18*lvl + 0.12*uLow);
  vec4 m = piece(vec2(sat(0.5 + p.x*0.56), sat(0.95 - e*1.1)));
  vec3 c = shade*1.4 + (mix(sunC, uKind[1]*uKind[1]*1.5, 0.3*k.x)*(0.28 + 0.3*lvl) + sunC*0.9*exp(-ds*2.2))*(0.55 + 0.45*rows.y)*(1.2 - 0.5*thick);
  c += m.rgb*m.rgb*0.5 + m.rgb*0.1;
  col = mix(col, c, ceil1*thick*smoothstep(0.03, 0.2, e)*0.92);
 }
 float ang = atan(p.y - sun.y, p.x - sun.x);
 float rays = noise(vec2(ang*5.0, uTime*0.02))*noise(vec2(ang*13.0 + 4.0, uTime*0.035));
 float shaftAng = mix(-0.2, -0.5, 0.5 + 0.5*sin(uTime*0.05));
 float shaft = ev*(exp(-pow((ang - shaftAng)*7.0, 2.0)) + 0.4*exp(-pow((ang - shaftAng)*2.5, 2.0)))*step(-1.6, ang)*step(ang, 1.6);
 float wind = uTravel*0.02 + uTime*0.004;
 float cover = mix(0.67, 0.5, lvl), swell = 0.96 + 0.32*uLow;
 vec2 toSun = normalize(sun - p + vec2(1e-5, 0.0));
 if (under > 0.0) toSun = mix(toSun, vec2(0.0, -1.0), under*0.9);
 float nearSun = exp(-ds*3.0);
 for (int i = 0; i < 5; i++) {
  float fi = float(i), z = 7.0/(1.0 + 0.36*fi + 0.06*fi*fi), seed = fi*7.3 + 1.0;
  vec2 q = vec2(p.x + wind/z*4.0, p.y - horizon - 0.55/z)*z;
  if (uOwn[2] < 0.0 && (i == 2 || i == 4)) { // a range between the banks
   float f = i == 2 ? 1.0 : 0.0;
   vec4 m = clRange(vec2(p.x*(1.0 + 0.5*f) + 0.3*f + wind*0.15*(2.0 - f), p.y - horizon), 4.3 + 9.0*f, mix(0.16, 0.5, f), sunC, shade + clLv(2)*uKind[2]*uKind[2]*0.08, air, 0.1 + 0.2*f);
   col = mix(col, m.rgb, m.a*-uOwn[2]);
  }
  if (uOwn[0] != 0.0) {
   float k = exp2(uOwn[0]*(uOwn[0] > 0.0 ? 1.1 : 0.75)); float z1 = z*k;
   q = vec2(p.x + wind/z*4.0, p.y - horizon - (uOwn[0] > 0.0 ? mix(0.55/z, 0.1 + 0.13*fi, uOwn[0]) : 0.4/z))*z1;
  }
  if (torn > 0.0) q += torn*vec2(0.9*q.y + 0.25*noise(q*vec2(1.2, 2.0) + seed), 0.1*noise(vec2(q.x*2.0, seed)));
  float t = uTime*0.006;
  float tall = clTall(q.x, seed, cover, swell);
  if (plate > 0.0) tall = mix(tall, 0.62*clTall(q.x*0.85, seed, cover - 0.05, 1.0)*(0.95 + 0.1*uLow), plate);
  vec2 stretch = mix(vec2(1.45), vec2(0.5, 3.4), torn);
  vec2 lumps = clLumps(clAll > 0.0 ? q*stretch + seed : q*1.45 + seed, t + seed);
  if (plate > 0.0) { // plates one on another: smooth, and as round below as above
   float ply = 0.12*sin(q.y*34.0 + 2.0*clN1(q.x*0.7 + seed));
   lumps = mix(lumps, vec2(0.34 + ply*tall), plate);
  }
  float ragged = 0.05*clN1(q.x*2.3 + seed);
  float lump = lumps.x;
  if (plate > 0.0) ragged = mix(ragged, 0.5*tall - 0.06, plate);
  float d = clBank(q, ragged, tall, lump), edge = clEdge, base = clBase;
  float d1 = max(clBank(q, ragged, tall, lumps.y), 0.0);
  vec2 q2 = q + toSun*0.13;
  float tall2 = clTall(q2.x, seed, cover, swell), broad2 = clBroad(clAll > 0.0 ? q2*stretch + seed : q2*1.45 + seed, t + seed);
  if (plate > 0.0) { tall2 = mix(tall2, 0.62*clTall(q2.x*0.85, seed, cover - 0.05, 1.0), plate); broad2 = mix(broad2, 0.34 + 0.12*tall2*sin(q2.y*34.0 + 2.0*clN1(q2.x*0.7 + seed)), plate); }
  float d2 = max(clBank(q2, ragged, tall2, broad2), 0.0);
  float a = smoothstep(0.0, 0.07, edge)*smoothstep(0.0, 0.1, base);
  if (torn > 0.0) a = mix(a, smoothstep(-0.25, 0.9, edge + 0.5*(lump - 0.4))*smoothstep(-0.15, 0.4, base)*0.9, torn);
  if (ceil1 > 0.0) a *= 1.0 - ceil1;
  float high = sat(q.y/0.55);
  // round the cloud off towards its edges, and see which way that roundness faces
  float lit = 0.22 + (1.0/(1.0 + 3.2*d2) - 1.0/(1.0 + 3.2*d1))*3.6 + clamp((tall - tall2)*2.6, -0.35, 0.35) + 0.3*high;
  float lv = clLv(i);
  vec3 kc = uKind[i];
  vec3 tint = (kc*kc*1.6 + kc*0.6 + 0.15)*1.3;
  vec3 light = mix(sunC, tint, (0.22 + 0.3*clAll)*lv)*(0.9 + 0.4*lvl);
  vec3 c = (shade + kc*kc*lv*0.09)*(0.25 + 1.1*high) + light*smoothstep(0.15, 1.25, lit)*(0.4 + 0.6*high)*(0.55 + 1.1*lump);
  c *= 0.6 + 0.4*smoothstep(-0.02, 0.2, q.y);
  // a bright edge where the cloud is thin and the sun is behind it
  float thin = max(edge, 0.0);
  if (under > 0.0) c = mix(c, c*0.2, under) + under*mix(uKind[4]*uKind[4], kc*kc, 0.25)*(0.2 + 0.5*lvl + 0.6*lv)*exp(-clUp(q.y + 0.2*(lump - 0.5))*7.5)*(0.15 + 1.7*lump*lump)*1.3;
  if (under < 1.0) c += (1.0 - under)*light*(1.6/(1.0 + 5.0*thin + 9.0*thin*thin) + 2.0/(1.0 + 300.0*thin*thin))*smoothstep(0.0, 0.4, d - edge + 0.4)*nearSun;
  float haze = exp(-z*0.2);
  c = mix(air, c, 0.2 + 0.8*haze);
  col = mix(col, c, a);
  // rays of sun in the air between the banks
  if (i == 1) col += paleC*(0.2 + 0.4*lvl)*rays*0.7*nearSun*(1.0 - max(under, max(disc, 0.8*day)));
 }
 col += sunC*shaft*0.5*exp(-ds*0.9)*step(horizon, p.y);
 // a low strip of land: far trees in the haze, then open fields with patches of sun moving over them
 float px = 1.2/uRes.y;
 float x = p.x + wind*0.3;
 float toS = exp(-abs(p.x - sun.x)*1.5);
 float h1 = horizon + 0.004 + 0.012*noise(vec2(x*7.0, 1.0)) + 0.006*noise(vec2(x*31.0, 2.0));
 p = real;
 vec3 sky1 = col;
 col = mix(col, mix(shade*0.7, low*0.6 + sunGlow*0.3, 0.45), smoothstep(-px, px, h1 - p.y));
 float dep = 0.05/max(horizon - p.y, 0.002);
 vec2 g = vec2(x*dep*3.0 + wind*2.0, dep*2.0);
 float patch_ = smoothstep(0.42, 0.75, noise(g*vec2(0.45, 1.0)));
 float fields = 0.6 + 0.4*noise(vec2(g.x*2.0, floor(g.y*6.0)*3.1));
 vec3 ground = shade*0.22*fields + sunC*vec3(0.5, 0.42, 0.2)*0.12*patch_*fields*(0.5 + lvl);
 float sx = sun.x + cos(shaftAng)*(horizon - 0.04 - sun.y)/sin(min(shaftAng, -0.05));
 ground += sunC*vec3(0.6, 0.5, 0.25)*0.5*ev*exp(-pow((p.x - sx)*3.0, 2.0))*fields*exp(-(horizon - p.y)*5.0);
 ground = mix(ground, low*0.5 + sunGlow*0.3, exp(-(horizon - p.y)*40.0)*0.7);
 if (under > 0.0) ground += under*uKind[4]*uKind[4]*(0.3 + lvl)*exp(-deep*9.0)*(0.4 + fields*patch_);
 if (wet > 0.0) ground = mix(ground, sky1*mix(vec3(0.82, 0.86, 0.88), vec3(0.4, 0.48, 0.52), sat(deep*5.0)), wet);
 float bare = clUp(-uOwn[5]);
 col = mix(col, ground, smoothstep(-px, px, horizon - p.y));
 if (bare > 0.0) col = mix(col, sky1, bare);
 if (floor1 > 0.0) { // a sea of cloud, its far edge in heaps of its own
  float hz = horizon + 0.31*floor1;
  for (int j = 0; j < 7; j++) { // heaps behind heaps, seen from above
   float fj = float(j), f = fj/6.0, sz = exp2(mix(4.2, 1.5, f) + 0.5*uOwn[0]), yj = hz - 0.34*f*f - 0.012*fj;
   vec2 q = vec2(p.x*sz + wind*(3.0 + 6.0*f) + fj*5.3, (p.y - yj)*sz*1.15);
   if (q.y > 1.0) continue;
   float l0 = clBroad(q*1.1 + fj, uTime*0.006), l1 = clBroad((q + toSun*0.16)*1.1 + fj, uTime*0.006), d = 0.6*l0 + 0.6*clN1(q.x*0.7 + fj*3.0) - 0.3 - q.y;
   if (d < 0.0) continue;
   vec4 m = piece(vec2(sat(0.5 + p.x*0.56), sat(0.1 + f)));
   float lit = sat(0.42 + (l0 - l1)*2.4)*(0.3 + 0.7*exp(-1.1*d))*(0.5 + 0.8*l0);
   vec3 c = shade*(1.5 - 0.6*f)*(0.6 + 0.8*l0) + (sunC*(0.5 + 0.35*lvl) + sunC*0.9*toS)*lit + (m.rgb*m.rgb*0.6 + m.rgb*0.15)*(0.2 + lit);
   c += sunC*0.5*exp(-d*14.0)*toS*(1.0 - f);
   c = mix(c, air*0.8 + low*0.2, 0.75*(1.0 - f)*(1.0 - f));
   col = mix(col, c, floor1*smoothstep(0.0, 0.09, d));
  }
 }
 if (uOwn[5] > 0.0) col = mix(col, shade*0.12 + low*0.015, clFirs(real)*uOwn[5]);
 return col;
}
vec3 clRain(vec2 p) {
 float lvl = uLevel, px = 1.2/uRes.y, day = clUp(uOwn[3]), night = clUp(-uOwn[3]), plate = clUp(uOwn[1]), torn = clUp(-uOwn[1]), ceil1 = clUp(-uOwn[4]), disc = clUp(uOwn[7]), glow = clUp(-uOwn[7]), dry = clUp(uOwn[2]);
 float horizon = -0.14 - 0.17*max(disc, clUp(-uOwn[2])) + 0.16*dry;
 vec3 gapC = clDay(vec3(0.85, 0.9, 0.8), vec3(1.0, 0.64, 0.28), vec3(1.0, 0.33, 0.17))*1.15;
 vec3 gapHigh = clDay(vec3(0.1, 0.2, 0.26), vec3(0.07, 0.15, 0.17), vec3(0.11, 0.07, 0.14));
 vec3 cloudC = clDay(vec3(0.018, 0.03, 0.055), vec3(0.018, 0.024, 0.05), vec3(0.028, 0.018, 0.045));
 if (clAll > 0.0) {
  gapC = mix(mix(gapC, vec3(1.25, 1.25, 1.2), day), vec3(0.16, 0.2, 0.28), night)*clHue(uKind[3], 0.5);
  gapHigh = mix(mix(gapHigh, vec3(0.5, 0.62, 0.72), day), vec3(0.015, 0.025, 0.05), night)*clHue(uKind[0], 0.6);
  cloudC = mix(mix(cloudC, vec3(0.2, 0.23, 0.28), day), vec3(0.006, 0.009, 0.018), night)*clHue(uKind[1], 0.5);
 }
 float wind = uTravel*0.02 + uTime*0.004;
 float ev = max(uHits, uCue);
 float below = horizon - p.y;
 // below the horizon lies still water, which shows the sky again, drawn out by its ripples
 float dep = 0.05/max(below, 0.002);
 float rip = noise(vec2(p.x*dep*5.0 + wind*4.0, dep*16.0 + uTime*0.12)) - 0.5;
 float water = step(0.0, below);
 float e = water > 0.5 ? below*1.05 + rip*0.07*sat(below*5.0) : -below;
 e = max(e, 0.0);
 float x = p.x + water*rip*0.02;
 float toS = exp(-pow((x + 0.3)*1.15, 2.0));
 // where the far edge of the bank stands above the horizon: lower as the music fills
 float edge = mix(0.21, 0.14, lvl) - 0.07*x + 0.05*(noise(vec2(x*1.9 + wind, 3.0)) - 0.5) + 0.016*noise(vec2(x*8.0 + wind*2.0, 7.0));
 // the light under it: gold low down and towards the sun, cooling as it rises to the bank
 float k = exp(-e*11.0);
 vec3 gap = gapC*(0.1 + 0.9*toS)*(0.5 + 0.6*lvl)*(k + 0.6*exp(-e*60.0)) + gapHigh*(1.0 - k)*(0.5 + 0.5*toS)*(0.7 + 0.5*lvl);
 // the underside of the bank, rolling away to its edge, lit a little from the gap
 vec2 uv = vec2(x, 1.0)/max(e, 0.03)*0.4;
 uv.x += wind*2.0;
 float t = uTime*0.004;
 vec2 rolls = clLumps(uv*vec2(0.7, 1.3), t);
 float roll = rolls.x, roll2 = clBroad((uv + vec2(0.0, 0.14))*vec2(0.7, 1.3), t);
 if (torn > 0.0) { // long rolls, one behind another
  vec2 g = vec2(uv.x*0.1, uv.y*3.6 + 0.35*noise(vec2(uv.x*0.5, uv.y)));
  float w = 0.5 + 0.5*sin(g.y*5.0), w2 = 0.5 + 0.5*sin((g.y + 0.2)*5.0);
  roll = mix(roll, 0.15 + 0.7*w*w + 0.2*(noise(uv*vec2(0.8, 3.0)) - 0.5), torn); rolls.y = mix(rolls.y, w, torn); roll2 = mix(roll2, w2, torn);
 }
 if (plate > 0.0) { // pouches hung in rows
  vec2 g = uv*vec2(3.6, 4.0) + 0.25*(vec2(noise(uv*0.9), noise(uv*0.9 + 9.0)) - 0.5); float near = 0.0; vec2 to = vec2(0.0);
  vec2 id = floor(g);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 c = id + vec2(float(i), float(j)), h = hash22(c); vec2 v = c + 0.5 + 0.5*(h - 0.5) - g; float w = exp(-6.0*dot(v, v)); near += w; to += w*v; }
  float bag = sat(1.0 + log(max(near, 1e-4))/1.3); to /= max(near, 1e-4);
  roll = mix(roll, 0.12 + 0.75*bag, plate); rolls.y = mix(rolls.y, 0.35, plate); roll2 = mix(roll2, 0.35 + 0.22*dot(to, vec2(-0.5, 0.85))*2.2*bag, plate);
 }
 if (ceil1 > 0.0) { vec2 w = clRows(uv*2.4); roll = mix(roll, 0.1 + 0.8*w.x, ceil1); rolls.y = mix(rolls.y, 0.4, ceil1); roll2 = mix(roll2, 0.4 + 0.14*w.y, ceil1); }
 float big = noise(uv*vec2(0.3, 0.8) + 4.0);
 float under = sat(0.5 + (roll2 - rolls.y)*3.5);
 float past = max(e - edge, 0.0);
 vec3 bank = cloudC*(0.2 + 1.6*big*roll + 0.8*roll + 1.6*under*roll)*mix(1.15, 0.5, sat(e*1.5));
 bank += mix(gapC, gapHigh*3.0, 0.4)*(0.1 + 0.9*toS)*(0.25 + 0.5*lvl)*(0.2*under*exp(-past*9.0) + 0.45*exp(-past*30.0));
 float inBank = smoothstep(-0.015, 0.02, e - edge + 0.05*(roll - 0.35));
 if (ceil1 > 0.0) bank = mix(bank, mix(gapHigh*1.3 + gap*0.3, bank*1.4 + gapC*0.12*toS, smoothstep(0.2, 0.6, roll)), ceil1);
 if (glow > 0.0) { // the bank is lit from inside, from below
  float q = noise(uv*vec2(0.5, 0.9) + vec2(0.0, 3.0 + uTime*0.02)), k2 = exp(-past*2.6);
  bank += glow*(uKind[4]*uKind[4]*(0.4 + 1.1*lvl)*(0.3*under + 0.9*roll*smoothstep(0.35, 0.8, q))*k2 + uKind[2]*uKind[2]*0.4*uTexture*roll*q*k2);
 }
 if (clAll > 0.0) { vec4 m = piece(vec2(sat(0.5 + x*0.56), sat(0.75 - e*1.4))); bank += clAll*(m.rgb*m.rgb*0.4 + m.rgb*0.05)*roll*roll*(0.5 + day); }
 if (night > 0.0) gap += night*vec3(0.7, 0.8, 1.0)*clStars(vec2(x, e))*smoothstep(0.02, 0.1, e)*0.8;
 if (disc > 0.0) {
  vec2 dq = vec2(x + 0.2, e - 0.17); float rr = length(dq)/0.27, at = smoothstep(1.02, 0.99, rr);
  vec3 face = mix(gapC, uKind[3]*uKind[3]*1.5, 0.5)*(1.1 + 0.5*lvl)*(0.85 + 0.2*fbm(dq*9.0));
  gap = mix(gap, face, at*disc) + disc*face*0.35*exp(-clUp(rr - 1.0)*3.0)*(1.0 - at);
  inBank *= 1.0 - 0.3*disc*at;
 }
 vec3 col = mix(gap, bank, inBank);
 if (uOwn[2] < 0.0) {
  vec4 m1 = clRange(vec2(x*1.4 + 0.3 + wind*0.2, e), 13.3, 0.46, gapC, cloudC*1.5, gap, 0.5), m2 = clRange(vec2(x + wind*0.4, e), 4.3, 0.24, gapC, cloudC, gap, 0.2);
  col = mix(col, m1.rgb, m1.a*-uOwn[2]); col = mix(col, m2.rgb, m2.a*-uOwn[2]);
 }
 // veils of rain, far to near, each hung from the bank and leaning with the wind
 for (int i = 0; i < 6; i++) {
  float fi = float(i), near = fi/5.0;
  int kind = min(i, 4);
  float lv = i == 5 ? 0.0 : clLv(kind);
  vec3 kc = uKind[kind];
  float cx = fract(0.37 + fi*0.39 + wind*mix(0.1, 0.3, near))*2.6 - 1.0;
  float wide = mix(0.07, 0.34, near*near)*(0.75 + 0.5*hash11(fi + 2.0));
  float lean = 0.45*e + 0.5*e*e;
  if (uOwn[0] > 0.0) { wide *= mix(1.0, 0.3, uOwn[0]); }
  if (uOwn[0] < 0.0) wide = mix(wide, i == 3 ? 0.42 : wide, -uOwn[0]);
  float xs = x - lean - cx + 0.05*(noise(vec2(e*5.0 + fi*9.0, uTime*0.05)) - 0.5);
  if (uOwn[0] > 0.0) { float per = mix(5.0, 0.4 + 0.3*near, uOwn[0]); xs = (fract(xs/per + 0.5) - 0.5)*per; }
  if (uOwn[0] < 0.0 && i == 3) xs = mix(xs, x - lean*0.6 - 0.22 - 0.1*sin(wind) + 0.05*(noise(vec2(e*5.0, uTime*0.05)) - 0.5), -uOwn[0]);
  float streak = noise(vec2((x - lean)*mix(170.0, 70.0, near), e*1.2 - uTime*mix(0.2, 0.5, near) + fi));
  float sheet = noise(vec2((x - lean)*mix(18.0, 6.0, near) + fi*3.0, e*0.9 - uTime*0.05));
  float a = smoothstep(wide, wide*0.1, abs(xs))*(0.45 + 0.55*sheet)*(0.7 + 0.3*streak)*smoothstep(0.0, 0.012, e);
  a *= (0.55 + 0.45*lvl + 0.5*lv)*mix(1.0, 0.7, near)*smoothstep(edge + 0.16, edge - 0.04, e);
  if (uOwn[0] < 0.0) a *= i == 3 ? 1.0 - 0.9*uOwn[0] : 1.0 + uOwn[0];
  vec3 veil = cloudC*(0.75 + 0.5*streak) + gap*0.12;
  veil += (kc*kc*1.4 + kc*0.3)*lv*0.45*exp(-e*5.0)*(0.3 + 0.7*sheet);
  col = mix(col, veil, sat(a));
 }
 if (uOwn[4] > 0.0) { // fog lies on the land
  float h = 0.5*uOwn[4]*(0.6 + 0.7*noise(vec2(x*1.6 + wind*2.0, 4.0)) + 0.3*noise(vec2(x*5.0 - wind, uTime*0.03))) , f = exp(-clUp(e)/max(0.35*h, 0.01));
  col = mix(col, (gap*0.3 + gapHigh*0.8 + gapC*0.35)*(0.8 + 0.3*noise(vec2(x*2.0 + wind, e*14.0))), uOwn[4]*sat(f*1.3)*0.92);
  vec4 m = piece(vec2(sat(0.5 + x*0.56), sat(0.9 - e*2.0))); col += uOwn[4]*(m.rgb*m.rgb*0.5 + m.rgb*0.12)*(0.3 + f);
 }
 // a shaft of sun let through the bank
 float sx = 0.3 + 0.3*sin(uTime*0.05);
 col += gapC*ev*0.4*exp(-pow((x - sx + e*0.3)*6.0, 2.0))*smoothstep(0.6, 0.0, e)*(0.4 + 0.6*exp(-e*8.0));
 // the far shore and its trees, and low spits of land lying out in the water
 float shore = 0.004 + 0.012*noise(vec2(p.x*9.0 + wind*0.6, 1.0))*smoothstep(0.3, 0.6, noise(vec2(p.x*2.6 + wind*0.6, 5.0))) + 0.003*noise(vec2(p.x*40.0, 2.0));
 vec3 landC = vec3(0.008, 0.012, 0.012) + gap*0.05;
 if (uOwn[4] > 0.0) landC = mix(landC, gap*0.3 + gapHigh*0.8 + gapC*0.3, uOwn[4]*0.8);
 col = mix(col, landC, smoothstep(px, -px, abs(below + 0.001) - shore));
 float spit = smoothstep(0.52, 0.62, noise(vec2(p.x*1.4 + wind*1.5 + 9.0, 2.0)))*0.014*smoothstep(0.0, 0.3, noise(vec2(p.x*6.0 + wind*1.5, 8.0)) + 0.3);
 col = mix(col, landC, smoothstep(px, -px, abs(below - 0.045) - spit + 2.0*px));
 float spit2 = smoothstep(0.5, 0.64, noise(vec2(p.x*0.9 + wind*2.6 + 3.0, 6.0)))*0.03;
 col = mix(col, landC*0.8, smoothstep(px, -px, abs(below - 0.13) - spit2*(0.7 + 0.3*noise(vec2(p.x*9.0 + wind*2.6, 1.5))) + 2.0*px));
 // the water: darker than what it shows, darker still close by, and pocked with rain
 float nearW = sat(below*2.6);
 if (dry > 0.0) { // dry sand in long ripples
  vec2 g = vec2(p.x*dep*7.0 + wind*4.0, dep*9.0);
  float dune = noise(g*vec2(0.25, 0.5)), far = exp(-below*14.0);
  float fine = sin(g.y*9.0 + g.x*1.2 + 5.0*noise(g*0.6))*smoothstep(0.02, 0.14, below);
  vec3 sand = mix(uKind[2]*uKind[2], vec3(0.4, 0.33, 0.24), 0.4)*(0.12 + 0.35*lvl + 0.9*day)*(0.55 + 0.6*dune + 0.22*fine)*(0.5 + 0.7*toS);
  sand = mix(sand, gap*0.6 + sand*0.4, far*0.8);
  col = mix(col, sand, dry*smoothstep(-px, px, below));
 }
 float wetN = water*(1.0 - dry);
 col = mix(col, col*mix(vec3(0.8, 0.85, 0.85), vec3(0.3, 0.42, 0.45), nearW) + vec3(0.0, 0.004, 0.006)*nearW, wetN);
 if (uOwn[4] > 0.0) wetN *= 1.0 - 0.8*uOwn[4];
 vec2 rg = vec2(p.x*dep*26.0 + wind*20.0, dep*26.0), ri = floor(rg);
 vec2 rh = hash22(ri);
 float age = fract(uTime*(0.2 + 0.15*rh.x) + rh.y*9.0);
 float ringR = length(fract(rg) - 0.5 - (rh - 0.5)*0.5);
 float drop = smoothstep(0.09, 0.0, abs(ringR - age*0.3))*(1.0 - age)*step(0.55, rh.x);
 col += (gap*0.45 + vec3(0.015, 0.022, 0.028))*drop*wetN*smoothstep(0.015, 0.1, below)*(0.3 + 0.7*lvl)*(0.4 + uHigh);
 // reeds at the near edge, moving a little
 float reeds = 1.0 - max(clUp(-uOwn[5]), max(dry, clUp(uOwn[5])));
 if (reeds > 0.0) for (int k = 0; k < 2; k++) {
  float fk = float(k), n = 21.0 + 13.0*fk;
  float ru = p.x*n + fk*3.7 + 1.5*noise(vec2(p.x*3.0, fk));
  float id = floor(ru), rnd = hash21(vec2(id, fk + 3.0)), rnd2 = hash21(vec2(id, fk + 9.0));
  float tall = (0.04 + 0.26*rnd*rnd)*smoothstep(0.3, 0.62, noise(vec2(id/n*1.6 + 2.0 + fk, 9.0)));
  float up = max(p.y + 0.52, 0.0)/max(tall, 0.001);
  float bend = up*up*tall*n*((rnd2 - 0.5)*1.6 + 0.25*sin(uTime*0.45 + id*1.3));
  float wide = 0.11*(1.0 - up) + 0.012;
  float blade = smoothstep(wide, wide - 0.9*n/uRes.y, abs(fract(ru) - 0.5 - (rnd - 0.5)*0.5 - bend))*step(up, 1.0);
  col = mix(col, vec3(0.004, 0.007, 0.006), blade*reeds);
 }
 col = mix(col, vec3(0.004, 0.007, 0.006), smoothstep(-0.52, -0.6, p.y)); // the near bank, if the view is pulled back
 if (uOwn[5] > 0.0) col = mix(col, vec3(0.004, 0.007, 0.006) + gapHigh*0.02*(1.0 + 2.0*day), clFirs(p)*uOwn[5]);
 return col;
}
vec3 render(vec2 p) {
 clAll = sat(2.0*(abs(uOwn[0]) + abs(uOwn[1]) + abs(uOwn[2]) + abs(uOwn[3]) + abs(uOwn[4]) + abs(uOwn[5]) + abs(uOwn[6]) + abs(uOwn[7])));
 vec3 c = screenOf(uVar < 0.5 ? clHeaps(p) : clRain(p));
 if (uOwn[6] == 0.0) return c;
 float l = max(dot(c, vec3(0.3, 0.55, 0.15)), 1e-3);
 if (uOwn[6] > 0.0) { // ink lines, thicker where it is darker, crossed where it is darkest
  float v = p.y*58.0 + 1.6*noise(p*vec2(2.0, 5.0)) + 3.5*l, u = (p.x*0.8 + p.y*0.6)*62.0 + 1.2*noise(p*4.0 + 9.0);
  float w = 62.0*1.5/uRes.y, dark = min(sat(0.98 - l*1.12), 0.74);
  float one = smoothstep(dark*0.52 + w, dark*0.52 - w, abs(fract(v) - 0.5)), two = smoothstep((dark - 0.55)*0.9 + w, (dark - 0.55)*0.9 - w, abs(fract(u) - 0.5))*smoothstep(0.5, 0.6, dark);
  vec3 paper = mix(vec3(0.93, 0.9, 0.83), vec3(0.93, 0.9, 0.83)*(0.45 + 0.6*c/l*0.9), 0.5)*(0.97 + 0.06*noise(p*90.0)), ink = mix(vec3(0.09, 0.09, 0.11), c/l*0.16, 0.6);
  return mix(c, mix(paper, ink, max(one*smoothstep(0.02, 0.12, dark), two)*0.92), uOwn[6]);
 }
 float n = 5.5, f = l*n, i = floor(f), k = (i + smoothstep(0.5 - fwidth(f), 0.5 + fwidth(f), f - i))/n; // flat tones, one on another
 return mix(c, c/l*mix(k, l, 0.12)*(0.97 + 0.06*noise(p*120.0)), -uOwn[6]);
}
