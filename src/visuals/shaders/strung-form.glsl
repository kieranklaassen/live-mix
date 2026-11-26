// name: Strung form
// a: Brass hoops
// b: Crossed bars
// what: Two tilted brass hoops on posts, strung with silk, stand on a round linen-white plinth in window light; the straight threads twist into a waisted skin, and the shadow of every one lies on the wall. Or two dark bars tipped with brass, crossed in bright fog, the threads between them drawing one long curve.
// follows: The drone and the tone dial twist the form. Each sheet is two kinds, dyed as deep as they are loud; the piece tints threads where it sounds. Sixteen bands blur sixteen groups. The phrase and the keys run glints, a hit plucks a group and sends its colour down, a cue passes light and turns the form. The playhead is a small light, low notes move the window's.
float sfLv[4]; // how loud each kind of thread is
vec3 sfL; // towards the light
float sfMid; // how far away the middle of the form is
float sfLen; // the lens
vec4 sfHaze; // what far threads fade into
vec3 sfA0, sfA1, sfA2;  // one rim (or bar): its middle and the two ways it goes
vec3 sfB0, sfB1, sfB2;  // the other
vec4 sfS0, sfS1; vec2 sfT; // threads behind the middle and before it; what they let through
float sfShade;
vec2 sfQ; float sfPx, sfReach;

