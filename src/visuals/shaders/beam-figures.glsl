// name: Beam figures
// a: Screen
// b: Long trace
// what: The round glass of a measuring tube, its etched scale, and on it a thin green-white beam swept so fast to and fro that it draws folded ribbons of wire mesh, with an amber afterglow where they just were; or no tube at all: one long ribbon of fine lines hangs in black, looping and turning, bright where the beam is slow.
// follows: The pad and the phrase fold the figure, the drone and the lows widen it, texture and highs add threads, the piece tints them. On the long trace each kind has its own stretch, which opens and takes its colour, and each line is a band. A hit runs along the trace as a bright spot, a cue opens it wide; keys light the scale or the edges, a voice warms it.
// own: 0 the figure: 1 a rosette of petals (b: many small loops), -1 one great ring (b: a long wave, no loops); 1 how broad the ribbon is: 1 as cloth, -1 a single line; 2 the threads: 1 fine as silk, -1 few and coarse; 3 the ground: 1 pale paper, drawn in ink (a: a shadow under it), -1 a field in the colours of pad and drone; 4 1 no tube, the figure fills the picture (b: bent round into a ring), -1 many tubes (b: rows of traces); 5 1 no threads, a lit cloth, -1 only dots; 6 1 it lies flat and goes away from us, -1 it stands over still water and is mirrored; 7 1 it turns round, -1 a slow head draws it and a tail fades behind
float bmCross(vec2 a, vec2 b) { return a.x * b.y - a.y * b.x; }
float bmTurn(float t, float seconds) { return TAU * fract(t / seconds); }
vec2 bmArm(float a) { return vec2(cos(a), sin(a)); }
float bmPx, bmN = 132.0, bmDim = 1.0;
float bmUp(float x) { return max(x, 0.0); }
float bmDn(float x) { return max(-x, 0.0); }
float bmEx(float x) { return x == 0.0 ? 1.0 : exp2(x); }
float bmFall(float a, float b, float x) { return 1.0 - smoothstep(a, b, x); }
// Three swings: how much of each goes into the trace's middle (X, Y, Z) and half width (U, V).
vec3 bmK, bmXs, bmXc, bmYs, bmYc, bmZs, bmZc, bmUs, bmUc, bmVs, bmVc; vec2 bmTip;
// A piece of ribbon is a strip with straight ends: q is measured from its first end, E runs along it, bowed by B; W is its half width
// there, D its change, bowed by F. The two places from u0 to u0 + du where q may lie (-1: none); fold fades the edge where it turns over.
float bmOff(float u, vec2 q, vec2 E, vec2 B, vec2 W, vec2 D, vec2 F) {
  float bow = 4.0 * u * (1.0 - u);
  return bmCross(q - u * E - bow * B, W + u * D + bow * F);
}
vec2 bmRoots(float u0, float du, vec2 q, vec2 E, vec2 B, vec2 W, vec2 D, vec2 F, out float fold) {
  float c = bmOff(u0, q, E, B, W, D, F), m = bmOff(u0 + 0.5 * du, q, E, B, W, D, F), e = bmOff(u0 + du, q, E, B, W, D, F);
  float a = 2.0 * (c + e) - 4.0 * m, b = 4.0 * m - 3.0 * c - e, h = b * b - 4.0 * a * c;
  fold = 0.0;
  if (h < 0.0) return vec2(-1.0);
  fold = sat(h / (1.3 * bmPx * length(2.0 * du * b * D - 4.0 * a * (W + u0 * D)) + 1e-12));
  float k = -0.5 * (b + (b < 0.0 ? -sqrt(h) : sqrt(h)));
  vec2 r = vec2(abs(k) > 1e-12 ? c / k : -1.0, abs(a) > 1e-12 ? k / a : -1.0);
  return mix(vec2(-1.0), u0 + du * r, vec2(greaterThanEqual(r, vec2(0.0))) * vec2(lessThan(r, vec2(1.0))));
}
// At u: how the strip runs (ps) and lies (pv), where across it (v), and its cover of the pixel.
float bmHere(float u, float dt, vec2 q, vec2 E, vec2 B, vec2 W, vec2 D, vec2 F, out vec2 ps, out vec2 pv, out float v, out float lps, out float det, out float ev) {
  float bow = 4.0 * u * (1.0 - u), lean = 4.0 - 8.0 * u;
  pv = W + u * D + bow * F;
  v = dot(q - u * E - bow * B, pv) / max(dot(pv, pv), 1e-9);
  ps = E; lps = det = 1.0; ev = 0.0;
  if (abs(v) > 1.5) return 0.0;
  ps = (E + lean * B + v * (D + lean * F)) / dt;
  lps = length(ps); det = max(abs(bmCross(ps, pv)), 0.25 * bmPx * lps + 1e-5);
  ev = min(0.8 * bmPx * lps / det, 0.5);
  return bmFall(1.0 - ev, 1.0 + ev, abs(v));
}
float bmHalves(vec2 W, vec2 W1, float k) { return dot(W, W1) < k * max(dot(W, W), dot(W1, W1)) ? 0.5 : 1.0; }
// A thin line of light, g of them in a unit, one tone when too close. f: 0 on the line, 0.5 between two.
float bmLine(float f, float g, float w) {
  float gw = max(g * w, 1e-4), d = f / gw;
  d = max(1.0 - 0.11 * d * d, 0.0);
  return mix(d * d * d * 0.36 / w, g, sat(3.8 * gw - 0.6));
}

