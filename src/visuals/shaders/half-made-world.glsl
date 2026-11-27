// name: Half-made world
// a: Pasted halfway
// b: Peeled flat
// what: A plaster ball stands at a globe-maker's window, half dressed in hand-coloured paper with the land, coast and hills of no known country; one wet leaf hangs from its equator, others wait in rolls over the bare white; or the twelve leaves lie in a slanting row on green cloth, their tips curling up into the light.
// follows: The piece colours the country: round is the loop, pole to pole the room. The loop turns the ball, or lifts the tips where it plays. Drone stains the sea, pad the land, texture hatches the coast, a phrase inks a red route, bands stand at the equator. A hit flushes and presses a leaf, a cue sends light over and lifts tips. Keys prick gold, a voice wets it.
// own: 0 lamp-lit evening at -1, bright noon at 1; 1 night-blue paper with pale lines at -1, old brown paper at 1; 2 scattered islands at -1, one broad land at 1; 3 more leaves rolled up and bare plaster, or high curled tips, at -1, all pasted or lying flat at 1; 4 close at -1, far at 1; 5 dark room and bench or wine-red cloth at -1, blue wall and pale bench or linen at 1
const float HMW = .5235988;  // the width of one leaf at the equator: a twelfth of the way round
vec3 hmPaper, hmInk, hmKey, hmFill;
vec3 hmTri(vec3 a, vec3 lo, vec3 hi, float q) { return q < 0.0 ? mix(a, lo, -q) : mix(a, hi, q); }
// A drawn line: d the distance to its middle, w half its width, e the size of a pixel.
float hmLn(float d, float w, float e) { return min(1.0, 2.0 * w / e) * sat((max(w, .5 * e) - abs(d)) / e + .5); }
float hmGlow(vec2 p, float k) { return exp(-k * dot(p, p)); }
float hmIn(float d, float e) { return sat(d / e + .5); }
vec3 hmRich(vec3 c, float k) { return clamp(mix(vec3(dot(c, vec3(.3, .59, .11))), c, k), 0.0, 1.0); }
// Noise in space, with the way it rises.
vec4 hmN(vec3 x) {
 vec3 i = floor(x), f = x - i, u = f * f * (3.0 - 2.0 * f), du = 6.0 * f * (1.0 - f);
 float a = hash31(i), b = hash31(i + vec3(1, 0, 0)), c = hash31(i + vec3(0, 1, 0)), d = hash31(i + vec3(1, 1, 0));
 float e = hash31(i + vec3(0, 0, 1)), g = hash31(i + vec3(1, 0, 1)), h = hash31(i + vec3(0, 1, 1)), k = hash31(i + vec3(1, 1, 1));
 float k1 = b - a, k2 = c - a, k3 = e - a, k4 = a - b - c + d, k5 = a - c - e + h, k6 = a - b - e + g, k7 = b - a + c - d + e - g - h + k;
 return vec4(du * vec3(k1 + k4 * u.y + k6 * u.z + k7 * u.y * u.z, k2 + k5 * u.z + k4 * u.x + k7 * u.z * u.x, k3 + k6 * u.x + k5 * u.y + k7 * u.x * u.y),
  a + k1 * u.x + k2 * u.y + k3 * u.z + k4 * u.x * u.y + k5 * u.y * u.z + k6 * u.z * u.x + k7 * u.x * u.y * u.z - .5);
}
// Where the lands of this country lie, and how far each spreads.
const vec4 hmC[8] = vec4[8](vec4(.80, .36, .48, 9.0), vec4(.55, -.68, .48, 11.0), vec4(.80, .50, -.33, 14.0), vec4(-.25, .92, .31, 12.0),
 vec4(-.90, -.20, .38, 9.0), vec4(-.30, -.80, -.52, 10.0), vec4(-.60, .60, -.53, 12.0), vec4(.35, -.10, -.93, 13.0));
