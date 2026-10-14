// name: Dot wall
// a: Facing
// b: Along the wall
// what: The piece as a wall of glass bulbs over a wet dark floor: across is the loop, up is the room, and the view glides along with the place now playing.
// follows: Loudness in the piece swells each bulb and pushes it out of the wall, furthest at the playing place; a hit or cue sends a ring of bulbs out across the wall.
const float NX = 40.0, NY = 16.0, ZB = 0.55; // bulbs across the loop and up the room; the back plate is at z = ZB
const vec3 KEY = vec3(-0.45, 0.65, -0.61);

// From light to the screen, keeping the colour as it gets bright.
vec3 tone(vec3 c) { c = max(c, 0.0); float l = max(c.r, max(c.g, c.b)); c *= (1.0 + l * 0.1) / (1.0 + l); c = mix(c, vec3(l / (1.0 + l)), sat(l * 0.07 - 0.1)); return pow(c, vec3(0.4545)); }

struct Dot { vec3 c; float r; vec3 hue; float loud; float ring; };

float pushMax() { return mix(3.2, 2.2, uVar); }

Dot dotAt(vec2 id) {
  vec2 uv = vec2(fract((id.x + 0.5) / NX), 1.0 - (id.y + 0.5) / NY);
  vec4 m = piece(uv);
  Dot d;
  d.loud = sat(m.a * (0.6 + 0.6 * uEnergy));
  d.hue = m.rgb / max(m.a, 0.001);
  d.hue = max(mix(vec3(dot(d.hue, vec3(0.3333))), d.hue, 1.9), 0.0); // a little deeper than the map gives
  float dx = (fract(uv.x - uLoop + 0.5) - 0.5) * NX; // bulbs from the place now playing
  float head = exp(-dx * dx * 0.035);
  float dist = length(vec2(dx, id.y + 0.5 - NY * 0.55));
  float a = dist - (1.0 - uHits) * 20.0, b = dist - (1.0 - uCue) * 34.0;
  d.ring = uHits * exp(-a * a * 0.3) + 0.7 * uCue * exp(-b * b * 0.12);
  d.r = min(0.45, 0.11 + 0.31 * sqrt(d.loud) + 0.2 * d.ring);
  d.c = vec3(id + 0.5, -(pushMax() * pow(d.loud, 1.5) * (0.42 + 0.58 * head) + 1.6 * d.ring));
  return d;
}

vec3 shadeDot(Dot d, vec3 n, vec3 rd) {
  float ndv = sat(-dot(n, rd));
  vec3 e = d.hue * d.loud * (0.04 + 1.05 * pow(ndv, 3.4));                         // a glass bulb: the light sits in its middle
  e += mix(d.hue, vec3(1.0), 0.25) * pow(ndv, 12.0) * d.loud * d.loud * 0.9;      // its hot heart
  e += d.hue * pow(1.0 - ndv, 2.5) * (0.02 + 0.32 * d.loud);                        // and the glass shows as a rim
  e += vec3(0.012, 0.016, 0.022) * (0.3 + ndv);
  vec3 h = normalize(normalize(KEY) - rd);
  e += vec3(0.6, 0.75, 1.0) * pow(sat(dot(n, h)), 90.0) * 0.9;                    // glass catches a cold key light
  e += mix(d.hue, vec3(1.0, 0.9, 0.8), 0.22) * d.ring * (0.1 + 0.9 * ndv * ndv * ndv) * 0.9;            // the ring of a hit
  return e;
}

// The wall along a ray. Returns light (rgb) and how much of the ray it stopped (a).
vec4 wall(vec3 ro, vec3 rd, float soft, float focus) {
  rd += step(abs(rd), vec3(1e-4)) * 2e-4; // never exactly along a row of cells
  float zf = -(pushMax() + 1.6 + 0.5);
  // the slab between the front of the furthest bulb and the plate, the height of the wall
  vec3 inv = 1.0 / rd;
  float tz0 = (zf - ro.z) * inv.z, tz1 = (ZB - ro.z) * inv.z;
  float ty0 = (0.0 - ro.y) * inv.y, ty1 = (NY - ro.y) * inv.y;
  float t0 = max(max(min(tz0, tz1), min(ty0, ty1)), 0.0), t1 = min(max(tz0, tz1), max(ty0, ty1));
  if (t1 <= t0) return vec4(0.0);
  vec3 p = ro + rd * (t0 + 1e-3);
  vec2 id = floor(p.xy), stp = sign(rd.xy);
  vec2 tMax = (id + max(stp, 0.0) - ro.xy) * inv.xy, tDel = abs(inv.xy);
  vec3 col = vec3(0.0); float alpha = 0.0;
  for (int i = 0; i < 44; i++) {
    if (id.y >= 0.0 && id.y < NY) {
      Dot d = dotAt(id);
      vec3 oc = d.c - ro; float tca = dot(oc, rd), d2 = dot(oc, oc) - tca * tca, dd = sqrt(max(d2, 0.0));
      float w = min(soft * (0.01 + 0.0035 * abs(tca - focus)) + tca * 1.1 / uRes.y, 0.49 - d.r) ;
      w = max(w, 0.004);
      float cov = smoothstep(d.r + w, d.r - w, dd) * step(0.0, tca);
      float fog = exp(-tca * 0.05 * uVar);
      if (cov > 0.0) {
        float hh = sqrt(max(d.r * d.r - d2, 0.0));
        vec3 n = normalize(ro + rd * (tca - hh) - d.c);
        col += (1.0 - alpha) * cov * shadeDot(d, n, rd) * fog;
        alpha += (1.0 - alpha) * cov;
      }
      float g = sat((0.5 - dd) / (0.5 - d.r)); // light spilling just past the bulb
      col += (1.0 - alpha) * d.hue * (d.loud * d.loud * 0.4 + 0.4 * d.ring) * g * g * fog * step(0.0, tca);
      if (alpha > 0.985) break;
    }
    float tn = min(tMax.x, tMax.y);
    if (tn > t1) break;
    if (tMax.x < tMax.y) { tMax.x += tDel.x; id.x += stp.x; } else { tMax.y += tDel.y; id.y += stp.y; }
  }
  // the plate behind, lit by the bulb in front of it
  float tp = (ZB - ro.z) * inv.z;
  vec3 q = ro + rd * tp;
  if (alpha < 0.985 && tp > 0.0 && q.y > 0.0 && q.y < NY) {
    Dot d = dotAt(floor(q.xy));
    vec3 lv = d.c - q; float l2 = dot(lv, lv);
    vec2 fc = abs(fract(q.xy) - 0.5);
    float lit = d.loud * d.r * d.r * 2.2 * (-lv.z) / (l2 * sqrt(l2) + 0.02) * smoothstep(0.5, 0.12, length(fc));
    vec4 m = piece(vec2(fract(q.x / NX), 1.0 - q.y / NY));
    vec3 plate = d.hue * lit * 0.4 + m.rgb * m.a * 0.008;
    col += (1.0 - alpha) * plate * exp(-tp * 0.05 * uVar);
    alpha = 1.0;
  }
  return vec4(col, alpha);
}

