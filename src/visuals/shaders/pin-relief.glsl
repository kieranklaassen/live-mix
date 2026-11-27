// name: Pin relief
// a: Ivory pins
// b: Glass beads
// what: The piece pressed into a bed of pins seen from above at a slant, across the loop and away into the room, where a hard low light picks out each pin that stands up and throws its shadow on the next.
// follows: Loudness raises the pins, highest at the place now playing, which the view glides along with; the piece's colours fill the shadows; a hit or cue presses a ripple out through the bed.
// own: 0 1 many small pins, -1 a few great ones; 1 1 square blocks (b: tall eggs), -1 domes that grow to spires (b: flat lentils); 2 1 day: pale sky and ground, all in soft light, -1 no sun and each pin a lamp of its own; 3 1 strewn out of line, of every size, some gone, -1 drawn out into rows, as walls and fins; 4 the eye: 1 straight above, -1 low along the bed; 5 1 the bed stands high and sound presses hollows (b: sound lifts the beads), -1 a long swell rolls through; 6 1 polished metal, -1 dull and dyed in the colours of the sounds; 7 1 the sun low and ahead, long shadows toward us, -1 high noon
const float NX = 48.0, NZ = 24.0; // pins across the loop, and away through the room
const float RISE = 3.4, PR = 0.39; // how high a pin can stand, and how thick it is
const vec3 SUN = vec3(-0.66, 0.36, 0.52); // toward the light: low, from the far left
float prG;        // how many times as many pins
vec2 prN;         // pins across and away
vec3 prSun;       // toward the light, of length 1
bool prOther;     // the pins are not the plain ones
int prSteps;      // how many pins a ray may pass


vec3 tone(vec3 c) { c = max(c, 0.0); float l = max(c.r, max(c.g, c.b)); c *= (1.0 + l * 0.1) / (1.0 + l); c = mix(c, vec3(l / (1.0 + l)), sat(l * 0.12 - 0.1)); return pow(c, vec3(0.4545)); }
float bump(float x) { x = sat(1.0 - x * x); return x * x; }

struct Pin { float h; vec3 hue; float loud; float ring; vec2 off; float s; };

Pin pinAt(vec2 id) {
  vec2 uv = vec2(fract((id.x + 0.5) / prN.x), 1.0 - (id.y + 0.5) / prN.y);
  vec4 m = piece(uv);
  Pin d;
  d.loud = sat(m.a * (0.6 + 0.6 * uEnergy));
  d.hue = m.rgb / max(m.a, 0.001);
  d.hue = max(mix(vec3(dot(d.hue, vec3(0.3333))), d.hue, 1.9), 0.0);
  float dx = (fract(uv.x - uLoop + 0.5) - 0.5) * NX;
  float head = bump(dx * 0.11);
  float dist = length(vec2(dx, (id.y + 0.5) / prG - NZ * 0.45));
  // a hit presses a ripple out: a ring of pins pushed down, and just outside it a ring thrown up
  float ra = (1.0 - uHits) * 20.0, rb = (1.0 - uCue) * 30.0, up = 0.0, down = 0.0;
  if (uHits + uCue > 0.001) {
  up = uHits * bump((dist - ra) * 0.55) + 0.7 * uCue * bump((dist - rb) * 0.4);
  down = uHits * bump((dist - ra + 2.0) * 0.5) + 0.7 * uCue * bump((dist - rb + 2.6) * 0.4);
  }
  d.ring = up;
  d.h = 0.22 + RISE * d.loud * sqrt(d.loud) * (0.4 + 0.6 * head);
  d.h = d.h * (1.0 - 0.75 * down) + 1.1 * up;
  if ((prOther || uOwn[2] != 0.0 || uOwn[6] != 0.0) && uHits > 0.001) d.ring += 0.55 * uHits * exp(-dist * dist * 0.012);   // and a hit lights the bed about the place now playing
  d.off = vec2(0.0); d.s = 1.0;
  if (prOther) {
    vec2 w = vec2(mod(id.x, prN.x), id.y);
    if (uOwn[5] > 0.0) d.h = mix(d.h, (0.2 + 2.5 * (1.0 - smoothstep(0.0, 0.75, d.loud * (0.6 + 0.4 * head)))) * (1.0 - 0.6 * down) + 0.8 * up, uOwn[5]);
    if (uOwn[5] < 0.0) {
      float wave = sin(TAU * (3.0 * id.x / prN.x) + 0.21 * id.y / prG - uTime * 0.22) + 0.5 * sin(TAU * (5.0 * id.x / prN.x) - 0.33 * id.y / prG - uTime * 0.31);
      d.h += -uOwn[5] * 1.1 * (1.0 + wave * 0.66);
    }
    if (uOwn[3] > 0.0) {
      float k = hash21(w), k2 = hash21(w + 41.3), k3 = hash21(w + 7.9);
      d.s = mix(1.0, (0.35 + 0.65 * k) * smoothstep(0.1, 0.3, k2), uOwn[3]);
      d.off = (vec2(k3, fract(k * 37.0 + k2)) - 0.5) * 2.0 * (0.49 - 0.4 * d.s) * uOwn[3];
      d.h *= mix(1.0, (0.45 + 0.95 * k3) * smoothstep(0.05, 0.25, k2), uOwn[3]);
    }
    d.h *= uVar < 0.5 ? prG : 1.0;
  }
  if (uv.y < 0.0 || uv.y > 1.0) d.h = 0.0;
  return d;
}

