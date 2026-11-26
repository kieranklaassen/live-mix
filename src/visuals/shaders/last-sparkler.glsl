// name: Last sparkler
// a: Pine needles
// b: Willow
// what: A warm near-black night, a twisted paper string, and one small molten drop that throws thin branching sparks like pine needles over a wooden rail; or the later, heavier drop over dark water, its long soft threads bowing down like willow, each ending in a tiny fork, all seen again in the ripples.
// follows: The mix is the size and heat of the drop, the low band draws it down; bands and kinds each feed sparks of their own, and kinds tint night and smoke. The piece lies along the rail or the water. A hit throws a burst, a cue shakes the drop and opens a ring of fine sparks. Highs and keys feed a crown of short sparks, a voice the heat; the loop swells the fire.
float lsDn(float a, float b, float x) { return 1.0 - smoothstep(b, a, x); } // 1 below b, 0 above a
float lsPx, lsW, lsHalo; // one pixel, how wide a spark is, how soft round it
float lsPh;              // the phase of the burning, once up and down in a loop
float lsFire;            // how much the sparks light what stands round
vec4 lsKl;               // how loud each kind is
float lsBump(float x) { return exp(-x * x); }
// The light of a thin line seen at distance d: a core, and a little light round it.
float lsLine(float d, float w) {
  w *= lsW;
  float g = 2.2 * w;
  return sat((w + lsPx - d) / (2.0 * lsPx)) * min(1.0, w / lsPx + 0.1) + lsHalo * g * g / (d * d + g * g) * lsDn(0.014, 0.0, d);
}
float lsGroup(int i) { return 0.25 * (uBands[i * 4] + uBands[i * 4 + 1] + uBands[i * 4 + 2] + uBands[i * 4 + 3]); }
// One pine needle: a stem along d, a node at its end that bursts into eight branches, and most of those burst again.
// x is the light of stem and branches, y the light of the finest tips and the nodes; u is its life, 0 to 1, dark at both ends.
vec2 lsNeedle(vec2 q, vec2 d, float L, float seed, float u) {
  vec2 n = vec2(-d.y, d.x), r = q - d * L, res = vec2(0.0);
  float s = clamp(dot(q, d), 0.0, L), ds = length(q - d * s), R = 1.15 * L, k = s / L;
  bool away = dot(r, r) > R * R;
  if (ds > 0.03 && away) return res;
  float head = L * smoothstep(0.0, 0.2, u), dead = lsDn(1.0, 0.6, u);
  res.x += lsLine(ds, 0.0009) * lsDn(head + 1e-3, head - 0.03, s) * (0.12 + 0.88 * k * k) * lsDn(0.3 + 0.6 * k, 0.1 + 0.25 * k, u) * smoothstep(0.0, 0.05, u);
  if (away) return res;
  res.y += exp(-dot(r, r) / (2e-5 * lsW)) * smoothstep(0.14, 0.2, u) * lsDn(0.6, 0.22, u) * 1.6;
  r.y += 0.5 * dot(r, r) * u;                                            // the far ends sink a little as they cool
  for (int i = 0; i < 8; i++) {
    float fi = float(i), h = fract(seed * 37.3 + fi * 0.618 + 0.21 * fi * seed), h2 = fract(h * 13.7 + seed * 5.0);
    float an = (fi - 3.5) * 0.56 + 0.62 * (h - 0.5), ca = cos(an), sa = sin(an);
    vec2 c = d * ca + n * sa;
    float l = L * (0.14 + 0.52 * h2 * (0.6 + 0.4 * ca)), x = dot(r, c), y = dot(r, vec2(-c.y, c.x));
    float a = clamp(x, 0.0, l), u2 = u - 0.14 - 0.06 * h, kk = a / l, hd = l * smoothstep(0.0, 0.22, u2);
    res.x += lsLine(length(vec2(x - a, y)), 0.0008 * (0.5 + 0.5 * kk)) * lsDn(hd + 1e-3, hd - 0.02, a) * smoothstep(0.0, 0.05, u2) * lsDn(0.75, 0.2, u2 - 0.2 * kk) * (0.35 + 0.65 * kk) * dead;
    // the last and finest splitting, found by its angle
    x -= l;
    float rho = length(vec2(x, y)), g = min(0.8 * l, 0.07) * step(0.25, fract(h2 * 5.7)) + 1e-4;
    if (rho < g + 0.008) {
      float an2 = atan(y, x + 1e-6), id = clamp(floor(an2 / 0.36 + 0.5), -5.0, 5.0), hh = fract(h * 7.1 + id * 0.377 + 0.11 * id * id * h2);
      float off = min(abs(an2 - 0.36 * id - 0.3 * (hh - 0.5)), 1.5), gl = g * (0.08 + 0.92 * hh * hh), u3 = u2 - 0.15;
      float along = rho * cos(off), hg = gl * smoothstep(0.0, 0.2, u3);
      res.y += lsLine(rho * sin(off) + max(along - gl, 0.0), 0.0007 * (1.0 - 0.8 * sat(along / gl)) + 1e-5) * lsDn(hg + 2e-3, hg - 0.006, along) * smoothstep(0.0, 0.05, u3) * lsDn(0.56, 0.15, u3 - 0.2 * along / g) * dead;
      res.y += 0.4 * exp(-rho * rho / (3e-6 * lsW)) * smoothstep(0.0, 0.05, u3) * lsDn(0.3, 0.05, u3);
    }
  }
  return res;
}
// The molten drop, q from its middle: rgb light and a how much of it is here.
vec4 lsDrop(vec2 q, float R, float st, float heat, float pale) {
  q.y /= st;
  float neck = smoothstep(0.1, 1.7, q.y / R);
  q.x /= 1.0 - 0.5 * neck;
  float d = length(vec2(q.x, q.y * (1.0 - 0.28 * neck)));
  float a = lsDn(R + lsPx, R - lsPx, d), z = sqrt(max(1.0 - d * d / (R * R), 0.0));
  if (a <= 0.0) return vec4(0.0);
  vec2 f = q / R / (0.6 + 0.4 * z);
  float slag = noise(f * 1.6 + vec2(3.0, 7.0 * sin(uTime * 0.016))) * 0.75 + noise(f * 3.7 - vec2(5.0 * sin(uTime * 0.013), 9.0 * sin(uTime * 0.015))) * 0.25;
  float h = heat * 0.82 * (0.2 + 0.8 * z) * (0.42 + 1.15 * slag) + 0.25 * lsBump((q.y / R + 0.55) * 1.6) * z;
  vec3 c = mix(vec3(0.5, 0.06, 0.008), vec3(1.6, 0.42, 0.05), smoothstep(0.15, 0.6, h));
  c = mix(c, vec3(3.2, 1.5, 0.38) + vec3(0.0, 0.4, 0.5) * pale, smoothstep(0.5, 1.15, h));
  return vec4(c, a);
}
// The twisted paper string above the drop: h how far up, x how far across it.
vec4 lsString(float x, float h, float w0, float lit) {
  float w = w0 * (0.75 + 1.5 * max(h, 0.0)), e = x / w;
  float a = lsDn(w + lsPx, w - lsPx, abs(x)) * smoothstep(-0.004, 0.004, h);
  if (a <= 0.0) return vec4(0.0);
  float tw = h / w0 * 0.55 + e * 1.1, st = 0.5 + 0.5 * sin(tw), z = sqrt(max(1.0 - e * e, 0.0));
  vec3 stain = mix(vec3(0.8, 0.68, 0.5), kindColour(min(h * 6.0, 3.0)), 0.5);
  float l = lit * (0.7 * exp(-h * 16.0) + 0.08 * exp(-h * 5.0)) + 0.004;
  vec3 c = stain * l * (0.3 + 0.7 * z) * (0.3 + 0.9 * st);
  c *= smoothstep(w0 * 2.0, w0 * 8.0, h);
  c += vec3(1.2, 0.24, 0.03) * exp(-h / (w0 * 2.2)) * (0.4 + 0.6 * st);
  return vec4(c, a);
}
// The smoke, q from the top of the drop: how thick. It leans to the left as it goes up.
float lsSmoke(vec2 q, float wide) {
  if (q.y < 0.0 || abs(q.x + 0.5 * q.y) > 0.3) return 0.0;
  float t = uTime, h = q.y, lean = -0.5 * h * h / (h + 0.12);
  float x = q.x - lean, gw = sqrt(h) * wide;
  x += gw * (0.5 * sin(h * 9.0 - t * 0.42) + 0.35 * sin(h * 17.0 - t * 0.71 + 1.3));
  float s = 0.0;
  for (int i = 0; i < 3; i++) {
    float f = float(i), off = gw * (1.0 * sin(h * (6.0 + 2.3 * f) - t * (0.3 + 0.09 * f) + f * 2.1)), w = 0.0016 + gw * (0.04 + 0.06 * f);
    float y = (x - off) / w;
    s += exp(-abs(y) * (y > 0.0 ? 1.6 : 0.5)) * (0.75 - 0.15 * f);
  }
  return s * smoothstep(0.0, 0.05, h) * exp(-h * 3.2) / (1.0 + 7.0 * gw);
}
// What has just sounded, carried up in the smoke: how far up is how long ago.
vec3 lsStain(vec2 q) {
  vec4 m = piece(vec2(fract(uLoop - 0.55 * max(q.y, 0.0)), sat(0.5 - q.x * 2.0)));
  vec3 c = uKind[0] * lsKl.x + uKind[1] * lsKl.y + uKind[2] * lsKl.z + uKind[3] * lsKl.w;
  return mix(vec3(0.8, 0.55, 0.4), c / max(dot(lsKl, vec4(1.0)), 0.2) * 1.3, 0.75 * sat(dot(lsKl, vec4(0.5)))) * 0.6 + m.rgb * 2.6;
}

