// name: Sky letter
// a: One crystal
// b: Fallen snow
// what: One six-armed ice crystal on dove grey glass, lit from one side: bevelled plates, fern branches, hair-fine ribs and small bubbles at its heart, what has not played yet only a ghost; or crystals of all sizes lying on blue-white snow, one sharp, the others out of focus.
// follows: From the heart outward is the loop: plates where the front of the room sounds, ferns where the back does. Drone, pad, texture and phrase each stain a part of it, or a crystal of their own; bands draw its rings. A hit sends one gleam out, a cue turns the lamp, low tips it, keys light the tips of its branches, a voice its heart.

// What snFlake leaves for the light: how deep inside the ice (its radius is 1), the slope there, what the piece has there
// (front and back of the room), how far out in the loop, and which part it is.
float snD, snK;
vec2 snG;
vec4 snFront, snBack;
vec2 snPlates;   // of the piece: how much plate and how much fern its arms are
float snBare;    // and 1 where there is no piece: six short stubs
float snU, snHeart, snRim, snTip, snPart;   // the part: 1 the long plate, 2 a branch, 3 a branch on a branch

float snHere(float a) { return smoothstep(0.01, 0.08, a); }   // there is something, however softly it waits
// What there is at u: plates from the front of the room (x), ferns from its back (y).
vec2 snAt(float u) { u = sat(u); return vec2(snHere(max(piece(vec2(u, 0.8)).a, piece(vec2(u, 0.55)).a)), snHere(piece(vec2(u, 0.28)).a)); }
float snNow(float u) { float d = (u - uLoop) / 0.2; return exp(-d * d * d * d) * smoothstep(0.0, 0.08, min(uLoop, 1.0 - uLoop)); }
// The same where it must not leap when a cue leaves its spark on the piece: only what is there on both sides.
vec2 snStill(float u) {
  float w = snNow(u);
  vec2 c = snAt(u);
  return w < 0.01 ? c : mix(c, min(c, min(snAt(u - 0.06), snAt(u + 0.06))), w);
}
// How far out an arm goes: to the last thing in the piece.
float snReach() {
  float e = 0.0, was = 0.0;
  for (int k = 0; k < 8; k++) {
    float u = 0.06 + 0.125 * float(k);
    vec2 h = snAt(u);
    float a = max(h.x, h.y);
    e = max(e, max(min(a, was), a * (1.0 - snNow(u))) * (0.4 + 0.6 * float(k) / 7.0));
    was = a;
  }
  snPlates = 0.5 * (min(snAt(0.24), snAt(0.36)) + min(snAt(0.46), snAt(0.58)));
  snBare = 1.0 - e;
  return e;
}
// Joins one more piece of ice: d how deep inside it, g which way it gets deeper.
void snAdd(float d, vec2 g) {
  float h = sat(0.5 + 0.5 * (d - snD) / snK);
  snG = mix(snG, g, h);
  snD = mix(snD, d, h) + snK * h * (1.0 - h);
}
// One crystal of radius 1. b is how soft, form: plates, ferns (below 0: both from the piece), length of arm, heart.
void snFlake(vec2 p, float b, vec4 form) {
  snD = -1.0; snG = vec2(0.0); snK = b * 1.2; snFront = snBack = vec4(0.0); snPart = 0.0; snU = 0.0; snHeart = 0.0; snRim = 1.0; snTip = 0.0;
  float r = length(p);
  if (r > 1.06 || r < 1e-5) return;
  float k = floor(atan(p.y, p.x) / (PI / 3.0) + 0.5);
  vec2 q = vec2(dot(p, vec2(cos(k * PI / 3.0), sin(k * PI / 3.0))), dot(p, vec2(-sin(k * PI / 3.0), cos(k * PI / 3.0))));
  float sg = q.y < 0.0 ? -1.0 : 1.0, x = q.x, y = abs(q.y);
  float ya = sqrt(y * y + b * b * 0.6), hx = x + y * 0.577;
  float heart = form.w;
  bool own = form.x < 0.0;
  float ext = form.z;
  // the plate in the middle
  snAdd((heart - hx) * 0.866, vec2(-0.866, -0.5));
  // the arm
  float u = sat((x - heart * 0.8) / (1.0 - heart * 0.8));
  snU = sat((hx - heart * 0.8) / (1.0 - heart * 0.8));
  float wa = mix(0.034, 0.018, u), fat = own ? 0.0 : b * 0.5, tip = (ext - x - ya * 0.577) * 0.866;
  vec2 gy = vec2(0.0, -y / ya);
  if (wa - ya < tip) snAdd(wa - ya, gy); else snAdd(tip, vec2(-0.866, -0.5 * y / ya));
  // the long plate along it
  float pp = own ? snPlates.x : form.x, pf = own ? snPlates.y : form.y;
  float xr = heart - 0.05, xt = mix(heart, 0.70, pp) * ext, wp = pp * mix(0.15, 0.06, pf);
  if (own) { xt = max(xt, heart + 0.17 * snBare); wp = max(wp, 0.085 * snBare); }
  float g1 = wp * (1.0 - 0.8 * pf * u) - y, g2 = (xt - x - y * 0.577) * 0.866, g3 = (x - xr - y * 0.577) * 0.866 + 0.02;
  if (wp > 0.002) {
    snPart = smoothstep(0.0, 0.01, min(g1, min(g2, g3)));
    if (g1 < min(g2, g3)) snAdd(g1, vec2(0.0, -1.0)); else if (g2 < g3) snAdd(g2, vec2(-0.866, -0.5)); else snAdd(g3, vec2(0.866, -0.5));
  }
  // the branch at this place along it
  float st = 0.085, off = 0.1725, s0 = x - y * 0.577 - off;
  float om = TAU / (3.0 * st), sw = s0 + 0.026 * sin(om * (s0 - 0.5 * st) + PI), ds = 1.0 - 0.026 * om * cos(om * (s0 - 0.5 * st));
  float i = floor(sw / st), sc = (i + 0.5) * st, t = y * 1.1547, c = (sw - sc) * 0.866 / ds;
  float room = st / (1.0 - 0.026 * om * (mod(i, 3.0) == 0.0 ? 0.95 : -0.4));
  sc += off + 0.026 * sin(om * (sc - 0.5 * st));
  float ui = sat((sc - heart * 0.8) / (1.0 - heart * 0.8));
  float pl = form.x, fe = form.y;
  if (own) {
    vec2 f = snStill(ui); pl = f.x; fe = f.y;
    snFront = piece(vec2(snU, 0.78)); snBack = piece(vec2(snU, 0.32));
  }
  float h1 = hash11(i + 3.0), h2 = hash21(vec2(i + 9.0, k * 2.0 + sg + 20.0));
  float env = min(0.80 * sc, (ext - sc) * 1.1);
  float lead = mod(i, 3.0) == 0.0 ? 1.0 : mod(i, 3.0) == 1.0 ? 0.42 : 0.66;
  float L = env * sat((0.10 + 0.5 * pl + 0.6 * fe) * mix(0.75, 1.0, h1) * lead) * (0.9 + 0.1 * h2);
  if (sc < heart) L = 0.0;
  float ac = sqrt(c * c + b * b * 0.4), cs = c / ac, v = sat(t / max(L, 1e-3));
  float wd = min(st, room) * 0.433 * mix(0.42, 0.94, pl * (1.0 - 0.7 * fe)) * (1.0 - 0.5 * fe * v) + fat;
  L *= smoothstep(0.02, 0.06, L);
  snTip = smoothstep(0.75, 1.0, t / max(L, 0.02)) * step(0.02, L);
  wd = min(wd * (1.0 + 0.7 * pl * (1.0 - 0.6 * fe) * (v - 0.75)), L * 0.5);
  vec2 bd = vec2(0.5, 0.866), cd = vec2(0.866, -0.5);
  float gap = 0.433 * st / ds - abs(c) - b;
  float d1 = min(wd - ac, gap), d2 = (L - t - ac * 0.577) * 0.866;
  if (L > 0.01) {
    if (d1 < d2) snAdd(d1, -cs * cd); else snAdd(d2, -bd * 0.866 - cs * cd * 0.5);
    snPart = max(snPart, 2.0 * step(0.0, min(d1, d2)) * step(snPart, 0.5));
    // branches on the branch, at 60 degrees again
    float s2 = 0.036, t0 = t - ac * 0.577, j = floor(t0 / s2), c2 = (t0 - (j + 0.5) * s2) * 0.866, t2 = ac * 1.1547;
    float a2 = sqrt(c2 * c2 + b * b * 0.3);
    float L2 = min(room * 0.47, (L - (j + 0.5) * s2) * 0.7) * smoothstep(-0.01, 0.11, (j + 0.5) * s2) * fe * smoothstep(0.08, 0.14, L) * (0.65 + 0.35 * hash11(j + i * 7.0));
    float w2 = 0.0125 * (1.0 - 0.65 * sat(t2 / 0.075)) + fat;
    float e1 = min(min(w2 - a2, 0.433 * s2 - abs(c2) - b), gap), e2 = (L2 - t2 - a2 * 0.577) * 0.866;
    vec2 d2v = 0.5 * bd + 0.866 * cs * cd, c2v = 0.866 * bd - 0.5 * cs * cd;
    if (j >= 0.0 && L2 > 0.0) { if (snPart < 0.5) snPart = 3.0; if (e1 < e2) snAdd(e1, -c2 / a2 * c2v); else snAdd(e2, -d2v * 0.866 - c2 / a2 * c2v * 0.5); }
  }
  float bw = 0.024;
  float edge = smoothstep(-b, b, snD) * (1.0 - smoothstep(bw * 0.75, bw + b, snD));
  vec2 slope = -snG * edge;
  float rim = (snD - 0.038) / 0.005; slope += snG * rim * exp(-rim * rim) * 0.55 * sat(1.0 - b * 60.0);
  float flatIn = smoothstep(bw * 0.8, bw * 1.3 + b, snD);
  // ribs: one along each arm and branch, fine ones in the plates
  float fine = sat(1.0 - b * 60.0);
  float inHeart = smoothstep(0.0, b * 2.0 + 0.01, (heart - hx) * 0.866);
  snHeart = inHeart;
  snRim = sat(hx / heart);
  float ry = (ya - 0.013) / 0.006; slope += gy * ry * exp(-ry * ry) * 0.9 * smoothstep(0.0, 0.01, snD) * smoothstep(0.12, 0.2, x) * fine;
  float rc = c / 0.006; slope += cd * rc * exp(-rc * rc) * (0.3 + 0.5 * uMid) * flatIn * (1.0 - inHeart) * fine;
  // growth rings of the plate in the middle, each lit by its own band
  float rg = (heart - hx) / heart * 6.0 + 0.15 * sin(hx * 60.0), ri = floor(rg), rf = (fract(rg) - 0.5) / 0.14;
  slope += vec2(0.866, 0.5) * rf * exp(-rf * rf) * inHeart * smoothstep(0.02, 0.08, hx) * step(0.5, rg) * (0.28 + 1.2 * band(0.08 + 0.15 * ri)) * fine;
  // hair ribs across its sectors
  float hr = sin(y * 330.0) * smoothstep(0.35, 0.8, hx / heart) * inHeart * flatIn;
  slope += vec2(-0.5, 0.866) * hr * (0.08 + 0.3 * uHigh) * fine;
  // bubbles shut in at the heart: drops along the arms, slits between them
  vec2 b1 = vec2(x - 0.112 - 0.25 * y, y * 1.9), b2 = vec2(dot(vec2(x, y), vec2(0.866, 0.5)) - 0.135, dot(vec2(x, y), vec2(-0.5, 0.866)));
  b1.x *= 0.55; b2 *= vec2(0.32, 1.6);
  float l1 = length(b1) - 0.014, l2 = length(b2) - 0.011;
  vec2 bg = l1 < l2 ? b1 : vec2(0.866 * b2.x - 0.5 * b2.y, 0.5 * b2.x + 0.866 * b2.y);
  float bo = min(l1, l2) / max(0.0045, b);
  slope -= bg / (length(bg) + 1e-4) * exp(-bo * bo) * inHeart * fine;
  // back out of the fold
  slope.y *= sg;
  float ck = cos(k * PI / 3.0), sk = sin(k * PI / 3.0);
  snG = vec2(ck * slope.x - sk * slope.y, sk * slope.x + ck * slope.y);
}

