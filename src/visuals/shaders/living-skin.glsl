// name: Living skin
// a: Near flank
// b: Over gravel
// what: A cuttlefish's flank very near, going up to the right into soft focus: elastic dots of brown, rust and yellow over a pale sheen, a frilled fin below, and at lower left its eye, a dark curved slot under a gold lid; or the whole animal hanging over pebbles and clean sand, its shadow below, weed at the right, green hills far off.
// follows: The piece is worn by the size of the dots: along the body the loop, back to belly the room; it tints stones too. Drone opens brown, phrase rust, pad yellow, texture the blue-green flecks; bands lay moving bars. A hit is a dark flush from the eye, a cue blanches the skin. Low waves the fin, keys open giant dots, a voice widens the pupil.
// own: 0 night by a warm lamp at -1, bright shallows at 1; 1 pale skin (and all sand below) at -1, dark skin (all pebbles) at 1; 2 fine dots and small stones at -1, large ones at 1; 3 cloud patches at -1, bold zebra waves and ripples at 1; 4 seen from further off at -1, very near at 1; 5 blue ink and silver at -1, violet, pink and yellow at 1; 6 drawn in ink on cream paper at -1, dark with dots that shine in the sounds' colours at 1; 7 nothing but skin (or hung upright in open water far above the floor) at -1, the eye filling the picture (or a school of five) at 1.
#define lsInk max(-uOwn[6], 0.0)
#define lsGlow max(uOwn[6], 0.0)
#define lsBig max(uOwn[7], 0.0)
#define lsLone max(-uOwn[7], 0.0)
#define lsN (uOwn[7] > 0.0 ? 1 + int(4.0 * uOwn[7] + 0.5) : 1)
vec3 lsEm, lsWet;
float lsPx, lsShut, lsE, lsDay; vec3 lsPig[3], lsSun, lsTone, lsHue;
float lsSq(float x) { return x * x; }
// A smooth step that may also run downwards.
float lsS(float a, float b, float x) {
 float t = sat((x - a) / (b - a));
 return t * t * (3.0 - 2.0 * t);
}
// The net of light that the surface throws down.
float lsNet(vec2 q) {
 float a = noise(q + uTime * vec2(0.1, 0.08)), b = noise(q * 1.7 - uTime * vec2(0.07, -0.09) + 5.0);
 float c = sat(1.0 - abs(a - b) * 2.2);
 return c * c * c;
}
// The inks, the sun and what a cue does, for both pictures.
void lsMix() {
 float up = sat(uOwn[5]), dn = sat(-uOwn[5]), o = uOwn[0];
 lsPig[0] = mix(mix(vec3(0.15, 0.062, 0.04), vec3(0.3, 0.02, 0.26), up), vec3(0.04, 0.06, 0.15), dn);
 lsPig[1] = mix(mix(vec3(0.78, 0.23, 0.07), vec3(1.0, 0.14, 0.34), up), vec3(0.2, 0.34, 0.62), dn);
 lsPig[2] = mix(mix(vec3(0.97, 0.73, 0.22), vec3(1.0, 0.8, 0.1), up), vec3(0.56, 0.88, 0.8), dn);
 lsPig[0] *= mix(vec3(1.0), 0.5 + uKind[0], 0.5);
 lsPig[1] *= mix(vec3(1.0), 0.4 + 0.9 * uKind[3], 0.4);
 lsPig[2] *= mix(vec3(1.0), 0.5 + 0.7 * uKind[1], 0.4);
 lsShut = 1.0 - 3.8 * uCue * (1.0 - uCue);
 lsE = 0.5 + uEnergy;
 lsDay = mix(1.0, o > 0.0 ? 1.25 : 0.62, abs(o));
 lsSun = mix(mix(vec3(1.0, 0.95, 0.84), vec3(1.0, 0.72, 0.42), sat(-o)), vec3(1.0, 0.9, 0.76), uTone * 0.4) * lsDay;
 if (uOwn[6] > 0.0) lsSun *= 1.0 - 0.94 * lsGlow;
 if (uOwn[6] < 0.0) lsSun = mix(lsSun, vec3(1.05, 1.0, 0.9), 0.7 * lsInk);
}
// The water: light above, deep below.
vec3 lsWater(vec2 p) {
 float o = uOwn[0];
 vec3 hi = mix(mix(vec3(0.05, 0.19, 0.17), vec3(0.4, 0.7, 0.62), sat(o)), vec3(0.014, 0.045, 0.07), sat(-o));
 vec3 lo = mix(mix(vec3(0.002, 0.016, 0.022), vec3(0.06, 0.26, 0.27), sat(o)), vec3(0.002, 0.005, 0.012), sat(-o));
 float ray = noise(vec2(p.x * 3.0 + p.y * 1.4 + 0.5 * sin(uTime * 0.03), 2.0 + uTime * 0.04));
 vec3 wet = mix(lo, hi, lsS(-0.5, 0.6, p.y + 0.5 * (ray - 0.5) - 0.35 * p.x)) * (0.85 + 0.3 * uLevel);
 if (uOwn[6] > 0.0) wet *= 1.0 - 0.85 * lsGlow;
 if (uOwn[6] < 0.0) wet = mix(wet, vec3(0.92, 0.82, 0.64) * (0.94 + 0.07 * noise(p * vec2(90.0, 260.0)) + 0.08 * noise(p * 2.3 + 4.0)), lsInk);
 return wet;
}
// Three sheets of elastic dots laid over a ground; tone says how far each sheet is stretched, blur is in cells.
vec3 lsDots(vec3 ground, vec2 uv, vec3 tone, float blur, float loud) {
 lsEm = vec3(0.0);
 for (int k = 0; k < 3; k++) {
  float f = k == 0 ? 1.0 : (k == 1 ? 1.22 : 1.5), fk = float(k);
  vec2 q = (k == 0 ? uv : (k == 1 ? mat2(0.8, 0.6, -0.6, 0.8) * uv : mat2(0.6, -0.8, 0.8, 0.6) * uv)) * f + fk * 19.3;
  float b = min((blur + 0.02) * f, 0.62), al = 0.0, tn = tone[k];
  vec2 base = floor(q - 0.5), fr = q - base - 0.5;
  for (int j = 0; j < 4; j++) {
   vec2 o = vec2(float(j & 1), float(j >> 1)), h = hash22(base + o + 7.0 * fk), d = fr - o - (h - 0.5) * 0.52;
   float l = length(d), cs = dot(d, normalize(h - 0.503)) / (l + 1e-4), th = fract(h.x * 7.31 + h.y * 3.7);
   float tick = sat(sin(uTime * (0.16 + 0.22 * h.y) + th * 40.0) * 14.0 - 13.1) * step(0.45, h.x);
   float open = lsS(th * 0.62, th * 0.62 + 0.5, tn + 0.5 * tick);
   float r = (0.055 + 0.04 * h.y + 0.47 * open) * (1.0 + 0.06 * cs * (4.0 * cs * cs - 3.0) * open);
   al = max(al, r * r / (r * r + 0.35 * b * b) * lsS(r + b, r - b, l) * mix(1.0, 0.78 + 0.22 * lsS(0.1, 0.9, l / r), open));
  }
  float mr = 0.075 + 0.45 * lsS(0.05, 0.95, tn);
  al = mix(al, min(3.1 * mr * mr, 0.76), lsS(0.34, 0.62, b)); // too soft to tell dots apart: their mean
  if (uOwn[6] > 0.0) {
   vec3 kc = uKind[k == 0 ? 0 : k == 1 ? 3 : 1];
   lsEm += kc * kc / max(dot(kc * kc, vec3(0.4, 0.4, 0.2)), 0.08) * mix(vec3(1.0), 0.3 + lsHue, loud * 0.5) * al * al * al * (0.02 + 0.07 * tn * tn) * (0.5 + uEnergy);
  }
  ground *= mix(vec3(1.0), mix(lsPig[k], lsPig[k] * (0.35 + lsHue), loud * 0.55), al * (1.0 - 0.45 * uCue));
 }
 return ground;
}
// The patterns it tries on, by smooth weights: clouds like stones, dark waves, and faintly a checker. 0 pale to 1 dark.
float lsCoat(vec2 u, float lean, float soft) {
 float n1 = noise(u * 1.1 + 0.4 * vec2(sin(uTime * 0.021), cos(uTime * 0.017))), n2 = noise(u * 2.7 + 9.0), o = uOwn[3];
 float ws = sat(0.62 + 0.3 * sin(uTime * 0.023 + 4.0) + 0.4 * uDrone - lean - 1.2 * o);
 float wz = sat(0.3 + 0.35 * sin(uTime * 0.037) + 0.4 * uPad + 0.3 * uPhrase + lean + o);
 float wc = 0.2 * sat(0.3 + 0.6 * sin(uTime * 0.029 + 2.0) + 0.7 * uTexture);
 float stone = lsS(0.33 - 0.3 * soft, 0.67 + 0.3 * soft, mix(n1 * 0.6 + n2 * 0.4, n2, sat(-o)));
 float wave = lsS(-0.35 - soft, 0.55 + soft, sin(u.x * 5.2 + 3.6 * n1 + 1.2 * sin(u.y * 1.4 + 0.5) - 0.2 * sin(uTime * 0.1)));
 float sq = lsS(-0.3, 0.3, sin(u.x * 4.4) * sin(u.y * 4.4));
 return sat(max(ws * stone, wz * wave) + wc * (sq - 0.5));
}
// The skin: the piece, the bands and the kinds by dot size over a pale film. x runs along the body 0 to 1, th round it.
vec3 lsSkin(vec2 uv, float th, float x, float coat, float far, float f, float blur) {
 vec2 at = vec2(x, 0.5 - th / 2.4);
 vec4 pc = piece(clamp(at, 0.0, 1.0)) * lsS(-0.08, 0.02, x) * lsS(1.08, 0.98, x);
 lsHue = pc.rgb / max(pc.a, 0.03);
 float n1 = noise(uv * 2.2 + 31.0), n2 = noise(uv * 5.0 + 13.0), loud = sat(pc.a * 1.4);
 float ph = x * 1.35 - uTravel * 0.045 + 0.1 * sin(th * 2.0);
 float bar = band(abs(fract(ph) * 2.0 - 1.0)) * (0.5 + 0.5 * cos(ph * TAU * 4.0)) * lsS(-0.9, -0.2, th);
 float head = exp(-lsSq((x - uLoop) * 7.0)) * sin(PI * uLoop);
 // a hit: a flush that runs out from the eye
 float fl = far - 1.35 * (1.0 - uHits), flush = uHits * exp(-fl * fl * mix(80.0, 18.0, 1.0 - uHits) * (1.0 - 0.8 * max(uOwn[3], 0.0)));
 vec3 t = vec3(0.1 + 0.4 * coat, 0.18 + 0.24 * n1 + 0.1 * coat, 0.24 + 0.3 * n2);
 t += lsE * vec3(0.3 * uDrone * coat + 0.45 * bar, 0.4 * uPhrase * (1.0 - coat) + 0.2 * bar, 0.42 * uPad * (0.4 + 0.6 * coat));
 t += pc.a * lsE * vec3(0.4, 0.38, 0.34) + head * 0.12 + 0.4 * uOwn[1] * vec3(1.0, 0.75, 0.6);
 t *= mix(1.0, 0.5, lsS(0.1, -1.1, th)) * mix(1.0, 0.12 + 1.15 * coat, abs(uOwn[3]));
 if (uOwn[6] > 0.0) t -= 0.12 * lsGlow;
 lsTone = t = max(t, 0.0) * lsShut + flush * vec3(1.1, 0.7, 0.2);
 // the ground under the dots: milk with a blue-green film
 float film = n2 * 0.7 + 0.5 * th + 0.3 * x + 0.2 * sin(uTime * 0.05 + x * 3.0), fleck = lsS(0.52, 0.8, noise(uv * vec2(30.0, 22.0))) * lsS(0.35, 0.1, blur);
 vec3 g = mix(vec3(0.7, 0.71, 0.62), pal(film, vec3(0.44, 0.58, 0.56), vec3(0.2, 0.16, 0.16), vec3(1.0), vec3(0.55, 0.36, 0.2)), 0.46 + 0.3 * fleck);
 g += fleck * vec3(0.03, 0.26, 0.24) * (0.25 + (1.8 + 2.2 * uVar) * uTexture * lsE + 0.3 * uHigh) + uCue * 0.12;
 g = lsDots(g, uv * f, t, blur, loud) * (1.0 - 0.4 * flush);
 // single giant dots, opened by the keys
 vec2 gq = uv * 2.3 + 0.4, gh = hash22(floor(gq) + 40.0);
 float gr = 0.33 * lsS(0.0, 1.0, uKeys * (0.5 + gh.y)) * step(0.35, gh.x), gb = blur / f * 2.3 + 0.015;
 return g * mix(vec3(1.0), lsPig[1] * 0.75, step(0.001, gr) * lsS(gr + gb, gr - gb, length(fract(gq) - 0.5 - (gh - 0.5) * 0.26)));
}
// The eye: k is 1 at its corners. A dark curved slot in bronze, a gold lid, the bright water given back.
void lsEye(inout vec3 res, vec2 k, float px, float net) {
 float ball = length(vec2(k.x, k.y * (k.y > 0.0 ? 1.95 : 1.4))), rim = ball - 1.0;
 if (rim > 1.6) return;
 float above = lsS(-0.2, 0.3, k.y), out1 = max(rim, 0.0);
 res *= 1.0 + 0.22 * sin(rim * 26.0 + 2.0 * noise(k * 3.0)) * exp(-out1 * 2.6) * lsS(0.0, 0.2, rim);
 res *= 1.0 - 0.6 * exp(-out1 * mix(5.0, 2.2, above)) * mix(0.9, 0.45, above);
 // the lid
 float wd = mix(0.07, 0.46, above), y = rim / wd;
 vec3 gold = mix(vec3(0.8, 0.52, 0.16), mix(vec3(0.5, 0.6, 0.7), lsPig[1], 0.3), 0.8 * sat(-uOwn[5]));
 vec3 lid = gold * lsSun * (0.1 + 0.85 * exp(-lsSq((y - 0.42) * 3.2)) * mix(0.35, 1.0, above) + 0.5 * net * above) * (0.75 + 0.4 * noise(k * 15.0));
 res = mix(res, lid, lsS(1.3, 0.5, y) * 0.94);
 // the ball
 float kl = length(k), fib = noise(k / (kl + 1e-3) * 10.0 + kl * 2.0) * 0.6 + noise(k * 9.0) * 0.4;
 vec3 iris = mix(vec3(0.1, 0.085, 0.03), vec3(0.62, 0.5, 0.22), fib * lsS(1.05, 0.2, ball));
 iris = mix(iris, iris.bgr * vec3(0.8, 1.0, 1.3), 0.7 * sat(-uOwn[5]));
 float x = clamp(k.x / 0.7, -1.0, 1.0), c = 0.06 * cos(TAU * x) + 0.17 * x * x - 0.2, sl = (0.34 * x - 0.377 * sin(TAU * x)) / 0.7;
 vec2 pd = vec2(abs(k.y - c) / sqrt(1.0 + sl * sl) - 0.02, abs(k.x) - 0.6);
 float pu = length(max(pd, 0.0)) + min(max(pd.x, pd.y), 0.0) - 0.115 - 0.06 * uMic - 0.04 * sat(-uOwn[0]);
 iris += vec3(0.5, 0.45, 0.25) * exp(-max(pu, 0.0) * 26.0) * 0.5;
 iris *= lsSun * (0.2 + 0.8 * lsS(-0.05, 0.6, -rim - 0.5 * max(k.y, 0.0))) * (0.8 + 0.8 * net);
 iris = mix(iris, vec3(0.003, 0.004, 0.006), lsS(px, -px, pu));
 vec2 g = k - vec2(-0.32 + 0.02 * sin(uTime * 0.2), 0.16);
 iris += vec3(0.7, 0.95, 0.95) * lsDay * (lsS(0.17, 0.07, length(g * vec2(0.62, 1.5))) * (0.8 + 0.5 * uHits));
 res = mix(res, iris, lsS(px, -px, rim));
}
// The fringe fin: v runs out from the body to 1, r is the ruffle there, reach its edge.
vec3 lsFin(float v, float r, float reach, float rays) {
 vec3 c = mix(vec3(0.42, 0.46, 0.38), vec3(0.72, 0.84, 0.74), sat(v)) * (0.1 + 0.5 * sat(0.5 + 0.5 * r * (0.55 + 0.75 * uLow))) * (0.8 + 0.3 * rays);
 c += (0.35 + uKind[0] * 0.3 * uDrone) * exp(-lsSq((reach - v) * 9.0));
 return c * lsSun * (1.0 - 0.6 * exp(-max(v, 0.0) * 7.0));
}
vec3 lsFlank(vec2 p) {
 float asp = uRes.x / uRes.y, zoom = exp2(uOwn[4] * (uOwn[4] > 0.0 ? -0.6 : -0.4) - 1.25 * lsBig);
 vec2 E = vec2(-0.69, -0.26);
 p.x += E.x + min(0.69, 0.5 * asp - 0.12);
 p += lsBig * vec2(-0.66, -0.25) + lsLone * vec2(0.82, 0.24);
 p = (p - E) * zoom + E;
 lsPx *= zoom;
 vec2 m = mat2(0.921, -0.389, 0.389, 0.921) * (p - vec2(0.06, -0.19));
 float s = m.x, q = m.y, taper = max(0.56 - 0.29 * s, 0.09);
 if (uOwn[7] < 0.0) { taper = mix(taper, 0.84 - 0.06 * s, lsLone); q += 0.1 * lsLone * sin(s * 2.4); }
 float w = taper * (1.0 - 0.15 * (1.0 - lsS(-0.56, -0.2, s)) + 0.07 * exp(-s * s * 7.0)) + 0.005 * sin(s * 17.0);
 float coc = (0.0025 + 0.02 * lsS(0.1, 1.15, s) * (1.0 - 0.9 * lsLone)) * (0.5 + 0.8 * uSpace) * (1.25 - 0.5 * uTone) + lsPx;
 vec3 water = lsWater(p);
 float theta = asin(clamp(q / w, -1.0, 1.0)), ct = max(cos(theta), 0.12), u = mix(6.9 / sqrt(taper) - 9.2, s * 1.35, lsLone);
 vec2 uv = vec2(u, theta), ev = p - E;
 float er = length(ev), ed = er / 0.27;
 float net = lsNet(uv * vec2(2.2, 1.7)) * lsS(-0.5, 0.6, theta) * (1.0 - 0.5 * lsS(0.2, 0.8, s));
 // bumps that stand up from the skin
 vec2 bg = uv * 3.1 + 3.0, bh = hash22(floor(bg) + 2.0), bd = fract(bg) - 0.5 - (bh - 0.5) * 0.4;
 float dome = step(0.5, bh.x) * (1.0 - lsS(0.0, 0.28, length(bd))) * lsS(1.1, 1.6, ed), tilt = dome * bd.y * 6.0;
 float f = 12.5 * exp2(-0.8 * uOwn[2]), x = (s + 0.75) / 1.6, blur = coc * f * max(pow(taper, -1.5), 1.0 / (w * ct)) * 0.8;
 vec3 skin = lsSkin(uv + dome * bd * 0.25, theta, x, lsCoat(uv * 1.5, 0.0, 1.2 * lsS(0.1, 1.0, s)), mix(er - 0.12, length(p - vec2(0.12, -0.03)) - 0.08, lsLone), f, blur);
 vec3 em = lsEm;
 // form: the round of the body, its bumps, the swell of the eye, the fold of the collar
 float lam = sat(0.45 + 0.6 * sin(theta + 0.1)), cs = s + 0.36 - 0.45 * q * q - 0.03 * sin(q * 8.0 + 1.0);
 float under = lsS(0.006, -0.006, cs) * exp(min(cs, 0.0) * 10.0), lip = lsS(0.0, 0.02, cs) * exp(-max(cs, 0.0) * 22.0);
 vec3 light = lsSun * (0.06 + lam * lam * (0.85 + 0.3 * tilt + net * (0.5 + 0.5 * uLevel) * (0.8 + 0.4 * sat(uOwn[0]))));
 light += vec3(0.03, 0.1, 0.11) * (1.0 - lam) * lsDay + water * 0.2;
 light *= 1.0 + exp(-lsSq((ed - 1.1) * 1.7)) * clamp(ev.y * 5.0, -1.2, 1.2) * 0.5 + 0.35 * lip * lam;
 vec3 col = skin * light * (1.0 - 0.75 * under) * 1.2;
 // wet shine along the back, and the thin rim
 col += lsSun * vec3(0.8, 1.0, 0.95) * pow(sat(cos(theta - 0.7 - 0.1 * tilt)), 24.0) * (0.06 + 0.2 * net + 0.1 * tilt);
 col = mix(col, col * 0.5 + water * 0.6 + vec3(0.16, 0.13, 0.08) * lam * lsDay, lsS(0.4, 0.0, ct) * 0.6);
 col = mix(col, water, lsS(0.2, 1.2, s) * (0.15 + 0.25 * uSpace) * (1.0 - lsLone));
 if (uOwn[6] < 0.0) {
  float ha = lsS(0.25, 0.75, abs(fract((s * 0.9 + q * 0.5) * 62.0 + 0.6 * noise(p * 9.0)) - 0.5) * 2.0), dk = lsS(0.75, 0.05, lam) + 0.8 * under;
  col = mix(col, vec3(0.95, 0.86, 0.7) * (0.14 + skin * 1.15) * (1.0 - 0.75 * sat(dk) * ha), lsInk);
  col = mix(col, vec3(0.06, 0.045, 0.04), lsInk * lsS(0.012, 0.006, abs(w - abs(q))));
 }
 if (uOwn[6] > 0.0) col += em * (0.3 + 0.7 * sat(ct + 0.2)) * (1.0 - 0.6 * under) * 2.2 * lsGlow * (1.0 - 0.4 * lsS(0.3, 1.2, s));
 vec3 res = mix(water, col, lsS(-coc, coc, w - abs(q)));
 // the fringe fin under the flank
 float fw = max(0.34 * taper * lsS(-0.4, 0.0, s), 0.002), v = (-w * 0.8 - q) / fw, a = u * 5.2 - uTime * 0.55;
 float ruf = sin(a + 1.2 * v), reach = 0.78 + (0.11 + 0.15 * uLow) * sin(a + 1.2), fb = coc / fw;
 if (v > -0.03 && v < 1.4 + fb && uOwn[7] > -0.5) {
 vec3 fin = lsFin(v, ruf, reach, 0.5 + 0.5 * sin(u * 70.0 + 3.0 * ruf) * lsS(0.02, 0.004, coc));
 fin = lsDots(fin, uv * f * 1.1 + 50.0, lsTone * (0.9 - 0.8 * sat(v)), blur, 0.3);
 if (uOwn[6] > 0.0) fin += lsEm * 1.2 * lsGlow + uKind[2] * lsGlow * 0.5 * exp(-lsSq((reach - v) * 9.0)) * (0.3 + uTexture);
 if (uOwn[6] < 0.0) fin = mix(fin, vec3(0.06, 0.045, 0.04), lsInk * lsS(0.06, 0.02, abs(reach - v - 0.03)));
 res = mix(res, fin, lsS(-0.02, 0.05, v) * lsS(reach + fb, reach - fb, v) * lsS(0.004, 0.03, fw) * (0.92 - 0.3 * sat(v)));
 }
 if (uOwn[7] > -0.5) lsEye(res, mat2(0.94, -0.342, 0.342, 0.94) * ev / 0.215, lsPx * 6.0, net);
 return res;
}
// The middle line and the half height of the animal, along its length: tail at -0.46, the collar at 0.1, the brow at 0.3.
vec2 lsBody(float x) {
 float t = sat((x + 0.46) / 0.56), k = sat((x - 0.1) / 0.215);
 float man = 0.162 * pow(t, 0.6) * (1.16 - 0.38 * t * t), head = 0.094 * sqrt(1.0 - 0.96 * k * k * k * k);
 return vec2(0.012 * sin(x * 3.0 + 1.0), mix(man, head, lsS(0.06, 0.13, x)));
}
// Rounded stones: how far inside one, the way to its middle, its number.
vec4 lsStones(vec2 g) {
 vec2 i = floor(g), f = g - i, da = vec2(0.0), hb = da;
 float a = 9.0, b = 9.0;
 for (int k = 0; k < 9; k++) {
  vec2 o = vec2(float(k % 3), float(k / 3)) - 1.0, h = hash22(i + o), d = o + 0.5 + (h - 0.5) * 0.62 - f;
  float l = dot(d, d) * (0.62 + 0.85 * h.y);
  if (l < a) { b = a; a = l; da = d; hb = h; } else b = min(b, l);
 }
 a = sqrt(a);
 return vec4(smin((sqrt(b) - a) * 0.9, (0.6 - a) * 1.1, 0.12), da, hb.x);
}
vec3 lsGravel(vec2 p) {
 float asp = uRes.x / uRes.y, yh = 0.36 - 0.72 * lsLone, tall = lsS(0.5, 1.5, asp);
 vec2 C = vec2(-0.1 * tall * (1.0 - lsLone), 0.055 + 0.01 * sin(uTime * 0.23));
 C += lsBig * vec2(0.12, -0.12) + lsLone * vec2(-0.04, -0.07);
 float size = (1.24 - 0.3 * lsBig) * exp2(0.5 * uOwn[4]) * mix(0.5, 1.0, tall);
 vec3 water = lsWater(vec2(p.x * 0.6, p.y * 1.2 - 0.1)) * vec3(0.6, 0.78, 0.55) * (1.0 - 0.45 * lsS(0.03, -0.02, p.y - yh - 0.02 - 0.13 * noise(vec2(p.x * 3.2 + 4.0, 1.0))));
 water += lsSun * vec3(0.05, 0.09, 0.07) * lsS(0.3, 0.9, noise(vec2(p.x * 4.0 + p.y * 2.0 + 0.4 * sin(uTime * 0.04), uTime * 0.05))) * lsS(-0.2, 0.5, p.y);
 // the bed: gravel, with a tongue of clean sand
 float z = 0.36 / max(yh - p.y, 0.012), fog = 1.0 - exp(-max(z - 0.5, 0.0) * mix(0.5, 0.22, sat(uOwn[0])) * (0.7 + 0.6 * uSpace));
 vec2 w = vec2(p.x * z, z * 0.6) + vec2(uTravel * 0.004, 0.0);
 float sandy = lsS(-0.12, 0.2, noise(w * 1.1 + 3.0) - 0.62 + 0.4 * p.x - 0.8 * uOwn[1]), dens = 15.0 * exp2(-0.5 * uOwn[2]), far = z / uRes.y * dens;
 vec4 st = lsStones(w * dens);
 vec2 mid = w + st.yz / dens - vec2(uTravel * 0.004, 0.0);
 mid.y = max(mid.y / 0.6, 0.2);
 vec4 pc = piece(vec2(mid.x / mid.y / 1.6 + 0.5, 0.36 / mid.y / 0.86));
 float r2 = fract(st.w * 17.3), r3 = fract(st.w * 91.7), dome = lsS(0.0, 0.3, st.x);
 vec3 stone = mix(vec3(0.17, 0.16, 0.14), vec3(0.4, 0.3, 0.2), lsS(0.2, 0.6, r2));
 stone = mix(stone, vec3(0.15, 0.2, 0.22), lsS(0.5, 0.8, r3));
 stone = mix(stone, vec3(0.7, 0.66, 0.56), step(0.84, st.w));
 stone = mix(stone, vec3(0.34, 0.14, 0.08), step(0.88, r3)) * (0.4 + 0.9 * r2) * (0.6 + 0.5 * noise(w * dens * 4.0 + st.w * 30.0) + 0.4 * noise(w * dens * 19.0) / (1.0 + far));
 stone = mix(stone, stone * (0.4 + 2.6 * pc.rgb / max(pc.a, 0.03)) + 0.06 * pc.rgb, sat(pc.a * 1.5) * 0.55);
 stone = mix(stone, lsPig[1] * dot(stone, vec3(0.9)) + 0.01, 0.45 * abs(uOwn[5]));
 stone *= 0.1 + 1.1 * sat(0.15 + 0.8 * dome - 1.1 * st.z + 0.5 * st.y);
 stone = mix(stone, vec3(0.19, 0.175, 0.15), sat(far * 2.0 - 0.15) * 0.8);
 vec3 grit = vec3(0.1, 0.085, 0.06) * (0.3 + noise(w * dens * 7.0));
 stone = mix(grit, stone, lsS(-0.01, 0.05 + far, st.x));
 float rip = sin(w.y * 50.0 + 5.0 * noise(w * vec2(3.0, 2.4)) + w.x * 5.0) / (1.0 + far * 2.0);
 vec3 sand = vec3(0.58, 0.5, 0.36) * (0.74 + (0.15 + 0.15 * uOwn[3]) * rip + 0.3 * (noise(w * vec2(190.0, 320.0)) - 0.5) / (1.0 + far));
 // sand lies against the stones and buries them from the rim inwards
 float bury = sandy * 1.35 - 0.06 - sat(st.x * 2.0) * (0.75 + 0.25 * r2);
 sand *= 1.0 - 0.4 * lsS(0.25, 0.0, bury) * lsS(0.05, 0.3, st.x + 0.2);
 vec3 bed = mix(stone, sand, lsS(-0.03, 0.03, bury));
 vec2 sh = (p - vec2(C.x - 0.05 * size, -0.25 - 0.14 * (size - 1.0))) / size;
 float net = lsNet(w * vec2(3.0, 4.0)) * (1.0 - fog), shade = lsS(1.3, 0.3, length(vec2(sh.x / 0.45, sh.y / (0.075 - 0.05 * sh.x))));
 shade *= 1.0 - lsLone;
 if (uOwn[6] > 0.0) bed += pc.rgb * 0.12 * lsGlow * (0.3 + uEnergy);
 if (uOwn[6] < 0.0) bed = mix(bed, mix(vec3(0.95, 0.85, 0.68), vec3(0.2, 0.15, 0.12), lsS(0.06 + far, 0.0, abs(st.x - 0.02)) * (1.0 - sandy) * lsS(1.6, 0.6, z) + 0.35 * shade), lsInk);
 bed *= lsSun * (0.46 + 0.8 * net * (0.6 + 0.5 * uLevel)) * (1.0 - 0.88 * shade) * vec3(0.82, 1.0, 0.88) * lsS(1.35, 0.2, length(p * vec2(0.8, 1.3) - vec2(0.05, -0.05)));
 if (uOwn[6] < 0.0) bed = mix(bed, mix(vec3(0.92, 0.82, 0.64), vec3(0.2, 0.15, 0.12), sat(lsS(0.06 + far, 0.0, abs(st.x - 0.02)) * (1.0 - sandy) * lsS(2.2, 0.6, z) * 0.7 + 0.45 * shade * lsS(0.3, 0.7, abs(fract((p.x + p.y * 2.0) * 70.0) - 0.5) * 2.0))), lsInk);
 vec3 res = mix(bed, water, max(fog, lsS(yh - 0.12, yh - 0.01, p.y)));
 // the animal
 for (int n = 0; n < lsN; n++) {
 vec2 Cn = C; float sn = size, veil = 0.0;
 if (n < lsN - 1) {
  vec3 at = n == 0 ? vec3(-0.5, 0.235, 0.34) : n == 1 ? vec3(0.22, 0.245, 0.42) : n == 2 ? vec3(-0.62, 0.05, 0.52) : vec3(0.52, 0.09, 0.6);
  Cn = at.xy * vec2(tall, 1.0) + 0.012 * vec2(sin(uTime * 0.07 + at.x * 9.0), sin(uTime * 0.2 + at.x * 5.0)); sn *= at.z; veil = 0.66 - 0.14 * float(n);
 }
 vec2 m = mat2(0.9968, -0.08, 0.08, 0.9968) * (p - Cn) / sn;
 if (uOwn[7] < 0.0) m = rot(1.15 * lsLone + 0.04 * sin(uTime * 0.11) * lsLone) * m;
 float px = lsPx / sn;
 if (abs(m.x) < 0.62 && abs(m.y) < 0.36) {
  vec2 b = lsBody(m.x);
  float hh = max(b.y, 0.001), yy = m.y - b.x, theta = asin(clamp(yy / hh, -1.0, 1.0)), ct = max(cos(theta), 0.12);
  float bodyA = lsS(px * 1.3, -px * 1.3, abs(yy) - hh) * lsS(-0.46, -0.45, m.x) * (1.0 - lsS(0.306, 0.314, m.x));
  // the arms, a tapering bundle held out and a little down
  float armA = 0.0, av = 0.0;
  for (int i = 4; i >= 0; i--) {
   float fi = float(i), k = sat((m.x - 0.2) / (0.33 - 0.02 * fi - 0.03 * hash11(fi))), k2 = k * k;
   float yc = 0.046 - 0.03 * fi * (1.0 - 0.7 * k) - 0.09 * k2 + 0.012 * sin(k * 5.0 - uTime * 0.35 + fi * 1.7) * k2, ww = 0.03 * sqrt(1.0 - k) * (1.0 - 0.45 * k);
   float aa = lsS(px, -px, abs(m.y - yc) - ww) * lsS(0.26, 0.28, m.x) * step(k, 0.999);
   av = mix(av, clamp((m.y - yc) / max(ww, 0.0005), -1.0, 1.0) - 0.15 * fi, aa); armA = max(armA, aa);
  }
  float on = max(bodyA, armA), th = mix(av * 0.6, theta, bodyA);
  if (uOwn[3] != 0.0 && armA == 0.0) th = theta; // its edge is lit as its edge
  if (on > 0.0) {
   vec2 uv = vec2(m.x * 5.0, th * 0.8);
   float f = 18.0 * exp2(-0.6 * uOwn[2]), ey = length(m - vec2(0.2, 0.03)), lam = sat(0.42 + 0.62 * sin(th)), nb = lsNet(vec2(m.x * 9.0, th * 1.6));
   vec3 skin = lsSkin(uv, th, (m.x + 0.45) / 0.9, lsCoat(vec2(m.x * 9.0, th * 1.4), 0.15, 0.0), ey, f, px * f * max(5.0, 0.8 / (hh * ct)) * 0.9);
   vec3 light = lsSun * (0.07 + lam * lam * (0.9 + 0.5 * nb * (0.7 + 0.5 * uLevel))) + (vec3(0.04, 0.08, 0.07) * lsDay + water * 0.1) * (1.0 - lam);
   float cs = m.x - 0.085 - 0.02 * cos(theta * 1.4) - 0.02 * theta;
   light *= 1.0 + bodyA * (0.4 * lsS(0.004, -0.004, cs) * exp(min(cs, 0.0) * 70.0) - 0.7 * lsS(-0.004, 0.004, cs) * exp(-max(cs, 0.0) * 32.0));
   vec3 col = skin * light * 1.25 + lsSun * pow(sat(cos(th - 0.75)), 26.0) * (0.05 + 0.12 * nb) * bodyA;
   if (uOwn[6] < 0.0) {
    float ha = lsS(0.25, 0.75, abs(fract((m.x + m.y * 0.6) * 95.0) - 0.5) * 2.0);
    col = mix(col, vec3(0.95, 0.86, 0.7) * (0.14 + skin * 1.15) * (1.0 - 0.75 * lsS(0.7, 0.05, lam) * ha), lsInk);
    col = mix(col, vec3(0.06, 0.045, 0.04), lsInk * max(bodyA * lsS(0.006, 0.003, abs(abs(yy) - hh)), (1.0 - bodyA) * lsS(0.75, 0.95, abs(av + 0.15 * floor(0.5 - av / 0.6)))) * 0.9);
   }
   if (uOwn[6] > 0.0) col += lsEm * (0.35 + 0.65 * sat(ct)) * 2.4 * lsGlow;
   col = mix(col, water, veil);
   res = mix(res, col, on);
   vec3 held = res;
   lsEye(res, mat2(0.98, 0.199, -0.199, 0.98) * (m - vec2(0.195, 0.026)) / 0.04, px * 27.0, nb);
   if (uOwn[7] > 0.0) res = mix(res, held, veil);
  }
  float fx = sat((m.x + 0.48) / 0.6), env = lsS(0.0, 0.14, fx) * (1.0 - lsS(0.8, 1.0, fx));
  float v = (b.x - 0.5 * hh - m.y) / 0.066, a = m.x * 47.0 + 0.8 * sin(m.x * 13.0) + uTime * 0.6, ruf = sin(a + 1.6 * v), reach = env * (0.85 + (0.1 + 0.18 * uLow) * sin(a + 1.6)), fb = px / 0.05;
  vec3 fin = lsFin(v, ruf, reach, 0.5 + 0.2 * sin(m.x * 300.0 + 2.0 * ruf)) * 0.6 + water * 0.2;
  fin *= mix(lsPig[2] * lsPig[1] + 0.35, vec3(1.0), lsS(-0.1, 0.5, v));
   if (uOwn[6] > 0.0) fin = fin * (1.0 - 0.7 * lsGlow) + mix(uKind[2], uKind[1], sat(v)) * lsGlow * (0.06 + 0.5 * exp(-lsSq((reach - v) * 6.0))) * (0.4 + 0.8 * uTexture);
  if (uOwn[6] < 0.0) fin = mix(fin, mix(vec3(0.95, 0.86, 0.7), vec3(0.06, 0.045, 0.04), lsS(0.1, 0.03, abs(reach - v - 0.05)) + 0.5 * lsS(0.6, 1.0, sin(m.x * 300.0))), lsInk);
  fin = mix(fin, water, veil);
 res = mix(res, fin, lsS(0.0, 0.12, v) * lsS(reach + fb, reach - fb, v) * lsS(0.0, 0.1, env) * (0.92 - 0.6 * sat(v) * (0.6 - 0.4 * ruf)));
 }
 }
 // weed at the right edge
 for (int i = 0; i < 5; i++) {
  float fi = float(i), hy = 0.36 - 0.3 * hash11(fi + 2.0), kk = sat((p.y + 0.62) / (hy + 0.62));
  float cx = max(0.5 * asp, 0.36) - 0.042 * fi + 0.04 + (0.02 + 0.07 * kk) * kk * sin(uTime * (0.21 + 0.02 * fi) + fi * 2.0 - kk * 3.0);
  float wd = (0.024 + 0.008 * sin(fi * 3.0)) * sqrt(max(sin(PI * (kk * 0.9 + 0.1)), 0.0)) * (1.0 + 0.25 * sin(p.y * 37.0 + fi * 9.0 + 2.0 * sin(p.y * 11.0))), d = p.x - cx;
  vec3 weed = mix(vec3(0.02, 0.05, 0.015), mix(vec3(0.22, 0.22, 0.035), lsPig[1] * 0.4, abs(uOwn[5])), sat(0.5 + d / 0.03)) * (0.1 + 0.75 * kk * kk) * (1.0 - 0.4 * lsS(0.0035, 0.001, abs(d)));
  res = mix(res, weed * lsSun + water * 0.1, lsS(0.005, -0.004, abs(d) - wd) * step(kk, 0.999));
 }
 return res;
}
vec3 render(vec2 p) {
 lsPx = 1.0 / uRes.y;
 lsMix();
 vec3 c = uVar < 0.5 ? lsFlank(p) : lsGravel(p);
 return pow(1.0 - exp(-max(c, 0.0) * 1.7), vec3(0.4545));
}
