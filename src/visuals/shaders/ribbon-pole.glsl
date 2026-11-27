// name: Plaited pole
// a: Village green
// b: Down the braid
// what: A tall garlanded pole from straight above on a mown green, sixteen ribbons running from it to dancers in white who weave round it, their morning shadows beside them; or looking up the pole, where a tight plait of coloured lozenges ends and the ribbons flare out under the sky with the sun through them.
// follows: The loop winds the plait down the pole and lets it out again. Each ribbon carries a band and widens with it, and the piece is dyed along it. Drone leans the pole, pad lights the cloth, texture flutters it, a phrase sends one ribbon wide; travel walks them round; a hit runs down the ribbons on one side, a cue down all, with petals on the green.
// own: 0 moonlit dusk at -1, low gold evening at 1; 1 thin cords at -1, broad banners at 1; 2 ribbons straight as spokes at -1, swept round in a spiral at 1; 3 all undyed linen at -1, red and white at 1; 4 seen from far at -1, close in at 1; 5 snow (looking up, an overcast sky) at -1, a sandy square (a clear sky) at 1
const vec3 RP_DYE[8] = vec3[8](vec3(0.8, 0.13, 0.12), vec3(0.95, 0.92, 0.84), vec3(0.1, 0.3, 0.6), vec3(0.95, 0.67, 0.12),
                              vec3(0.1, 0.46, 0.36), vec3(0.9, 0.42, 0.46), vec3(0.95, 0.92, 0.84), vec3(0.4, 0.2, 0.46));
float rpPx, rpPlait, rpTurn, rpDusk, rpGold;
float rpFall(float lo, float hi, float x) { return 1.0 - smoothstep(lo, hi, x); }
float rpIn(float d) { return 1.0 - smoothstep(-rpPx, rpPx, d); }     // inside an edge, smoothed over a pixel
// The dye of one ribbon: the village's eight, each taking some of the colour of the kind it goes with.
vec3 rpDye(int i) {
  vec3 c = RP_DYE[i & 7];
  float pale = (i & 7) == 1 || (i & 7) == 6 ? 1.0 : 0.0;
  c = mix(c, uKind[(i * 3) % 5] * vec3(1.15, 1.1, 1.05), 0.34 * (1.0 - 0.75 * pale));
  vec3 linen = vec3(0.9, 0.85, 0.74) * (0.88 + 0.12 * hash11(float(i) + 3.0));
  vec3 two = (i & 1) == 1 ? vec3(0.95, 0.92, 0.86) : vec3(0.78, 0.1, 0.12);
  return mix(mix(c, linen, sat(-uOwn[3])), two, sat(uOwn[3]));
}
// The plaited cloth on the pole: a is the angle round it, h the way along.
vec3 rpPlaitCloth(float a, float h, float aa) {
  float u = a * 8.0 / TAU + h, v = a * 8.0 / TAU - h;
  vec2 c = floor(vec2(u, v)), f = vec2(u, v) - c, e = min(f, 1.0 - f);
  bool over = mod(c.x + c.y, 2.0) < 0.5;
  int id = over ? int(mod(c.x, 8.0)) : 8 + int(mod(c.y, 8.0));
  float across = over ? f.x : f.y, along = over ? f.y : f.x;
  vec3 col = rpDye(id) * (1.0 + 0.5 * uBands[id] * uEnergy);
  col *= 0.62 + 1.8 * along * (1.0 - along);
  col *= 0.97 + 0.05 * sin(across * 40.0) * rpFall(0.02, 0.1, aa);
  return col * mix(0.35, 1.0, smoothstep(0.0, 0.1 + aa, min(e.x, e.y)));
}
// The piece's colour at the part t of a ribbon's way, laid into its dye.
vec3 rpStain(vec3 dye, float t, int i) {
  float y = (float(i) + 0.5) / 16.0;
  vec4 m = piece(vec2(t, y));
  return m.a > 0.004 ? mix(dye, m.rgb / m.a * 1.2, 0.55 * sat(m.a * (0.6 + uEnergy))) : dye;
}
// The pass of a hit and of a cue down a ribbon that points along u, at the part t of its way.
// A hit goes down the ribbons on the side the loop has come to.
float rpPass(float t, vec2 u) {
  if (uHits + uCue < 0.004) return 0.0;
  float h = (t - 1.2 + 0.9 * uHits) / 0.2, c = (t - 1.3 + 1.1 * uCue) / 0.2;
  return uHits * exp(-h * h + 2.0 * (u.x * cos(TAU * uLoop) + u.y * sin(TAU * uLoop) - 1.0)) + 0.9 * uCue * exp(-c * c);
}

