// name: Dot globe
// a: Globe
// b: Dome
// what: The piece wrapped round a dark globe in lamps: round it is the loop, pole to pole is the room, and it turns so that what sounds now faces you.
// follows: The turning keeps pace with the loop; loudness swells each lamp and lifts it off the surface, most at the playing place; a hit or cue sends a ring round the globe; the rim takes the colour of what sounds.
// own: 0 1 twice as many fine lamps, -1 a third of them and great; 1 1 each lamp drawn out into a spine, -1 flattened into an overlapping scale; 2 1 the lamps stand off on thin stems of many lengths, -1 folded into ridges (b: a ribbed vault); 3 1 a flat wide body, -1 a tall egg; 4 the ground: 1 pale paper with a soft shadow, -1 a dusky sky in the colours of drone and pad; 5 1 matte clay lit from one side, day and night, -1 clear bubbles, rims only; 6 1 strewn, of every size, many gone, -1 bands of great and small rows that slide past each other; 7 a: 1 a ring of lamps round the globe, -1 hollow, the far side seen through it (b: 1 looking straight up into the crown, -1 level over the mirror floor)
const float NR = 32.0, NE = 64.0, R = 10.186; // rows pole to pole, lamps round the middle, and the radius that makes them one apart
const float LIFT = 1.3, RMAX = 0.37;

vec3 tone(vec3 c) { c = max(c, 0.0); float l = max(c.r, max(c.g, c.b)); c *= (1.0 + l * 0.1) / (1.0 + l); c = mix(c, vec3(l / (1.0 + l)), sat(l * 0.12 - 0.1)); return pow(c, vec3(0.4545)); }
float bump(float x) { x = sat(1.0 - x * x); return x * x; }

struct Dot { vec3 c; float r; vec3 hue; float loud; float ring; };

float gOff;  // how far the globe has turned
float gSgn;  // 1: lamps stand out from the globe. -1: they hang in from the dome
vec3 gNow;   // the way to the place now playing

Dot dotAt(float row, float k, float n, float st, float ct) {
  vec2 uv = vec2((k + 0.5) / n, (row + 0.5) / NR);
  float lon = uv.x * TAU - gOff;
  if (gSgn < 0.0) uv.y *= 1.62; // under the dome the whole room lies between the top and the floor
  vec4 m = piece(uv);
  vec3 dir = vec3(st * cos(lon), ct, st * sin(lon));
  Dot d;
  d.loud = sat(m.a * (0.6 + 0.6 * uEnergy));
  d.hue = m.rgb / max(m.a, 0.001);
  d.hue = max(mix(vec3(dot(d.hue, vec3(0.3333))), d.hue, 1.9), 0.0);
  float dx = (fract(uv.x - uLoop + 0.5) - 0.5) * NE * st;
  float head = bump(dx * 0.1);
  float dist = R * length(dir - gNow);
  d.ring = 0.0;
  if (uHits > 0.01) d.ring = uHits * bump((dist - (1.0 - uHits) * 15.0) * 0.45) + 0.7 * uCue * bump((dist - (1.0 - uCue) * 21.0) * 0.3);
  d.r = min(RMAX, 0.08 + 0.28 * sqrt(d.loud) + 0.14 * d.ring);
  float lift = LIFT * d.loud * sqrt(d.loud) * (0.25 + 0.75 * head) + 0.8 * d.ring;
  d.c = dir * (R + gSgn * (0.03 + d.r + lift));
  return d;
}

vec3 shadeDot(Dot d, float ndv) {
  vec3 e = d.hue * d.loud * (0.06 + 1.2 * ndv * ndv * sqrt(ndv));
  float n4 = ndv * ndv; n4 *= n4;
  e += mix(d.hue, vec3(1.0), 0.25) * n4 * n4 * n4 * d.loud * d.loud;
  float rim = 1.0 - ndv;
  e += d.hue * rim * rim * (0.03 + 0.5 * d.loud);
  e += vec3(0.03, 0.04, 0.06) * (0.4 + ndv);
  e += mix(d.hue, vec3(1.0, 0.92, 0.82), 0.3) * d.ring * (0.15 + 0.85 * ndv * ndv);
  return e;
}

