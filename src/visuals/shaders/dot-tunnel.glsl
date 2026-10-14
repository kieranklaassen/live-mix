// name: Dot tunnel
// a: Round
// b: Square duct
// what: A flight down a tunnel whose wall is the piece in lamps: round it is the room, along it is the loop over and over, and the place now playing is a hoop of light the flight overtakes.
// follows: The flight speeds up as the music fills; loudness swells each lamp and leans it into the tunnel, most at the playing place; a hit or cue throws a hoop of light away down the tunnel.
const float LEN = 128.0, SPEED = 16.0; // lamps along one turn of the loop, and lamps flown per unit of travel
const float ROWS = 48.0, R = 7.64;     // round: lamps round the tunnel, and the radius that makes them one apart
const float HW = 6.5, SIDE = 8.0;      // square: half the width of the duct, and lamps across each wall
const float RMAX = 0.4;
#define LIFT mix(1.7, 1.25, uVar)

vec3 tone(vec3 c) { c = max(c, 0.0); float l = max(c.r, max(c.g, c.b)); c *= (1.0 + l * 0.1) / (1.0 + l); c = mix(c, vec3(l / (1.0 + l)), sat(l * 0.12 - 0.1)); return pow(c, vec3(0.4545)); }
float bump(float x) { x = sat(1.0 - x * x); return x * x; }

struct Lamp { float r; float lift; vec3 hue; float loud; float ring; };

float gCamZ;
vec3 gNowCol;

// The dark wall itself: thin ribs that take the colour of the piece near them, and a hoop of light at the place now playing.
vec3 wallLight(float v, float z, float t) {
  float wr = 0.05 + t * 0.004;
  float dr = (fract(z / 8.0 + 0.5) - 0.5) * 8.0;
  vec4 m = piece(vec2(fract(z / LEN), v));
  vec3 c = (m.rgb * 0.5 + gNowCol * 0.02 + vec3(0.004, 0.006, 0.01)) * exp(-dr * dr / (wr * wr)) * min(1.0, 0.07 / wr);
  float dn = (fract(z / LEN - uLoop + 0.5) - 0.5) * LEN;
  float wn = 0.1 + t * 0.004;
  c += gNowCol * (exp(-dn * dn / (wn * wn)) * 1.1 + exp(-abs(dn) * 1.3) * 0.12) * (0.3 + uLevel);
  // a hit: a hoop of light thrown away down the tunnel
  float ah = z - gCamZ;
  float h1 = (ah - 3.0 - (1.0 - uHits) * 50.0) * 1.7, h2 = (ah - 3.0 - (1.0 - uCue) * 75.0) * 1.1;
  c += mix(uKind[4], vec3(1.0, 0.9, 0.8), 0.3) * (uHits * exp(-h1 * h1) + 0.7 * uCue * exp(-h2 * h2)) * 1.3;
  return c;
}

// The lamp at a place in the room (v, 0 to 1) and a place along the tunnel (iz, counted in lamps).
Lamp lampAt(float v, float iz) {
  vec2 uv = vec2(fract((iz + 0.5) / LEN), v);
  vec4 m = piece(uv);
  Lamp d;
  d.loud = sat(m.a * (0.6 + 0.6 * uEnergy));
  d.hue = m.rgb / max(m.a, 0.001);
  d.hue = max(mix(vec3(dot(d.hue, vec3(0.3333))), d.hue, 1.9), 0.0);
  float dz = (fract(uv.x - uLoop + 0.5) - 0.5) * LEN;
  float head = bump(dz * 0.11);
  d.ring = 0.0;
  if (uHits > 0.01) {
    float ahead = iz + 0.5 - gCamZ; // how far down the tunnel from the camera
    d.ring = uHits * bump((ahead - 3.0 - (1.0 - uHits) * 50.0) * 0.4) + 0.7 * uCue * bump((ahead - 3.0 - (1.0 - uCue) * 75.0) * 0.25);
  }
  d.r = min(RMAX, 0.065 + 0.3 * sqrt(d.loud) + 0.26 * d.ring);
  d.lift = LIFT * d.loud * sqrt(d.loud) * (0.22 + 0.78 * head) + 0.5 * d.ring;
  d.loud = d.loud * (0.9 + 0.5 * head);
  return d;
}

vec3 shadeLamp(Lamp d, float ndv) {
  vec3 e = d.hue * d.loud * (0.06 + 1.2 * ndv * ndv * sqrt(ndv));
  float n4 = ndv * ndv; n4 *= n4;
  e += mix(d.hue, vec3(1.0), 0.25) * n4 * n4 * n4 * d.loud * d.loud;
  float rim = 1.0 - ndv;
  e += d.hue * rim * rim * (0.03 + 0.5 * d.loud);
  e += vec3(0.05, 0.07, 0.11) * (0.3 + ndv * ndv);
  e += mix(d.hue, vec3(1.0, 0.92, 0.82), 0.35) * d.ring * (0.2 + 0.8 * ndv * ndv) * 1.3;
  return e;
}