vec2 bmEye(vec2 p) {
  if (uOwn[6] > 0.0) {
    float k = uOwn[6], d = 1.0 / max(1.0 - 1.7 * k * (p.y - 0.05), 0.2);
    p = vec2(p.x, p.y * (1.0 + 0.5 * k)) * d; bmPx *= d;
  }
  if (uOwn[6] < 0.0) {
    float k = -uOwn[6], at = mix(-1.0, -0.2, k), d = at - p.y;
    if (d > 0.0) {
      p.y = at + d * (1.0 + 0.2 * sin(34.0 * d / (0.4 + d) - uTime * 0.7 + 3.0 * p.x));
      p.x += d * 0.035 * sin(90.0 * d / (0.5 + d) + uTime * 0.9);
      bmDim = 1.0 - 0.5 * smoothstep(0.0, 0.012, d) - 0.9 * d * k;
    }
    p.y -= 0.14 * k;
  }
  return p;
}
float bmTail(float t, float s) { float b = fract(uTime / s - t); return mix(1.0, 0.02 + 3.2 * exp(-5.0 * b) * smoothstep(0.0, 0.02, b), bmDn(uOwn[7])); }
vec3 bmGround(vec2 p) {
  float g = noise(p * 3.0 + 9.0), f = hash21(floor(p * 420.0));
  vec3 a = uKind[0] * uKind[0], b = uKind[1] * uKind[1], hi = normalize(0.35 + uKind[1]);
  return bmUp(uOwn[3]) * (1.15 + 0.5 * p.y - 0.4 * dot(p, p) + 0.25 * g + 0.1 * f) * mix(vec3(1.22, 1.17, 1.06), hi * 1.9, 0.25)
    + bmDn(uOwn[3]) * mix(a, b, smoothstep(-0.55, 0.5, p.y + 0.35 * (g - 0.5))) * (0.45 + 0.3 * g + 0.08 * f);
}
vec3 bmLay(vec3 was, vec3 ground, vec3 light, float deep) {
  float most = max(light.r, max(light.g, light.b));
  vec3 ink = ground * exp(-deep * most * (1.08 - light / (most + 1e-4)) - 0.25 * deep * most);
  return mix(was, uOwn[3] > 0.0 ? ink : ground * exp(-0.5 * most) + light, abs(uOwn[3]));
}
// How a cloth that runs along d, at v across it, takes the light.
float bmSheen(vec2 d, float v) { float k = dot(d, vec2(0.6, 0.8)) / (length(d) + 1e-5); k *= k; return (0.12 + 2.6 * k * k) * (1.0 + 0.7 * v); }

