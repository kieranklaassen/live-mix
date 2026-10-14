// name: Pin relief
// a: Ivory pins
// b: Glass beads
// what: The piece pressed into a bed of pins seen from above at a slant, across the loop and away into the room, where a hard low light picks out each pin that stands up and throws its shadow on the next.
// follows: Loudness raises the pins, highest at the place now playing, which the view glides along with; the piece's colours fill the shadows; a hit or cue presses a ripple out through the bed.
const float NX = 48.0, NZ = 24.0; // pins across the loop, and away through the room
const float RISE = 3.4, PR = 0.39; // how high a pin can stand, and how thick it is
const vec3 SUN = vec3(-0.66, 0.36, 0.52); // toward the light: low, from the far left

vec3 tone(vec3 c) { c = max(c, 0.0); float l = max(c.r, max(c.g, c.b)); c *= (1.0 + l * 0.1) / (1.0 + l); c = mix(c, vec3(l / (1.0 + l)), sat(l * 0.12 - 0.1)); return pow(c, vec3(0.4545)); }
float bump(float x) { x = sat(1.0 - x * x); return x * x; }

struct Pin { float h; vec3 hue; float loud; float ring; };

Pin pinAt(vec2 id) {
  vec2 uv = vec2(fract((id.x + 0.5) / NX), 1.0 - (id.y + 0.5) / NZ);
  vec4 m = piece(uv);
  Pin d;
  d.loud = sat(m.a * (0.6 + 0.6 * uEnergy));
  d.hue = m.rgb / max(m.a, 0.001);
  d.hue = max(mix(vec3(dot(d.hue, vec3(0.3333))), d.hue, 1.9), 0.0);
  float dx = (fract(uv.x - uLoop + 0.5) - 0.5) * NX;
  float head = bump(dx * 0.11);
  float dist = length(vec2(dx, id.y + 0.5 - NZ * 0.45));
  // a hit presses a ripple out: a ring of pins pushed down, and just outside it a ring thrown up
  float ra = (1.0 - uHits) * 20.0, rb = (1.0 - uCue) * 30.0;
  float up = uHits * bump((dist - ra) * 0.55) + 0.7 * uCue * bump((dist - rb) * 0.4);
  float down = uHits * bump((dist - ra + 2.0) * 0.5) + 0.7 * uCue * bump((dist - rb + 2.6) * 0.4);
  d.ring = up;
  d.h = 0.22 + RISE * d.loud * sqrt(d.loud) * (0.4 + 0.6 * head);
  d.h = d.h * (1.0 - 0.75 * down) + 1.1 * up;
  if (uv.y < 0.0 || uv.y > 1.0) d.h = 0.0;
  return d;
}

// How much of the side light reaches a place: 0 in the shadow of the pins between it and the light.
float shadowOf(vec3 p) {
  vec3 l = normalize(SUN), inv = 1.0 / l;
  vec2 id = floor(p.xz), stp = sign(l.xz);
  vec2 tMax = (id + max(stp, 0.0) - p.xz) * inv.xz, tDel = abs(inv.xz);
  float lit = 1.0;
  float a = dot(l.xz, l.xz);
  for (int i = 0; i < 10; i++) {
    if (tMax.x < tMax.y) { tMax.x += tDel.x; id.x += stp.x; } else { tMax.y += tDel.y; id.y += stp.y; }
    Pin d = pinAt(id);
    vec2 oc = id + 0.5 - p.xz;
    float b = dot(oc, l.xz), c = dot(oc, oc) - PR * PR, disc = b * b - a * c;
    float s = (b - sqrt(max(disc, 0.0))) / a;            // where the ray to the light enters this pin's column
    float under = d.h - (p.y + l.y * s);                   // how far below the pin's top it is there
    float edge = smoothstep(0.0, 0.03, disc);              // a soft edge to the shadow
    lit *= 1.0 - edge * smoothstep(0.0, 0.12, under);
    if (lit < 0.02 || p.y + l.y * min(tMax.x, tMax.y) > RISE + 1.4) break;
  }
  return lit;
}