// One lamp against the ray, laid over what is already there.
void lay(Lamp d, vec3 c, vec3 ro, vec3 rd, float fogK, inout vec3 col, inout float alpha) {
  vec3 oc = c - ro; float tca = dot(oc, rd), d2 = dot(oc, oc) - tca * tca, dd = sqrt(max(d2, 0.0));
  float fog = exp(-tca * fogK) * step(0.0, tca);
  float w = clamp(0.008 + tca * 1.2 / uRes.y + 0.0008 * tca, 0.004, 0.49 - d.r);
  float cov = smoothstep(d.r + w, d.r - w, dd);
  float ndv = sqrt(sat(1.0 - d2 / (d.r * d.r)));
  vec3 n = normalize(ro + rd * (tca - d.r * ndv) - c);
  float glint = pow(sat(dot(n, normalize(vec3(-0.35, 0.5, -0.8) - rd))), 70.0);
  col += (1.0 - alpha) * cov * (shadeLamp(d, ndv) + vec3(0.6, 0.75, 1.0) * glint * (0.25 + 0.6 * d.loud)) * fog;
  alpha += (1.0 - alpha) * cov;
  float g = sat((0.5 - dd) / (0.5 - d.r));
  g *= g;
  col += (1.0 - alpha) * d.hue * (d.loud * d.loud * 0.3 + 0.5 * d.ring) * g * g * fog;
}

// The light a lamp pools on the dark wall behind it. q: the place on the wall, c: the lamp, n: the wall's inward normal.
vec3 pool(Lamp d, vec3 q, vec3 c, vec3 n) {
  vec3 lv = c - q; float l2 = dot(lv, lv), h = dot(lv, n);
  return d.hue * d.loud * d.r * d.r * 2.2 * h / (l2 * sqrt(l2) + 0.02) * bump(sqrt(max(l2 - h * h, 0.0)) * 1.7);
}

vec3 roundTunnel(vec3 ro, vec3 rd, float fogK) {
  float a = dot(rd.xy, rd.xy), b = dot(ro.xy, rd.xy), c0 = dot(ro.xy, ro.xy);
  if (a < 1e-5) return vec3(0.0);
  float Ri = R - LIFT - 0.5 * max(uHits, 0.7 * uCue) - 2.0 * RMAX - 0.05;
  float tA = (-b + sqrt(max(b * b - a * (c0 - Ri * Ri), 0.0))) / a, tB = (-b + sqrt(b * b - a * (c0 - R * R))) / a;
  if (tA > 110.0) return vec3(0.0);
  float iz = floor(ro.z + rd.z * tA), izEnd = floor(ro.z + rd.z * tB);
  vec3 col = vec3(0.0); float alpha = 0.0;
  for (int i = 0; i < 36; i++) {
    float tw = (iz + 0.5) / LEN; // the rows wind once round the tunnel in each turn of the loop
    vec2 pm = ro.xy + rd.xy * (clamp((iz + 0.5 - ro.z) / rd.z, tA, tB));
    float turn = atan(pm.y, pm.x) / TAU + 0.25; // where round the tunnel the ray is here, counted from the floor
    float row0 = floor(fract(turn - tw) * ROWS - 0.5);
    for (int j = 0; j < 2; j++) {
      float row = mod(row0 + float(j), ROWS);
      Lamp d = lampAt((row + 0.5) / ROWS, iz);
      float ang = ((row + 0.5) / ROWS - 0.25 + tw) * TAU;
      vec3 c = vec3(vec2(cos(ang), sin(ang)) * (R - 0.03 - d.r - d.lift), iz + 0.5);
      lay(d, c, ro, rd, fogK, col, alpha);
    }
    if (alpha > 0.985 || iz >= izEnd) break;
    iz += 1.0;
  }
  if (alpha < 0.985) {
    vec3 q = ro + rd * tB;
    float zc = floor(q.z), tw = (zc + 0.5) / LEN;
    float fr = fract(atan(q.y, q.x) / TAU + 0.25 - tw) * ROWS, row = floor(fr);
    Lamp d = lampAt((row + 0.5) / ROWS, zc);
    float ang = ((row + 0.5) / ROWS - 0.25 + tw) * TAU;
    vec3 n = vec3(-cos(ang), -sin(ang), 0.0);
    col += (1.0 - alpha) * (pool(d, q, vec3(-n.xy * (R - 0.03 - d.r - d.lift), zc + 0.5), n) + wallLight(fr / ROWS, q.z, tB)) * exp(-tB * fogK);
  }
  return col;
}