// ---- a: the tube
void bmFigure(float T) {
  float br = sin(bmTurn(T, 13.0)), wide = 4.0 * uCue * (1.0 - uCue);
  float f3 = 0.13 * uPad + 0.035 * uDrone, f2 = 0.13 * uPhrase + 0.06 * uDrone;
  bmK = vec3(1.0, 2.0, 3.0);
  vec3 ax = vec3(0.335 - 0.35 * f3, 0.0, f3), ay = vec3(0.235 + 0.02 * br - 0.25 * f2, f2, 0.03 * uPhrase + 0.05 * uTexture);
  float open = (1.0 + 0.03 * br + 0.05 * wide) / (1.0 + 0.5 * max(f3 + f2 - 0.12, 0.0));
  float w = open * (0.026 + 0.05 * uDrone + 0.02 * uLevel + 0.012 * uLow + 0.022 * wide);
  w *= bmEx(uOwn[1] * (uOwn[1] > 0.0 ? 1.3 : 2.7));
  vec2 x3 = bmArm(bmTurn(T, 97.0)), y1 = bmArm(1.05 + 0.3 * sin(bmTurn(T, 83.0)) + bmTurn(T * bmUp(uOwn[7]), 37.0)), y2 = bmArm(bmTurn(T, 71.0) + 0.6), y3 = bmArm(1.0 - bmTurn(T, 113.0));
  vec2 a1 = w * bmArm(2.1 + bmTurn(T, 127.0)), a2 = w * bmArm(1.3 - bmTurn(T, 89.0)), a3 = w * bmArm(0.4 + bmTurn(T, 149.0));
  ax *= open; ay *= open;
  bmXs = ax * vec3(1.0, 0.0, x3.x); bmXc = ax * vec3(0.0, 0.0, x3.y);
  bmYs = ay * vec3(y1.x, y2.x, y3.x); bmYc = ay * vec3(y1.y, y2.y, y3.y);
  bmUs = vec3(0.8 * a1.x, 0.0, 0.5 * a3.x); bmUc = vec3(0.8 * a1.y, 0.0, 0.5 * a3.y);
  bmVs = vec3(0.45 * a3.x, 0.85 * a2.x, 0.0); bmVc = vec3(0.45 * a3.y, 0.85 * a2.y, 0.0);
  bmTip = vec2(0.3, 0.7) * w;
  if (uOwn[0] != 0.0) {
    float k = abs(uOwn[0]), up = step(0.0, uOwn[0]), A = mix(0.31, 0.18, up) * open + 0.02 * br, B = up * (0.16 + 0.05 * uPad - 0.03 * uDrone) + 0.1 * f2;
    vec2 g = B * bmArm(bmTurn(T, 157.0));
    bmXs = mix(bmXs, vec3(A, 0.0, g.x), k); bmXc = mix(bmXc, vec3(0.0, 0.0, g.y), k);
    bmYc = mix(bmYc, vec3(A, 0.4 * f3, -g.x), k); bmYs = mix(bmYs, vec3(0.0, 0.3 * f2, g.y), k);
  }
}
vec2 bmAt(vec3 s, vec3 c) { return vec2(bmXs.x * s.x + bmXs.z * s.z + bmXc.z * c.z, dot(bmYs, s) + dot(bmYc, c)); }
vec2 bmOut(vec3 s, vec3 c) { return bmTip + vec2(dot(bmUs.xz, s.xz) + dot(bmUc.xz, c.xz), dot(bmVs.xy, s.xy) + dot(bmVc.xy, c.xy)); }
vec2 bmKnock(vec2 P, float t, float knock) {
  float d = 2.0 * sin(0.5 * (t - knock)), b = 1.0 / (1.0 + 30.0 * d * d);
  return P * (1.0 + 1.1 * uHits * (1.0 - uHits) * b * b);
}
vec4 bmMesh(vec2 p, const int n, out float light) {
  float dt = TAU / float(n);
  vec3 c = vec3(1.0), s = vec3(0.0), dc = cos(bmK * dt), ds = sin(bmK * dt), cn;
  float crawl = fract(uTime * 0.09), w = mix(1.35, 0.8, uTone) * max(0.001, 0.5 * bmPx) * (1.0 + 0.5 * bmDn(uOwn[2]) + 0.7 * bmDn(uOwn[5]));
  float fine = 0.7 * smoothstep(0.1, 0.7, uHigh + 0.5 * uTexture), dense = 0.2 + 0.8 * smoothstep(0.0, 0.6, uMid);
  float run = uLoop * TAU, knock = 0.5 + (1.0 - uHits) * 2.6, halo = 0.0, spot = 0.0;
  vec3 at = vec3(0.0);
  vec2 W = bmOut(s, c), Wb = bmOut(-ds, dc), W1 = bmOut(ds, dc), W2, P = bmAt(s, c), Pb = bmAt(-ds, dc), P1 = bmAt(ds, dc);
  bool hit = uHits > 0.002;
  if (hit) {
    P = bmKnock(P, 0.0, knock); Pb = bmKnock(Pb, -dt, knock); P1 = bmKnock(P1, dt, knock);
    vec2 far = p - bmKnock(bmAt(sin(bmK * knock), cos(bmK * knock)), knock, knock);
    spot = uHits * uHits / (1.0 + 500.0 * dot(far, far));
  }
  c = dc; s = ds;
  light = 0.0;
  for (int i = 0; i < n; i++) {
    float t0 = float(i) * dt;
    cn = c * dc - s * ds; s = s * dc + c * ds; c = cn;
    vec2 P2 = bmAt(s, c); W2 = bmOut(s, c);
    if (hit) P2 = bmKnock(P2, t0 + 2.0 * dt, knock);
    vec2 q = p - P, E = P1 - P, D = W1 - W, B = (P + P1 - Pb - P2) / 16.0, F = (W + W1 - Wb - W2) / 16.0, mid = q - 0.5 * E;
    float d2 = dot(mid, mid);
    halo += 1.0 / (1.0 + d2 * (420.0 + 9000.0 * d2));
    if (all(lessThan(abs(mid), 0.5 * abs(E) + max(abs(W), abs(W1)) * 1.04 + abs(B) + 2.0 * bmPx))) {
      float fold, du = bmHalves(W, W1, 0.75); vec2 r;
      for (int j = 0; j < (du < 1.0 ? 4 : 2); j++) {
        if ((j & 1) == 0) r = bmRoots(du * float(j / 2), du, q, E, B, W, D, F, fold); else r = r.yx;
        float u = r.x;
        if (u < 0.0) continue;
        vec2 ps, pv; float v, lps, det, ev, cover = fold * bmHere(u, dt, q, E, B, W, D, F, ps, pv, v, lps, det, ev);
        if (cover <= 0.0) continue;
        float vc = clamp(v, -1.0, 1.0), ct = sqrt(max(1.0 - vc * vc, 0.0) + 0.4 * ev + 0.004), th = asin(vc), t = t0 + u * dt, sum = 0.0;
        for (float sg = -1.0; sg < 2.0; sg += 2.0) {
          float vel = length(ps + sg * bmN * ct * pv), g = min(vel / (det * ct * TAU), 0.45 / w);
          float f = abs(fract((bmN * t - sg * th) / TAU + 0.25 * sg - crawl) - 0.5);
          float ln = bmLine(f, g, w);
          if (fine > 0.01) ln += fine * bmLine(0.5 - f, g, w);
            if (uOwn[5] > 0.0) ln = mix(ln, 0.8 * vel / (det * ct * TAU) * bmSheen(ps, vc), uOwn[5]);
            if (uOwn[5] < 0.0) ln *= mix(1.0, 2.2 * w * bmLine(abs(fract(th * 3.2) - 0.5), 3.2 / (ct * length(pv) + 1e-4), w), -uOwn[5]);
            sum += ln * (sg < 0.0 ? 1.0 : dense) / vel;
        }
          sum *= cover * bmTail(t / TAU, 16.0);
          float head = 0.5 + 0.5 * cos(t - run), kn = 2.0 * sin(0.5 * (t - knock)); head *= head; head *= head; head *= head;
        light += sum * (0.8 + 0.8 * head * uLevel + 5.0 * uHits / (1.0 + 25.0 * kn * kn));
        at += sum * vec3(t / TAU, 0.5 + 0.4 * vc, 1.0);
      }
    }
    Pb = P; P = P1; P1 = P2; Wb = W; W = W1; W1 = W2;
  }
  return vec4(at.z > 0.0 ? piece(at.xy / at.z).rgb : vec3(0.0), halo / float(n) + 0.9 * spot);
}
float bmGhost(vec2 p, const int n) {
  float dt = TAU / float(n), sum = 0.0;
  vec3 c = vec3(1.0), s = vec3(0.0), dc = cos(bmK * dt), ds = sin(bmK * dt), cn;
  vec2 P = bmAt(s, c), W = bmOut(s, c) * 1.1;
  for (int i = 0; i < n; i++) {
    cn = c * dc - s * ds; s = s * dc + c * ds; c = cn;
    vec2 P1 = bmAt(s, c), W1 = bmOut(s, c) * 1.1, q = p - P, E = P1 - P, D = W1 - W, mid = q - 0.5 * E;
    if (all(lessThan(abs(mid), 0.5 * abs(E) + max(abs(W), abs(W1))))) {
      float fold; vec2 r = bmRoots(0.0, 1.0, q, E, vec2(0.0), W, D, vec2(0.0), fold);
      for (int j = 0; j < 2; j++) {
        if (r[j] < 0.0) continue;
        vec2 ps, pv; float v, lps, det, ev;
        bmHere(r[j], dt, q, E, vec2(0.0), W, D, vec2(0.0), ps, pv, v, lps, det, ev);
        sum += fold * max(1.0 - v * v, 0.0) / (det + 0.008);
      }
    }
    P = P1; W = W1;
  }
  return sum;
}
void bmKnob(vec2 p, vec2 m, float r, float a, vec3 glow, inout vec3 col) {
  vec2 q = p - m;
  float d = length(q), px = bmPx * 1.2;
  if (d > 2.4 * r) return;
  col *= 1.0 - 0.75 * bmFall(r * 0.9, r * 1.9, length(q - vec2(0.35, -0.25) * r));
  if (d > r + px) return;
  vec2 n = q / max(d, 1e-4), to = normalize(-m);
  float lit = sat(dot(n, to)), up = sat(dot(n, vec2(-0.5, 0.86)));
  float ring = smoothstep(0.80, 0.84, d / r), flute = 0.6 + 0.4 * cos(atan(q.y, q.x + 1e-5) * 36.0);
  vec3 k = 0.0035 + ring * flute * (glow * lit * 0.9 + vec3(0.014, 0.016, 0.02) * up);
  float lip = bmFall(0.0, 0.03, abs(d / r - 0.79));
  k += lip * (glow * lit * 2.2 + vec3(0.02, 0.023, 0.028) * up);
  k += (1.0 - ring) * (glow * 0.10 * (1.0 + dot(q, to) / r) + vec3(0.003, 0.0035, 0.004));
  vec2 b = rot(a) * q;
  float mark = bmFall(0.045 * r - px, 0.045 * r + px, abs(b.x)) * smoothstep(0.3 * r - px, 0.3 * r + px, b.y) * bmFall(0.95 * r - px, 0.95 * r + px, b.y);
  k += mark * (vec3(0.05, 0.048, 0.042) + glow * 1.5);
  col = mix(col, k, bmFall(r - px, r + px, d));
}
vec3 bmPanel(vec2 p, float r, float rim, vec3 spill) {
  float px = bmPx, up = sat(dot(p, vec2(-0.55, 0.835)) * 0.6 / r + 0.4);
  up *= up * up;
  vec3 steel = vec3(0.05, 0.058, 0.07), c = vec3(0.0);
  if (rim < 0.044 + px) {
    float lip = 1.0 / (1.0 + pow(abs(rim - 0.036) * 160.0, 3.0)), inner = 1.0 / (1.0 + pow(abs(rim - 0.004) * 320.0, 3.0));
    c = spill * (1.1 * bmFall(0.0, 0.035, rim) + 1.5 * inner) + steel * (up * lip + 0.08 * up + 0.032);
  }
  if (rim > 0.044 - px) {
    float crk = noise(p * 190.0) + 0.5 * noise(p * 420.0) - 0.75;
    vec3 paint = vec3(0.0055, 0.0062, 0.0072) * (1.0 + 0.8 * (p.y - 0.4 * p.x)) + spill * 0.10 / (0.15 + rim * rim * 14.0);
    paint *= (1.0 + 1.1 * crk) * (1.0 - 0.6 * bmFall(0.04, 0.07, rim));
    if (p.x > 0.6) {
      bmKnob(p, vec2(0.80, -0.20), 0.105, 1.9 - 3.8 * uTone, spill * 1.2, paint);
      bmKnob(p, vec2(0.80, 0.20), 0.105, 1.9 - 3.8 * uSpace, spill * 1.2, paint);
    }
    c = mix(c, paint, smoothstep(0.044 - px, 0.044 + px, rim));
  }
  return c;
}
vec3 bmScreen(vec2 p) {
  float wide = uRes.x / uRes.y, fit = mix(0.66, 1.0, smoothstep(0.55, 1.2, wide));
  vec2 mid = vec2(-0.15 * smoothstep(0.8, 1.5, wide), 0.0);
  float bare = bmUp(uOwn[4]), many = bmDn(uOwn[4]), pale = bmUp(uOwn[3]), T = uTime, own = sat(4.0 * (abs(uOwn[0]) + abs(uOwn[1]) + abs(uOwn[2]) + abs(uOwn[3]) + abs(uOwn[4])));
  mid *= 1.0 - max(bare, many);
  p = (p - mid) / fit; bmPx = 1.0 / (uRes.y * fit);
  p = bmEye(p);
  vec2 id = vec2(0.0), here = p; vec3 kind = uKind[1];
  if (many > 0.0) {
    float zoom = 1.0 + 1.7 * many, D = mix(4.0, 1.12, many);
    p *= zoom; bmPx *= zoom;
    id.y = floor(p.y / (0.88 * D) + 0.5); p.y -= id.y * 0.88 * D;
    p.x += 0.5 * D * mod(id.y, 2.0);
    id.x = floor(p.x / D + 0.5); p.x -= id.x * D;
    T += dot(id, vec2(37.0, 53.0)); kind = kindColour(mod(id.x + 2.0 * id.y, 5.0));
  }
  float R = 0.47 + 2.5 * bare;
  bmN = floor(132.0 * bmEx(uOwn[2] * (uOwn[2] > 0.0 ? 1.1 : 2.5) - 1.5 * bmDn(uOwn[5])) + 0.5);
  float r = length(p), px = bmPx;
  vec3 beam = mix(vec3(0.30, 1.0, 0.52), 1.7 * kind * kind + 0.05, own), amber = mix(vec3(1.0, 0.46, 0.10), uKind[2] * uKind[2] * 1.6, own), col = vec3(0.0);
  float strong = 0.55 + 0.3 * uLevel + 0.5 * uEnergy * uLevel;
  if (r < R + px) {
    vec2 g = p * (1.0 + 0.10 * r * r * (1.0 - bare)); float ghost = 0.0;
    if (uOwn[7] > 0.0) g = rot(bmTurn(T * uOwn[7], 89.0)) * g;
    bmFigure(T);
    float m; vec4 tint; if (abs(uOwn[0]) > 0.4) tint = bmMesh(g, 20, m); else tint = bmMesh(g, 26, m);
    bmFigure(T - (2.0 + 3.0 * uSpace) * (1.0 - pale));
    if (pale > 0.0 || max(bare, many) < 1.0) ghost = bmGhost(g + vec2(-0.035, 0.05) * pale, 18) * (1.0 - max(bare, many) * (1.0 - pale));
    float grain = 0.82 + 0.36 * hash21(floor(gl_FragCoord.xy * 0.75));
    float L = m * 0.024 * (1.0 + 0.7 * uCue);
    vec3 dye = tint.rgb, hue = mix(beam, beam * 0.3 + dye * dye * 2.0, sat(2.0 * max(dye.r, max(dye.g, dye.b))) * 0.8);
    col = vec3(0.0050, 0.0085, 0.0072) * (1.25 - 1.2 * r);
    col += (hue * L + vec3(0.9, 1.0, 0.92) * L * L * 0.22) * grain * strong;
    col += amber * ghost * 0.0062 * grain * (0.6 + 0.6 * uSpace + 0.8 * uCue) * strong;
    col += (vec3(0.03, 0.34, 0.2) + amber * 0.08 * uMic) * tint.w * (0.6 + 0.8 * strong);
    if (uOwn[3] != 0.0) col = bmLay(col, bmGround(here) * (1.0 - pale * 0.4 * (1.0 - exp(-0.05 * ghost))), (hue * L * 1.6 + beam * 0.3 * tint.w * (1.0 - pale)) * strong, 2.6);
    vec2 q = p / 0.0885, f = abs(fract(q + 0.5) - 0.5) * 0.0885, fs = abs(fract(q * 5.0 + 0.5) - 0.5) * 0.0177;
    float th = 0.0009, e = 0.0004 + px;
    vec2 ln = 1.0 - smoothstep(th, th + e, f), tk = (1.0 - smoothstep(th, th + e, fs)) * (1.0 - smoothstep(0.008, 0.008 + px, abs(p.yx)));
    float grat = (1.0 - bare) * max(max(ln.x, ln.y), max(tk.x, tk.y)) * step(max(abs(q.x), abs(q.y)), 5.02) * th / (th + 0.5 * px);
    col *= 1.0 - 0.35 * grat;
    col += grat * (vec3(0.010, 0.017, 0.014) + (uKind[3] * 0.10 + 0.02) * uKeys + vec3(0.1, 0.6, 0.4) * tint.w * 0.35);
    vec2 h = rot(0.63) * (p - vec2(-0.20, 0.27));
    h.y += h.x * h.x * 1.2;
    col += vec3(0.013, 0.017, 0.022) * (1.0 - bare) * bmFall(0.06, 0.10, abs(h.x)) * bmFall(0.02, 0.055, abs(h.y));
    col *= mix(bmFall(R - 0.07, R + 0.005, r) * 0.75 + 0.25, 1.0, 0.6 * abs(uOwn[3]));
  }
  vec3 spill = beam * (0.012 + 0.03 * uLevel + 0.02 * uCue) + amber * 0.004;
  if (r > R - px) {
    vec3 pan = bmPanel(p, r, r - R, spill);
    if (uOwn[3] != 0.0) pan = mix(pan, bmGround(here) * mix(0.35, 0.75, pale) * (0.6 + sat(40.0 * pan.g)), abs(uOwn[3]));
    col = mix(col, pan, smoothstep(-px, px, r - R));
  }
  return screenOf(col * bmDim);
}

