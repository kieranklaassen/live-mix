// name: Night city
// a: Towers
// b: Basalt
// what: The spectrum as a city at night, low notes on the left and high on the right, flown over low, its lit windows and roof lines mirrored in a wet avenue.
// follows: Each tower is as tall as its band is loud and lights more windows as it rises; travel is the flight; a hit sends a ring of light out across the city from under you.
vec3 rich(vec3 c, float k) { return max(mix(vec3(dot(c, vec3(0.33))), c, k), 0.0); }
const float HALF = 0.31; // half the width of a tower; the rest of its square is street
vec3 gGlow; float gRing, gCueRing; vec2 gCam;

// Which band a column of the city belongs to: low on the left, high on the right, then mirrored on and on.
float bandOf(float i) { float u = (i + 8.5) / 16.0; return 1.0 - abs(mod(u, 2.0) - 1.0); }
float heightOf(vec2 id, out float lv, out float bx) {
  bx = bandOf(id.x);
  lv = band(bx);
  float h = hash21(id * 0.73 + 5.1);
  float H = 0.1 + 0.3 * h + lv * (0.6 + 2.5 * h * h) * (0.55 + 0.6 * uEnergy);
  if (abs(id.x + 0.5) < 1.0) { H = 0.0; lv = 0.0; } // the avenue we fly along
  return H;
}
vec3 hueOf(float bx) { return rich(kindColour(bx * 4.0), 1.5); }
float waveAt(vec2 at) { float r = length(at - gCam); return uHits * exp(-pow((r - gRing) * 0.9, 2.0)) + uCue * exp(-pow((r - gCueRing) * 0.6, 2.0)); }

// Walks the ray across the squares of the city. Returns 0 sky, 1 a tower, 2 the street; t, n and the square are filled in.
int walk(vec3 ro, vec3 rd, int most, out float t, out vec3 n, out vec2 id, out float H) {
  vec2 cell = floor(ro.xz), sg = sign(rd.xz);
  vec2 inv = 1.0 / max(abs(rd.xz), 1e-5);
  vec2 next = (cell + max(sg, 0.0) - ro.xz) * sg * inv;
  float tg = rd.y < 0.0 ? -ro.y / rd.y : 1e9;
  vec3 ird = 1.0 / (abs(rd) + 1e-5) * (step(0.0, rd) * 2.0 - 1.0);
  for (int i = 0; i < 46; i++) {
    if (i >= most) break;
    float lv, bx;
    H = heightOf(cell, lv, bx);
    vec3 c = vec3(cell.x + 0.5, H * 0.5, cell.y + 0.5), hs = vec3(HALF, H * 0.5, HALF);
    vec3 m = (c - ro) * ird, k = hs * abs(ird);
    vec3 t1 = m - k, t2 = m + k;
    float tn = max(max(t1.x, t1.y), t1.z), tf = min(min(t2.x, t2.y), t2.z);
    if (lv > 0.25) { // the light on a loud roof spills into the air round it
      vec3 top = vec3(c.x, H, c.z) - ro;
      float along = max(dot(top, rd), 0.0);
      vec3 off = top - rd * along;
      gGlow += hueOf(bx) * lv * lv * exp(-dot(off, off) * 16.0) * exp(-along * 0.1) * 0.16;
    }
    if (tn < tf && tf > 0.0 && tn < tg) {
      t = max(tn, 0.0); id = cell;
      n = -sign(rd) * step(t1.yzx, t1.xyz) * step(t1.zxy, t1.xyz);
      return 1;
    }
    float ex = min(next.x, next.y);
    if (tg < ex) { t = tg; n = vec3(0.0, 1.0, 0.0); id = cell; return 2; }
    if (rd.y > 0.0 && ro.y + rd.y * ex > 3.8) break; // above every roof
    if (next.x < next.y) { next.x += inv.x; cell.x += sg.x; } else { next.y += inv.y; cell.y += sg.y; }
  }
  t = 1e9; return 0;
}
// A line of light of width w at the edge of something, x running up to the edge at 1; it thins out with distance instead of smearing.
float line(float x, float edge, float w, float s) { return smoothstep(edge - w - s, edge - w, x) * w / (w + s); }
// The face of a tower: dark glass, rows of windows, a line of light round the roof and down the corners.
vec3 tower(vec3 pos, vec3 n, vec3 rd, vec2 id, float H, float t) {
  float lv, bx; heightOf(id, lv, bx);
  vec3 hue = hueOf(bx);
  vec3 q = vec3(pos.x - id.x - 0.5, pos.y, pos.z - id.y - 0.5);
  float wave = waveAt(id + 0.5);
  float s = t * 0.006;
  vec3 col;
  if (n.y > 0.5) {
    col = (hue * (0.1 + 2.0 * lv * lv) + vec3(1.0, 0.85, 0.8) * wave) * line(max(abs(q.x), abs(q.z)), HALF, 0.018, s);
    col += vec3(0.05, 0.08, 0.16) * 0.03;
  } else {
    float u = abs(n.x) > 0.5 ? q.z : q.x;
    vec2 w = vec2((u / HALF * 0.5 + 0.5) * 6.0, pos.y * 13.0);
    vec2 wid = floor(w), f = abs(fract(w) - 0.5);
    float pane = smoothstep(0.32 + s * 4.0, 0.32 - s * 4.0, f.x) * smoothstep(0.26 + s * 8.0, 0.26 - s * 8.0, f.y);
    float h = hash21(wid + id * 7.3 + n.xz * 3.1);
    float floorLit = step(0.82, hash21(vec2(wid.y, id.x * 3.0 + id.y)));           // now and then a whole floor is lit
    float lit = smoothstep(0.0, 0.07, 0.06 + 0.55 * lv + wave + 0.6 * floorLit * lv - h); // windows come on and go off softly
    float kind = fract(h * 13.3);
    vec3 tint = kind < 0.5 ? vec3(1.0, 0.62, 0.3) : kind < 0.75 ? vec3(0.6, 0.8, 1.0) : hue;
    vec3 lamp = mix(tint, hue, 0.35) * (0.08 + 0.45 * lv + 0.8 * wave) * (0.35 + 0.65 * fract(h * 7.7));
    col = lamp * pane * lit * step(pos.y, H - 0.06) * step(0.06, pos.y);
    float roof = line(pos.y, H, 0.018, s), corner = line(abs(u), HALF, 0.012, s);
    col += hue * (roof * (0.12 + 2.2 * lv * lv) + corner * (0.02 + 0.5 * lv * lv)) + vec3(1.0, 0.85, 0.8) * wave * (roof + corner);
    col += vec3(0.08, 0.14, 0.3) * pow(1.0 - sat(dot(n, -rd)), 3.0) * 0.06;
  }
  return col;
}
vec3 sky(vec3 rd) {
  vec3 haze = mix(vec3(0.2, 0.25, 0.8), vec3(0.9, 0.35, 0.25), uTone);
  vec3 c = haze * exp(-abs(rd.y) * 30.0) * (0.03 + 0.16 * uLevel);
  // a low light at the far end of the avenue
  vec3 end = normalize(vec3(0.0, 0.03, 1.0));
  float a = sat(dot(rd, end));
  c += mix(vec3(0.6, 0.75, 1.0), vec3(1.0, 0.7, 0.45), uTone) * (pow(a, 2500.0) * 3.0 + pow(a, 200.0) * 0.25) * (0.25 + uLevel);
  return c;
}