// The net: a line at every tenth degree.
float hmNet(float lat, float lon, float cl, float w, float e) {
 const float ten = PI / 18.0;
 return max(hmLn((fract(lat / ten + .5) - .5) * ten, w, e), hmLn((fract(lon / ten + .5) - .5) * ten * cl, w, e) * step(.12, cl));
}
// One place of the printed map: longitude, latitude, size of a pixel there.
vec3 hmPrint(float lon, float lat, float e) {
 float cl = cos(lat);
 vec3 q = vec3(cl * cos(lon), cl * sin(lon), sin(lat));
 vec4 n1 = hmN(q * 3.1 + 11.3), n2 = hmN(q * 7.7 + 4.1);
 // the small capes and bays
 vec3 fa = vec3(dot(q, vec3(15, 10, -13)), dot(q, vec3(-8, 19, 9)), dot(q, vec3(6, -12, 20))) + vec3(6.0, 9.0, 7.0) * n2.w + 8.0 * n1.w, fc = cos(fa);
 vec4 n3 = .2 * vec4(fc.x * vec3(15, 10, -13) + fc.y * vec3(-8, 19, 9) + fc.z * vec3(6, -12, 20), dot(sin(fa), vec3(1)));
 float wild = .35 + .65 * smoothstep(-.25, .3, n1.w);
 vec3 g = 3.1 * .8 * n1.xyz + wild * (7.7 * .5 * n2.xyz + .24 * n3.xyz);
 float isles = max(-uOwn[2], 0.0);
 g *= 1.0 + .7 * isles;
 float h = (1.0 + .7 * isles) * (.8 * n1.w + wild * (.5 * n2.w + .24 * n3.w)) - .46 + .1 * isles + .5 * max(uOwn[2], 0.0);
 vec3 qb = q + .16 * vec3(n2.w, n3.w * .6, n1.w);
 float b1 = -9.0, b2 = -9.0; int c1 = 0, c2 = 0;
 for (int i = 0; i < 8; i++) {
  float dt = dot(q, hmC[i].xyz), b = (.95 - .5 * isles) * exp(hmC[i].w * (dt - 1.0));
  h += b; g += b * hmC[i].w * hmC[i].xyz;
  float m = dot(qb, hmC[i].xyz);
  if (m > b1) { b2 = b1; c2 = c1; b1 = m; c1 = i; } else if (m > b2) { b2 = m; c2 = i; }
 }
 g -= q * dot(g, q);
 float gl = length(g), d = h / sqrt(gl * gl + .16);    // the distance to the coast, land above 0
 vec3 east = vec3(-sin(lon), cos(lon), 0.0), north = vec3(-sin(lat) * cos(lon), -sin(lat) * sin(lon), cl);
 float se = (dot(g, north) * .6 - dot(g, east) * .8) / max(gl, .01);
 float land = hmIn(d, e);
 // what sounds here
 float u = fract(lon / TAU);
 vec4 m = piece(vec2(u, .5 - lat / PI)) * smoothstep(0.0, .02, u) * (1.0 - smoothstep(.98, 1.0, u));
 vec3 hue = hmRich(m.a > .004 ? m.rgb / m.a : vec3(.5), 1.35);
 float loud = sat(m.a * (.75 + .6 * uEnergy));
 // the washes, laid a little off the line: the sea, then the lands, strong along their edges
 vec3 col = hmPaper * (1.0 + .05 * n2.w + .06 * n3.w);
 vec3 seaTint = mix(vec3(.42, .62, .66), hmRich(uKind[0], 1.1) * .8 + .1, .35);
 float seaAmt = (.75 + .5 * n1.w + .25 * n2.w) * (.16 + .5 * uDrone + .22 * exp(-max(-d, 0.0) * 14.0));
 col *= mix(vec3(1), seaTint, sat(seaAmt + .3 * loud) * (1.0 - hmIn(d + .006 * n2.w, .012)));
 int wh = c1 % 4;
 vec3 wash = wh == 0 ? vec3(.95, .66, .60) : wh == 1 ? vec3(.96, .84, .50) : wh == 2 ? vec3(.68, .80, .58) : vec3(.95, .74, .48);
 wash = mix(wash, hmRich(uKind[1], 1.2) * .65 + .35, .3 * uPad);
 wash = mix(wash, hue * .75 + .18, .75 * loud);
 float border = (b1 - b2) / max(length(hmC[c1].xyz - hmC[c2].xyz), .1);
 float washAmt = (.2 + .5 * exp(-min(max(d, 0.0), border) * 22.0) + .3 * uPad + .7 * loud) * (.85 + .5 * n2.w);
 col *= mix(vec3(1), wash, sat(washAmt) * hmIn(d + .008 * n3.w, .01));
 col = mix(col, wash * .62, .75 * max(-uOwn[1], 0.0) * sat(washAmt) * land);
 // the engraving
 float press = .62 + .38 * loud, ink = 0.0;
 float tick = .0195, ry = lat / tick, row = floor(ry);
 float jit = hash21(vec2(row + 90.0, floor(lon * cl * 34.0 + 5.0 * hash11(row))));
 float reach = (.024 + .05 * jit) * (.7 + 1.5 * uTexture + .5 * loud) * (1.0 + .45 * se);
 float off = -d / reach;
 ink = max(ink, hmLn((ry - row - .5) * tick, .0031 * (1.0 - .75 * sat(off)), e) * step(0.0, off) * (1.0 - smoothstep(.8, 1.05, off)) * .85);
 ink = max(ink, hmLn(d, .0038 + .003 * max(se, 0.0), e) * smoothstep(.3, 1.2, gl));
 // rivers, wider as they come to the sea
 float rg = length(7.7 * n2.xyz + 1.24 * n1.xyz), rv = (n2.w + .4 * n1.w) / max(rg, 1.2);
 ink = max(ink, .8 * hmLn(rv, .0028 * (1.0 - smoothstep(0.0, .3, d)) + .001, e) * land * (1.0 - smoothstep(.1, .22, d)) * smoothstep(2.6, 4.2, rg));
 // borders in dots
 ink = max(ink, .7 * hmLn(border, .0035, e) * land * hmIn((.3 - abs(fract((lon * cl + lat) * 36.0) - .5)) / 36.0, e));
 // hills like molehills, shaded on one side, and towns
 vec2 hp = vec2(0.0, lat * 19.0); vec2 hi = floor(hp);
 hp.x = lon * floor(14.0 * max(cos((hi.y + .5) / 19.0), .25)) + hash11(hi.y + 60.0) * 9.0;
 hi.x = floor(hp.x); vec2 hf = hp - hi - .5;
 hi.x = mod(hi.x, 997.0);
 float r1 = hash21(hi + 3.7), r2 = hash21(hi + 41.3);
 hf -= vec2(.4, .34) * (vec2(r1, r2) - .5);
 float inl = land * smoothstep(.035, .05, d) * smoothstep(.01, .03, border);
 float high = step(.12, n1.w + .5 * n2.w + .25 * r1), hill = high * inl;
 float hx = hf.x / (.2 + .1 * r2), top = .26 * max(1.0 - hx * hx, 0.0) * (.8 + .4 * r1) - .14;
 float up = (hf.y - top) / 19.0, inH = step(abs(hx), 1.0);
 ink = max(ink, hill * inH * hmLn(up, .0026, e));
 ink = max(ink, hill * inH * step(up, 0.0) * step(-.16, hf.y) * step(.1, hx) * .8 * hmLn((fract(hf.x * 9.0 - hf.y * 2.0) - .5) / 126.0, .0018, e));
 float town = (1.0 - high) * step(.7, r2) * inl, td = length(hf / vec2(14.0, 19.0));
 ink = max(ink, town * .8 * hmLn(td - .0085, .0018, e));
 // the net, and a scale along the equator: the bands
 ink = max(ink, .42 * max(hmNet(lat, lon, cl, .0012, e), hmLn(abs(abs(lat) - .41) - .006, .0016, e)));
 float bar = lon / HMW * 16.0, bi = floor(bar), bh = .012 + .08 * uBands[int(mod(bi + .5, 16.0))];
 float inBar = hmIn(.34 - abs(bar - bi - .5), e * 30.0);
 ink = max(ink, .65 * inBar * hmIn(lat - .012, e) * hmIn(bh + .012 - lat, e));
 ink = max(ink, max(hmLn(lat, .0022, e), hmLn(lat - .012, .0014, e)));
 col = mix(col, hmInk, ink * press);
 // a phrase rules a route in red, keys prick gold
 float way = lat + .1 - .3 * sin(lon * 2.0 + 1.0) - .16 * sin(lon * 3.0 - .6);
 float slope = -.6 * cos(lon * 2.0 + 1.0) - .48 * cos(lon * 3.0 - .6);
 way /= sqrt(1.0 + slope * slope);
 float dash = hmIn((.36 - abs(fract(lon * 24.0) - .5)) / 24.0, e);
 col = mix(col, mix(vec3(.75, .13, .1), hmRich(uKind[3], 1.5) * .7, .2), (.15 + .8 * uPhrase) * dash * hmLn(way, .004 + .006 * uPhrase, e));
 float gold = hmIn(.016 - length(hf / vec2(14.0, 19.0)), e) * step(.55, r2) * smoothstep(.02, .04, d);
 col = mix(col, vec3(.96, .75, .25), .95 * gold * uKeys);
 // a cue: a band of warm light goes over the paper from the equator to the poles
 float over = (abs(lat) - 1.5 * (1.0 - uCue)) * 2.4;
 return col + (hmPaper * vec3(1.0, .8, .5) * .25 + .03) * uCue * exp(-over * over);
}
// A curled strip seen edge on, from the origin along x, bent toward y by k: both places a ray meets it.
vec2 hmCurl(vec2 o, vec2 v, float k, out float gap) {
 float l2 = max(dot(v, v), 1e-6), A = -.5 * k * l2, B = v.y - k * dot(o, v), C = o.y - .5 * k * dot(o, o), D = B * B - 4.0 * A * C;
 gap = D / (2.0 * abs(k) * l2);
 if (D <= 0.0) return vec2(-1e3);
 float q = -.5 * (B + (B < 0.0 ? -1.0 : 1.0) * sqrt(D));
 if (abs(q) < 1e-7) return vec2(-1e3);
 float t1 = q / A, t2 = C / q;
 return vec2(min(t1, t2), max(t1, t2));
}
float hmArc(vec2 z, float k) { float s = atan(k * z.x + 1e-7, 1.0 - k * z.y) / k; return s < 0.0 ? s + TAU / abs(k) : s; }