// ---- b: the long trace
float bmPlace(float t) { if (uOwn[4] != 0.0) return mix(clamp(1.5 + 1.9 * t / (1.0 + 1.6 * bmDn(uOwn[4])), 0.0, 3.0), 1.5 - 1.5 * cos(t * 2.335), bmUp(uOwn[4])); return clamp(1.5 + 1.9 * t, 0.0, 3.0); }
vec4 bmLv;
float bmOf(float k) { return ((bmLv.w * k + bmLv.z) * k + bmLv.y) * k + bmLv.x; }
const float BM_EYE = 2.8, BM_GO = 0.70;
vec3 bmKB = vec3(1.35, 2.7, 5.9); float bmAmp = 1.0, bmF = 1.0;
void bmSwing(float T) {
  vec3 d1 = vec3(uPad - uDrone, uTexture - uPad, uPhrase - uTexture); vec2 d2 = d1.yz - d1.xy; float d3 = (d2.y - d2.x) / 6.0;
  bmLv = vec4(uDrone, d1.x - 0.5 * d2.x + 2.0 * d3, 0.5 * d2.x - 3.0 * d3, d3);   // a smooth curve through the four
  vec2 p1 = bmArm(bmTurn(T, 127.0)), p2 = bmArm(bmTurn(T, 139.0)), p3 = bmArm(bmTurn(T, 179.0)), a = bmArm(bmTurn(T, 311.0) + bmTurn(T * bmUp(uOwn[7]), 53.0));
  if (uOwn[7] > 0.0) p1 = bmArm(bmTurn(T, 127.0) + bmTurn(T * uOwn[7], 41.0));
  float open = 4.0 * uCue * (1.0 - uCue), rise = 0.07 + 0.02 * uSpace, w = (0.085 + 0.02 * uLevel + 0.065 * open) * bmEx(uOwn[1] * (uOwn[1] > 0.0 ? 1.1 : 3.2));
  float loops = 0.20 + 0.01 * sin(bmTurn(T, 11.0)) + 0.01 * uLow + 0.015 * open;
  rise = (rise + 0.17 * bmDn(uOwn[0])) * bmAmp; w *= mix(1.0, bmAmp, 0.6); loops *= bmAmp * (1.0 - 0.9 * bmDn(uOwn[0])) / mix(1.0, bmF, 0.8 * bmUp(uOwn[0]));
  vec2 q1 = vec2(0.62 * p1.x - 0.78 * p1.y, 0.62 * p1.y + 0.78 * p1.x) * loops * 0.8;
  bmXs = vec3(0.0, 0.03 * p2.x, loops * p1.x); bmXc = vec3(0.0, 0.03 * p2.y, loops * p1.y);
  bmYs = vec3(0.1 * p2.x, rise * p3.x, -loops * 1.15 * p1.y); bmYc = vec3(0.1 * p2.y, rise * p3.y, loops * 1.15 * p1.x);
  bmZs = vec3(0.16 * p3.x, 0.14, q1.x); bmZc = vec3(0.16 * p3.y, 0.0, q1.y);
  bmUs = w * vec3(0.0, 0.3 * p2.x, 0.3 * p3.x); bmUc = w * vec3(0.0, 0.3 * p2.y, 0.3 * p3.y);
  vec3 m = bmYs;
  bmYs = a.x * m - a.y * bmZs; bmZs = a.y * m + a.x * bmZs;
  m = bmYc; bmYc = a.x * m - a.y * bmZc; bmZc = a.y * m + a.x * bmZc;
  bmVs = w * vec3(a.x * 0.5 * p1.x, a.x * 0.55 * p3.x, -a.y * 0.7 * p2.x);
  bmVc = w * vec3(a.x * 0.5 * p1.y, a.x * 0.55 * p3.y, -a.y * 0.7 * p2.y);
  bmTip = vec2(0.15, 0.75 * a.x - 0.3 * a.y) * w;
}
void bmSeen(vec3 s, vec3 c, float t, out vec2 C, out vec2 H, out float z) {
  z = dot(bmZs, s) + dot(bmZc, c);
  float k = 1.0 - z / BM_EYE;
  C = vec2(BM_GO * t, 0.0) + vec2(dot(bmXs.yz, s.yz) + dot(bmXc.yz, c.yz), 0.1 * t * (1.0 - abs(uOwn[4])) + dot(bmYs, s) + dot(bmYc, c)) * k;
  H = (bmTip + vec2(dot(bmUs.yz, s.yz) + dot(bmUc.yz, c.yz), dot(bmVs, s) + dot(bmVc, c))) * k * (1.0 + 0.8 * bmOf(bmPlace(t)));
}
vec3 bmTrace(vec2 p) {
  float wide = uRes.x / uRes.y;
  bmPx = 1.0 / uRes.y;
  p = rot(-0.9 * bmFall(0.6, 1.1, wide)) * p;
  p = bmEye(p);
  float ring = bmUp(uOwn[4]), rows = bmDn(uOwn[4]), T = uTime, cut = 1.0; vec2 here = p;
  bmF = bmEx(uOwn[0] * 0.85); bmKB *= bmF;
  if (ring > 0.0) {
    float Rb = 0.3 / ring; p *= 1.0 + 0.12 * ring;
    p.y += Rb * (1.0 - ring);
    float an = length(p) > 1e-5 ? atan(p.x, p.y) : 0.0;
    p = vec2(Rb * an, length(p) - Rb);
    cut = mix(smoothstep(PI, 2.0, abs(an)), 1.0, ring) * smoothstep(0.0, 0.06, p.y + Rb);
    bmKB = mix(bmKB, 2.335 * vec3(1.0, 2.0, floor(3.5 + 2.6 * uOwn[0])), ring); bmAmp = 1.0 - 0.35 * ring;
  }
  if (rows > 0.0) {
    float zoom = 1.0 + 1.7 * rows, D = mix(4.0, 0.8, rows);
    p *= zoom; bmPx *= zoom; float id = floor(p.y / D + 0.5);
    p.y -= id * D; T += id * 43.0; p.x += 0.21 * id; bmAmp = 1.0 - 0.35 * rows;
    cut = smoothstep(0.5 * D, 0.5 * D - 0.05, abs(p.y));
  }
  bmSwing(T);
  const int n = 13; float dt = 0.1 / bmF;
  if (ring > 0.0) dt = 2.6928 / floor(28.0 * mix(1.0, bmF, 0.5));
  float from = (floor(p.x / (BM_GO * 0.1)) - 6.0) * 0.1;
  const vec3 k0 = vec3(1.35, 2.7, 5.9), dc0 = cos(k0 * 0.1), ds0 = sin(k0 * 0.1);
  vec3 dc = dc0, ds = ds0;
  if (dt != 0.1) { dc = cos(bmKB * dt); ds = sin(bmKB * dt); from = (floor(p.x / (BM_GO * dt)) - 6.0) * dt; }
  vec3 c = cos(bmKB * (from - dt)), s = sin(bmKB * (from - dt)), cn;
  vec2 Pb, P, P1, P2, Wb, W, W1, W2; float z, z1, z2;
  bmSeen(s, c, from - dt, Pb, Wb, z);
  cn = c * dc - s * ds; s = s * dc + c * ds; c = cn;
  bmSeen(s, c, from, P, W, z);
  cn = c * dc - s * ds; s = s * dc + c * ds; c = cn;
  bmSeen(s, c, from + dt, P1, W1, z1);
  float w0 = mix(1.35, 0.8, uTone) * max(0.0009, 0.5 * bmPx) * (1.0 + 0.3 * bmDn(uOwn[2]) + 0.6 * bmDn(uOwn[5]));
  float lines = 26.0 * bmEx(uOwn[2] * (uOwn[2] > 0.0 ? 1.6 : 2.4));
  float knock = mix(1.3, -0.95, uHits), head = (2.0 * uLoop - 1.0) * 1.4, ends = sat(6.0 * uLoop) * sat(6.0 - 6.0 * uLoop);
  float swell = bmTurn(uTime, 23.0), wind = mix(2.3, 2.335, ring), fine = 0.6 * smoothstep(0.1, 0.6, uTexture);
  vec3 col = vec3(0.0); vec2 spot, side; float deep;
  if (uHits > 0.002) bmSeen(sin(bmKB * knock), cos(bmKB * knock), knock, spot, side, deep); else spot = vec2(0.0);
  spot -= p;
  for (int i = 0; i < n; i++) {
    float t0 = from + float(i) * dt;
    cn = c * dc - s * ds; s = s * dc + c * ds; c = cn;
    bmSeen(s, c, t0 + 2.0 * dt, P2, W2, z2);
    vec2 q = p - P, E = P1 - P, D = W1 - W, B = (P + P1 - Pb - P2) / 16.0, F = (W + W1 - Wb - W2) / 16.0, mid = q - 0.5 * E;
    if (all(lessThan(abs(mid), 0.5 * abs(E) + max(abs(W), abs(W1)) * 1.04 + abs(B) + 2.0 * bmPx))) {
      float fold, du = bmHalves(W, W1, 0.5); vec2 r;
      for (int j = 0; j < (du < 1.0 ? 4 : 2); j++) {
        if ((j & 1) == 0) r = bmRoots(du * float(j / 2), du, q, E, B, W, D, F, fold); else r = r.yx;
        float u = r.x;
        if (u < 0.0) continue;
        vec2 ps, pv; float v, lps, det, ev, cover = fold * bmHere(u, dt, q, E, B, W, D, F, ps, pv, v, lps, det, ev);
        if (cover <= 0.0) continue;
        float vc = clamp(v, -1.0, 1.0), t = t0 + u * dt, zz = mix(z, z1, u), far = bmFall(-0.42, 0.5, zz);
        float w = w0 * (1.0 + 2.5 * abs(zz + 0.12));
        float bun = 0.24 * sin(wind * t + swell), y = (0.5 + 0.5 * (vc + bun * (1.0 - vc * vc))) * lines;
        float g = min(0.5 * lines * (1.0 - 2.0 * bun * vc) * lps / det, 0.45 / w);
        float one = fract(floor(y) * 0.618 + 0.3), edge = smoothstep(0.86, 1.0, abs(vc));
        float f = abs(fract(y) - 0.5), L = bmLine(f, g, w);
        if (fine > 0.01) L += fine * bmLine(0.5 - f, g, w);
          if (uOwn[5] > 0.0) L = mix(L, g * bmSheen(ps, vc), uOwn[5]);
          if (uOwn[5] < 0.0) { float nd = floor(100.0 * bmF) / 2.6928; L *= mix(1.0, w * bmLine(abs(fract(t * nd - 0.5 * floor(y) - 0.3 * uTime) - 0.5), nd / lps, w), -uOwn[5]); }
          L *= cut * bmTail(t * mix(0.54, 0.74272, ring), 27.0);
          L *= mix(0.35 + 1.3 * one * one, 0.95, smoothstep(0.1, 0.3, w * g)) * (1.0 + (1.2 + 3.0 * uKeys) * edge) / (lps * lps + 0.2);
        float kv = bmPlace(t), lvl = bmOf(kv), bd = band(0.5 + 0.5 * vc), hd = t - head, kn = t - knock, run = 0.5 + 0.5 * sin(mix(1.7, wind, ring) * t - swell * 2.0);
        vec3 hue = kindColour(kv); hue *= hue * hue * 2.2;
        vec3 l = mix(vec3(0.50, 0.66, 0.80), hue + 0.05, 0.25 + 0.65 * sat(lvl * 1.5)) * (0.8 + 0.6 * run + 0.5 * bd + 0.4 * lvl + 0.5 * uMic * vec3(1.0, 0.8, 0.55));
        l *= 1.0 + 1.5 * ends * uLevel / (1.0 + 60.0 * hd * hd + 1800.0 * hd * hd * hd * hd);
        l += (uKind[4] + 0.5) * uHits * 5.0 / (1.0 + 60.0 * kn * kn + 1800.0 * kn * kn * kn * kn);
        col += l * L * cover * (0.10 + far * far);
      }
    }
    Pb = P; P = P1; P1 = P2; Wb = W; W = W1; W1 = W2; z = z1; z1 = z2;
  }
  vec3 m = piece(vec2(p.x / 1.8 + 0.5, 0.5 - 0.6 * p.y)).rgb;
  col *= (0.0072 + 0.04 * bmDn(uOwn[1]) + 0.03 * rows * bmUp(uOwn[3])) * (0.8 + 0.9 * uCue + 0.5 * uEnergy) * (1.0 + m);
  float lie = mix(p.y - 0.1 * p.x / BM_GO, here.y, sat(8.0 * abs(uOwn[4])));
  vec3 ground = vec3(0.0008, 0.0010, 0.0017) + (vec3(0.0022, 0.0034, 0.0060) + 0.006 * m * m) * max(1.0 - 4.0 * lie * lie, 0.0);
  vec3 blow = (uKind[4] + 0.4) * 0.25 * uHits * uHits / (1.0 + 350.0 * dot(spot, spot));
  ground += blow;
  float most = max(col.r, max(col.g, col.b));
  col = (col + 0.13 * most * most) / (1.0 + 0.4 * most);
  vec3 all = ground + col;
  if (uOwn[3] != 0.0) all = bmLay(all, bmGround(here), (col + blow) * 1.5, 3.0);
  return screenOf(all * bmDim);
}
vec3 render(vec2 p) { return uVar < 0.5 ? bmScreen(p) : bmTrace(p); }