// The half sizes of a pin's foot: the box and the round it lies in.
vec3 footOf(float s) {
  float sq = max(uOwn[1], 0.0), row = max(-uOwn[3], 0.0);
  vec3 f = vec3(mix(0.5, 0.465, sq), mix(0.5, 0.465, sq), PR);
  f.z = mix(f.z, 0.72, max(sq, row));
  f.xy = mix(f.xy, vec2(0.501, 0.2 + 0.08 * sq), row);
  return f * vec3(s, s, s);
}
// Where a ray goes into a pin that is not plain: round, box, dome and top together. n: which way it faces there.
bool pinHit(vec2 id, Pin d, vec3 ro, vec3 rd, vec3 inv, out float t, out vec3 n) {
  vec3 f = footOf(d.s), o = vec3(ro.x - id.x - 0.5 - d.off.x, ro.y, ro.z - id.y - 0.5 - d.off.y);
  n = vec3(0.0, 1.0, 0.0); t = 0.0;
  if (d.h < 0.004 || f.z < 0.01) return false;
  float a = dot(rd.xz, rd.xz), b = -dot(o.xz, rd.xz), disc = b * b - a * (dot(o.xz, o.xz) - f.z * f.z);
  if (disc <= 0.0) return false;
  float sq = sqrt(disc), s = (b - sq) / a, e = (b + sq) / a;
  vec2 q = o.xz + rd.xz * s; n = vec3(q.x, 0.0, q.y) / f.z;
  vec2 ta = (-sign(rd.xz) * f.xy - o.xz) * inv.xz, tb = (sign(rd.xz) * f.xy - o.xz) * inv.xz;
  if (ta.x > s) { s = ta.x; n = vec3(-sign(rd.x), 0.0, 0.0); }
  if (ta.y > s) { s = ta.y; n = vec3(0.0, 0.0, -sign(rd.z)); }
  e = min(e, min(tb.x, tb.y));
  float ty = (d.h - o.y) * inv.y;
  if (rd.y < 0.0) { if (ty > s) { s = ty; n = vec3(0.0, 1.0, 0.0); } } else e = min(e, ty);
  if (uOwn[1] < 0.0) {
    float E = mix(1.415, 1.0, -uOwn[1]); vec3 k = 1.0 / (vec3(f.z, d.h, f.z) * E), oo = o * k, r = rd * k;
    float A = dot(r, r), B = -dot(oo, r), D = B * B - A * (dot(oo, oo) - 1.0);
    if (D <= 0.0) return false;
    float S = (B - sqrt(D)) / A;
    if (S > s) { s = S; n = normalize((oo + r * s) * k); }
    e = min(e, (B + sqrt(D)) / A);
  }
  t = s;
  return e > s && s > 0.0;
}
// How much of the side light reaches a place: 0 in the shadow of the pins between it and the light.
float shadowOf(vec3 p) {
  vec3 l = prSun, inv = 1.0 / l;
  vec2 id = floor(p.xz), stp = sign(l.xz);
  vec2 tMax = (id + max(stp, 0.0) - p.xz) * inv.xz, tDel = abs(inv.xz);
  float lit = 1.0;
  float a = dot(l.xz, l.xz);
  for (int i = 0; i < 10; i++) {
    if (tMax.x < tMax.y) { tMax.x += tDel.x; id.x += stp.x; } else { tMax.y += tDel.y; id.y += stp.y; }
    Pin d = pinAt(id);
    vec2 oc = id + 0.5 - p.xz;
    float R = PR;
    if (prOther) { vec3 f = footOf(d.s); oc += d.off; R = min(f.z, 0.56 * d.s); R = mix(R, 0.36 * d.s, max(-uOwn[1], 0.0)); d.h *= mix(1.0, 0.9, max(-uOwn[1], 0.0)); }
    float b = dot(oc, l.xz), c = dot(oc, oc) - R * R, disc = b * b - a * c;
    float s = (b - sqrt(max(disc, 0.0))) / a;            // where the ray to the light enters this pin's column
    float under = d.h - (p.y + l.y * s);                   // how far below the pin's top it is there
    float edge = smoothstep(0.0, 0.03, disc);              // a soft edge to the shadow
    lit *= 1.0 - edge * smoothstep(0.0, 0.12, under);
    if (lit < 0.02 || p.y + l.y * min(tMax.x, tMax.y) > (prOther ? (RISE + 3.0) * prG : RISE + 1.4)) break;
  }
  return lit;
}