vec3 snStain(vec3 c, float k) { k = min(k, 0.5); return mix(vec3(1.0), c / max(max(c.r, max(c.g, c.b)), 0.02), k) * (1.0 + 0.16 * k); }

// The fallen crystals of b: where each lies and how large; its turn, which way it tips and how flat, how far out of focus;
// its form (plates, ferns, arm, heart) and its kind. The first is the piece.
const int SN_N = 9;
const vec4 SN_A[9] = vec4[9](vec4(0.12, 0.0, 0.34, 0.42), vec4(-0.38, 0.3, 0.26, 0.3), vec4(0.64, 0.29, 0.24, 0.9), vec4(0.62, -0.29, 0.21, 0.5),
  vec4(-0.64, -0.33, 0.4, 0.75), vec4(-0.19, -0.42, 0.075, 0.1), vec4(0.3, 0.43, 0.07, 0.7), vec4(-0.83, 0.17, 0.1, 0.2), vec4(0.9, 0.0, 0.08, 0.5));
const vec4 SN_B[9] = vec4[9](vec4(0.9, 0.86, 0.0, -1.0), vec4(0.3, 0.74, 0.0042, 2.0), vec4(-0.5, 0.8, 0.005, 1.0), vec4(1.2, 0.8, 0.0028, 3.0),
  vec4(0.2, 0.78, 0.011, 0.0), vec4(0.6, 0.7, 0.0035, 3.0), vec4(0.1, 0.8, 0.004, 0.0), vec4(0.4, 0.65, 0.004, 1.0), vec4(0.4, 0.7, 0.002, 2.0));
