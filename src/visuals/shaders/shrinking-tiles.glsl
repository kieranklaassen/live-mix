// name: Shrinking tiles
// a: Cut leaves round
// b: Glass cap
// what: A round of pale paper cut into curved leaves over a dark green sheet, large in the middle and smaller and smaller towards a rim they never reach; the frame cuts the round; or a cap of clear glass cased in cobalt on a table, the same leaves cut through the colour, their shadows seen through the glass.
// follows: All of it slides slowly through itself, faster as the music fills, and sways with the loop. Drone and pad ink the two sorts of dark leaf, the piece inks those at its place, texture and phrase tint the light ones. The bands light rings towards the rim. A hit colours a few leaves, a cue sends a ring of shade to the rim, keys gild the veins.
const float siC = 1.1892071, siW = 0.6435943, siM = 0.5456129, siA = 0.6435943; // the mirror circle (middle, radius), the side corner, the leaf's length
const float siStep = 4.8969049; // sliding this far lays the leaves on themselves
const vec2 siL = vec2(-0.6, 0.8);
vec2 siMul(vec2 a, vec2 b) { return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x); }
vec2 siDiv(vec2 a, vec2 b) { return vec2(a.x * b.x + a.y * b.y, a.y * b.x - a.x * b.y) / max(dot(b, b), 1e-9); }
vec2 siConj(vec2 a) { return vec2(a.x, -a.y); }
struct SiLeaf {
  float tone;  // 1 light, -1 dark
  float kind;  // 0 or 1, which of the two sorts of its tone
  float edge;  // how far inside its own edge, in the disc's units
  float rib, ribs; // how far from the middle vein, and from the side veins, with their own widths taken off
  float side;  // across it, from the middle vein
  float small; // how small leaves are here
  vec2 mid;    // where the leaf's middle lies in the disc
  vec2 out2;   // which way its left side points
};
vec2 siGoA, siGoB; // how the tiling lies in the disc now: one slide, as two complex numbers
void siSet(float t, vec2 off, float turn) {
  // turn the disc, set it off its middle, and slide it along one line of the tiling
  vec2 e = vec2(cos(turn * 0.5), sin(turn * 0.5));
  float k = inversesqrt(max(1.0 - dot(off, off), 0.01));
  vec2 a1 = k * e, b1 = k * siMul(off, siConj(e));
  float c = cosh(0.5 * t), s = sinh(0.5 * t);
  siGoA = c * a1 + s * siConj(b1);
  siGoB = c * b1 + s * siConj(a1);
}
// The cut edges bend, so that each leaf leans round its neighbour.
vec2 siEdges(vec2 w, float chir) {
  float t1 = sat(w.x / siM), psi = atan(w.y, siC - w.x), t2 = sat(psi / (PI / 8.0));
  float h1 = 0.085 * sin(PI * t1) * (0.35 + t1) ;
  float h2 = -0.05 * sin(PI * t2);
  return vec2(w.y - chir * h1, length(w - vec2(siC, 0.0)) - siW - chir * h2);
}
// The veins of a half leaf: along it (0 stem, 1 tip), across it, and how far from the middle vein and from the side veins.
vec4 siVeins(vec2 w, float chir, float near) {
  vec2 q = siMul(w, vec2(cos(PI / 8.0), -sin(PI / 8.0)));
  float s = 1.0 - q.x / siA, v = q.y * chir - 0.45 * s * (1.0 - s) * (s - 0.2); // the middle vein bends with the leaf
  float lat = abs(v) / siA, c = (s - 0.7 * lat - 0.5 * lat * lat) * 9.0, cell = floor(c);
  vec2 d = siEdges(siMul(siConj(w), vec2(cos(PI / 4.0), sin(PI / 4.0))), -chir); // the edges of the other half
  float room = min(near, min(abs(d.x), abs(d.y))) - 0.014;
  float wide = min(0.0054, 0.14 * room) + (room < 0.0 || cell < -0.5 || cell > 7.5 ? -1.0 : 0.0);
  return vec4(s, v / siA, abs(v) - mix(0.011, 0.002, sat(s)), abs(fract(c) - 0.5) * siA * 0.085 - wide);
}
// Which leaf lies at z: the disc is folded by its mirrors down to one half leaf.
SiLeaf siFind(vec2 z) {
  SiLeaf o;
  vec2 a = siGoA, b = siGoB;
  vec2 w = siDiv(siMul(a, z) + b, siMul(siConj(b), z) + siConj(a));
  float chir = 1.0, cr = 1.0, cs = 1.0; // handedness, and the two counts that make the tones
  for (int i = 0; i < 14; i++) {
    float k = floor(atan(w.y, w.x + 1e-7) / (PI / 4.0) + 0.5), h = -k * PI / 8.0;
    vec2 e = vec2(cos(h), sin(h));
    w = siMul(w, siMul(e, e)); a = siMul(a, e); b = siMul(b, e);
    if (mod(k, 2.0) > 0.5) cr = -cr;
    if (w.y < 0.0) { w.y = -w.y; a.y = -a.y; b.y = -b.y; chir = -chir; cr = -cr; }
    vec2 f = siConj(w) - vec2(siC, 0.0);
    float l = dot(f, f);
    if (l >= siW * siW) break;
    w = vec2(siC, 0.0) + siW * siW * siConj(f) / max(l, 1e-6);
    vec2 a2 = siMul(vec2(0.0, siC), siConj(a)) - siMul(vec2(0.0, 1.0), b);
    vec2 b2 = siMul(vec2(0.0, siC), siConj(b)) - siMul(vec2(0.0, 1.0), a);
    a = a2 / siW; b = b2 / siW; chir = -chir; cs = -cs;
  }
  // past a bent edge: it is the neighbour's
  vec2 d = siEdges(w, chir);
  float near = min(abs(d.x), abs(d.y));
  if (d.y < 0.0) {
    vec2 f = siConj(w) - vec2(siC, 0.0);
    w = vec2(siC, 0.0) + siW * siW * siConj(f) / max(dot(f, f), 1e-6);
    vec2 a2 = siMul(vec2(0.0, siC), siConj(a)) - siMul(vec2(0.0, 1.0), b);
    vec2 b2 = siMul(vec2(0.0, siC), siConj(b)) - siMul(vec2(0.0, 1.0), a);
    a = a2 / siW; b = b2 / siW; chir = -chir; cs = -cs;
  }
  if (d.x < 0.0) { w.y = -w.y; a.y = -a.y; b.y = -b.y; chir = -chir; cr = -cr; }
  o.small = max(1.0 - dot(z, z), 0.0);
  float toDisc = o.small / max(1.0 - dot(w, w), 0.05);
  o.tone = cr * cs; o.kind = 0.5 + 0.5 * cr;
  o.edge = near * toDisc;
  vec4 ve = siVeins(w, chir, near);
  o.side = ve.y; o.rib = ve.z * toDisc; o.ribs = ve.w * toDisc;
  // back to the disc
  vec2 e = vec2(cos(PI / 8.0), sin(PI / 8.0)), w0 = 0.6 * siA * e;
  o.mid = siDiv(siMul(siConj(a), w0) - b, a - siMul(siConj(b), w0));
  vec2 zc = chir > 0.0 ? z : siConj(z), g = siMul(siConj(b), zc) + siConj(a);
  vec2 n = siMul(vec2(-e.y, e.x) * chir, siMul(g, g)); // the way v grows
  if (chir < 0.0) { n = siConj(n); o.mid = siConj(o.mid); }
  o.out2 = n / max(length(n), 1e-5);
  return o;
}
// Only the tone at z: how far inside (over 0) or outside (under 0) a light leaf it is. For what a leaf's shadow falls on.
float siTone(vec2 z) {
  vec2 w = siDiv(siMul(siGoA, z) + siGoB, siMul(siConj(siGoB), z) + siConj(siGoA));
  float chir = 1.0, tone = 1.0;
  for (int i = 0; i < 12; i++) {
    float k = floor(atan(w.y, w.x + 1e-7) / (PI / 4.0) + 0.5), h = -k * PI / 4.0;
    w = siMul(w, vec2(cos(h), sin(h)));
    if (mod(k, 2.0) > 0.5) tone = -tone;
    if (w.y < 0.0) { w.y = -w.y; chir = -chir; tone = -tone; }
    vec2 f = siConj(w) - vec2(siC, 0.0);
    float l = dot(f, f);
    if (l >= siW * siW) break;
    w = vec2(siC, 0.0) + siW * siW * siConj(f) / max(l, 1e-6);
    chir = -chir; tone = -tone;
  }
  vec2 d = siEdges(w, chir);
  vec2 o = siEdges(siMul(siConj(w), vec2(cos(PI / 4.0), sin(PI / 4.0))), -chir); // the other half's edges, so that no seam runs down the middle
  return tone * sign(d.x) * sign(d.y) * min(min(abs(d.x), abs(d.y)), min(abs(o.x), abs(o.y))) * max(1.0 - dot(z, z), 0.0) / max(1.0 - dot(w, w), 0.05);
}
// A colour brought to the depth of an ink.
vec3 siDeep(vec3 c, float l) { c = mix(c, vec3(dot(c, vec3(0.3, 0.6, 0.1))), 0.15); return c * l / max(dot(c, vec3(0.3, 0.6, 0.1)), 0.12); }
// The ink or the glass of a dark leaf: its own sort's kind of sound, and the piece where it lies (the loop across, the room down).
vec3 siInk(SiLeaf f, vec2 at, vec3 base, float l, float ring) {
  vec3 c = mix(base, siDeep(f.kind < 0.5 ? uKind[0] : uKind[1], l), 0.75 * (f.kind < 0.5 ? uDrone : uPad));
  vec4 m = piece(vec2(0.5 + at.x / 1.7, 0.5 - at.y / 1.1));
  c = mix(c, siDeep(m.rgb / max(m.a, 0.05), l * 1.15), sat(m.a * (0.7 + uEnergy)) * 0.85);
  return c * (1.0 + (0.3 + 0.6 * uEnergy) * ring);
}
float siRing(float r) { return band(0.36 * atanh(min(r, 0.96))); } // rings towards the rim are the bands
float siCue(float r) { // the cue: a ring of shade runs from the middle out to the rim
  float w = 2.0 * atanh(min(r, 0.995)) - 5.5 * (1.0 - uCue);
  return smoothstep(0.0, 0.25, uCue) * exp(-w * w * 2.2);
}
const vec3 siGold = vec3(0.85, 0.58, 0.2);
vec3 siPaper(vec2 p) {
  // a round of cut paper, its middle left of the picture's and the frame cutting it
  const float R = 0.78;
  const vec2 C = vec2(-0.3, -0.13);
  vec2 z = (p - C) / R;
  float px = 1.0 / (uRes.y * R), r = length(z), lift = 1.0 + 0.6 * uMic;
  float g = noise(p * vec2(160.0, 420.0)) * 0.5 + noise(rot(0.7) * p * vec2(700.0, 90.0)) * 0.5 - 0.5;
  vec3 ground = vec3(0.86, 0.66, 0.56), ivory = vec3(0.955, 0.925, 0.86), deep = vec3(0.075, 0.215, 0.205);
  ground *= 1.0 + 0.06 * g;
  float depth = mix(0.010, 0.022, uSpace) * lift;
  // the edges of the two sheets, cut by hand
  float an = atan(z.y, z.x + 1e-6) * 60.0 / PI, i = floor(an), fa = fract(an);
  float cutA = 1.012 + 0.004 * mix(hash11(i + 60.0), hash11(mod(i + 61.0, 120.0)), fa), cutB = 1.034 + 0.006 * mix(hash11(i + 260.0), hash11(mod(i + 61.0, 120.0) + 200.0), fa);
  // the round's shadow on the ground
  vec2 zs = z + siL * depth * 1.3;
  ground *= 1.0 - 0.5 * (1.0 - smoothstep(1.012, 1.045, length(zs))) - 0.14 * (1.0 - smoothstep(1.0, 1.14, length(zs)));
  if (r > 1.06) return ground;
  const vec2 hub = vec2(0.18, -0.02);
  float c = sat(uHits), kick = 4.0 * c * (1.0 - c);
  vec2 dz = z - hub, zz = z - 0.035 * kick * dz * exp(-dot(dz, dz) * 8.0);
  vec3 col = ivory;
  if (r < 0.999) {
    SiLeaf f = siFind(zz);
    float fine = f.small / px, far = smoothstep(4.0, 16.0, fine);
    float ring = siRing(length(f.mid)), swell = 0.011 * ring * (0.4 + uEnergy) * f.small;
    float top = smoothstep(-px, px, f.edge * f.tone + swell);
    float vein = max((1.0 - smoothstep(-px, px, f.rib)), (1.0 - smoothstep(-px, px, f.ribs)) * smoothstep(18.0, 50.0, fine));
    vein *= smoothstep(0.0, 2.0 * px, f.edge);
    vec3 ink = siInk(f, f.mid * R + C, deep, 0.2, ring);
    // the shadow of the upper sheet on the lower one
    float off = depth * min(1.0, f.small * 1.6), soft = mix(0.95, 0.3, uTone) * off + px;
    float sh = smoothstep(-soft, soft, siTone(zz + siL * off) + swell);
    // each leaf is creased down its middle: one half takes the light
    float lit = dot(f.out2, siL) * (f.side > 0.0 ? 1.0 : -1.0), crease = exp(-abs(f.side) * 5.0);
    vec3 blush = f.kind < 0.5 ? uKind[2] : uKind[3];
    vec3 sheet = mix(ivory, ivory * (0.62 + 0.5 * blush), 0.5 * (f.kind < 0.5 ? uTexture : uPhrase));
    sheet *= 1.0 + lit * (0.045 + 0.09 * crease) * (0.8 + 0.6 * ring) - 0.02;
    // a hit: the leaves round one place take its colour
    vec2 dm = f.mid - hub;
    float h = 0.9 * uHits * exp(-dot(dm, dm) * 9.0);
    sheet = mix(sheet, sheet * (0.35 + 0.75 * uKind[4]), h);
    ink = mix(ink, siDeep(uKind[4], 0.36), h);
    vec3 under = ink * (1.0 + 0.35 * lit * crease) * (1.0 - 0.6 * sh);
    float over = mix(top, 1.0 - top, vein);
    under += siGold * vein * uKeys * 0.55 * step(0.0, f.tone);
    sheet = mix(sheet, siGold, vein * uKeys * 0.6 * step(f.tone, 0.0));
    col = mix(mix(deep * 1.3, ivory, 0.5), mix(under, sheet, over), far);
  }
  // the lower sheet's margin, in the upper one's shadow
  float ma = (1.0 - smoothstep(-px, px, r - cutA));
  col = mix(deep * (1.0 - 0.5 * (1.0 - smoothstep(-0.004, 0.012, length(zs) - cutA))), col, ma);
  col *= (1.0 + 0.04 * g) * (1.0 - 0.5 * siCue(r));
  return mix(ground, col, (1.0 - smoothstep(-px, px, r - cutB)));
}
// The dome flattened to the disc.
vec2 siFlat(vec3 h) { return h.xy * mix(1.0 / (1.0 + max(h.z, 0.0)), 1.0, 0.55) * 0.999; }
// What light through the dome at h (a point of the half ball) is coloured by.
vec3 siTint(vec3 h, float soft, vec3 base) {
  vec2 z = siFlat(h);
  float e = siTone(z), far = smoothstep(0.02, 0.2, 1.0 - dot(z, z));
  return mix(base, vec3(1.0), mix(0.4, smoothstep(-soft, soft, e), far));
}
vec3 siGlass(vec2 p) {
  // a solid cap of glass on a table, cased in colour, the leaves cut through the colour
  const float R = 0.64, sT = 0.82, cT = 0.572;
  const vec2 C = vec2(-0.2, -0.17);
  vec2 q = (p - C) / R;
  float px = 1.0 / (uRes.y * R), r = length(q);
  vec3 L = normalize(vec3(-0.55, 0.42, 0.74)), D = vec3(0.0, -cT, sT);
  vec3 base = vec3(0.03, 0.12, 0.33);
  vec3 stain = mix(mix(base, siDeep(uKind[1], 0.18), 0.4 * uPad), siDeep(uKind[0], 0.18), 0.45 * uDrone); // the colour of its shadows
  float g = noise(p * vec2(330.0, 90.0)) * 0.5 + noise(p * vec2(80.0, 380.0)) * 0.5 - 0.5;
  // the table, and what the dome does to the light on it
  vec2 t = vec2(q.x, q.y / sT);
  vec3 wood = vec3(0.895, 0.85, 0.785) * (1.0 + 0.05 * g);
  vec3 T3 = vec3(t, 0.0);
  float tb = dot(T3, L), miss = dot(t, t) - tb * tb, s = sqrt(max(1.0 - r * r, 0.0));
  float sh = (1.0 - smoothstep(0.86, 1.08, sqrt(max(miss, 0.0)))) * smoothstep(0.0, 0.25, -tb);
  vec3 entry = T3 + L * (-tb - sqrt(max(1.0 - miss, 0.0)));
  vec3 thrown = siTint(entry, mix(0.12, 0.04, uTone), stain * 1.8 + 0.12);
  vec3 col = wood * mix(vec3(1.0), thrown * (0.5 + mix(0.4, 0.8, uSpace) * exp(-miss * 2.5)), sh * 0.9);
  col *= 1.0 - 0.3 * (1.0 - smoothstep(0.0, 0.09, length(t) - 1.0));
  float hz = r < 1.0 ? q.y * cT + s * sT : -1.0;
  if (hz <= 0.0) return col;
  vec3 table = col;
  vec3 h = vec3(q.x, q.y * sT, q.y * cT) + D * s;
  vec2 z = siFlat(h);
  SiLeaf f = siFind(z);
  float pz = px * 0.85 / max(s, 0.12), fine = f.small / pz, far = smoothstep(4.0, 16.0, fine);
  float ring = siRing(length(f.mid)), e = f.edge * f.tone;
  // through the glass to the table under it, where the same leaves lie as light
  vec3 rd = refract(-D, h, 0.66), b = h - rd * (h.z / min(rd.z, -0.05));
  float bb = dot(b, L), b2 = dot(b.xy, b.xy);
  vec3 ex = b + L * (-bb + sqrt(max(1.0 - b2 + bb * bb, 0.0)));
  vec3 through = wood * siTint(ex / max(length(ex), 0.1), mix(0.07, 0.02, uTone), stain * 1.8 + vec3(0.36, 0.38, 0.4));
  float cc = length(b.xy + L.xy * 0.7);
  through *= 0.98 + (0.5 + 0.3 * uLevel) * exp(-cc * cc * mix(6.0, 3.0, uSpace));
  through *= 1.0 - 0.35 * smoothstep(0.75, 1.0, sqrt(b2));
  vec3 ink = siInk(f, f.mid * R + C, base, 0.19, ring);
  float vein = max((1.0 - smoothstep(-pz, pz, f.rib)), (1.0 - smoothstep(-pz, pz, f.ribs)) * smoothstep(18.0, 50.0, fine)) * smoothstep(0.0, 2.0 * pz, f.edge);
  float top = smoothstep(-pz, pz, e);
  // the clear leaves are faintly frosted, with the colour of the texture or of the phrase in the frost
  vec3 frost = mix(vec3(0.93, 0.95, 0.95), f.kind < 0.5 ? uKind[2] : uKind[3], 0.55 * (f.kind < 0.5 ? uTexture : uPhrase));
  float bloom = 0.1 + 0.22 * (f.kind < 0.5 ? uTexture : uPhrase) + 0.25 * (1.0 - smoothstep(0.0, 0.08, f.edge / max(f.small, 0.01)));
  vec3 clear = mix(through * vec3(0.96, 0.98, 0.97), frost * 0.9, bloom);
  vec3 cased = through * ink * 1.1 + ink * 0.42;
  // a hit lights the leaves round one place from inside, in its own colour
  vec2 dm = f.mid - vec2(0.05, -0.1);
  float hi = uHits * exp(-dot(dm, dm) * 8.0);
  cased += uKind[4] * 0.55 * hi; clear = mix(clear, uKind[4] * 0.85 + 0.22, 0.75 * hi);
  cased = mix(cased, mix(vec3(0.82, 0.85, 0.86), siGold * 1.1, uKeys * 0.8), vein * 0.8);
  clear = mix(clear, mix(clear * 0.62 + base * 0.2, siGold * 0.8, uKeys * 0.8), vein * 0.7);
  col = mix(mix(cased, clear, 0.4), mix(cased, clear, top), far);
  // the cut's slope: one side catches the window, the other is dark
  float wide = 0.012 * f.small + 1.5 * pz, step2 = 0.004 * f.small + pz;
  float gl = clamp((siTone(z + siL * step2) - e) / step2, -1.0, 1.0) * (1.0 - smoothstep(0.2 * wide, wide, abs(e))) * far;
  col += gl > 0.0 ? vec3(0.2) * gl : col * 0.6 * gl;
  // light from above left over the round of it, and what the glass gathers low down on the far side
  col *= 0.82 + 0.26 * dot(h, L);
  float hl = length(h.xy), lo = sat(-dot(h.xy, L.xy) / max(hl * length(L.xy), 0.05));
  col += vec3(0.4, 0.38, 0.33) * lo * lo * smoothstep(0.62, 0.9, hl) * (1.0 - smoothstep(0.93, 1.0, hl)) * (0.5 + 0.5 * top) * (0.7 + 0.5 * uLevel);
  col *= 1.0 - 0.5 * siCue(min(length(z), 0.98));
  // the room in the rim, and the window with its bars
  vec3 rf = reflect(-D, h), wn = normalize(vec3(-0.82, 0.16, 0.6)), wu = normalize(vec3(0.16, 0.82, 0.0)), wv = cross(wn, wu);
  col = mix(col, vec3(0.80, 0.83, 0.85) * (0.6 + 0.4 * sat(rf.z)), 0.03 + 0.8 * pow(1.0 - s, 4.0));
  vec2 wq = vec2(dot(rf, wu), dot(rf, wv));
  vec2 wa = (1.0 - smoothstep(vec2(0.2, 0.28), vec2(0.25, 0.33), abs(wq))) * smoothstep(0.008, 0.022, abs(wq));
  col += vec3(0.95, 0.97, 1.0) * wa.x * wa.y * step(0.0, dot(rf, wn)) * (0.42 + 0.3 * uMic) * (0.75 + 0.6 * wq.x);
  return mix(table, col, (1.0 - smoothstep(1.0 - 2.0 * px, 1.0, r)) * smoothstep(0.0, 2.0 * px, hz));
}
vec3 render(vec2 p) {
  siSet(siStep * (fract(uTravel * 0.0038) - 0.5), vec2(0.1, 0.22), 0.4 + 0.05 * sin(TAU * uLoop));
  vec3 col = uVar < 0.5 ? siPaper(p) : siGlass(p);
  return col * (1.05 - 0.11 * length(p - vec2(-0.6, 0.45))); // daylight from the upper left
}