// The sky and the ground about the bed, by day.
vec3 prSky(vec3 rd) {
  vec3 c = mix(vec3(0.9, 0.87, 0.82), 0.35 + 0.5 * uKind[1], smoothstep(-0.05, 0.6, rd.y) * 0.7);
  return c * (1.05 + 0.1 * uLevel) + vec3(0.5, 0.4, 0.25) * pow(sat(dot(rd, prSun)), 12.0);
}
vec3 prGround() { return mix(vec3(0.8, 0.77, 0.72), uKind[2] * 0.95 + 0.01, 0.85); }
// What a polished pin or bead mirrors.
vec3 prRoom(vec3 r, vec3 hue) {
  float day = max(uOwn[2], 0.0), s = sat(dot(r, prSun));
  vec3 c = mix(vec3(0.015, 0.02, 0.03), vec3(0.2, 0.24, 0.3), smoothstep(0.0, 0.9, r.y)) + vec3(0.9, 0.82, 0.72) * exp(-abs(r.y - 0.15) * 8.0) * 0.7;
  c = mix(c, prSky(r), day) * mix(1.0, 0.25, smoothstep(0.12, -0.25, r.y));
  return c + vec3(1.0, 0.93, 0.82) * (pow(s, 24.0) * 1.2 + pow(s, 200.0) * 5.0) * (1.0 - max(-uOwn[2], 0.0)) + hue * 0.12;
}
vec3 prDye(Pin d, vec2 id) {
  vec3 rest = mix(uKind[0], uKind[2], hash21(vec2(mod(id.x, prN.x), id.y) + 3.0)) * 0.7;
  return mix(rest, d.hue, smoothstep(0.02, 0.3, d.loud));
}
vec3 ivoryBed(vec3 ro, vec3 rd) {
  rd += step(abs(rd), vec3(1e-4)) * 2e-4; // never exactly along a row of cells
  float H = 0.22 + RISE + 1.1 * max(uHits, 0.7 * uCue) + 0.05, day = max(uOwn[2], 0.0), glow = max(-uOwn[2], 0.0);
  if (prOther) H = (H * (1.0 + 0.4 * max(uOwn[3], 0.0)) + 2.2 * max(-uOwn[5], 0.0)) * prG;
  vec3 inv = 1.0 / rd;
  float ty0 = (H - ro.y) * inv.y, ty1 = -ro.y * inv.y, tz0 = -ro.z * inv.z, tz1 = (prN.y - ro.z) * inv.z;
  vec3 away_ = vec3(0.0);
  if (day > 0.0) {
    float tg = rd.y < -1e-3 ? -ro.y * inv.y : 1e3;
    away_ = mix(prSky(vec3(rd.x, max(rd.y, 0.0), rd.z)), prGround() * 0.95, rd.y < 0.0 ? exp(-tg * 0.016 / prG) : 0.0) * day;
  }
  if (uOwn[4] < 0.0 && rd.y > 0.0) { float w = ty0; ty0 = ty1; ty1 = w; }
  float t0 = max(max(ty0, min(tz0, tz1)), 0.0), t1 = min(ty1, max(tz0, tz1));
  if (t1 <= t0 || (rd.y > -1e-3 && uOwn[4] >= 0.0)) return away_ * 1.9;
  vec3 p = ro + rd * (t0 + 1e-3);
  vec2 id = floor(p.xz), stp = sign(rd.xz);
  vec2 tMax = (id + max(stp, 0.0) - ro.xz) * inv.xz, tDel = abs(inv.xz);
  float a = dot(rd.xz, rd.xz);
  float tHit = -1.0; vec3 n = vec3(0.0, 1.0, 0.0); Pin hit; hit.h = 0.0; hit.loud = 0.0; hit.ring = 0.0; hit.hue = vec3(0.0);
  vec2 hid = vec2(0.0);
  for (int i = 0; i < prSteps; i++) {
    Pin d = pinAt(id);
    if (prOther) {
      float th; vec3 nh;
      if (pinHit(id, d, ro, rd, inv, th, nh)) { tHit = th; n = nh; hit = d; hid = id + d.off; break; }
      float tn = min(tMax.x, tMax.y);
      if (tn > t1) break;
      if (tMax.x < tMax.y) { tMax.x += tDel.x; id.x += stp.x; } else { tMax.y += tDel.y; id.y += stp.y; }
      continue;
    }
    vec2 oc = id + 0.5 - ro.xz;
    float b = dot(oc, rd.xz), c = dot(oc, oc) - PR * PR, disc = b * b - a * c;
    if (disc > 0.0) {
      float sq = sqrt(disc), ts = (b - sq) / a, te = (b + sq) / a;
      float ys = ro.y + rd.y * ts;
      if (ys < d.h) { tHit = ts; vec2 q = ro.xz + rd.xz * ts - id - 0.5; n = vec3(q.x, 0.0, q.y) / PR; hit = d; hid = id; break; } // its side
      float tt = (d.h - ro.y) * inv.y;
      if (tt < te) { tHit = tt; n = vec3(0.0, 1.0, 0.0); hit = d; hid = id; break; }                                             // its top
    }
    float tn = min(tMax.x, tMax.y);
    if (tn > t1) break;
    if (tMax.x < tMax.y) { tMax.x += tDel.x; id.x += stp.x; } else { tMax.y += tDel.y; id.y += stp.y; }
  }
  bool bare = tHit < 0.0;
  if (bare) {
    if (day == 0.0 || rd.y > -1e-3 || -ro.y * inv.y > t1 + 1e-2) return away_ * 1.9;
    tHit = -ro.y * inv.y; hid = floor((ro + rd * tHit).xz);
  }
  vec3 P = ro + rd * tHit;
  vec3 l = prSun;
  float sh = shadowOf(P + n * 0.004);
  // the light skims over the bed: a pin at rest stays in the dark, a pin that stands up comes into it
  float reach = smoothstep(0.3, 1.0, P.y);
  if (day > 0.0) reach = mix(reach, 1.0, day);
  float ndl = dot(n, l);
  vec3 ivory = vec3(0.93, 0.87, 0.76);
  vec2 q = P.xz - hid - 0.5; float rr = length(q) / PR;
  if (prOther) { vec3 f = footOf(hit.s); vec2 k = abs(q) / max(f.xy, 1e-3); rr = min(max(length(q) / max(f.z, 1e-3), max(k.x, k.y)), 1.0); }
  float top = step(0.5, n.y);
  vec3 key = vec3(1.0, 0.93, 0.82) * 2.3;
  vec3 col = ivory * key * sat(ndl) * sh * reach;
  col += vec3(0.9, 0.45, 0.3) * ivory * key * sat(ndl + 0.3) * sat(0.3 - ndl) * 1.2 * sh * reach;      // light bleeding round the turn of the pin, warm, as in bone
  vec3 hv = normalize(l - rd);
  col += key * pow(sat(dot(n, hv)), 40.0) * 0.25 * sh * reach;                                           // a soft polish
  col *= mix(1.0, 0.86 + 0.14 * smoothstep(1.0, 0.8, rr), top);                                          // the top is turned: a little darker toward its edge
  col += key * ivory * top * smoothstep(0.84, 0.97, rr) * sat(dot(q / max(length(q), 1e-4), normalize(l.xz))) * 0.55 * sh * reach; // and its rim catches the light
  // the shadows are filled with the colour of the sound that raised the pin, coming from the far side
  float away = mix(sat(0.5 - 0.5 * dot(n.xz, l.xz) / length(l.xz)), 0.22, top);
  col += hit.hue * hit.loud * ivory * away * (0.08 + 0.42 * sat(P.y / (hit.h + 0.01))) * (0.35 + 0.65 * reach) * (1.0 - 0.7 * sh * sat(ndl));
  col += vec3(1.0, 0.9, 0.8) * hit.ring * 0.25 * top;
  col += vec3(0.02, 0.022, 0.03) * top * smoothstep(1.0, 0.7, rr);                                       // at rest: just a breath of light on each top
  if (uOwn[6] != 0.0 || uOwn[2] != 0.0) {
    vec3 dye = bare ? prGround() : prDye(hit, floor(P.xz)), stuff = mix(ivory, dye * (0.55 + 0.55 * dye), bare ? 1.0 : max(-uOwn[6], 0.0));
    float low = sat(P.y / (hit.h + 0.01)), occ = bare ? 0.45 : mix(0.35 + 0.65 * smoothstep(0.0, 1.0, low), 1.0, top);
    vec3 c = stuff * key * (1.0 - 0.4 * day) * sat(ndl) * sh * reach;                                // dull, in sun and in the light of the sky
    c += stuff * mix(hit.hue * hit.loud * 0.3, (vec3(0.12, 0.15, 0.2) + 0.2 * prSky(n)) * (0.6 + 0.4 * n.y), day) * occ;
    c += stuff * vec3(0.03, 0.033, 0.04) * (0.4 + top) + stuff * hit.ring * 0.3 * top;
    c = mix(c, uKind[4] * (0.3 + 0.7 * max(n.y, 0.0)), sat(hit.ring * 0.7) * (1.0 - glow));
    c *= mix(1.0, 0.8 + 0.2 * smoothstep(1.0, 0.85, rr), top);
    if (glow > 0.0) {                                                                                 // each pin its own lamp
      vec3 lamp = hit.hue * (0.4 + 0.6 * hit.hue) * (hit.loud * 1.7 + hit.ring) + uKind[0] * 0.2 * (0.25 + hash21(hid));
      float body = mix(0.12 + 0.55 * low * low * low, 0.75 + 0.6 * smoothstep(1.0, 0.2, rr), smoothstep(0.2, 0.9, n.y));
      col = mix(col, stuff * vec3(0.02, 0.024, 0.035) * (0.3 + top), glow); c = mix(c, stuff * vec3(0.02, 0.024, 0.035) * (0.3 + top), glow);
      col += lamp * body * glow; c += lamp * body * glow;
    }
    if (uOwn[6] > 0.0 && !bare) {
      vec3 nn = normalize(n + vec3(q.x, 0.0, q.y) * 0.35 * top + 0.02 * vec3(hash21(hid) - 0.5, 0.0, hash21(hid + 3.0) - 0.5));
      vec3 r = reflect(rd, nn), m = prRoom(r, hit.hue * hit.loud) * mix(vec3(1.0), 0.25 + hit.hue, 0.75 * smoothstep(0.02, 0.4, hit.loud)) * (0.45 + 0.55 * sh) * occ;
      c = mix(c, m * (0.85 + 0.6 * pow(1.0 - sat(-dot(nn, rd)), 3.0)) + uKind[4] * hit.ring * 0.5, uOwn[6] * (1.0 - 0.35 * glow));
    }
    col = mix(col, c, max(max(abs(uOwn[6]), day), bare ? 1.0 : 0.0) * (1.0 - glow * (1.0 - abs(uOwn[6]))));
    if (bare) col *= day;
  }
  if (day > 0.0) col = mix(col, away_ / max(day, 0.01), day * (1.0 - exp(-max(tHit - 8.0 * prG, 0.0) * 0.018 / prG)));
  col *= day > 0.0 ? mix(exp(-tHit * 0.012), 1.9, day) : prOther ? exp(-tHit * 0.012 / prG) : exp(-tHit * 0.012);
  return col;
}

