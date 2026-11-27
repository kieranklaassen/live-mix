// name: Torn wall
// a: Many sheets
// b: Whitewashed
// what: An old street wall in hard noon sun, pasted with years of plain coloured sheets and torn: ochre, oxblood, sea green, plum, cream and black, a white paper lip on every rip, a few flaps hanging over their own shadows; or the whole wall limewashed, faint prints showing through, torn open in three deep bright places.
// follows: Each kind of sound is one layer of paper: the louder it is, the wider its rips open, and silence narrows them; where the piece sounds, they widen too. A hit sends a torn scrap flying and pulls the red rips, a cue peels back a corner and lets it fall. Lows and the voice lift the flaps, highs fray the lips, the bands raise wrinkles, keys swell the dots.
// own: 0 1 many small rips, -1 close up on a few; 1 1 one great round hole torn through, ring within ring, -1 torn into ridges one behind another like hills; 2 the edges: 1 scorched, -1 cut clean; 3 the paper: 1 in the sounds' colours, -1 all white; 4 1 pasted in many small sheets, -1 in one great plain sheet; 5 1 thick as board, with long shadows, -1 lit from behind; 6 1 crumpled, -1 grown over with lichen; 7 the light: 1 through leaves, -1 one lamp at night
const vec3 twCream = vec3(0.90, 0.85, 0.73), twBlack = vec3(0.075, 0.07, 0.075), twOchre = vec3(0.83, 0.57, 0.15);
const vec3 twOx = vec3(0.52, 0.09, 0.075), twSea = vec3(0.14, 0.43, 0.40), twCore = vec3(0.955, 0.93, 0.87);
float twPx, twG, twTear, twOpen, twSide, twReach, twHard, twFibre;
vec3 twWeather;
vec2 twSun, twP, twStep, twSlow;
float twThick, twBack, twBurn, twClean;
// Noise made of flat facets: its level lines are straight and turn at corners, as paper tears.
float twTri(vec2 p) {
  p.x += p.y * 0.37;
  vec2 i = floor(p), f = p - i;
  float a = hash21(i), c = hash21(i + 1.0);
  if (f.x > f.y) { float b = hash21(i + vec2(1, 0)); return a + (b - a) * f.x + (c - b) * f.y; }
  float b = hash21(i + vec2(0, 1)); return a + (b - a) * f.y + (c - b) * f.x;
}
// One rip, taken out of every sheet above the one it lays bare, each sheet torn a little wider than the next below.
// x, y, c: its four straight sides (outward directions, distances). at: its middle and a seed. k: the layer laid bare, 1 to 5.
// D and E gather the distance from each sheet's edge, here and a step toward the sun.
vec4 twD = vec4(0.2), twE = vec4(0.2), twH = vec4(0.2); float twD4 = 0.2, twE4 = 0.2;
void twRip(vec4 x, vec4 y, vec4 c, vec3 at, float k, float loud) {
  float open = twOpen + (k > 4.5 ? 0.075 : 0.055) * (1.0 - 0.28 * uVar) * twG * loud + at.x * twSide + mix(twSlow.x, twSlow.y, at.z);
  vec4 a = x * twP.x + y * twP.y - c;
  float d = max(max(a.x, a.y), max(a.z, a.w)) - open;
  if (d > 0.12) return;
  a += x * twStep.x + y * twStep.y;
  float e = max(max(a.x, a.y), max(a.z, a.w)) - open;
  vec2 o = twP - at.xy;
  float tilt = (fract(at.z * 7.0) - 0.5) * 0.22 * o.y + (fract(at.z * 13.0) - 0.5) * 0.36 * o.x;
  vec4 f = vec4(0.0, 1.0, 2.0, 3.0);
  f = max(f * (0.003 + 0.018 * fract(at.z * 3.7)) + vec4(0.0, 1.0, -0.7, 1.4) * tilt, 0.0) + 9.0 * step(vec4(k), f + 0.5);
  twD = min(twD, d + f); twE = min(twE, e + f);
  if (k > 4.5) { float g = max(0.06 - 0.12 * at.z - tilt, 0.01); twD4 = min(twD4, d + g); twE4 = min(twE4, e + g); }
}
// The colour of a layer's sheets: 0 the newest, 1 to 5 the kinds.
vec3 twSheet(int i, vec2 p) {
  float fi = float(i);
  vec2 q = p + (fract(fi * 0.37 + 0.3) * 0.06 - 0.03) * vec2(-p.y, p.x) + vec2(0.31, 0.17) * fi + vec2(0.06, 0.1);
  float W = 0.58 - 0.04 * fi, H = 0.84 - 0.06 * fi, few = exp2((uOwn[4] > 0.0 ? -1.7 : -1.2) * uOwn[4]);
  W *= few; H *= few;
  float cx = floor(q.x / W), y = q.y / H + hash21(vec2(cx, fi * 3.1 + 2.0)), ry = floor(y);
  vec2 f = vec2(q.x / W - cx, y - ry);
  float h = hash21(vec2(cx + fi * 11.3, ry - fi * 5.7)), g = fract(h * 17.31);
  vec3 a, b;
  if (i == 0) { a = h < 0.48 ? twCream : h < 0.6 ? vec3(0.115, 0.11, 0.12) : h < 0.8 ? vec3(0.87, 0.71, 0.42) : vec3(0.78, 0.82, 0.76); b = h < 0.4 ? mix(twOx, twCream, 0.2) : h < 0.6 && h > 0.48 ? twCream : vec3(0.16, 0.15, 0.15); }
  else if (i == 1) { a = mix(twOchre, uKind[2], 0.25); b = h < 0.5 ? twBlack : twCream; }
  else if (i == 2) { a = vec3(0.92, 0.83, 0.71); b = uKind[3] * vec3(0.50, 0.55, 0.58); if (h < 0.55) { vec3 t = a; a = b; b = t; } }
  else if (i == 3) { a = mix(twOx, uKind[4], 0.28); b = h < 0.5 ? vec3(0.92, 0.66, 0.50) : twBlack; }
  else if (i == 4) { a = mix(twBlack, uKind[1] * 0.35, 0.4); b = mix(uKind[1] * 0.92, vec3(0.72, 0.36, 0.38), 0.45); if (h > 0.5) { vec3 t = a; a = b; b = t; } }
  else { a = mix(twSea, uKind[0], 0.3); b = h < 0.5 ? twSea * 0.42 : twCream; }
  // what was printed: a great disc, a split field, broad stripes, or a screen of dots
  if (uOwn[3] > 0.0) {
    vec3 k = i == 0 ? uKind[1] : i == 1 ? uKind[2] : i == 2 ? uKind[3] : i == 3 ? uKind[4] : i == 4 ? mix(uKind[1], uKind[0], 0.5) : uKind[0];
    k *= 0.9 + 0.2 * h;
    a = mix(a, k, uOwn[3]); b = mix(b, h < 0.5 ? mix(k, vec3(1.0, 0.97, 0.9), 0.4) : k * 0.55, uOwn[3]);
  }
  if (uOwn[3] < 0.0) { vec3 k = twCore * (0.94 + 0.06 * h - 0.02 * fi); a = mix(a, k, -uOwn[3]); b = mix(b, k * 0.95, -uOwn[3]); }
  vec2 m = (f - 0.5) * vec2(W, H) / few;
  float e = twPx * 1.2 / few, ink = 0.0;
  if (g < 0.22) ink = smoothstep(-e, e, 0.21 - length(m - vec2(0.1, 0.06)));
  else if (g < 0.42) ink = smoothstep(-e, e, m.y * 0.9 + m.x * (h - 0.5) * 1.6 - 0.1);
  else if (g < 0.52) ink = smoothstep(-e, e, 0.034 - abs(fract(m.x * 6.5 + m.y * (h - 0.5) * 5.0) - 0.5) / 6.5);
  else if (g < 0.72) {
    vec2 k = fract(rot(0.5) * m * 34.0) - 0.5;
    float big = sat(0.45 + 1.1 * m.y / H + 0.5 * (h - 0.5)) * (0.60 + 0.12 * uKeys);
    ink = smoothstep(-e, e, (big - length(k)) / 34.0);
  }
  vec3 c = mix(a, b, ink * 0.9 * (1.0 + min(uOwn[4], 0.0)));
  // the joins of the sheets
  vec2 sd = min(f, 1.0 - f) * vec2(W, H);
  c *= 0.75 + 0.25 * smoothstep(0.0, 0.003, min(sd.x, sd.y));
  // sun and rain: paled in streaks, stained, rubbed through in specks
  c = mix(c, mix(twCore, c, 0.6), 0.4 * smoothstep(0.5, 0.95, twWeather.x));
  c = mix(c, twCore * 0.96, 0.32 * smoothstep(0.0, 0.16, twWeather.y * 0.75 + twWeather.z * 0.5 - 0.98));
  return c * (0.90 + 0.16 * twWeather.y);
}
// The limewash: brushed crosswise, thin enough here and there to show what is under it, flaked off in chips.
vec3 twLime(vec2 p, vec3 under) {
  float wa = noise(p * 3.0);
  vec2 o = p + 0.06 * wa, l = o + twSun * 0.004;
  mat2 A = mat2(7.0, 90.0, 2.0, 26.0);
  if (wa + 0.35 * noise(p * vec2(9.0, 30.0)) > 0.68) A = mat2(60.0, 2.0, -95.0, 7.0);
  float s0 = noise(A * o), s1 = noise(A * l), th = noise(p * vec2(5.0, 3.0) + 11.0);
  float thin = smoothstep(0.35, 0.85, th * 0.75 + s0 * 0.3);
  float chip = smoothstep(0.0, 0.015, twTri(p * vec2(34.0, 22.0)) * 0.5 + th - 1.17);
  vec3 c = mix(uOwn[3] > 0.0 ? mix(vec3(0.90, 0.905, 0.90), uKind[1], uOwn[3]) : vec3(0.90, 0.905, 0.90), max(under, 0.35 - 0.3 * max(uOwn[3], 0.0)), max(0.04 + 0.30 * thin * thin, 0.55 * chip));
  return c * (1.0 + 0.13 * (s0 - s1)) * (0.98 + 0.04 * wa);
}
vec3 twShade(float s) { return mix(mix(vec3(0.42, 0.43, 0.50), vec3(0.27, 0.28, 0.36), uTone), vec3(1.0), s); }
// A flap that still hangs: its paper, its shadow, and the hole it left. F: foot of the fold, half its width, length.
// G: deepest sheet gone with it, skew, seed. n: the way it hangs. The third one answers the cue.
vec3 twOver = vec3(0.0); float twOverA = 0.0, twLit = 1.0;
void twFlap(vec4 F, vec3 G, vec2 n) {
  if (F.w < 0.02) return;
  vec2 foot = F.xy, near = twP - foot + twSun * 0.4 * F.w;
  if (dot(near, near) > (G.z > 2.5 ? 0.02 + 0.5 * uCue : 2.0 * F.w * F.w)) return;
  float grow = 1.0, c4 = 4.0 * uCue * (1.0 - uCue), lift = 0.5 + 0.5 * sin(uTime * (0.23 + 0.05 * G.z) + G.z * 2.0);
  lift = (G.z < 1.5 ? 0.40 : 0.15) * lift + 0.35 * twG * uLow + 0.25 * uMic;
  if (G.z > 2.5) { grow = 1.0 + 2.3 * c4; foot += n * F.w * (grow - 1.0); lift += 0.4 * c4; }
  lift = min(lift, 1.1);
  vec2 o = twP - foot;
  o = vec2(dot(o, vec2(n.y, -n.x)), dot(o, n)) / grow;
  float rag = (twTri(o * 34.0 + G.z * 7.0) - 0.5) * 0.020 + twFibre * 0.004;
  float fore = 1.0 - 0.4 * lift * lift, v = o.y / (F.w * fore), bow = G.y * F.z, hv = -o.y / F.w;
  float d = max(max((abs(o.x - bow * v * v) - F.z * (1.0 - 0.75 * v)) * 0.85, o.y - F.w * fore * (0.92 - 0.25 * o.x / F.z)), -o.y) + rag * smoothstep(0.0, 0.15, v);
  float hole = max(max((abs(o.x - bow * hv * hv) - F.z * (1.0 - 0.75 * hv)) * 0.85, -o.y - F.w * (0.92 - 0.25 * o.x / F.z)), o.y) * grow + rag;
  twH = min(twH, hole + 9.0 * step(vec4(G.x + 0.5), vec4(0.0, 1.0, 2.0, 3.0)));
  // the shadow runs out as the flap stands off the wall
  vec2 Lq = vec2(dot(twSun, vec2(n.y, -n.x)), dot(twSun, n)) * F.w * (0.30 + 0.9 * lift) * (0.5 + 0.6 * uSpace);
  vec2 so = o + Lq * (0.06 + max(v / max(1.0 - Lq.y / (F.w * fore), 0.3), 0.0));
  float sv = so.y / (F.w * fore);
  float sd = max(max((abs(so.x - bow * sv * sv) - F.z * (1.0 - 0.75 * sv)) * 0.85, so.y - F.w * fore * 0.92), -so.y - 0.004) + rag * 0.5;
  twLit = min(twLit, smoothstep(-twHard - 0.002, twHard + 0.002, sd));
  float cov = smoothstep(-twPx, twPx, -d * grow);
  if (cov <= 0.0) return;
  // the back of the paper: grey with old paste, scraps of the sheet below still on it
  float sc = twTri(o * vec2(24.0, 15.0) + G.z * 3.0) + twFibre * 0.12, b = sat(v);
  vec3 back = mix(vec3(0.86, 0.82, 0.73), vec3(0.74, 0.69, 0.60), noise(o * vec2(130.0, 16.0)));
  vec3 scrap = G.z > 1.5 && G.z < 2.5 ? twOchre : twSea * 1.2;
  if (uOwn[3] != 0.0) scrap = mix(scrap, uOwn[3] < 0.0 ? back * 0.9 : G.z > 1.5 && G.z < 2.5 ? uKind[2] : uKind[3], abs(uOwn[3]));
  back = mix(back, scrap, 0.8 * smoothstep(0.70, 0.73, sc));
  if (uOwn[3] > 0.0) back *= mix(vec3(1.0), 0.35 + 0.65 * mix(uKind[1], uKind[2], 0.5), uOwn[3]);
  back *= 1.0 - 0.7 * twBack;
  back *= 0.80 + 0.22 * smoothstep(0.0, 0.2, b) * (1.0 - 0.8 * smoothstep(0.25, 0.75, b)) + 0.20 * smoothstep(0.7, 1.0, b) + 0.08 * dot(n, twSun);
  back = mix(back, twCore, smoothstep(-0.007, -0.003, d + twFibre * 0.006) * smoothstep(0.0, 0.1, v));
  twOver = mix(twOver, back, cov); twOverA = max(twOverA, cov);
}
// One sheet, over what is left to see. d and e: the rip's edge here and a step toward the sun; h: a hole under a flap.
vec3 twCol; float twLeft, twCurl; vec2 twFray;
void twLayer(int i, float d, float e, float h) {
  if (twLeft < 0.004) return;
  float fi = float(i), big = 0.0, mid = 0.0;
  if (d < 0.11) {
    // the straight-grained wander of the edge, and scraps left behind inside a rip
    big = twTri(twP * vec2(7.0, 3.4) + fi * 13.7) - 0.5;
    float off = big * (0.10 - 0.03 * uVar), isle = (big - 0.33) * 0.22 - 0.06 * uVar;
    if (max(max(d, e) + off, isle) < -0.03 - 0.05 * twThick) return;
    mid = twTri(mat2(21.0, 10.0, -14.0, 15.0) * twP - fi * 5.3) - 0.5;
    off += mid * 0.020 + twFray.x * (0.004 + 0.004 * uHigh);
    isle += mid * 0.02 + twFray.x * 0.004;
    if (twClean > 0.0) { off *= 1.0 - 0.96 * twClean; isle -= 0.3 * twClean; }
    if (uOwn[1] != 0.0) isle -= 0.3 * abs(uOwn[1]);
    d = max(d + off, isle); e = max(e + off, isle);
  }
  d = min(d, h);
  float here = smoothstep(-twPx, twPx, d);
  if (here > 0.002) {
    vec3 c = twSheet(i, twP);
    if (i == 0 && uVar > 0.5) c = twLime(twP, c);
    if (twBack > 0.0) {
      // the light behind it all comes through, the more the fewer sheets are over it
      vec3 thin = c * c * (0.16 + 0.05 * fi + 0.035 * fi * fi) + uKind[0] * c * 0.03 * fi;
      vec3 lamp = mix(uKind[0], uKind[3], smoothstep(-0.45, 0.4, twP.y + 0.12 * sin(twP.x * 2.0 + uTravel * 0.05)));
      lamp *= (0.82 + 0.2 * uDrone) * (1.12 - 0.35 * length(twP * vec2(0.8, 1.0))) * (0.9 + 0.2 * noise(twP * 2.4));
      vec2 low = twP - vec2(-0.22, -0.12);
      lamp += (1.0 - lamp) * uKind[3] * 0.5 * smoothstep(0.1, 0.09, length(low)) + 0.16 * uKind[3] * exp(-dot(low, low) * 7.0);
      c = mix(c, i == 5 ? lamp : thin, twBack);
    }
    if (d < 0.11) {
      float slope = clamp((e - d) / (twReach * twCurl), -1.0, 1.0);
      float lip = 0.002 + (0.018 + 0.008 * uHigh) * sat(0.55 - 0.6 * slope * (i == 0 || i == 2 ? 1.0 : -1.0)) * sat(0.35 + 1.6 * mid + big);
      float core = smoothstep(-0.0015, 0.0015, lip - d + twFray.y * 0.006);
      vec3 edge = twCore * (0.88 + 0.14 * sat(d / lip) + 0.14 * twFray.x);
      core *= 1.0 - twClean;
      if (twBack > 0.0) edge = mix(edge, edge * (0.18 + 0.75 * uKind[0]) * (0.75 + 0.3 * uLevel), twBack);
      if (twBurn > 0.0) {
        float away = max(d, 0.0) + 0.012 * mid + 0.006 * twFray.y;
        c *= mix(vec3(1.0), vec3(0.4, 0.24, 0.14), twBurn * exp(-max(away, 0.0) * 30.0));
        edge = mix(edge, vec3(0.035, 0.026, 0.022) * (1.0 + 0.8 * twFray.x), twBurn);
        core = mix(core, smoothstep(0.004, -0.004, away - lip * 1.5), twBurn);
      }
      c = mix(c, edge, core);
      if (twBurn > 0.0) c += twBurn * vec3(1.0, 0.36, 0.1) * exp(-max(d, 0.0) * 260.0) * (0.25 + 0.5 * uLevel) * sat(0.2 + 1.4 * noise(twP * 9.0 + vec2(uTime * 0.12, fi)) - 0.35);
      c *= 1.0 + 0.30 * slope * exp(-max(d, 0.0) * 55.0) * min(twCurl, 1.2);
    }
    twCol += twLeft * here * c * (twBack > 0.0 ? mix(twShade(twLit), vec3(1.0), twBack * 0.85) : twShade(twLit));
    twLeft *= 1.0 - here;
  }
  twLit = min(twLit, 1.0 - smoothstep(-twHard * (1.0 + 2.0 * twThick), twHard * (1.0 + 2.0 * twThick), e));
}
// The strip of whole wall that stays between the two rips on the right.
float twKeep(vec2 p) { return 0.043 - abs(p.y + 0.063 - 0.8 * max(p.x - 0.62, 0.0)); }
vec3 render(vec2 p) {
  twPx = 1.0 / uRes.y;
  twG = 0.5 + 1.1 * uEnergy;
  twSun = normalize(vec2(-0.55 + 0.07 * sin(uTime * 0.013), 0.9));
  twThick = max(uOwn[5], 0.0); twBack = max(-uOwn[5], 0.0); twBurn = max(uOwn[2], 0.0); twClean = max(-uOwn[2], 0.0);
  if (uOwn[1] < 0.0) twSun = normalize(vec2(twSun.x, mix(twSun.y, -0.75, -uOwn[1])));
  twReach = 0.009 + 0.012 * uSpace; twHard = mix(0.006, 0.0015, uTone);
  // where the piece sounds, the rips near its place there stand wider
  twOpen = 0.020 * twG * piece(clamp(vec2(p.x * 0.5 + 0.5, 0.5 - p.y * 0.9), 0.0, 1.0)).a - 0.010;
  twTear = 4.0 * uHits * (1.0 - uHits);
  twSide = 0.026 * sin(TAU * uLoop);
  twSlow = 0.011 * sin(vec2(0.0, 2.6) + uTravel * vec2(0.021, 0.017));
  twWeather = vec3(noise(p * vec2(34.0, 2.6)), noise(p * vec2(7.0, 4.0) + 4.0), noise(mat2(105.0, 81.0, -57.0, 149.0) * p));
  // paste wrinkles, higher where their band sounds
  mat2 wr = mat2(8.0, 1.1, -1.6, 2.6);
  float wn = noise(p * 3.1 + 30.0);
  vec2 wp = wr * p + 1.1 * wn;
  vec2 wf = 1.0 - abs(2.0 * vec2(noise(wp), noise(wp + wr * twSun * 0.007)) - 1.0);
  wf *= wf; wf *= wf; wf *= wf;
  float wrinkle = (wf.x - wf.y) * smoothstep(0.25, 0.7, wn) * (0.35 + 2.2 * twG * band(sat(p.x * 0.55 + 0.5)));
  // how far a torn edge stands off the wall, hence its shadow
  twCurl = twTri(p * vec2(5.0, 4.0) + 3.7);
  twCurl = 0.25 + 1.7 * twCurl * twCurl * (1.0 + 0.6 * twG * uLow);
  if (twThick > 0.0) { twCurl = mix(twCurl, 0.9 + 0.35 * twCurl, twThick); twReach *= 1.0 + 5.0 * twThick; }
  twP = p; twStep = twSun * twReach * twCurl;
  float many = uOwn[0] > 0.0 ? 1.0 + 1.3 * uOwn[0] : exp2(1.1 * uOwn[0]);
  if (uOwn[0] != 0.0) {
    twP = p * many + max(uOwn[0], 0.0) * 0.7 * (vec2(noise(p * 1.4 + 4.0), noise(p * 1.4 + 31.0)) - 0.5) + (uOwn[0] < 0.0 ? uOwn[0] * vec2(0.2, 0.0) : vec2(0.0));
    twP = vec2(abs(mod(twP.x - 1.0, 4.0) - 2.0) - 1.0, abs(mod(twP.y - 0.56, 2.24) - 1.12) - 0.56);
    twStep *= many;
  }
  twFibre = noise(p * vec2(140.0, 150.0)) - 0.5;
  twRip(mix(vec4(0.975, 0.756, -0.973, -0.933), vec4(0.949, 0.812, -0.946, -0.969), uVar), mix(vec4(0.221, -0.655, -0.230, 0.359), vec4(0.314, -0.584, -0.323, 0.248), uVar),
    mix(vec4(-0.376, 0.010, 0.696, 0.668), vec4(-0.121, 0.010, 0.350, 0.442), uVar), mix(vec3(-0.52, -0.06, 0.11), vec3(-0.27, 0.10, 0.11), uVar), 5.0, uDrone);
  twRip(mix(vec4(0.968, 0.957, -0.986, -0.905), vec4(0.948, 0.989, -0.997, -0.923), uVar), mix(vec4(0.251, -0.292, -0.164, 0.424), vec4(0.319, -0.146, -0.079, 0.385), uVar),
    mix(vec4(0.043, -0.128, 0.198, 0.448), vec4(-0.133, -0.189, 0.308, 0.325), uVar), mix(vec3(-0.17, 0.30, 0.53), vec3(-0.25, -0.12, 0.93), uVar), 3.0, twTear);
  twRip(mix(vec4(0.996, 0.756, -0.997, -0.851), vec4(0.858, 1.000, -0.896, -0.981), uVar), mix(vec4(0.092, -0.655, -0.074, 0.525), vec4(0.513, -0.021, -0.444, 0.196), uVar),
    mix(vec4(0.600, 0.487, -0.193, -0.078), vec4(-0.118, -0.059, 0.275, 0.292), uVar), mix(vec3(0.40, 0.12, 0.29), vec3(-0.17, -0.14, 0.53), uVar), 4.0, uPad);
  twRip(mix(vec4(0.827, 0.954, -0.922, -0.832), vec4(0.954, 0.601, -0.994, -0.772), uVar), mix(vec4(0.562, -0.300, -0.386, 0.555), vec4(-0.301, -0.799, 0.106, 0.635), uVar),
    mix(vec4(-0.125, 0.142, 0.376, 0.081), vec4(0.468, 0.492, -0.254, -0.386), uVar), mix(vec3(-0.10, -0.40, 0.71), vec3(0.35, -0.24, 0.21), uVar), 1.0, uTexture);
  twRip(mix(vec4(0.918, 1.000, -0.934, -0.974), vec4(0.994, 0.934, -0.995, -0.969), uVar), mix(vec4(0.397, -0.018, -0.357, 0.224), vec4(0.108, -0.357, -0.099, 0.247), uVar),
    mix(vec4(0.663, 0.865, -0.546, -0.561), vec4(-0.282, -0.326, 0.395, 0.465), uVar), mix(vec3(0.73, -0.24, 0.37), vec3(-0.36, 0.22, 0.29), uVar), 2.0, uPhrase);
  twRip(mix(vec4(0.998, 0.975, -1.000, -0.970), vec4(1.000, 0.914, -1.000, -0.834), uVar), mix(vec4(0.065, -0.224, 0.011, 0.244), vec4(0.022, -0.405, 0.030, 0.552), uVar),
    mix(vec4(0.209, 0.210, -0.080, -0.136), vec4(0.701, 0.550, -0.601, -0.289), uVar), mix(vec3(0.14, -0.20, 0.83), vec3(0.64, 0.26, 0.37), uVar), 2.0, uPhrase);
  twRip(mix(vec4(0.959, 0.983, -0.938, -0.974), vec4(0.996, 0.949, -0.993, -0.961), uVar), mix(vec4(0.282, -0.182, -0.346, 0.229), vec4(0.094, -0.316, -0.120, 0.278), uVar),
    mix(vec4(-0.609, -0.748, 0.797, 0.988), vec4(0.575, 0.445, -0.456, -0.385), uVar), mix(vec3(-0.83, 0.28, 0.47), vec3(0.50, 0.22, 0.61), uVar), 1.0, uTexture);
  twRip(mix(vec4(0.781, 1.000, -0.939, -0.906), vec4(0.986, 0.882, -1.000, -0.787), uVar), mix(vec4(0.625, -0.015, -0.345, 0.423), vec4(0.165, -0.472, 0.018, 0.617), uVar),
    mix(vec4(0.508, 0.153, -0.172, 0.283), vec4(0.694, 0.395, -0.478, -0.150), uVar), mix(vec3(0.10, 0.42, 0.93), vec3(0.55, 0.30, 0.71), uVar), 5.0, uDrone);
  twRip(mix(vec4(0.974, 0.897, -0.934, -0.992), vec4(0.945, 0.677, -0.970, -0.658), uVar), mix(vec4(0.226, -0.442, -0.356, 0.130), vec4(-0.326, -0.736, 0.243, 0.753), uVar),
    mix(vec4(1.152, 1.079, -0.846, -0.935), vec4(0.691, 0.679, -0.542, -0.581), uVar), mix(vec3(1.04, 0.16, 0.21), vec3(0.54, -0.36, 0.47), uVar), 5.0, uDrone);
  twRip(mix(vec4(0.997, 0.926, -0.994, -0.942), vec4(0.993, 0.698, -0.944, -0.675), uVar), mix(vec4(0.083, -0.378, -0.113, 0.336), vec4(-0.118, -0.716, 0.330, 0.738), uVar),
    mix(vec4(-0.969, -0.839, 1.242, 1.023), vec4(0.609, 0.558, -0.423, -0.466), uVar), mix(vec3(-1.08, -0.20, 0.61), vec3(0.44, -0.30, 0.83), uVar), 4.0, uPad);
  if (uOwn[0] != 0.0) {
    twP = p; twStep /= many;
    twD /= many; twE /= many; twD4 /= many; twE4 /= many;
    if (many > 1.0) {
      float far = 0.12 / many;
      vec4 s = 0.2 * smoothstep(far * 0.6, far * 0.98, twD);
      twD += s; twE += s;
      float s4 = 0.2 * smoothstep(far * 0.6, far * 0.98, twD4);
      twD4 += s4; twE4 += s4;
    }
  }
  if (uOwn[1] != 0.0) {
    // the sheets torn away in one order: a hole, each a ring within the last, or hills
    vec4 d = vec4(0.0), e = vec4(0.0); float d4 = 0.0, e4 = 0.0;
    for (int i = 0; i < 5; i++) {
      float fi = float(i), loud = i == 0 ? uTexture : i == 1 ? uPhrase : i == 2 ? twTear : i == 3 ? uPad : uDrone, a, b;
      loud = 0.032 * twG * loud + twOpen * 0.5 + 0.2 * mix(twSlow.x, twSlow.y, 0.2 * fi);
      vec2 q = twP, o = twP + twStep;
      if (uOwn[1] > 0.0) {
        vec2 c = vec2(0.06 + 0.02 * sin(fi * 2.4), -0.01 + 0.02 * cos(fi * 1.7));
        float r = (0.47 - 0.094 * fi + loud) / many;
        a = length((q - c) * vec2(0.86, 1.0)) - r - 0.1 / many * (noise(q * 3.4 * many + fi * 5.0) - 0.5);
        b = length((o - c) * vec2(0.86, 1.0)) - r - 0.1 / many * (noise(o * 3.4 * many + fi * 5.0) - 0.5);
      } else {
        float y = -0.37 + 0.185 * fi - 0.011 * fi * fi - loud, f = (1.5 + 0.2 * fi) * many;
        a = y + (0.17 - 0.008 * fi) * (noise(vec2(q.x * f + fi * 4.7 + 2.0, fi * 3.0)) - 0.5) * 1.6 - q.y;
        b = y + (0.17 - 0.008 * fi) * (noise(vec2(o.x * f + fi * 4.7 + 2.0, fi * 3.0)) - 0.5) * 1.6 - o.y;
      }
      if (i < 4) { d[i] = a; e[i] = b; } else { d4 = a; e4 = b; }
    }
    float t = abs(uOwn[1]);
    twD = mix(twD, d, t); twE = mix(twE, e, t); twD4 = mix(twD4, d4, t); twE4 = mix(twE4, e4, t);
  }
  vec4 keep = vec4(vec2(1.0), vec2(1.0 - 0.95 * abs(uOwn[1])));
  twFlap(keep * mix(vec4(-0.39, -0.12, 0.085, 0.22), vec4(-0.30, -0.22, 0.08, 0.20), uVar), mix(vec3(2.0, 0.5, 1.0), vec3(2.0, 0.5, 1.0), uVar), mix(vec2(-0.416, -0.909), vec2(-0.416, -0.909), uVar));
  twFlap(keep * mix(vec4(0.60, 0.22, 0.07, 0.17), vec4(0.60, 0.06, 0.05, 0.15), uVar), mix(vec3(2.0, -0.4, 2.0), vec3(1.0, -0.4, 2.0), uVar), mix(vec2(0.219, -0.976), vec2(0.071, -0.997), uVar));
  twFlap(mix(vec4(0.27, -0.24, 0.075, 0.075), vec4(0.462, 0.20, 0.065, 0.065), uVar), mix(vec3(2.0, 0.0, 3.0), vec3(2.0, 0.0, 3.0), uVar), mix(vec2(-0.589, 0.808), vec2(-0.955, 0.296), uVar));
  if (uVar > 0.5 && p.x > 0.22) {
    float k = twKeep(p) - 0.2 * abs(uOwn[1]), e = twKeep(p + twStep) - 0.2 * abs(uOwn[1]);
    twD = max(twD, k); twE = max(twE, e); twD4 = max(twD4, k); twE4 = max(twE4, e);
  }
  // from the newest sheet down
  twCol = vec3(0.0); twLeft = 1.0;
  twFray = vec2(0.0);
  if (min(twD.x, twH.x) < 0.11) twFray = vec2(noise(p * vec2(210.0, 150.0)), noise(p * vec2(90.0, 120.0) + 40.0)) - 0.5;
  twLayer(0, twD.x, twE.x, twH.x);
  twLayer(1, twD.y, twE.y, twH.y);
  twLayer(2, twD.z, twE.z, twH.z);
  twLayer(3, twD.w, twE.w, twH.w);
  twLayer(4, twD4, twE4, 0.2);
  twLayer(5, 0.2, 0.2, 0.2);
  if (uOwn[6] > 0.0) {
    vec2 q = p + 0.22 * (vec2(noise(p * 2.3), noise(p * 2.3 + 20.0)) - 0.5), s = twSun * 0.012;
    vec2 q1 = q * 2.9, q2 = rot(0.8) * q * 6.3 + 7.0, q3 = rot(0.8) * s * 6.3;
    float f = 0.75 * (abs(2.0 * noise(q1 + s * 2.9) - 1.0) - abs(2.0 * noise(q1) - 1.0)) + 0.5 * (abs(2.0 * noise(q2 + q3) - 1.0) - abs(2.0 * noise(q2) - 1.0)) + 0.35 * (twTri(q * 9.0) - twTri((q + s) * 9.0));
    twCol *= 1.0 + uOwn[6] * clamp(6.0 * f, -0.5, 0.35);
  }
  vec3 col = mix(twCol * (1.0 + 0.5 * wrinkle), twOver, twOverA);
  if (uOwn[6] < 0.0) {
    float grow = fbm(p * 2.6 + 3.0) + 0.13 * noise(rot(0.6) * p * 15.0) + 0.09 * noise(rot(0.25) * p * 34.0) + 0.06 * noise(rot(1.0) * p * 80.0), on = -uOwn[6] * 0.15 + 0.02 * uTexture, g2 = noise(p * 8.0 + 40.0);
    float there = smoothstep(0.0, 0.025, grow - 0.77 + on) * sat(-uOwn[6] * 4.0), rim = smoothstep(0.07, 0.0, grow - 0.77 + on);
    vec3 moss = mix(uKind[2], uKind[3], smoothstep(0.35, 0.65, g2)) * (0.62 + 0.3 * noise(rot(0.4) * p * 100.0) + 0.35 * rim);
    col = mix(col, moss * (0.85 + 0.25 * smoothstep(0.0, 0.1, grow - 0.8)), there * 0.94);
    col *= 1.0 - 0.3 * -uOwn[6] * smoothstep(-0.05, 0.0, grow - 0.77 + on) * (1.0 - there);
  }
  // a hit: one scrap flies off and its shadow runs over the wall
  if (uHits > 0.003) {
    float s = 1.0 - uHits, on = smoothstep(0.0, 0.3, uHits);
    vec2 at = (uVar < 0.5 ? vec2(-0.15, 0.22) : vec2(-0.22, 0.16)) + vec2(mix(0.34, -0.36, uVar), 0.10) * s - vec2(0.0, 0.50) * s * s;
    mat2 tu = rot(0.3 + 2.4 * s);
    vec2 o = p - at;
    if (dot(o, o) < 0.12) {
      o = tu * o;
      vec2 os = tu * (p - at + twSun * (0.02 + 0.16 * s * (1.0 - 0.5 * s)));
      float fold = 1.0 - 0.45 * sin(s * 5.0) * sin(s * 5.0);
      o.x /= fold; os.x /= fold;
      float rg = (twTri(o * 27.0) - 0.5) * 0.034 + (twTri(o * 80.0) - 0.5) * 0.008 + twFibre * 0.003;
      float d = abs(o.x + 0.02) * 0.85 + abs(o.y) * 0.52 - 0.062 + rg, ds = abs(os.x + 0.02) * 0.85 + abs(os.y) * 0.52 - 0.062 + rg;
      col *= mix(vec3(1.0), twShade(0.0), on * smoothstep(-twHard - 0.002, twHard + 0.002, -ds));
      vec3 c = mix(mix(mix(twOx, uKind[4], 0.5), twCream, smoothstep(-twPx, twPx, o.x + o.y * 0.4 - 0.02)) * (0.92 + 1.2 * o.x + 0.08 * sin(s * 5.0)), twCore, smoothstep(-0.009, -0.005, d + twFray.y * 0.008 + rg * 0.25));
      col = mix(col, c, on * smoothstep(-twPx, twPx, -d));
    }
  }
  // sun caught by what is being torn: wide for a cue, close for a hit
  if (uHits + uCue > 0.002) {
    vec2 ho = p - (uVar < 0.5 ? vec2(-0.15, 0.22) : vec2(-0.22, 0.16)), co = p - (uVar < 0.5 ? vec2(0.22, -0.18) : vec2(0.36, 0.23));
    col += col * max(1.0 - col, 0.0) * (uHits * exp(-dot(ho, ho) * 40.0) + 1.1 * uCue * exp(-dot(co, co) * 14.0));
  }
  // noon: warm on the wall, and the cool shade of an eave across the top corner
  if (uOwn[7] > 0.0) {
    vec2 q = p * vec2(1.0, 1.15) + 0.02 * vec2(sin(uTime * 0.19 + p.y * 3.0), sin(uTime * 0.15 + p.x * 2.0));
    vec2 q2 = q + 0.015 * vec2(sin(uTime * 0.27), cos(uTime * 0.23));
    float leaf = 0.55 * noise(rot(0.6) * q2 * vec2(6.0, 14.0)) + 0.45 * noise(rot(-0.5) * q * vec2(16.0, 7.0) + 9.0) + 0.5 * (noise(q * 1.8 + 5.0) - 0.5);
    col *= mix(vec3(1.06, 1.03, 0.97), vec3(0.36, 0.41, 0.49), uOwn[7] * smoothstep(0.44, 0.56, leaf));
  }
  if (uOwn[7] < 0.0) {
    vec2 l = p - vec2(-0.3, 0.3);
    float pool = exp(-dot(l, l) * 3.0);
    col *= mix(vec3(1.0), vec3(0.1, 0.12, 0.2) + (0.95 + 0.15 * uLevel) * vec3(1.15, 0.86, 0.52) * pool, -uOwn[7]);
  }
  float eave = p.y - 0.47 - 0.30 * p.x - 0.02 * sin(uTime * 0.017);
  col *= mix(vec3(1.0), vec3(0.56, 0.60, 0.71), smoothstep(-0.012, 0.012, eave) * 0.9 * (1.0 - max(twBack, max(abs(uOwn[7]), abs(uOwn[1])))));
  col *= mix(vec3(1.06, 1.02, 0.95), vec3(1.04, 1.02, 0.985), uVar) * (0.93 + 0.07 * uLevel + 0.05 * (p.y - p.x * 0.5));
  return col * (0.98 + 0.04 * hash21(floor(p * 900.0)));
}