const vec4 SN_F[9] = vec4[9](vec4(-1.0, 0.0, 0.0, 0.0), vec4(0.0, 1.0, 0.97, 0.22), vec4(1.0, 0.0, 0.95, 0.34), vec4(0.3, 0.7, 0.9, 0.2),
  vec4(1.0, 0.35, 0.95, 0.42), vec4(0.0, 0.3, 0.9, 0.3), vec4(0.0, 0.0, 0.75, 0.6), vec4(1.0, 0.0, 0.9, 0.4), vec4(0.0, 0.9, 0.9, 0.3));
float snLoud(int k) { return k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : uPhrase; }

// a. The lit glass under the microscope.
vec3 snGlass(vec2 p) {
  vec2 w = p - vec2(-0.5, 0.2);
  float side = exp(-dot(w, w) / (0.55 + 0.5 * uSpace));
  return mix(vec3(0.50, 0.515, 0.545), vec3(0.83, 0.825, 0.81), side) * (0.92 + 0.08 * uTone + 0.05 * uLevel + 0.06 * uCue * side);
}
// b. The snow: soft mounds, its grains where the lens is sharp, and a few that catch the lamp.
float snGrain(vec2 p) { return noise(p) * 0.6 + noise(rot(1.1) * p * 2.3 + 5.0) * 0.4; }
vec3 snGround(vec2 p, vec2 lamp) {
  float foc = (p.y + 0.02) / 0.28; foc = exp(-foc * foc);
  mat2 m = rot(0.6); vec2 mp = m * p * 2.1 + 3.0;
  float lit = 0.55 + 1.5 * (noise(mp) - noise(mp + m * lamp * 0.25));
  vec2 g = p * vec2(1.0, 1.25);
  lit += (snGrain(g * 44.0) - snGrain((g + lamp * 0.006) * 44.0)) * mix(0.25, 0.85, foc);
  vec3 col = mix(vec3(0.56, 0.655, 0.82), vec3(0.95, 0.97, 1.0), smoothstep(0.0, 1.1, lit));
  vec2 gc = g * 85.0, gf = fract(gc) - 0.5, gh = hash22(floor(gc)) - 0.5;
  float tw = 0.5 + 0.5 * sin(uTime * 0.35 + gh.x * 60.0);
  col += (1.0 - smoothstep(0.02, 0.16, length(gf - gh * 0.6))) * step(0.42, gh.y) * tw * tw * foc * (0.3 + 0.5 * uHigh);
  vec2 w = p - vec2(-0.5, 0.35);
  return col * (0.78 + 0.22 * exp(-dot(w, w) / 0.9) + 0.03 * uLevel + 0.04 * uCue);
}

