// name: Dot tunnel
// a: Round
// b: Square duct
// what: A flight down a tunnel whose wall is the piece in lamps: round it is the room, along it is the loop over and over, and the place now playing is a hoop of light the flight overtakes.
// follows: The flight speeds up as the music fills; loudness swells each lamp and leans it into the tunnel, most at the playing place; a hit or cue throws a hoop of light away down the tunnel.
// own: 0 1 twice as many lamps, small and fine in a wide tunnel, -1 a third as many, great ones close about you; 1 1 strewn out of line, of every size, many gone, -1 gathered into five strands that wind down the tunnel; 2 1 a low wide passage, -1 a tall narrow cleft; 3 1 the vault is open to the sky and the eye flies low over the floor, -1 the eye is turned aside to the wall as it goes by; 4 the air: 1 white daylight and a pale wall, -1 dark, with a glow of the sounds' colours at the far end; 5 1 dull solid beads lit by one sun, -1 clear bubbles; 6 1 the lamps join into rods along the tunnel, -1 into hoops round it; 7 1 the wall is pleated lengthwise into six folds, -1 it swells and narrows like a throat
const float LEN = 128.0, SPEED = 16.0; // lamps along one turn of the loop, and lamps flown per unit of travel
const float ROWS = 48.0, R = 7.64;     // round: lamps round the tunnel, and the radius that makes them one apart
const float HW = 6.5, SIDE = 8.0;      // square: half the width of the duct, and lamps across each wall
const float RMAX = 0.4;
#define LIFT gLift

vec3 tone(vec3 c) { c = max(c, 0.0); float l = max(c.r, max(c.g, c.b)); c *= (1.0 + l * 0.1) / (1.0 + l); c = mix(c, vec3(l / (1.0 + l)), sat(l * 0.12 - 0.1)); return pow(c, vec3(0.4545)); }
float bump(float x) { x = sat(1.0 - x * x); return x * x; }

struct Lamp { float r; float lift; vec3 hue; float loud; float ring; vec2 off; };

// The tunnel of this world: how large it is beside the plain one, how many lamps round it, its radius, how far lamps lean in,
// half the width of the duct and lamps across its walls, and how deep its folds are.
bool gOther;
float gS, gRows, gR, gLift, gHalf, gSide, gFold, gRod;
vec3 gAir, gAxis, gSun;

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
  float ah = (z - gCamZ) / gS;
  float h1 = (ah - 3.0 - (1.0 - uHits) * 50.0) * 1.7, h2 = (ah - 3.0 - (1.0 - uCue) * 75.0) * 1.1;
  c += mix(uKind[4], vec3(1.0, 0.9, 0.8), 0.3) * (uHits * exp(-h1 * h1) + 0.7 * uCue * exp(-h2 * h2)) * 1.3;
  if (gOther) c *= 1.0 - 0.6 * max(uOwn[4], 0.0);
  return c;
}

// How far the vault is open at a place round the tunnel (v) and along it: 0 is wall, 1 is sky.
float openAt(float v, float z) {
  if (uOwn[3] <= 0.0) return 0.0;
  float y;
  if (uVar < 0.5) y = -cos(TAU * (v + z / LEN));
  else { float w = floor(min(v, 0.9999) * 4.0), x = fract(v * 4.0) * 2.0 - 1.0; y = w < 0.5 ? -1.0 : w < 1.5 ? x : w < 2.5 ? 1.0 : -x; }
  return uOwn[3] * (uVar < 0.5 ? smoothstep(-0.25, 0.15, y) : smoothstep(0.1, 0.35, y));
}