// ---- a: the green from above ----
// The mown grass, with a ring trodden pale where they dance.
vec3 rpGreen(vec2 p, vec2 foot, float ring) {
  vec2 m = rot(0.42) * p;
  float mow = smoothstep(-0.25, 0.25, sin(m.x * 26.0));
  float n = noise(p * 9.0), g = noise(m * vec2(150.0, 55.0));
  vec3 c = mix(vec3(0.58, 0.69, 0.4), vec3(0.72, 0.79, 0.5), mow);
  c *= 0.84 + 0.14 * n + 0.17 * g;
  float d = length(p - foot), w = (d - ring) / 0.06;
  float worn = exp(-w * w) + 0.8 * exp(-d * d * 180.0);
  c = mix(c, vec3(0.83, 0.79, 0.57) * (0.88 + 0.22 * g), 0.55 * sat(worn * (0.55 + 0.7 * n)));
  vec3 sand = vec3(0.85, 0.74, 0.56) * (0.9 + 0.12 * n + 0.07 * g) * (1.0 - 0.06 * worn);
  vec3 snow = vec3(0.89, 0.92, 0.96) * (0.95 + 0.05 * n + 0.04 * g) * (1.0 - 0.14 * sat(worn) * (0.4 + g));
  c = mix(mix(c, snow, sat(-uOwn[5])), sand, sat(uOwn[5]));
  // daisies in the grass, off the dancing ring
  vec2 q = p * 30.0, id = floor(q);
  if (hash21(id + 7.0) > 0.72) {
    float ds = length(fract(q) - 0.5 - (hash22(id) - 0.5) * 0.7) / 30.0;
    c = mix(c, vec3(0.98, 0.97, 0.92), 0.85 * rpFall(0.0034 - rpPx, 0.0034 + rpPx, ds) * smoothstep(0.35, 0.6, n) * (1.0 - abs(uOwn[5])));
  }
  // a hit is a stamp: a ring of bent grass goes out from the foot
  float st = (d - 0.14 - 0.4 * (1.0 - uHits)) / 0.05;
  c *= 1.0 + 0.2 * uHits * exp(-st * st);
  return c;
}
vec3 rpAbove(vec2 p) {
  float zoom = exp2(-0.55 * uOwn[4]);
  vec2 foot = vec2(-0.13, -0.035);
  p = foot * (1.0 - zoom) * 0.6 + p * zoom;
  rpPx = zoom * 1.1 / uRes.y;
  vec2 nadir = vec2(-0.34, -0.17);
  // the pole leans and breathes; its tip is near the eye, so it stands far out from the foot
  vec2 tip = foot + vec2(0.175, 0.11) + (0.012 + 0.035 * uDrone) * vec2(sin(uTime * 0.17), cos(uTime * 0.13));
  float ring = 0.365 * (1.0 + 0.06 * uDrone + 0.05 * uSpace) * (1.0 - 0.16 * rpPlait);
  float at = mix(0.94, 0.56, rpPlait);                    // how far up the pole the ribbons leave it
  vec2 end = mix(foot, tip, at), axis = normalize(tip - foot);
  // the sun's way over the grass, per length of height
  vec2 sun = normalize(vec2(0.9, -0.44)) * mix(0.075, 0.14, rpGold);
  float sunL = length(sun);
  vec2 endSh = foot + sun * 6.0 * at;
  float weave = 0.12 * (1.0 + 0.3 * uMid) * (1.0 - 0.8 * sat(-uOwn[2]));
  float trail = (0.15 + 0.03 * rpPlait) * (1.0 - sat(-uOwn[2])) + 0.1 * sat(uOwn[2]);
  float wide = exp2(1.5 * uOwn[1]), slow = 0.5 * sin(uTime * 0.23);
  float shade = 0.0, best = 0.0032;                       // the dancer that stands here, if one does
  int who = 0;
  vec2 bd = vec2(0.0), bu = vec2(1.0, 0.0), bo = vec2(0.0);
  // each file's cloth, and how much of it, how near its edge, whose it is
  vec3 farC = vec3(0.0), nearC = farC, farA = vec3(0.0, 9.0, 0.0), nearA = farA;
  vec2 q = p - end, qs = p - endSh;
  vec3 swap = cos(8.0 * rpTurn + vec3(0.0, -0.45, -0.9));
  vec2 th = vec2(cos(rpTurn), sin(rpTurn)), sn = sun / sunL;
  // nothing of the dance reaches past the ring and the shadow of the pole
  vec2 ps = p - foot;
  float sl = sunL * 6.0, out1 = clamp(dot(ps, sn) / (sl * at), 0.0, 1.0), reach = ring * (1.03 + weave) + 0.04 + 0.075 * uPhrase;
  bool inDance = length(ps - sn * clamp(dot(ps, sn), 0.0, sunL * 1.3)) < reach || (out1 > 0.0 && length(ps - sn * sl * at * out1) < mix(reach, 0.06, out1) + 0.12);
  for (int fam = 0; fam < 2 && inDance; fam++) {
   float dir = fam == 0 ? 1.0 : -1.0;
   vec3 here = vec3(0.0, 9.0, 0.0);
   vec4 strip = vec4(0.0);
   vec2 evenU = vec2(th.x, dir * th.y), oddU = fam == 0 ? rot(1.0104) * evenU : rot(0.7853982) * evenU;
   for (int k = 0; k < 8; k++) {
   int i = fam * 8 + k;
   float fi = float(i);
   bool odd = (k & 1) == 1;
   vec2 u = odd ? oddU : evenU;
   if (odd) oddU = vec2(-oddU.y, oddU.x); else evenU = vec2(-evenU.y, evenU.x);
   float rad = ring * (1.0 + dir * weave * (fam == 1 ? swap.y : odd ? swap.z : swap.x) + 0.03 * (fract(fi * 0.618) - 0.5));
   rad += (i == 5 ? 0.075 : 0.0) * uPhrase;  // the phrase's own dancer goes wide
   vec2 D = foot + rad * u;
   // the dancer's long shadow on the grass
   vec2 dp = p - D;
   float dd = dot(dp, dp), sl = sunL * 1.2;
   if (dd < (sl + 0.03) * (sl + 0.03)) {
     float sa = dot(dp, sn), sc = abs(dp.x * sn.y - dp.y * sn.x), st = sat(sa / sl);
     float body = mix(0.026, 0.007, smoothstep(0.0, 0.75, st)) + 0.008 * smoothstep(0.78, 0.86, st);
     float ds = sc - body + max(0.0, max(-sa, sa - sl)) * 1.2;
     shade = max(shade, 0.85 * rpFall(-0.003 - 0.004 * st, 0.004 + 0.008 * st, ds));
   }
   if (dd < best) { best = dd; who = i; bd = dp / 1.3; bu = u; bo = (D - nadir) * 0.035; }
   // the ribbon, from the plait to the dancer's hand, bowed by the going round and by its own weight
   vec2 hand = D - u * 0.018;
   vec2 v = hand - end;
   float L2 = max(dot(v, v), 1e-5), t = dot(q, v) / L2, bow = dir * trail * 4.0;
   if (t > 0.0 && t < 1.0) {
     float L = sqrt(L2), hump = t * (1.0 - t);
     float sag = 0.045 * (v.x * (nadir.y - end.y) - v.y * (nadir.x - end.x)) / L;
     float d = (v.x * q.y - v.y * q.x) / L - (bow * L + sag) * hump;
     if (abs(d) < 0.035 + 0.03 * wide) {
       d -= 0.018 * hump * sin(t * 5.0 - uTime * 0.6 + fi * 1.9) * (1.0 + uLow);
       float slope = bow * (1.0 - 2.0 * t);
       d /= 1.0 + 0.4 * slope * slope;
       float turn = cos(t * 4.0 + fi * 1.7 + slow);
       float pass = rpPass(t, u);
       float b = uBands[i];
       float half_ = wide * mix(0.0145, 0.0115, t) * (0.38 + 0.62 * abs(turn)) * (0.85 + (0.4 + 0.5 * uEnergy) * b + 0.8 * pass);
       d += 0.0032 * (uTexture + 0.6 * uKeys) * t * sin(t * 30.0 - uTime * 2.2 + fi);
       half_ = max(half_, 0.0012);
       float c = rpIn(abs(d) - half_);
       if (c > 0.5 || abs(d) / half_ < here.y) here.z = float(k);
       here.y = min(here.y, abs(d) / half_);
       if (c > here.x || c > 0.5) strip = vec4(t, clamp(d / half_, -1.0, 1.0), turn, pass);
       here.x = max(here.x, c);
     }
   }
   // and its shadow on the ground
   v = hand - endSh; L2 = max(dot(v, v), 1e-5); t = dot(qs, v) / L2;
   if (t > 0.0 && t < 1.0) {
     float iL = inversesqrt(L2), y = (v.x * qs.y - v.y * qs.x) * iL - bow / iL * t * (1.0 - t);
     float hw = wide * mix(0.0068, 0.006, t), soft = mix(0.01, 0.0022, t);
     shade += (1.0 - shade) * 0.42 * mix(0.4, 1.0, t) * rpFall(-soft, soft, abs(y) - hw);
   }
   }
   // the topmost ribbon of the file: its upper side, sheen and dye
   int id = fam * 8 + int(here.z);
   float s = strip.y, tu = strip.z, b = uBands[id];
   vec3 cloth = rpStain(rpDye(id), strip.x, id);
   cloth *= 0.78 + 0.28 * smoothstep(-0.12, 0.12, tu + 0.3 * s) + 0.22 * tu * tu * tu * tu * (1.0 - s * s);
   cloth = cloth * (1.0 + 0.22 * uPad + 0.25 * b * uEnergy + 0.5 * strip.w) + vec3(0.3, 0.27, 0.2) * strip.w;
   cloth *= here.x * mix(0.5, 1.0, smoothstep(0.0, 0.16, strip.x)) * (1.0 - 0.12 * smoothstep(0.7, 0.8, abs(s)));
   if (fam == 0) { nearC = cloth; nearA = here; } else { farC = cloth; farA = here; }
  }
  // the shadow of the pole and of its garland, out over the grass
  float sa = dot(ps, sn) / sl, sc = abs(ps.x * sn.y - ps.y * sn.x);
  float soft = 0.002 + 0.008 * sat(sa);
  if (sa > -0.02 && sa < 1.0) shade += (1.0 - shade) * 0.85 * rpFall(-soft, soft, sc - 0.0065);
  shade += (1.0 - shade) * 0.8 * rpFall(-0.008, 0.01, abs(length(ps - sun * 6.0) - 0.052) - 0.013);
  // a tree off to the left lets the sun through in patches
  float tr = length((p - vec2(-0.98, 0.52)) * vec2(0.85, 1.0));
  if (tr < 1.0) {
    float leaf = noise(p * 5.5 + vec2(0.1 * sin(uTime * 0.11), 4.0)) + 0.5 * noise(p * 15.0);
    shade += (1.0 - shade) * 0.7 * (1.0 - smoothstep(0.42, 0.72, tr + 0.36 * (leaf - 0.75)));
  }
  vec3 shadeTint = mix(mix(vec3(0.4, 0.53, 0.6), vec3(0.4, 0.36, 0.5), rpGold), vec3(0.5, 0.56, 0.74), rpDusk);
  vec3 sunTint = mix(mix(vec3(1.03, 1.0, 0.92), vec3(1.1, 0.9, 0.6), rpGold), vec3(0.42, 0.52, 0.76), rpDusk);
  vec3 col = rpGreen(p, foot, ring) * mix(vec3(1.0), shadeTint, sat(shade) * (0.88 + 0.12 * uTone));
  vec2 rp = rot(0.35) * (p - vec2(0.52, -0.38));
  float rug = max(abs(rp.x) - 0.115, abs(rp.y) - 0.06);
  if (rug < 0.1) {
    vec2 ch = abs(fract(rp * 25.0) - 0.5);
    vec3 rc = mix(vec3(0.9, 0.87, 0.79), mix(vec3(0.2, 0.36, 0.6), rpDye(0), abs(uOwn[3])), 0.5 * smoothstep(0.2, 0.3, ch.x) + 0.5 * smoothstep(0.2, 0.3, ch.y));
    col = mix(col, rc, rpIn(rug));
    for (int i = 0; i < 6; i++) {
      float fi = float(i);
      vec2 d = rp - vec2(-0.085 + 0.034 * fi, 0.026 * sin(fi * 2.7)), sd = rot(0.35) * sn;
      col *= 1.0 - 0.6 * rpFall(-0.004, 0.004, length(d - sd * clamp(dot(d, sd), 0.0, 0.035)) - 0.0095);
      col = mix(col, rpDye(i * 3 + 2) * (0.85 - 18.0 * dot(d, sd)), rpIn(length(d * vec2(1.0, 1.25)) - 0.0125));
      col = mix(col, mix(vec3(0.92, 0.8, 0.52), vec3(0.3, 0.2, 0.14), float(i & 1)) * (0.95 - 30.0 * dot(d, sd)), rpIn(length(d + sd * 0.003) - 0.0092));
    }
  }
  // the striped awning of the band, cut off by the corner
  vec2 aw = rot(-0.3) * (p - vec2(0.86, 0.47));
  float awn = max(-aw.x - 0.2, -aw.y - 0.15);
  if (awn < 0.15) {
    col *= mix(vec3(1.0), shadeTint, 0.8 * rpFall(-0.008, 0.008, max(-aw.x - 0.18, -aw.y - 0.21)));
    float st = smoothstep(-0.12, 0.12, sin(aw.x * 70.0));
    vec3 canvas = mix(vec3(0.95, 0.92, 0.84), mix(rpDye(0), vec3(0.62, 0.55, 0.44), sat(-uOwn[3])), st);
    col = mix(col, canvas, rpIn(awn + 0.006 * abs(sin(aw.x * 35.0))));
  }
  if (best < 0.0032) {
    // heads stand out from under the eye
    float r = length(bd), rn = r > 1e-5 ? atan(bd.y, bd.x) : 0.0;
    float a = rpIn(r - 0.0225 - 0.0012 * sin(rn * 9.0 + float(who) + uTime * 0.8));
    vec3 hue = rpDye(who);
    vec3 cl = mix(vec3(1.0, 0.98, 0.94), hue, 0.12 + 0.6 * abs(uOwn[3])) * (0.97 + 0.07 * sin(rn * 9.0 + float(who) + 1.3) - 0.26 * dot(bd / 0.024, sn));
    cl = mix(cl, hue, rpIn(abs(r - 0.0185) - 0.0022));
    vec2 ts = bd - bo * 0.55;
    vec2 ac = vec2(dot(ts, bu), dot(ts, vec2(-bu.y, bu.x)));
    float to = length(ac * vec2(1.35, 1.0)) - 0.0115, ta = rpIn(to);   // shoulders
    cl = mix(cl * (1.0 - 0.35 * rpFall(0.0, 0.008, to)), mix(vec3(0.92, 0.88, 0.8), hue, 0.75) * (0.9 - 0.3 * dot(ts / 0.012, sn)), ta);
    vec2 hp = bd - bo;
    float hr = length(hp), ha = rpIn(hr - 0.0096);
    vec3 hat = vec3(0.9, 0.77, 0.47) * (0.95 - 0.35 * dot(hp / 0.0096, sn));
    hat = mix(hat, hue * 0.8, rpIn(abs(hr - 0.0056) - 0.0012));
    cl = mix(cl * (1.0 - 0.45 * rpFall(0.0, 0.005, length(hp - sn * 0.004) - 0.0096)), hat * (1.0 + 0.4 * uKeys), ha);
    col = mix(col, cl, max(max(a, ta), ha));
  }
  // the bare pole under the cloth
  float y = dot(ps, axis) / length(tip - foot), x = ps.x * axis.y - ps.y * axis.x;
  float hw = mix(0.0075, 0.026, sat(y));
  float sx = clamp(x / hw, -1.0, 1.0);
  float round_ = 0.62 + 0.46 * sqrt(max(1.0 - (sx + 0.35) * (sx + 0.35) * 0.55, 0.0)) - 0.25 * smoothstep(0.1, 1.0, sx);
  float h = 1.0 / (1.0 - 0.72 * sat(y));
  col = mix(col, vec3(0.3, 0.25, 0.17) * (1.0 - 12.0 * dot(ps, sn)), rpFall(0.006, 0.022, length(ps)));   // the earth it stands in
  if (y < at) col = mix(col, vec3(0.93, 0.9, 0.84) * round_, rpIn(length(vec2(x, min(dot(ps, axis), 0.0))) - hw));
  // the two files of ribbons in plain weave, over one and under the next
  if (mod(nearA.z + farA.z, 2.0) > 0.5) {
    vec3 t = nearC; nearC = farC; farC = t; t = nearA; nearA = farA; farA = t;
  }
  col *= 1.0 - 0.18 * rpFall(1.0, 1.7, min(nearA.y, farA.y));
  col = col * (1.0 - farA.x) + farC * (1.0 - 0.4 * rpFall(1.0, 1.7, nearA.y));
  col = col * (1.0 - nearA.x) + nearC;
  // the plaited part stands over them, nearest the eye
  if (y > at - 0.06 && y < 1.02) {
    float aP = rpIn(abs(x) - hw * 1.06) * smoothstep(at - 0.01, at + 0.02, y);
    col = mix(col, rpPlaitCloth(asin(sx), h * 2.3, 0.1) * round_ * 1.1, aP);
  }
  // the garland at the tip and the gilded knob
  vec2 g = (p - tip) / 1.2;
  float r = length(g);
  if (r < 0.13) {
    float an = r > 1e-5 ? atan(g.y, g.x) : 0.0;
    float lobe = abs(sin(an * 23.0 + 5.0 * sin(r * 190.0)));
    col *= 1.0 - 0.45 * rpFall(-0.004, 0.012, abs(length(g - sn * 0.012) - 0.066) - 0.018);
    float side = sat(0.5 - 0.5 * dot(g / max(r, 1e-4), sn) * sign(r - 0.066));
    vec3 green = mix(vec3(0.07, 0.17, 0.08), vec3(0.33, 0.47, 0.17), 0.8 * lobe * side);
    col = mix(col, green, rpIn(abs(r - 0.066) - 0.0165 - 0.0045 * lobe));
    // flowers round it
    for (int j = 0; j < 2; j++) {
      float nF = j == 0 ? 11.0 : 8.0, sl_ = an / TAU * nF + 0.37 * float(j);
      float idf = mod(floor(sl_), nF), hf = hash11(idf + 3.0 + 20.0 * float(j));
      float rr = 0.066 + (j == 0 ? 0.006 : -0.006) + 0.005 * (hf - 0.5);
      vec2 fl = vec2((fract(sl_) - 0.5) * TAU / nF * r, r - rr);
      float fa = length(fl) > 1e-5 ? atan(fl.y, fl.x) : 0.0;
      float fr = length(fl), size = (0.0095 + 0.004 * hf) * (0.85 + 0.15 * cos(fa * 5.0 + idf));
      vec3 fc = j == 0 ? mix(rpDye(int(idf) * 5 + 3), vec3(1.0), 0.15) : vec3(0.96, 0.93, 0.88);
      fc *= 0.72 + 0.4 * smoothstep(0.0, size, fr) - 0.25 * dot(fl / 0.014, sn);
      fc = mix(fc, vec3(0.93, 0.73, 0.22), rpFall(0.0018, 0.0032, fr));
      col = mix(col * (1.0 - 0.3 * rpFall(0.0, 0.004, fr - size)), fc, rpIn(fr - size));
    }
    float kd = dot(g / 0.029, sn);
    vec3 gilt = mix(vec3(0.97, 0.8, 0.36), vec3(0.45, 0.25, 0.08), sat(0.45 + 0.75 * kd)) + vec3(0.5, 0.42, 0.25) * exp(-dot(g + sn * 0.01, g + sn * 0.01) * 11000.0);
    col = mix(col, gilt * (0.95 + 0.15 * uMic), rpIn(r - 0.029));
  }
  // petals on a cue, out from the garland
  if (uCue > 0.004) {
    float reach = 0.06 + 0.34 * (1.0 - uCue);
    float an = r > 1e-5 ? atan(g.y, g.x) : 0.0, sl_ = an / TAU * 26.0, idf = mod(floor(sl_), 26.0), hf = hash11(idf + 9.0);
    vec2 pt = vec2((fract(sl_) - 0.5) * TAU / 26.0 * r, (r - reach * (0.45 + 0.75 * hf)) * 1.6);
    col = mix(col, mix(vec3(0.98, 0.93, 0.9), vec3(0.9, 0.42, 0.46), hf), sat(uCue * 2.0) * rpFall(-rpPx, rpPx * 1.5, length(pt) - 0.011));
  }
  col *= sunTint * (0.93 + 0.14 * uLevel * uEnergy);
  return col;
}
// ---- b: up the pole ----
vec3 rpSky(vec2 p, vec2 sunAt) {
  float cover = 0.5 - 0.4 * sat(-uOwn[5]) + 0.28 * sat(uOwn[5]);
  vec2 q = p * vec2(1.5, 1.9) + vec2(mod(uTime * 0.007, 64.0), 3.0);
  float n2 = noise(q * 2.1 + 9.0), n = 0.52 * noise(q + 0.3 * n2) + 0.28 * n2 + 0.2 * noise(rot(0.6) * q * 4.6);
  float cl = smoothstep(cover - 0.06, cover + 0.17, n);
  float ds = length(p - sunAt), up = sat(0.5 + 0.8 * p.y);
  vec3 blue = mix(vec3(0.66, 0.81, 0.9), vec3(0.28, 0.52, 0.76), up);
  blue = mix(mix(blue, mix(vec3(0.98, 0.72, 0.42), vec3(0.55, 0.6, 0.68), up), rpGold), mix(vec3(0.22, 0.25, 0.42), vec3(0.06, 0.09, 0.2), up), rpDusk);
  vec3 cloud = mix(mix(vec3(0.97, 0.96, 0.93), vec3(1.0, 0.86, 0.68), rpGold), vec3(0.34, 0.36, 0.5), rpDusk);
  vec3 belly = mix(mix(vec3(0.7, 0.74, 0.8), vec3(0.7, 0.5, 0.48), rpGold), vec3(0.14, 0.15, 0.26), rpDusk);
  vec3 c = mix(blue, mix(cloud, belly, sat((n - cover) * 2.1 + 0.35 * n2 - 0.15)), cl);
  vec3 sunC = mix(mix(vec3(1.0, 0.95, 0.82), vec3(1.0, 0.75, 0.4), rpGold), vec3(0.75, 0.82, 1.0), rpDusk);
  return c + sunC * (0.32 * exp(-ds * 5.0) + 0.5 * rpFall(0.03, 0.06, ds)) * (1.0 - 0.4 * rpDusk);
}
// A ribbon from below: m is the part of its way, the place across, how much of it, its number and a hit's pass.
vec3 rpCloth(vec4 m, float glow, out vec3 own) {
  int i = int(m.w);
  float fi = float(i), pass = fract(m.w) / 0.9, e = abs(m.y);
  vec3 dye = rpStain(rpDye(i), sat(m.x / 0.95), i);
  own = dye * mix(dye, vec3(1.0), 0.75);
  // the fall of the folds along the cloth, and the sun through it
  float fold = 0.5 + 0.5 * sin(m.y * (3.1 + 1.4 * fract(fi * 0.37)) + 0.8 * sin(m.x * 4.0 + fi - uTime * 0.25) + fi * 1.7);
  vec3 sunC = mix(mix(vec3(1.0, 0.95, 0.84), vec3(1.05, 0.8, 0.5), rpGold), vec3(0.42, 0.5, 0.78), rpDusk);
  vec3 cl = own * (0.5 + 0.2 * fold) * mix(vec3(0.95, 0.98, 1.05), vec3(0.4, 0.46, 0.66), rpDusk);
  cl += own * sunC * (0.34 + glow) * (0.55 + 0.45 * fold) * (0.75 + 0.45 * uPad + 0.4 * uBands[i] * uEnergy + 1.2 * pass);
  cl *= 1.0 - 0.28 * smoothstep(0.91, 0.94, e) * (0.5 + 0.5 * rpFall(0.97, 1.0, e));
  if ((i & 3) == 0) cl += 0.3 * smoothstep(0.64, 0.68, e) * rpFall(0.76, 0.8, e);
  return cl - 0.5 * max(cl - 0.9, 0.0);
}
vec3 rpBelow(vec2 p) {
  float zoom = exp2(-0.6 * uOwn[4]);
  p *= zoom;
  rpPx = zoom * 1.1 / uRes.y;
  vec2 sunAt = vec2(0.33, 0.2);
  // the pole leans a little
  vec2 axis = normalize(vec2(-0.12 + (0.01 + 0.03 * uDrone) * sin(uTime * 0.15), 1.0));
  float endY = 0.22 - 0.16 * rpPlait;
  vec2 base = vec2(-0.1, 0.0), end = base + axis * endY, q = p - end;
  float glow = exp(-dot(p - sunAt, p - sunAt) * 3.0);
  // the pole
  vec2 pa = p - base;
  float y = dot(pa, axis), x = pa.x * axis.y - pa.y * axis.x;
  float hw = max(0.072 - 0.052 * y, 0.01);
  float sx = clamp(x / hw, -1.0, 1.0), a = 0.0, round_ = 1.0, h = 0.0, onPole = 0.0;
  vec3 bare = vec3(0.0), night = mix(vec3(1.0), vec3(0.5, 0.56, 0.8), rpDusk);
  if (abs(x) < hw * 1.12) {
    a = asin(sx);
    round_ = 0.5 + 0.55 * exp(-1.56 * (sx - 0.45) * (sx - 0.45)) + 0.16 * smoothstep(0.7, 1.0, -sx);
    h = 5.2 * log2(1.0 / max(1.0 - 0.62 * y, 0.1)) + 4.0 * y;
    onPole = rpIn(abs(x) - hw);
    bare = mix(vec3(0.95, 0.93, 0.88), vec3(0.74, 0.17, 0.15), smoothstep(0.33, 0.345, abs(fract(h * 0.42 - a / TAU) - 0.5)));
    bare *= round_ * (1.0 - 0.4 * rpFall(0.0, 0.16, endY - y)) * night;
  }
  float wide = exp2(uOwn[1]) * (0.82 + 0.3 * uLow + 0.12 * uSpace);
  float trail = 0.15 * (1.0 - sat(-uOwn[2])) + 0.3 * sat(uOwn[2]);
  float slow = 0.6 * sin(uTime * 0.19);
  vec2 th = vec2(cos(rpTurn * 0.4), sin(rpTurn * 0.4));
  // laid from the front to the back, as far as anything still shows through
  vec3 col = vec3(0.0), left = vec3(1.0);
  for (int fam = 0; fam < 2; fam++) {
    // the far file passes behind the pole, the near one in front of it
    if (fam == 1 && y < endY) { col += left * bare * onPole; left *= 1.0 - onPole; }
    float dir = fam == 0 ? 1.0 : -1.0;
    vec2 o = fam == 0 ? th : rot(0.3927) * vec2(th.x, -th.y);
    vec4 first = vec4(-1.0), second = first;               // the two ribbons of the file that lie in front here
    for (int k = 0; k < 8; k++) {
      int i = fam * 8 + k;
      float fi = float(i);
      vec2 u = o;
      o = 0.70710678 * vec2(o.x - o.y, o.x + o.y);
      u += vec2(-u.y, u.x) * (0.22 * (fract(fi * 0.618) - 0.5) + (i == 5 ? 0.2 * uPhrase : 0.0)) - 0.25 * axis;
      u *= inversesqrt(dot(u, u));
      float t = dot(q, u), yy = u.x * q.y - u.y * q.x;
      if (t < 0.0) continue;
      float ty = min(t, 1.2), y0 = dir * trail * ty * (1.6 - 1.15 * ty);
      float b = uBands[i];
      y0 += (0.018 + 0.03 * uLevel) * sin(t * 3.2 - uTime * 0.35 + fi * 1.9) * ty;
      float slope = dir * trail * (1.6 - 2.3 * ty);
      float d = (yy - y0) / (1.0 + 0.45 * slope * slope);
      float roll = cos(t * 2.1 + fi * 2.3 + slow);
      float pass = rpPass(t / 0.9, u);
      float half_ = wide * (0.014 + 0.105 * t) * (0.62 + 0.38 * roll * roll) * (0.8 + (0.35 + 0.5 * uEnergy) * b + 0.25 * pass);
      half_ += (0.0035 * uTexture) * (0.2 + t) * sin(t * 34.0 - uTime * 2.0 + fi * 2.0);
      half_ = max(half_, 0.002);
      float s = clamp(d / half_, -1.0, 1.0), c = rpIn(abs(d) - half_);
      if (c <= 0.0) continue;
      vec4 here = vec4(t, s, c, fi + 0.9 * sat(pass));
      if (first.w < 0.0) first = here; else if (second.w < 0.0) second = here;
    }
    for (int n = 0; n < 2; n++) {
      vec4 m = n == 0 ? first : second;
      if (m.w < 0.0) break;
      vec3 own;
      col += left * rpCloth(m, glow, own) * 0.78 * m.z;
      left *= 1.0 - m.z + m.z * 0.22 * mix(vec3(0.25), own, 0.8);             // what is behind shows through a little, dyed
    }
  }
  col += left * rpSky(p, sunAt);
  // the plait, over all, its end cut in teeth where the ribbons leave it
  col *= 1.0 - 0.35 * rpFall(0.0, 0.035, abs(x) - hw) * smoothstep(-0.02, 0.05, y - endY);
  if (abs(x) < hw * 1.12 && y > endY - 0.05) {
    float tooth = endY + 0.03 * (abs(fract(a * 8.0 / TAU + 0.5) - 0.5) * 2.0 - 0.5);
    float aP = rpIn(abs(x) - hw * 1.09) * smoothstep(-0.0025, 0.0025, y - tooth);
    vec3 braid = rpPlaitCloth(asin(clamp(x / (hw * 1.09), -1.0, 1.0)), h, rpPx * 14.0 / (1.1 - abs(sx))) * round_ * 1.15;
    col = mix(col, braid * night, aP);
  }
  return col * (0.96 + 0.06 * uTone);
}
vec3 render(vec2 p) {
  rpDusk = sat(-uOwn[0]); rpGold = sat(uOwn[0]);
  rpPlait = 0.5 - 0.5 * cos(TAU * uLoop);
  rpTurn = mod(uTravel * 0.045, 5.0 * TAU);
  if (uVar < 0.5) return rpAbove(p);
  return rpBelow(p);
}