// The lamps along a ray, between t = tA and t = tB. wall says whether the ray ends on the dark surface the lamps stand on.
vec4 shell(vec3 ro, vec3 rd, float tA, float tB, float wall, float blur) {
  float len = tB - tA;
  int n = int(min(ceil(len / 0.68), 20.0));
  float ds = len / float(n);
  float best = 1e9, bcov = 0.0, bd2 = 0.0;
  Dot bd; bd.r = 1.0; bd.loud = 0.0; bd.ring = 0.0; bd.hue = vec3(0.0); bd.c = vec3(0.0);
  vec3 glow = vec3(0.0);
  for (int i = 0; i < 20; i++) {
    if (i >= n) break;
    float t = tA + (float(i) + 0.5) * ds;
    if (t > best + 0.6) break;
    vec3 P = ro + rd * t;
    float th = acos(clamp(P.y / length(P), -1.0, 1.0)), lon = fract((atan(P.z, P.x) + gOff) / TAU);
    float r0 = floor(th / PI * NR - 0.5);
    for (int j = 0; j < 2; j++) {
      float row = clamp(r0 + float(j), 0.0, NR - 1.0);
      float tc = (row + 0.5) / NR * PI, st = sin(tc), ct = cos(tc);
      float nn = max(3.0, floor(NE * st + 0.5));
      float k0 = floor(lon * nn - 0.5);
      for (int q = 0; q < 2; q++) {
        Dot d = dotAt(row, mod(k0 + float(q), nn), nn, st, ct);
        vec3 oc = d.c - ro; float tca = dot(oc, rd), d2 = dot(oc, oc) - tca * tca, dd = sqrt(max(d2, 0.0));
        float w = clamp(0.012 + tca * 1.2 / uRes.y + blur, 0.004, 0.49 - d.r);
        float cov = smoothstep(d.r + w, d.r - w, dd);
        if (cov > 0.0 && tca < best) { best = tca; bd = d; bcov = cov; bd2 = d2; }
        float g = sat((0.5 - dd) / (0.5 - d.r));
        glow = max(glow, d.hue * (d.loud * d.loud * 0.4 + 0.4 * d.ring) * g * g);
      }
    }
  }
  vec3 back = glow;
  if (wall > 0.5) { // the dark surface: each lamp pools a little light on it
    vec3 Q = ro + rd * tB;
    float th = acos(clamp(Q.y / length(Q), -1.0, 1.0)), lon = fract((atan(Q.z, Q.x) + gOff) / TAU);
    float row = clamp(floor(th / PI * NR), 0.0, NR - 1.0);
    float tc = (row + 0.5) / NR * PI, st = sin(tc), ct = cos(tc);
    float nn = max(3.0, floor(NE * st + 0.5));
    Dot d = dotAt(row, min(floor(lon * nn), nn - 1.0), nn, st, ct);
    vec3 lv = d.c - Q; float l2 = dot(lv, lv);
    float pool = d.loud * d.r * d.r * 2.0 * abs(dot(lv, Q)) / R / (l2 * sqrt(l2) + 0.02) * bump(sqrt(l2 - pow(dot(lv, Q) / R, 2.0)) * 1.8);
    back += d.hue * pool;
  }
  float ndv = sqrt(sat(1.0 - bd2 / (bd.r * bd.r)));
  return vec4(mix(back, shadeDot(bd, ndv), bcov), bcov);
}

float own0, own1, own2, own3, own4, own5, own6, own7; // the numbers of its own, read once
float gNR, gNE, gR, gMany;   // NR, NE and R as this world has them, and how many times as many
float gLong; // how long a lamp is along the way out, beside how wide it is
float gRest; // 0 for the plain picture; else the light of a lamp that nothing sounds in
float gStep; // how far apart along a ray lamps are looked for
float gTwo;  // 2 where a lamp may reach past its own cell
vec3 gBack; 
vec3 gPx, gPy; // the picture's own right and up, as the globe has them
float gAt;   // how far along the ray the nearest lamp was

struct Lamp { vec3 c; float r; vec3 hue; float loud; float ring; vec3 dir; float h; };

float slid(float row) {
  float y = row / gNR;
  return max(-own6, 0.0) * (0.55 * sin(y * 17.0 + uTime * 0.11) + 0.4 * sin(y * 41.0 - uTime * 0.16));
}