// The wall by day.
vec3 paleWall(vec3 q, float v, vec3 n, float near) {
  vec4 m = piece(vec2(fract(q.z / LEN), v));
  vec3 c = mix(vec3(0.7, 0.69, 0.66), m.rgb / max(m.a, 0.001), 0.45 * sat(m.a)) * mix(vec3(1.0), 0.55 + 0.6 * mix(uKind[0], uKind[1], 0.5 + 0.5 * n.y), 0.3);
  float ah = (q.z - gCamZ) / gS, h1 = (ah - 3.0 - (1.0 - uHits) * 50.0) * 0.3, h2 = (ah - 3.0 - (1.0 - uCue) * 75.0) * 0.2;
  c = mix(c, uKind[4] * 0.75, 0.7 * sat(uHits * exp(-h1 * h1) + 0.7 * uCue * exp(-h2 * h2)));
  return c * (0.3 + 0.75 * sat(0.5 + 0.5 * dot(n, gSun))) * (1.0 - 0.8 * near) * (0.94 + 0.12 * noise(vec2(v * gRows * 3.0, mod(q.z, LEN) * 3.0)));
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
    float ahead = (iz + 0.5 - gCamZ) / gS; // how far down the tunnel from the camera
    d.ring = uHits * bump((ahead - 3.0 - (1.0 - uHits) * 50.0) * 0.4) + 0.7 * uCue * bump((ahead - 3.0 - (1.0 - uCue) * 75.0) * 0.25);
  }
  d.r = min(RMAX, 0.065 + 0.3 * sqrt(d.loud) + 0.26 * d.ring);
  d.lift = LIFT * d.loud * sqrt(d.loud) * (0.22 + 0.78 * head) + 0.5 * d.ring;
  d.loud = d.loud * (0.9 + 0.5 * head);
  d.off = vec2(0.0);
  if (gOther) {
    d.lift *= gLift / mix(1.7, 1.25, uVar);
    vec2 cell = vec2(floor(v * gRows * 2.0), mod(iz, LEN));
    float h = hash21(cell + 0.7), h2 = hash21(cell + 33.1), on = 1.0, open = openAt(v, iz + 0.5);
    if (uOwn[6] != 0.0) h2 = mix(h2, hash21(uOwn[6] > 0.0 ? vec2(cell.x, 5.5) : vec2(5.5, cell.y)), abs(uOwn[6]));
    float rest = max(max(abs(uOwn[4]), abs(uOwn[5])), max(abs(uOwn[6]), abs(uOwn[7])));
    float quiet = smoothstep(0.12, 0.0, m.a);
    d.hue = mix(d.hue, mix(uKind[0], uKind[1], 0.5 - 0.5 * cos(TAU * (v + uv.x)) * (0.6 + 0.4 * h)), quiet);
    d.r = max(d.r, rest * (0.13 + 0.11 * h2)); d.loud = max(d.loud, 0.22 * rest);
    if (uOwn[1] < 0.0) {
      float lane = 0.5 + 0.5 * cos(TAU * (5.0 * v + 3.0 * iz / LEN));
      on = mix(1.0, smoothstep(0.62, 0.9, lane), -uOwn[1]);
      d.lift += -uOwn[1] * on * 0.35 * gLift;
      d.r = mix(d.r, 0.16 + 0.75 * d.r, -uOwn[1] * on);
    }
    if (uOwn[1] > 0.0) {
      d.off = uOwn[1] * 0.4 * vec2(fract(h * 57.31) - 0.5, fract(h2 * 91.7) - 0.5);
      on = mix(1.0, smoothstep(0.3, 0.42, h), uOwn[1]);
      d.r = min(d.r * mix(1.0, 0.5 + 0.9 * h2 * h2 + 0.3 * h, uOwn[1]), 0.47 - length(d.off));
      d.lift += uOwn[1] * 0.45 * gLift * fract(h * 17.3);
    }
    if (gFold > 0.0) {
      float f = uOwn[7] > 0.0 ? 0.5 + 0.5 * cos(TAU * (6.0 * v + 2.0 * iz / LEN)) : 0.5 + 0.5 * cos(TAU * 5.0 * iz / LEN);
      d.lift += gFold * f * f * (3.0 - 2.0 * f);
    }
    d.lift = min(d.lift, gLift * 1.35 + gFold);
    if (uVar < 0.5) d.r *= 1.0 - 0.6 * d.lift / gR;
    d.r = max(d.r * mix(1.0, 0.8, abs(uOwn[6])) * mix(0.18, 1.0, on), 0.012) * (1.0 - open);
    on *= 1.0 - open;
    d.loud *= on; d.ring *= on;
  }
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
  float whole = 1.0;
  if (gOther && d.r < 0.004) return;
  if (gRod > 0.0) {                                  // a rod: the place along it nearest the ray; a whole one has no ends
    vec3 w = ro - c; float b = dot(rd, gAxis), k = 1.0 - b * b;
    float along = (dot(gAxis, w) - b * dot(rd, w)) / max(k, 0.02);
    whole = 1.0 - smoothstep(0.75, 1.0, abs(uOwn[6])) * smoothstep(0.0, 0.03, abs(along) - gRod);
    c += gAxis * clamp(along, -gRod, gRod);
  }
  vec3 oc = c - ro; float tca = dot(oc, rd), d2 = dot(oc, oc) - tca * tca, dd = sqrt(max(d2, 0.0));
  float fog = exp(-tca * fogK) * step(0.0, tca);
  float w = clamp(0.008 + tca * 1.2 / uRes.y + 0.0008 * tca, 0.004, 0.49 - d.r);
  float cov = smoothstep(d.r + w, d.r - w, dd);
  float ndv = sqrt(sat(1.0 - d2 / (d.r * d.r)));
  vec3 n = normalize(ro + rd * (tca - d.r * ndv) - c);
  float glint = pow(sat(dot(n, normalize(vec3(-0.35, 0.5, -0.8) - rd))), 70.0);
  vec3 shown = (shadeLamp(d, ndv) + vec3(0.6, 0.75, 1.0) * glint * (0.25 + 0.6 * d.loud)) * fog;
  float bare = 1.0;
  if (gOther) {
    float pale = max(uOwn[4], 0.0), dull = max(uOwn[5], 0.0), clear = max(-uOwn[5], 0.0), rim = 1.0 - ndv;
    vec3 deep = d.hue * (0.45 + 0.55 * d.hue);
    vec3 day = deep * d.hue * (0.2 + 0.75 * sat(0.5 + 0.5 * dot(n, gSun)) + 0.5 * d.loud * ndv * ndv) + vec3(1.0) * glint * 0.4 + 0.1 * deep * rim * rim;
    float wrap = sat(dot(n, gSun) * 0.8 + 0.2);
    vec3 solid = (0.05 + deep) * (0.015 + 0.2 * pale + 1.7 * wrap * wrap) * (0.55 + 0.75 * d.loud) + deep * d.loud * 0.06 + d.hue * d.ring * 0.6;
    vec3 glass = d.hue * (0.05 + 1.9 * rim * rim * rim * (0.35 + d.loud) + 0.25 * d.loud * d.loud * ndv * ndv) + vec3(0.9, 0.95, 1.0) * (glint * 1.1 + 0.4 * pow(sat(dot(n, gSun)), 24.0)) + d.hue * d.ring * 0.7;
    vec3 was = shown / max(fog, 1e-4);
    day = mix(day, deep * 1.7, sat(d.ring));
    was = mix(was, day, pale);
    was = mix(was, solid, dull);
    was = mix(was, glass, clear);
    shown = was * fog + gAir * (1.0 - fog) * step(0.0, tca);
    bare = mix(1.0, sat(0.1 + 0.9 * rim * rim + 0.2 * d.loud * d.loud + glint), clear);
    cov *= bare * whole;
  }
  col += (1.0 - alpha) * cov * shown;
  alpha += (1.0 - alpha) * cov;
  float reach = gOther ? max(0.5 - length(d.off), d.r + 0.02) : 0.5, g = sat((reach - dd) / (reach - d.r));
  g *= g;
  col += (1.0 - alpha) * d.hue * (d.loud * d.loud * 0.3 + 0.5 * d.ring) * g * g * fog * (gOther ? (1.0 - 0.8 * max(max(uOwn[4], uOwn[5]), 0.0)) * (1.0 - 0.85 * abs(uOwn[6])) : 1.0);
}