// What a cue opens: a ring of fine sparks.
vec3 lsRing(vec2 q) {
  float rr = length(q), an = atan(q.y, q.x + 1e-6) / TAU, s = 0.0;
  if (uCue < 0.01 || rr > 0.5) return vec3(0.0);
  for (int j = 0; j < 3; j++) {
    float nn = 41.0 + 22.0 * float(j), a = an * nn, id = mod(floor(a), nn), h = hash11(id + 9.0 + 70.0 * float(j)), h2 = fract(h * 51.3);
    float at = (0.06 + 0.27 * (1.0 - uCue)) * (0.62 + 0.75 * h), y = abs(fract(a) - 0.3 - 0.4 * h2) * TAU / nn * rr, z = (rr - at) / (0.008 + 0.03 * h2 * h2);
    s += (2.4 - 1.2 * h) * lsLine(y, 0.00055) * exp(-z * z) * step(0.35, h2);
  }
  return uCue * vec3(1.0, 0.56, 0.2) * s;
}

// A crown of short fine sparks close round the drop, each with a little life of its own; the high band and the keys feed it.
float lsCrown(vec2 q, float r0, float reach) {
  float rr = length(q), an = atan(q.y, q.x + 1e-6) / TAU, s = 0.0;
  if (rr > r0 + 0.14 * reach) return 0.0;
  for (int j = 0; j < 2; j++) {
    float nn = 19.0 + 10.0 * float(j), a = an * nn, id = mod(floor(a), nn), h = hash11(id + 31.0 + 60.0 * float(j));
    float x = uTime / (1.1 + 0.9 * h) + 7.0 * h, u = fract(x), h2 = hash11(mod(floor(x), 977.0) + id * 3.1), h3 = fract(h2 * 31.7);
    float y = abs(fract(a) - 0.25 - 0.5 * h3) * TAU / nn * rr, at = r0 + (0.02 + 0.11 * h2 * h2) * reach * (1.0 - (1.0 - u) * (1.0 - u)), len = 0.014 + 0.05 * h3 * h3;
    float z = at - rr;
    s += lsLine(y, 0.0005) * smoothstep(0.0, 0.003, z) * lsDn(len, 0.0, z) * sin(PI * u) * step(0.35, h3);
  }
  return s;
}