Lamp lampAt(float row, float k, float n, float slide, float st, float ct) {
  vec2 uv = vec2((k + 0.5) / n, (row + 0.5) / gNR);
  float lon = uv.x * TAU - gOff - slide;
  float h = hash21(vec2(k, row)), h2 = fract(h * 57.31 + 0.37), many = max(own6, 0.0), banded = max(-own6, 0.0);
  vec3 dir = vec3(st, ct, st);
  if (own6 > 0.0) { // strewn
    float by = own6 * 0.75 * (h2 - 0.5) * PI / gNR;
    dir = vec3(st + ct * by, ct - st * by, st + ct * by);
    lon += own6 * 0.75 * (h - 0.5) / n * TAU;
  }
  if (gSgn < 0.0) uv.y *= 1.62;
  vec4 m = piece(uv);
  dir *= vec3(cos(lon), 1.0, sin(lon));
  Lamp d;
  float sound = sat(m.a * (0.6 + 0.6 * uEnergy));
  d.hue = m.rgb / max(m.a, 0.001);
  d.hue = max(mix(vec3(dot(d.hue, vec3(0.3333))), d.hue, 1.9), 0.0);
  float head = bump((fract(uv.x - uLoop + 0.5) - 0.5) * 6.4 * st);
  float dist = R * length(dir - gNow);
  d.ring = uHits > 0.01 ? uHits * bump((dist - (1.0 - uHits) * 15.0) * 0.45) + 0.7 * uCue * bump((dist - (1.0 - uCue) * 21.0) * 0.3) : 0.0;
  d.ring += 0.3 * uHits * step(0.72, h2);
  float lift = LIFT * sound * sqrt(sound) * (0.25 + 0.75 * head) + 0.8 * d.ring;
  d.dir = dir; d.h = h;
  // lamps nothing sounds in are there too, and have a colour
  float stripe = 0.5 + 0.5 * sin(row / gNR * 37.0 + 1.0);
  vec3 rest = mix(uKind[1], uKind[0], smoothstep(0.2, 0.8, uv.y));
  rest = mix(rest, uKind[2], 0.7 * step(0.62, h2) * many + 0.25 * h2);
  rest = mix(rest, mix(uKind[2], uKind[3], h), banded * stripe);
  d.hue = mix(rest, d.hue, smoothstep(0.0, 0.25, m.a));
  d.loud = sqrt(sound * sound + gRest * gRest * 0.06);
  float r = 0.08 + 0.28 * sqrt(sound) + 0.14 * d.ring;
  r = min(RMAX, sqrt(r * r + gRest * gRest * 0.028));
  float left = mix(1.0, smoothstep(0.3, 0.42, fract(h * 31.7 + h2)), many);
  r *= left * mix(1.0, 0.4 + 1.25 * h2 * h2, many) * mix(1.0, 0.45 + 0.75 * stripe, banded);
  d.loud *= left;
  d.r = max(0.004, own1 < 0.0 ? mix(r, left * (0.52 + 0.4 * r), -own1) : r * mix(1.0, 0.36, own1));
  lift += max(own2, 0.0) * (0.7 + 1.9 * h2 * h2 + 0.9 * d.loud) * (0.6 + 0.4 * gMany) + max(-own1, 0.0) * 0.16 * h;
  if (own2 < 0.0) { float w = 0.5 + 0.5 * cos((lon + gOff) * 9.0 + 2.6 * ct); lift += -own2 * 2.1 * gMany * w * w * sat(st * 1.6); }
  d.c = dir * (gR + gSgn * (0.03 + d.r * gLong + lift));
  return d;
}

// The way to the one lamp of a lit world, as the globe has it.
vec3 sun() { return normalize(gPx * -0.8 + gPy * 0.45 + cross(gPx, gPy) * (gSgn > 0.0 ? -0.08 - 0.5 * max(own4, 0.0) : -0.65)); }

float dayAt(vec3 dir) {
  if (gSgn < 0.0) return 0.75 + 0.25 * dot(dir, vec3(0.0, 1.0, 0.0));
  return smoothstep(-0.15, 0.8, dot(dir, sun()));
}

// A lamp of another stuff: was is the plain lamp, n its face, v from the eye.
vec3 stuff(vec3 was, vec3 back, Lamp d, vec3 n, vec3 v) {
  float pale = max(own4, 0.0), clear = max(-own5, 0.0), day = max(max(own5, 0.0), pale * (1.0 - clear));
  float ndv = sat(-dot(n, v));
  vec3 s = sun(), c = was, pig = d.hue * (0.35 + 0.65 * d.hue);
  if (day > 0.0) {
    float wrap = sat(dot(n, s) * 0.7 + 0.3), all = mix(1.0, dayAt(d.dir), max(own5, 0.0));
    vec3 clay = pig * (0.14 + 0.1 * pale + 1.3 * wrap * wrap) * (0.03 + 0.97 * all) * (0.75 + 0.5 * d.loud) * (0.9 + 0.2 * d.h);
    clay += pow(sat(dot(reflect(v, n), s)), 18.0) * 0.16 * all;
    clay += d.hue * d.loud * d.loud * (0.05 + 0.04 * (1.0 - all)) * (0.15 + 0.6 * ndv) * (1.0 - 0.7 * pale);
    clay += mix(d.hue, vec3(1.0, 0.92, 0.82), 0.3) * d.ring * 1.3;
    c = mix(c, clay, day);
  }
  if (clear > 0.0) {
    float rim = 1.0 - ndv; rim *= rim;
    vec3 b = back * mix(vec3(1.0), 0.45 + 0.6 * d.hue, 0.35 + 0.5 * pale) * (1.0 - 0.55 * pale * rim);
    b += d.hue * (rim * (0.4 + 1.3 * d.loud) + 0.1 * d.loud) * (1.0 - 0.6 * pale);
    b = mix(b, pig * 0.4, pale * sqrt(rim) * 0.7);
    b += vec3(1.0, 0.97, 0.92) * (pow(sat(dot(reflect(v, n), s)), 50.0) * 0.9 + 0.25 * smoothstep(0.75, 0.8, sat(dot(n, normalize(-s + v * -0.6)))) * rim);
    b = mix(b, pig * (0.12 + 0.5 * d.loud), smoothstep(0.8, 0.97, ndv) * (0.35 + 0.65 * d.h) * 0.85);
    b += d.hue * d.ring * (0.2 + rim);
    c = mix(c, b, clear);
  }
  return c;
}