// The light a lamp pools on the dark wall behind it. q: the place on the wall, c: the lamp, n: the wall's inward normal.
vec3 pool(Lamp d, vec3 q, vec3 c, vec3 n) {
  vec3 lv = c - q; float l2 = dot(lv, lv), h = dot(lv, n);
  return d.hue * d.loud * d.r * d.r * 2.2 * h / (l2 * sqrt(l2) + 0.02) * bump(sqrt(max(l2 - h * h, 0.0)) * 1.7) * (gOther ? (1.0 - 0.85 * max(-uOwn[5], 0.0)) * (1.0 - 0.75 * abs(uOwn[6])) : 1.0);
}

vec3 roundTunnel(vec3 ro, vec3 rd, float fogK) {
  float a = dot(rd.xy, rd.xy), b = dot(ro.xy, rd.xy), c0 = dot(ro.xy, ro.xy);
  if (a < 1e-5) return gAir;
  float Ri = gR - gFold - (gOther ? 1.35 : 1.0) * LIFT - 0.5 * max(uHits, 0.7 * uCue) - 2.0 * RMAX - 0.05;
  float tA = (-b + sqrt(max(b * b - a * (c0 - Ri * Ri), 0.0))) / a, tB = (-b + sqrt(b * b - a * (c0 - gR * gR))) / a;
  if (tA > 110.0 * gS) return gAir;
  float iz = floor(ro.z + rd.z * tA), izEnd = floor(ro.z + rd.z * tB), go = rd.z < 0.0 ? -1.0 : 1.0;
  vec3 col = vec3(0.0); float alpha = 0.0;
  for (int i = 0; i < 54; i++) {
    float tw = (iz + 0.5) / LEN; // the rows wind once round the tunnel in each turn of the loop
    vec2 pm = ro.xy + rd.xy * (clamp((iz + 0.5 - ro.z) / (abs(rd.z) < 1e-4 ? 1e-4 : rd.z), tA, tB));
    float turn = atan(pm.y, pm.x) / TAU + 0.25; // where round the tunnel the ray is here, counted from the floor
    float row0 = floor(fract(turn - tw) * gRows - 0.5);
    for (int j = 0; j < 2; j++) {
      float row = mod(row0 + float(j), gRows);
      Lamp d = lampAt((row + 0.5) / gRows, iz);
      float ang = ((row + 0.5 + d.off.x) / gRows - 0.25 + tw) * TAU;
      vec3 c = vec3(vec2(cos(ang), sin(ang)) * (gR - 0.03 - d.r - d.lift), iz + 0.5 + d.off.y);
      if (uOwn[6] < 0.0) { gAxis = vec3(-sin(ang), cos(ang), 0.0); gRod = -0.5 * uOwn[6] * (1.0 - (d.r + d.lift) / gR); }
      lay(d, c, ro, rd, fogK, col, alpha);
    }
    if (alpha > (gOther ? 0.94 : 0.985) || (iz - izEnd) * go >= 0.0 || i >= (gOther ? 45 : 35)) break;
    iz += go;
  }
  if (alpha < 0.985) {
    vec3 q = ro + rd * tB;
    float zc = floor(q.z), tw = (zc + 0.5) / LEN;
    float fr = fract(atan(q.y, q.x) / TAU + 0.25 - tw) * gRows, row = floor(fr);
    Lamp d = lampAt((row + 0.5) / gRows, zc);
    float ang = ((row + 0.5 + d.off.x) / gRows - 0.25 + tw) * TAU;
    vec3 n = vec3(-cos(ang), -sin(ang), 0.0);
    vec3 c = vec3(-n.xy * (gR - 0.03 - d.r - d.lift), zc + 0.5), lit = pool(d, q, c, n) + wallLight(fr / gRows, q.z, tB);
    if (gOther) {
      vec3 lv = c - q; float h = dot(lv, n), far = sqrt(max(dot(lv, lv) - h * h, 0.0));
      float pale = max(uOwn[4], 0.0);
      vec2 in_ = abs(vec2(fract(fr), fract(q.z)) - 0.5);
      lit = pool(d, q, c, n) * smoothstep(0.5, 0.3, max(in_.x, in_.y)) + wallLight(fr / gRows, q.z, tB);
      lit = lit * (1.0 - 0.75 * pale) + max(pale, 0.2 * max(uOwn[5], 0.0)) * paleWall(q, fr / gRows, n, smoothstep(d.r * 1.9 + 0.12, d.r * 0.3, far) * exp(-h * 0.7));
      float open = openAt(fr / gRows, q.z);
      lit *= 1.0 - open;
      col += (1.0 - alpha) * gAir * (1.0 - exp(-tB * fogK) * (1.0 - open));
    }
    col += (1.0 - alpha) * lit * exp(-tB * fogK);
  }
  return col;
}