vec3 lsPine(vec2 p) {
  vec2 C = vec2(-0.12, 0.085), T = 0.0009 * vec2(sin(uTime * 5.3), sin(uTime * 6.7 + 1.0));
  float sh = 4.0 * uCue * (1.0 - uCue);
  T += 0.004 * sh * vec2(sin(uTime * 15.0), sin(uTime * 19.0 + 2.0));
  float swell = 0.5 + 0.5 * sin(uTime * 0.61), R = 0.0135 + 0.0012 * swell + 0.004 * uLevel + 0.0015 * lsPh;
  float heat = 0.72 + 0.1 * swell + 0.25 * uLevel + 0.3 * uCue + 0.25 * uMic;
  vec2 q = p - C;
  float d2 = dot(q, q), reach = 0.95 + 0.3 * uSpace + 0.18 * lsPh;

  // the sparks
  vec3 sp = vec3(0.0);
  float fire = 0.0;
  for (int i = 0; i < 4; i++) {
    float f = float(i), x = uTime / (2.9 + 0.53 * f) + 0.31 * f, e = mod(floor(x), 991.0), u = fract(x) * 1.08;
    float h = hash11(e + f * 17.0), h2 = fract(h * 91.7);
    float amp = (i == 0 ? 1.6 : i == 2 ? 1.2 : 0.35) + (0.4 + uEnergy) * (0.9 * lsKl[i] + 0.8 * lsGroup(i));
    fire += amp * smoothstep(0.0, 0.2, u) * lsDn(0.9, 0.4, u);
    float an = 0.5 + f * TAU * 0.25 + (h - 0.5) * 1.5, L = (0.15 + 0.07 * h2) * reach;
    if (d2 > 4.9 * L * L) continue;
    vec2 l = lsNeedle(q, vec2(cos(an), sin(an)), L, h2, u);
    vec3 tip = vec3(1.0, 0.57, 0.18) * mix(vec3(1.0), uKind[i] * 1.7, 0.25 * sat(lsKl[i] * 2.0));
    sp += min(amp, 1.9) * (mix(vec3(1.0, 0.33, 0.07), vec3(1.0, 0.6, 0.2), lsDn(0.6, 0.1, u)) * l.x * 1.8 + tip * l.y * 2.0);
  }
  // a hit throws a whole burst
  if (uHits > 0.01 && d2 < 0.2) {
    float a = atan(q.y, q.x + 1e-6) / TAU * 8.0 + uTime * 0.013, id = floor(a), life = 0.42 + 0.36 * (1.0 - uHits);
    for (int j = 0; j < 2; j++) {
      float k = id + (j == 0 ? 0.0 : (fract(a) > 0.5 ? 1.0 : -1.0)), w = mod(k, 8.0), h = hash11(w + 3.3), an = (k + 0.5 + 0.8 * (h - 0.5) - uTime * 0.013) * TAU / 8.0;
      vec2 l = lsNeedle(q, vec2(cos(an), sin(an)), (0.07 + 0.15 * fract(h * 17.0)) * reach, h, life);
      sp += uHits * mix(vec3(1.0, 0.3, 0.06), vec3(1.0, 0.64, 0.26), uHits) * (l.x * 2.4 + mix(vec3(1.0), uKind[4] * 1.6, 0.4) * l.y * 3.0);
    }
  }
  sp += lsRing(q) + vec3(1.0, 0.6, 0.24) * lsCrown(q, R, reach) * (0.6 + (1.2 + uEnergy) * uHigh + 1.5 * uKeys);
  fire += 1.6 * uHits + 1.2 * uCue;
  float lamp = 0.35 + 0.5 * uLevel + 0.16 * swell + 0.35 * fire;

  // the night, and the light of the drop in it
  float dn = length(q);
  vec3 col = mix(vec3(0.0030, 0.0017, 0.0013), vec3(0.0010, 0.0013, 0.0024), smoothstep(-0.3, 0.45, p.y + 0.1 * (noise(p * 2.0 + 0.3 * sin(uTime * 0.03)) - 0.5)));
  col += uKind[0] * uDrone * 0.0016 * lsDn(0.35, -0.35, p.y) + uKind[1] * uPad * 0.003 * smoothstep(-0.1, 0.5, p.y);
  col += vec3(1.0, 0.36, 0.1) * lamp * (0.03 / (1.0 + dn * dn * 400.0) + 0.004 / (1.0 + dn * dn * 18.0));

  // a wooden rail far below, lit from above, with one post
  float ry = p.y + 0.362 - 0.035 * p.x, dx = p.x - C.x;
  float fall = 1.0 / (1.0 + dx * dx * 6.0); fall *= sqrt(fall);
  if (ry < 0.12) {
  float grain = noise(vec2(p.x * 5.0, ry * 190.0)) * 0.6 + noise(vec2(p.x * 13.0 + 7.0, ry * 460.0)) * 0.4;
  vec3 wood = (vec3(0.32, 0.13, 0.05) + 0.06 * uKind[0] * uDrone) * (0.3 + 1.2 * grain) * lamp * fall;
  vec4 m = piece(vec2((p.x + 0.86) / 1.72, sat(0.15 - ry * 8.0)));
  wood += m.rgb * m.rgb * (0.4 + 0.6 * uEnergy) * (0.35 + 1.5 * grain * grain) * vec3(1.15, 0.85, 0.65) * (0.5 + 0.5 * fall) * 2.0 * lsDn(0.86, 0.6, abs(p.x));
  float shade = lsDn(lsPx, -lsPx, ry + 0.03);
  col = mix(col, wood * 0.62 + vec3(1.0, 0.5, 0.2) * 0.26 * lamp * fall * fall * lsBump((ry + 0.028) / 0.0022), lsDn(lsPx, -lsPx, ry));
  col = mix(col, wood * mix(0.1, 0.05, sat(-ry * 10.0)) + vec3(0.0004, 0.0003, 0.0003), shade);
  col = mix(col, vec3(0.0013, 0.0009, 0.0008), lsDn(lsPx, -lsPx, ry + 0.088));
  float post = abs(p.x - 0.475) - 0.026 - 0.008 * lsDn(0.003, 0.0, abs(p.y + 0.262) - 0.008), pe = (p.x - 0.475) / 0.03;
  float pm = lsDn(lsPx, -lsPx, max(post, p.y + 0.25 + 0.03 * pe * pe));
  float pg = noise(vec2(p.x * 210.0, p.y * 6.0)), side = sat(-0.2 - 0.9 * pe);
  col = mix(col, vec3(0.32, 0.13, 0.05) * (0.4 + pg) * lamp * 0.4 * (side * side * 0.5 + 0.03) * exp(-2.0 * max(-p.y - 0.25, 0.0)) + vec3(0.0004, 0.0003, 0.0003), pm);
  }

  // smoke, string, sparks, drop
  vec2 sq = q - vec2(0.0, 0.012);
  float sm = lsSmoke(sq, 0.03 + 0.03 * uSpace);
  if (sm > 0.0) col += lsStain(sq) * sm * (0.05 + 0.13 * uLevel * uEnergy + 0.3 / (1.0 + dn * 12.0)) * (0.3 + 0.35 * lamp);
  float h = q.y - R * 1.1, sx = q.x - T.x * exp(-h * 6.0) - 0.16 * h - 0.05 * h * h - 0.004 * sin(h * 14.0);
  vec4 str = lsString(sx, h, 0.0035, 0.5 + 0.6 * lamp);
  col = mix(col, str.rgb, str.a);
  col += sp;
  vec4 dr = lsDrop(q - T, R, 1.04 + 0.5 * uLow, heat, 0.0);
  col += vec3(1.0, 0.35, 0.07) * 0.3 * exp(-dn / R * 1.6) * heat;
  return mix(col, dr.rgb, dr.a);
}