float stemDist(vec3 ro, vec3 rd, vec3 a, vec3 b, out float t) {
  vec3 ba = b - a, oa = ro - a;
  float baba = dot(ba, ba), bard = dot(ba, rd), baoa = dot(ba, oa), rdoa = dot(rd, oa);
  float s = clamp((baoa - rdoa * bard) / max(baba - bard * bard, 1e-5), 0.0, 1.0);
  vec3 q = a + ba * s;
  t = dot(q - ro, rd);
  return length(ro + rd * t - q);
}

// The lamps of a world along a ray, as shell() has them.
vec4 lamps(vec3 ro, vec3 rd, float tA, float tB, float wall, float blur) {
  float len = tB - tA;
  int n = int(min(ceil(len / gStep), gTwo > 1.0 ? 12.0 : 18.0)), two = int(gTwo);
  float ds = len / float(n), half_ = gTwo > 1.0 ? 0.5 : 0.0;
  float best = 1e9, bcov = 0.0, bd2 = 0.0, front = 1e9;
  Lamp bd; bd.r = 1.0; bd.loud = 0.0; bd.ring = 0.0; bd.hue = vec3(0.0); bd.c = vec3(0.0); bd.dir = vec3(0.0, 1.0, 0.0); bd.h = 0.0;
  vec3 glow = vec3(0.0), stem = vec3(0.0);
  float stemCov = 0.0, squash = 1.0 / gLong - 1.0, most = max(gLong * 0.3, 0.6);
  for (int i = 0; i < 18; i++) {
    if (i >= n) break;
    float t = tA + (float(i) + 0.5) * ds;
    if (t > best + most && bcov > 0.95) break;
    vec3 P = ro + rd * t;
    float th = acos(clamp(P.y / length(P), -1.0, 1.0)), lon = (atan(P.z, P.x) + gOff) / TAU;
    float r0 = floor(th / PI * gNR - half_);
    for (int j = 0; j < 2; j++) {
      if (j >= two) break;
      float row = clamp(r0 + float(j), 0.0, gNR - 1.0);
      float tc = (row + 0.5) / gNR * PI, st = sin(tc), ct = cos(tc);
      float nn = max(3.0, floor(gNE * st + 0.5)), slide = slid(row);
      float along = fract(lon + slide / TAU) * nn, k0 = floor(along - half_), fade = gTwo > 1.0 ? smoothstep(1.0, 0.55, abs(th / PI * gNR - row - 0.5)) : 1.0;
      for (int q = 0; q < 2; q++) {
        if (q >= two) break;
        Lamp d = lampAt(row, mod(k0 + float(q), nn), nn, slide, st, ct);
        vec3 oc = d.c - ro;
        // longer or flatter than round: the ray as it is where the lamp is round
        vec3 o2 = oc + d.dir * dot(oc, d.dir) * squash, r2 = rd + d.dir * dot(rd, d.dir) * squash;
        float rr = max(dot(r2, r2), 1e-4), tca = dot(o2, r2) / rr, d2 = max(dot(o2, o2) - tca * tca * rr, 0.0), dd = sqrt(d2);
        float w = min(clamp(0.012 + tca * 1.2 / uRes.y + blur, 0.004, max(0.49 - d.r, 0.012)), max(d.r, 0.02));
        float cov = smoothstep(d.r + w, d.r - w, dd);
        if (cov > 0.0 && tca + 6.0 * (1.0 - cov) < front) { front = tca + 6.0 * (1.0 - cov); best = tca; bd = d; bcov = cov; bd2 = d2; }   // the soft edge of one gives way to the one behind it
        float g = sat((0.5 - 0.22 * max(own6, 0.0) - dd) / max(0.5 - d.r, 0.05));
        if (gTwo > 1.0) g *= fade * smoothstep(1.0, 0.55, abs(along - k0 - float(q) - 0.5));   // a glow ends before its cells do
        glow = max(glow, d.hue * (d.loud * d.loud * 0.4 + 0.4 * d.ring) * g * g);
        if (own2 > 0.0) {
          float ts, sd = stemDist(ro, rd, d.dir * gR, d.c, ts);
          float ws = 0.018 + ts * 0.9 / uRes.y, cs = smoothstep(ws + 0.016, max(ws - 0.016, 0.0), sd) * min(1.0, 0.03 / ws) * step(0.02, d.r);
          if (cs > stemCov && ts < best + 0.3) { stemCov = cs; stem = d.hue * mix(0.18 + 0.6 * d.loud, 0.4, max(own4, 0.0)); }
        }
      }
    }
  }
  gAt = best;
  vec3 back = gBack;
  float pale = max(own4, 0.0);
  if (wall > 0.5) { // the surface they stand on: a shadow under each, and a little of its light
    vec3 Q = ro + rd * tB;
    float th = acos(clamp(Q.y / length(Q), -1.0, 1.0));
    float row = clamp(floor(th / PI * gNR), 0.0, gNR - 1.0), slide = slid(row), strewn = max(own6, 0.0);
    float tc = (row + 0.5) / gNR * PI, st = sin(tc), ct = cos(tc), nn = max(3.0, floor(gNE * st + 0.5));
    Lamp d = lampAt(row, min(floor(fract((atan(Q.z, Q.x) + gOff + slide) / TAU) * nn), nn - 1.0), nn, slide, st, ct);
    vec3 lv = d.c - Q; float l2 = dot(lv, lv), up = abs(dot(lv, Q)) / gR, by = sqrt(max(l2 - up * up, 0.0));
    back *= 1.0 - 0.5 * (1.0 - max(own6, 0.0)) * exp(-1.2 * max(up - d.r * gLong, 0.0)) * smoothstep(d.r * 1.9 + 0.1, d.r * 0.5, by);
    back += d.hue * d.loud * d.r * d.r * 2.0 * up / (l2 * sqrt(l2) + 0.02) * bump(by * 1.8) * (1.0 - pale) * (1.0 - max(own5, 0.0)) * (1.0 - strewn);
    if (strewn > 0.0 && pale + max(own5, 0.0) < 1.0) // strewn, a lamp can light the wall of its neighbours' places
      for (int j = 0; j < 4; j++) {
        float r1 = clamp(floor(th / PI * gNR - 0.5) + float(j / 2), 0.0, gNR - 1.0), t1 = (r1 + 0.5) / gNR * PI, s1 = sin(t1), n1 = max(3.0, floor(gNE * s1 + 0.5));
        float a1 = fract((atan(Q.z, Q.x) + gOff) / TAU) * n1, k1 = floor(a1 - 0.5) + float(j - j / 2 * 2);
        Lamp e = lampAt(r1, mod(k1, n1), n1, 0.0, s1, cos(t1));
        vec3 l1 = e.c - Q; float m2 = dot(l1, l1), u1 = abs(dot(l1, Q)) / gR;
        back += strewn * e.hue * e.loud * e.r * e.r * 2.0 * u1 / (m2 * sqrt(m2) + 0.02) * bump(sqrt(max(m2 - u1 * u1, 0.0)) * 1.8)
          * smoothstep(1.0, 0.7, abs(a1 - k1 - 0.5)) * smoothstep(1.0, 0.7, abs(th / PI * gNR - r1 - 0.5)) * (1.0 - pale) * (1.0 - max(own5, 0.0));
      }
  }
  back = mix(back + glow * (1.0 - max(pale, 0.8 * max(own5, 0.0))), stem, stemCov * max(own2, 0.0));
  // the face of the lamp, worked out where it is round and turned back
  vec3 oc = ro + rd * best - bd.c, o2 = oc + bd.dir * dot(oc, bd.dir) * squash, r2 = rd + bd.dir * dot(rd, bd.dir) * squash;
  vec3 nn = o2 - r2 / max(length(r2), 1e-3) * sqrt(max(bd.r * bd.r - dot(o2, o2), 0.0));
  nn += bd.dir * dot(nn, bd.dir) * squash;
  nn /= max(length(nn), 1e-4);
  Dot was; was.hue = bd.hue; was.loud = bd.loud; was.ring = bd.ring; was.c = bd.c; was.r = bd.r;
  vec3 face = stuff(shadeDot(was, sat(-dot(nn, rd))), back, bd, nn, rd);
  return vec4(bcov > 0.0 ? mix(back, face, bcov) : back, max(bcov, stemCov * max(own2, 0.0)));
}