vec3 sfRich(vec3 c, float k) { return max(mix(vec3(dot(c, vec3(0.3, 0.59, 0.11))), c, k), 0.0); }
// A colour as a dye in thread: deep, and none much darker or paler than its neighbours.
vec3 sfDye(vec3 c) {
 c = sfRich(c * c, 1.35);
 return c * (0.09 / max(dot(c, vec3(0.3, 0.59, 0.11)), 0.04) + 0.06);
}
// The thread from a to b as they are seen; e its place on the rims, i its number of n, w1 and w2 the second rim's ways.
void sfThread(vec3 a, vec3 b, vec2 e, vec3 w1, vec3 w2, float fam, float i, float n, bool shadow) {
 vec2 sa = a.xy / a.z, ab = b.xy / b.z - sa, qa = sfQ - sa;
 float l2 = max(dot(ab, ab), 1e-6), il = inversesqrt(l2), s = dot(qa, ab) / l2;
 float d = abs(qa.x * ab.y - qa.y * ab.x) * il;
 float over = shadow ? sfPx + 0.012 + 0.045 * uSpace * uSpace : sfPx * 1.5;
 float ends = sat(0.5 + (s + 0.012) * 0.6 / (over * il)) * sat(0.5 + (1.012 - s) * 0.6 / (over * il));
 if (shadow) sfShade += ends * (clamp(d + 0.011, -over, over) - clamp(d - 0.011, -over, over)) / (2.0 * over);
 bool isA = uVar < 0.5;
 if (!shadow && ends > 0.0 && d < sfReach) {
  float t = s * a.z / max(b.z + s * (a.z - b.z), 1e-3), w = mix(a.z, b.z, sat(t));
  float g = i * 16.0 / n, k = sfLen / w, hd = g - 11.5;
  float hit = fam > 0.5 == isA ? 0.0 : uHits * exp(-hd * hd * 0.5), bd = uBands[int(clamp(g, 0.0, 15.0))];
  float amp = (0.003 + (isA ? 0.018 : 0.011) * (0.4 + uEnergy) * bd + 0.018 * hit) * sin(PI * sat(t));
  // a sheet is two kinds, in turn round the rim
  float lp = i / n, which = smoothstep(-0.25, 0.25, isA ? cos(TAU * 2.0 * lp + 1.0 + fam) : cos(PI * lp - 0.25 + 0.4 * fam));
  int f0 = int(fam) * 2;
  float loud = mix(sfLv[f0], sfLv[f0 + 1], which);
  float r = (isA ? 0.011 : 0.0095 + 0.003 * loud) * k * (1.0 + 0.5 * hit), h = max(sfPx * 0.75, amp * k);
  float c = ends * (clamp(d + r, -h, h) - clamp(d - r, -h, h)) / (2.0 * h);
  c *= mix(1.0, 0.8 + 0.75 * d * d / (h * h), sat(amp * k / sfPx - 0.5));
  vec3 T = normalize(sfB0 + w1 * e.x + w2 * e.y - sfA0 - sfA1 * e.x - sfA2 * e.y);
  float tl = dot(T, sfL), th = dot(T, normalize(sfL + vec3(0.0, 0.0, -1.0)));
  float sheen = pow(max(1.0 - th * th, 0.0), mix(12.0, 50.0, uTone));
  // where the piece has a sound tied there, its colour is in the thread
  vec4 pc = piece(vec2(fract(lp + 0.0001), 0.3 + 0.4 * fam));
  vec3 rest = fam > 0.5 ? vec3(0.075, 0.09, 0.11) : isA ? vec3(0.50, 0.47, 0.41) : vec3(0.25, 0.22, 0.185);
  vec3 dye = mix(rest, sfDye(mix(uKind[f0], uKind[f0 + 1], which)), sat(1.6 * loud / (0.35 + loud)));
  dye = mix(dye, sfDye(pc.rgb / max(pc.a, 0.03)), sat(pc.a * 1.6) * 0.6);
  vec3 col = dye * (0.3 + sqrt(max(1.0 - tl * tl, 0.0)) + 0.5 * bd) + sheen * vec3(1.0, 0.95, 0.88) * (0.05 + 0.2 * loud * uEnergy);
  // a glint runs along a few single threads; a hit's and a cue's light go down the form
  float hi = hash11(i + 31.0 * fam), gl = t - (fract(uTime * (0.05 + 0.025 * floor(hi * 3.0)) + hi * 7.0) * 1.6 - 0.3);
  float run = t - 1.0 + uHits, cue = t - 1.2 * (1.0 - uCue) + 0.1;
  col += vec3(1.0, 0.93, 0.8) * exp(-gl * gl * 220.0) * step(0.86, fract(hi * 13.7)) * (uPhrase + uKeys);
  col = mix(col, sfDye(uKind[4]) * 3.0 + 0.25, sat(hit * 0.7 + 0.5 * uHits * exp(-run * run * 16.0)));
  col += vec3(1.0, 0.94, 0.84) * uCue * 0.5 * exp(-cue * cue * 30.0);
  col = mix(col, sfHaze.rgb, sat((w - 5.8) * sfHaze.a));
  float f = (1.0 - smoothstep(-0.12, 0.12, w - sfMid)), c0 = min(c * (1.0 - f), 0.97), c1 = min(c * f, 0.97);
  sfS0 += vec4(col, 1.0) * c0; sfT.x *= 1.0 - c0;
  sfS1 += vec4(col, 1.0) * c1; sfT.y *= 1.0 - c1;
 }
}
// The two sheets, of n threads each, from rim to rim. Where along the rims the thread through this place would be tied is a
// root of f; the threads next to each root are drawn.
void sfSheets(vec2 q, mat4x3 M, float px, float turn, float n, bool shadow, bool on) {
 sfQ = q; sfPx = px; sfReach = px + 0.3 * (0.018 + 0.02 * (0.4 + uEnergy) + 0.03 * uHits);
 vec3 a0 = M * vec4(sfA0, 1.0), a1 = M * vec4(sfA1, 0.0), a2 = M * vec4(sfA2, 0.0), h = vec3(q, 1.0);
 vec3 c0 = cross(h, a0), c1 = cross(h, a1), c2 = cross(h, a2);
 bool ring = uVar < 0.5;
 float per = ring ? n / TAU : (n - 1.0) * 0.5;
 int fam = 0; do {
  float tw = fam == 0 ? turn : -turn, ct = cos(tw), st = sin(tw), last = -100.0;
  vec3 w1 = ring ? sfB1 * ct + sfB2 * st : sfB1 * tw, w2 = sfB2 * ct - sfB1 * st;
  w2 = ring ? w2 : vec3(0.0);
  vec3 b0 = M * vec4(sfB0, 1.0), b1 = M * vec4(w1, 0.0), b2 = M * vec4(w2, 0.0);
  float k0 = dot(c0, b0), kc = dot(c1, b0) + dot(c0, b1), kcc = dot(c1, b1);
  vec2 root[6]; int nr = 0; root[0] = vec2(0.0); // a first guess, and 0 for a crossing, -1 or 1 for a dip
  float ks = dot(c2, b0) + dot(c0, b2), kss = dot(c2, b2), ksc = 0.5 * (dot(c1, b2) + dot(c2, b1));
  float m0 = k0 + 0.5 * (kcc + kss), m2 = 0.5 * (kcc - kss);
  if (!ring) {
   float k = abs(kcc) < 1e-6 ? 1e-6 : kcc, u = -0.5 * kc / k, v = u * u - k0 / k, w = sqrt(max(v, 0.0));
   root[0] = vec2(u - w, 0.0); root[1] = vec2(u + w, 0.0); nr = v < -0.03 ? 0 : 2;
  }
  const float ST = TAU / 12.0, CS = 0.8660254, SS = 0.5;
  float fp = m0 + kc * CS - ks * SS + m2 * 0.5 - ksc * 0.8660254, f0 = m0 + kc + m2;
  vec2 e0 = vec2(1.0, 0.0);
  int i = 0; do {
   vec2 e1 = vec2(e0.x * CS - e0.y * SS, e0.y * CS + e0.x * SS);
   float f1 = m0 + kc * e1.x + ks * e1.y + m2 * (e1.x * e1.x - e1.y * e1.y) + 2.0 * ksc * e1.x * e1.y, th = float(i) * ST;
   bool dip = f0 * fp > 0.0 && f0 * f1 > 0.0 && abs(f0) <= abs(fp) && abs(f0) < abs(f1);
   if (ring && nr < 5 && (dip || f0 * f1 <= 0.0)) {
    float u = dip ? 0.5 * (fp - f1) / (fp + f1 - 2.0 * f0 + (f0 > 0.0 ? 1e-9 : -1e-9)) : sat(f0 / (f0 - f1 + (f0 > f1 ? 1e-9 : -1e-9)));
    root[nr++] = vec2(th + ST * u, dip ? -1.0 : 0.0);
    if (dip) root[nr++] = vec2(th + ST * u, 1.0);
   }
   fp = f0; f0 = f1; e0 = e1;
  } while (++i < 12 && ring && on);
  int j = 0; do {
   float u = root[j].x, kind = root[j].y;
   bool none = j >= nr || !on;
   float wr = 1.0;
   int t = ring && !none ? 0 : 1; do {
    float c = cos(u), s = sin(u), cc = c * c - s * s, sc = 2.0 * s * c;
    float v = m0 + kc * c + ks * s + m2 * cc + ksc * sc;
    float g1 = -kc * s + ks * c - 2.0 * m2 * sc + 2.0 * ksc * cc, g2 = -kc * c - ks * s - 4.0 * m2 * cc - 4.0 * ksc * sc;
    g1 = abs(g1) < 1e-6 ? 1e-6 : g1; g2 = abs(g2) < 1e-6 ? 1e-6 : g2;
    float by = clamp(v / g1, -0.4, 0.4);
    if (t == 0 && kind != 0.0) { wr = g1 * g1 / (g2 * g2) - 2.0 * v / g2; by = clamp(g1 / g2, -0.3, 0.3) - kind * sqrt(max(wr, 0.0)); }
    u -= !ring || (t == 1 && wr < 0.004) ? 0.0 : by;
   } while (++t < 2);
   none = none || wr < -0.4;
   float i0 = floor(ring ? u * per : clamp((u + 1.0) * per, -2.0, n));
   int m = 0; do {
    float i = i0 + float(m);
    if (!none && i > last && (ring || (i >= 0.0 && i <= n - 1.0))) {
     last = i;
     vec2 e = ring ? vec2(cos(i / per), sin(i / per)) : vec2(i / per - 1.0, 0.0);
     sfThread(a0 + a1 * e.x + a2 * e.y, b0 + b1 * e.x + b2 * e.y, e, w1, w2, float(fam), ring ? mod(i, n) : i, n, shadow);
    }
   } while (++m < 2);
  } while (++j < nr && on);
 } while (++fam < 2 && on);
}
// What polished brass sees in this room: a tall window on the left, a pale floor, grey walls.
vec3 sfMetal(vec3 N) {
 vec3 R = reflect(vec3(0.0, 0.0, 1.0), N);
 float win = smoothstep(0.25, 0.75, dot(R, normalize(vec3(-0.8, 0.25, -0.55)))) * 1.4;
 float env = 0.09 + 0.2 * (1.0 - smoothstep(-0.9, -0.2, R.y)) + 0.18 * smoothstep(0.1, 0.9, R.y) + win + 0.12 * smoothstep(0.4, 1.0, R.x);
 float s = sat(dot(R, normalize(vec3(-0.8, 0.35, -0.5)))); s *= s; s *= s; s *= s; s *= s;
 return vec3(0.80, 0.52, 0.20) * env + 0.5 * s * s;
}
// A straight round rod: x across it (-1 to 1), y its cover, z along it.
vec3 sfRod(vec2 q, vec3 a, vec3 b, float r, float px, out vec2 side) {
 vec2 sa = a.xy / a.z, ab = b.xy / b.z - sa, qa = q - sa;
 float l = max(length(ab), 1e-4); ab /= l;
 float s = dot(qa, ab) / l, t = s * a.z / max(b.z + s * (a.z - b.z), 1e-3), w = mix(a.z, b.z, sat(t));
 side = vec2(ab.y, -ab.x);
 float rr = max(r * sfLen / w, px * 0.6), d = dot(qa, side);
 float cov = smoothstep(-px * 0.8, px * 0.8, rr - abs(d)) * smoothstep(-px, px, s * l) * smoothstep(-px, px, l - s * l);
 return vec3(clamp(d / rr, -1.0, 1.0), cov, t);
}
// A hoop of radius 1: how far off its drawn line, the way out of it, and where round it we are.
vec4 sfHoop(vec2 q, mat4x3 M, vec3 c, vec3 u, vec3 v) {
 vec3 a = M * vec4(u, 0.0), b = M * vec4(v, 0.0), d = M * vec4(c, 1.0), h = vec3(q, 1.0);
 vec3 bd = cross(b, d), da = cross(d, a), ab = cross(a, b);
 vec3 g = vec3(dot(bd, h), dot(da, h), dot(ab, h));
 vec2 gr = 2.0 * (g.x * bd.xy + g.y * da.xy - g.z * ab.xy);
 float l = max(length(gr), 1e-6);
 g.z = abs(g.z) < 1e-6 ? 1e-6 : g.z;
 vec2 k = g.xy / g.z;
 float off = abs(dot(k, k) - 1.0) > 0.9 ? 9.0 : (dot(k, k) - 1.0) * g.z * g.z / l;
 return vec4(off, gr / l, atan(k.y, abs(k.x) < 1e-6 ? 1e-6 : k.x));
}
vec3 sfLay(vec3 col, vec4 s, float t) { return mix(col, s.rgb / max(s.a, 1e-4), 1.0 - t); }

