// name: Drip cave
// a: Straw ceiling
// b: Backlit drapery
// what: A low pale cave hung with hundreds of thin white straws of stone, each with a drop at its tip, all doubled in a pool so still that only a thread of light parts roof from mirror, a lamp burning behind the columns; or one folded sheet of stone lit from behind, banded cream, rust and amber, its toothed hem tipped with drops.
// follows: Each straw has its place in the piece and its drop swells and shines with what sounds there. Each kind is a lamp among the columns, or a band of the sheet. Lows and the mix widen the light; in the sheet the spectrum fills the drops. A hit lets a drop fall and a ring open, or light run to the hem; a cue swings the lamp and every shadow. Keys glint.
// own: 0 1 a thicket of fine straws (b: many tight folds), -1 few great ones (b: hardly folded); 1 1 icicles broad at the root (b: the hem drawn out in long teeth), -1 roots that wander (b: no bands, long runs downward); 2 1 pale daylight from the far end (b: behind the sheet), -1 no lamp, the drops shine of themselves (b: lit from the front only); 3 1 a dry floor (b: cut in ribbons), -1 ruffled water (b: parted in the middle); 4 1 ice, -1 stone dyed in the colour of the pad and lit in that of the drone; 5 1 looking up (b: the sheet falls out of the picture), -1 looking down into the pool (b: a short hem high up); 6 1 many columns (b: few broad bands), -1 none (b: hair thin bands); 7 1 mist, -1 the straws are strings of beads (b: the sheet is seen only as rows of dots)
const float dcH = 0.62;            // the eye over the pool
vec3 dcPos[6], dcCol[6];           // the lamps: one that always burns, and one for each kind of sound
float dcPx, dcCue;                 // a pixel; the swing of a cue, 0 up and back to 0