// A flat ring of lamps round the globe.
vec4 ringAt(vec3 ro, vec3 rd, out float t) {
  t = 1e9;
  if (abs(rd.y) < 1e-3) return vec4(0.0);
  t = -ro.y / rd.y;
  if (t < 0.0) { t = 1e9; return vec4(0.0); }
  vec3 q = ro + rd * t;
  float cell = 0.62 * gMany / (0.4 + 0.6 * gMany), rad = length(q.xz) / gR, far = rad * gR / cell, lane = floor(far);
  float lr = (lane + 0.5) * cell / gR;
  if (lr < 1.34 || lr > 1.98) return vec4(0.0);
  float turn = gOff + 0.35 * sin(lane * 0.37);
  float n = floor(lr * gR * TAU / cell), a = fract((atan(q.z, q.x) + turn) / TAU) * n;
  float k = floor(a), h = hash21(vec2(k, lane + 91.0));
  vec4 m = piece(vec2((k + 0.5) / n, sat((lr - 1.34) / 0.64)));
  float loud = sat(m.a * (0.6 + 0.6 * uEnergy));
  float gap = smoothstep(0.02, 0.05, abs(lr - 1.72)) * smoothstep(0.0, 0.012, abs(lr - 1.5));
  float band = 0.6 + 0.4 * noise(vec2(lr * 34.0, 3.0));
  float r = (0.13 + 0.2 * h * band + 0.16 * sqrt(loud)) * gap * smoothstep(1.34, 1.38, lr) * smoothstep(1.98, 1.93, lr);
  vec2 f = vec2(fract(a) - 0.5, fract(far) - 0.5);
  float px = t * 1.2 / uRes.y / cell, w = clamp(px * 0.7, 0.03, 0.3), wide = px / max(abs(rd.y), 0.06);
  float cov = smoothstep(r + w, r - w, length(f));
  float even = sat(3.3 * r * r);                         // far off, the mean of them
  cov = mix(cov, even, smoothstep(0.5, 1.1, wide));
  vec3 hue = m.rgb / max(m.a, 0.001);
  hue = max(mix(vec3(dot(hue, vec3(0.3333))), hue, 1.9), 0.0);
  hue = mix(mix(uKind[2], uKind[3], sat(0.5 + 0.9 * (band - 0.75) + 0.3 * h)), hue, smoothstep(0.0, 0.25, m.a) * 0.8);
  vec3 c = hue * (0.22 + 0.16 * h + 0.75 * loud + 0.2 * band + 1.2 * uHits * step(0.75, h));
  float s = dot(q, sun()), off = length(q - sun() * s);   // the globe's shadow lies over it
  float shade = s < 0.0 ? smoothstep(gR * 0.93, gR * 1.07, off) : 1.0;
  c *= mix(1.0, 0.12 + 0.88 * shade, max(max(own5, 0.0), max(own4, 0.0) * 0.6) * 0.95 + 0.05);
  if (own4 > 0.0) c = mix(c, hue * (0.35 + 0.65 * hue) * (0.5 + 0.5 * shade), own4);
  return vec4(c, cov * own7);
}