// A leaf of the southern half by where it stands from the front: x how far it is stuck down, y its bend from there, z whether
// it is the loose one. To the left all are stuck, to the right they wait in rolls.
vec3 hmState(float la, float id) {
 float f = la + .3 - 3.0 * max(uOwn[3], 0.0) + .6 * max(-uOwn[3], 0.0);
 float loose = smoothstep(-.42, -.02, f), roll = smoothstep(.26, .76, f), hang = loose * (1.0 - roll);
 float at = mix(mix(1.57, .56, loose), .03, roll), k = mix(mix(1.0, .1, loose), -9.5, roll);
 k += hang * .07 * sin(uTime * .37 + id * 2.0);
 float h = 4.0 * uHits * (1.0 - uHits), c = 4.0 * uCue * (1.0 - uCue);
 k = mix(k, 1.0, .75 * h * hang);
 float left = (1.0 - loose) * smoothstep(-1.2, -.75, la) * (1.0 - smoothstep(1.2, 1.5, la));
 k -= c * (1.6 * left + .7 * hang);
 return vec3(at - .5 * c * left, abs(k) < .004 ? .004 : k, hang);
}
// How the ends of a leaf on the cloth curl up.
float hmCurlOf(float i) {
 float id = mod(i, 12.0), k = .6 + 1.1 * hash11(id + 2.0) + .06 * sin(uTime * .31 + id * 2.4);
 float far = fract(uLoop - (id + .5) / 12.0 + .5) - .5;
 k += .9 * exp(-far * far * 130.0) * smoothstep(0.0, .3, uLevel) + 4.0 * uCue * (1.0 - uCue);
 k *= uOwn[3] < 0.0 ? exp2(-.8 * uOwn[3]) : 1.0 - .95 * uOwn[3];
 return -max(k * (1.0 - 3.2 * uHits * (1.0 - uHits) * step(abs(i), .5)), .02);
}
vec3 hmO, hmD, hmL, hmP;          // the ray, the light, and where the ray ends on ball or cloth
float hmT, hmShade;               // how far that is, and how much light reaches it
float hmNear, hmCov, hmPh, hmX, hmSide, hmLon, hmHang; vec3 hmNn;   // the leaf in front of it
// All the leaves the ray may meet, and their shadows.
void hmLeaves(bool flatly, float spin, float e) {
 hmShade = 1.0; hmNear = hmT; hmCov = 0.0; hmPh = 0.0; hmX = 0.0; hmSide = 1.0; hmLon = 0.0; hmHang = 0.0; hmNn = vec3(0, 0, 1);
 float first = flatly ? floor(hmP.x / .565) : floor(spin / HMW);
 int from = flatly ? -1 : uOwn[3] < 0.0 || uCue > 0.0 ? -2 : -1, to = flatly ? 1 : 3;
 for (int j = from; j <= to; j++) {
  float i = first + float(j), id = mod(i, 12.0), side = -1.0, at, k, hang;
  vec3 T, N, D, foot;
  if (flatly) {
   vec2 h = hash22(vec2(id, 7.0)) - .5;
   float tw = .05 * h.x;
   T = vec3(cos(tw), sin(tw), 0.0); N = vec3(0, 0, 1); D = vec3(-T.y, T.x, 0.0);
   vec3 c = vec3((i + .5) * .565, .1 * h.y, 0.0);
   vec2 q = vec2(dot(hmP - c, T), dot(hmP - c, D));
   at = .8; k = hmCurlOf(i); hang = 1.0 - step(.5, abs(i)); side = q.y < 0.0 ? -1.0 : 1.0;
   // the part that lies down, and its thin shadow
   float y = min(abs(q.y), at + .02), w = .5 * HMW * cos(y), lies = hmIn(min(w - abs(q.x), at + .02 - abs(q.y)), e);
   if (lies > 0.0 && hmT <= hmNear) { hmCov = lies; hmPh = y; hmX = q.x; hmSide = side; hmLon = (id + .5) * HMW; hmHang = hang; hmNn = N; }
   hmShade = min(hmShade, 1.0 - .75 * sat((w - abs(q.x - .014)) / .025 + .5) * sat((at - abs(q.y)) * 8.0 + 1.0));
   D *= side; foot = c + D * at + N * .002;
  } else {
   float la = (i + .5) * HMW - spin;
   vec3 st = hmState(la, id), R0 = vec3(cos(la), sin(la), 0.0);
   at = st.x; k = st.y; hang = st.z;
   T = vec3(-R0.y, R0.x, 0.0); N = R0 * cos(at) - vec3(0.0, 0.0, sin(at)); D = -R0 * sin(at) - vec3(0.0, 0.0, cos(at));
   foot = N * 1.004;
  }
  float len = 1.5708 - at;
  if (len < .015) continue;
  // the curled part: where the eye meets it, then the light
  vec3 b = hmO - foot;
  vec2 o2 = vec2(dot(b, D), -dot(b, N)), v2 = vec2(dot(hmD, D), -dot(hmD, N));
  float gap; vec2 ts = hmCurl(o2, v2, k, gap);
  for (int n = 0; n < 2; n++) {
   float t = n == 0 ? ts.x : ts.y, s = hmArc(o2 + v2 * t, k), x = dot(b + hmD * t, T);
   if (t < 0.0 || t > min(hmNear, hmT) + 1e-4 || s > len) continue;
   float a = hmIn(.5 * HMW * cos(at + s) - abs(x), e * 1.3) * sat(gap / e);
   if (a <= .5 * hmCov) continue;
   hmNear = t; hmCov = max(hmCov, a); hmPh = at + s; hmX = x; hmSide = side; hmLon = (id + .5) * HMW; hmHang = hang;
   hmNn = N * cos(k * s) + D * sin(k * s);
  }
  b = hmP - foot;
  o2 = vec2(dot(b, D), -dot(b, N)); v2 = vec2(dot(hmL, D), -dot(hmL, N));
  ts = hmCurl(o2, v2, k, gap);
  float t = ts.x > .003 ? ts.x : ts.y, s = hmArc(o2 + v2 * t, k);
  if (t < .003 || s > len) continue;
  float pen = .012 + (.3 - .18 * uTone) * t;
  hmShade = min(hmShade, 1.0 - sat((.5 * HMW * cos(at + s) - abs(dot(b + hmL * t, T))) / pen + .5) * sat(t * 28.0));
 }
}
// A leaf lying or hanging: what is left of its width at z.
float hmLeaf(vec2 z) { return .1667 * cos(1.5708 * clamp(z.y, -1.0, 1.0)) - abs(z.x) - max(abs(z.y) - .97, 0.0); }
// The room behind, and a leaf on its bench whose print is asked for.
vec3 hmRoom(vec2 p, vec2 foot, vec2 pole, float R, float fit, out vec4 ask, out vec3 waits) {
 ask = vec4(0); waits = vec3(0);
 float e = 1.0 / uRes.y, b = .006 + e;
 vec3 wall = hmTri(vec3(.9, .9, .87), vec3(.13, .17, .16), vec3(.46, .58, .65), uOwn[5]);
 vec3 wood = hmTri(vec3(.75, .62, .48), vec3(.3, .19, .13), vec3(.83, .81, .76), uOwn[5]);
 float fall = hmGlow(p - vec2(-1.0, .35), .55);
 vec3 lit = hmKey * (.4 + .46 * fall) + hmFill * .42;
 vec3 col = wall * lit;
 // the ball's own soft shadow on the wall
 vec2 bs = p - foot - vec2(.52, .28);
 col *= 1.0 - .3 * (1.0 - smoothstep(.6, 1.25, length(bs) / R));
 // drying leaves
 float ly = .36 + .02 * (p.x + .6) * (p.x + .6);
 col *= 1.0 - .5 * hmLn(p.y - ly, .002, b);
 for (int i = 0; i < 3; i++) {
  float x = -.82 + .17 * float(i) + (i == 2 ? .02 : 0.0);
  vec2 z = p - vec2(mix(x * .34, x, fit), ly);
  z.x -= z.y * (.04 * float(i - 1) + .016 * sin(uTime * .21 + float(i) * 2.0));
  z = vec2(z.x, z.y + .205) / .21;
  col *= 1.0 - .28 * smoothstep(-.05, .06, hmLeaf(z - vec2(.13, -.1)));
  vec3 pr = hmPaper * mix(vec3(1), mix(vec3(.6, .72, .72), vec3(.95, .75, .6), smoothstep(0.0, .25, sin(z.x * 7.0 + float(i) * 2.0 + 2.0 * sin(z.y * 4.0)) * sin(z.y * 5.0 + float(i) * 3.0))), .55);
  col = mix(col, pr * lit, hmIn(hmLeaf(z), b * 5.0));
 }
 // the bench
 float back = -.265, dep = .2 / (back + .2 - min(p.y, back + b));
 vec2 w = vec2(p.x * dep, dep);
 float plank = w.y * 2.3, pf = fract(plank), pi = floor(plank);
 vec3 wd = wood * (.9 + .16 * hash11(pi + 4.0));
 wd *= .9 + .2 * noise(vec2(w.x * 2.5 + pi * 7.0, w.y * 40.0));
 wd *= 1.0 - .45 * (1.0 - smoothstep(0.0, .035, min(pf, 1.0 - pf)));
 vec3 bl = hmKey * (.4 + .56 * hmGlow(p - vec2(-.75, -.35), .9)) + hmFill * .5;
 wd *= bl;
 vec2 sh = (p - foot - vec2(.17, 0.0)) / vec2(R * .95, R * .24);
 wd *= .45 + .55 * smoothstep(.2, 1.3, length(sh));
 // a leaf that waits on the bench
 vec2 lz = rot(-.12) * ((p - vec2(mix(-.16, -.44, fit), -.405)) * vec2(1.0, 2.5)) / .31;
 lz = lz.yx;
 wd *= 1.0 - .4 * smoothstep(-.05, .03, hmLeaf(lz - vec2(-.03, .02)));
 ask = vec4(HMW * 8.5 + lz.x * 1.5708 / max(cos(lz.y * 1.5708), .05), lz.y * 1.5708, e * 8.0, hmIn(hmLeaf(lz), e * 7.0)); waits = bl * .95;
 col = mix(col, wd, hmIn(back - p.y, b));
 col *= 1.0 - .25 * exp(-abs(p.y - back) * 60.0);
 // the glue pot and its brush
 vec2 g = p - vec2(mix(-.2, -.7, fit), -.29);
 col *= 1.0 - .45 * (1.0 - smoothstep(.1, 1.2, length((g - vec2(.06, -.06)) / vec2(.13, .026))));
 vec2 bq = rot(-.5) * (g - vec2(0.0, .05));
 col = mix(col, vec3(.55, .36, .2) * lit * (.6 + .6 * (1.0 - smoothstep(-.008, .008, bq.x))), hmIn(min(.008 - abs(bq.x), .11 - abs(bq.y - .1)), b));
 float pw = .066 + .012 * sin(clamp((g.y + .06) * 24.0, 0.0, 3.14)), gx = g.x / pw, rim = length((g - vec2(0.0, .068)) / vec2(pw, .016));
 float pot = min(pw - abs(g.x), min(g.y + .066 + .016 * sqrt(max(1.0 - gx * gx, 0.0)), .07 - g.y));
 vec3 pc = vec3(.36, .43, .42) * (.25 + .9 * (1.0 - smoothstep(-.7, .9, gx))) + .3 * exp(-49.0 * (gx + .5) * (gx + .5));
 col = mix(col, mix(pc, vec3(.16, .12, .09), hmIn(.85 - rim, .2)) * lit, max(hmIn(pot, b), hmIn(1.0 - rim, .2)));
 // the stick and its wooden foot
 vec2 f = (p - foot) / vec2(.15, .034);
 vec3 tw = vec3(.4, .26, .16) * lit;
 col = mix(col, tw * (.35 + .7 * (1.0 - smoothstep(-.9, .9, f.x))), hmIn(1.0 - length(vec2(f.x, f.y - clamp(f.y, 0.0, .75))), e * 20.0));
 f.y -= .75;
 col = mix(col, tw * (1.2 + .1 * sin(length(f - vec2(.3, .1)) * 22.0)), hmIn(1.0 - length(f), e * 20.0));
 vec2 top = foot + vec2(0.0, .025), ax = normalize(pole - top), q = p - top;
 float sl = dot(q, ax), sx = dot(q, vec2(ax.y, -ax.x)), sw = .013 + .008 * exp(-sl * sl * 400.0);
 col = mix(col, tw * 1.2 * (.3 + .9 * (1.0 - smoothstep(-.8, .9, sx / sw))), hmIn(sw - abs(sx), e) * hmIn(sl, e) * step(sl, length(pole - top) + .05));
 return col;
}
vec3 render(vec2 p) {
 bool flatly = uVar > .5;
 float noon = max(uOwn[0], 0.0), lamp = max(-uOwn[0], 0.0), fit = smoothstep(.2, .75, .5 * uRes.x / uRes.y);
 hmPaper = hmTri(vec3(.96, .91, .79), vec3(.13, .2, .34), vec3(.78, .6, .4), uOwn[1]);
 hmInk = mix(vec3(.17, .12, .1), vec3(.93, .85, .66), smoothstep(.3, .7, -uOwn[1]));
 hmKey = mix(mix(vec3(.92, .93, .94), vec3(1.0, .68, .38) * .9, lamp), vec3(1.1, 1.07, 1.0), noon) * (.96 + .07 * uLevel);
 hmFill = mix(mix(vec3(.38, .4, .43), vec3(.12, .11, .16), lamp), vec3(.45, .45, .45), noon);
 vec3 col, key = hmKey, waits = vec3(0), L; vec4 ask = vec4(0);
 float e, spin = TAU * uLoop - .028 * sin(12.0 * TAU * uLoop);
 // where the ray ends
 vec2 z = vec2(0); float r = 2.0; mat3 toB = mat3(1.0);
 if (flatly) {
  float off = .92 * exp2(.5 * uOwn[4]) * mix(1.25, 1.0, fit) * (.98 + .04 * uSpace);
  hmO = vec3(.1, -2.9, 4.3) * off + vec3(.12, 0.0, 0.0);
  vec3 fw = normalize(vec3(0.0, -.06, 0.0) - hmO), rt = normalize(cross(fw, vec3(0, 0, 1))), up = cross(rt, fw);
  hmD = normalize(fw * 1.6 + rt * p.x + up * p.y); L = normalize(vec3(-.72, .1, .7));
  mat2 sl = rot(.3 + .1 * uOwn[4]);
  hmO.xy = sl * hmO.xy; hmD.xy = sl * hmD.xy; L.xy = sl * L.xy;
  hmT = -hmO.z / min(hmD.z, -.05); e = hmT / (1.6 * uRes.y);
  hmL = L;
 } else {
  vec3 A = normalize(vec3(-.3, .93, -.2)), er = normalize(vec3(0, 0, 1) - A * A.z);
  float R = .45 * exp2(-.5 * uOwn[4]) * mix(.54, 1.0, fit) * (1.02 - .04 * uSpace);
  vec2 mid = vec2(.16 * fit, .11 + .1 * max(uOwn[4], 0.0)), pole = mid - A.xy * R * .97;
  z = (p - mid) / R; r = length(z); e = 1.0 / (R * uRes.y);
  toB = transpose(mat3(er, cross(A, er), A));
  L = normalize(vec3(-.62 + .06 * sin(uTime * .05), .5, .72));
  hmL = toB * L; hmO = toB * vec3(z, 2.5); hmD = toB * vec3(0, 0, -1);
  hmT = r < 1.0 ? 2.5 - sqrt(1.0 - r * r) : 9.0;
  col = hmRoom(p, vec2(pole.x + .02, -.435), pole, R, fit, ask, waits);
 }
 hmP = hmO + hmD * hmT;
 hmLeaves(flatly, spin, e);
 // what is under the leaves: the cloth, or the ball and the paper stuck to it
 vec3 alb = vec3(1), n = vec3(0, 0, 1); float paper = 0.0, seam = 1.0, puck = 0.0;
 if (flatly) {
  vec2 g = hmP.xy;
  key *= .7 + .62 * hmGlow(p - vec2(-.45, .2), 1.1);
  vec3 cloth = hmTri(vec3(.085, .2, .14), vec3(.3, .05, .08), vec3(.55, .5, .41), uOwn[5]);
  float weave = sin(g.x * 220.0) * sin(g.y * 220.0) * exp(-e * 120.0);
  cloth *= 1.0 + .22 * (noise(rot(.6) * g * vec2(90.0, 30.0)) - .5) + .2 * weave + .36 * (noise(g * 1.3) - .5);
  cloth = mix(cloth, vec3(.8, .8, .74), .5 * hmLn(g.y, .006, e) * (.7 + .5 * weave));
  col = cloth * (key * mix(.36, .95, hmShade) + hmFill * mix(.35, .6, hmShade));
 } else if (r < 1.0) {
  n = vec3(z, sqrt(1.0 - r * r)); vec3 q = hmP;
  float lat = asin(clamp(q.z, -1.0, 1.0)), lo = atan(q.y, q.x + 1e-7), k = floor((lo + spin) / HMW), la = (k + .5) * HMW - spin, id = mod(k, 12.0);
  float dl = lo - la, cl = max(cos(lat), .02), ez = e / max(n.z, .15);
  seam = (.5 * HMW - abs(dl)) * cl;
  float laid = hmIn(hmState(la, id).x + lat, ez);
  paper = laid * hmIn(seam - .0016 - .002 * hash21(vec2(floor(lat * 9.0), id)), ez);
  float rough = noise(q * 14.0);
  alb = vec3(.99, .975, .94) * (1.0 - .07 * rough * rough) * (1.0 - .3 * laid);
  alb *= 1.0 - .36 * max(hmNet(lat, lo + spin, cl, .002, ez), 1.6 * hmLn(seam, .0025, ez)) * (.5 + .5 * rough);
  vec2 slip = (hash22(vec2(id, 5.0)) - .5) * .02;   // no two leaves meet quite true
  puck = noise(vec2(dl * 30.0, lat * 12.0 + id * 3.0)) - .5;
  ask = vec4((id + .5) * HMW + dl + slip.x, lat + slip.y, ez, paper * step(hmCov, .995));
 }
 // the print: once for what is under, once for the leaf in front
 bool front = dot(hmNn, hmD) < 0.0;
 vec3 nn = front ? hmNn : -hmNn, under = vec3(1), over = hmPaper * .95;
 for (int i = ask.w > 0.0 ? 0 : 1; i < (hmCov > 0.0 && front ? 2 : 1); i++) {
  vec3 w = i == 0 ? ask.xyz : vec3(hmLon + hmX / max(cos(hmPh), .04), hmPh * hmSide, e / max(abs(dot(nn, hmD)), .07));
  vec3 pr = hmPrint(w.x, w.y, w.z);
  if (i == 0) under = pr; else over = pr;
 }
 vec3 blow = hmRich(uKind[4], 1.4);
 if (!flatly) {
  if (r < 1.0) {
   alb = mix(alb, under * (1.0 - .16 * exp(-seam * 120.0) - .08 * exp(-seam * 26.0)), paper);
   // a hit runs out over the ball as a ring of colour
   float ring = (length(hmP - toB * vec3(.1, -.3, .95)) - 1.1 * (1.0 - uHits)) * 5.0;
   alb = mix(alb, alb * .5 + blow * .5, .75 * uHits * exp(-ring * ring));
   vec3 light = hmKey * smoothstep(-.45, 1.0, dot(n, L)) * .92 * mix(.58, 1.0, hmShade) + hmFill * (.8 + .25 * n.y) * mix(.88, 1.0, hmShade);
   float spec = paper * pow(sat(dot(n, normalize(L + vec3(0, 0, 1))) + .01 * puck), 26.0) * (.16 + .12 * uLevel + .25 * uMic) * (.8 + .8 * puck);
   col = mix(col, alb * light + spec * hmKey * hmShade, hmIn(1.0 - r, e));
  } else col = mix(col, under * waits, ask.w);
 }
 if (hmCov > 0.0) {
  float edge = .5 * HMW * cos(hmPh) - abs(hmX), dif = dot(nn, hmL), lifted = flatly ? smoothstep(.02, .3, 1.0 - hmNn.z) : 1.0;
  over = mix(over, over * .45 + blow * .55, .8 * uHits * hmHang);
  vec3 light = key * (.9 * smoothstep(-.45, 1.0, dif) + .34 * sat(-dif)) * (flatly ? mix(hmShade * .5 + .5, 1.0, .55 * lifted) : 1.0) + hmFill * (flatly ? .6 : .85);
  if (!front) light = max(light, key * .46 + hmFill * .5);
  vec3 c = over * light * (1.0 - .15 * exp(-edge * 60.0));
  c += key * (.05 + .2 * lifted) * exp(-max(edge, 0.0) / (1.2 * e + .004));
  if (front) c += key * (.12 + .3 * uMic) * pow(sat(dot(nn, normalize(hmL - hmD))), 20.0);
  col = mix(col, c, hmCov);
 }
 return col;
}