vec3 render(vec2 p) {
  // the lamp: a cue turns it round and back
  float ct = 4.0 * uCue * (1.0 - uCue), la = 2.35 + 0.45 * sin(uTime * 0.05) + 2.8 * ct * ct * (3.0 - 2.0 * ct);
  vec2 lamp = vec2(cos(la), sin(la)), at;
  float hw = 0.5 * uRes.x / uRes.y, R, spin, axis, flat2, blur = 0.0, e = snReach();
  int kind = -1;
  vec4 form = vec4(-1.0, 0.0, 0.0, 0.0);
  bool one = uVar < 0.5;
  vec3 bg;
  if (one) {
    bg = snGlass(p);
    R = min(0.5, 0.2 + 0.6 * hw); at = vec2(min(0.09, hw * 0.1), -0.012) - 0.008 * vec2(sin(uTime * 0.031), cos(uTime * 0.027));
    axis = 0.6; flat2 = 0.90 - 0.03 * sin(uTime * 0.043) - 0.06 * uLow; spin = -0.39 + 0.10 * sin(uTime * 0.017);
  } else {
    p.x += 0.12 - min(0.12, hw * 0.2);
    bg = snGround(p, lamp);
    float best = 1e3; int n = 0;
    for (int i = 0; i < SN_N; i++) { vec2 o = p - SN_A[i].xy; float d = dot(o, o) / (SN_A[i].z * SN_A[i].z); if (d < best) { best = d; n = i; } }
    at = SN_A[n].xy; R = SN_A[n].z; axis = SN_B[n].x; flat2 = SN_B[n].y; blur = SN_B[n].z / R; kind = int(SN_B[n].w); form = SN_F[n];
    spin = SN_A[n].w + 0.05 * sin(uTime * 0.02 + float(n));
    if (kind < 0) flat2 -= 0.05 * uLow;
  }
  if (kind < 0) { form.w = 0.43 - 0.10 * e; form.z = mix(form.w + 0.06, 0.99, e); }
  mat2 tip = rot(axis), turn = rot(spin);
  vec2 q = (p - at) * tip, ll = lamp * tip * turn;
  q.y /= flat2; q = q * turn / R;
  // a hit's gleam, out along all six arms, and a little of it on what lies round them
  float gl = (length(q) - 0.25 - (1.0 - uHits) * 0.9) * 3.2;
  if (kind < 0) bg = mix(bg, vec3(1.0), uHits * exp(-gl * gl) * 0.2);
  if (dot(q, q) > 1.35) return bg;
  float px = 1.0 / (uRes.y * R), glow = 0.4 + 1.1 * uEnergy;
  // its shade on what it lies on
  snFlake(q + ll * ((one ? 0.03 : 0.07) + 0.04 * uSpace), 0.03 + blur, form);
  bg *= mix(vec3(1.0), one ? vec3(0.84) : vec3(0.64, 0.73, 0.88), smoothstep(-0.03 - blur, 0.05, snD));
  vec3 dark = bg * (one ? vec3(0.2, 0.235, 0.3) : mix(vec3(0.33, 0.44, 0.60), vec3(0.66, 0.74, 0.85), sat(blur * 40.0)));
  vec3 base = bg * (one ? vec3(1.13, 1.155, 1.17) : vec3(1.07)), lite = vec3(1.0, 0.995, 0.98), col = vec3(0.0);
  float w = px * 0.6 + blur * 0.8, deep = 0.75 + 0.3 * uTone, edge = 0.62 * sat(1.0 - blur * 60.0);
  float front = 0.5 - 0.5 * cos(TAU * uLoop), old = 1.0 - smoothstep(0.0, 0.25, uLoop);
  for (int s = 0; s < 3; s++) {
    float an = float(s) * 2.0944 + 0.4;
    vec2 a = q + vec2(cos(an), sin(an)) * max(px * 0.4, blur * 0.5);
    snFlake(a, px * 0.7 + blur * 0.8 + (one ? 0.012 * abs(a.y) * (1.0 - flat2) : 0.0), form);
    float cov = smoothstep(-w, w, snD), v = dot(snG, ll), m = length(snG), side = dot(a, ll), crisp = 1.0, lead = 0.0;
    int k = kind;
    if (k < 0) {
      // what has played is crisp, what is to come a ghost; each kind lights its own part
      k = snHeart > 0.5 ? 0 : snPart < 1.5 ? 1 : snPart < 2.5 ? 3 : 2;
      crisp = max(1.0 - smoothstep(-0.05, 0.08, snU - 1.05 * uLoop), old);
      lead = (snU - uLoop) / 0.05; lead = exp(-lead * lead) * front * uLevel * 0.5;
      float gu = (snU - (1.0 - uHits) * 1.1) * 7.0;
      lead += uHits * exp(-gu * gu);
    }
    vec3 ice = base * (1.0 + (one ? 0.30 : 0.2) * side);
    ice *= snStain(snFront.rgb, snFront.a * 0.25 * crisp) * snStain(snBack.rgb, snBack.a * 0.25 * crisp);
    ice *= snStain(uKind[k], snLoud(k) * glow * ((k == 0 ? 0.38 : 0.56) + 0.14 * side) * (0.3 + 0.65 * snRim * snRim));
    ice *= 1.0 + 0.2 * uMic * snHeart * (1.0 - snRim);
    ice = mix(ice, dark, sat(-v * 1.2 * deep) * 0.9);
    ice = mix(ice, lite, sat(v * 1.4));
    float ln = (snD - px * 0.5) / (px * 1.2);
    ice = mix(ice, dark, exp(-ln * ln) * edge);
    ice = mix(ice, lite, sat(lead * (0.3 + 0.7 * m) + uKeys * snTip * 0.8));
    col += mix(bg, ice, cov * mix(one ? 0.42 : 0.5, 1.0, crisp)) / 3.0;
  }
  return col;
}