// What lies behind it all.
vec3 sky(vec2 p) {
  float pale = max(own4, 0.0), dusk = max(-own4, 0.0);
  vec3 c = vec3(0.0);
  if (dusk > 0.0) {
    float y = sat(0.5 + p.y), hz = exp(-y * 2.6);
    vec3 up = uKind[1] * uKind[1], low = mix(uKind[0], uKind[3], 0.35); low *= low;
    c = dusk * (mix(up * 0.3, low * 0.9, hz) + uKind[3] * uKind[3] * 0.4 * exp(-dot(p - vec2(0.05, -0.12), p - vec2(0.05, -0.12)) * 4.0) * (0.5 + 0.5 * uLevel));
    c *= 0.92 + 0.12 * noise(p * vec2(3.0, 14.0) + vec2(uTime * 0.012, 4.0));
  }
  if (pale > 0.0) {
    float fall = 0.9 - 0.32 * dot(p - vec2(-0.25, 0.2), p - vec2(-0.25, 0.2));
    c += pale * mix(vec3(0.86, 0.82, 0.76), 0.35 + 0.65 * uKind[3], 0.22) * fall * (0.97 + 0.05 * noise(p * 260.0));
  }
  return c;
}

// To the screen: worlds that are lit, and not all lamps, keep the colours of things.
vec3 shown(vec3 col) {
  vec3 was = tone(col * 1.25);
  float lit = max(own4, 0.75 * max(own5, 0.0));
  if (lit <= 0.0) return was;
  vec3 c = max(col, 0.0);
  return mix(was, pow(1.0 - exp(-1.75 * c), vec3(0.4545)), sat(lit));
}

