// name: Flowers
// a: Flower field
// b: One bloom
// what: A meadow of flowers seen at a slant in evening light, the piece lying on the ground as drifts of flowers in its colours, each one open as far as its sound is loud; or one great flower seen close, a ring of petals for each kind of sound.
// follows: Each flower opens with the sound where it grows (across is the loop, far is the back of the room), the low band sways them, the mix warms the light, a hit or cue opens a ring of flowers that spreads outward; on the one bloom each ring of petals opens with its own kind of sound and a hit sends a ring of light out through them.
// One ring of n petals round the middle of a flower. r is the distance out with the tips at 1; a is the angle in turns
// times n, plus the ring's own turn. vary gives each petal its own length and lean.
// Returns how far inside a petal's edge this is (in the flower's units), the place across the petal (-1 to 1),
// the place along it (0 to 1) and the petal's own number between 0 and 1.
vec4 fRing(float r, float a, float n, float round, float point, float vary) {
  float id = floor(a);
  float hv = fract(sin(mod(id, n) * 12.9898 + n * 3.1) * 43758.5453);
  float f = (a - id - 0.5) * 2.0 + (hv - 0.5) * 0.5 * vary;
  r /= 1.0 - 0.28 * vary * hv;
  float w = min(1.0, mix(round * sqrt(max(1.0 - r * r, 0.0)), 2.2 * (1.0 - r), point)) * (0.93 - 0.25 * point - 0.2 * vary) * smoothstep(0.0, 0.3, r + 0.3 * (1.0 - point));
  float edge = min((w - abs(f)) * (r + 0.05) * PI / n, 1.0 - r);
  return vec4(edge, clamp(f / max(w, 0.08), -1.0, 1.0), min(r, 1.0), hv);
}
// The light on a petal: it rises toward its tip like a cup and curls at its edges. dir is the way outward from the middle.
float fLit(vec2 dir, float f, float cup, vec3 lamp) {
  vec3 n = normalize(vec3(-dir * cup + vec2(-dir.y, dir.x) * f * 0.7, 1.0));
  return sat(dot(n, lamp));
}
vec3 fMeadow(vec2 p) {
  float asp = uRes.x / uRes.y;
  const float F = 1.15;
  float pitch = 0.66;
  vec3 fwd = vec3(0.0, -sin(pitch), cos(pitch)), up = vec3(0.0, cos(pitch), sin(pitch));
  vec3 ro = vec3(0.25 * sin(uTime * 0.05), 2.3, uTravel * 0.045);
  vec3 rd = normalize(fwd * F + vec3(p.x, 0.0, 0.0) + up * p.y);
  rd.y = min(rd.y, -0.03);                                 // nothing is drawn above the far edge of the meadow
  vec3 lamp = normalize(vec3(-0.5, 0.5, 0.62));             // in a flower's own frame: across, away, up. The sun is low, behind and to the left
  float g = max(uHits, uCue);
  vec3 sunny = vec3(1.0, 0.68, 0.38), cool = vec3(0.045, 0.075, 0.15);
  vec3 col = vec3(0.0);
  float left = 1.0, shade = 1.0;                            // how much of the pixel is still to fill; shadow from what is above
  float px = 1.3 / uRes.y;
  vec3 haze = mix(vec3(0.014, 0.014, 0.035), vec3(0.55, 0.20, 0.09), smoothstep(0.05, 0.6, p.y) * (0.55 + 0.45 * exp(-pow((p.x + 0.35) * 1.3, 2.0))));
  // the flower heads, the tallest first
  for (int k = 0; k < 4; k++) {
    float fk = float(k);
    float hk = 0.86 - 0.17 * fk, ck = 0.72 - 0.05 * fk;
    mat2 turn = rot(0.4 + fk * 1.13);
    float t = (hk - ro.y) / rd.y;
    vec2 q = ro.xz + rd.xz * t;
    vec2 gq = turn * q / ck + fk * 7.3;
    vec2 id = floor(gq);
    float hx = hash21(id + fk * 31.7), hy = fract(hx * 57.31), h3 = fract(hx * 131.7), h4 = fract(hx * 717.3);
    vec2 l = ((gq - id - 0.5 - (vec2(hx, hy) - 0.5) * 0.16) * turn) * ck;   // from the flower's middle, in the ground's own directions
    vec2 c = q - l;
    // the wind rocks the head on its stem
    l -= (0.012 + 0.05 * uLow) * vec2(sin(uTime * 0.5 + c.x * 0.7 + hx * 3.0), 0.6 * sin(uTime * 0.37 + c.y * 0.9 + hy * 5.0));
    // where this flower lies in the piece: its place on the screen
    vec3 dc = vec3(c.x, hk, c.y) - ro;
    vec2 sc = F * vec2(dc.x, dot(dc, up)) / dot(dc, fwd);
    vec4 m = piece(vec2(sc.x / asp * 0.96 + 0.5, 0.5 - sc.y * 0.96));
    float loud = sat(m.a * (0.7 + 0.6 * uEnergy));
    // the ring a hit sets going: flowers open as it passes
    float rr = (length(c - vec2(ro.x + 0.4, ro.z + 3.6)) - (1.0 - g) * 3.8) * 1.2;
    float ring = sqrt(g) * exp(-rr * rr);
    float open = sat(0.08 + 1.15 * loud + 0.9 * ring);
    vec3 hue = m.rgb / max(m.a, 0.02);
    hue = mix(vec3(0.6, 0.55, 0.4), mix(hue, hue * hue * 1.5, 0.75), sat(m.a * 6.0));
    // the low sun lies across the meadow in slow pools of light, wider as the music fills
    float pool = smoothstep(0.5 - 0.35 * uLevel, 0.75, noise(c * 0.45 + vec2(uTime * 0.02, 0.0)) + 0.5 * ring);
    vec3 warm = sunny * (0.4 + 1.0 * pool);
    hue = mix(hue, uKind[4] * uKind[4] * 1.8 + vec3(0.25, 0.08, 0.1), sat(ring * 1.2 - loud));
    hue = hue * (0.7 + 0.6 * hx) + (h4 - 0.5) * vec3(0.12, -0.03, 0.10);
    float fog = 1.0 - exp(-t * 0.07);
    float there = step(0.12, h3);
    float R = ck * 0.33 * (0.75 + 0.25 * h3) * (0.34 + 0.66 * open);
    vec2 lf = vec2(l.x, l.y * 0.8) / R;                    // it leans its face a little toward us
    float aa = (px * t / F) / R * (1.0 + 5.0 * max(2.5 - t, 0.0) * max(2.5 - t, 0.0));
    float daisy = step(0.68, hy);                           // some have many narrow petals
    float n = mix(5.0 + floor(h4 * 3.99), 11.0 + floor(h4 * 2.99), daisy);
    float r = length(lf), ang = atan(lf.y, lf.x) / TAU * n + hx;
    vec2 dir = lf / max(r, 1e-3);
    float in_ = mix(0.68, 0.8, daisy);
    vec4 outer = fRing(r, ang, n, 1.5, 0.3 * daisy, 0.5);
    vec4 inner = fRing(r / in_, ang + 0.5, n, 1.5, 0.3 * daisy, 0.5);
    outer.x = smoothstep(-aa, aa, outer.x); inner.x = smoothstep(-aa, aa, inner.x * in_);
    float mid = smoothstep(0.2 + aa, 0.2 - aa, r / (0.5 + 0.5 * open));
    // petals: deep at the throat, pale at the tip, a dark mid-line; the far side of the cup takes the sun, the near side lets it through
    float thru = sat(0.15 - dot(dir, lamp.xy) * 1.2);
    vec3 glow = hue * hue * warm * thru * 1.3;
    vec3 po = hue * mix(0.4, 1.0, outer.z) + 0.08 * outer.z * outer.z;
    po *= (0.75 + 0.25 * (1.0 - outer.y * outer.y)) * (1.0 - 0.3 / (1.0 + outer.y * outer.y * 60.0));
    po = po * (cool + warm * 1.1 * fLit(dir, outer.y, 0.9 - 0.5 * open, lamp)) + glow * outer.z;
    po *= 1.0 - 0.5 * smoothstep(1.25, 0.6, r / in_);      // the inner ring's shadow
    vec3 pi_ = hue * mix(0.5, 1.15, inner.z) + 0.12 * inner.z * inner.z;
    pi_ *= (0.75 + 0.25 * (1.0 - inner.y * inner.y)) * (1.0 - 0.3 / (1.0 + inner.y * inner.y * 60.0));
    pi_ = pi_ * (cool + warm * 1.1 * fLit(dir, inner.y, 1.3 - 0.6 * open, lamp)) + glow * inner.z;
    // a closed flower is a green bud with a little colour showing
    vec3 bud = vec3(0.04, 0.09, 0.03) * (cool + warm * 0.7);
    float shut = smoothstep(0.45, 0.1, open);
    po = mix(po, bud * (0.6 + 0.6 * outer.z), shut * 0.85); pi_ = mix(pi_, bud + 0.5 * pi_, shut * 0.6);
    // the middle: a small gold dome
    vec3 mc = vec3(0.85, 0.45, 0.06) * (cool + warm * (0.25 + sat(dot(normalize(vec3(lf * 3.0, 1.0)), lamp)))) * (0.8 + 0.2 * sin(lf.x * 60.0) * sin(lf.y * 60.0) * sat(1.0 - aa * 8.0));
    vec3 fc = mix(po, pi_, inner.x);
    fc = mix(fc, mc, mid * (1.0 - shut));
    fc += hue * warm * 0.3 * loud * loud * (1.0 - shut);    // a sounding flower holds the light
    float fa = max(max(outer.x, inner.x), mid) * there;
    col += left * fa * mix(fc * shade, haze, fog);
    left *= 1.0 - fa;
    shade *= 1.0 - 0.6 * there * smoothstep(1.9, 0.5, length(lf - vec2(0.35, -0.5)));
    // the stem, going down into the shade
    vec2 sd = -rd.xz / abs(rd.y) * hk;
    float along = sat(dot(l, sd) / dot(sd, sd));
    float sw = 0.011 + px * t / F;
    float sa = smoothstep(sw, sw * 0.4, length(l - sd * along)) * smoothstep(0.75, 0.1, along) * there * step(0.001, along);
    col += left * sa * mix(vec3(0.03, 0.075, 0.025) * (cool + warm * 0.7) * shade, haze, fog);
    left *= 1.0 - sa;
  }
  // their leaves, lower down
  for (int k = 0; k < 4; k++) {
    float fk = float(k);
    float hk = 0.86 - 0.17 * fk, ck = 0.72 - 0.05 * fk;
    mat2 turn = rot(0.4 + fk * 1.13);
    float t = (hk * 0.3 - ro.y) / rd.y;
    vec2 gq = turn * (ro.xz + rd.xz * t) / ck + fk * 7.3;
    vec2 id = floor(gq);
    float hx = hash21(id + fk * 31.7), hy = fract(hx * 57.31), h3 = fract(hx * 131.7), h4 = fract(hx * 717.3);
    vec2 lf = ((gq - id - 0.5 - (vec2(hx, hy) - 0.5) * 0.16) * turn) / (0.42 * (0.7 + 0.3 * h4));
    float aa = (px * t / F) / (ck * 0.36);
    float r = length(lf), nl = 4.0 + floor(h3 * 3.99);
    vec4 leaf = fRing(r, atan(lf.y, lf.x) / TAU * nl + hy, nl, 1.0, 1.0, 1.0);
    vec2 cl = (ro.xz + rd.xz * t);
    vec3 warm = sunny * (0.4 + 1.0 * smoothstep(0.5 - 0.35 * uLevel, 0.75, noise(cl * 0.45 + vec2(uTime * 0.02, 0.0))));
    vec3 lc = mix(vec3(0.010, 0.04, 0.018), vec3(0.035, 0.10, 0.03), leaf.z) * (0.6 + 0.6 * hx + 0.4 * leaf.w);
    lc *= 1.0 + 0.6 / (1.0 + leaf.y * leaf.y * 30.0);       // the vein down the middle
    lc *= cool + warm * (0.1 + 1.0 * fLit(lf / max(r, 1e-3), leaf.y, -0.5, lamp));
    float fa = smoothstep(-aa, aa, leaf.x) * step(0.12, h3);
    col += left * fa * mix(lc * shade, haze, 1.0 - exp(-t * 0.07));
    left *= 1.0 - fa;
    shade *= 1.0 - 0.35 * step(0.12, h3) * smoothstep(1.4, 0.4, r);
  }
  // the ground: grass and shade
  float tg = -ro.y / rd.y;
  vec2 q = ro.xz + rd.xz * tg;
  float gr = noise(q * vec2(11.0, 6.0));
  vec3 gc = mix(vec3(0.003, 0.012, 0.007), vec3(0.025, 0.06, 0.02), gr * gr) * (cool + sunny * 0.5);
  col += left * mix(gc * shade, haze, 1.0 - exp(-tg * 0.07));
  // far off the meadow goes into the evening
  col = mix(col, haze, smoothstep(0.25, 0.6, p.y) * 0.8 + 0.2 * smoothstep(0.6, 0.82, p.y));
  col /= 1.0 + 0.8 * dot(p, p);
  return col;
}
// Soft far lights behind the one bloom: other flowers, out of focus.
vec3 fBokeh(vec2 p, float n, float seed) {
  vec2 q = p * n + seed * 7.7, id = floor(q), f = fract(q) - 0.5;
  float hx = hash21(id + seed), hy = fract(hx * 57.31), h3 = fract(hx * 131.7);
  float k = floor(h3 * 4.99);
  float lv = k < 0.5 ? uDrone : k < 1.5 ? uPad : k < 2.5 ? uTexture : k < 3.5 ? uPhrase : uHits;
  vec2 at = (vec2(hx, hy) - 0.5) * 0.4 + 0.05 * vec2(sin(uTime * 0.11 + hx * 30.0), cos(uTime * 0.09 + hy * 30.0));
  float d = length(f - at);
  float rad = 0.12 + 0.12 * fract(hx * 717.3);
  float disc = smoothstep(rad, rad * 0.7, d) * (0.55 + 0.45 * smoothstep(rad * 0.4, rad * 0.95, d));
  vec3 c = uKind[int(k)];
  return c * c * disc * (0.004 + 0.06 * lv) * step(0.4, hy);
}
// One row of the great flower's petals. They lie on a cone about the stem, th up from flat; far says which of the two
// places the eye's ray meets that cone is wanted (0 the near wall, seen from outside; 1 the far wall or the floor).
// Returns the light and how much of the pixel it covers; edge is how far inside a petal this is, for the shadow it lays.
vec4 fRow(vec3 ro, vec3 rd, float th, float far, float L, float n, float turn, vec3 base, float lv, float flare, float px, out float edge) {
  float c2 = tan(th); c2 *= c2;
  float A = rd.y * rd.y - c2 * dot(rd.xz, rd.xz);
  float B = ro.y * rd.y - c2 * dot(ro.xz, rd.xz);
  float C = ro.y * ro.y - c2 * dot(ro.xz, ro.xz);
  float disc = B * B - A * C, sq = sqrt(max(disc, 0.0));
  A = abs(A) < 1e-4 ? 1e-4 : A;
  float ta = (-B - sq) / A, tb = (-B + sq) / A;
  float t1 = min(ta, tb), t2 = max(ta, tb);
  float ok1 = step(0.0, t1) * step(0.0, ro.y + t1 * rd.y), ok2 = step(0.0, t2) * step(0.0, ro.y + t2 * rd.y);
  float t = far > 0.5 ? mix(t1, t2, ok2) : t1;
  float ok = step(0.0, disc) * (far > 0.5 ? max(ok1, ok2) : ok1 * ok2);
  vec3 h = ro + rd * t;
  float s = length(h);
  vec4 e = fRing(s / L, atan(h.z, h.x) / TAU * n + turn, n, 1.3, 0.42, 0.35);
  edge = e.x * L * ok - (1.0 - ok);
  float aa = px * t * 0.7;
  float cover = smoothstep(-aa, aa, e.x * L) * ok;
  // the petal's own facing: the cone's, curled up at the edges and bent back toward the tip
  vec2 u = h.xz / max(length(h.xz), 1e-4);
  float st = sin(th), ct = cos(th);
  vec3 nrm = normalize(vec3(-st * u.x, ct, -st * u.y) - vec3(-u.y, 0.0, u.x) * e.y * 0.55 + vec3(ct * u.x, st, ct * u.y) * (e.z - 0.55) * 0.7);
  float under = step(0.0, dot(nrm, rd));                    // we are looking at its back
  nrm *= 1.0 - 2.0 * under;
  vec3 lamp = normalize(vec3(-0.5, 0.4, 0.77));             // the sun is low, behind the flower and to the left
  float front = sat(dot(nrm, lamp)), thru = sat(-dot(nrm, lamp));
    float crease = 1.0 - 0.35 / (1.0 + e.y * e.y * 30.0);
  vec3 alb = (base * mix(0.10, 1.0, smoothstep(0.15, 1.0, e.z)) + vec3(0.10, 0.07, 0.05) * smoothstep(0.75, 1.0, e.z)) * crease;
  alb = mix(alb, alb * vec3(0.55, 0.8, 0.5), under * (1.0 - e.z) * 0.8);          // the back is greener toward the stem
  vec3 warm = vec3(1.0, 0.72, 0.45) * (0.7 + 0.3 * uLevel);
  vec3 pc = alb * (vec3(0.03, 0.05, 0.10) + warm * front * 0.62);
  pc += alb * base * warm * thru * (1.0 + 1.2 * lv) * (0.35 + 0.65 * e.z);         // the sun coming through it
  pc += base * base * lv * 0.22 * e.z * e.z;                                               // a sounding ring holds light of its own
  pc += (base + 0.12) * warm * smoothstep(0.03 * L, 0.0, e.x * L) * (0.10 + 0.25 * thru + 0.3 * lv);   // the thin edge takes the light
  pc += (base + vec3(0.3, 0.2, 0.1)) * flare * (0.3 + 0.7 * e.z);
  return vec4(pc, cover);
}
vec3 fBloom(vec2 p) {
  float g = max(uHits, uCue);
  // behind: deep leaf green going to dusk, and far lights
  vec3 col = mix(vec3(0.0004, 0.004, 0.003), vec3(0.004, 0.0015, 0.008), smoothstep(-0.5, 0.5, p.y + 0.3 * p.x));
  col += vec3(0.10, 0.03, 0.008) * exp(-length(p - vec2(-0.85, 0.5)) * 2.6) * (0.4 + 1.0 * uLevel);
  col += fBokeh(p, 2.6, 1.0) + fBokeh(p * rot(0.5), 4.3, 2.0) * 0.7;
  // the eye: a little above the flower's rim, drifting slowly round it
  const float F = 1.55;
  float el = 0.64 + 0.02 * sin(uTime * 0.09), az = 0.3 * sin(uTime * 0.045);
  vec3 ro = 1.85 * vec3(sin(az) * cos(el), sin(el), -cos(az) * cos(el));
  vec3 fw = normalize(vec3(0.0, 0.03, 0.0) - ro), ri = normalize(cross(vec3(0.0, 1.0, 0.0), fw)), upv = cross(fw, ri);
  vec3 rd = normalize(fw * F + ri * p.x + upv * p.y);
  // the wind rocks the flower on its stem
  vec2 rock = (0.01 + 0.035 * uLow) * vec2(sin(uTime * 0.31), sin(uTime * 0.23 + 1.0));
  mat2 rx = rot(rock.x), rz = rot(rock.y);
  ro.xy = rx * ro.xy; rd.xy = rx * rd.xy; ro.zy = rz * ro.zy; rd.zy = rz * rd.zy;
  float px = 1.3 / uRes.y / F;
  // how far each ring of petals stands up: every ring opens with its own kind of sound, and an inner ring always stands inside the one round it
  float lv[5] = float[5](uDrone, uPad, uTexture, uPhrase, sat(uHits * 1.2));
  float th[6];
  th[0] = 0.0;
  for (int k = 0; k < 5; k++) {
    float open = sat(0.06 + 1.2 * lv[k] + 0.2 * uLevel);
    th[k + 1] = th[k] + mix(k == 0 ? 0.42 : k == 1 ? 0.17 : 0.4, 0.115, open) * (1.42 - th[k]) / 1.42;   // the two outer rings never stand higher than the eye
  }
  vec3 acc = vec3(0.0);
  float left = 1.0, shade = 1.0, edge;
  // Eight rows of petals from the flattest to the most upright: two to each of the three outer rings (the under row
  // lies flatter and half a petal round), one to each of the two inner ones. First the near walls of the upright ones,
  // seen from outside and from the outside in; then the middle; then every row's far side from the inside out.
  for (int j = 0; j < 12; j++) {
    int r = j < 4 ? j + 4 : 11 - j;
    int k = r < 6 ? r / 2 : r - 3;
    float fk = float(k), row = r < 6 ? float(1 - (r & 1)) : 0.0;
    float t = mix(th[k + 1], th[k] + 0.1 * step(fk, 0.5), row * 0.42);
    float L = (0.66 - 0.085 * fk) * (0.78 + 0.22 * sat(lv[k] * 1.5 + 0.3 * uLevel)) * (1.0 + 0.07 * row);
    float n = 9.0 - fk;
    float turn = fk * 0.37 + 0.5 * row + 0.03 * sin(uTime * 0.13 + fk * 1.7);
    vec3 kc = uKind[k]; kc = kc * kc * (0.9 + kc);
    vec3 base = mix(mix(vec3(0.16, 0.08, 0.11), kc, 0.5) * 0.4, kc, sat(0.1 + 1.4 * lv[k])) * (1.0 - 0.22 * row);
    float fd = (1.0 - g) * 5.5 - fk - 0.5 + 0.5 * row;      // a hit: a ring of light going out through the petals
    float flare = sqrt(g) * exp(-fd * fd * 0.8) * 0.5;
    vec4 c = fRow(ro, rd, t, step(3.5, float(j)), L, n, turn, base, lv[k], flare, px, edge);
    acc += left * c.a * c.rgb * shade;
    left *= 1.0 - c.a;
    shade *= 1.0 - 0.55 * smoothstep(-0.09, 0.012, edge);   // the shadow each petal lays on those behind it
    if (j == 3) {
      // the middle: a gold dome of stamens, brighter with the mix
      vec3 oc = ro - vec3(0.0, 0.035, 0.0);
      float b = dot(oc, rd), h = b * b - dot(oc, oc) + 0.0055;
      float ts = -b - sqrt(max(h, 0.0));
      vec3 nn = normalize(oc + rd * ts);
      float core = smoothstep(0.0, 0.0008, h);
      float dots = 0.65 + 0.35 * sin(nn.x * 34.0) * sin(nn.z * 34.0);
      acc += left * core * vec3(1.0, 0.5, 0.07) * dots * (0.12 + 0.2 * uLevel + 0.6 * g + (0.5 + 0.6 * uLevel) * sat(dot(nn, normalize(vec3(-0.5, 0.4, 0.77))) + 0.25)) * shade;
      left *= 1.0 - core;
    }
  }
  // the stem below
  vec3 dn = vec3(0.0, -1.0, 0.0);
  vec2 s0 = F * vec2(dot(-ro, ri), dot(-ro, upv)) / dot(-ro, fw), s1 = F * vec2(dot(dn - ro, ri), dot(dn - ro, upv)) / dot(dn - ro, fw);
  vec2 sd = s1 - s0;
  float al = max(dot(p - s0, sd) / dot(sd, sd), 0.0);
  float ds = (p - s0 - sd * al).x + 0.03 * al * al;
  float sw = 0.022;
  float stem = smoothstep(sw, sw - 0.004, abs(ds)) * step(0.001, al);
  acc += left * stem * vec3(0.03, 0.08, 0.03) * (0.25 + 1.4 * smoothstep(0.2, -1.0, ds / sw) * vec3(1.0, 0.8, 0.5)) * shade;
  left *= 1.0 - stem;
  col = col * left + acc;
  // pollen a hit throws up from the middle
  vec2 po = p - s0 - vec2(0.0, 0.03);
  float pr = length(po), pa = atan(po.y, po.x) / TAU;
  vec2 pq = vec2(pa * 46.0, pr * 16.0 - (1.0 - g) * 9.0), pid = floor(pq);
  float ph = hash21(pid + 3.0);
  vec2 pf = (fract(pq) - 0.5 - (vec2(ph, fract(ph * 57.3)) - 0.5) * 0.6) * vec2(pr * TAU / 46.0, 1.0 / 16.0);
  col += vec3(1.0, 0.72, 0.28) * smoothstep(0.006, 0.002, length(pf)) * step(0.8, ph) * sqrt(g) * smoothstep(0.03, 0.1, pr) * smoothstep(0.6, 0.2, pr) * 1.6;
  col /= 1.0 + 0.95 * dot(p, p);
  return col;
}
vec3 render(vec2 p) {
  vec3 col;
  if (uVar < 0.5) col = fMeadow(p); else col = fBloom(p);
  return screenOf(col * 1.1);
}