// What a glass bead sees in a given direction: the light, a little of the room, and below it the glow of the bed.
vec3 around(vec3 d, vec3 below) {
  vec3 l = prSun;
  float s = sat(dot(d, l));
  float s2 = s * s; s2 *= s2; s2 *= s2; s2 *= s2;
  if (uOwn[2] != 0.0 || uOwn[7] < 0.0) {
    float noon = max(-uOwn[7], 0.0), night = max(-uOwn[2], 0.0), day = max(uOwn[2], 0.0);
    vec3 c = vec3(1.0, 0.94, 0.85) * (s2 * s2 * s2 * s2 * 7.0 + s2 * 0.12 + noon * smoothstep(0.86, 0.93, s) * 1.6) * (1.0 - night) + below * sat(-d.y * 1.5 + 0.2) * 0.7;
    return c + day * mix(prGround() * 0.5 * (1.0 - 0.4 * sat(-d.y)), prSky(d) * 0.85, smoothstep(-0.1, 0.1, d.y));
  }
  return vec3(1.0, 0.94, 0.85) * (s2 * s2 * s2 * s2 * 7.0 + s2 * 0.12) + below * sat(-d.y * 1.5 + 0.2) * 0.7;
}

vec3 beadBed(vec3 ro, vec3 rd) {
  rd += step(abs(rd), vec3(1e-4)) * 2e-4; // never exactly along a row of cells
  float H = 0.9 + 0.9 * max(uHits, 0.7 * uCue) + 0.05, day = max(uOwn[2], 0.0), glow = max(-uOwn[2], 0.0), row = max(-uOwn[3], 0.0);
  vec3 sc = vec3(1.0);
  if (prOther) {
    sc = vec3(1.0 + 0.16 * row, uOwn[1] > 0.0 ? 1.0 + 1.3 * uOwn[1] : 1.0 + 0.62 * uOwn[1], 1.0 - 0.45 * row) * vec3(1.0 - 0.1 * max(uOwn[1], 0.0) + 0.12 * max(-uOwn[1], 0.0), 1.0, 1.0 - 0.1 * max(uOwn[1], 0.0) + 0.12 * max(-uOwn[1], 0.0));
    H = H + 0.9 * (sc.y - 1.0) + 2.1 * max(-uOwn[5], 0.0) + 2.4 * max(uOwn[5], 0.0);
  }
  vec3 inv = 1.0 / rd;
  float ty0 = (H - ro.y) * inv.y, ty1 = -ro.y * inv.y, tz0 = -ro.z * inv.z, tz1 = (prN.y - ro.z) * inv.z;
  vec3 away_ = vec3(0.0);
  if (day > 0.0) {
    float tg = rd.y < -1e-3 ? -ro.y * inv.y : 1e3;
    away_ = mix(prSky(vec3(rd.x, max(rd.y, 0.0), rd.z)), prGround() * 0.95, rd.y < 0.0 ? exp(-tg * 0.016 / prG) : 0.0) * day;
  }
  if (uOwn[4] < 0.0 && rd.y > 0.0) { float w = ty0; ty0 = ty1; ty1 = w; }
  float t0 = max(max(ty0, min(tz0, tz1)), 0.0), t1 = min(ty1, max(tz0, tz1));
  if (t1 <= t0 || (rd.y > -1e-3 && uOwn[4] >= 0.0)) return away_ * 1.9;
  vec3 p = ro + rd * (t0 + 1e-3);
  vec2 id = floor(p.xz), stp = sign(rd.xz);
  vec2 tMax = (id + max(stp, 0.0) - ro.xz) * inv.xz, tDel = abs(inv.xz);
  vec3 col = vec3(0.0); float alpha = 0.0;
  for (int i = 0; i < prSteps; i++) {
    Pin d = pinAt(id);
    float lit = d.loud * (0.6 + 0.4 * sqrt(sat((d.h - 0.22) / RISE * 2.0))) + 0.6 * d.ring; // how bright the lamp under this bead is
    float r = 0.2 + 0.23 * sqrt(sat(lit));
    float hop = 0.5 * d.ring;
    if (prOther) r *= d.s;
    vec3 c = vec3(id.x + 0.5, r + hop, id.y + 0.5), roW = ro, rdW = rd;
    if (prOther) {
      c = vec3(id.x + 0.5 + d.off.x, r * sc.y + hop, id.y + 0.5 + d.off.y);
      if (uOwn[5] > 0.0) c.y += uOwn[5] * 2.4 * d.loud * d.loud;
      if (uOwn[5] < 0.0) c.y += max(d.h - 0.22 - (RISE * d.loud * sqrt(d.loud) + d.ring) * 0.8, 0.0) * 0.6;
    }
    vec3 lamp = d.hue * lit * 2.6 + vec3(1.0, 0.9, 0.8) * d.ring * 0.5;
    vec3 below = d.hue * lit;
    vec3 ro = prOther ? c + (roW - c) / sc : roW, rd = prOther ? normalize(rdW / sc) : rdW;
    vec3 oc = c - ro; float tca = dot(oc, rd), d2 = dot(oc, oc) - tca * tca, dd = sqrt(max(d2, 0.0));
    if (prOther && (r < 0.02 || tca < 0.0)) dd = 9.0;
    float w = 0.008 + tca * 1.1 / uRes.y;
    float cov = smoothstep(r + w, r - w, dd);
    if (cov > 0.0) {
      float hh = sqrt(max(r * r - min(d2, r * r * 0.985), 0.0));
      vec3 P1 = ro + rd * (tca - hh) + (dd > r * 0.992 ? (c - (ro + rd * tca)) * (1.0 - r * 0.992 / dd) : vec3(0.0));
      vec3 N1 = normalize(P1 - c);
      float cosi = sat(-dot(N1, rd));
      float fres = 0.04 + 0.96 * pow(1.0 - cosi, 5.0);
      // through the glass: bent in, across the bead, bent out, then down to the lamp in the bed
      vec3 through = vec3(0.0), shade = vec3(0.0);
      if (abs(uOwn[6]) < 1.0) {
      vec3 rin = refract(rd, N1, 1.0 / 1.5);
      vec3 P2 = P1 + rin * (2.0 * r * sat(-dot(N1, rin)));
      vec3 N2 = normalize(P2 - c);
      vec3 rout = refract(rin, -N2, 1.5);
      if (rout.y < -0.01) {
        vec3 Q = P2 + rout * (-P2.y / rout.y);
        float dq = length(Q.xz - c.xz);
        through = lamp * (1.5 * exp(-dq * dq * 10.0) + 1.6 * smoothstep(0.2, 0.1, dq));
      }
      through += around(rout, below) * 0.12;
      through += d.hue * lit * 0.035;                             // the glass itself holds a little of the colour
      shade = through * (1.0 - fres) + around(reflect(rd, N1), below) * fres;
      }
      if (uOwn[6] != 0.0 || uOwn[2] != 0.0 || uOwn[7] > 0.0) {
        vec3 Nw = normalize(N1 / sc), R = reflect(rdW, Nw), dye = prDye(d, id);
        float ndl = dot(Nw, prSun), foot = 0.4 + 0.6 * smoothstep(-0.9, 0.5, Nw.y);
        if (day > 0.0 && abs(uOwn[6]) < 1.0) {             // clear glass by day: it gathers the ground and the colour
          vec3 body = mix(prGround() * 0.9, dye * 1.15, 0.35 + 0.5 * smoothstep(0.0, 0.5, lit)) * (0.4 + 0.75 * sat(-dot(N1, prSun) * 0.8 + 0.35)) * (0.55 + 0.45 * cosi);
          shade = mix(shade, body * (1.0 - fres) + around(R, below) * fres + vec3(1.0, 0.96, 0.9) * pow(sat(dot(R, prSun)), 90.0) * 2.0 + lamp * 0.12, day);
          shade = mix(shade, uKind[4] * (0.5 + 0.5 * cosi), sat(d.ring * 0.6) * day);
        }
        if (glow > 0.0) shade = shade * (1.0 - 0.5 * glow) + d.hue * (0.5 + d.hue) * lit * glow * (0.25 + 0.5 * cosi) + uKind[0] * (0.05 + 0.22 * cosi * hash21(vec2(mod(id.x, prN.x), id.y))) * glow;
        if (uOwn[7] > 0.0) shade += (0.2 + dye) * (0.15 + lit) * pow(1.0 - cosi, 2.0) * 1.6 * uOwn[7] * sat(0.4 + Nw.y);
        if (uOwn[6] < 0.0) {                               // dull: clay or pearl in the colour of the sound
          vec3 clay = dye * (0.5 + 0.6 * dye) * (vec3(1.0, 0.95, 0.88) * 1.35 * sat(ndl * 0.8 + 0.2) * (1.0 - glow) + (0.1 + 0.55 * day) * (0.6 + 0.4 * Nw.y) + 0.5 * lit * (0.3 + glow * 2.0)) * foot + uKind[4] * d.ring * 0.25;
          clay += vec3(1.0, 0.95, 0.9) * pow(sat(dot(R, prSun)), 14.0) * 0.12 * (1.0 - glow) + d.ring * 0.2;
          shade = mix(shade, clay, -uOwn[6]);
        }
        if (uOwn[6] > 0.0) shade = mix(shade, prRoom(R, below) * mix(vec3(1.0), 0.3 + d.hue, 0.8 * smoothstep(0.02, 0.4, lit)) * foot * (0.8 + fres) * 1.4 + lamp * 0.05 * (1.0 + 4.0 * glow) + uKind[4] * d.ring * 0.3, uOwn[6]);
      }
      col += (1.0 - alpha) * cov * shade;
      alpha += (1.0 - alpha) * cov;
      if (alpha > 0.985) break;
    }
    float tn = min(tMax.x, tMax.y);
    if (tn > t1) { // the bed: the lamp under the bead, seen past its foot, and its glow on the plate
      vec3 Q = roW + rdW * ty1;
      if (Q.z > 0.0 && Q.z < prN.y && (uOwn[4] >= 0.0 || rdW.y < 0.0)) {
        float dq = length(Q.xz - c.xz);
        vec3 plate = lamp * (smoothstep(0.25, 0.21, dq) * 1.2 + 0.10 * exp(-dq * dq * 9.0));
        plate *= 0.25 + 0.75 * smoothstep(r * 0.2, r * 1.2, dq + hop);   // the bead's own foot hides most of it
        if (glow > 0.0) { vec2 cell = fract(Q.xz) - 0.5; cell = 1.0 - 4.0 * cell * cell; plate += glow * lamp * 0.3 * exp(-dq * dq * 8.0) * cell.x * cell.y; }
        if (uOwn[6] != 0.0) plate *= 1.0 - sat(1.5 * abs(uOwn[6]));
        if (day > 0.0) {
          vec2 sv = Q.xz - c.xz + prSun.xz / max(prSun.y, 0.15) * (c.y - r * 0.3) * 0.5;
          vec3 g = prGround() * (0.5 + 0.5 * smoothstep(0.1 * r, 1.5 * r, length(sv))) * (0.6 + 0.4 * smoothstep(0.0, 1.4 * r, dq)) * 1.05;
          float vein = abs(fract((Q.x / prG - abs(Q.z / prG - 12.0) * 0.8) / 4.8) - 0.5) * 4.8 * prG;      // the ground has veins, as a leaf
          g *= (0.86 + 0.28 * noise(Q.xz * 0.6)) * (1.0 + 0.22 * smoothstep(0.22, 0.04, vein) + 0.22 * smoothstep(0.3, 0.1, abs(Q.z - 12.0 * prG)) - 0.1 * smoothstep(0.9, 0.2, vein));
          g = mix(g, g * (0.35 + d.hue), sat(lit * 1.5) * exp(-dq * dq * 6.0));
          plate = mix(plate, g, day);
        }
        col += (1.0 - alpha) * plate;
        alpha += (1.0 - alpha) * day;
      }
      break;
    }
    if (tMax.x < tMax.y) { tMax.x += tDel.x; id.x += stp.x; } else { tMax.y += tDel.y; id.y += stp.y; }
  }
  if (day > 0.0) {
    col += (1.0 - alpha) * away_;
    col = mix(col, away_ / max(day, 0.01), day * (1.0 - exp(-max(t0 - 8.0 * prG, 0.0) * 0.018 / prG)));
    return col * mix(exp(-max(ty1, 0.0) * 0.012), 1.9, day);
  }
  if (prOther) return col * exp(-clamp(uOwn[4] < 0.0 ? t1 : ty1, 0.0, 60.0) * 0.012 / prG);
  return col * exp(-ty1 * 0.012);
}