vec3 render(vec2 p) {
 sfLv[0] = uDrone; sfLv[1] = uPad; sfLv[2] = uTexture; sfLv[3] = uPhrase;
 bool a = uVar < 0.5;
 float hw = 0.5 * uRes.x / uRes.y, zoom = a ? clamp(0.5 / hw, 1.0, 1.8) : clamp(0.66 / hw, 1.0, 2.4);
 p = p * zoom + vec2(0.0, a ? (zoom - 1.0) * 0.06 : 0.0);
 float px = zoom / uRes.y, camY = a ? 2.75 : 1.5, shy = a ? 0.375 : 0.03, ox = a ? -0.2 * sat(hw * 1.6 - 0.5) : 0.0;
 const float ZW = 1.95, PR = 1.42, HC = 0.86, OFF = 0.8;
 const vec3 up = vec3(0.0, 1.0, 0.0);
 sfMid = a ? 9.0 : 8.0; sfLen = a ? 2.3 : 2.1;
 sfL = normalize(a ? vec3(-0.70 - 0.06 * uLow, 0.25, -0.60) : vec3(-0.45, 0.8, 0.5));
 // what the eye sees of a place in the room: x, y, and how far; and what the light sees on the floor and on the wall
 mat4x3 M = mat4x3(sfLen, 0, 0, 0, sfLen, 0, ox, shy, 1.0, ox * sfMid, shy * sfMid - sfLen * camY, sfMid);
 mat4x3 Mf = mat4x3(1, 0, 0, -sfL.x / sfL.y, -sfL.z / sfL.y, 0, 0, 1, 0, 0, 0, 1);
 mat4x3 Mw = mat4x3(1, 0, 0, 0, 1, 0, -sfL.x / sfL.z, -sfL.y / sfL.z, 0.0, sfL.x / sfL.z * ZW, sfL.y / sfL.z * ZW, 1.0);
 vec3 ro = vec3(0.0, camY, -sfMid), rd = vec3((p.x - ox) / sfLen, (p.y - shy) / sfLen, 1.0);
 float tg = camY / max(-rd.y, 1e-3), drone = uDrone / (0.35 + uDrone), turn = 1.0;
 vec3 g = ro + rd * tg, q = ro + rd * (sfMid + ZW);

 // the form: two hoops hung on one axis between posts, or two bars that cross; a cue turns it a little and back
 float yaw = (a ? 0.5 + 0.28 * sin(uTime * 0.021) : -0.42 + 0.16 * sin(uTime * 0.019)) + 0.56 * uCue * (1.0 - uCue);
 vec3 ax = vec3(cos(yaw), 0.0, sin(yaw)), fz = vec3(-ax.z, 0.0, ax.x), foot[2], head[2];
 if (a) {
  float t1 = 0.40 + 0.06 * sin(uTime * 0.047), t2 = -0.08 + 0.04 * sin(uTime * 0.039 + 2.0);
  sfA0 = up * 2.25; sfA1 = ax; sfA2 = fz * cos(t1) + up * sin(t1);
  sfB0 = up * 0.58; sfB1 = ax; sfB2 = fz * cos(t2) + up * sin(t2);
  turn = 0.75 + 1.3 * drone + 0.3 * uTone + 0.05 * sin(uTime * 0.11);
  foot[0] = ax * -1.075; foot[1] = ax * 1.075;
  head[0] = foot[0] + up * 2.42; head[1] = foot[1] + up * 2.42;
 } else {
  float tw = 0.05 + 0.5 * drone + 0.12 * uTone + 0.03 * sin(uTime * 0.09);
  vec3 dp = vec3(-1.12, 1.0, 0.0), dq = vec3(0.86, 1.0, 0.0), x0 = vec3(0.12, HC, 0.0);
  dp.xz *= rot(yaw + tw); dq.xz *= rot(yaw - tw);
  foot[0] = x0 - fz * OFF - dp * HC; head[0] = foot[0] + dp * 2.62;
  foot[1] = x0 + fz * OFF - dq * HC; head[1] = foot[1] + dq * 2.4;
  sfA0 = 0.5 * (foot[0] + head[0]); sfA1 = 0.48 * (head[0] - foot[0]); sfA2 = vec3(0.0);
  sfB0 = 0.5 * (foot[1] + head[1]); sfB1 = 0.48 * (head[1] - foot[1]); sfB2 = vec3(0.0);
 }
 // the plinth: a round drum, its rim and its side
 float slope = camY / (rd.y * rd.y + 1e-6);
 vec2 gr = 2.0 * vec2(g.x * (g.z + sfMid), (g.x * rd.x + g.z) * slope) / sfLen;
 float rim = rd.y < -0.01 ? (dot(g.xz, g.xz) - PR * PR) / max(length(gr), 1e-4) : 9.0;
 float halfW = PR * sfLen / sqrt(81.0 - PR * PR), sx = (p.x - ox) / halfW;
 float tcov = a ? smoothstep(-px, px, -rim) : 0.0, scov = a ? smoothstep(-px, px, halfW - abs(p.x - ox)) * step(p.y, shy - sfLen * camY / (sfMid - PR * PR / sfMid)) : 0.0;
 // where the threads can be, and their shadow
 vec2 wd = q.xy - (Mw * vec4(0.0, 1.42, 0.0, 1.0)).xy;
 float ex = (p.x - ox) / sfLen * sfMid;
 float n = a ? 60.0 : 56.0;
 bool onWall = a && tcov <= 0.0 && scov < 1.0;
 bool near = a ? abs(p.x - ox) < 0.28 && p.y > -0.27 && p.y < 0.4
  : ex > min(min(head[0].x, foot[1].x), foot[0].x) * 1.25 - 0.1 && ex < max(max(head[1].x, foot[0].x), foot[1].x) * 1.25 + 0.1 && p.y > -0.42 && p.y < 0.48;
 bool dim = a ? onWall && abs(wd.x) < 1.9 && wd.y > -1.65 && wd.y < 1.9 && wd.x + wd.y < 1.8 && wd.x + wd.y > -2.6 : rd.y < -0.02 && g.x > -1.8 && g.x < 3.2 && g.z < 1.2 && g.z > -6.0;
 vec2 fd = vec2(rd.x + 0.18 - 0.06 * uLow, rd.y - 0.10) * vec2(2.8, 3.4);
 vec3 fog = mix(vec3(0.31, 0.335, 0.35), vec3(0.86, 0.855, 0.83), exp(-dot(fd, fd)) * (0.86 + 0.12 * uLevel + 0.06 * uMic));
 sfHaze = a ? vec4(0.0) : vec4(fog, 0.06 + 0.07 * uSpace);
 sfS0 = sfS1 = vec4(0.0); sfT = vec2(1.0); sfShade = 0.0;
 bool sh = dim, more = dim || near;
 do {
  sfSheets(!sh ? p : a ? q.xy : g.xz, !sh ? M : a ? Mw : Mf, !sh ? px : a ? px * 4.0 : px * tg, turn, n, sh, more);
  more = sh && near; sh = false;
 } while (more);

 vec3 col = fog;
 if (a) {
  // the hoops' shadow, and the posts', on the wall or on the plinth
  float ps = 0.0;
  int k = 0; do {
   if (tcov > 0.0 ? k == 1 : dim) {
    vec4 h = sfHoop(tcov > 0.0 ? g.xz : q.xy, tcov > 0.0 ? Mf : Mw, k == 0 ? sfA0 : sfB0, k == 0 ? sfA1 : sfB1, k == 0 ? sfA2 : sfB2);
    sfShade += 1.1 * (1.0 - smoothstep(0.015, 0.085, abs(h.x)));
   }
   vec2 pc = (Mw * vec4(foot[k], 1.0)).xy, d = g.xz - foot[k].xz, ld = -normalize(sfL.xz);
   ps = max(ps, (1.0 - smoothstep(0.01, 0.07, abs(q.x - pc.x))) * (1.0 - smoothstep(-0.05, 0.05, q.y - pc.y - 2.42)) * 0.8);
   float al = dot(d, ld), ac = abs(d.x * ld.y - d.y * ld.x);
   if (tcov > 0.0) sfShade += (1.0 - smoothstep(0.015, 0.05 + 0.012 * max(al, 0.0), ac)) * smoothstep(-0.02, 0.02, al) * 2.0 + 1.2 * exp(-dot(d, d) * 90.0);
  } while (++k < 2);
  ps = max(ps, (1.0 - smoothstep(-0.12, 0.12, abs(wd.x) - PR)) * (1.0 - smoothstep(-0.12, 0.12, wd.y + 1.42)));
  // the wall in the window's light
  vec2 wq = vec2(q.x + 3.3 - 0.7 * uLow, q.y - 2.2) * vec2(0.25, 0.24);
  col = mix(vec3(0.15, 0.162, 0.17), vec3(0.45, 0.45, 0.43), exp(-dot(wq, wq))) * (0.98 + 0.1 * uLevel + 0.1 * uMic);
  col *= 0.97 + 0.06 * noise(q.xy * 3.0);
  if (onWall) col *= 1.0 - (0.5 * (1.0 - exp(-1.5 * sfShade)) * (1.0 - ps) + 0.52 * ps) * vec3(1.0, 0.96, 0.92);
  // the linen-white plinth
  vec3 N = vec3(clamp(sx, -1.0, 1.0), 0.0, -sqrt(max(1.0 - sx * sx, 0.0)));
  col = mix(col, vec3(0.62, 0.595, 0.55) * (0.96 + 0.07 * noise(vec2(sx * 45.0, p.y * 150.0))) * (sat(dot(N, sfL)) * 1.05 + 0.16 + 0.1 * sat(sx)), scov);
  vec3 t = vec3(0.74, 0.715, 0.67) * (0.83 - 0.10 * g.x + 0.05 * noise(g.xz * vec2(9.0, 30.0))) * (1.0 - 0.5 * (1.0 - exp(-1.3 * sfShade))) + 0.10 * smoothstep(-5.0 * px, -px, rim);
  col = mix(col, t, tcov);
 }
 if (!a && rd.y < -0.02) {
  // the floor, and the shadow that comes forward over it
  int k = 0; do {
   vec2 f = foot[k].xz, ab = (Mf * vec4(head[k], 1.0)).xy - f, d = g.xz - f;
   float s = sat(dot(d, ab) / max(dot(ab, ab), 1e-4));
   sfShade += 1.6 * (1.0 - smoothstep(0.02, 0.05 + 0.08 * s, length(d - ab * s)));
  } while (++k < 2);
  vec3 fl = vec3(0.62, 0.625, 0.62) * (1.0 - vec3(0.5, 0.48, 0.46) * (1.0 - exp(-1.4 * sfShade)));
  col = mix(fog, fl, exp(-max(tg - 6.5, 0.0) * 0.16));
 }
 // brass hoops
 vec4 ring[2], bar[2];
 ring[0] = ring[1] = bar[0] = bar[1] = vec4(0.0);
 int k = 0; do { if (a && near) {
   vec3 c = k == 0 ? sfA0 : sfB0, u = k == 0 ? sfA1 : sfB1, v = k == 0 ? sfA2 : sfB2;
   vec4 h = sfHoop(p, M, c, u, v);
   float w = c.z + u.z * cos(h.w) + v.z * sin(h.w) + sfMid, r = 0.036 * sfLen / w, cov = smoothstep(-px * 0.8, px * 0.8, r - abs(h.x));
   if (cov > 0.0) {
    float x = clamp(h.x / r, -1.0, 1.0), f = fract(h.w * n / TAU + 0.5) - 0.5, lp = fract(h.w / TAU);
    vec3 m = sfMetal(vec3(h.yz * x, -sqrt(1.0 - x * x)));
    m *= 1.0 - 0.7 * (1.0 - smoothstep(0.07, 0.17, length(vec2(f, x * 0.35)))); // the holes the threads go through
    // silk bound round the upper rim where the piece has a sound; the playhead is a light that goes round
    vec4 pc = k == 0 ? piece(vec2(lp, 0.3)) * 0.5 + piece(vec2(lp, 0.65)) * 0.5 : vec4(0.0);
    vec3 silk = sfDye(pc.rgb / max(pc.a, 0.03)) * (0.6 + 1.4 * sat(0.5 - 0.7 * h.y * x + 0.3 * h.z * x)) * (0.85 + 0.15 * sin(h.w * 150.0));
    m = mix(m, silk, smoothstep(0.3, 0.5, pc.a) * 0.9);
    float b = abs(fract(lp - uLoop + 0.5) - 0.5) * TAU, s = sin(h.w * 0.5 - uTime * 0.2);
    m += vec3(1.0, 0.9, 0.7) * (k == 0 ? exp(-b * b * 70.0) * 0.9 : 0.0) + vec3(1.0, 0.8, 0.5) * uCue * 0.6 * exp(-s * s * 7.0);
    ring[w < sfMid ? 1 : 0] += vec4(m, 1.0) * cov * (1.0 - ring[w < sfMid ? 1 : 0].a);
   }
 } } while (++k < 2);
 // brass posts with round heads, or dark bars wound with thread and tipped with brass
 k = 0; do {
  vec2 side; vec3 hd = M * vec4(head[k] + up * 0.03, 1.0);
  vec3 r = sfRod(p, M * vec4(foot[k], 1.0), M * vec4(head[k], 1.0), a ? 0.03 : 0.038, px, side);
  vec2 kd = (p - hd.xy / hd.z) * hd.z / (0.062 * sfLen);
  float kl = length(kd), kc = a ? smoothstep(-px, px, (1.0 - kl) * 0.062 * sfLen / hd.z) : 0.0;
  if (r.y + kc > 0.0) {
   vec3 N = kc > 0.5 ? vec3(kd, -sqrt(max(1.0 - kl * kl, 0.0))) : vec3(side * r.x, -sqrt(1.0 - r.x * r.x)), c = sfMetal(N);
   if (!a) {
    float edge = sat(dot(N, vec3(-0.62, 0.78, -0.1))), tick = abs(fract(((r.z - 0.02) / 0.96) * 55.0 + 0.5) - 0.5), cue = r.z - 1.2 * (1.0 - uCue) + 0.1;
    float at = 0.5 - 0.5 * cos(TAU * uLoop), at2 = r.z - uLoop; // the playhead is a light that climbs the bars
    vec3 w = mix(vec3(0.034, 0.032, 0.031) + 0.5 * edge * edge * edge, vec3(0.42, 0.39, 0.34) * (0.35 + edge), (1.0 - smoothstep(0.05, 0.2, tick)) * step(0.015, r.z) * step(r.z, 0.985) * 0.3);
    c = abs(r.z - 0.5) > 0.488 ? c : w;
    c = mix(c + vec3(1.0, 0.9, 0.75) * (uCue * 0.8 * exp(-cue * cue * 25.0) + 0.6 * at * exp(-at2 * at2 * 400.0)), fog, k == 0 ? 0.04 : 0.3);
   }
   bar[k] = vec4(c, max(r.y, kc));
  }
 } while (++k < 2);
 // the far half of the form, then the near half
 col = col * (1.0 - ring[0].a) + ring[0].rgb;
 col = mix(col, bar[1].rgb, bar[1].a);
 col = sfLay(sfLay(col, sfS0, sfT.x), sfS1, sfT.y);
 col = col * (1.0 - ring[1].a) + ring[1].rgb;
 col = mix(col, bar[0].rgb, bar[0].a);
 return pow(max(col, 0.0), vec3(0.4545));
}