vec3 dcStone(vec3 was, float t) {
  if (uOwn[4] > 0.0) return mix(was, mix(vec3(0.08, 0.26, 0.42), vec3(0.78, 0.94, 1.0), t), uOwn[4]);
  if (uOwn[4] < 0.0) return mix(was, uKind[1] * mix(0.35 * uKind[1], vec3(1.0), t), -uOwn[4]);
  return was;
}
vec3 dcLampHue(vec3 was) { return uOwn[4] > 0.0 ? mix(was, vec3(0.72, 0.88, 1.0), uOwn[4]) : uOwn[4] < 0.0 ? mix(was, uKind[0] * uKind[0] * 1.25, -uOwn[4]) : was; }
vec3 dcDay() { return mix(vec3(0.95, 0.98, 1.0), uKind[2] * uKind[2] * 1.3, 0.8) * (0.75 + 0.35 * uLevel + 0.25 * uCue); }
void dcSet() {
  dcPx = 1.0 / uRes.y;
  dcCue = 4.0 * uCue * (1.0 - uCue);
  float reach = 0.7 + 0.2 * uLevel + 0.4 * uLow;
  dcPos[0] = vec3(2.3 + 0.35 * sin(uTime * 0.031) - 1.5 * dcCue, 0.9, 7.6);
  dcCol[0] = dcLampHue(vec3(1.0, 0.68, 0.34)) * (2.6 + 1.3 * reach + 1.0 * uCue) * (1.0 - 0.94 * max(-uOwn[2], 0.0)) * (1.0 - 0.5 * max(uOwn[2], 0.0));
  dcPos[1] = vec3(-3.6, 0.7, 7.8); dcPos[2] = vec3(4.4, 0.6, 5.4); dcPos[3] = vec3(-1.1, 0.9, 9.4); dcPos[4] = vec3(-2.1, 1.0, 4.3);
  dcPos[5] = vec3((uLoop - 0.5) * 4.0, 0.5, 4.0);
  float g = (0.4 + uEnergy) * reach * 1.3 * (1.0 - 0.75 * max(-uOwn[2], 0.0) * (1.0 - uVar));
  vec3 w = vec3(0.35, 0.28, 0.19);
  for (int i = 1; i < 6; i++) dcCol[i] = (w + 0.65 * uKind[i - 1]) * (0.5 + 0.6 * uKind[i - 1]) * g;
  dcCol[1] *= uDrone; dcCol[2] *= uPad; dcCol[3] *= uTexture; dcCol[4] *= uPhrase; dcCol[5] *= uHits * 0.4;
}
// The light that falls on a place: the lamp, and what the five give in that direction.
vec3 dcLight(vec3 w, vec3 five) {
  vec3 d = dcPos[0] - w;
  float z = w.z - 6.0;
  return dcCol[0] / (0.4 + dot(d, d)) + five / (1.0 + 0.08 * z * z);
}
float dcRoof(float x, float z) { return 1.95 + 0.17 * sin(x * 0.8 + 1.0 + z * 0.45) + 0.07 * sin(x * 2.1 - z * 0.9); }
vec2 dcRing(vec2 w, vec2 c, float far, float s) {
  vec2 d = w - c;
  float r = length(d) + 0.001, x = (r - far) * 8.0;
  return d / r * cos(x * 2.0) * exp(-x * x * 0.12) * s;
}
// What one lamp puts into the air where it is seen, or where its double is in the pool, and how much it lights there.
vec3 dcAir, dcFive;
void dcLamp(vec2 q, float cam, float zw, vec3 L, vec3 c) {
  vec2 d = q - vec2((L.x - cam) / L.z, ((zw < L.z ? -L.y : L.y) - dcH) / L.z);
  float r2 = dot(d, d);
  dcAir += c * (0.0009 / (0.005 + r2) + 0.0016 / (0.06 + r2));
  dcFive += c / (2.0 + 40.0 * r2);
}
vec3 dcSide(vec3 L, vec3 c, vec3 w, vec3 n) {
  vec3 d = L - w;
  float d2 = dot(d, d);
  return c / (0.4 + d2) * sat(0.08 + dot(n, d) * inversesqrt(d2 + 0.01));
}
vec3 dcCave(vec2 p) {
  float u0 = p.x, v0 = p.y + 0.07 + 0.3 * uOwn[5], t = uTime;
  float day = max(uOwn[2], 0.0), glowing = max(-uOwn[2], 0.0), dry = max(uOwn[3], 0.0), ice = max(uOwn[4], 0.0), mist = max(uOwn[7], 0.0), cone = max(uOwn[1], 0.0), root = max(-uOwn[1], 0.0), great = max(-uOwn[0], 0.0);
  bool wide = great + cone + root > 0.0;
  vec3 haze = vec3(0.0);
  if (mist + day > 0.0) haze = (0.55 * day + 0.3 * mist) * dcDay() * (0.7 + 0.5 * exp(-v0 * v0 * 9.0)) * (1.0 - glowing * 0.8);
  float cam = 0.2 * sin(t * 0.019);
  float zw = v0 < -0.001 ? dcH / -v0 : 1e3;
  float age = 1.0 - uHits, xf = (uLoop - 0.5) * 1.3;
  vec2 bend = vec2(0.0);
  if (zw < 12.0) {
    vec2 w = vec2(u0 * zw, zw);
    float ca = 1.0 - uCue;
    bend = dcRing(w, vec2(xf * 2.9, 2.9), 1.5 * max(age - 0.15, 0.0), 0.16 * uHits * smoothstep(0.1, 0.3, age));
    bend += dcRing(w, vec2(0.9, 4.0), 0.2 + 2.6 * ca, uCue * ca * 0.12);
    float n = t / 9.3, f = fract(n), k = mod(floor(n), 61.0);
    bend += dcRing(w, vec2((hash11(k) - 0.5) * 4.0, 2.4 + 3.0 * hash11(k + 9.0)), 0.05 + 2.2 * f, 0.025 * sat(uLevel * 3.0) * (1.0 - f) * (1.0 - f) * sat(f * 12.0));
  }
  if (uOwn[3] < 0.0 && zw < 12.0) {
    vec2 w = vec2(u0 * zw, zw);
    bend -= uOwn[3] * (vec2(noise(w * vec2(1.4, 5.0) + vec2(90.0 + 0.5 * t, 50.0)), noise(w * vec2(1.1, 4.0) + vec2(30.0, 80.0 - 0.6 * t))) - 0.5) * vec2(0.07, 0.17);
  }
  float crest = length(bend);
  dcAir = dcFive = vec3(0.0);
  vec2 q0 = vec2(u0, v0) - bend;
  dcLamp(q0, cam, zw, dcPos[1], dcCol[1]); dcLamp(q0, cam, zw, dcPos[2], dcCol[2]); dcLamp(q0, cam, zw, dcPos[3], dcCol[3]);
  dcLamp(q0, cam, zw, dcPos[4], dcCol[4]); dcLamp(q0, cam, zw, dcPos[5], dcCol[5]);
  vec3 five = dcFive;
  dcLamp(q0, cam, zw, dcPos[0], dcCol[0]);
  vec3 air = dcAir + haze;
  vec3 col = vec3(0.0);
  float T = 1.0, z = 1.25;
  for (int k = 0; k < 8; k++, z *= 1.32) {
    float fk = float(k);
    bool wet = z > zw;
    float u = wet ? u0 + bend.x : u0, v = wet ? v0 + bend.y : v0;
    float sx = u + cam / z, X = sx * z, Y = abs(dcH + v * z);
    float tint = wet ? 0.7 : 1.0, fog = z * 0.012 * (1.0 + uSpace);
    if (mist + day > 0.0) fog = 1.0 - (1.0 - fog) * exp(-z * z * (0.04 * mist + 0.006 * day));
    if (dry > 0.0 && wet && zw > z / 1.33) {
      vec2 w = vec2(u0 * zw + cam, zw);
      float g = mix(0.4 * noise(w * 2.6 + 40.0) + 0.3 * noise(w * vec2(24.0, 18.0)) + 0.3 * noise(w * 70.0), 0.5, sat(zw * 0.08));
      vec3 c = (dcLight(vec3(w.x, 0.0, zw), five) * 1.3 + haze * 0.35) * dcStone(mix(vec3(0.4, 0.28, 0.17), vec3(0.9, 0.78, 0.6), g), g) * (0.25 + 0.9 * g);
      col += T * dry * (air + 0.03) * crest * 4.0;
      col += T * dry * mix(c, air, mist + day > 0.0 ? 1.0 - exp(-zw * zw * (0.04 * mist + 0.006 * day)) : 0.0);
      T *= 1.0 - dry;
    }
    float roof = dcRoof(X, z);
    // the roof closes off this depth: pale stone, and on it the straws' long shadows, away from the lamp
    if (Y > roof) {
      float zc = 1.0, rf = 1.95;
      for (int i = 0; i < 2; i++) { zc = clamp(wet ? (rf + dcH) / max(-v, 0.02) : (rf - dcH) / max(v, 0.02), 0.5, 11.0); rf = dcRoof(u * zc + cam, zc); }
      float Xc = u * zc + cam;
      float bump = mix(noise(vec2(Xc, zc) * 3.1) * 0.6 + mix(noise(vec2(Xc, zc) * 23.0), 0.5, sat(zc * 0.14)) * 0.5, 0.5, zc * 0.06);
      vec2 d = vec2(Xc, zc) - dcPos[0].xz;
      float streak = 0.35 + 0.65 * smoothstep(0.2, 0.7, noise(vec2(atan(d.x, max(-d.y, 0.05)) * 15.0, length(d) * 0.4)));
      vec3 c = dcLight(vec3(Xc, rf - 0.3, zc), five) * streak * smoothstep(0.15, 0.85, bump) * dcStone(mix(vec3(0.42, 0.25, 0.13), vec3(0.85, 0.75, 0.6), bump), bump) * 0.7;
      if (mist + day > 0.0) c = mix(c + haze * 0.5 * bump * dcStone(vec3(0.5, 0.42, 0.34), bump), air, 1.0 - exp(-zc * zc * (0.05 * mist + 0.008 * day)));
      col += T * tint * (c + vec3(0.005, 0.007, 0.010) * bump + air * zc * 0.012);
      T = 0.0;
    }
    if (T <= 0.0) break;
    float cs = (k < 2 ? 0.14 : k < 5 ? 0.095 : 0.066) / z * exp2(-(uOwn[0] > 0.0 ? 1.1 : 2.0) * uOwn[0]), id = floor(sx / cs);
    float h = hash21(vec2(id, fk + 3.0)), h2 = fract(h * 91.7 + id * 0.618);
    float cx = (id + 0.25 + 0.5 * h2) * cs, zs = z * (1.0 + 0.18 * fract(h * 17.3)), Xs = cx * z;
    float clump = 0.5 + 0.5 * sin(Xs * 1.7 + fk * 2.3);
    float Ys = abs(dcH + v * zs);
    float len = min((0.08 + 1.1 * h2 * h2 * h2 + 0.4 * fract(h * 41.0)) * (0.35 + clump) * (1.0 + 0.35 * great + 0.3 * cone + 0.5 * root), 1.75);
    float up = Ys - roof + len;
    if (root > 0.0) cx += root * cs * (0.2 * sin(up * 6.0 + h * 40.0) + 0.08 * sin(up * 17.0 + h2 * 50.0));
    if (h < (k < 2 ? 0.3 : 0.55) + 0.45 * clump && up > -0.1 && Ys < roof && (wide || abs(sx - cx) * z < (up < 0.09 ? 0.034 : 0.011 + dcPx * z))) {
      vec4 pc = piece(vec2(0.5 + (cx - cam / z) / 1.78, 1.0 - fk / 7.0));
      float loud = sat(pc.a);
      float dx = sx - cx, gr = fract(t / (26.0 + 30.0 * h2) + h * 5.0);
      float w = (0.0042 + 0.0035 * fract(h2 * 9.7) + 0.003 * exp((Ys - roof) * 5.0)) / zs, we = max(w, 0.5 * dcPx);
      if (wide) { // never broader than its place
        float room = cs * (0.5 - abs(0.5 * h2 - 0.25)) - root * 0.15 * cs;
        w = w * (1.0 + 3.5 * great + root * (3.0 * sat(up * 1.4) * (0.75 + 0.5 * noise(vec2(h * 90.0, up * 7.0))) - 0.5)) + (cone * (0.11 + 0.15 * great) * sat(up) * (0.4 + 0.6 * h2) * (1.0 + 0.07 * sin(up * 40.0 + h * 30.0)) + 0.05 * great * sat(up)) / zs;
        w = min(w, max(room, dcPx)); we = max(w, 0.5 * dcPx);
      }
      float cov = sat((we - abs(dx)) / dcPx + 0.5) * (w / we) * smoothstep(-0.5, 0.5, up / (dcPx * zs)) * smoothstep(0.0, 0.1, roof - Ys);
      float R = (0.008 + 0.005 * gr * (1.0 - smoothstep(0.97, 1.0, gr)) + 0.010 * loud) / zs * (1.0 + 0.7 * great) * (1.0 - 0.7 * root * (1.0 - glowing)), Re = max(R, 0.6 * dcPx);
      vec2 q = vec2(dx, up / zs + R * 0.7) / Re;
      float dd = length(q * vec2(1.0, q.y > 0.0 ? 0.75 : 1.0));
      float cd = sat((1.0 - dd) * Re / dcPx + 0.5);
      if (uOwn[7] < 0.0) {
        float gap = 0.05 / zs, b = (fract(max(up, 0.0) * 20.0) - 0.5) * gap, rb = min(max((0.009 + 0.008 * h2) * (1.0 + 2.0 * great) / zs, 0.7 * dcPx), 0.4 * gap), db = length(vec2(dx, b));
        cov = mix(cov, sat((rb - db) / dcPx + 0.5) * smoothstep(-0.01, 0.01, up) * smoothstep(0.0, 0.1, roof - Ys), -uOwn[7]);
        we = mix(we, max(rb, we), -uOwn[7]);
      }
      vec3 li = vec3(0.0);
      if (cov + cd > 0.004) li = dcLight(vec3(Xs, Ys, zs), five);
      float s_ = clamp(dx / we, -1.0, 1.0);
      if (cov > 0.004) {
        float s = s_;
        float body = (0.4 + 1.0 * s * s + 0.5 * sign(dcPos[0].x - Xs) * s) * (0.85 + 0.2 * (wide ? 2.4 * noise(vec2(s * 2.2 + h * 90.0, Ys * 5.0 + h * 30.0)) - 1.4 : sin(Ys * 70.0 + h * 40.0)));
        vec3 stone = mix(vec3(1.0, 0.95, 0.86), vec3(0.85, 0.5, 0.25), smoothstep(0.6, 1.0, fract(h * 7.7)) * 0.7);
        stone = dcStone(mix(stone, stone * vec3(0.42, 0.28, 0.18), root), 0.55 + 0.45 * fract(h * 7.7));
        if (day > 0.0) li += haze * (0.05 + 0.75 * s * s);
        vec3 c = stone * (li * body * 1.8 + vec3(0.024, 0.031, 0.040) * (0.3 + 1.2 * s * s)) + pc.rgb * exp(-max(up, 0.0) * 7.0) * 0.35 * (0.4 + uEnergy);
        col += T * cov * tint * mix(c, air, fog);
        T *= 1.0 - cov * (1.0 - 0.55 * ice * (1.0 - s_ * s_));
      }
      // the drop at its tip, and the light it gathers
      if (dd < 4.0) {
        vec3 glow = mix(vec3(1.0), pc.rgb / max(pc.a, 0.05), 0.7) * (0.4 + uEnergy);
        vec2 a = q - vec2(0.3, -0.35), b = q - vec2(-0.3, 0.4);
        float spec = exp(-dot(a, a) * 6.0) + 0.7 * exp(-dot(b, b) * 22.0);
        if (glowing > 0.0) { glow = mix(glow, kindColour(fract(h * 23.0) * 3.0), 0.8 * glowing); loud = max(loud, glowing * (0.2 + 0.25 * uLevel + 0.15 * sin(t * 0.4 + h * 70.0))); }
        float gather = (1.0 - glowing) * step(0.93, fract(h * 5.3)) * (0.5 + 0.5 * sin(t * 0.3 + h * 60.0));
        vec3 c = li * (0.2 + 4.0 * spec) + (glow * loud + vec3(1.0, 0.8, 0.5) * gather * 0.5) * (0.12 + 1.7 * spec) * (1.0 + glowing) + vec3(0.012, 0.018, 0.026) * (0.5 + 8.0 * spec) * (1.0 + 2.0 * uKeys);
        col += T * cd * tint * c;
        T *= 1.0 - cd * 0.9;
        col += T * tint * glow * (loud * 0.09 + gather * 0.04) * exp(-dd * 1.2) * (1.0 - smoothstep(2.5, 4.0, dd)) * (1.0 - smoothstep(0.02, 0.034, abs(dx) * z));
      }
    }
    // the columns, and stumps that rise from the pool: place, girth, height (0 is up to the roof)
    for (int m = 0; m < (uOwn[6] > 0.0 ? 2 : 1); m++) {
    vec3 C = k == 3 ? vec3(-2.13, 0.19, 0.0) : k == 4 ? vec3(2.92, 0.23, 0.0) : k == 5 ? vec3(1.41, 0.18, 0.0) : k == 6 ? vec3(0.094, 0.19, 0.39) : vec3(2.85, 0.21, 0.0);
    float sd = fk + 1.0;
    if (uOwn[6] < 0.0) C.y *= 1.0 + 0.999 * uOwn[6];
    if (m > 0) { float id = floor(X / 2.3 + 0.37 * fk); C = vec3((id + 0.3 + 0.4 * hash11(id + fk * 7.0) - 0.37 * fk) * 2.3, 0.34 * uOwn[6] * (0.4 + 0.6 * hash11(id + fk * 3.0)), 0.0); sd += id + 20.0; }
    float lone = abs(X - C.x);
    if ((k > 2 || m > 0 && k > 0) && lone < C.y * 2.5 && (C.z == 0.0 || Y < C.z)) {
      float lump = noise(vec2(Y * 2.1, sd + 0.5 * sign(X - C.x))) + 0.2 * noise(vec2(Y * 8.0, sd + 7.5 + 0.5 * sign(X - C.x)));
      float cw = C.z > 0.0 ? C.y * (0.35 + 0.5 * lump + 1.3 * exp(-Y * 9.0)) * sqrt(sat((1.0 - Y / C.z) * 2.2))
        : C.y * (0.2 + 0.75 * lump + 0.7 * exp(-Y * 4.0) + 1.3 * exp((Y - roof) * 2.5));
      float cov = sat((cw - lone) / (dcPx * z) + 0.5) * smoothstep(0.0, 0.5, roof - Y);
      if (cov > 0.0) {
        float s = clamp((X - C.x) / max(cw, 1e-3), -1.0, 1.0), a = asin(s);
        float flute = noise(vec2(a * 4.0 + sd * 9.0, Y * 2.0)) * 0.6 + noise(vec2(a * 11.0, Y * 5.0 + sd)) * 0.4;
        vec3 c, n = vec3(s, (flute - 0.5) * 0.8, -sqrt(max(1.0 - s * s, 0.0)));
        vec3 w = vec3(C.x, Y, z);
        c = dcSide(dcPos[0], dcCol[0], w, n) + 0.6 * (dcSide(dcPos[1], dcCol[1], w, n) + dcSide(dcPos[2], dcCol[2], w, n) + dcSide(dcPos[3], dcCol[3], w, n) + dcSide(dcPos[4], dcCol[4], w, n) + dcSide(dcPos[5], dcCol[5], w, n));
        if (day > 0.0) c += haze * (0.03 + 0.5 * s * s * flute);
        c = c * dcStone(mix(vec3(0.45, 0.27, 0.15), vec3(0.95, 0.84, 0.68), flute), flute) * 1.3 + vec3(0.004, 0.0055, 0.008) * flute;
        col += T * cov * tint * mix(c, air, fog);
        T *= 1.0 - cov;
      }
    }
    }
    if (T < 0.02) break;
  }
  // the far end: a thicket of columns before the light, and the thread where it meets the pool
  if (T > 0.02) {
    bool wet = 11.0 > zw;
    float X = (u0 + bend.x * float(wet)) * 11.0 + cam, Y = abs(dcH + (v0 + bend.y * float(wet)) * 11.0);
    vec3 c = air * 0.3 + dcLight(vec3(X, Y, 10.0), five) * vec3(0.5, 0.38, 0.26) * (0.1 + 0.5 * noise(vec2(X * 1.3 + 0.3 * sin(Y * 4.0), Y * 1.5)));
    if (day + mist > 0.0) c = mix(c, (dcDay() * 1.5 * day * (0.45 + 0.75 * exp(-(X - 1.5) * (X - 1.5) * 0.05)) + haze) * (1.0 - 0.4 * sat(Y * 0.4 - 0.2)), max(day, 0.9 * mist));
    for (int i = 0; i < 2; i++) {
      float cell = 1.5 - 0.6 * float(i), id = floor(X / cell + 0.37), h = hash11(id + 50.0 * float(i) + 3.0);
      float x = (fract(X / cell + 0.37) - 0.3 - 0.4 * h) * cell;
      float g = 0.04 + 0.13 * fract(h * 7.7), e = 0.5 + 0.8 * exp(-Y * 5.0) + exp((Y - 1.9) * 2.5);
      float w = g * (e + 0.8 * noise(vec2(Y * 2.6, id)));
      float cov = sat((w - abs(x)) / (dcPx * 11.0) + 0.5) * (1.0 - smoothstep(1.5, 2.0, Y)) * step(0.25, h) * (1.0 + min(uOwn[6], 0.0)) * (1.0 - 0.85 * mist);
      float edge = x / w * sign(dcPos[0].x - X);
      c = mix(c, c * (0.22 + 0.3 * float(1 - i)) + dcLight(vec3(X, Y, 9.0), five) * vec3(0.9, 0.7, 0.45) * smoothstep(0.3, 1.0, edge) * 0.35, cov);
    }
    col += T * (wet ? 0.7 : 1.0) * (c + exp(-Y * 40.0) * 0.6 * air);
  }
  // the pool itself: a little of its floor close by, and the crest of a ring
  if (zw < 12.0) {
    float near = exp(-(zw - 1.0) * 0.9);
    col = col * (1.0 - 0.35 * near) + vec3(0.002, 0.008, 0.010) * near * (0.4 + noise(vec2(u0 * zw, zw) * 5.0));
    col += (air + 0.03) * crest * 5.0 * (1.0 - dry);
  }
  if (uMic > 0.0) {
    col += (air + 0.02) * uMic * exp(-abs(v0 + 0.05) * 22.0) * (0.3 + noise(vec2(u0 * 5.0 + t * 0.1, v0 * 14.0)));
  }
  // the drop a hit lets go: it falls, and its double rises to meet it
  float fy = mix(0.28, -0.214, sat(age * age * 14.0)), fs = uHits * (1.0 - smoothstep(0.35, 0.65, age));
  if (fs > 0.01) {
    float dx = u0 - xf, tail = 0.006 + 0.12 * age;
    for (int i = 0; i < 2; i++) {
      float dy = v0 - (i == 0 ? fy : -0.428 - fy);
      float r = length(vec2(dx, dy > 0.0 ? dy * 0.006 / tail : dy));
      col += mix(vec3(1.0, 0.9, 0.75), uKind[4], 0.35) * fs * (i == 0 ? 1.0 : 0.5) * (2.0 * (1.0 - smoothstep(0.005, 0.008, r)) + 0.00035 / (0.0007 + r * r * 3.0) * (1.0 - smoothstep(0.1, 0.3, r)));
    }
  }
  return screenOf(col * (1.1 + 0.5 * uTone));
}
// One hanging sheet of stone with a lamp behind it.
vec2 dcFold(float u) { float T = exp2((uOwn[0] > 0.0 ? 1.5 : 1.4) * uOwn[0]); u *= T; return vec2(u * 11.5 + 2.3 * sin(u * 2.7 + 0.5) + 0.8 * sin(u * 7.1 + 2.0) + 0.06 * sin(uTime * 0.05), (11.5 + 6.21 * cos(u * 2.7 + 0.5) + 5.68 * cos(u * 7.1 + 2.0)) * T); }
vec2 dcTeeth(float u) { return vec2(u * 37.0 + 1.1 * sin(u * 13.0) + 0.5 * sin(u * 31.0 + 1.0), 37.0 + 14.3 * cos(u * 13.0) + 15.5 * cos(u * 31.0 + 1.0)); }
float dcHem(float u) { return -(uOwn[5] > 0.0 ? 0.7 : 0.4) * uOwn[5] + (uOwn[3] < 0.0 ? -uOwn[3] * (0.62 * exp(-(u - 0.1) * (u - 0.1) * 5.0) - 0.16) : 0.0) + 0.05 - 0.42 * smoothstep(-1.1, 0.5, u) + 0.85 * smoothstep(0.5, 1.12, u); }
const float dcTilt = 0.3;
vec3 dcSheet(vec2 p) {
  float t = uTime;
  vec2 L = vec2(0.02 + 0.06 * sin(t * 0.037) - 0.34 * dcCue, 0.03 * sin(t * 0.029) + 0.4 * max(-uOwn[5], 0.0) + 0.3 * max(-uOwn[3], 0.0));
  float reach = 0.8 + 0.3 * uLevel + 0.4 * uLow + 0.4 * uCue;
  float day = max(uOwn[2], 0.0), front = max(-uOwn[2], 0.0), cut = max(uOwn[3], 0.0), bare = max(-uOwn[1], 0.0), tight = exp2((uOwn[0] > 0.0 ? 1.5 : 1.4) * uOwn[0]);
  vec3 warm = dcLampHue(vec3(1.0, 0.62, 0.3));
  if (uOwn[2] != 0.0) warm *= 1.0 - 0.75 * abs(uOwn[2]);
  float amp = 0.058 * (0.2 + 0.8 * (1.0 - smoothstep(0.0, 0.6 + 1.6 * max(uOwn[5], 0.0), p.y - dcHem(p.x)))) * (tight > 1.0 ? 1.0 / tight : tight), u = p.x;
  vec2 f;
  for (int i = 0; i < 4; i++) { f = dcFold(u); u -= clamp((u + amp * sin(f.x) - p.x) / max(1.0 + amp * f.y * cos(f.x), 0.25), -0.1, 0.1); }
  f = dcFold(u);
  float stretch = max(1.0 + amp * f.y * cos(f.x), 0.15);
  float zf = amp * 1.6 * cos(f.x), slope = -amp * 1.6 * f.y * sin(f.x) / stretch;
  float y = p.y + zf * dcTilt;
  vec2 th = dcTeeth(u);
  float tf = abs(fract(th.x) - 0.5) * 2.0, big = (0.006 + 0.016 * noise(vec2(u * 9.0, 4.0))) * (1.0 + 9.0 * max(uOwn[1], 0.0));   // 0 at a tip of the hem, 1 between two
  float e0 = y - dcHem(u), slit = 1.0;
  if (cut > 0.0) {
    float r = u * 5.0 + 0.6 * sin(u * 4.0), id = floor(r), wr = 1.0 - cut * (0.12 + 0.3 * hash11(id + 3.0) + 0.35 * (1.0 - smoothstep(-0.4, 0.35, y)));
    slit = (1.0 - smoothstep(wr - 0.03, wr + 0.03, abs(fract(r) - 0.5) * 2.0));
    e0 += cut * 0.3 * (hash11(id + 19.0) - 0.5);
  }
  float e = e0 - big * tf * tf;
  float top = 0.35 * max(uOwn[5], 0.0) + 0.40 - 0.16 * p.x + 0.03 * noise(vec2(p.x * 5.0, 1.0));
  // the dark behind: the lamp's light spills under the hem in shafts
  vec2 dl = p - L;
  float l2 = dot(dl, dl);
  float shaft = noise(vec2(atan(dl.x, max(0.02 - dl.y, 1e-3)) * 7.0 + 0.3 * sin(t * 0.04), 1.0));
  vec3 col = warm * reach * 0.0075 / (0.05 + l2) * (0.15 + shaft * shaft) * (1.0 - smoothstep(0.1, 0.75, l2)) * (0.7 + 0.6 * uSpace + 1.5 * uMic) + vec3(0.003, 0.0045, 0.007);
  if (day > 0.0) col = mix(col, dcDay() * (0.4 + 0.75 * exp(-l2 * 1.5)) * (0.94 + 0.1 * noise(p * 3.0)), day);
  float in_ = smoothstep(-dcPx, dcPx, e) * slit;
  if (in_ > 0.0) {
    // growth bands follow the hem: cream, rust and amber, some broad and some hair thin
    float b = e0 + 0.05 * (noise(vec2(u * 2.6, e * 2.0)) - 0.5) + 0.008 * noise(vec2(u * 23.0, e * 12.0)) - big * tf * tf * exp(-e0 * 24.0);
    if (uOwn[6] != 0.0) b *= exp2(-1.6 * uOwn[6]);
    float thin = noise(vec2(b * 58.0, 8.0)), hair = noise(vec2(b * 190.0, 5.0)), drip = noise(vec2(u * 85.0, e * 2.5));
    float rust = smoothstep(0.5, 0.66, noise(vec2(b * 13.0, 3.0))) * (0.5 + 0.5 * thin) + 0.5 * smoothstep(0.62, 0.8, thin);
    float amber = smoothstep(0.35, 0.6, noise(vec2(b * 21.0, 17.0)));
    if (bare > 0.0) {
      rust = mix(rust, 0.8 * smoothstep(0.5, 0.85, noise(vec2(u * 34.0, e * 1.6 + 5.0))), bare);
      amber = mix(amber, noise(vec2(u * 12.0, e * 0.9 + 9.0)), bare);
    }
    vec3 absb = mix(mix(vec3(0.10, 0.28, 0.75), vec3(0.28, 0.85, 2.2), amber), vec3(0.95, 2.5, 4.4), rust * 0.9);
    if (uOwn[4] > 0.0) absb = mix(absb, vec3(1.5, 0.5, 0.26) * (0.25 + 0.9 * amber + 0.9 * rust), uOwn[4]);
    if (uOwn[4] < 0.0) absb = mix(absb, -log(max(mix(mix(uKind[1], uKind[3], amber), uKind[0], sat(rust) * 0.9), 0.03)) * (0.35 + 0.6 * amber + 1.1 * rust), -uOwn[4]);
    float thick = (0.45 + 0.7 * smoothstep(0.1, 0.6, e) + 0.35 * drip + 0.2 * hair) * sqrt(1.0 + slope * slope * 1.3);
    vec3 pass = exp(-absb * thick);
    vec3 to = vec3(L - p, 0.26 - zf), n = normalize(vec3(-slope, 0.05, 1.0));
    float d2 = dot(to, to), lam = dot(n, to) / sqrt(d2 + 1e-4);
    float wrap = 0.22 + 0.78 * sat(lam);
    float ang = (p.x - L.x) / (0.6 + 0.4 * (p.y + 0.5)) + L.x * 1.4, st = noise(vec2(ang * 15.0, 2.0));
    float sh = 1.0 - 0.5 * smoothstep(0.6, 0.78, st) * smoothstep(-0.2, 0.0, y - 0.3 * noise(vec2(ang * 5.0, 9.0)));
    vec3 li = warm * vec3(1.0, 1.1, 1.2) * reach * 0.17 / (0.03 + d2 * d2 * 3.0 + d2 * 0.4) * wrap * sh;
    if (day > 0.0) li += day * dcDay() * 0.8 * (0.35 + 0.65 * sat(lam + 0.4)) * sh;
    vec4 pc = piece(vec2(p.x / 1.78 + 0.5, (0.42 - p.y) / (0.8 + 0.22 * max(uOwn[5], 0.0))));
    li += pc.rgb * (0.4 + uEnergy) * 0.9 * wrap * sh;
    float kb = clamp(e / 0.11, 0.0, 4.0); int ki = int(floor(kb));
    float lv[5] = float[5](uHits * 0.5, uPhrase, uTexture, uPad, uDrone);
    li += mix(kindColour(4.0 - kb), warm * 0.8, 0.3) * mix(lv[ki], lv[min(ki + 1, 4)], smoothstep(0.2, 0.8, fract(kb))) * (0.3 + uEnergy) * 1.15 / (0.6 + 2.0 * l2) * wrap;
    float hx = p.x - (uLoop - 0.5) * 1.4, hy = p.y - mix(0.35, dcHem(p.x), sqrt(sat(1.0 - uHits)));
    li += vec3(1.0, 0.85, 0.65) * uHits * 2.2 * exp(-hx * hx * 160.0 - hy * hy * 60.0);
    vec3 c = li * pass;
    // what light there is on this side: cold, and wet along the folds
    float facing = 1.0 / sqrt(1.0 + slope * slope);
    if (uOwn[7] < 0.0) {
      vec2 g = vec2(u * 62.0, e0 * 62.0 + 0.5 * mod(floor(u * 62.0), 2.0)), h = fract(g) - 0.5;
      c *= mix(1.0, 1.7 * (1.0 - smoothstep(-0.1, 0.1, length(h * vec2(min(stretch, 1.0), 1.0)) - 0.16 - 0.26 * sat(dot(c, vec3(0.6))))), -uOwn[7]);
    }
    if (front > 0.0) {
      float lamb = sat(0.4 + 0.75 * dot(normalize(vec3(1.6 * slope, 0.05, 1.0)), vec3(-0.53, 0.33, 0.78)));
      c = mix(c, exp(-absb * 0.6) * (lamb * lamb * dcLampHue(vec3(0.8, 0.74, 0.66)) * (0.5 + 0.35 * uLevel + 0.3 * uCue) + li * 0.4) * (0.75 + 0.3 * drip + 0.15 * hair), front);
    }
    c += mix(vec3(0.8, 0.7, 0.6), vec3(0.4, 0.2, 0.1), sat(rust)) * vec3(0.010, 0.014, 0.020) * facing * (0.5 + thin);
    float wetl = sat(0.5 - 0.5 * slope * facing); wetl *= wetl; wetl *= wetl; wetl *= wetl;
    c += vec3(0.05, 0.06, 0.07) * wetl * (0.3 + 1.2 * uHigh) * (0.4 + drip);
    c += warm * exp(-e * 150.0) * 0.22 * reach / (0.2 + 5.0 * l2);
    col = mix(col, c, in_);
  }
  // the roof it hangs from
  float rk = noise(p * vec2(7.0, 14.0)) * 0.5 + noise(p * vec2(22.0, 34.0)) * 0.3 + noise(p * 75.0) * 0.2;
  float over = smoothstep(-0.003, 0.006, y - top - 0.07 * rk);
  col = mix(col, vec3(0.003, 0.0045, 0.007) * (0.2 + 1.2 * rk) + warm * 0.07 * rk * rk * reach * exp(-max(y - top, 0.0) * 16.0) / (0.25 + l2), over);
  // the drops along the hem, each for its band
  if (abs(e) < 0.06) {
    float j = floor(th.x), uj = u + (j + 0.5 - th.x) / max(th.y, 6.0), hj = hash11(j + 40.0);
    vec2 fj = dcFold(uj);
    float bd = band(0.5 + uj * 0.55), gr = fract(t / (24.0 + 30.0 * hj) + hj * 7.0);
    float R = (1.0 - cut) * step(0.5, hj) * (0.0036 + 0.0025 * gr * (1.0 - smoothstep(0.97, 1.0, gr)) + 0.0055 * bd);
    vec2 q = (p - vec2(uj + amp * sin(fj.x), dcHem(uj) - amp * 1.6 * cos(fj.x) * dcTilt - R * 0.5)) / max(R, 1e-4);
    float dd = length(q * vec2(1.0, q.y > 0.0 ? 0.7 : 1.0));
    float cd = sat((1.0 - dd) * R / dcPx + 0.5) * step(1e-4, R);
    vec2 a = q - vec2(0.2, -0.4), bb = q - vec2(-0.3, 0.35);
    float spec = exp(-dot(a, a) * 4.0) + 0.6 * exp(-dot(bb, bb) * 20.0);
    float lit = reach * 0.05 / (0.05 + l2) + 0.06 + 1.4 * bd * (0.3 + uEnergy) + 0.4 * uKeys;
    col = mix(col, vec3(1.0, 0.78, 0.5) * lit * (0.03 + 1.6 * spec * spec), cd * (1.0 - over));
    col += vec3(1.0, 0.75, 0.45) * lit * 0.1 * exp(-dd * 1.1) * (1.0 - smoothstep(2.0, 4.0, dd)) * (1.0 - smoothstep(0.5, 0.9, tf)) * (1.0 - over) * step(1e-4, R);
  }
  if (uOwn[7] > 0.0) col = mix(col, dcDay() * (0.22 + 0.4 * day), uOwn[7] * (0.25 + 0.7 * (1.0 - smoothstep(-0.5, 0.45, p.y + 0.25 * (noise(p * vec2(2.0, 4.0) + vec2(50.0 + 0.04 * t, 9.0)) - 0.5)))));
  // the drop a hit lets go
  float age = 1.0 - uHits, fx = (uLoop - 0.5) * 1.4, fs = uHits * (1.0 - smoothstep(0.3, 0.75, age));
  vec2 q = p - vec2(fx, mix(dcHem(fx) - 0.03, -0.62, sat(age * age * 6.0)));
  if (q.y > 0.0) q.y *= 0.006 / (0.006 + 0.14 * age);
  float r = length(q);
  col += vec3(1.0, 0.88, 0.7) * fs * (1.2 * (1.0 - smoothstep(0.004, 0.006, r)) + 0.0001 / (0.0006 + r * r * 4.0));
  return screenOf(col * (1.4 + 0.5 * uTone));
}
vec3 render(vec2 p) {
  dcSet();
  vec3 c = vec3(0.0);
  if (uVar < 0.5) c = dcCave(p);
  if (uVar >= 0.5) c = dcSheet(p);
  return c;
}