vec3 squareDuct(vec3 ro, vec3 rd, float fogK, vec3 now) {
  rd += step(abs(rd), vec3(1e-4)) * 2e-4; // never exactly along a row of cells
  // which wall the ray meets first; then turn the duct so that wall is the floor
  vec2 tw = (HW * sign(rd.xy) - ro.xy) / rd.xy;
  float wi; // 0 floor, 1 right wall, 2 ceiling, 3 left wall
  if (tw.x < tw.y) wi = rd.x > 0.0 ? 1.0 : 3.0; else wi = rd.y > 0.0 ? 2.0 : 0.0;
  mat2 turn = rot(wi * PI * 0.5);
  ro.xy = turn * ro.xy; rd.xy = turn * rd.xy; // now the wall is y = -HW
  ro.y += HW;                                 // and now it is y = 0, lamps hang above it
  float T = LIFT + 0.5 * max(uHits, 0.7 * uCue) + 2.0 * RMAX + 0.05;
  vec3 inv = 1.0 / rd;
  float t0 = max((T - ro.y) * inv.y, 0.0), t1 = -ro.y * inv.y;
  if (t0 > 110.0) return vec3(0.0);
  vec3 p = ro + rd * (t0 + 1e-3);
  vec2 id = floor(p.xz), stp = sign(rd.xz);
  vec2 tMax = (id + max(stp, 0.0) - ro.xz) * inv.xz, tDel = abs(inv.xz);
  vec3 col = vec3(0.0); float alpha = 0.0;
  float half_ = SIDE * 0.5;
  for (int i = 0; i < 44; i++) {
    if (abs(id.x + 0.5) < half_) {
      Lamp d = lampAt((wi * SIDE + id.x + half_ + 0.5) / (4.0 * SIDE), id.y);
      lay(d, vec3(id.x + 0.5, 0.03 + d.r + d.lift, id.y + 0.5), ro, rd, fogK, col, alpha);
      if (alpha > 0.985) break;
    }
    float tn = min(tMax.x, tMax.y);
    if (tn > t1) break;
    if (tMax.x < tMax.y) { tMax.x += tDel.x; id.x += stp.x; } else { tMax.y += tDel.y; id.y += stp.y; }
  }
  if (alpha < 0.985) {
    vec3 q = ro + rd * t1;
    vec2 c = floor(q.xz);
    float fog = exp(-t1 * fogK);
    if (abs(c.x + 0.5) < half_) {
      Lamp d = lampAt((wi * SIDE + c.x + half_ + 0.5) / (4.0 * SIDE), c.y);
      col += (1.0 - alpha) * pool(d, q, vec3(c.x + 0.5, 0.03 + d.r + d.lift, c.y + 0.5), vec3(0.0, 1.0, 0.0)) * fog;
    }
    col += (1.0 - alpha) * wallLight(clamp((wi * SIDE + q.x + half_) / (4.0 * SIDE), 0.0, 1.0), q.z, t1) * fog;
    // a line of light along each corner of the duct, with the spectrum running down it
    float e = HW - abs(q.x);
    float run = 0.35 + 0.65 * band(fract(q.z / 32.0 - uTravel * 0.25));
    col += (1.0 - alpha) * now * exp(-e * 16.0) * run * (0.5 + 1.2 * uLevel) * fog;
    col += (1.0 - alpha) * now * exp(-e * 1.6) * run * 0.05 * (0.5 + uLevel) * fog;
  }
  return col;
}

vec3 render(vec2 p) {
  vec3 now = uKind[0] * uDrone + uKind[1] * uPad + uKind[2] * uTexture + uKind[3] * uPhrase + uKind[4] * uHits;
  now = now / (0.4 + uDrone + uPad + uTexture + uPhrase + uHits);
  now = max(mix(vec3(dot(now, vec3(0.3333))), now, 1.7), 0.0);
  gNowCol = now;
  gCamZ = fract(uTravel * SPEED / LEN) * LEN;
  vec3 ro = vec3(1.2 * sin(uTime * 0.17), 1.0 * sin(uTime * 0.13 + 1.0), gCamZ);
  vec3 rd = normalize(vec3(p, 0.74));
  rd.xy = rot(0.12 * sin(uTime * 0.071)) * rd.xy;
  rd.yz = rot(0.09 * sin(uTime * 0.11)) * rd.yz;
  rd.xz = rot(0.12 * sin(uTime * 0.083 + 2.0)) * rd.xz;
  float fogK = 0.04;
  vec3 col = uVar < 0.5 ? roundTunnel(ro, rd, fogK) : squareDuct(ro, rd, fogK, now);
  return tone(col * 1.5);
}