// b: six-sided columns standing close. Returns the place inside the column (xy) and the column's middle (zw).
vec4 hexAt(vec2 p) {
  const vec2 s = vec2(1.0, 1.7320508);
  vec4 c = floor(vec4(p, p - vec2(0.5, 1.0)) / s.xyxy) + 0.5;
  vec4 h = vec4(p - c.xy * s, p - (c.zw + 0.5) * s);
  return dot(h.xy, h.xy) < dot(h.zw, h.zw) ? vec4(h.xy, c.xy * s) : vec4(h.zw, (c.zw + 0.5) * s);
}
float hexDist(vec2 p) { p = abs(p); return max(dot(p, vec2(0.5, 0.8660254)), p.x); }
float columnH(vec2 mid, out float lv, out float bx) {
  bx = bandOf(floor(mid.x * 1.0));
  lv = band(bx);
  float h = hash21(mid * 0.37 + 2.3);
  return 0.25 + 0.6 * h + lv * (0.4 + 1.9 * h) * (0.55 + 0.6 * uEnergy);
}

vec3 render(vec2 p) {
  gRing = (1.0 - uHits) * 16.0; gCueRing = (1.0 - uCue) * 24.0;
  gGlow = vec3(0.0);
  vec3 col = vec3(0.0);
  if (uVar < 0.5) {
    float z = uTravel * 1.3;
    vec3 ro = vec3(0.3 * sin(z * 0.2), 0.85 + 0.2 * sin(uTime * 0.08), z);
    gCam = ro.xz;
    vec3 fw = normalize(vec3(0.2 * sin(uTime * 0.06), -0.15 + 0.04 * sin(uTime * 0.05), 1.0));
    vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)), up = cross(fw, rt);
    vec3 rd = normalize(fw * 0.72 + rt * p.x + up * p.y);
    float t, H; vec3 n; vec2 id;
    int what = walk(ro, rd, 46, t, n, id, H);
    vec3 pos = ro + rd * t;
    if (what == 1) col = tower(pos, n, rd, id, H, t);
    else if (what == 2) {
      // the wet street: it mirrors the towers and their light, broken a little by the water
      vec3 before = gGlow;
      vec2 rip = vec2(noise(pos.xz * vec2(9.0, 3.0)), noise(pos.xz * vec2(9.0, 3.0) + 31.0)) - 0.5;
      vec3 rr = reflect(rd, normalize(vec3(rip.x * 0.09, 1.0, rip.y * 0.03)));
      rr.y = abs(rr.y) + 0.002;
      float t2, H2; vec3 n2; vec2 id2;
      int w2 = walk(pos + vec3(0.0, 0.002, 0.0), rr, 14, t2, n2, id2, H2);
      vec3 mir = w2 == 1 ? tower(pos + rr * t2, n2, rr, id2, H2, t + t2) * exp(-t2 * 0.1) : sky(rr);
      mir += (gGlow - before) * 1.5;
      gGlow = before;
      float fres = 0.4 + 0.6 * pow(1.0 - sat(-rd.y), 4.0);
      col = mir * fres * (0.6 + 0.4 * noise(pos.xz * 1.7));
      float rg = length(pos.xz - gCam);
      col += vec3(1.0, 0.8, 0.7) * (uHits * exp(-pow((rg - gRing) * 9.0, 2.0)) + uCue * exp(-pow((rg - gCueRing) * 6.0, 2.0))) * 0.8;
    } else col = sky(rd);
    if (what != 0) col *= exp(-t * 0.05);
    col += gGlow;
  } else {
    float z = uTravel * 1.1;
    vec3 ro = vec3(1.2 * sin(z * 0.11), 6.2 + 0.4 * sin(uTime * 0.07), z);
    vec3 fw = normalize(vec3(0.15 * sin(uTime * 0.05), -1.0 + 0.08 * sin(uTime * 0.04), 1.0));
    gCam = ro.xz + vec2(0.0, 5.0);
    vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)), up = cross(fw, rt);
    vec3 rd = normalize(fw * 0.85 + rt * p.x + up * p.y);
    if (rd.y > -0.02) return screenOf(sky(rd));
    // walk from column to column: either we come in below its top (its side), or we land on its top, or we pass over
    const vec2 N1 = vec2(0.5, 0.8660254), N2 = vec2(-0.5, 0.8660254);
    vec3 b3 = vec3(rd.x, dot(rd.xz, N1), dot(rd.xz, N2));
    b3 = mix(b3, vec3(1e-4), step(abs(b3), vec3(1e-4)));
    float t = max((3.0 - ro.y) / rd.y, 0.0), H = 0.0, lv = 0.0, bx = 0.0;
    vec4 hx; int hit = 0; vec2 sn = vec2(0.0);
    for (int i = 0; i < 44; i++) {
      vec3 q = ro + rd * t;
      hx = hexAt(q.xz);
      H = columnH(hx.zw, lv, bx);
      if (q.y < H) { hit = 2; break; }
      vec3 a3 = vec3(hx.x, dot(hx.xy, N1), dot(hx.xy, N2));
      vec3 te = (sign(b3) * 0.5 - a3) / b3;
      float ex = min(te.x, min(te.y, te.z));
      float tt = (q.y - H) / -rd.y;
      if (tt < ex) { t += tt; hit = 1; break; }
      if (lv > 0.3) { // light off a loud top spills into the air
        vec3 top = vec3(hx.z, H, hx.w) - ro; float al = dot(top, rd); vec3 off = top - rd * al;
        gGlow += hueOf(bx) * lv * lv * exp(-dot(off, off) * 5.0) * 0.07;
      }
      sn = te.x <= ex ? vec2(-sign(b3.x), 0.0) : te.y <= ex ? -sign(b3.y) * N1 : -sign(b3.z) * N2;
      t += ex + 0.004;
      if (t > 30.0) break;
    }
    if (hit > 0) {
      vec3 pos = ro + rd * t;
      vec2 loc = pos.xz - hx.zw;
      float hd = hexDist(loc);
      vec3 hue = hueOf(bx);
      float wave = waveAt(hx.zw);
      float s = t * 0.004;
      vec3 ember = mix(vec3(1.0, 0.25, 0.05), vec3(1.0, 0.5, 0.15), uTone);
      if (hit == 1) {
        // the top: wet black stone, lit round its rim in its band's colour
        col = (hue * (0.06 + 2.6 * lv * lv) + vec3(1.0, 0.85, 0.8) * wave) * line(hd, 0.485, 0.035, s);
        col += hue * lv * lv * (0.08 + 1.3 * hd * hd);
        col += vec3(0.1, 0.16, 0.35) * (0.012 + 0.03 * noise(pos.xz * 3.0)) * (0.5 + uLevel);
      } else {
        // the side: dark, hot far down in the cracks, catching light near the top
        float depth = H - pos.y;
        float moon = sat(dot(sn, normalize(vec2(-0.75, -0.65))));
        float grain = 0.6 + 0.4 * noise(vec2(dot(loc, vec2(-sn.y, sn.x)) * 14.0 + hx.z * 3.0, pos.y * 1.5));
        col = vec3(0.1, 0.17, 0.4) * (0.02 + 0.12 * moon) * grain * (0.5 + uLevel) * sat(0.3 + pos.y * 0.5);
        col += hue * (0.02 + 1.1 * lv * lv) * (exp(-depth * 6.0) + 0.25 * exp(-depth * 1.2)) * grain;
        col += vec3(1.0, 0.85, 0.8) * wave * exp(-depth * 3.0) * 0.6;
        col += ember * exp(-pos.y * 4.5) * (0.3 + 2.0 * uLow) * grain;
      }
    }
    col *= exp(-t * 0.07);
    col += gGlow;
  }
  return screenOf(col);
}