vec3 ivoryBed(vec3 ro, vec3 rd) {
  rd += step(abs(rd), vec3(1e-4)) * 2e-4; // never exactly along a row of cells
  float H = 0.22 + RISE + 1.1 * max(uHits, 0.7 * uCue) + 0.05;
  vec3 inv = 1.0 / rd;
  float ty0 = (H - ro.y) * inv.y, ty1 = -ro.y * inv.y, tz0 = -ro.z * inv.z, tz1 = (NZ - ro.z) * inv.z;
  float t0 = max(max(ty0, min(tz0, tz1)), 0.0), t1 = min(ty1, max(tz0, tz1));
  if (t1 <= t0 || rd.y > -1e-3) return vec3(0.0);
  vec3 p = ro + rd * (t0 + 1e-3);
  vec2 id = floor(p.xz), stp = sign(rd.xz);
  vec2 tMax = (id + max(stp, 0.0) - ro.xz) * inv.xz, tDel = abs(inv.xz);
  float a = dot(rd.xz, rd.xz);
  float tHit = -1.0; vec3 n = vec3(0.0, 1.0, 0.0); Pin hit; hit.h = 0.0; hit.loud = 0.0; hit.ring = 0.0; hit.hue = vec3(0.0);
  vec2 hid = vec2(0.0);
  for (int i = 0; i < 22; i++) {
    Pin d = pinAt(id);
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
  if (tHit < 0.0) return vec3(0.0);
  vec3 P = ro + rd * tHit;
  vec3 l = normalize(SUN);
  float sh = shadowOf(P + n * 0.004);
  // the light skims over the bed: a pin at rest stays in the dark, a pin that stands up comes into it
  float reach = smoothstep(0.3, 1.0, P.y);
  float ndl = dot(n, l);
  vec3 ivory = vec3(0.93, 0.87, 0.76);
  vec2 q = P.xz - hid - 0.5; float rr = length(q) / PR;
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
  col *= exp(-tHit * 0.012);
  return col;
}

// What a glass bead sees in a given direction: the light, a little of the room, and below it the glow of the bed.
vec3 around(vec3 d, vec3 below) {
  vec3 l = normalize(SUN);
  float s = sat(dot(d, l));
  float s2 = s * s; s2 *= s2; s2 *= s2; s2 *= s2;
  return vec3(1.0, 0.94, 0.85) * (s2 * s2 * s2 * s2 * 7.0 + s2 * 0.12) + below * sat(-d.y * 1.5 + 0.2) * 0.7;
}

vec3 beadBed(vec3 ro, vec3 rd) {
  rd += step(abs(rd), vec3(1e-4)) * 2e-4; // never exactly along a row of cells
  float H = 0.9 + 0.9 * max(uHits, 0.7 * uCue) + 0.05;
  vec3 inv = 1.0 / rd;
  float ty0 = (H - ro.y) * inv.y, ty1 = -ro.y * inv.y, tz0 = -ro.z * inv.z, tz1 = (NZ - ro.z) * inv.z;
  float t0 = max(max(ty0, min(tz0, tz1)), 0.0), t1 = min(ty1, max(tz0, tz1));
  if (t1 <= t0 || rd.y > -1e-3) return vec3(0.0);
  vec3 p = ro + rd * (t0 + 1e-3);
  vec2 id = floor(p.xz), stp = sign(rd.xz);
  vec2 tMax = (id + max(stp, 0.0) - ro.xz) * inv.xz, tDel = abs(inv.xz);
  vec3 col = vec3(0.0); float alpha = 0.0;
  for (int i = 0; i < 12; i++) {
    Pin d = pinAt(id);
    float lit = d.loud * (0.6 + 0.4 * sqrt(sat((d.h - 0.22) / RISE * 2.0))) + 0.6 * d.ring; // how bright the lamp under this bead is
    float r = 0.2 + 0.23 * sqrt(sat(lit));
    float hop = 0.5 * d.ring;
    vec3 c = vec3(id.x + 0.5, r + hop, id.y + 0.5);
    vec3 lamp = d.hue * lit * 2.6 + vec3(1.0, 0.9, 0.8) * d.ring * 0.5;
    vec3 below = d.hue * lit;
    vec3 oc = c - ro; float tca = dot(oc, rd), d2 = dot(oc, oc) - tca * tca, dd = sqrt(max(d2, 0.0));
    float w = 0.008 + tca * 1.1 / uRes.y;
    float cov = smoothstep(r + w, r - w, dd);
    if (cov > 0.0) {
      float hh = sqrt(max(r * r - min(d2, r * r * 0.985), 0.0));
      vec3 P1 = ro + rd * (tca - hh) + (dd > r * 0.992 ? (c - (ro + rd * tca)) * (1.0 - r * 0.992 / dd) : vec3(0.0));
      vec3 N1 = normalize(P1 - c);
      float cosi = sat(-dot(N1, rd));
      float fres = 0.04 + 0.96 * pow(1.0 - cosi, 5.0);
      // through the glass: bent in, across the bead, bent out, then down to the lamp in the bed
      vec3 rin = refract(rd, N1, 1.0 / 1.5);
      vec3 P2 = P1 + rin * (2.0 * r * sat(-dot(N1, rin)));
      vec3 N2 = normalize(P2 - c);
      vec3 rout = refract(rin, -N2, 1.5);
      vec3 through = vec3(0.0);
      if (rout.y < -0.01) {
        vec3 Q = P2 + rout * (-P2.y / rout.y);
        float dq = length(Q.xz - c.xz);
        through = lamp * (1.5 * exp(-dq * dq * 10.0) + 1.6 * smoothstep(0.2, 0.1, dq));
      }
      through += around(rout, below) * 0.12;
      through += d.hue * lit * 0.035;                             // the glass itself holds a little of the colour
      vec3 shade = through * (1.0 - fres) + around(reflect(rd, N1), below) * fres;
      col += (1.0 - alpha) * cov * shade;
      alpha += (1.0 - alpha) * cov;
      if (alpha > 0.985) break;
    }
    float tn = min(tMax.x, tMax.y);
    if (tn > t1) { // the bed: the lamp under the bead, seen past its foot, and its glow on the plate
      vec3 Q = ro + rd * ty1;
      if (Q.z > 0.0 && Q.z < NZ) {
        float dq = length(Q.xz - c.xz);
        vec3 plate = lamp * (smoothstep(0.25, 0.21, dq) * 1.2 + 0.10 * exp(-dq * dq * 9.0));
        plate *= 0.25 + 0.75 * smoothstep(r * 0.2, r * 1.2, dq + hop);   // the bead's own foot hides most of it
        col += (1.0 - alpha) * plate;
      }
      break;
    }
    if (tMax.x < tMax.y) { tMax.x += tDel.x; id.x += stp.x; } else { tMax.y += tDel.y; id.y += stp.y; }
  }
  return col * exp(-ty1 * 0.012);
}

vec3 render(vec2 p) {
  float px = uLoop * NX;
  float beads = step(0.5, uVar);
  vec3 ro = vec3(px + 1.5 + 4.0 * sin(uTime * 0.08), mix(8.6, 4.6, beads) + 0.6 * sin(uTime * 0.06), mix(-1.0, 0.5, beads));
  vec3 ta = vec3(px + 1.0 - 2.0 * sin(uTime * 0.08), 0.8, mix(10.5, 8.0, beads));
  vec3 fw = normalize(ta - ro), rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)), up = cross(fw, rt);
  p = rot(0.05 * sin(uTime * 0.05)) * p;
  vec3 rd = normalize(fw * mix(1.05, 1.0, beads) + rt * p.x + up * p.y);
  vec3 col;
  if (uVar < 0.5) col = ivoryBed(ro, rd); else col = beadBed(ro, rd);
  return tone(col * 1.15);
}
