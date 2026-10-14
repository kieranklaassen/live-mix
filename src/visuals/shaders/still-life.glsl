// name: Still life
// a: Low sun
// b: Stipple
// what: Five matte balls stand on a plain before a half-sunk glowing disc, in low soft light with long shadows, like a still life on film.
// follows: Each kind of sound is one ball, as large as it is loud; the disc is the piece at this place in the loop, and the light swings round with the loop; a hit lights the small ball from inside, a cue sends a ring over the plain.
vec4 gS[5];   // the balls: middle and radius
vec3 gA[5];   // their colours
vec3 gL;      // towards the low light
vec4 gD;      // the disc: middle (x, y, z) and radius
vec3 gGlow;   // the light inside the small ball
const float gTurn[5] = float[5](0.12, 0.09, -0.1, 0.12, -0.1); // which way each ball's colour turns in its shadow
vec3 rich(vec3 c, float k) { return max(mix(vec3(dot(c, vec3(0.3, 0.59, 0.11))), c, k), 0.0); }
float grain(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }

void place() {
  float lv[5] = float[5](uDrone, uPad, uTexture, uPhrase, uHits);
  vec2 at[5] = vec2[5](vec2(-0.8, 0.95), vec2(1.0, 0.1), vec2(-1.75, -0.6), vec2(2.25, 1.35), vec2(-0.15, -1.0));
  float big[5] = float[5](0.98, 0.74, 0.52, 0.56, 0.34);
  for (int k = 0; k < 5; k++) {
    float r = big[k] * (0.2 + 0.8 * sqrt(lv[k]));
    if (k == 4) r = 0.2 + 0.14 * uHits;
    gS[k] = vec4(at[k].x, r, at[k].y, r);
    gA[k] = rich(uKind[k], 1.8) * 0.8;
  }
  gL = normalize(mix(vec3(-0.95, 0.21, -0.12), vec3(-0.88, 0.36, -0.3), uVar));
  gL.xz *= rot(0.4 * sin(TAU * uLoop)); // the light goes round a little with the loop, and the shadows with it
  gD = vec4(0.55, 0.0, 3.6, 1.7 + 0.5 * uLevel);
  gD.y = gD.w * 0.22;
  gGlow = rich(uKind[4], 2.1) * uHits * 5.0;
}
float ballAt(vec3 ro, vec3 rd, vec4 s) {
  vec3 oc = ro - s.xyz; float b = dot(oc, rd), h = b * b - dot(oc, oc) + s.w * s.w;
  return h < 0.0 ? -1.0 : -b - sqrt(h);
}
// How much of the light a ball lets by: soft, and softer the farther its shadow has fallen.
float shade(vec3 ro, vec3 rd, vec4 s, float k) {
  vec3 oc = ro - s.xyz; float b = dot(oc, rd), h = b * b - dot(oc, oc) + s.w * s.w;
  float d = sqrt(max(0.0, s.w * s.w - h)) - s.w, t = -b - sqrt(max(h, 0.0));
  return t < 0.0 ? 1.0 : smoothstep(0.0, 1.0, 2.5 * k * d / t);
}
// The disc's own light at a height on it (0 the plain, 1 its top): the piece here in the loop, the front of the room lowest.
vec3 discLight(float h) {
  float y = 1.0 - 0.06 - 0.88 * sat(h);
  vec3 m = piece(vec2(uLoop, y)).rgb * 0.4 + piece(vec2(uLoop, y - 0.09)).rgb * 0.3 + piece(vec2(uLoop, y + 0.09)).rgb * 0.3;
  return rich(m, 1.8) * (0.5 + 1.3 * uLevel);
}

