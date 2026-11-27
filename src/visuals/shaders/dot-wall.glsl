// name: Dot wall
// a: Facing
// b: Along the wall
// what: The piece as a wall of glass bulbs over a wet dark floor: across is the loop, up is the room, and the view glides along with the place now playing.
// follows: Loudness in the piece swells each bulb and pushes it out of the wall, furthest at the playing place; a hit or cue sends a ring of bulbs out across the wall.
// own: 0 1 twice as many small bulbs, -1 a third as many great ones; 1 1 strewn out of line, of every size, many gone, -1 whole patches of the wall are broken away; 2 1 the bulbs join into rods along the wall, -1 into upright posts; 3 1 the wall stands in deep upright folds, -1 long swells roll slowly up it; 4 the air: 1 daylight, pale plaster and a pale floor, -1 dusk, with a low glow of the sounds' colours behind; 5 1 dull solid beads under one sun, -1 clear bubbles; 6 1 the wall lies down as a field going away from you, -1 the eye stands close up to it; 7 1 the floor is flooded and still and mirrors a part of the wall, -1 dry ground that mirrors nothing
const float NX = 40.0, NY = 16.0, ZB = 0.55; // bulbs across the loop and up the room; the back plate is at z = ZB
const vec3 KEY = vec3(-0.45, 0.65, -0.61);

// From light to the screen, keeping the colour as it gets bright.
vec3 tone(vec3 c) { c = max(c, 0.0); float l = max(c.r, max(c.g, c.b)); c *= (1.0 + l * 0.1) / (1.0 + l); c = mix(c, vec3(l / (1.0 + l)), sat(l * 0.07 - 0.1)); return pow(c, vec3(0.4545)); }

struct Dot { vec3 c; float r; vec3 hue; float loud; float ring; float reach; };

// The wall of this world: how large it is in bulbs beside the plain one, how far bulbs push out and how deep it folds, how far
// up it the water stands, the sun and the air.
bool gOther;
float gS, gNx, gNy, gPush, gFold, gBase, gRod;
vec3 gSun, gAxis;
float pushMax() { return gPush; }

// How much of the wall still stands at a place of it: 1 wholly, 0 broken away.
float stands(vec2 uv) {
  float x = uv.x * TAU, y = uv.y * 9.0;
  float f = 0.5 * sin(3.0 * x + 1.1 * y) + 0.4 * sin(7.0 * x - 1.7 * y + 1.0) + 0.3 * sin(13.0 * x + 2.6 * y + 2.0) + 0.5 * (uv.y - 0.4);
  return mix(1.0, smoothstep(-0.12, 0.1, f), max(-uOwn[1], 0.0));
}

// What is behind everything.
vec3 air(vec3 rd) {
  float pale = max(uOwn[4], 0.0), dusk = max(-uOwn[4], 0.0);
  float up = uOwn[6] > 0.0 ? mix(rd.y, -rd.z, uOwn[6]) : rd.y;
  vec3 c = pale * mix(vec3(1.15, 1.12, 1.07), vec3(0.5) + 0.2 * uKind[1], 0.75 * smoothstep(-0.05, 0.5, up)) * (1.0 + 0.08 * uLevel);
  if (dusk > 0.0) {
    float low = exp(-abs(up) * 5.5), line = exp(-abs(up + 0.02) * 14.0);
    c += dusk * (uKind[1] * uKind[1] * 0.22 * exp(-max(up, 0.0) * 1.6) + mix(uKind[3], uKind[1], 0.35) * low * (0.5 + 0.2 * uLevel) + (0.6 * uKind[3] + 0.35) * line * 0.5);
  }
  return c;
}
vec3 plaster(vec2 q, vec3 n, float near) {
  vec2 uv = vec2(fract(q.x / gNx), q.y / gNy);
  vec4 m = piece(vec2(uv.x, 1.0 - uv.y));
  vec3 c = mix(mix(vec3(0.78, 0.76, 0.72), uKind[4] * 0.6, 0.75 * max(uOwn[6], 0.0)), m.rgb / max(m.a, 0.001), 0.4 * sat(m.a)) * mix(vec3(1.0), 0.5 + 0.6 * uKind[1], 0.3);
  float px = (fract(uv.x - uLoop + 0.5) - 0.5) * gNx / gS, dist = length(vec2(px, q.y / gS - NY * 0.55)), a = (dist - (1.0 - uHits) * 20.0) * 0.3, b = (dist - (1.0 - uCue) * 34.0) * 0.25;
  c = mix(c, uKind[4] * 0.8, 0.75 * sat(uHits * exp(-a * a) + 0.7 * uCue * exp(-b * b)));
  return c * (0.55 + 0.6 * sat(dot(n, gSun))) * (1.0 - 0.75 * near) * (0.95 + 0.1 * noise(vec2(mod(q.x, gNx), q.y) * 4.0));
}