vec3 squareDuct(vec3 ro, vec3 rd, float fogK, vec3 now) {
  rd += step(abs(rd), vec3(1e-4)) * 2e-4; // never exactly along a row of cells
  // which wall the ray meets first; then turn the duct so that wall is the floor
  vec2 tw = (gHalf * sign(rd.xy) - ro.xy) / rd.xy;
  float wi; // 0 floor, 1 right wall, 2 ceiling, 3 left wall
  if (tw.x < tw.y) wi = rd.x > 0.0 ? 1.0 : 3.0; else wi = rd.y > 0.0 ? 2.0 : 0.0;
  mat2 turn = rot(wi * PI * 0.5);
  gSun.xy = turn * gSun.xy; ro.xy = turn * ro.xy; rd.xy = turn * rd.xy; // now the wall is y = -gHalf
  ro.y += gHalf;                                 // and now it is y = 0, lamps hang above it
  float T = gFold + (gOther ? 1.35 : 1.0) * LIFT + 0.5 * max(uHits, 0.7 * uCue) + 2.0 * RMAX + 0.05;
  vec3 inv = 1.0 / rd;
  float t0 = max((T - ro.y) * inv.y, 0.0), t1 = -ro.y * inv.y;
  if (t0 > 110.0 * gS) return gAir;
  vec3 p = ro + rd * (t0 + 1e-3);
  vec2 id = floor(p.xz), stp = sign(rd.xz);
  vec2 tMax = (id + max(stp, 0.0) - ro.xz) * inv.xz, tDel = abs(inv.xz);
  vec3 col = vec3(0.0); float alpha = 0.0;
  float half_ = gSide * 0.5;
  for (int i = 0; i < 60; i++) {
    if (i >= 44 && !gOther) break;
    if (abs(id.x + 0.5) < half_) {
      Lamp d = lampAt((wi * gSide + id.x + half_ + 0.5) / (4.0 * gSide), id.y);
      lay(d, vec3(id.x + 0.5 + d.off.x, 0.03 + d.r + d.lift, id.y + 0.5 + d.off.y), ro, rd, fogK, col, alpha);
      if (alpha > 0.985) break;
    }
    float tn = min(tMax.x, tMax.y);
    if (tn > t1) break;
    if (tMax.x < tMax.y) { tMax.x += tDel.x; id.x += stp.x; } else { tMax.y += tDel.y; id.y += stp.y; }
  }
  if (alpha < 0.985) {
    vec3 q = ro + rd * t1;
    vec2 c = floor(q.xz);
    float fog = exp(-t1 * fogK), near = 0.0;
    if (abs(c.x + 0.5) < half_) {
      Lamp d = lampAt((wi * gSide + c.x + half_ + 0.5) / (4.0 * gSide), c.y);
      col += (1.0 - alpha) * pool(d, q, vec3(c.x + 0.5 + d.off.x, 0.03 + d.r + d.lift, c.y + 0.5 + d.off.y), vec3(0.0, 1.0, 0.0)) * fog * (gOther ? (1.0 - 0.75 * max(uOwn[4], 0.0)) * smoothstep(0.5, 0.3, max(abs(q.x - c.x - 0.5), abs(q.z - c.y - 0.5))) : 1.0);
      near = smoothstep(d.r * 1.9 + 0.12, d.r * 0.3, length(q.xz - c - 0.5 - d.off)) * exp(-d.lift * 0.7);
    }
    if (!gOther) col += (1.0 - alpha) * wallLight(clamp((wi * gSide + q.x + half_) / (4.0 * gSide), 0.0, 1.0), q.z, t1) * fog;
    // a line of light along each corner of the duct, with the spectrum running down it
    float e = gHalf - abs(q.x);
    float open = gOther ? openAt(clamp((wi * gSide + q.x + half_) / (4.0 * gSide), 0.0, 1.0), q.z) : 0.0;
    fog *= 1.0 - open;
    if (gOther) col += (1.0 - alpha) * (gAir * (1.0 - fog) + fog * max(uOwn[4], 0.2 * max(uOwn[5], 0.0)) * paleWall(q, clamp((wi * gSide + q.x + half_) / (4.0 * gSide), 0.0, 1.0), vec3(0.0, 1.0, 0.0), near) * (1.0 - 0.5 * exp(-e * 2.0 / gS)));
    if (gOther) col += (1.0 - alpha) * wallLight(clamp((wi * gSide + q.x + half_) / (4.0 * gSide), 0.0, 1.0), q.z, t1) * fog;
    fog *= gOther ? 1.0 - 0.7 * max(uOwn[4], 0.0) : 1.0;
    float run = 0.35 + 0.65 * band(fract(q.z / 32.0 - uTravel * 0.25));
    col += (1.0 - alpha) * now * exp(-e * 16.0 / gS) * run * (0.5 + 1.2 * uLevel) * fog;
    col += (1.0 - alpha) * now * exp(-e * 1.6 / gS) * run * 0.05 * (0.5 + uLevel) * fog;
  }
  return col;
}