vec3 scene(vec3 ro, vec3 rd) {
  bool dots = uVar > 0.5;
  float tb = 1e5; int id = -1;
  for (int k = 0; k < 5; k++) { float t = ballAt(ro, rd, gS[k]); if (t > 0.0 && t < tb) { tb = t; id = k; } }
  float td = (gD.z - ro.z) / rd.z; vec3 qd = ro + rd * td;
  float top = gD.y + gD.w;
  if (td > 0.0 && td < tb && qd.y > 0.0 && length(qd.xy - gD.xy) < gD.w) { tb = td; id = 5; }
  float tf = -ro.y / rd.y;
  if (rd.y < 0.0 && tf < tb) { tb = tf; id = 6; }

  vec3 key = mix(vec3(1.0, 0.8, 0.6), vec3(0.86, 0.9, 1.0), dots ? 0.6 : 0.35 - 0.35 * uTone) * (1.2 + 0.9 * uLevel);
  vec3 sky = mix(uKind[0], uKind[1], 0.6) * vec3(0.5, 0.6, 1.0) * (dots ? 0.012 : 0.035);
  vec3 dl = (discLight(0.2) + discLight(0.5) + discLight(0.8)) / 3.0; // what the disc throws forward
  vec3 col = vec3(0.0);
  if (id >= 0) {
    vec3 pos = ro + rd * tb, n, alb;
    if (id < 5) { n = (pos - gS[id].xyz) / gS[id].w; alb = gA[id]; }
    else if (id == 5) { n = vec3(0.0, 0.0, -1.0); alb = vec3(0.07, 0.065, 0.08); }
    else { n = vec3(0.0, 1.0, 0.0); alb = dots ? vec3(0.17, 0.17, 0.3) : vec3(0.21, 0.18, 0.19); }
    vec3 sp = pos + n * 0.002;
    float ndl = dot(n, gL);
    float sh = 1.0, ao = 1.0;
    vec3 bounce = vec3(0.0);
    vec2 q = pos.xz - vec2(0.3, 0.8);
    float pool = exp(-dot(q, q) / (dots ? 5.0 : 6.5));          // the light falls in one wide pool
    key *= mix(vec3(0.3, 0.12, 0.9), vec3(1.0), sat(pool * 1.35));  // and cools to violet towards its edge
    for (int k = 0; k < 5; k++) {
      float me = k == id ? 0.0 : 1.0;
      vec3 r = gS[k].xyz - pos; float l = length(r);
      sh *= mix(1.0, shade(sp, gL, gS[k], 2.4), me);
      float ff = sat(dot(n, r) / l) * gS[k].w * gS[k].w / (l * l);   // how much of what this point sees is that ball
      ao *= 1.0 - me * ff * 0.85;
      // the light that ball throws back, in its own colour, from the side of it turned this way
      float lit = sat(0.45 + 0.55 * dot(-r / l, gL));
      bounce += me * gA[k] * lit * ff;
    }
    // a long gradient round a ball from its lit side to its dark side
    float turn = smoothstep(-0.3, 0.95, ndl);
    float wide = id < 5 ? pow(turn, 1.7) * 1.1 : sat(ndl) * (dots ? 1.0 : 1.6);
    vec3 light = key * pool * wide * sh;
    light += key * pool * bounce * (id < 5 ? 0.9 : 2.2);
    if (id < 5) {
      // the plain throws light up under a ball, most on the side where the plain is lit
      vec2 out2 = normalize(n.xz + 1e-4);
      light += key * pool * vec3(0.2, 0.175, 0.19) * sat(0.5 - 0.5 * n.y) * sat(0.5 + 0.5 * dot(out2, normalize(gL.xz))) * 0.55;
      ao *= 0.55 + 0.45 * sat(0.5 + 0.5 * n.y + pos.y * 0.6);
      float side = 0.5 - 0.5 * ndl;                 // 0 facing the light, 1 turned away
      alb = rich(hueShift(alb, gTurn[id] * (side - 0.2)), 1.0 + 0.35 * side); // the hue turns as it goes into the dark
    }
    light += sky * ao * (0.6 + 0.4 * n.y);
    // the disc's light, falling forward over everything in front of it
    vec3 v = vec3(gD.x, gD.w * 0.55, gD.z) - pos; float d2 = dot(v, v), d1 = sqrt(d2);
    float fwd = sat(v.z / d1);
    light += dl * sat(0.12 + 0.88 * dot(n, v) / d1) * fwd * gD.w * gD.w / (d2 + gD.w * gD.w) * ao * (dots ? 0.5 : 1.3) * float(id != 5);
    // the small ball lit from inside
    vec3 g = gS[4].xyz - pos; float g2 = dot(g, g);
    light += gGlow * sat(0.08 + 0.92 * dot(n, g) * inversesqrt(g2)) * gS[4].w * gS[4].w / (g2 + 0.02) * float(id != 4);
    if (id == 6) {
      // a cue: a ring of light running out over the plain from the small ball
      float rr = length(pos.xz - gS[4].xz) - (1.0 - uCue) * 5.5;
      light += rich(uKind[4], 2.1) * uCue * uCue * exp(-rr * rr * 9.0) * 2.0;
    }
    col = alb * light;
    if (id == 4) { float core = pow(sat(dot(n, -rd)), 2.2); col += gGlow * (0.1 + 0.5 * core) + vec3(1.0, 0.75, 0.5) * uHits * core * core * 2.5; }
    if (id == 5) {
      float h = pos.y / top, edge = (gD.w - length(pos.xy - gD.xy)) / gD.w;
      float sd = 1.0;
      for (int k = 0; k < 5; k++) sd *= shade(sp, gL, gS[k], 2.4);
      col += discLight(h) * (0.3 + 0.7 * smoothstep(0.0, 0.6, edge)) * (dots ? 0.5 : 0.75) + alb * key * 0.5 * sd * sat(ndl + 0.2);
    }
    // far things sink into the dark of the room
    col *= exp(-max(tb - 5.0, 0.0) * (id == 6 ? 0.2 : 0.05));
  }
  // light in the air round the small ball
  vec3 oc = gS[4].xyz - ro; float tc = dot(oc, rd), m2 = dot(oc, oc) - tc * tc;
  col += gGlow * 0.08 * exp(-m2 / (gS[4].w * gS[4].w * 2.6)) * step(tc, tb + gS[4].w);
  return col;
}