Dot dotAt(vec2 id) {
  vec2 uv = vec2(fract((id.x + 0.5) / gNx), 1.0 - (id.y + 0.5) / gNy);
  vec4 m = piece(uv);
  Dot d;
  d.loud = sat(m.a * (0.6 + 0.6 * uEnergy));
  d.hue = m.rgb / max(m.a, 0.001);
  d.hue = max(mix(vec3(dot(d.hue, vec3(0.3333))), d.hue, 1.9), 0.0); // a little deeper than the map gives
  float dx = (fract(uv.x - uLoop + 0.5) - 0.5) * NX; // bulbs from the place now playing
  float head = exp(-dx * dx * 0.035);
  float dist = length(vec2(dx, (gOther ? (id.y + 0.5) / gS : id.y + 0.5) - NY * 0.55));
  float a = dist - (1.0 - uHits) * 20.0, b = dist - (1.0 - uCue) * 34.0;
  d.ring = uHits * exp(-a * a * 0.3) + 0.7 * uCue * exp(-b * b * 0.12);
  if (gOther) d.ring = mix(d.ring, uHits * exp(-a * a * 0.09) + 0.7 * uCue * exp(-b * b * 0.06), 0.8);
  d.r = min(0.45, 0.11 + 0.31 * sqrt(d.loud) + 0.2 * d.ring);
  d.c = vec3(id + 0.5, -(pushMax() * pow(d.loud, 1.5) * (0.42 + 0.58 * head) + 1.6 * d.ring));
  d.reach = 0.5;
  if (gOther) {
    vec2 cell = vec2(mod(id.x, gNx), id.y);
    float h = hash21(cell + 0.7), h2 = hash21(cell + 33.1), on = 1.0;
    if (uOwn[2] != 0.0) { vec2 line = uOwn[2] > 0.0 ? vec2(5.5, cell.y) : vec2(cell.x, 5.5); h = mix(h, hash21(line), abs(uOwn[2])); h2 = mix(h2, hash21(line + 31.0), abs(uOwn[2])); }
    float rest = max(max(max(abs(uOwn[1]), abs(uOwn[2])), max(abs(uOwn[3]), abs(uOwn[4]))), max(abs(uOwn[5]), abs(uOwn[6])));
    d.hue = mix(d.hue, mix(uKind[1], uKind[0], sat(uv.y * 1.2 - 0.2 + 0.4 * (h - 0.5))), smoothstep(0.12, 0.0, m.a));
    d.r = max(d.r, rest * (0.16 + 0.12 * h2)); d.loud = max(d.loud, 0.2 * rest);
    float out_ = d.c.z * min(gS, 1.0) - 0.5 * (1.0 - min(gS, 1.0)) * d.ring;
    if (uOwn[1] > 0.0) {
      vec2 o = uOwn[1] * 0.42 * vec2(fract(h * 57.31) - 0.5, fract(h2 * 91.7) - 0.5);
      on = mix(1.0, smoothstep(0.22, 0.34, h), uOwn[1]);
      d.r = min(d.r * mix(1.0, 0.5 + 0.9 * h2 * h2 + 0.35 * h, uOwn[1]), 0.48 - length(o));
      d.c.xy += o; d.reach -= length(o); out_ -= uOwn[1] * 0.9 * fract(h * 17.3);
    }
    if (uOwn[1] < 0.0) on = stands(vec2(uv.x, 1.0 - uv.y));
    if (uOwn[3] > 0.0) out_ -= gFold * (0.5 + 0.5 * sin(TAU * 5.0 * uv.x + 0.9 * sin(uv.y * 5.0 + uTime * 0.11) + 0.3 * sin(uTime * 0.17)));
    if (uOwn[3] < 0.0) out_ -= gFold * (0.5 + 0.5 * sin(uv.y * 8.0 + 0.9 * sin(TAU * 2.0 * uv.x) + uTime * 0.22));
    if (uOwn[2] != 0.0) { out_ *= 1.0 - 0.8 * abs(uOwn[2]) * (1.0 - min(abs(uOwn[3]), 1.0)); d.r = mix(d.r, 0.17 + 0.5 * d.r, abs(uOwn[2])); }
    d.c.z = max(out_, -(1.35 * gPush + gFold + 1.6));
    d.r = max(d.r * on, 0.006); d.loud *= on; d.ring *= on;
    d.reach = max(d.reach, d.r + 0.02);
  }
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

// What a bulb is made of here: was is the plain glass; bare is how much of what is behind it it hides.
vec3 made(vec3 was, Dot d, vec3 n, vec3 rd, out float bare) {
  float pale = max(uOwn[4], 0.0), dull = max(uOwn[5], 0.0), clear = max(-uOwn[5], 0.0), ndv = sat(-dot(n, rd)), rim = 1.0 - ndv;
  float glint = pow(sat(dot(n, normalize(gSun - rd))), 70.0), wrap = sat(dot(n, gSun) * 0.8 + 0.2);
  vec3 deep = d.hue * (0.45 + 0.55 * d.hue);
  vec3 day = deep * d.hue * (0.3 + 0.9 * sat(0.5 + 0.5 * dot(n, gSun)) + 0.5 * d.loud * ndv * ndv) + vec3(1.0) * glint * 0.5 + 0.12 * deep * rim * rim;
  day = mix(day, mix(d.hue, uKind[4], 0.7) * 1.4, sat(d.ring));
  vec3 solid = (0.05 + deep) * (0.025 + 0.2 * pale + 1.7 * wrap * wrap) * (0.55 + 0.75 * d.loud) + deep * d.loud * 0.06 + mix(d.hue, uKind[4], 0.5) * d.ring * 0.9;
  vec3 glass = d.hue * (0.04 + 1.7 * rim * rim * rim * (0.35 + d.loud) + 0.3 * d.loud * d.loud * ndv * ndv) + vec3(0.9, 0.95, 1.0) * (glint * 1.2 + 0.4 * pow(sat(dot(n, normalize(vec3(0.5, -0.45, -0.75)))), 24.0)) + d.hue * d.ring * 0.7;
  bare = mix(1.0, sat(0.1 + 0.9 * rim * rim + 0.25 * d.loud * d.loud + glint), clear);
  return mix(mix(mix(was, day, pale), solid, dull), glass, clear);
}

// The wall along a ray. Returns light (rgb) and how much of the ray it stopped (a).
vec4 wall(vec3 ro, vec3 rd, float soft, float focus) {
  float fogK = 0.05 * uVar; if (gOther) { fogK *= 1.0 - 0.65 * max(abs(uOwn[4]), max(uOwn[6], 0.0)); fogK = max(fogK, 0.011 * max(abs(uOwn[4]), uOwn[6])) / max(gS, 0.6); }
  rd += step(abs(rd), vec3(1e-4)) * 2e-4; // never exactly along a row of cells
  float zf = -(pushMax() * (gOther ? 1.35 : 1.0) + gFold + 1.6 + 0.5);
  vec3 sky = gOther ? air(rd) : vec3(0.0);
  // the slab between the front of the furthest bulb and the plate, the height of the wall
  vec3 inv = 1.0 / rd;
  float tz0 = (zf - ro.z) * inv.z, tz1 = (ZB - ro.z) * inv.z;
  float ty0 = (gBase - ro.y) * inv.y, ty1 = (gNy - ro.y) * inv.y;
  float t0 = max(max(min(tz0, tz1), min(ty0, ty1)), 0.0), t1 = min(max(tz0, tz1), max(ty0, ty1));
  if (t1 <= t0) return vec4(0.0);
  vec3 p = ro + rd * (t0 + 1e-3);
  vec2 id = floor(p.xy), stp = sign(rd.xy);
  vec2 tMax = (id + max(stp, 0.0) - ro.xy) * inv.xy, tDel = abs(inv.xy);
  vec3 col = vec3(0.0); float alpha = 0.0;
  for (int i = 0; i < 60; i++) {
    if (i >= (gOther ? (soft > 2.0 ? 28 : uVar < 0.5 && uOwn[6] < 0.5 ? 60 : 46) : 44)) break;
    if (id.y >= 0.0 && id.y < gNy) {
      Dot d = dotAt(id);
      float whole = 1.0;
      if (gRod > 0.0) {                              // a rod: the place along it nearest the ray; a whole one has no ends
        vec3 w = ro - d.c; float b = dot(rd, gAxis), k = 1.0 - b * b, along = (dot(gAxis, w) - b * dot(rd, w)) / max(k, 0.02);
        whole = 1.0 - smoothstep(0.75, 1.0, abs(uOwn[2])) * smoothstep(0.04, 0.14, abs(along) - gRod);
        d.c += gAxis * clamp(along, -gRod, gRod);
      }
      vec3 oc = d.c - ro; float tca = dot(oc, rd), d2 = dot(oc, oc) - tca * tca, dd = sqrt(max(d2, 0.0));
      float w = min(soft * (0.01 + 0.0035 / gS * abs(tca - focus)) + tca * 1.1 / uRes.y, 0.49 - d.r) ;
      w = max(w, 0.004);
      float cov = smoothstep(d.r + w, d.r - w, dd) * step(0.0, tca);
      float fog = exp(-tca * fogK);
      if (gOther && d.r < 0.007) cov = 0.0;
      if (cov > 0.0) {
        float hh = sqrt(max(d.r * d.r - d2, 0.0));
        vec3 n = normalize(ro + rd * (tca - hh) - d.c);
        vec3 shown = shadeDot(d, n, rd) * fog;
        if (gOther) { float bare; shown = made(shadeDot(d, n, rd), d, n, rd, bare) * fog + sky * (1.0 - fog); cov *= bare * whole; }
        col += (1.0 - alpha) * cov * shown;
        alpha += (1.0 - alpha) * cov;
      }
      float g = sat((d.reach - dd) / (d.reach - d.r)); // light spilling just past the bulb
      if (gOther) g *= sqrt(max((1.0 - 0.85 * max(max(uOwn[4], uOwn[5]), 0.0)) * (1.0 - 0.85 * abs(uOwn[2])), 0.0));
      col += (1.0 - alpha) * d.hue * (d.loud * d.loud * 0.4 + 0.4 * d.ring) * g * g * fog * step(0.0, tca);
      if (alpha > (gOther ? (soft > 2.0 ? 0.8 : 0.93) : 0.985)) break;
    }
    float tn = min(tMax.x, tMax.y);
    if (tn > t1) break;
    if (tMax.x < tMax.y) { tMax.x += tDel.x; id.x += stp.x; } else { tMax.y += tDel.y; id.y += stp.y; }
  }
  // the plate behind, lit by the bulb in front of it
  float tp = (ZB - ro.z) * inv.z;
  vec3 q = ro + rd * tp;
  if (alpha < (gOther ? 0.93 : 0.985) && tp > 0.0 && q.y > gBase && q.y < gNy) {
    Dot d = dotAt(floor(q.xy));
    vec3 lv = d.c - q; float l2 = dot(lv, lv);
    vec2 fc = abs(fract(q.xy) - 0.5);
    float lit = d.loud * d.r * d.r * 2.2 * (-lv.z) / (l2 * sqrt(l2) + 0.02) * smoothstep(0.5, 0.12, length(fc));
    vec4 m = piece(vec2(fract(q.x / gNx), 1.0 - q.y / gNy));
    vec3 plate = d.hue * lit * 0.4 + m.rgb * m.a * 0.008;
    if (gOther) {
      float pale = max(uOwn[4], 0.0), fog = exp(-tp * fogK), st = uOwn[1] < 0.0 ? stands(vec2(fract(q.x / gNx), q.y / gNy)) : 1.0;
      float day = max(pale, 0.12 * max(uOwn[5], 0.0)), open = max(uOwn[6], 0.0) * max(smoothstep(0.75, 1.0, q.y / gNy), smoothstep(0.22, 0.0, q.y / gNy));
      float near = 0.0;
      if (day > 0.0 && soft < 2.0) {
        vec2 lean = gSun.xy * 1.15, first = floor(q.xy + lean * 0.4 - 0.5);
        for (int k = 0; k < 4; k++) {
          Dot e = dotAt(first + vec2(float(k % 2), float(k / 2)));
          vec2 from = q.xy - e.c.xy + lean * clamp(ZB - e.c.z, 0.0, 0.6);
          from *= 1.0 - vec2(max(uOwn[2], 0.0), max(-uOwn[2], 0.0));
          near = max(near, smoothstep(e.r * 1.15 + 0.12, e.r * 0.75, length(from)) * exp(0.25 * e.c.z) * step(0.007, e.r));
        }
      }
      plate = plate * (1.0 - 0.8 * pale) * (1.0 - 0.8 * abs(uOwn[2])) + (day > 0.0 ? day * plaster(q.xy, vec3(0.0, 0.0, -1.0), near) : vec3(0.0));
      float dusk = max(-uOwn[4], 0.0);
      plate += dusk * (uKind[1] * uKind[1]) * 0.03;
      fog *= 1.0 - open;
      col += (1.0 - alpha) * st * (plate * fog + sky * (1.0 - fog));
      alpha += (1.0 - alpha) * st;
      return vec4(col, alpha);
    }
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
  float v = 1.0 - q.y / gNy;
  vec3 s = vec3(0.0);
  for (int i = 0; i < 4; i++) {
    vec2 o = vec2(float(i % 2) - 0.5, float(i / 2) - 0.5);
    vec4 m = piece(vec2(fract((q.x + o.x * 3.0) / gNx), clamp(v + o.y * 0.12, 0.0, 1.0)));
    s += m.rgb * m.a;
  }
  float edge = smoothstep(-0.2, 0.15, v) * smoothstep(1.25, 0.9, v);
  if (gOther) edge *= 1.0 - 0.9 * max(uOwn[4], 0.0);
  return s * 0.25 * amount * edge;
}

vec3 render(vec2 p) {
  gOther = uOwn[0] != 0.0 || uOwn[1] != 0.0 || uOwn[2] != 0.0 || uOwn[3] != 0.0 || uOwn[4] != 0.0 || uOwn[5] != 0.0 || uOwn[6] != 0.0 || uOwn[7] != 0.0;
  gS = 1.0; gNx = NX; gNy = NY; gPush = mix(3.2, 2.2, uVar); gFold = 0.0; gBase = 0.0; gRod = 0.0; gSun = normalize(KEY); gAxis = vec3(1.0, 0.0, 0.0);
  float px = uLoop * NX; // the place now playing, in bulbs along the wall
  float flood = 0.0;
  if (gOther) {
    if (uOwn[0] != 0.0) { gNy = floor(NY * exp2(uOwn[0] * (uOwn[0] > 0.0 ? 1.0 : 1.5)) + 0.5); gS = gNy / NY; gNx = floor(NX * gS + 0.5); }
    gPush *= min(gS, 1.0);
    gFold = abs(uOwn[3]) * 2.2 * min(gS, 1.3);
    gRod = 0.5 * abs(uOwn[2]); if (uOwn[2] < 0.0) gAxis = vec3(0.0, 1.0, 0.0);
    gSun = normalize(mix(gSun, vec3(-0.72, 0.6, -0.34), max(uOwn[5], 0.0)));
    flood = max(uOwn[7], 0.0) * 0.3 * gNy; gBase = flood;
    px = uLoop * gNx;
  }
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
  vec3 high = vec3(0.0, 1.0, 0.0);
  if (gOther) {
    float lie = max(uOwn[6], 0.0), close = max(-uOwn[6], 0.0);
    vec3 at = vec3(px, 0.0, 0.0);
    ro = at + (ro - at) * gS; ta = at + (ta - at) * gS;
    ro.y += flood * mix(0.55, 0.9, uVar); ta.y += flood * 0.5;
    float stand = gPush * 1.35 + gFold + 2.2 * min(gS, 1.0);
    if (lie > 0.0) {                                 // the wall becomes the ground: its face is up
      vec3 eye = uVar < 0.5 ? at + vec3(3.0 * gS * sin(uTime * 0.07), -1.6 * gS, -6.5 * gS - stand * 0.5) : at + vec3(-9.0 * gS, 0.42 * gNy + gS * sin(uTime * 0.07), -3.2 * gS - stand * 0.6);
      vec3 to = uVar < 0.5 ? at + vec3(1.0 * gS * sin(uTime * 0.09), 0.5 * gNy, -0.5) : at + vec3(6.0 * gS, 0.5 * gNy, -1.2);
      ro = mix(ro, eye, lie); ta = mix(ta, to, lie); high = mix(high, vec3(0.0, 0.0, -1.0), lie);
    }
    if (close > 0.0) {
      ro = mix(ro, at + vec3(0.5 + 2.0 * sin(uTime * 0.06), 0.46 * gNy + 1.2 * sin(uTime * 0.05) + flood * 0.4, -stand - 2.6 * gS), close);
      ta = mix(ta, at + vec3(uVar < 0.5 ? 1.0 : 3.5, 0.5 * gNy + flood * 0.3, 0.0), close);
    }
    ro.z = min(ro.z, -stand);
  }
  vec3 fw = normalize(ta - ro), rt = normalize(cross(high, fw)), up = cross(fw, rt);
  vec3 rd = normalize(fw * focal + rt * p.x + up * p.y);
  float focus = length(ta - ro);
  vec4 w = wall(ro, rd, 1.0, focus);
  vec3 col = w.rgb;
  float hz = mix(0.04, 0.3, uVar);
  col += (1.0 - 0.6 * w.a) * haze(ro, rd, hz) * exp(-max((-1.0 - ro.z) / rd.z, 0.0) * 0.012 * uVar);
  // the floor: dark and wet, it mirrors the wall and takes a little of its light
  float FY = gOther ? mix(-0.35, flood, step(1e-5, flood) * sat(flood * 4.0)) : -0.35;
  vec3 sky = gOther ? air(rd) : vec3(0.0);
  float lies = gOther ? max(uOwn[6], 0.0) : 0.0;
  if (w.a < 0.99 && rd.y < 0.0 && lies < 0.999) {
    float tf = (FY - ro.y) / rd.y;
    vec3 f = ro + rd * tf;
    if (f.z < ZB) {
      float kx = TAU / gNx;
      vec2 rip = vec2(sin(f.x * kx * 9.0 + f.z * 1.3) + sin(f.x * kx * 23.0 - f.z * 2.9 + 1.0), sin(f.z * 2.1 + f.x * kx * 14.0) + sin(f.z * 5.3 - f.x * kx * 31.0));
      vec3 n = normalize(vec3(0.0, 1.0, (rip.y * 0.012 + rip.x * 0.006) / (1.0 + tf * tf * 0.012) * (1.0 - 0.6 * uVar)));
      vec3 rr = reflect(rd, n);
      vec4 m = wall(f, rr, 3.0, 0.0);
      vec3 refl = m.rgb + haze(f, rr, hz);
      float fres = 0.10 + 0.75 * pow(1.0 - sat(-rd.y), 3.0);
      float dw = ZB - f.z;
      vec4 base = piece(vec2(fract(f.x / gNx), 0.93));
      vec3 spill = base.rgb * base.a * (0.5 / (1.0 + dw * dw * 0.6) + 0.5 / (1.0 + dw * dw * 0.02) * pow(1.0 - sat(-rd.y), 6.0) * exp(-tf * 0.03)); // light pooling at the foot of the wall, and a sheen further out
      if (gOther) {
        float pale = max(uOwn[4], 0.0), dusk = max(-uOwn[4], 0.0), dry = max(-uOwn[7], 0.0), wet = max(uOwn[7], 0.0), far = 1.0 - exp(-tf * (0.018 + 0.012 * max(pale, dusk)) / gS * max(max(pale, dusk), max(dry, wet)));
        refl += (1.0 - m.a) * air(rr);
        fres = mix(fres, 0.45 + 0.5 * pow(1.0 - sat(-rd.y), 2.0), wet);
        float foot = exp(-dw * 0.5 / gS);
        vec3 soil = mix(vec3(0.02) + 0.1 * uKind[0] * uKind[0], vec3(0.78, 0.76, 0.72) * mix(vec3(1.0), 0.5 + 0.6 * uKind[1], 0.35) * (0.45 + 0.6 * gSun.y) * (1.0 - 0.45 * foot), pale);
        soil *= 0.9 + 0.2 * noise(vec2(mod(f.x, gNx), f.z) * 3.0);
        vec3 ground = mix(soil * max(pale, dry) + refl * fres * mix(1.0, 0.4, pale * (1.0 - wet)), soil + spill * 0.5 * (1.0 - 0.7 * pale), dry) + spill * 0.35 * (1.0 - pale);
        ground = mix(ground, refl * fres + pale * soil * 0.25 * (1.0 - fres), wet * 0.8);
        col += (1.0 - w.a) * mix(ground, sky, max(far, lies));
        return tone(col * 1.25);
      }
      col += (1.0 - w.a) * (refl * fres + spill * 0.35) * exp(-tf * 0.012 * uVar);
    }
  }
  if (gOther && (rd.y >= 0.0 || lies >= 0.999 || ro.z + rd.z * (FY - ro.y) / min(rd.y, -1e-4) >= ZB)) col += (1.0 - w.a) * sky;
  return tone(col * 1.25);
}
