// name: Sea overhead
// a: Noon
// b: Long evening
// what: A plain of pale sand at noon under a ceiling that is the sea: it hangs a few storeys up, upside down, aquamarine, its slow crests pointing down and its net of light sliding over the sand, where one small figure in a red coat stands; or a long evening, teal and rose, a low sun under the sea's far edge, and a gull on a lone post.
// follows: A drone lowers the sea, lows swell it, highs ripple it. The piece lies in the water as drifts of colour that tint the sand below. Pad lights the horizon, texture blows sand, a phrase lets one swell hang low. A hit sends a drop falling up, a cue lets down a turning column; keys are droplets, a voice lights one patch of sand; the music carries the sea over.
const float soF = 0.92;
float soHz, soEye, soH, soEdge, soSwell; // the horizon on the screen, the eye over the sand, the sea over the sand, how far the sea goes, how tall its swell is
vec2 soSlide; vec3 soSun, soHit, soCol, soMan; float soB, soDeep, soTongue;
// Soft noise that comes round again far off, so that it stays sound however far the sea has gone.
float soN(vec2 p) {
  vec2 i = floor(p), f = p - i; f = f * f * (3.0 - 2.0 * f);
  vec4 c = mod(vec4(i, i + 1.0), 311.0);
  return mix(mix(hash21(c.xy), hash21(c.zy), f.x), mix(hash21(c.xw), hash21(c.zw), f.x), f.y);
}
// How far the sea hangs below its level at a place: steep crests downward, flat between, in n waves from long to short. g is its slope.
float soHang(vec2 x, int n, float fine, out vec2 g) {
  vec2 q = x + soSlide;
  float s = 0.0, k = 0.36, a = 0.95 * soSwell, an = 0.22;
  g = vec2(0.0);
  for (int i = 0; i < n; i++) {
    vec2 d = vec2(sin(an), cos(an));
    float ph = dot(d, q) * k + uTime * 0.85 * sqrt(k) + an * 3.0;
    float e = a * exp(1.35 * (sin(ph) - 1.0)), de = e * 1.35 * cos(ph);
    s += e; g += d * de * k;
    q -= d * de * 0.75;
    k *= 1.56; a *= i == 4 ? 0.6 * fine : 0.585;
    an += i % 2 == 0 ? -0.83 : 1.41;
  }
  vec2 w = (x - vec2(2.6 * sin(uTime * 0.047) - 2.0, 13.0)) / vec2(3.4, 2.1);
  float b = soDeep * exp(-dot(w, w));
  soTongue = b;
  g -= 2.0 * b * w / vec2(3.4, 2.1);
  return s + b;
}
// The net of light: bright seams between drifting cells.
float soNet(vec2 x) {
  x += 0.2 * sin(x.yx * 2.3 + uTime * vec2(0.31, -0.27)) + 0.11 * sin(x.yx * vec2(5.3, 4.7) - uTime * vec2(0.43, 0.37)) + 0.35 * sin(x.yx * 0.7 + 1.0);
  vec2 id = floor(x), f = x - id;
  float a = 9.0, b = 9.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 o = vec2(i, j), h = hash22(mod(id + o, 311.0) + 40.0), r = o + 0.5 + 0.42 * sin(uTime * (0.35 + 0.3 * h.y) + TAU * h) - f;
    float d = dot(r, r);
    if (d < a) { b = a; a = d; } else b = min(b, d);
  }
  return sqrt(b) - sqrt(a);
}
vec4 soPiece(vec2 w) {
  float s = soF * w.x / w.y / 1.7 + 0.5, v = 1.0 - log(max(w.y, 1.0) / 7.0) / log(6.5);
  float o = max(abs(s - 0.5) - 0.49, 0.0);
  return piece(vec2(clamp(s, 0.01, 0.99), clamp(v, 0.02, 0.97))) * exp(-o * o * 90.0);
}
// What is far off: the clear air under the sea.
vec3 soAir(vec3 r) {
  float y = abs(r.y), x = r.x / max(r.z, 0.1);
  vec3 c;
  if (soB < 0.5) {
    c = mix(vec3(1.9, 1.75, 1.4), vec3(0.62, 1.05, 1.12), smoothstep(0.0, 0.1, y));
    c += (vec3(0.5, 0.42, 0.2) + uKind[1] * 0.9) * uPad * exp(-y * 26.0) * (0.6 + 0.6 * exp(-x * x * 3.0));
  } else {
    float d = x + 0.42;
    c = mix(vec3(1.5, 0.62, 0.42), vec3(0.42, 0.2, 0.36), smoothstep(0.0, 0.12, y));
    c *= 0.45 + 0.8 * exp(-d * d * 2.2);
    float y2 = y - 0.03;
    c += vec3(1.9, 0.9, 0.38) * exp(-(d * d + y2 * y2 * 3.0) * 26.0);
    c += (vec3(0.5, 0.22, 0.12) + uKind[1] * 0.7) * uPad * exp(-y * 22.0);
  }
  return c;
}
vec3 soSand(float l) { return soB < 0.5 ? vec3(0.92, 0.81, 0.63) * l : vec3(0.42, 0.31, 0.33) * l; }
vec3 soEnv(vec3 r) {
  vec3 air = soAir(r);
  if (r.y > 0.0) return air * 0.6;
  float t = 6.0 / max(-r.y, 0.02);
  return mix(air, soSand(soB < 0.5 ? 1.05 : 0.6), exp(-t * 0.012) * smoothstep(0.0, 0.12, -r.y));
}
vec3 soSea(vec3 ro, vec3 rd, float px, out float cover) {
  float top = soH - 0.02, low = soH - 1.75 * soSwell - soDeep;
  float t0 = (low - ro.y) / rd.y, t1 = (top - ro.y) / rd.y;
  cover = 0.0;
  if (t0 > soEdge) return vec3(0.0);
  t0 = max(t0, 2.5);
  vec2 g;
  float t = t0, d = 0.0, pt = t0, pd = low - soH;
  for (int i = 0; i < 20; i++) {
    vec3 q = ro + rd * t;
    d = q.y - soH + soHang(q.xz, 3, 1.0, g) + 0.06 * soSwell;
    if (d > 0.0 || t > t1) break;
    pt = t; pd = d;
    t += max(-d / (rd.y + 0.7), 0.004 * t);
  }
  if (d > 0.0) t = mix(pt, t, sat(pd / min(pd - d, -1e-4)));
  t = min(t, t1);
  vec3 q = ro + rd * t;
  // where the sea ends, far off
  float lip = soEdge + 1.6 * sin(q.x * 0.31 + uTime * 0.11) + 0.9 * sin(q.x * 0.83 - uTime * 0.15);
  cover = smoothstep(0.0, 1.0, (lip - q.z) / (0.2 + px * q.z * q.z / soH * 1.2));
  if (cover <= 0.0) return vec3(0.0);
  float hang = soHang(q.xz, 9, (mix(0.4, 0.75, soB) + 1.1 * uHigh) / (1.0 + 0.0025 * t * t) * (0.3 + 1.6 * smoothstep(0.25, 0.8, soN(q.xz * 0.19 - soSlide * 0.2 + uTime * 0.02))), g);
  float far = 1.0 / (1.0 + 0.0011 * t * t), bare = hang - soTongue;
  g *= mix(0.5, 1.0, far);
  // the ring a drop or the column leaves in it
  float glow = 0.0;
  for (int i = 0; i < 2; i++) {
    float on = i == 0 ? uHits : uCue;
    vec2 w = q.xz - (i == 0 ? soHit : soCol).xz;
    float r = length(w) + 1e-3, e = r - (i == 0 ? 3.2 : 5.5) * (1.0 - on) - 0.3;
    glow += on * exp(-r * r * (i == 0 ? 0.16 : 0.07));
    g += w / r * 0.6 * on * sin(e * 3.4) * exp(-e * e * 1.2);
  }
  // a face turned away from us is eased round until it can just be seen
  vec2 to = rd.xz / length(rd.xz);
  float sl = dot(g, to), lim = 0.6 * rd.y / length(rd.xz) + 0.01;
  if (sl < 0.0) g += to * (sl / sqrt(1.0 + sl * sl / (lim * lim)) - sl);
  vec3 n = -normalize(vec3(g.x, 1.0, g.y));
  float cv = sat(-dot(rd, n)), m = 1.0 - max(cv, 0.15 * (1.0 - far));
  float fr = 0.02 + 0.98 * m * m * m * m * m;
  vec3 rt = refract(rd, n, 0.75), rf = reflect(rd, n);
  float s = sat(dot(rt, soSun)), s2 = s * s, s8 = s2 * s2 * s2 * s2, s32 = s8 * s8 * s8 * s8;
  float tip = smoothstep(0.35, 1.5, bare / soSwell + 0.25 * soTongue);
  vec3 c;
  vec4 pc = soPiece(q.xz + g * 2.0);
  vec3 kc = pc.rgb / max(pc.a, 0.02);
  if (soB < 0.5) {
    c = mix(vec3(0.0, 0.11, 0.15), vec3(0.06, 0.55, 0.55), s8);
    c += vec3(0.75, 1.0, 0.8) * s32 * 0.7 + vec3(1.6, 1.6, 1.3) * s32 * s32 * s32 * s32;
    c += vec3(0.05, 0.42, 0.33) * tip * (0.35 + 0.65 * m);
  } else {
    c = mix(vec3(0.006, 0.038, 0.06), vec3(0.05, 0.19, 0.235), s8);
    // the low light goes through the thin crests, and glances off every facet that leans to it
    float th = sat(dot(n, vec3(0.5, -0.1, -0.86)) * 1.9 - 0.1); th = th * th + 0.08;
    float thin = smoothstep(0.85, 1.75, bare / soSwell + 0.45 * soTongue);
    c += vec3(2.6, 0.62, 0.36) * thin * th * m * m;
    float gl = sat(dot(rf, vec3(-0.42, -0.02, 0.907))), g4 = gl * gl * gl * gl, g16 = g4 * g4 * g4 * g4;
    c += vec3(1.3, 0.5, 0.34) * (0.1 * g4 * g4 + 2.2 * g16 * g16) * (0.15 + m);
    c += vec3(0.03, 0.2, 0.19) * tip * (0.3 + 0.7 * m);
  }
  // the piece, as drifts of colour in the water
  float pw = sat(pc.a * 1.3) * (0.55 + 0.45 * soN(q.xz * 0.3 + soSlide * 0.3));
  c = mix(c, c * (0.45 + 1.1 * kc) + kc * kc * (0.2 + 0.6 * uEnergy), 0.85 * pw);
  c += (soB < 0.5 ? vec3(0.45, 0.8, 0.65) : vec3(0.7, 0.3, 0.22)) * (0.4 + uKind[4]) * glow * 0.7;
  c = mix(c, soEnv(rf), fr);
  // foam on the hanging crests
  float fz = smoothstep(0.75, 1.35, bare / soSwell) * far;
  if (fz > 0.01) {
    vec2 u = q.xz + soSlide + g * 0.7;
    u += 0.17 * sin(u.yx * vec2(2.3, 2.9) + 1.0) + 0.07 * sin(u.yx * vec2(6.1, 5.3));
    float fo = soN(rot(1.1) * u * 3.8) * 0.5 + soN(rot(0.5) * u * 9.0 + 7.0) * 0.5, wide = 4.2 * px * t / max(cv, 0.05);
    float lace = mix((1.0 - smoothstep(0.0, 0.07, abs(fo - 0.5))) * 0.6 + 0.15 * smoothstep(0.46, 0.75, fo), 0.26, smoothstep(0.1, 0.5, wide));
    c = mix(c, soB < 0.5 ? vec3(1.4, 1.45, 1.3) : vec3(1.3, 0.66, 0.52), fz * lace * smoothstep(0.25, 0.65, soN(u * 0.8)) * (soB < 0.5 ? 0.6 : 0.34));
  }
  // the lip, where it thins to nothing and the light comes through; the bands run along it
  float el = exp(-(lip - q.z) * 0.22);
  c += (soB < 0.5 ? vec3(0.5, 1.0, 0.85) : vec3(1.6, 0.7, 0.4)) * el * (0.15 + 0.7 * band(0.5 + soF * rd.x / rd.z / 1.75));
  return mix(c, soAir(vec3(rd.x, clamp(rd.y, 0.04, 0.3), rd.z)), 1.0 - exp(-t * mix(0.006, 0.014, uSpace)));
}
float soCap(vec2 q, vec2 a, vec2 b, float ra, float rb) {
  vec2 d = b - a; float h = sat(dot(q - a, d) / dot(d, d));
  return length(q - a - d * h) - mix(ra, rb, h);
}
vec3 soFloor(vec3 ro, vec3 rd, float px) {
  float t = ro.y / max(-rd.y, 1e-3);
  vec3 q = ro + rd * t;
  vec2 x = q.xz;
  float fz = px * t * t / ro.y;
  // low ripples the wind has left, and the grain
  float u = x.y * 5.2 + 1.6 * soN(x * 0.7) + x.x * 0.8 + 0.8 * soN(x * 2.3);
  float rip = sin(u) * exp(-fz * 5.0), gr = (soN(x * 60.0) - 0.5) * exp(-fz * 60.0) + (soN(x * 9.0) - 0.5) * exp(-fz * 9.0);
  float big = soN(x * 0.22 + 3.0) * 0.6 + soN(x * vec2(0.6, 0.9)) * 0.4;
  vec3 c;
  vec2 k = (x + soSlide * 0.35 + vec2(0.0, rip * 0.03)) * (soB < 0.5 ? vec2(0.85, 0.8) : vec2(0.5, 0.8));
  float nt = soNet(k);
  float wd = soN(k * 1.9 + uTime * 0.11);
  float net = 1.15 * exp(-nt / (mix(0.12, 0.06, uTone) * (0.35 + 1.5 * wd))) * (0.35 + 0.9 * wd) + 0.6 * exp(-nt * 3.4);
  net = mix(0.38, net, exp(-fz * 2.6));
  net *= 0.15 + 1.5 * smoothstep(0.1, 0.9, soN(x * 0.3 + soSlide * 0.4 + uTime * 0.02));
  vec4 pc = soPiece(x);
  vec3 kc = pc.rgb / max(pc.a, 0.02);
  float pw = sat(pc.a * 1.3);
  float tex = 1.0 + (0.25 + 1.2 * uTexture) * gr * 0.5;
  if (soB < 0.5) {
    vec3 li = vec3(0.66, 0.65, 0.58) + vec3(1.9, 1.75, 1.3) * net;
    li = mix(li, li * (0.3 + 1.1 * kc) + kc * net * 0.7, 0.85 * pw);
    c = soSand(1.0) * (0.88 + 0.24 * big) * (1.0 + 0.1 * rip) * tex * li;
  } else {
    float lo = x.x / max(x.y, 1.0) + 0.42, rake = 0.35 + 1.1 * exp(-lo * lo * 2.5);
    vec3 li = vec3(0.11, 0.12, 0.22) + vec3(1.75, 0.68, 0.38) * sat(0.5 + 0.6 * rip) * smoothstep(0.15, 0.85, big) * rake + vec3(0.7, 0.42, 0.38) * net * 0.6;
    li = mix(li, li * (0.4 + 1.1 * kc) + kc * (0.15 + net * 0.5), 0.75 * pw);
    c = soSand(1.0) * tex * li;
  }
  // the shadow at the foot of what stands, the light a voice brings there, the ring a drop leaves
  vec2 m = x - soMan.xz;
  float sd = soB < 0.5 ? soCap(m, vec2(0.0), vec2(-1.9, -1.5), 0.34, 0.24) : soCap(m, vec2(0.0), vec2(5.4, -11.0), 0.13, 0.26);
  c *= 1.0 - 0.8 * (1.0 - smoothstep(-0.1 - fz * 0.2, 0.12 + fz * 0.5, sd)) * (soB < 0.5 ? 1.0 : exp(-length(m) * 0.06));
  c += (soB < 0.5 ? vec3(1.1, 0.9, 0.5) : vec3(1.2, 0.6, 0.3)) * uMic * 1.1 * exp(-dot(m, m) * 0.06);
  for (int i = 0; i < 2; i++) {
    float on = i == 0 ? uHits : uCue, r = length(x - (i == 0 ? soHit : soCol).xz), e = (r - (i == 0 ? 2.2 : 3.6) * (1.0 - on) - 0.35) / (0.16 + fz * 0.5);
    c *= 1.0 + on * (0.8 * exp(-e * e) + 0.55 * exp(-r * r * 0.16));
  }
  return mix(c, soAir(vec3(rd.x, 0.0, rd.z)), 1.0 - exp(-t * mix(0.012, 0.02, uSpace)));
}
// A round drop of sea, rising.
vec3 soDrop(vec3 c, vec2 p, vec3 w, float r, float on, vec3 tint) {
  float k = soF / w.z, rad = r * k;
  vec2 q = (p - vec2(w.x * k, (w.y - soEye) * k + soHz)) / rad;
  q.y *= 0.88;
  float d = length(q), aa = 1.0 / (rad * uRes.y);
  float m = (1.0 - smoothstep(1.0 - aa, 1.0 + aa, d)) * on;
  if (m <= 0.0) return c;
  // seen through it the world stands on its head: sand above, sea below
  vec3 up = soB < 0.5 ? vec3(0.1, 0.55, 0.55) : vec3(0.1, 0.12, 0.2), dn = soB < 0.5 ? vec3(1.9, 1.8, 1.45) : vec3(1.6, 0.75, 0.48);
  float bow = q.y + 0.45 * q.x * q.x * sign(q.y), dd = d * d;
  vec3 b = mix(up, dn * 0.75, smoothstep(-0.35, 0.8, bow)) * (1.0 - 0.6 * dd * dd * dd) * (0.4 + tint);
  b += dn * (1.2 * (1.0 - smoothstep(0.06, 0.2, length(q - vec2(-0.34, 0.42)))) + 0.7 * smoothstep(0.5, 0.85, d) * (1.0 - smoothstep(0.85, 0.98, d)) * (1.0 - smoothstep(-0.9, 0.3, q.y)));
  return mix(c, b, m * (0.5 + 0.5 * dd * d));
}
// The one who stands there (a) or the old post with its gull (b), in metres from its foot.
float soBody(vec2 q) {
  if (soB < 0.5) {
    float d = min(soCap(q, vec2(-0.1, 0.05), vec2(-0.06, 0.7), 0.06, 0.1), soCap(q, vec2(0.11, 0.05), vec2(0.06, 0.7), 0.06, 0.1));
    d = min(d, soCap(q, vec2(0.0, 0.62), vec2(0.0, 1.34), 0.27, 0.17));
    return min(d, length((q - vec2(0.01, 1.64)) * vec2(1.15, 1.0)) - 0.125);
  }
  q.x -= q.y * 0.05;
  float d = soCap(q, vec2(0.0), vec2(0.0, 3.46), 0.14, 0.11);
  q -= vec2(0.02, 3.5);
  d = min(d, soCap(q, vec2(-0.13, 0.22), vec2(0.15, 0.17), 0.13, 0.07));
  d = min(d, soCap(q, vec2(0.15, 0.17), vec2(0.36, 0.1), 0.06, 0.02));
  d = min(d, soCap(q, vec2(-0.2, 0.42), vec2(-0.16, 0.3), 0.085, 0.07));
  return min(d, soCap(q, vec2(-0.22, 0.42), vec2(-0.38, 0.39), 0.03, 0.005));
}
vec3 render(vec2 p) {
  soB = step(0.5, uVar);
  float px = 1.0 / (uRes.y * soF);
  float breath = 0.12 * sin(uTime * 0.19);
  soHz = soB < 0.5 ? -0.17 : -0.22; soEye = soB < 0.5 ? 1.75 : 1.6;
  soH = (soB < 0.5 ? 7.6 : 6.4) - 1.1 * uDrone + breath;
  soEdge = soB < 0.5 ? 78.0 : 56.0;
  soSwell = (soB < 0.5 ? 0.8 : 1.0) * (0.8 + 0.6 * uLow);
  soDeep = uPhrase * min(2.2, 0.8 * (soH - soEye - 1.5 * soSwell - 0.3));
  soSlide = vec2(0.10, 0.06) * uTravel;
  soSun = normalize(vec3(0.2, 0.86, 0.5));
  soHit = vec3(0.6 + 1.3 * sin(uTime * 0.11), 0.3, 9.5);
  soHit.y = mix(0.3, soH - 0.8, (1.0 - uHits) * (1.0 - 0.25 * uHits));
  soCol = vec3(-3.0, 0.0, 12.5);
  soMan = soB < 0.5 ? vec3(4.3, 0.0, 19.0) : vec3(3.7, 0.0, 14.0);
  vec3 ro = vec3(0.0, soEye, 0.0), rd = normalize(vec3(p.x, p.y - soHz, soF));
  vec3 c;
  if (rd.y > 0.0) {
    float cov;
    vec3 s = soSea(ro, rd, px, cov);
    vec3 air = soAir(rd);
    // the sun itself, low under the sea's edge
    vec2 sd = rd.xy / rd.z + vec2(0.42, -0.034);
    if (soB > 0.5) air += vec3(3.0, 1.9, 0.9) * smoothstep(-px, px, 0.026 - length(sd));
    c = mix(air, s, cov);
  } else c = soFloor(ro, rd, px);
  // sand blown in veils low over the plain
  float yy = p.y - soHz;
  if (uTexture > 0.01 && yy < 0.06) {
    float st = soN(vec2(p.x * 2.6 - uTime * 0.16, yy * 34.0 + 2.0 * soN(vec2(p.x * 1.7 - uTime * 0.07, 3.0)))) * 0.6 + 0.4 * soN(vec2(p.x * 7.0 - uTime * 0.4, yy * 90.0));
    float ve = uTexture * smoothstep(0.3, 0.8, st) * exp(-max(yy, 0.0) * 55.0) * (1.0 - smoothstep(0.02, 0.06, yy)) * exp(-max(-yy - 0.03, 0.0) * 9.0);
    c = mix(c, (soB < 0.5 ? vec3(1.9, 1.7, 1.3) : vec3(1.4, 0.65, 0.45)) * (0.5 + 0.8 * uKind[2]), 0.85 * ve);
  }
  // the one far thing that stands
  float mk = soF / soMan.z;
  vec2 mq = (p - vec2(soMan.x * mk, soHz - soEye * mk)) / mk;
  float md = soBody(mq) * mk * uRes.y;
  vec3 coat = soB < 0.5 ? mix(vec3(0.035, 0.05, 0.06), vec3(0.3, 0.07, 0.05), smoothstep(0.55, 0.65, mq.y) * (1.0 - smoothstep(1.4, 1.5, mq.y))) : vec3(0.05, 0.03, 0.05);
  c = mix(c, coat, (1.0 - smoothstep(-0.7, 0.7, md)));
  // the cue's column of sea, let down turning
  float ext = 4.0 * uCue * (1.0 - uCue);
  if (ext > 0.004) {
    float ck = soF / soCol.z, Y = (p.y - soHz) / ck + soEye, top = soH - 0.5, tip = mix(top, 0.3, ext);
    float h = sat((Y - tip) / max(top - tip, 0.01)), hh = h * h;
    float X = p.x / ck - soCol.x - 0.16 * sin(Y * 1.7 - uTime * 2.1) * (1.0 - h), R = (0.06 + 0.34 * h + 1.5 * hh * hh * h) * sqrt(ext) + 0.01;
    float u = X / R, aa = 1.0 / (R * ck * uRes.y), m = smoothstep(-aa, aa, 1.0 - abs(u)) * smoothstep(tip - 0.05, tip + 0.05, Y) * (1.0 - smoothstep(top - 0.9, top + 0.3, Y));
    if (m > 0.0) {
      float as = asin(clamp(u, -1.0, 1.0)), tw = 0.5 + 0.5 * sin(as * 2.0 + Y * 3.2 - uTime * 4.0), rim = u * u * u * u;
      vec3 w = soB < 0.5 ? mix(vec3(0.02, 0.3, 0.34), vec3(0.4, 0.95, 0.85), tw) : mix(vec3(0.06, 0.07, 0.12), vec3(0.95, 0.42, 0.33), tw * (0.6 - 0.4 * u));
      w += (soB < 0.5 ? vec3(1.2, 1.3, 1.1) : vec3(1.0, 0.5, 0.4)) * (0.5 * rim + pow(tw, 12.0) * 0.5);
      c = mix(c, w, m * (0.62 + 0.35 * rim));
    }
  }
  // what falls up
  if (uHits > 0.01) c = soDrop(c, p, soHit, 0.3, smoothstep(0.02, 0.12, uHits), 0.5 + uKind[4]);
  if (uKeys > 0.01) for (int i = 0; i < 6; i++) {
    float fi = float(i), f = fract(uTime * (0.14 + 0.03 * hash11(fi)) + hash11(fi + 7.0));
    c = soDrop(c, p, vec3((hash11(fi + 3.0) - 0.5) * 11.0, f * f * soH, 10.0 + 4.0 * hash11(fi + 5.0)), 0.2 + 0.1 * hash11(fi + 9.0), sat(2.0 * uKeys) * smoothstep(0.0, 0.1, f) * (1.0 - smoothstep(0.8, 0.97, f)), vec3(1.0));
  }
  return screenOf(c * (0.85 + 0.3 * uTone));
}