vec3 render(vec2 p) {
  vec3 now = uKind[0] * uDrone + uKind[1] * uPad + uKind[2] * uTexture + uKind[3] * uPhrase + uKind[4] * uHits;
  now = now / (0.4 + uDrone + uPad + uTexture + uPhrase + uHits);
  now = max(mix(vec3(dot(now, vec3(0.3333))), now, 1.7), 0.0);
  gNowCol = now;
  gOther = uOwn[0] != 0.0 || uOwn[1] != 0.0 || uOwn[2] != 0.0 || uOwn[3] != 0.0 || uOwn[4] != 0.0 || uOwn[5] != 0.0 || uOwn[6] != 0.0 || uOwn[7] != 0.0;
  gS = 1.0; gRows = ROWS; gR = R; gLift = mix(1.7, 1.25, uVar); gHalf = HW; gSide = SIDE; gFold = 0.0; gRod = 0.0;
  gAir = vec3(0.0); gAxis = vec3(0.0, 0.0, 1.0); gSun = vec3(-0.4, 0.62, -0.67);
  if (gOther) {
    float many = exp2(uOwn[0] * (uOwn[0] > 0.0 ? 1.0 : 1.5));
    if (uOwn[0] != 0.0 && uVar < 0.5) { gRows = floor(ROWS * many + 0.5); gS = gRows / ROWS; }
    if (uOwn[0] != 0.0 && uVar > 0.5) { gSide = 2.0 * floor(0.5 * SIDE * many + 0.5); gS = mix(gSide / SIDE, 1.0, uOwn[0] < 0.0 ? 0.25 : 0.0); }
    gR = R * gS; gHalf = uVar > 0.5 && uOwn[0] != 0.0 ? 0.5 * gSide + (HW - 0.5 * SIDE) * gS : HW;
    gLift *= min(gS, 1.0);
    gFold = abs(uOwn[7]) * (uVar < 0.5 ? 0.36 * gR : 0.3 * gHalf);
    gRod = 0.5 * abs(uOwn[6]); if (uOwn[6] < 0.0 && uVar > 0.5) gAxis = vec3(1.0, 0.0, 0.0);
    gSun = normalize(mix(gSun, vec3(-0.66, 0.66, -0.3), max(uOwn[5], 0.0)));
    gSun = normalize(mix(gSun, vec3(-0.1, 0.45, 0.85), max(-uOwn[4], 0.0)));
  }
  gCamZ = fract(uTravel * SPEED * gS / LEN) * LEN;
  vec3 ro = vec3(1.2 * sin(uTime * 0.17), 1.0 * sin(uTime * 0.13 + 1.0), gCamZ);
  vec3 rd = normalize(vec3(p, 0.74));
  if (gOther) {
    ro.xy *= gS;
    float room = uVar < 0.5 ? gR - gFold - 1.35 * gLift - 0.85 : gHalf - gFold - 1.35 * gLift - 0.85;
    ro.xy *= min(1.0, 0.5 * room / (1.57 * gS));
    if (uOwn[3] > 0.0) { ro.y = mix(ro.y, -0.55 * room, uOwn[3]); rd.yz = rot(-0.06 * uOwn[3]) * rd.yz; }
    if (uOwn[3] < 0.0) { rd.xz = rot(-1.05 * uOwn[3]) * rd.xz; rd.xy = rot(0.16 * uOwn[3]) * rd.xy; }
  }
  rd.xy = rot(0.12 * sin(uTime * 0.071)) * rd.xy;
  rd.yz = rot(0.09 * sin(uTime * 0.11)) * rd.yz;
  rd.xz = rot(0.12 * sin(uTime * 0.083 + 2.0)) * rd.xz;
  float fogK = 0.04;
  if (gOther) {
    fogK /= gS;
    if (uOwn[2] != 0.0) { vec2 wide = exp2(0.8 * uOwn[2] * vec2(-1.0, 1.0)); ro.xy *= min(wide, 1.0); rd.xy *= wide; rd = normalize(rd); }
    float pale = max(uOwn[4], 0.0), dusk = max(-uOwn[4], 0.0), mid = sat(rd.z);
    if (pale > 0.0) gAir += pale * mix(vec3(0.93, 0.92, 0.9), 0.5 + 0.5 * uKind[1], 0.3) * (0.9 + 0.6 * mid * mid + 0.1 * uLevel);
    if (dusk > 0.0) gAir += dusk * (uKind[1] * uKind[1] * 0.3 * pow(mid, 4.0) + mix(uKind[3], uKind[1], 0.3) * (0.9 + 0.4 * uLevel) * pow(mid, 24.0) + (0.6 * uKind[3] + 0.4) * 0.7 * pow(mid, 260.0));
    fogK *= 1.0 - 0.5 * pale + 0.2 * dusk;
  }
  vec3 col = uVar < 0.5 ? roundTunnel(ro, rd, fogK) : squareDuct(ro, rd, fogK, now);
  return tone(col * 1.5);
}