vec3 render(vec2 p) {
  own0 = uOwn[0]; own1 = uOwn[1]; own2 = uOwn[2]; own3 = uOwn[3]; own4 = uOwn[4]; own5 = uOwn[5]; own6 = uOwn[6]; own7 = uOwn[7];
  vec3 now = uKind[0] * uDrone + uKind[1] * uPad + uKind[2] * uTexture + uKind[3] * uPhrase + uKind[4] * uHits;
  now = now / (0.4 + uDrone + uPad + uTexture + uPhrase + uHits);
  now = max(mix(vec3(dot(now, vec3(0.3333))), now, 1.7), 0.0);
  vec3 col = vec3(0.0);
  float sway = 0.22 * sin(uTime * 0.11);
  gNR = floor(NR * exp2(own0 * (own0 > 0.0 ? 0.9 : 1.55)) + 0.5); gNE = 2.0 * gNR; gMany = gNR / NR; gR = R * gMany;
  gLong = exp2(own1 * (own1 > 0.0 ? 3.1 : 2.1));
  gRest = sat(abs(own0) + abs(own1) + abs(own2) + abs(own3) + abs(own4) + abs(own5) + abs(own6) + abs(own7));
  gBack = vec3(0.0); gAt = 1e9;
  gPx = vec3(1.0, 0.0, 0.0); gPy = vec3(0.0, 1.0, 0.0);
  gTwo = own6 > 0.0 || own1 < 0.0 ? 2.0 : 1.0;
  gStep = gTwo > 1.0 ? 1.25 : 0.6 + 0.4 * max(own2, 0.0);
  float squat = exp2(own3 * (own3 > 0.0 ? 1.0 : 0.75)), pale = max(own4, 0.0), hollow = 0.0;
  // how far the lamps stand out
  float tall = LIFT + 0.8 * max(uHits, 0.7 * uCue) + 2.0 * RMAX + 0.05;
  if (gRest > 0.0) {
    tall += 2.0 * RMAX * (gLong * mix(1.0, 0.36, max(own1, 0.0)) - 1.0) + 3.3 * max(own2, 0.0) * (0.6 + 0.4 * gMany) + 2.1 * gMany * max(-own2, 0.0) + 0.35 * max(own6, 0.0);
    tall = max(tall, 0.6);
  }
  vec3 ro, rd, N0 = vec3(0.0, 1.0, 0.0), bg = vec3(0.0), near = vec3(0.0), fl = vec3(0.0), Q = vec3(0.0);
  float tA = 0.0, tB = 0.0, wall = 1.0, blur = 0.0, gain = 1.0, b, c0, hO = 1.0, hC = 1.0, imp = 0.0, FY = 0.0, farA = 0.0, farB = 0.0, ringT = 1e9;
  vec4 ring = vec4(0.0), s = vec4(0.0);
  if (uVar < 0.5) {
    gSgn = 1.0; hollow = max(-own7, 0.0);
    // the camera stands off the globe, a little above its middle; the globe leans
    float tilt = 0.36 + 0.06 * sin(uTime * 0.07), roll = 0.2;
    float off = 1.0 + 0.4 * max(own7, 0.0);
    ro = vec3(0.0, 0.0, -26.0 * gMany * off); rd = normalize(vec3(p + vec2(0.0, 0.015), 0.9));
    ro.yz = rot(tilt) * ro.yz; rd.yz = rot(tilt) * rd.yz; gPx.yz = rot(tilt) * gPx.yz; gPy.yz = rot(tilt) * gPy.yz;
    ro.xy = rot(roll) * ro.xy; rd.xy = rot(roll) * rd.xy; gPx.xy = rot(roll) * gPx.xy; gPy.xy = rot(roll) * gPy.xy;
    if (own7 > 0.0) { mat2 m = rot(0.18 * own7); ro.xy = m * ro.xy; rd.xy = m * rd.xy; gPx.xy = m * gPx.xy; gPy.xy = m * gPy.xy; }
    float lonCam = atan(ro.z, ro.x);
    if (own3 != 0.0) { ro.y *= squat; rd.y *= squat; rd = normalize(rd); }
    gOff = uLoop * TAU - lonCam + sway;
    gNow = vec3(cos(lonCam - sway), 0.0, sin(lonCam - sway));
    b = dot(ro, rd); c0 = dot(ro, ro);
    float Ro = gR + tall;
    hO = b * b - c0 + Ro * Ro;
    imp = sqrt(max(c0 - b * b, 0.0)); // how near the ray passes to the middle of the globe
    if (own4 != 0.0) {
      vec2 u = (p - vec2(0.04, -0.43)) / vec2(0.46, 0.06);
      bg = sky(p) * (1.0 - 0.42 * pale * exp(-dot(u, u)) * (1.0 - 0.5 * hollow));
    }
    if (own7 > 0.0) ring = ringAt(ro, rd, ringT);
    if (gRest > 0.0) { gBack = bg; s.rgb = bg; }
    if (hO > 0.0) {
      tA = -b - sqrt(hO); tB = -b + sqrt(hO); wall = 0.0;
      hC = b * b - c0 + gR * gR;
      if (hC > 0.0) {
        farA = -b + sqrt(hC); farB = tB;
        tB = -b - sqrt(hC); wall = 1.0;
        if (gRest > 0.0) {
          N0 = (ro + rd * tB) / gR;
          vec3 k = mix(uKind[1], uKind[0], 0.5); k *= k;
          float lit = sat(dot(N0, sun()) * 0.6 + 0.4) * mix(1.0, dayAt(N0), max(own5, 0.0));
          near = k * (0.02 + 0.28 * lit * lit * max(own5, 0.0)) * (1.0 - pale) + pale * mix(vec3(0.6, 0.57, 0.52), k, 0.75) * (0.1 + 0.95 * lit * lit) * (0.65 + 0.35 * sat(-dot(N0, rd)));
          near += now * 0.012 + max(-own4, 0.0) * bg * 0.3;
          gBack = hollow > 0.0 ? bg : near;
        }
      }
    }
  } else {
    gSgn = -1.0;
    // inside: the camera stands on a black glass floor under the dome and looks up at the place now playing
    ro = vec3(0.0, -2.0, 0.0) + vec3(sin(uTime * 0.09), 0.0, cos(uTime * 0.07)) * 0.8;
    rd = normalize(vec3(p, 0.47 + 0.16 * abs(own7)));
    rd.xy = rot(0.05 * sin(uTime * 0.083)) * rd.xy;
    rd.yz = rot(0.46) * rd.yz; // look up
    if (own7 != 0.0) rd.yz = rot(own7 > 0.0 ? 0.95 * own7 : 0.42 * own7) * rd.yz;
    ro *= gMany;
    ro.z -= max(-own7, 0.0) * 5.0 * gMany;
    FY = -3.4 * gMany;
    if (own3 != 0.0) { float k = mix(squat, 1.0, 0.2); ro.y *= k; FY *= k; rd.y *= k; rd = normalize(rd); }
    float lonCam = PI * 0.5;   // toward +z
    gOff = uLoop * TAU - lonCam + sway;
    gNow = vec3(cos(lonCam - sway), 0.0, sin(lonCam - sway));
    if (own7 > 0.0) gNow = normalize(mix(gNow, vec3(0.0, 1.0, 0.1), 0.8 * own7));
    if (rd.y < 0.0) {
      float tf = (FY - ro.y) / rd.y;
      vec3 f = ro + rd * tf;
      if (dot(f.xz, f.xz) < gR * gR - FY * FY) {
        float fr = 1.0 + rd.y; fr *= fr;
        gain = 0.2 + 0.6 * fr * fr; blur = 0.035;
        if (own7 < 0.0) { rd.xz -= own7 * 0.02 * vec2(noise(f.xz * 2.2 / gMany + uTime * 0.2) - 0.5, noise(f.xz * 2.2 / gMany + 31.0 - uTime * 0.2) - 0.5); rd = normalize(rd); }
        fl = pale * vec3(0.52, 0.5, 0.46) * (0.6 + 0.4 * fr);
        ro = f; rd.y = -rd.y;
      }
    }
    b = dot(ro, rd); c0 = dot(ro, ro);
    float Ri = gR - tall;
    if (gRest > 0.0) Ri = max(Ri, gR * 0.25);
    tA = -b + sqrt(max(b * b - c0 + Ri * Ri, 0.0)); tB = -b + sqrt(b * b - c0 + gR * gR);
    Q = ro + rd * tB;
    if (gRest > 0.0) {
      vec3 N = Q / gR, k = mix(uKind[1], uKind[0], sat(0.6 - N.y)); k *= k;
      float lit = 0.35 + 0.65 * sat(0.5 - 0.5 * dot(N, sun()));
      gBack = k * 0.35 * lit * max(own5, 0.0) * (1.0 - pale) + pale * mix(vec3(0.95, 0.9, 0.83), k, 0.18) * (0.3 + 0.55 * lit);
      vec3 low = mix(uKind[0], uKind[3], 0.35);
      gBack += max(-own4, 0.0) * (mix(low * low * 0.75, uKind[1] * uKind[1] * 0.16, smoothstep(-0.3, 0.7, N.y)) + 0.45 * uKind[3] * uKind[3] * exp(-dot(N.xy - vec2(0.1, -0.05), N.xy - vec2(0.1, -0.05)) * 7.0) * step(0.0, N.z));
    }
  }
  float cover = 0.0;
  if (hO > 0.0) {
    if (gRest <= 0.0) s = shell(ro, rd, tA, tB, wall, blur);
    else {
      bool through = hollow > 0.0 && hC > 0.0;
      for (int pass = through ? 0 : 1; pass < 2; pass++) { // hollow: the far side first, then what is before it
        gStep *= pass == 0 ? 1.5 : 1.0;
        s = lamps(ro, rd, pass == 0 ? farA : tA, pass == 0 ? farB : tB, through ? 0.0 : wall, blur);
        if (pass == 0) gStep /= 1.5;
        if (pass == 0) gBack = mix(near, mix(s.rgb, bg * 0.97, 0.42), hollow);
      }
      if (through) wall = 0.0;
    }
    cover = s.a;
  }
  col = s.rgb;
  if (uVar < 0.5) {
    float dim = (1.0 - pale) * (1.0 - hollow) * (1.0 - 0.8 * max(own2, 0.0)) * (1.0 - max(max(own5, 0.0), 0.6 * ring.a));
    if (hO > 0.0 && wall > 0.5) { // the globe itself: black glass with a thin rim of light, strongest toward the upper left
      vec3 N = (ro + rd * tB) / gR;
      float f = 1.0 - sat(-dot(N, rd)); f *= f; f *= f;
      vec3 L = normalize(vec3(-0.5, 0.75, 0.2));
      col += (1.0 - cover) * now * f * f * (0.25 + 1.4 * sat(dot(N, L) * 0.5 + 0.5)) * (0.4 + uLevel) * (1.0 - pale) * (1.0 - 0.9 * max(own5, 0.0));
    }
    if (ring.a > 0.0) {
      float front = hO > 0.0 ? (hC > 0.0 ? (cover > 0.5 ? min(tB, gAt) : tB) : (cover > 0.5 ? gAt : 1e8)) : 1e8;
      col = mix(col, ring.rgb, ring.a * (ringT < front ? 1.0 : (hC <= 0.0 && hO > 0.0 ? 1.0 - cover : 0.0)));
    }
    // the thin rim, and a breath of light just outside it
    float e = (imp - gR) / gMany;
    vec3 Nc = normalize(ro - rd * b);
    float side = sat(dot(Nc, normalize(vec3(-0.5, 0.75, 0.2))) * 0.6 + 0.5);
    col += (1.0 - cover) * now * (exp(-e * e * 60.0) * 0.9 * side * side + (e > 0.0 ? exp(-e * 2.2) * 0.03 : 0.0)) * (0.35 + 0.9 * uLevel) * dim;
  } else {
    col = col * gain + fl;
    if (Q.y < FY) col = fl;
  }
  return shown(col);
}
