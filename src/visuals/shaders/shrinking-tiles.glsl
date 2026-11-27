// name: Shrinking tiles
// a: Cut leaves round
// b: Glass cap
// what: A round of pale paper cut into curved leaves over a dark green sheet, large in the middle and smaller and smaller towards a rim they never reach; the frame cuts the round; or a cap of clear glass cased in cobalt on a table, the same leaves cut through the colour, their shadows seen through the glass.
// follows: All of it slides slowly through itself, faster as the music fills, and sways with the loop. Drone and pad ink the two sorts of dark leaf, the piece inks those at its place, texture and phrase tint the light ones. The bands light rings towards the rim. A hit colours a few leaves, a cue sends a ring of shade to the rim, keys gild the veins.
// own: 0 the plane they lie in: 1 they shrink down to one straight edge, -1 a long band, small along both sides (b: the eye, 1 straight above it, -1 low beside it); 1 their cut: 1 lobed as oak leaves, -1 straight, a mosaic; 2 what is on them: 1 rings inlaid along the edge, -1 rows of dots; 3 the stuff: 1 leaded glass with a lamp behind it, -1 glazed pillows; 4 1 dyed in the colours of the sounds, the wall in the hits', -1 white plaster all over; 5 1 the whole of it, small and alone, -1 so near that a few leaves fill the frame; 6 1 the sheets lie far apart and throw deep shadows (b: deep cuts), -1 drawn in line alone; 7 1 all of it whirled, -1 pierced: the dark leaves are holes with an evening sky behind
#define ss smoothstep
const float siC = 1.1892071, siW = 0.6435943, siM = 0.5456129, siA = 0.6435943; // the mirror circle (middle, radius), the side corner, the leaf's length
const float siStep = 4.8969049; // sliding this far lays the leaves on themselves
const vec2 siL = vec2(-0.6, 0.8);
vec2 siMul(vec2 a, vec2 b) { return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x); }
vec2 siDiv(vec2 a, vec2 b) { return vec2(a.x * b.x + a.y * b.y, a.y * b.x - a.x * b.y) / max(dot(b, b), 1e-9); }
vec2 siConj(vec2 a) { return vec2(a.x, -a.y); }
float siUp(float x) { return max(x, 0.0); }
vec2 siJ = vec2(1.0, 0.0), siLz = vec2(-0.6, 0.8); // how the plane lies to the disc here, and where the light is from there
vec2 siTwist(vec2 z, float way) {
 if (uOwn[7] <= 0.0) return z;
 float k = siUp(1.0 - dot(z, z));
 return rot(way * uOwn[7] * 1.9 * k * k) * z;
}
// From the picture's plane (in discs) to the disc, where the plane is a half plane or a band; and back.
vec2 siPlane(vec2 w) {
 vec2 z = w;
 if (uOwn[0] > 0.0) {
  float k = 1.0 - uOwn[0], c = mix(0.5, 0.95, uOwn[0]);
  vec2 v = w + vec2(0.0, 1.0), m = siDiv(vec2(1.0, 0.0), v) + vec2(0.0, 0.5 * k), d = m - vec2(0.0, c);
  z = siMul(vec2(0.0, -1.0), siDiv(m + vec2(0.0, c), d));
  siJ = siMul(vec2(0.0, -1.0), siDiv(siDiv(vec2(0.0, 2.0 * c), siMul(d, d)), siMul(v, v)));
 } else if (uOwn[0] < 0.0) {
  float a = -uOwn[0] * 0.785398, b = tan(a);
  vec2 u = 2.0 * a * vec2(clamp(w.x, -6.0, 6.0), w.y);
  float n = max(cosh(u.x) + cos(u.y), 1e-3);
  z = vec2(sinh(u.x), sin(u.y)) / n;
  siJ = (vec2(1.0, 0.0) - siMul(z, z)) * a / b;
  z /= b;
 }
 if (uOwn[7] > 0.0) { vec2 y = siTwist(z, 1.0); siJ = siMul(siJ, siDiv(y, length(z) > 1e-4 ? z : y + 1e-5)); z = y; }
 return z;
}
vec2 siBack(vec2 z) {
 z = siTwist(z, -1.0);
 if (uOwn[0] > 0.0) {
  float k = 1.0 - uOwn[0], c = mix(0.5, 0.95, uOwn[0]);
  vec2 y = siMul(vec2(0.0, 1.0), z), m = siDiv(siMul(vec2(0.0, c), y + vec2(1.0, 0.0)), y - vec2(1.0, 0.0));
  return siDiv(vec2(1.0, 0.0), m - vec2(0.0, 0.5 * k)) - vec2(0.0, 1.0);
 }
 if (uOwn[0] < 0.0) {
  float a = -uOwn[0] * 0.785398;
  vec2 u = z * tan(a), q = siDiv(vec2(1.0, 0.0) + u, vec2(1.0, 0.0) - u);
  return vec2(0.5 * log(max(length(q), 1e-4)), 0.5 * atan(q.y, q.x + 1e-7)) / a;
 }
 return z;
}
// The evening seen through the holes.
vec3 siSky(vec2 p) {
 vec3 c = mix(uKind[1] * 0.75 + 0.2, uKind[0] * uKind[0] * 0.6, ss(-0.5, 0.45, p.y + 0.12 * noise(p * 1.5)));
 c += 0.12 * uKind[3] * exp(-dot(p - vec2(0.2, -0.45), p - vec2(0.2, -0.45)) * 4.0) * (1.0 + uLevel);
 vec2 g = p * 34.0, id = floor(g), h = hash22(id + 5.0);
 c += step(0.7, h.x) * (1.0 - ss(0.0, 0.02 + 0.1 * h.y, length(fract(g) - 0.5 - 0.6 * (h - 0.5)))) * ss(-0.25, 0.3, p.y) * (0.5 + 0.3 * sin(uTime * (0.3 + h.y) + 40.0 * h.x));
 vec4 w = piece(vec2(0.5 + p.x / 1.9, 0.5 - p.y / 1.1) + 0.2 * (vec2(noise(p * 4.0), noise(p * 5.0 + 9.0)) - 0.5));
 c = mix(c, w.rgb / max(w.a, 0.05), 0.3 * sat(w.a));
 if (uVar > 0.5) { // on some other world, its neighbour
  vec2 y = (p - vec2(0.52, 0.07)) / 0.26;
  float d = length(y), lit = sat(0.15 + dot(y, vec2(-0.75, 0.35)));
  return mix(c, mix(c * 0.8, uKind[4] * 0.7 + 0.3, lit * (0.85 + 0.15 * sin(y.y * 17.0 + 2.0 * noise(y * 3.0)))), 1.0 - ss(0.985, 1.0, d));
 }
 vec2 m = p - vec2(0.5, 0.24);
 return mix(c, vec3(0.95, 0.92, 0.82), (1.0 - ss(0.072, 0.075, length(m))) * ss(0.066, 0.069, length(m - vec2(-0.03, 0.02))));
}
struct SiLeaf {
 float tone;  // 1 light, -1 dark
 float kind;  // 0 or 1, which of the two sorts of its tone
 float edge;  // how far inside its own edge, in the disc's units
 float rib, ribs; // how far from the middle vein, and from the side veins, with their own widths taken off
 float side;  // across it, from the middle vein
 float small; // how small leaves are here
 vec2 mid; // where the leaf's middle lies in the disc
 vec2 out2; // which way its left side points
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
 if (uOwn[1] > 0.0) { h1 += uOwn[1] * 0.04 * sin(5.0 * PI * t1) * (0.4 + 0.6 * t1); h2 += uOwn[1] * 0.032 * sin(3.0 * PI * t2); }
 if (uOwn[1] < 0.0) { h1 *= 1.0 + uOwn[1]; h2 *= 1.0 + uOwn[1]; }
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
 if (uOwn[2] != 0.0) {
  float gone = abs(uOwn[2]), away = 0.06 * gone;
  o.rib += away; o.ribs += away;
  vec2 eo = siEdges(siMul(siConj(w), vec2(cos(PI / 4.0), sin(PI / 4.0))), -chir);
  float in_ = min(near, min(abs(eo.x), abs(eo.y)));
  if (uOwn[2] > 0.0) o.ribs = min(o.ribs, (max(abs(fract(in_ / 0.034 - 0.5) - 0.5) * 0.034 - 0.0065 * uOwn[2], (0.02 - in_))) * toDisc);
  else {
   vec2 g = vec2(ve.x * 11.0, ve.y * 11.0 + 0.5 * mod(floor(ve.x * 11.0), 2.0)), c = fract(g) - 0.5;
   o.ribs = min(o.ribs, max(length(c) / 11.0 * siA - 0.0175 * -uOwn[2], 0.012 + 0.3 * length(c) / 11.0 - in_) * toDisc);
  }
 }
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
 if (uOwn[4] > 0.0) {
  float on = f.kind < 0.5 ? uDrone : uPad;
  vec3 k = f.kind < 0.5 ? uKind[0] : uKind[1];
  c = mix(c, mix(k * (0.82 + 0.35 * on), m.rgb / max(m.a, 0.05), 0.55 * sat(m.a * (0.5 + uEnergy))), uOwn[4]);
 }
 if (uOwn[4] < 0.0) c = mix(c, 0.82 * mix(vec3(1.0), c / max(dot(c, vec3(0.3, 0.6, 0.1)), 0.05), 0.22) * (1.0 - 0.1 * sat(m.a)), -uOwn[4]);
 return c * (1.0 + (0.3 + 0.6 * uEnergy) * ring * (1.0 - 0.7 * abs(uOwn[4])));
}
float siRing(float r) { return band(0.36 * atanh(min(r, 0.96))); } // rings towards the rim are the bands
float siCue(float r) { // the cue: a ring of shade runs from the middle out to the rim
 float w = 2.0 * atanh(min(r, 0.995)) - 5.5 * (1.0 - uCue);
 return ss(0.0, 0.25, uCue) * exp(-w * w * 2.2);
}
const vec3 siGold = vec3(0.85, 0.58, 0.2);
vec3 siPaper(vec2 p) {
 // a round of cut paper, its middle left of the picture's and the frame cutting it
 float R = 0.78 * exp2(uOwn[5] * (uOwn[5] > 0.0 ? -0.85 : -1.05));
 vec2 C = vec2(-0.3, -0.13);
 if (uOwn[5] != 0.0) C = mix(C, uOwn[5] > 0.0 ? vec2(0.0, 0.02) : vec2(-0.5, -0.42), abs(uOwn[5]));
 R *= exp2(uOwn[0] > 0.0 ? -0.55 * uOwn[0] : 0.8 * uOwn[0]);
 if (uOwn[0] > 0.0) C = mix(C, vec2(0.0, R - 0.44), uOwn[0]);
 if (uOwn[0] < 0.0) C = mix(C, vec2(-0.1, 0.0), -uOwn[0]);
 vec2 z = siPlane((p - C) / R);
 float jl = max(length(siJ), 1e-4);
 siLz = siJ / jl; siLz = siMul(siLz, siL);
 if (uOwn[0] > 0.0 && p.y < C.y - R) { z = vec2(p.x * 0.2, -1.5); jl = 1.0; siLz = siL; }
 if (uOwn[0] < 0.0 && abs(p.y - C.y) > R * mix(9.0, 1.0, ss(0.0, 0.3, -uOwn[0])) * (1.0 + 0.25 * (1.0 - ss(0.9, 0.99, -uOwn[0])))) z = vec2(0.0, 1.5);
 float px = jl / (uRes.y * R), pm = 1.0 / (uRes.y * R), r = length(z), lift = 1.0 + 0.6 * uMic;
 float g = noise(p * vec2(160.0, 420.0)) * 0.5 + noise(rot(0.7) * p * vec2(700.0, 90.0)) * 0.5 - 0.5;
 vec3 ground = vec3(0.86, 0.66, 0.56), ivory = vec3(0.955, 0.925, 0.86), deep = vec3(0.075, 0.215, 0.205);
 ground *= 1.0 + 0.06 * g;
 if (uOwn[4] > 0.0) ground = mix(ground, uKind[4] * (1.0 + 0.06 * g), uOwn[4]);
 if (uOwn[4] < 0.0) ground = mix(ground, vec3(0.8, 0.79, 0.77) * (1.0 + 0.05 * g), -uOwn[4]);
 if (uOwn[6] < 0.0) ground = mix(ground, ivory * (1.0 + 0.06 * g), -uOwn[6] * (1.0 - siUp(uOwn[4])));
 if (uOwn[3] > 0.0) ground = mix(ground, ground * 0.03 + uKind[1] * 0.03, uOwn[3]);
 vec3 sky = vec3(0.0);
 if (uOwn[7] < 0.0) { sky = siSky(p); ground = mix(ground, sky, -uOwn[7]); }
 float depth = mix(0.010, 0.022, uSpace) * lift;
 if (uOwn[6] > 0.0) depth *= 1.0 + 2.6 * uOwn[6];
 if (uOwn[0] != 0.0 || uOwn[7] > 0.0) depth *= jl;
 // the edges of the two sheets, cut by hand
 float an = atan(z.y, z.x + 1e-6) * 60.0 / PI, i = floor(an), fa = fract(an);
 float cutA = 1.012 + 0.004 * mix(hash11(i + 60.0), hash11(mod(i + 61.0, 120.0)), fa), cutB = 1.034 + 0.006 * mix(hash11(i + 260.0), hash11(mod(i + 61.0, 120.0) + 200.0), fa);
 // the round's shadow on the ground
 vec2 zs = z + siLz * depth * 1.3;
 float rs = length(zs);
 if (uOwn[0] != 0.0) { r = 1.0 + (r - 1.0) / jl; rs = 1.0 + (rs - 1.0) / jl; }
 float flat_ = 1.0 - max(siUp(-uOwn[7]), siUp(-uOwn[6]));
 ground *= 1.0 - 0.5 * flat_ * (1.0 - ss(1.012, 1.045, rs)) - 0.14 * flat_ * (1.0 - ss(1.0, 1.14, rs));
 if (r > 1.06) return ground;
 const vec2 hub = vec2(0.18, -0.02);
 float c = sat(uHits), kick = 4.0 * c * (1.0 - c);
 vec2 dz = z - hub, zz = z - 0.035 * kick * dz * exp(-dot(dz, dz) * 8.0);
 vec3 col = ivory;
 if (r < 0.999) {
  SiLeaf f = siFind(zz);
  float fine = f.small / px, far = ss(4.0, 16.0, fine);
  float ring = siRing(length(f.mid)), swell = 0.011 * ring * (0.4 + uEnergy) * f.small;
  float top = ss(-px, px, f.edge * f.tone + swell);
  float vein = max((1.0 - ss(-px, px, f.rib)), (1.0 - ss(-px, px, f.ribs)) * ss(18.0, 50.0, fine));
  vein *= ss(0.0, 2.0 * px, f.edge);
  vec2 at = (uOwn[0] == 0.0 && uOwn[7] <= 0.0 ? f.mid : siBack(f.mid)) * R + C;
  vec3 ink = siInk(f, at, deep, 0.2, ring);
  // the shadow of the upper sheet on the lower one
  float off = depth * min(1.0, f.small * 1.6 / (uOwn[0] == 0.0 && uOwn[7] <= 0.0 ? 1.0 : jl)), soft = mix(0.95, 0.3, uTone) * off + px;
  float other = siTone(zz + siLz * off);
  float sh = ss(-soft, soft, other + swell);
  // each leaf is creased down its middle: one half takes the light
  float lit = dot(f.out2, siLz) * (f.side > 0.0 ? 1.0 : -1.0), crease = exp(-abs(f.side) * 5.0);
  vec3 blush = f.kind < 0.5 ? uKind[2] : uKind[3];
  vec3 sheet = mix(ivory, ivory * (0.62 + 0.5 * blush), 0.5 * (f.kind < 0.5 ? uTexture : uPhrase));
  if (uOwn[4] > 0.0) sheet = mix(sheet, blush * (0.92 + 0.16 * (f.kind < 0.5 ? uTexture : uPhrase)), uOwn[4]);
  if (uOwn[4] < 0.0) sheet = mix(sheet, vec3(0.9, 0.89, 0.87) * mix(vec3(1.0), sheet / ivory, 0.6), -uOwn[4]);
  sheet *= 1.0 + lit * (0.045 + 0.09 * crease) * (0.8 + 0.6 * ring) - 0.02;
  // a hit: the leaves round one place take its colour
  vec2 dm = f.mid - hub;
  float h = 0.9 * uHits * exp(-dot(dm, dm) * 9.0);
  sheet = mix(sheet, sheet * (0.35 + 0.75 * uKind[4]), h);
  ink = mix(ink, siDeep(uKind[4], 0.36), h);
  vec3 under = ink * (1.0 + 0.35 * lit * crease) * (1.0 - 0.6 * sh);
  if (uOwn[7] < 0.0) under = mix(under, sky * (1.0 - 0.25 * sh), -uOwn[7]);
  float over = mix(top, 1.0 - top, vein);
  under += siGold * vein * uKeys * 0.55 * step(0.0, f.tone);
  sheet = mix(sheet, siGold, vein * uKeys * 0.6 * step(f.tone, 0.0));
  if (uOwn[7] < 0.0 && f.tone < 0.0) over *= 1.0 + uOwn[7] * vein;
  vec3 both = mix(under, sheet, over);
  if (uOwn[3] < 0.0) { // each a pillow under a glaze
   float gl = clamp((other - f.edge * f.tone) / max(off, 1e-5), -1.0, 1.0) * f.tone, in_ = f.edge / max(f.small, 0.02), be = exp(-in_ * 26.0);
   vec3 gz = mix(ink * 1.15, sheet, top) * (0.94 - 0.5 * exp(-in_ * 110.0) + 0.05 * g);
   gz = mix(gz, gz * 0.45, vein * 0.8);
   gz *= 1.0 - 0.55 * be * gl;
   float sp = ss(0.25, 0.9, -gl) * be * ss(0.004, 0.03, in_) + 0.5 * ss(0.5, 0.75, noise(f.mid * 7.0 + z * 2.6 / max(f.small, 0.1)) * ss(0.03, 0.08, in_)) * ss(-0.3, 0.8, dot(p, siL) + 0.2);
   both = mix(both, gz + 0.5 * sp * (0.7 + 0.5 * uLevel), -uOwn[3]);
  }
  if (uOwn[3] > 0.0) { // glass in lead
   float in_ = f.edge - (0.011 * f.small + 0.6 * px), lead = 1.0 - ss(-px, px, in_);
   vec2 lp = p - vec2(-0.15, 0.1);
   vec3 gk = mix(siDeep(ink, 0.3), ink * 1.4, siUp(uOwn[4])) * (f.tone > 0.0 ? 0.0 : 1.0) + (f.tone > 0.0 ? sheet * sheet * mix(vec3(0.9, 0.82, 0.62), vec3(1.0), siUp(uOwn[4])) : vec3(0.0));
   gk *= (0.3 + 1.25 * exp(-dot(lp, lp) * 1.5) * (0.8 + 0.4 * uLevel)) * (0.8 + 0.35 * noise(z * 5.0 / max(f.small, 0.1) + 3.0)) * (1.0 + 0.6 * ring);
   vec4 mm = piece(vec2(0.5 + at.x / 1.7, 0.5 - at.y / 1.1));
   gk *= (1.0 - 0.6 * vein) * (0.62 + 0.28 * sat(mm.a * 1.2));
   both = mix(both, mix(gk, vec3(0.02, 0.02, 0.024) * (1.0 + 2.0 * siUp(lit)), lead), uOwn[3]);
  }
  if (uOwn[6] < 0.0) { // line alone
   float li = max(1.0 - ss(0.0, 1.6 * px, f.edge - 0.004 * f.small), vein * 0.9), hl = hash11(f.kind + f.tone * 3.0);
   vec3 tint = mix(vec3(1.0), mix(ink / max(dot(ink, vec3(0.3, 0.6, 0.1)), 0.05), vec3(1.0), 0.4), f.tone < 0.0 ? 0.35 + 0.5 * sat(piece(vec2(0.5 + at.x / 1.7, 0.5 - at.y / 1.1)).a) : 0.0), pap = mix(ivory, ground, 0.75);
   both = mix(both, mix(pap * mix(vec3(1.0), tint, 0.8) * mix(vec3(1.0), sheet / ivory, f.tone > 0.0 ? 0.9 * (1.0 - siUp(uOwn[4])) : 0.0), mix(deep * 0.5, sheet, siUp(uOwn[4])), li), -uOwn[6]);
  }
  vec3 tiny = mix(mix(mix(deep * 1.3, ivory, 0.5), 0.5 * (uKind[0] + uKind[3]), siUp(uOwn[4])), vec3(0.82), siUp(-uOwn[4])) * (1.0 - 0.9 * siUp(uOwn[3]));
  col = mix(mix(tiny, ground, max(siUp(-uOwn[6]), 0.6 * siUp(-uOwn[7]))), both, far);
 }
 // the lower sheet's margin, in the upper one's shadow
 float ma = (1.0 - ss(-pm, pm, r - cutA));
 if (uOwn[4] > 0.0) { deep = mix(deep, uKind[0] * 0.8, uOwn[4]); }
 if (uOwn[4] < 0.0) deep = mix(deep, vec3(0.8), -uOwn[4]);
 if (r > 0.999) col = mix(mix(col, uKind[3] * 0.9, siUp(uOwn[4])), vec3(0.9, 0.89, 0.87), siUp(-uOwn[4]));
 if (uOwn[3] > 0.0) deep *= 1.0 - 0.9 * uOwn[3];
 if (uOwn[3] > 0.0 && r > 0.995) col = mix(col, vec3(0.02), uOwn[3]);
 if (r > 1.0) col = mix(col, ground, flat_ < 1.0 ? siUp(-uOwn[6]) : 0.0);
 if (uOwn[6] < 0.0) deep = mix(deep, mix(vec3(0.05), uKind[3], siUp(uOwn[4])), -uOwn[6]);
 col = mix(deep * (1.0 - 0.5 * (1.0 - ss(-0.004, 0.012, rs - cutA))), col, ma);
 col *= (1.0 + 0.04 * g) * (1.0 - 0.5 * siCue(r));
 return mix(ground, col, (1.0 - ss(-pm, pm, r - cutB)));
}
// The dome flattened to the disc.
vec2 siFlat(vec3 h) { vec2 z = h.xy * mix(1.0 / (1.0 + max(h.z, 0.0)), 1.0, 0.55) * 0.999; return uOwn[7] > 0.0 ? siTwist(z, 1.0) : z; }
// What light through the dome at h (a point of the half ball) is coloured by.
vec3 siTint(vec3 h, float soft, vec3 base) {
 vec2 z = siFlat(h);
 float e = siTone(z), far = ss(0.02, 0.2, 1.0 - dot(z, z));
 return mix(base, vec3(1.0), mix(0.4, ss(-soft, soft, e), far));
}
vec3 siGlass(vec2 p) {
 // a solid cap of glass on a table, cased in colour, the leaves cut through the colour
 float R = 0.64 * exp2(uOwn[5] * (uOwn[5] > 0.0 ? -0.75 : -1.1)), sT = 0.82, cT = 0.572;
 vec2 C = vec2(-0.2, -0.17);
 if (uOwn[5] != 0.0) C = mix(C, uOwn[5] > 0.0 ? vec2(0.0, -0.05) : vec2(-0.3, -0.75), abs(uOwn[5]));
 if (uOwn[0] != 0.0) {
  float el = mix(0.6087, uOwn[0] > 0.0 ? 0.0 : 1.22, abs(uOwn[0]));
  cT = sin(el); sT = cos(el);
  C.y += uOwn[0] > 0.0 ? 0.17 * uOwn[0] * (1.0 + min(uOwn[5], 0.0)) : 0.12 * uOwn[0];
  if (uOwn[0] > 0.0) C.x += 0.1 * uOwn[0];
 }
 vec2 q = (p - C) / R;
 float px = 1.0 / (uRes.y * R), r = length(q);
 vec3 L = normalize(vec3(-0.55, 0.42, 0.74)), D = vec3(0.0, -cT, sT);
 vec3 base = vec3(0.03, 0.12, 0.33);
 vec3 stain = mix(mix(base, siDeep(uKind[1], 0.18), 0.4 * uPad), siDeep(uKind[0], 0.18), 0.45 * uDrone); // the colour of its shadows
 float g = noise(p * vec2(330.0, 90.0)) * 0.5 + noise(p * vec2(80.0, 380.0)) * 0.5 - 0.5;
 // the table, and what the dome does to the light on it
 vec2 t = vec2(q.x, q.y / sT);
 vec3 wood = vec3(0.895, 0.85, 0.785) * (1.0 + 0.05 * g);
 if (uOwn[4] > 0.0) { wood = mix(wood, uKind[4] * (1.0 + 0.05 * g), uOwn[4]); stain = mix(stain, uKind[0] * 0.4, uOwn[4]); }
 if (uOwn[4] < 0.0) { wood = mix(wood, vec3(0.84, 0.83, 0.81), -uOwn[4]); stain = mix(stain, vec3(0.5), -uOwn[4]); }
 if (uOwn[7] < 0.0) wood = mix(wood, siSky(p), -uOwn[7]);
 if (uOwn[3] > 0.0) { // a dark table, with the glass's own light lying on it
  float out_ = length(vec2(q.x, q.y / sT));
  vec3 th = siTint(normalize(vec3(q.x, q.y / sT, 0.35 * out_ * out_)), 0.1, stain * 2.0 + 0.05);
  wood = mix(wood, wood * (0.03 + 2.2 * th * th * exp(-siUp(out_ - 0.9) * 2.6) * (0.5 + 0.5 * uLevel) * (0.45 + 0.55 * uKind[3])), uOwn[3]);
 }
 if (uOwn[6] < 0.0) wood = mix(wood, mix(vec3(0.93, 0.9, 0.83) * (1.0 + 0.04 * g), uKind[4], siUp(uOwn[4])), -uOwn[6]);
 vec3 T3 = vec3(t, 0.0);
 float tb = dot(T3, L), miss = dot(t, t) - tb * tb, s = sqrt(max(1.0 - r * r, 0.0));
 float sh = (1.0 - ss(0.86, 1.08, sqrt(max(miss, 0.0)))) * ss(0.0, 0.25, -tb);
 vec3 entry = T3 + L * (-tb - sqrt(max(1.0 - miss, 0.0)));
 vec3 thrown = siTint(entry, mix(0.12, 0.04, uTone), stain * 1.8 + 0.12);
 vec3 col = wood * mix(vec3(1.0), thrown * (0.5 + mix(0.4, 0.8, uSpace) * exp(-miss * 2.5)), sh * 0.9 * (1.0 - siUp(uOwn[3])) * (1.0 - siUp(-uOwn[6])) * (1.0 - siUp(-uOwn[7])));
 col *= 1.0 - 0.3 * (1.0 - siUp(-uOwn[6])) * (1.0 - siUp(-uOwn[7])) * (1.0 - ss(0.0, 0.09, length(t) - 1.0));
 float hz = r < 1.0 ? q.y * cT + s * sT : -1.0;
 if (hz <= 0.0) return col;
 vec3 table = col;
 vec3 h = vec3(q.x, q.y * sT, q.y * cT) + D * s;
 vec2 z = siFlat(h);
 SiLeaf f = siFind(z);
 float pz = px * 0.85 / max(s, 0.12), fine = f.small / pz, far = ss(4.0, 16.0, fine);
 float ring = siRing(length(f.mid)), e = f.edge * f.tone;
 // through the glass to the table under it, where the same leaves lie as light
 vec3 rd = refract(-D, h, 0.66), b = h - rd * (h.z / min(rd.z, -0.05));
 float bb = dot(b, L), b2 = dot(b.xy, b.xy);
 vec3 ex = b + L * (-bb + sqrt(max(1.0 - b2 + bb * bb, 0.0)));
 vec3 through = wood * siTint(ex / max(length(ex), 0.1), mix(0.07, 0.02, uTone), stain * 1.8 + vec3(0.36, 0.38, 0.4));
 float cc = length(b.xy + L.xy * 0.7);
 through *= 0.98 + (0.5 + 0.3 * uLevel) * exp(-cc * cc * mix(6.0, 3.0, uSpace));
 through *= 1.0 - 0.35 * ss(0.75, 1.0, sqrt(b2));
 vec3 ink = siInk(f, siTwist(f.mid, -1.0) * R + C, base, 0.19, ring);
 float vein = max((1.0 - ss(-pz, pz, f.rib)), (1.0 - ss(-pz, pz, f.ribs)) * ss(18.0, 50.0, fine)) * ss(0.0, 2.0 * pz, f.edge);
 float top = ss(-pz, pz, e);
 // the clear leaves are faintly frosted, with the colour of the texture or of the phrase in the frost
 vec3 frost = mix(vec3(0.93, 0.95, 0.95), f.kind < 0.5 ? uKind[2] : uKind[3], 0.55 * (f.kind < 0.5 ? uTexture : uPhrase));
 float bloom = 0.1 + 0.22 * (f.kind < 0.5 ? uTexture : uPhrase) + 0.25 * (1.0 - ss(0.0, 0.08, f.edge / max(f.small, 0.01)));
 vec3 clear = mix(through * vec3(0.96, 0.98, 0.97), frost * 0.9, bloom);
 vec3 cased = through * ink * 1.1 + ink * 0.42;
 if (uOwn[4] > 0.0) {
  cased = mix(cased, ink * (0.35 + 0.65 * through), uOwn[4]);
  clear = mix(clear, (f.kind < 0.5 ? uKind[2] : uKind[3]) * (0.3 + 0.75 * through), uOwn[4]);
 }
 if (uOwn[4] < 0.0) clear = mix(clear, vec3(0.6, 0.59, 0.57) * (0.75 + 0.25 * through), -uOwn[4]);
 if (uOwn[7] < 0.0) cased = mix(cased, through * 0.85 + 0.03, -uOwn[7]);
 if (uOwn[3] > 0.0) {
  float core = dot(q - vec2(0.0, -0.15), q - vec2(0.0, -0.15));
  vec3 lamp = (0.45 + 2.3 * exp(-core * 2.0)) * (0.75 + 0.5 * uLevel) * vec3(1.0, 0.93, 0.8);
  vec2 at = siTwist(f.mid, -1.0) * R + C;
  lamp *= 0.6 + 1.1 * sat(piece(vec2(0.5 + at.x / 1.7, 0.5 - at.y / 1.1)).a);
  cased = mix(cased, siDeep(ink, 0.26) * (0.2 + lamp), uOwn[3]);
  clear = mix(clear, mix(vec3(0.95, 0.85, 0.65), f.kind < 0.5 ? uKind[2] : uKind[3], 0.35 + 0.65 * siUp(uOwn[4])) * (0.1 + 0.75 * lamp), uOwn[3]);
 }
 if (uOwn[3] < 0.0) { cased = mix(cased, ink * 1.35, -uOwn[3]); clear = mix(clear, mix(vec3(0.9, 0.87, 0.8), f.kind < 0.5 ? uKind[2] : uKind[3], siUp(uOwn[4])), -uOwn[3]); }
 // a hit lights the leaves round one place from inside, in its own colour
 vec2 dm = f.mid - vec2(0.05, -0.1);
 float hi = uHits * exp(-dot(dm, dm) * 8.0);
 cased += uKind[4] * 0.55 * hi; clear = mix(clear, uKind[4] * 0.85 + 0.22, 0.75 * hi);
 cased = mix(cased, mix(vec3(0.82, 0.85, 0.86), siGold * 1.1, uKeys * 0.8), vein * 0.8);
 clear = mix(clear, mix(clear * 0.62 + base * 0.2, siGold * 0.8, uKeys * 0.8), vein * 0.7);
 col = mix(mix(cased, clear, 0.4), mix(cased, clear, top), far);
 // the cut's slope: one side catches the window, the other is dark
 float wide = 0.012 * f.small + 1.5 * pz, step2 = 0.004 * f.small + pz;
 float deepc = max(siUp(uOwn[6]), 0.7 * siUp(-uOwn[3]));
 if (deepc > 0.0) { wide *= 1.0 + 2.6 * deepc; step2 *= 1.0 + 1.5 * deepc; }
 float gl = clamp((siTone(z + siL * step2) - e) / step2, -1.0, 1.0) * (1.0 - ss(0.2 * wide, wide, abs(e))) * far;
 col += (gl > 0.0 ? vec3(0.2) * gl : col * 0.6 * gl) * (1.0 - 0.8 * siUp(uOwn[3])) * (1.0 - 0.3 * deepc);
 if (uOwn[3] > 0.0) col = mix(col, vec3(0.02, 0.02, 0.025), uOwn[3] * far * (1.0 - ss(-pz, pz, abs(e) - 0.011 * f.small - 0.6 * pz)));
 // light from above left over the round of it, and what the glass gathers low down on the far side
 col *= mix(0.82 + 0.26 * dot(h, L), 0.35 + 0.7 * siUp(dot(h, L)), 0.8 * siUp(-uOwn[3]) * (1.0 - siUp(uOwn[6])));
 float hl = length(h.xy), lo = sat(-dot(h.xy, L.xy) / max(hl * length(L.xy), 0.05));
 col += vec3(0.4, 0.38, 0.33) * (1.0 - max(siUp(-uOwn[3]), siUp(uOwn[3]))) * lo * lo * ss(0.62, 0.9, hl) * (1.0 - ss(0.93, 1.0, hl)) * (0.5 + 0.5 * top) * (0.7 + 0.5 * uLevel);
 col *= 1.0 - 0.5 * siCue(min(length(z), 0.98));
 // the room in the rim, and the window with its bars
 vec3 rf = reflect(-D, h), wn = normalize(vec3(-0.82, 0.16, 0.6)), wu = normalize(vec3(0.16, 0.82, 0.0)), wv = cross(wn, wu);
 col = mix(col, vec3(0.80, 0.83, 0.85) * (0.6 + 0.4 * sat(rf.z)), 0.03 + 0.8 * pow(1.0 - s, 4.0));
 vec2 wq = vec2(dot(rf, wu), dot(rf, wv));
 vec2 wa = (1.0 - ss(vec2(0.2, 0.28), vec2(0.25, 0.33), abs(wq))) * ss(0.008, 0.022, abs(wq));
 col += vec3(0.95, 0.97, 1.0) * wa.x * wa.y * step(0.0, dot(rf, wn)) * (0.42 + 0.3 * uMic) * (0.75 + 0.6 * wq.x);
 if (uOwn[6] < 0.0) {
  float li = max(max(1.0 - ss(0.0, 1.6 * pz, abs(e) - 0.004 * f.small), vein * 0.8) * far + 0.35 * (1.0 - far), ss(0.985, 0.995, r));
  float hat = ss(0.35, 0.65, abs(fract((p.x + p.y) * 70.0) - 0.5) * 2.0) * ss(0.75, 0.35, dot(h, L)) * 0.45;
  vec3 tint = f.tone < 0.0 ? mix(vec3(1.0), ink / max(dot(ink, vec3(0.3, 0.6, 0.1)), 0.05), 0.28) : vec3(1.0);
  col = mix(col, mix(wood * tint, mix(vec3(0.06, 0.07, 0.1), uKind[3], siUp(uOwn[4])), max(li, hat)), -uOwn[6]);
 }
 return mix(table, col, (1.0 - ss(1.0 - 2.0 * px, 1.0, r)) * ss(0.0, 2.0 * px, hz));
}
vec3 render(vec2 p) {
 vec2 so = vec2(0.1, 0.22);
 float st = 0.4 + 0.05 * sin(TAU * uLoop);
 if (uOwn[0] < 0.0 && uVar < 0.5) { so *= 1.0 + uOwn[0]; st *= 1.0 + uOwn[0]; }
 siSet(siStep * (fract(uTravel * 0.0038) - 0.5), so, st);
 vec3 col = uVar < 0.5 ? siPaper(p) : siGlass(p);
 return col * (1.05 - 0.11 * length(p - vec2(-0.6, 0.45))); // daylight from the upper left
}