// One willow thread: out on the wind of the drop and down in a long bow, with a tiny fork at its end.
// q is measured from the drop with the thread's side as positive x; X how far out it ends, Y how far down, a how steep it leaves.
vec2 lsThread(vec2 q, float X, float Y, float a, float seed, float u) {
  if (q.x < 0.0 || q.x > X + 0.05) return vec2(0.0);
  Y *= 0.9 + 0.22 * u;
  float b = (a * X + Y) / (X * X);
  if (q.y < -Y - 0.07 || q.y > 0.25 * a * a / b + 0.014) return vec2(0.0);
  float x = min(q.x, X), f = q.y - x * (a - b * x), sl = a - 2.0 * b * x;
  float k = x / X, hd = smoothstep(0.0, 0.42, u) * X * 1.02, d = abs(f) * inversesqrt(1.0 + sl * sl);
  if (q.x > X) d = length(vec2(q.x - X, f));
  vec2 res = vec2(0.0);
  if (d < 0.02) {
  float live = smoothstep(0.0, 0.05, u) * lsDn(0.3 + 0.62 * k, 0.12 + 0.3 * k, u - 0.06 * k);
  res.x = lsLine(d, 0.0010) * lsDn(hd + 1e-3, hd - 0.06, x) * (0.1 + 0.9 * k) * live * (0.75 + 0.25 * sin(x * 260.0 / (1.0 + abs(sl)) + seed * 40.0));
  }
  // the fork
  vec2 e = vec2(q.x - X, q.y + Y);
  float rho = length(e), u2 = u - 0.38;
  if (rho < 0.07) {
    e.y += 3.0 * rho * rho;
    float an = atan(e.y, e.x + 1e-6) - atan(a - 2.0 * b * X), id = clamp(floor(an / 0.3 + 0.5), -3.0, 3.0), hh = fract(seed * 7.1 + id * 0.377);
    float off = min(abs(an - 0.3 * id - 0.22 * (hh - 0.5)), 1.5), gl = (0.012 + 0.034 * hh) * (1.0 - 0.24 * abs(id)), al = rho * cos(off), hg = gl * smoothstep(0.0, 0.15, u2);
    float on = smoothstep(0.0, 0.04, u2) * lsDn(0.5, 0.12, u2);
    res.y = on * (lsLine(rho * sin(off) + max(al - gl, 0.0), 0.0006 * (1.0 - 0.8 * sat(al / gl)) + 1e-5) * lsDn(hg + 2e-3, hg - 0.005, al) + 0.8 * exp(-rho * rho / 7e-6) * lsDn(0.25, 0.0, u2));
  }
  return res;
}
vec3 lsWillow(vec2 p) {
  const float WL = -0.285;
  vec2 C = vec2(0.15, 0.15), w = p;
  float under = lsDn(lsPx, -lsPx, p.y - WL), deep = max(WL - p.y, 0.0);
  // over still water: below the line the same things are seen again, broken by small waves
  float rip = 0.0;
  if (p.y < WL) {
    float far = 0.02 + deep;
    rip = noise(vec2(p.x * 1.2 / far, 5.0 / far - 50.0 * sin(uTime * 0.007))) - 0.5 + 0.5 * (noise(vec2(p.x * 3.1 / far + 9.0, 11.0 / far - 45.0 * sin(uTime * 0.0133 + 1.0))) - 0.5);
    w = vec2(p.x + rip * 0.12 * (0.25 + 2.0 * deep), WL + 2.5 * deep + rip * 0.09);
  }
  vec2 T = 0.001 * vec2(sin(uTime * 4.1), sin(uTime * 5.3 + 1.0)) + 0.005 * 4.0 * uCue * (1.0 - uCue) * vec2(sin(uTime * 13.0), sin(uTime * 17.0 + 2.0));
  float swell = 0.5 + 0.5 * sin(uTime * 0.47), R = 0.0235 + 0.0014 * swell + 0.004 * uLevel - 0.002 * lsPh;
  float heat = 0.74 + 0.08 * swell + 0.2 * uLevel + 0.25 * uCue + 0.25 * uMic;
  vec2 q = w - C;
  float dn = length(q), reach = (0.85 + 0.3 * uSpace) * (0.92 + 0.14 * lsPh), fire = 0.0;
  vec3 sp = vec3(0.0);
  for (int i = 0; i < 4; i++) {
    float f = float(i), x = uTime / (6.1 + 1.3 * f) + 0.27 * f, e = mod(floor(x), 991.0), u = fract(x) * 1.12;
    float h = hash11(e + f * 23.0 + 4.0), sd = h < 0.5 ? -1.0 : 1.0;
    float loud = lsKl[i] + 0.8 * lsGroup(i), amp = (i == 0 ? 1.3 : i == 2 ? 0.9 : 0.12) + (0.4 + uEnergy) * 0.9 * loud;
    fire += amp * smoothstep(0.0, 0.2, u) * lsDn(0.95, 0.5, u);
    if (f > 1.5) sd = -sd * sign(hash11(e * 1.7 + 2.0) - 0.3);
    vec3 tip = vec3(1.0, 0.6, 0.22) * mix(vec3(1.0), uKind[i] * 1.7, 0.25 * sat(lsKl[i] * 2.0));
    if (q.x * sd < 0.0) continue;
    for (int j = 0; j < 3; j++) {
      float g = float(j), h2 = fract(h * (17.3 + 11.0 * g) + 0.37 * g), h3 = fract(h2 * 9.7), u1 = u - 0.05 * g;
      float own = j == 0 ? 1.0 : smoothstep(0.02, 0.35, loud) * (0.9 - 0.2 * g);
      vec2 l = lsThread(vec2(q.x * sd, q.y), (0.14 + 0.4 * h2) * reach, 0.1 + 0.36 * h3, 0.25 + 1.7 * fract(h3 * 5.3) * (1.0 - 0.6 * h2), h2, u1);
      sp += min(amp, 1.8) * own * (mix(vec3(0.95, 0.24, 0.05), vec3(1.0, 0.56, 0.2), lsDn(0.7, 0.2, u1)) * l.x * 1.7 + tip * l.y * 2.2);
    }
  }
  if (uHits > 0.01) {
    float sd = q.x < 0.0 ? -1.0 : 1.0, life = 0.42 + 0.36 * (1.0 - uHits);
    for (int j = 0; j < 5; j++) {
      float h = hash11(float(j) + 8.0 * sd + 20.0), h2 = fract(h * 23.0);
      vec2 l = lsThread(vec2(q.x * sd, q.y), (0.08 + 0.3 * h) * reach, 0.05 + 0.25 * h2, 0.2 + 2.0 * fract(h2 * 7.0) * (1.0 - h), h, life);
      sp += uHits * mix(vec3(1.0, 0.3, 0.06), vec3(1.0, 0.64, 0.26), uHits) * (l.x * 3.0 + mix(vec3(1.0), uKind[4] * 1.6, 0.4) * l.y * 3.0);
    }
  }
  sp += lsRing(q) + vec3(1.0, 0.6, 0.24) * lsCrown(q, R, reach) * (0.2 + 1.3 * uHigh + 1.5 * uKeys);
  fire += 1.6 * uHits + 1.2 * uCue;
  float lamp = 0.4 + 0.5 * uLevel + 0.16 * swell + 0.25 * fire;

  // the summer night: ink blue, paler where it meets the far bank
  float up = w.y - WL;
  vec3 col = mix(vec3(0.0035, 0.0052, 0.0085), vec3(0.0008, 0.0011, 0.0022), smoothstep(0.0, 0.55, up + 0.06 * (noise(p * vec2(1.5, 4.0)) - 0.5)));
  col += uKind[0] * uDrone * 0.0045 * exp(-up * 9.0) + uKind[1] * uPad * 0.0022 * smoothstep(0.1, 0.7, up);
  if (up < 0.06) col = mix(col, vec3(0.0006, 0.0007, 0.001), lsDn(0.004, -0.004, up - 0.016 - 0.03 * noise(vec2(w.x * 2.3, 3.0)) - 0.008 * noise(vec2(w.x * 17.0, 8.0))));
  col += vec3(1.0, 0.4, 0.12) * lamp * (0.03 / (1.0 + dn * dn * 160.0) + 0.003 / (1.0 + dn * dn * 14.0));
  vec2 sq = q * vec2(-1.0, 1.0) - vec2(0.0, R);
  float sm = lsSmoke(sq, 0.04 + 0.03 * uSpace);
  if (sm > 0.0) col += lsStain(sq) * sm * (0.05 + 0.13 * uLevel * uEnergy + 0.2 / (1.0 + dn * 9.0)) * (0.3 + 0.35 * lamp);
  float h = q.y - R * 1.15, sx = q.x - T.x * exp(-h * 6.0) + 0.3 * h + 0.1 * h * h - 0.004 * sin(h * 11.0);
  vec4 str = lsString(sx, h, 0.005, 0.5 + 0.6 * lamp);
  col = mix(col, str.rgb, str.a) + sp + vec3(1.0, 0.38, 0.1) * 0.3 * exp(-dn / R * 1.6) * heat;
  vec4 dr = lsDrop(q - T, R, 1.1 + 0.5 * uLow, heat, 1.0);
  col = mix(col, dr.rgb, dr.a);
  // the water keeps some of it
  vec3 wat = col * (0.5 - 0.5 * deep) * (0.7 + 0.8 * rip) + vec3(0.0006, 0.0010, 0.0018);
  vec4 m = piece(vec2((p.x + 0.86 + 0.15 * rip) / 1.72, sat(0.1 + deep * 3.9)));
  wat += m.rgb * m.rgb * (0.25 + 0.75 * uEnergy) * 0.095 * smoothstep(-0.35, 0.5, rip) * lsDn(0.88, 0.65, abs(p.x));
  return mix(col, wat, under);
}

vec3 render(vec2 p) {
  lsPx = 0.6 / uRes.y;
  lsW = 1.25 - 0.4 * uTone;
  lsHalo = 0.34 - 0.2 * uTone;
  lsPh = 0.5 - 0.5 * cos(TAU * uLoop);
  lsKl = vec4(uDrone, uPad, uTexture, uPhrase);
  return screenOf(uVar < 0.5 ? lsPine(p) : lsWillow(p));
}