vec3 render(vec2 p) {
  float beads = step(0.5, uVar);
  prG = uOwn[0] == 0.0 ? 1.0 : floor(48.0 * exp2(uOwn[0] * (uOwn[0] > 0.0 ? 0.62 : 1.1)) + 0.5) / 48.0;
  prN = vec2(NX, NZ) * prG;
  if (uOwn[0] != 0.0) prN = floor(prN + 0.5);
  prOther = uOwn[0] != 0.0 || uOwn[1] != 0.0 || uOwn[3] != 0.0 || uOwn[5] != 0.0;
  prSteps = beads > 0.5 ? 12 : 22;
  if (prOther || uOwn[4] != 0.0) prSteps += (beads > 0.5 ? 2 : 4) + int(12.0 * max(prG - 1.0, 0.0)) + int((beads > 0.5 ? 9.0 : 16.0) * max(-uOwn[4], 0.0)) + int(beads * 24.0 * abs(uOwn[5]));
  vec3 sun = SUN;
  if (uOwn[7] > 0.0) sun = mix(sun, vec3(0.16, 0.2, 0.95), uOwn[7]);
  if (uOwn[7] < 0.0) sun = mix(sun, vec3(-0.3, 1.5, -0.35), -uOwn[7]);
  prSun = normalize(sun);
  prSun += step(abs(prSun), vec3(1e-3)) * 2e-3;
  float px = uLoop * NX;
  vec3 ro = vec3(px + 1.5 + 4.0 * sin(uTime * 0.08), mix(8.6, 4.6, beads) + 0.6 * sin(uTime * 0.06), mix(-1.0, 0.5, beads));
  vec3 ta = vec3(px + 1.0 - 2.0 * sin(uTime * 0.08), 0.8, mix(10.5, 8.0, beads));
  if (uOwn[4] > 0.0) { ro = mix(ro, vec3(px + 1.0 + 1.5 * sin(uTime * 0.08), mix(17.0, 11.0, beads), 10.0), uOwn[4]); ta = mix(ta, vec3(px + 1.0 + 1.2 * sin(uTime * 0.08), 0.0, 11.6), uOwn[4]); }
  if (uOwn[4] < 0.0) { ro = mix(ro, vec3(ro.x, mix(3.1, 1.75, beads), mix(-3.4, -1.6, beads)), -uOwn[4]); ta = mix(ta, vec3(ta.x, mix(2.3, 1.15, beads), 10.0), -uOwn[4]); }
  if (uOwn[0] != 0.0) { ro = vec3(px * prG + (ro.x - px) * prG, ro.y * prG, ro.z * prG); ta = vec3(px * prG + (ta.x - px) * prG, ta.y * prG, ta.z * prG); }
  vec3 fw = normalize(ta - ro), rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)), up = cross(fw, rt);
  p = rot(0.05 * sin(uTime * 0.05)) * p;
  vec3 rd = normalize(fw * mix(1.05, 1.0, beads) + rt * p.x + up * p.y);
  vec3 col;
  if (uVar < 0.5) col = ivoryBed(ro, rd); else col = beadBed(ro, rd);
  return tone(col * 1.15);
}