// A soft cloud of the piece's light hanging just in front of the wall.
vec3 haze(vec3 ro, vec3 rd, float amount) {
  float tp = (-1.0 - ro.z) / rd.z;
  if (tp < 0.0) return vec3(0.0);
  vec3 q = ro + rd * tp;
  float v = 1.0 - q.y / NY;
  vec3 s = vec3(0.0);
  for (int i = 0; i < 4; i++) {
    vec2 o = vec2(float(i % 2) - 0.5, float(i / 2) - 0.5);
    vec4 m = piece(vec2(fract((q.x + o.x * 3.0) / NX), clamp(v + o.y * 0.12, 0.0, 1.0)));
    s += m.rgb * m.a;
  }
  float edge = smoothstep(-0.2, 0.15, v) * smoothstep(1.25, 0.9, v);
  return s * 0.25 * amount * edge;
}

vec3 render(vec2 p) {
  float px = uLoop * NX; // the place now playing, in bulbs along the wall
  vec3 ro, ta; float focal;
  if (uVar < 0.5) {
    ro = vec3(px + 3.5 + 6.5 * sin(uTime * 0.09), 6.6 + 1.0 * sin(uTime * 0.063 + 1.0), -15.5 + 1.5 * sin(uTime * 0.05));
    ta = vec3(px + 1.5 - 2.5 * sin(uTime * 0.09), 7.1, 0.0);
    focal = 0.86;
  } else {
    ro = vec3(px - 9.0, 2.2 + 0.6 * sin(uTime * 0.07), -11.0 + 1.0 * sin(uTime * 0.05));
    ta = vec3(px + 9.0, 6.6, 0.0);
    focal = 0.75;
  }
  vec3 fw = normalize(ta - ro), rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)), up = cross(fw, rt);
  vec3 rd = normalize(fw * focal + rt * p.x + up * p.y);
  float focus = length(ta - ro);
  vec4 w = wall(ro, rd, 1.0, focus);
  vec3 col = w.rgb;
  float hz = mix(0.04, 0.3, uVar);
  col += (1.0 - 0.6 * w.a) * haze(ro, rd, hz) * exp(-max((-1.0 - ro.z) / rd.z, 0.0) * 0.012 * uVar);
  // the floor: dark and wet, it mirrors the wall and takes a little of its light
  const float FY = -0.35;
  if (w.a < 0.99 && rd.y < 0.0) {
    float tf = (FY - ro.y) / rd.y;
    vec3 f = ro + rd * tf;
    if (f.z < ZB) {
      float kx = TAU / NX;
      vec2 rip = vec2(sin(f.x * kx * 9.0 + f.z * 1.3) + sin(f.x * kx * 23.0 - f.z * 2.9 + 1.0), sin(f.z * 2.1 + f.x * kx * 14.0) + sin(f.z * 5.3 - f.x * kx * 31.0));
      vec3 n = normalize(vec3(0.0, 1.0, (rip.y * 0.012 + rip.x * 0.006) / (1.0 + tf * tf * 0.012) * (1.0 - 0.6 * uVar)));
      vec3 rr = reflect(rd, n);
      vec4 m = wall(f, rr, 3.0, 0.0);
      vec3 refl = m.rgb + haze(f, rr, hz);
      float fres = 0.10 + 0.75 * pow(1.0 - sat(-rd.y), 3.0);
      float dw = ZB - f.z;
      vec4 base = piece(vec2(fract(f.x / NX), 0.93));
      vec3 spill = base.rgb * base.a * (0.5 / (1.0 + dw * dw * 0.6) + 0.5 / (1.0 + dw * dw * 0.02) * pow(1.0 - sat(-rd.y), 6.0) * exp(-tf * 0.03)); // light pooling at the foot of the wall, and a sheen further out
      col += (1.0 - w.a) * (refl * fres + spill * 0.35) * exp(-tf * 0.012 * uVar);
    }
  }
  return tone(col * 1.25);
}
