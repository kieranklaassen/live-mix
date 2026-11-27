// name: Step well
// a: Noon triangles
// b: At the pool
// what: A great square pit of honey stone seen from its edge: tier under tier of small paired stairs, one wall in sun and one in shade, down to a still green pool, with one yellow cloth left to dry; or afloat on that pool, before three storeys of pillared galleries doubled in the water and a toothed edge of stairs against a white sky.
// follows: The drone and the pad fill the well, and the pad moves the sun's edge; texture brings lichen; a phrase sends light down the flights like feet; each kind colours one tier, and in b lights a bay; a hit drops a pebble and throws nets of light on the stone; a cue lays sky on the pool; keys light lamps in niches; bands lift columns; the piece stains the stone.
// own: 0 a moonlit night with lamps in the niches at -1, late low orange sun at 1; 1 white stone at -1, red stone at 1; 2 nearly drained at -1, filled several tiers up at 1; 3 few broad flights (and wide bays in the galleries) at -1, many narrow ones at 1; 4 a shallow open pit at -1, a steep deep one at 1; 5 snow on the steps and ledges at -1, grass and moss over them at 1; 6 the eye straight above it, or in the galleries looking out between the pillars, at -1, down in the corner by the water, or close before the galleries, at 1; 7 the pool shines with a light of its own at -1, every tier glazed in the colours of the sounds at 1
// The pit: half its width, a tier's height, the flights' spacing, half their foot, slope, how many tiers, the water
float swS, swH, swP, swF, swG, swN, swY, swPx, swHf, swNgt, swOk;
vec3 swGlo, swL, swSun, swAmb, swBnc, swRaw, swHz;
bool swB;
const float swW = 0.85, swA = 0.1, swSt = 7.0;
// What a ray met: how far, which tier, which wall, what part (0 sky, 1 wall, 2 ledge, 3 front, 4 5 flights, 6 ground)
float swT, swK, swSg, swC; int swAx, swQ;
// A wave, one turn in 1; a soft fall from 1; how much is inside an edge.
float swV(float x) { x = abs(fract(x) - 0.5) * 4.0 - 1.0; return x * (1.5 - 0.5 * x * x); }
float swD(float x) { x = 1.0 / (1.0 + x * 0.5); return x * x * x; }
float swIn(float px, float d) { return sat(0.5 - 0.5 * d / px); }
float swKd(int i) { return i == 0 ? uDrone : i == 1 ? uPad : i == 2 ? uTexture : i == 3 ? uPhrase : uHits; }
// The sky's light on a stone in shade.
vec3 swCool(vec3 a) { return mix(a, vec3(dot(a, vec3(0.333))), 0.42) * swAmb; }
void swTrace(vec3 o, vec3 d) {
 float q = 1.0 / swH;
 d += 1.1e-4 * (step(0.0, d) * 2.0 - 1.0);
 vec2 E = vec2(swS + o.y * q - swW), dp = d.xz - d.y * q, dm = -d.xz - d.y * q;
 vec2 tp = max((E - o.xz) / max(dp, 1e-5), 0.0) + 1e9 * step(dp, vec2(1e-5)), tm = max((E + o.xz) / max(dm, 1e-5), 0.0) + 1e9 * step(dm, vec2(1e-5));
 vec2 sg = mix(vec2(-1.0), vec2(1.0), step(tp, tm)), te = min(tp, tm), od = sg * o.xz, dd = sg * d.xz, inv = 1.0 / dd;
 float t = min(te.x, te.y), k = floor(-(o.y + d.y * t) * q), iy = 1.0 / d.y, down = step(d.y, 0.0);
 swQ = 0; swT = 1e9; swAx = 1; swSg = 1.0; swC = 0.0;
 if (down > 0.5 && k < -1.0) { k = -1.0; t = max(t, (swH - o.y) * iy); }
 for (int i = 0; i < 7; i++) {
  if (k < -1.0) return;
  float yF = -(k + 1.0) * swH, Sk = swS - k, tO = (yF + swH * (1.0 - down) - o.y) * iy, best = 1e9;
  for (int ax = 0; ax < 2; ax++) {
   if (te[ax] > tO || te[ax] > best) continue;   // not yet near this wall
   bool in_ = dd[ax] > 0.0;
   float tW = in_ ? (Sk - od[ax]) * inv[ax] : 1e9, tFr = (Sk - swW - od[ax]) * inv[ax];
   float tE = min(min(tW, tO), in_ ? 1e9 : tFr), t0 = in_ ? max(t, tFr) : t;
   if (t0 < tE && t0 < best) {
    float du = d[2 - ax * 2], ou = o[2 - ax * 2], u0 = ou + du * t0, c = floor(u0 / swP + 0.5), dir = du < 0.0 ? -1.0 : 1.0;
    float gr = d.y + swG * du, gl = d.y - swG * du, ir = 1.0 / (abs(gr) < 1e-5 ? 1e-5 : gr), il = 1.0 / (abs(gl) < 1e-5 ? 1e-5 : gl), lim = (Sk - swW - swF - swA) / swF + 0.35;
    for (int j = 0; j < 3; j++) {
     float m = sat(lim - abs(c * swP) / swF), a = swG * (ou - c * swP), b = o.y - yF - swG * (swF * m + swA);
     float tr = -(b + a) * ir, tl = -(b - a) * il, n = t0, f = tE; int w = t0 > t ? 3 : 2;
     if (gr < 0.0) { if (tr > n) { n = tr; w = 4; } } else f = min(f, tr);
     if (gl < 0.0) { if (tl > n) { n = tl; w = 5; } } else f = min(f, tl);
     if (n < f && m > 0.0) { if (n < best) { best = n; swQ = w; swAx = ax; swSg = sg[ax]; swC = c; } break; }
     c += dir;
     if (dir * (ou + du * tE - c * swP) < -swF - swA) break;
    }
   }
   if (k >= 0.0 && tW < tO && tW >= t && tW < best) { best = tW; swQ = 1; swAx = ax; swSg = sg[ax]; }
  }
  swK = k; swT = best;
  if (best < 1e8) return;
  if (down > 0.5) {
   vec2 e = od + dd * tO - Sk + 1.0;
   if (max(e.x, e.y) > 0.0) { swT = tO; swQ = k < 0.0 ? 6 : 2; swAx = e.x > e.y ? 0 : 1; swSg = sg[swAx]; return; }
  }
  t = tO; k += down * 2.0 - 1.0;
 }
 swT = t; swQ = 1;
}
// The slope of the water.
vec2 swRip(vec2 w) {
 vec2 s = vec2(0.8, 0.6) * swV(dot(w, vec2(0.27, 0.2)) + uTime * 0.08) + vec2(-0.5, 0.86) * swV(dot(w, vec2(-0.26, 0.45)) - uTime * 0.1);
 s += vec2(0.1, -0.6) * swV(dot(w, vec2(0.2, -0.95)) + uTime * 0.14 + 0.27 * s.x) + vec2(0.5, -0.1) * swV(dot(w, vec2(1.3, -0.26)) - uTime * 0.17 + 0.2 * s.y);
 s *= 0.016 * (0.5 + 0.6 * uMid + 1.2 * uMic);
 for (int i = 0; i < 2; i++) {   // the pebble, and the stir of a cue
  float g = i == 0 ? uHits : uCue;
  vec2 c = w - (swB ? vec2(1.5, 0.4) : vec2(-0.6, 0.3)) + float(i) * vec2(2.0, -0.6);
  float r = length(c) + 1e-3, x = (r - (1.0 - g) * 5.0) * 3.2;
  s += c / r * swV(x * 0.3) * swD(x * x) * g * 0.2;
 }
 return s;
}
float swNet(vec2 w) {
 vec2 q = w * 0.52 + 0.11 * vec2(swV(w.y * 0.33 + uTime * 0.11), swV(w.x * 0.38 - uTime * 0.1));
 float n = 1.0 - abs(swV(q.x + 0.1 * swV(q.y * 1.3)) + swV(q.y * 1.1 - 0.08 * swV(q.x * 1.7))) * 0.5;
 return n * n * n * n;
}
// How much sun gets past the toothed rim.
float swRim(vec3 p) {
 vec2 l = swL.xz / swL.y, q = p.xz - l * p.y, a = abs(q);
 float al = a.x > a.y ? q.y : q.x, lr = a.x > a.y ? abs(l.x) : abs(l.y), tooth = max(1.0 - abs(al - swP * floor(al / swP + 0.5)) / (swF + swA), 0.0) * swH * lr;
 return smoothstep(-0.12, 0.12, swS + 0.4 - tooth - max(a.x, a.y));
}
vec3 swSky(vec3 d) {
 return mix(swHz, mix(vec3(0.75, 0.88, 1.05), vec3(0.02, 0.035, 0.09), swNgt), smoothstep(0.1, 0.9, d.y) * 0.6);
}
// Its colour.
vec3 swHue(vec3 o, vec3 d) {
 swOk = 0.0;
 if (swQ == 0) return swSky(d);
 vec3 p = o + d * swT, L = swL, self = vec3(0.0); float px = swPx * swT;
 if (swQ == 6) return mix(swRaw * 0.9 * (swSun * L.y + swAmb), swHz, 1.0 - swD(max(swT - 34.0, 0.0) * 0.06));
 float u = swAx == 0 ? p.z : p.x, Lu = swAx == 0 ? L.z : L.x, Ld = swSg * (swAx == 0 ? L.x : L.z);
 float du = swAx == 0 ? d.z : d.x;
 float v = clamp(p.y + (swK + 1.0) * swH, 0.0, swH), e = swS - swK - swSg * (swAx == 0 ? p.x : p.z);
 float cell = floor(u / swP + 0.5), ul = u - cell * swP, hs = swH / swSt;
 float up = swQ == 2 ? 1.0 : 0.0, nl = max(-Ld, 0.0);
 float side = swQ == 4 ? 1.0 : swQ == 5 ? -1.0 : sign(ul + 1e-5), m = (swF + swA - abs(ul)) / swF * swSt, fm = fract(m), hv = hs * fm;
 bool stp = swQ > 3;
 float gap = (swF + swA - abs(ul)) * swG - v, cap = swQ == 3 ? 1.0 - smoothstep(0.02, 0.45, gap) : 0.0;
 if (stp) swOk = min(min(abs(ul), swF - abs(ul)), min(e, swW - e)) * 0.6;
 if (swQ == 3) { swOk = min(gap * 0.5 - (px < hs * 0.5 ? hs : 0.0), min(v, swH - v)); hv = v - hs * floor(m); stp = hv > 0.0 && px < hs * 0.5; }
 if (stp) {   // into the notch of a step: its tread or its riser
  float dmm = -side * du / swF * swSt, down = max(-d.y, 0.0);
  float share = down / (down + hs * max(dmm, 0.0) + 1e-4);
  float w = px / (hs * 0.8) / max(length(vec2(dmm * hs, d.y)), 0.2), z = swQ == 3 ? step(hv, hs * fm) : sat((fm - share) / max(w, 0.02) + 0.5);
  up = 1.0 - mix(z, 1.0 - share, smoothstep(0.4, 1.1, w)); nl = max(side * Lu, 0.0);
 }
 // the sun, past the next flight, the wall and the rim
 float au = max(abs(Lu), 0.05), del = swP * fract(-sign(Lu + 1e-5) * u / swP), over = v + max(del - swA, 0.0) * L.y / au - swH;
 float e2 = e - del / au * Ld, sun = max(smoothstep(-0.03 - px, 0.03 + px, over), smoothstep(swW - 0.05, swW + 0.1, e2));
 if (swK < 0.0) sun = 1.0;
 if (Ld > 0.0) sun *= smoothstep(-0.1, 0.1, e * L.y / Ld - swH + v);
 float rimK = swRim(p); sun *= rimK;
 float depth = sat(-p.y / (swN * swH));
 float ao = (0.55 + 0.45 * sat(v / swH + 0.3 * up)) * (0.7 + 0.3 * sat(e / swW)) * (1.0 - 0.45 * depth);
 vec3 alb = swRaw;
 // blocks, streaks, lichen
 float blk = hash21(vec2(cell + 31.0 * swSg, swK * 3.0 + floor(v / hs * 0.5)) + float(swAx) * 7.0);
 float grit = noise(vec2(u, p.y) * 9.0 + e * 5.0), st = noise(vec2(u * 1.7 + 9.0, p.y * 0.45 + swSg));
 alb *= 0.82 + 0.16 * blk + 0.3 * (st - 0.4) + 0.12 * (grit - 0.5) * sat(0.12 / px - 0.5);
 float wear = smoothstep(0.62 - 0.35 * uTexture, 0.9, st * 0.75 + 0.25 * grit);
 alb = mix(alb, vec3(0.36, 0.38, 0.2), wear * (0.2 + 0.7 * uTexture));
 float green = max(uOwn[5], 0.0), snow = max(-uOwn[5], 0.0); cap = max(up, cap);
 alb = mix(alb, vec3(0.13, 0.25, 0.06) * (0.6 + 0.8 * grit), green * 0.9 * smoothstep(0.35, 0.8, cap * 0.6 + 0.6 * st + 0.2 * depth));
 alb = mix(alb, vec3(0.9, 0.93, 1.0), snow * 0.95 * smoothstep(0.15, 0.6, cap + 0.35 * (st - 0.5)));
 // wet stone by the water
 alb *= mix(vec3(0.4, 0.47, 0.4), vec3(1.0), smoothstep(0.2, 1.3 + 0.4 * st, (p.y - swY) / swH));
 if (uOwn[7] > 0.0) {   // glazed: a colour to each tier, a paler one on the treads, white joints
  float g5 = swB ? swK + 9.0 : swK, two = mod(cell + g5, 2.0);
  vec3 k = uKind[int(mod(g5, 5.0))], k2 = uKind[int(mod(g5 + 2.0, 5.0))];
  k = mix(k, k2, two * 0.8 * step(2.5, float(swQ)));
  k = mix(k, sat(k * 1.15 + 0.2), up * 0.5);
  alb = mix(alb, k * k * (0.65 + 0.5 * blk + 0.3 * (grit - 0.5)) + 0.02, uOwn[7] * (1.0 - 0.5 * snow * cap) * (1.0 - 0.5 * green * st));
 }
 // the piece stains the stone; each kind warms its own tier
 vec4 pc = piece(vec2(0.5 + 0.46 * u / swS, 0.06 + 0.88 * depth));
 alb = mix(alb, pc.rgb / max(pc.a, 0.05) * (0.35 + 0.45 * dot(alb, vec3(0.33))), 0.55 * sat(pc.a));
 float kt = swB ? swK - 1.0 : (swK - 2.0) * 0.5, ki = floor(kt + 0.01);
 if (swK > 0.5 && ki >= 0.0 && ki < 4.5 && abs(kt - ki) < 0.1) {
  int i = int(ki); float s = swKd(i);
  alb = mix(alb, uKind[i] * (0.3 + 0.7 * dot(alb, vec3(0.5))), 0.42 * s * (0.5 + 0.5 * float(swQ == 3)));
  self += uKind[i] * alb * s * (0.1 + 0.4 * uEnergy) * (swQ == 3 ? 0.9 : 0.25);
 }
 // bands lift columns; feet of light run down a flight
 float gain = 1.0 + 0.4 * band((cell * swP / swS) * 0.5 + 0.5) * (1.0 - up * 0.5);
 float ph = fract(hash11(cell + 5.0) - uTime * 0.045), fd = (1.0 - ph - depth * 1.02) * 16.0, feet = step(0.55, hash11(cell * 1.7 + 2.0)) * swD(fd * fd) * 4.0 * ph * (1.0 - ph);
 self += (stp ? 1.0 : 0.25) * feet * uPhrase * mix(vec3(1.0, 0.8, 0.5), uKind[3], 0.5) * alb * 2.2;
 float lit = mix(nl, L.y, up) * sun;
 // a niche with its lamp
 if (swQ == 3 && px < 0.2) {
  vec2 nq = vec2(abs(ul), v / swH - 0.12);
  float nd = max(nq.x - 0.13, nq.y < 0.2 ? -nq.y * 1.2 : length(vec2(nq.x, (nq.y - 0.2) * 1.2)) - 0.13);
  float ni = swIn(px, nd) * sat(0.2 / px - 1.0);
  lit *= 1.0 - 0.9 * ni; ao *= 1.0 - 0.6 * ni;
  float lamp = step(0.6, hash21(vec2(cell, swK) + swSg)) * (uKeys * 1.2 + swNgt * 0.8);
  self += vec3(2.2, 1.0, 0.3) * lamp * (ni * swD(nq.y * nq.y * 30.0) + 0.14 * swD(nd * nd * 18.0));
 }
 float west = stp ? (swAx == 0 ? 0.3 : -0.8) * side : swAx == 0 ? 0.8 * swSg : -0.3 * swSg;   // how far it faces the lit wall
 vec3 light = swSun * lit + swBnc * sat(0.55 - 0.45 * west * (1.0 - up)) * ao * (1.0 - 0.5 * up);
 // nets of light thrown up from the water
 light += swSun * swNet(vec2(u, p.y + e)) * swD(max(p.y - swY, 0.0) * 0.5) * (0.35 + 0.65 * rimK) * (0.03 + 0.06 * uLevel + 0.5 * uHits + 0.25 * uCue);
 if (uOwn[7] < 0.0) light += swGlo * swD(max(p.y - swY, 0.0) * (swB ? 0.45 : 0.24)) * (0.35 + 0.65 * (1.0 - up)) * (0.75 + 0.5 * swNet(vec2(u, p.y + e)));
 vec3 col = (alb * light + swCool(alb) * (0.42 + 0.55 * up) * ao) * gain + self;
 // the cloth left to dry
 if (!swB && swAx == 1 && swSg > 0.0 && abs(swK - 6.0) < 0.1) {
  float cx = u + 1.0 - 0.06 * swV(v * 0.8), cw = swIn(px, abs(cx) - 0.85) * (swQ == 2 ? 1.0 : swIn(px, 0.1 - v));
  col = mix(col, vec3(0.95, 0.6, 0.03) * (0.75 + 0.25 * swV(cx * 2.0 + v * 0.3)) * (swSun * (0.35 + 0.4 * sun) * max(sun, 0.25) + swAmb), cw);
 }
 return mix(col, swHz, sat(swT * 0.0018 * (0.3 + uSpace)));
}