vec3 render(vec2 p) {
  place();
  bool dots = uVar > 0.5;
  vec2 px = gl_FragCoord.xy;
  // film: every ray a hair off its place, so an edge is made of grain
  p += (vec2(grain(px + fract(uTime * 3.7) * 61.0), grain(px.yx + 31.0 + fract(uTime * 2.9) * 47.0)) - 0.5) / uRes.y;
  float a = 0.2 * sin(uTime * 0.06) + 0.08 * sin(uTime * 0.023 + 1.0) + (dots ? -0.28 : -0.12);
  float far = dots ? 5.4 : 5.6, high = dots ? 2.9 : 1.15 + 0.15 * sin(uTime * 0.04);
  vec3 ta = vec3(0.3, dots ? 0.3 : 0.62, 0.2);
  vec3 ro = ta + vec3(sin(a) * far, high - ta.y, -cos(a) * far);
  vec3 fw = normalize(ta - ro), rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)), up = cross(fw, rt);
  vec3 rd = normalize(fw * (dots ? 1.35 : 1.75) + rt * p.x + up * p.y);
  vec3 c = screenOf(scene(ro, rd) * (dots ? 1.9 : 1.0));
  float lum = dot(c, vec3(0.3, 0.59, 0.11));
  if (!dots) {
    // the grain of the film: most in the middle tones, none in the black
    float cell = max(1.0, uRes.y / 540.0);
    float g = grain(floor(px / cell) + floor(uTime * 12.0) * 17.0) - 0.5;
    c += c * g * 0.16 * (1.0 - lum) + g * 0.02 * smoothstep(0.0, 0.15, lum);
    return c;
  }
  // all in stipple: a grain for every little square, lit where the picture is brighter than the grain's own number
  float cell = max(1.0, floor(uRes.y / 320.0 + 0.5));
  vec2 gq = px / cell, gi = floor(gq), gf = fract(gq) - 0.5;
  float n = fract(grain(gi) + uTime * 0.03 * (0.5 + grain(gi + 7.7)));
  float dens = min(pow(lum, 1.6) * 1.6, 0.9);
  float on = smoothstep(n - 0.03, n + 0.03, dens);
  float dotShape = cell < 1.5 ? 1.0 : smoothstep(0.7, 0.35, length(gf + (vec2(grain(gi + 3.1), grain(gi + 9.3)) - 0.5) * 0.7));
  vec3 hue = c / max(max(c.r, max(c.g, c.b)), 0.001);
  return rich(hue, 1.3) * on * dotShape * (0.72 + 0.28 * lum);
}
