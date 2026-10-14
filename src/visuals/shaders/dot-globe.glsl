// name: Dot globe
// a: Globe
// b: Dome
// what: The piece wrapped round a dark globe in lamps: round it is the loop, pole to pole is the room, and it turns so that what sounds now faces you.
// follows: The turning keeps pace with the loop; loudness swells each lamp and lifts it off the surface, most at the playing place; a hit or cue sends a ring round the globe; the rim takes the colour of what sounds.
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

vec3 render(vec2 p) {
  vec3 now = uKind[0] * uDrone + uKind[1] * uPad + uKind[2] * uTexture + uKind[3] * uPhrase + uKind[4] * uHits;
  now = now / (0.4 + uDrone + uPad + uTexture + uPhrase + uHits);
  now = max(mix(vec3(dot(now, vec3(0.3333))), now, 1.7), 0.0);
  vec3 col = vec3(0.0);
  float sway = 0.22 * sin(uTime * 0.11);
  if (uVar < 0.5) {
    gSgn = 1.0;
    // the camera stands off the globe, a little above its middle; the globe leans
    float tilt = 0.36 + 0.06 * sin(uTime * 0.07), roll = 0.2;
    vec3 ro = vec3(0.0, 0.0, -26.0), rd = normalize(vec3(p + vec2(0.0, 0.015), 0.9));
    ro.yz = rot(tilt) * ro.yz; rd.yz = rot(tilt) * rd.yz;
    ro.xy = rot(roll) * ro.xy; rd.xy = rot(roll) * rd.xy;
    float lonCam = atan(ro.z, ro.x);
    gOff = uLoop * TAU - lonCam + sway;
    gNow = vec3(cos(lonCam - sway), 0.0, sin(lonCam - sway));
    float b = dot(ro, rd), c0 = dot(ro, ro);
    float Ro = R + LIFT + 0.8 * max(uHits, 0.7 * uCue) + 2.0 * RMAX + 0.05;
    float hO = b * b - c0 + Ro * Ro;
    float imp = sqrt(max(c0 - b * b, 0.0)), cover = 0.0; // how near the ray passes to the middle of the globe
    if (hO > 0.0) {
      float tA = -b - sqrt(hO), tB = -b + sqrt(hO), wall = 0.0;
      float hC = b * b - c0 + R * R;
      if (hC > 0.0) { tB = -b - sqrt(hC); wall = 1.0; }
      vec4 s = shell(ro, rd, tA, tB, wall, 0.0);
      col = s.rgb; cover = s.a;
      if (wall > 0.5) { // the globe itself: black glass with a thin rim of light, strongest toward the upper left
        vec3 N = (ro + rd * tB) / R;
        float f = 1.0 - sat(-dot(N, rd)); f *= f; f *= f;
        vec3 L = normalize(vec3(-0.5, 0.75, 0.2));
        col += (1.0 - cover) * now * f * f * (0.25 + 1.4 * sat(dot(N, L) * 0.5 + 0.5)) * (0.4 + uLevel);
      }
    }
    // the thin rim, and a breath of light just outside it
    float e = imp - R;
    vec3 Nc = normalize(ro - rd * b);
    float side = sat(dot(Nc, normalize(vec3(-0.5, 0.75, 0.2))) * 0.6 + 0.5);
    col += (1.0 - cover) * now * (exp(-e * e * 60.0) * 0.9 * side * side + (e > 0.0 ? exp(-e * 2.2) * 0.03 : 0.0)) * (0.35 + 0.9 * uLevel);
  } else {
    gSgn = -1.0;
    // inside: the camera stands on a black glass floor under the dome and looks up at the place now playing
    vec3 ro = vec3(0.0, -2.0, 0.0) + vec3(sin(uTime * 0.09), 0.0, cos(uTime * 0.07)) * 0.8;
    vec3 rd = normalize(vec3(p, 0.47));
    rd.xy = rot(0.05 * sin(uTime * 0.083)) * rd.xy;
    rd.yz = rot(0.46) * rd.yz; // look up
    float lonCam = PI * 0.5;   // toward +z
    gOff = uLoop * TAU - lonCam + sway;
    gNow = vec3(cos(lonCam - sway), 0.0, sin(lonCam - sway));
    float gain = 1.0, blur = 0.0;
    const float FY = -3.4;
    if (rd.y < 0.0) {
      float tf = (FY - ro.y) / rd.y;
      vec3 f = ro + rd * tf;
      if (dot(f.xz, f.xz) < R * R - FY * FY) {
        float fr = 1.0 + rd.y; fr *= fr;
        gain = 0.2 + 0.6 * fr * fr; blur = 0.035;
        ro = f; rd.y = -rd.y;
      }
    }
    float b = dot(ro, rd), c0 = dot(ro, ro);
    float Ri = R - LIFT - 0.8 * max(uHits, 0.7 * uCue) - 2.0 * RMAX - 0.05;
    float tA = -b + sqrt(max(b * b - c0 + Ri * Ri, 0.0)), tB = -b + sqrt(b * b - c0 + R * R);
    col = shell(ro, rd, tA, tB, 1.0, blur).rgb * gain;
    vec3 Q = ro + rd * tB;
    if (Q.y < FY) col = vec3(0.0);
  }
  return tone(col * 1.25);
}