// The galleries: three storeys of pillars.
const float swFz = 4.6, swHs = 1.5;
vec3 swGal(vec3 o, vec3 d, float t, float yb) {
 vec3 p = o + d * t; float px = swPx * t, X = p.x - 0.6, Y = p.y - yb;
 float j = floor(Y / swHs), y = Y - j * swHs, B = 0.98 * swP * 0.5, bx = X - B * floor(X / B + 0.5);
 vec3 L = swL; float rim = swRim(p), eave = smoothstep(-0.03, 0.03, 1.28 - 0.3 * L.y / max(-L.z, 0.1) - y), st = noise(vec2(X * 3.0, Y * 1.4));
 vec3 alb = swRaw * (0.7 + 0.4 * st), self = vec3(0.0);
 float net = swNet(vec2(X * 1.3, Y * 1.3)) * swD(max(p.y - swY, 0.0) * 0.5) * (0.03 + 0.05 * uLevel + 0.6 * uHits + 0.3 * uCue);
 vec3 lampL = vec3(0.0);
 // a pillar: base, banded shaft, spreading bracket
 float br = sat((y - 0.82) / 0.36), r = 0.105 + 0.34 * br * br * sqrt(br) + 0.07 * swIn(0.03, y - 0.23) + 0.02 * swIn(0.01, abs(abs(y - 0.58) - 0.12) - 0.03);
 float pil = swIn(px, abs(bx) - r), beam = smoothstep(-px, px, y - 1.18);
 float rail = swIn(px, y - 0.3) * step(0.5, j);
 if (j < 0.0 || j > 2.5 || abs(X) > swHf - 0.25) { pil = 1.0; beam = 1.0; }
 float solid = max(max(pil, beam), rail);
 vec3 outC = vec3(0.0), inC = vec3(0.0);
 if (solid > 0.0) {
  float nx = clamp(bx / 0.13, -1.0, 1.0) * (1.0 - beam) * pil, nz = sqrt(max(1.0 - nx * nx, 0.0));
  float nl = max(L.x * nx - L.z * nz, 0.0), sh = rim * mix(eave, 1.0, step(1.28, y));
  float carve = 1.0 - 0.35 * beam * step(y, 1.28) * smoothstep(0.1, 0.3, abs(fract(X * 7.0 / B * 0.5) - 0.5)) * sat(0.06 / px);
  float rl = abs(fract(X * 5.0 / B) - 0.5) * 0.2 + abs(y - 0.15) * 0.5;
  carve *= 1.0 - 0.5 * rail * (1.0 - pil) * swIn(px, rl - 0.075);
  float lip = step(1.28, y) * step(0.0, j);
  if (lip > 0.5) nl = mix(L.y, nl, smoothstep(1.33, 1.4, y));
  carve *= 1.0 - 0.6 * sat(1.0 - abs(y - 1.27) * 33.0) * lip;
  vec3 a2 = alb * mix(vec3(0.4, 0.47, 0.4), vec3(1.0), smoothstep(0.05, 0.7, p.y - swY));
  a2 = mix(a2, vec3(0.9, 0.93, 1.0), max(-uOwn[5], 0.0) * (1.0 - smoothstep(0.0, 0.05, abs(y - 1.34) - 0.05)) * lip);
  a2 = mix(a2, vec3(0.13, 0.25, 0.06), max(uOwn[5], 0.0) * smoothstep(0.45, 0.6, st * 1.2 + 0.3 * lip));
  if (uOwn[7] > 0.0) { vec3 k = uKind[int(mod(j + 5.0 + 2.0 * beam + floor(X / B), 5.0))]; a2 = mix(a2, k * k * (0.6 + 0.5 * st) + 0.02, uOwn[7] * (0.4 + 0.6 * max(beam, rail))); }
  outC = a2 * carve * (swSun * (nl * sh + net) + swBnc + swGlo * swD(max(p.y - swY, 0.0) * 0.5)) + swCool(a2) * carve * (0.6 + 0.2 * nx);
 }
 for (int i = 0; i < 5; i++) {   // each kind has a lamp in its own bay
  vec2 c = i == 0 ? vec2(-2.5, 0.0) : i == 1 ? vec2(1.5, 1.0) : i == 2 ? vec2(-0.5, 2.0) : i == 3 ? vec2(-1.5, 1.0) : vec2(0.5, 0.0);
  float s = swKd(i);
  vec2 w = vec2(X, Y) + d.xy / d.z * 0.6 - vec2(c.x * B, c.y * swHs + 0.8);
  float r2 = dot(w, w);
  vec3 k = mix(vec3(1.0, 0.6, 0.25), uKind[i], 0.65) * s * (0.6 + uEnergy);
  lampL += k * 1.5 * swD(r2 * 2.5);
  self += k * 6.0 * swIn(0.02, sqrt(r2) - 0.05);
 }
 if (solid < 1.0) {   // in under the roof
  vec2 s = d.xy / d.z;
  float zc = s.y > 1e-3 ? (1.2 - y) / s.y : s.y < -1e-3 ? -y / s.y : 1e3;
  float X2 = X + s.x * 0.8, y2 = y + s.y * 0.8, b2 = X2 - B * floor(X2 / B + 0.5), br2 = sat((y2 - 0.82) / 0.36);
  float in2 = swIn(px, abs(b2) - 0.09 - 0.3 * br2 * br2) * step(0.8, zc);
  float z = min(zc, 1.7), X3 = X + s.x * z, y3 = y + s.y * z;
  inC = swCool(alb) * (zc < 1.7 ? 0.4 : 0.25) + alb * (swSun * net * 0.4 + swBnc * 0.3);
  // a niche with a flame for the keys
  vec2 nq = vec2(X3 - B * (floor(X3 / B) + 0.5), y3 - 0.45);
  float ni = swIn(px, max(abs(nq.x) - 0.13, zc < 1.7 ? 9.0 : nq.y < 0.2 ? -nq.y : length(vec2(nq.x, nq.y - 0.2)) - 0.13));
  inC *= 1.0 - 0.7 * ni;
  inC += vec3(2.4, 1.1, 0.35) * (uKeys * 1.2 + swNgt * 0.5) * step(1.7, zc) * swD(dot(nq, nq) * 60.0);
  inC = mix(inC, swCool(alb) * 0.4 + alb * (swBnc * 0.4 + swSun * net * 0.3), in2);
  if (uOwn[7] < 0.0) inC += alb * swGlo * 0.6 * swD(max(p.y - swY, 0.0) * 0.7);
  inC += (alb + 0.1) * lampL + self * (1.0 - in2);
 }
 return mix(inC, outC + alb * lampL * 0.25, solid);
}
vec3 swView(vec2 p) {
 float tr = uTravel * 0.0032, px = 1.0 / uRes.y, f = swB ? 0.8 : 0.95, E = swS + swY / swH - swW, yb = -(swN - 0.2) * swH, gt = 0.0;
 vec3 ro = swB ? vec3(-1.9 + 0.25 * swV(tr), swY + 0.62, -5.0 + 0.3 * swV(tr * 0.8)) : vec3(-4.0 + 1.6 * swV(tr + 0.25), 4.9 + 0.2 * swV(tr * 0.7), -22.6);
 vec2 pitch = swB ? vec2(0.966, -0.2588) : vec2(0.8290, 0.5592), rip = vec2(0.0);
 float yaw = 0.0;
 if (uOwn[6] != 0.0) {
  float o6 = abs(uOwn[6]), a = swB ? mix(-0.2618, uOwn[6] < 0.0 ? -0.10 : -0.02, o6) : mix(0.5934, uOwn[6] < 0.0 ? 1.5 : -0.16, o6);
  pitch = vec2(cos(a), sin(a));
  yaw = swB ? (uOwn[6] < 0.0 ? 3.1416 - 0.42 : 0.1) * o6 : uOwn[6] < 0.0 ? 0.0 : 0.80 * o6;
  vec3 to = swB ? (uOwn[6] < 0.0 ? vec3(0.9 + 0.3 * swV(tr), swY + 1.75, 4.3) : vec3(0.6 + 0.5 * swV(tr), swY + 1.55, -0.55))
   : (uOwn[6] < 0.0 ? vec3(0.5 * swV(tr + 0.25), 13.0 + 0.4 * swV(tr * 0.7), -0.6) : vec3(E * -0.62 + 0.6 * swV(tr + 0.25), swY + 3.4, E * -0.62));
  ro = mix(ro, to, o6);
 }
 vec3 col = vec3(0.0), gw = vec3(0.0), go, gd, was = vec3(0.0);
 vec4 id = vec4(-9.0);
 for (int i = 0; i < 2; i++) {   // the second sample is shaded only where it meets another stone
  bool first = i == 0;
  vec2 q = p + (first ? vec2(-0.25, 0.12) : vec2(0.25, -0.12)) * px;
  vec3 d = normalize(vec3(q.x, q.y * pitch.x - f * pitch.y, q.y * pitch.y + f * pitch.x)), o = ro, tint = vec3(0.0), add = tint, c = tint, w;
  d.xz = mat2(0.995, 0.0998, -0.0998, 0.995) * d.xz;
  if (yaw != 0.0) d.xz = mat2(cos(yaw), -sin(yaw), sin(yaw), cos(yaw)) * d.xz;
  float tw = d.y < -1e-4 ? (swY - ro.y) / d.y : 1e9;
  swPx = px / f; w = ro + d * min(tw, 999.0);
  bool open = false;
  float ring = max(abs(w.x), abs(w.z)) - E;
  if (tw < 999.0 && ring < swW + 0.1 && (!swB || w.z < swFz || abs(w.x - 0.6) > swHf)) {   // the water: its own green, and what it mirrors
   vec3 sky = swSky(vec3(0, swB ? 0.3 : -d.y, 0)); open = ring < 0.0;
   if (first) rip = swRip(w.xz);
   vec2 sl = rip * (swB ? 1.0 / (1.0 + 0.25 * tw) : 0.45);
   float fd = 1.0 - sat(-d.y), fr = swB ? 0.12 + 0.8 * fd * fd * fd : 0.2, rim = swRim(w);
   vec3 deep = mix(vec3(0.03, 0.15, 0.065), vec3(0.01, 0.025, 0.03), swNgt);
   tint = vec3(0.7, 0.92, 0.78) * fr * (1.0 - 0.5 * uCue);
   if (uOwn[7] < 0.0) deep = mix(deep, swGlo * (0.35 + 0.35 * swNet(w.xz * 0.8)) * (0.6 + 0.4 * swD(dot(w.xz, w.xz) * (swB ? 0.02 : 0.05))), -0.9 * uOwn[7]);
   add = deep * (1.0 - fr) * (0.4 + rim * (1.0 + min(uOwn[7], 0.0)) - 0.6 * min(uOwn[7], 0.0)) + sky * uCue * (swB ? 0.2 * swD(abs(w.z - 1.0) * 0.5) : 0.4);
   float rg = (length(w.xz - vec2(-0.6, 0.3)) - (1.0 - uHits) * 5.0) * 2.4;
   if (!swB) add += (sky * 0.4 + swSun * 0.12) * uHits * swD(rg * rg);
   vec2 lf = w.xz - (swB ? vec2(-1.2, -1.4) : vec2(0.6, -1.0)) - vec2(0.4 * swV(uTime * 0.005), 0.3 * swV(uTime * 0.0037));
   lf = mat2(0.82, 0.57, -0.57, 0.82) * lf * (swB ? 3.0 : 1.0);
   float lm = swIn(0.04, length(lf * vec2(1.0, 2.2)) - 0.34);   // a leaf
   add = mix(add, vec3(0.75, 0.3, 0.06) * (swSun * 0.4 * (0.3 + rim) + swAmb), lm); tint *= 1.0 - lm;
   c = mix(sky, swRaw * (swAmb * 0.5 + swSun * 0.35 * rim) * (swB ? 0.45 : 1.0), swB ? 1.0 : smoothstep(-1.0, 3.0, w.z));
   if (open) { d = reflect(d, normalize(vec3(-sl.x, 1.0, -sl.y))); d.y = max(d.y, 0.01); o = vec3(w.x, swY + 0.01, w.z); swPx *= swB ? 1.5 : 6.0; tw = 1e9; }
  }
  float tf = swB && d.z > 1e-3 ? (swFz - o.z) / d.z : -1.0; vec3 g = o + d * max(tf, 0.0), k = open ? tint : vec3(1.0);
  if (tf > 0.0 && abs(g.x - 0.6) < swHf && g.y < yb + 3.0 * swHs + max(0.0, 0.3 - abs(fract(g.x * 2.0) - 0.5) * 0.55)) {
   if (gt == 0.0) { go = o; gd = d; gt = tf; }
   gw += k; col += open ? add : vec3(0.0);
   continue;
  }
  swTrace(o, d);
  if (swT > tw && swQ != 6 && tint.x + add.x > 0.0) { col += c * tint + add; continue; }
  vec4 now = vec4(float(swQ * 2 + swAx) + (open ? 20.0 : 0.0), swK, swC, swSg);
  if (now != id) { was = swHue(o, d); id = now; }
  c = was * k + (open ? add : vec3(0.0)); col += c;
  if (first && swOk > swPx * swT) { col += c; break; }
 }
 if (gt > 0.0) { swPx = px / f; col += gw * swGal(go, gd, gt, yb); }
 col = screenOf(col * 0.5);
 if (swB && uOwn[6] < 0.0) {   // the pillars we look out between, in their own shade
  vec2 q = p * mix(0.2, 1.0, -uOwn[6]) + vec2(-0.16 - 0.39 * (1.0 + uOwn[6]) - 0.03 * swV(tr), 0.5);
  float B = 0.78, bx = q.x - B * floor(q.x / B + 0.5), y = q.y * 1.26, br = sat((y - 0.80) / 0.36), st = noise(q * vec2(9.0, 5.0)), gr = 0.5 * noise(q * vec2(150.0, 110.0)) + 0.5 * noise(q * 37.0);
  float r = 0.062 + 0.31 * br * br * sqrt(br) + 0.028 * swIn(0.012, y - 0.2) + 0.02 * swIn(0.004, y - 0.12) + 0.010 * swIn(0.004, abs(abs(y - 0.55) - 0.09) - 0.02);
  float pil = swIn(px, abs(bx) - r), beam = swIn(px, 1.17 - y), rl = abs(fract(q.x * 8.0 / B) - 0.5) * 0.08 + abs(y - 0.085) * 0.35, rail = swIn(px, y - 0.145) * max(swIn(px, rl - 0.032), swIn(px, 0.112 - y));
  float nx = clamp(bx / 0.075, -1.0, 1.0), edge = pil * (1.0 - beam), carve = 1.0 - 0.4 * beam * smoothstep(0.1, 0.3, abs(fract(q.x * 14.0 / B) - 0.5));
  vec3 sa = mix(swRaw * (0.6 + 0.5 * st + 0.3 * gr), vec3(0.13, 0.25, 0.06), max(uOwn[5], 0.0) * smoothstep(0.5, 0.75, st));
  if (uOwn[7] > 0.0) { vec3 k = uKind[int(mod(floor(y * 9.0) + 2.0, 5.0))]; sa = mix(sa, k * k * 0.8 + 0.02, 0.7 * uOwn[7]); }
  vec3 li = swAmb * 0.10 + swBnc * (0.5 + 0.5 * swNet(q * 3.0)) + swSun * edge * 0.30 * smoothstep(0.55, 1.0, -nx) + swAmb * edge * 0.25 * smoothstep(0.6, 1.0, nx) + swGlo * 0.17 * (1.0 - 0.8 * y);
  for (int i = 0; i < 5; i++) li += uKind[i] * swKd(i) * 0.10 * swD((q.x - 0.8 + 0.4 * float(i)) * (q.x - 0.8 + 0.4 * float(i)) * 12.0) * (0.5 + uEnergy);
  li += vec3(1.6, 0.8, 0.25) * (uKeys + 0.35 * swNgt) * swD(dot(vec2(bx, y - 0.95), vec2(bx, y - 0.95)) * 20.0) * 0.5;
  col = mix(col, screenOf(sa * carve * li * 0.8), max(max(pil, beam), rail));
 }
 if (!swB && abs(uOwn[6]) < 0.9) {   // the near parapet, dark in its own shade
  vec2 q = mat2(0.921, 0.389, -0.389, 0.921) * (p - vec2(-0.6 + 0.02 * swV(tr + 0.25), -0.45 - 1.2 * abs(uOwn[6])));
  float g = noise(q * vec2(34.0, 60.0)), g2 = noise(q * 11.0 + 3.0);
  // a worn coping, and the wall under it
  float e = q.y - 0.012 - 0.006 * noise(vec2(q.x * 26.0, 4.0)) - 0.05 * swIn(0.004, abs(q.x + 0.17) - 0.085) - 0.035 * swIn(0.004, abs(q.x + 0.17) - 0.045);
  if (e < 0.01) {
   float wall = 1.0 - smoothstep(-0.052, -0.048, q.y), joint = abs(fract(q.x * 5.0 + 0.5 * floor(q.y * 16.0)) - 0.5) * 0.2;
   vec3 stone = swRaw * (0.5 + 0.4 * g + 0.4 * g2) * (1.0 - 0.5 * wall * (1.0 - smoothstep(0.001, 0.005, min(joint, abs(fract(q.y * 16.0) - 0.5) * 0.06))));
   stone = mix(stone, vec3(0.8, 0.84, 0.95), max(-uOwn[5], 0.0) * (1.0 - wall) * smoothstep(-0.04, -0.015, e));
   vec3 li = vec3(dot(swAmb, vec3(0.1))) + swAmb * 0.06 + swBnc * 0.4;
   li *= (1.0 - 0.5 * wall);
   li += swSun * 0.22 * smoothstep(-0.012, 0.0, e) * (0.3 + 0.7 * g) * step(0.0, q.y + 0.01);
   col = mix(col, screenOf(stone * li), swIn(px, e));
  }
 }
 return col;
}
vec3 render(vec2 p) {
 swB = uVar > 0.5;
 float hour = uOwn[0], late = max(hour, 0.0);
 swNgt = max(-hour, 0.0);
 swH = 1.2 * (1.0 + 0.3 * uOwn[4]);
 swP = 1.9 - uOwn[3] * (0.8 - 0.17 * uOwn[3]);
 swF = 0.5 * swP - 0.13; swG = swH / swF;
 swS = swB ? 15.0 : 22.0; swN = swB ? 9.0 : 17.0;
 float cue = 4.0 * uCue * (1.0 - uCue), fill = smoothstep(0.05, 0.95, 0.6 * uDrone + 0.4 * uPad) * 1.8;
 fill += uOwn[2] * (uOwn[2] < 0.0 ? 3.0 : 5.0);
 if (swB) fill *= 0.28;
 swY = -(swN - fill - 0.25 * swV(uTime * 0.008) - 0.4 - (swB ? 0.2 : 0.5) * cue) * swH;
 float turn = 0.1 * swV(uTime * 0.002) + 0.16 * (uPad - 0.4) + 0.05 * cos(TAU * uLoop);
 swL = normalize(vec3((swB ? -0.95 : -0.75) - 0.5 * turn - 0.25 * late, 0.58 - 0.12 * late, -0.3 + 0.3 * turn));
 swSun = mix(mix(vec3(3.3, 2.65, 1.85), vec3(4.4, 2.0, 0.8), late), vec3(0.4, 0.55, 0.85), swNgt) * (0.85 + 0.3 * uTone);
 swAmb = mix(mix(vec3(0.06, 0.22, 0.74), vec3(0.3, 0.2, 0.46), late), vec3(0.03, 0.05, 0.13), swNgt);
 swBnc = swSun * vec3(0.05, 0.032, 0.018);
 swRaw = mix(vec3(0.74, 0.46, 0.19), uOwn[1] < 0.0 ? vec3(0.84, 0.81, 0.76) : vec3(0.42, 0.12, 0.08), abs(uOwn[1]));
 swHz = mix(mix(vec3(1.9, 1.75, 1.45), vec3(1.8, 0.85, 0.5), late), vec3(0.04, 0.06, 0.13), swNgt);
 swHf = 2.0 * 0.98 * swP + 0.13;
 swGlo = uOwn[7] < 0.0 ? -uOwn[7] * (uKind[1] * uKind[1] * 1.6 + 0.04) * (0.55 + 0.7 * uPad + 0.3 * uLevel) * mix(1.8, 1.0, swNgt) : vec3(0.0);
 return swView(p);
}
