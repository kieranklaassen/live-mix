// name: Star
// a: Burning
// b: Eclipse
// what: One star turning in the dark: a ball of fire pushed out of shape by the sound, with a corona streaming off it.
// follows: The low band swells it, each kind of sound raises its own region in its own colour, the high band raises tongues of flame and lengthens the rays, a hit throws a loop of fire off the limb.
// own: 0 1 two smaller stars go round it, -1 a flat disc of dust girdles it; 1 1 a pale ground by day, -1 a dusk in the colours of drone and pad; 2 1 long tongues and spikes (b: the dark body is smaller and a ring of fire shows), -1 a smooth banded ball (b: the dark body moves aside and leaves a crescent); 3 1 a black crust with glowing cracks (b: the dark body is a lit world), -1 a cool ball lit from one side (b: the dark body is glass); 4 1 needle rays, -1 a soft glow and round halos; 5 1 over a sea that mirrors it, -1 over misty hills; 6 1 wound of threads (b: the corona in fine lines), -1 made of dots (b: the corona of dots); 7 1 shells of gas blown out, -1 cloud drifting across
vec3 rich(vec3 c, float k) { return max(mix(vec3(dot(c, vec3(0.33))), c, k), 0.0); }
float gDye;   // how far it takes the colours of the sounds when nothing sounds
float gR; mat3 gSpin; float gLv[5];
vec3 spot(int k) { float f = float(k); return normalize(vec3(cos(f * 2.4 + 0.5), 0.55 * sin(f * 1.7 + 0.3), sin(f * 2.4 + 0.5))); }

// How far the surface stands out in the direction d (already turned with the star).
float lift(vec3 d) {
  // low sound makes slow swells, the middle makes ripples, high sound raises tongues of flame
  float h = (0.05 + 0.1 * uLow) * (noise(d * 1.9 + vec3(0.0, uTime * 0.06, 0.0)) - 0.5);
  float n2 = noise(d * 6.0 + vec3(3.0, -uTime * 0.1, 1.0));
  h += (0.02 + 0.06 * uMid) * (n2 - 0.5);
  n2 *= n2;
  h += uHigh * 0.2 * n2 * n2;
  for (int k = 0; k < 5; k++) { float a = max(dot(d, spot(k)), 0.0); a *= a; a *= a; h += 0.1 * gLv[k] * a * a; }
  if (uOwn[2] < 0.0) h *= 1.0 + 0.97 * uOwn[2];
  if (uOwn[2] > 0.0) {
    float n3 = noise(d * 8.5 + vec3(7.0, 2.0, uTime * 0.05)); n3 *= n3;
    h += uOwn[2] * (0.75 + 0.5 * uMid) * (0.52 * n3 * n3 + 0.1 * n2 * n2 - 0.05);
  }
  return h;
}
float map(vec3 p) { float r = length(p); return (r - gR - lift(gSpin * (p / r))) * (0.5 - 0.16 * max(uOwn[2], 0.0)); }

// Fire in a given colour: dark and deep where it is cool, the colour itself, then towards white where it is hottest.
vec3 fire(float x, vec3 hue) {
  x = sat(x);
  return x < 0.6 ? mix(hue * hue * 0.22, hue, x / 0.6) : mix(hue, mix(hue, vec3(1.0, 0.95, 0.85), 0.7), (x - 0.6) / 0.4);
}
// The colour of the star in a direction: each kind of sound colours the part of the star round its own place, as far as it is loud.
vec3 hueAt(vec3 d) {
  vec3 c = mix(vec3(1.0, 0.3, 0.04), vec3(1.0, 0.55, 0.2), uTone) * 0.12;
  if (gDye > 0.0) c = mix(c, mix(uKind[0], uKind[1], smoothstep(-0.6, 0.6, d.y + 0.4 * d.x)) * 0.12, gDye);
  float sum = 0.12;
  for (int k = 0; k < 5; k++) { float a = max(dot(d, spot(k)), 0.0); float w = gLv[k] * (0.02 + a * a * a); c += rich(uKind[k], 1.8) * w; sum += w; }
  return rich(c / sum, 1.5 - 0.4 * gDye);
}

// Dots in rows round a ball (d a direction on it) or round the middle: n rows from pole to pole. How far from the middle of the nearest, and its number.
vec3 dotsOn(vec3 d, float n) {
  float la = asin(clamp(d.y, -1.0, 1.0)) / PI + 0.5, row = floor(la * n), mid = ((row + 0.5) / n - 0.5) * PI;
  float m = max(floor(2.0 * n * cos(mid) + 0.5), 1.0), a = (atan(d.z, d.x + 1e-6) / TAU + 0.5) * m + 0.5 * mod(row, 2.0), id = floor(a);
  return vec3(length(vec2((a - id - 0.5) * TAU * cos(mid) / m, (la * n - row - 0.5) * PI / n)) * n / PI, row, mod(id, m));
}
// Wound thread: where on it a direction is, -1 to 1 across, and which skein.
vec2 skein(vec3 d) {
  vec3 ax[4] = vec3[4](vec3(0.8, 0.6, 0.0), vec3(-0.48, 0.36, 0.8), vec3(-0.2, 0.45, -0.87), vec3(0.4, -0.85, 0.34));
  float best = 9.0, v = 0.0, w = 0.0;
  for (int k = 0; k < 4; k++) {
    float s = dot(d, ax[k]), e = abs(s) - 0.12 * noise(d * 2.0 + float(k) * 9.0);
    if (e < best) { best = e; v = s; w = float(k); }
  }
  return vec2(sin(v * 70.0 + 2.2 * noise(d * 4.0)), w);
}
// The ground it hangs before: pale or dusk.
vec3 stage(vec2 p) {
  vec3 hi = uKind[0] * uKind[0], lo = uKind[1] * uKind[1];
  if (uOwn[1] > 0.0) return uOwn[1] * mix(vec3(1.0, 0.97, 0.92), uKind[0] * 1.15, 0.16 + 0.2 * sat(p.y + 0.5)) * (1.15 - 0.45 * length(p - vec2(-0.2, 0.15)) + 0.12 * noise(p * 2.0));
  return -uOwn[1] * mix(lo * 0.85 + 0.02, hi * 0.5, smoothstep(-0.45, 0.5, p.y + 0.12 * (noise(p * vec2(1.4, 5.0) + 3.0) - 0.5)));
}
vec3 render(vec2 p) {
  bool eclipse = uVar > 0.5;
  gDye = min(2.0 * (abs(uOwn[0]) + abs(uOwn[1]) + abs(uOwn[2]) + abs(uOwn[3]) + abs(uOwn[4]) + abs(uOwn[5]) + abs(uOwn[6]) + abs(uOwn[7])), 1.0);
  float pale = max(uOwn[1], 0.0), sea = 0.0, under = 0.0;
  vec2 pWas = p;
  if (uOwn[5] > 0.0) {
    float shore = -0.8 + 0.63 * uOwn[5];
    under = max(shore - p.y, 0.0);
    if (under > 0.0) {
      sea = 1.0;
      float deep = 1.0 / (0.04 + under), far = sat(under * 9.0);
      float wv = noise(vec2(p.x * 3.0, deep * 6.0 + mod(uTime * 0.5, 1024.0))) + 0.6 * noise(vec2(p.x * 9.0 * (0.4 + under * 3.0), deep * 14.0 - mod(uTime * 0.7, 1024.0))) - 0.8;
      p.y = shore + under * 0.9 + far * (0.05 + 0.05 * uLow + 0.16 * under) * wv;
      p.x += far * 0.22 * under * (noise(vec2(p.x * 14.0, deep * 11.0 + mod(uTime * 0.6, 1024.0))) - 0.5);
    }
  }
  gLv = float[5](uDrone, uPad, uTexture, uPhrase, uHits);
  gR = eclipse ? 0.62 : 0.6 + 0.2 * uLow + 0.03 * sin(uTime * 0.5);
  if (!eclipse && uOwn[2] > 0.0) gR *= 1.0 - 0.27 * uOwn[2];
  if (uOwn[0] < 0.0) gR *= 1.0 + 0.16 * uOwn[0];
  if (uOwn[7] > 0.0) gR *= 1.0 - 0.4 * uOwn[7];
  float sa = uTime * 0.05 + uTravel * 0.03;
  gSpin = mat3(cos(sa), 0.0, sin(sa), 0.0, 1.0, 0.0, -sin(sa), 0.0, cos(sa));
  vec3 ro = vec3(0.0, 0.25 * sin(uTime * 0.04), -3.4);
  vec3 fw = normalize(vec3(0.12 * sin(uTime * 0.05), 0.0, 0.0) - ro), rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)), up = cross(fw, rt);
  vec3 rd = normalize(fw * 1.5 + rt * p.x + up * p.y);

  // the nearest the ray comes to the middle: the corona is drawn from that
  float tc = -dot(ro, rd);
  vec3 pc = ro + rd * tc;
  float b = length(pc);
  vec2 pl = vec2(dot(pc, rt), dot(pc, up));
  vec3 dir = gSpin * (pc / max(b, 1e-4));
  vec3 mixc = hueAt(dir);

  vec3 col = vec3(0.0);
  float cover = 1.0;
  float tHit = 1e9;
  if (!eclipse) {
    float bound = gR + 0.42 + 0.3 * max(uOwn[2], 0.0);
    float disc = bound * bound - b * b;
    if (disc > 0.0) {
      float t = tc - sqrt(disc), tEnd = tc + sqrt(disc), d = 1.0;
      for (int i = 0; i < 36; i++) {
        d = map(ro + rd * t);
        if (d < 0.003) { tHit = t; break; }
        t += d;
        if (t > tEnd) break;
      }
      if (d < 0.02 && tHit > 1e8) tHit = t;
    }
    if (tHit < 1e8) {
      vec3 pos = ro + rd * tHit;
      vec2 e = vec2(1.0, -1.0) * 0.006;
      vec3 n = normalize(e.xyy * map(pos + e.xyy) + e.yyx * map(pos + e.yyx) + e.yxy * map(pos + e.yxy) + e.xxx * map(pos + e.xxx));
      vec3 d3 = gSpin * normalize(pos);
      float h = length(pos) - gR;
      // boiling fire: bright cells with dark lanes between, hotter where the surface stands out
      vec3 w3 = d3 * 4.2 + vec3(0.0, uTime * 0.09, 0.0);
      float cells = fbm(w3 + 1.3 * noise(d3 * 2.7 - vec3(uTime * 0.05)));
      float lanes = abs(noise(d3 * 9.0 + vec3(uTime * 0.12, 0.0, 0.0)) - 0.5) * 2.0;
      float mu = sat(dot(n, -rd));
      float heat = 2.3 * (cells - 0.27) * (0.3 + 0.7 * lanes) + 1.5 * max(h, -0.02) + 0.05 + 0.25 * uLevel;
      vec3 hue = hueAt(d3);
      col = fire(heat, hue) * (0.45 + 0.9 * heat) * (0.6 + 0.4 * pow(mu, 0.5));
      col += hue * pow(1.0 - mu, 2.5) * 0.35; // the limb glows
      if (uOwn[2] < 0.0) {                     // smooth, and drawn out into belts
        float wob = fbm(d3 * vec3(2.0, 5.0, 2.0) + vec3(uTime * 0.03, 0.0, 0.0)) - 0.5;
        float belt = 0.5 + 0.5 * sin(d3.y * 15.0 + 5.0 * noise(vec2(d3.y * 4.0, 3.0)) + 3.2 * wob), fine = noise(vec3(d3.x * 4.0, d3.y * 38.0 + 6.0 * wob, d3.z * 4.0));
        vec3 bc = mix(hue * hue * 0.5, mix(hue, vec3(1.0, 0.95, 0.88), 0.2), belt * 0.75 + 0.35 * (fine - 0.3));
        col = mix(col, bc * (0.3 + 0.75 * sqrt(mu)) * (0.75 + 0.6 * uLevel), -uOwn[2]);
      }
      float g1 = noise(d3 * 22.0), crack = 1.0;
      if (uOwn[3] > 0.0) {                     // a crust, with the fire showing in its cracks
        vec3 q = d3 * 3.3 + 0.5 * noise(d3 * 6.0);
        float c1 = abs(noise(q + vec3(0.0, uTime * 0.012, 0.0)) - 0.5), c2 = abs(noise(q * 2.7 + 5.0) - 0.5);
        crack = exp(-c1 * 26.0) + 0.5 * exp(-c2 * 30.0) * exp(-c1 * 5.0);
        float la = sat(dot(n, normalize(vec3(-0.5, 0.7, -0.45))) * 0.8 + 0.2);
        vec3 crust = mix(vec3(0.045, 0.04, 0.042), hue * 0.08, 0.3) * (0.3 + 1.4 * la) * (0.5 + g1);
        crust += fire(0.2 + 0.42 * crack + 0.2 * uLevel, hue) * crack * crack * (0.8 + 1.2 * uLevel) + hue * hue * crack * 0.35;
        crust += hue * pow(1.0 - mu, 3.0) * 0.25;
        col = mix(col, crust, uOwn[3]);
      }
      if (uOwn[3] < 0.0) {                     // no fire at all: a cool ball in the light of another
        float la = dot(n, normalize(vec3(-0.62, 0.5, -0.5))), day = smoothstep(-0.25, 1.0, la);
        vec3 tint = mix(uKind[0], uKind[1], smoothstep(0.3, 0.7, fbm(d3 * 2.4 + 3.0)));
        tint = mix(tint, hue, 0.6) * (0.94 + 0.12 * g1);
        vec3 sheen = mix(uKind[3], uKind[2], smoothstep(0.35, 0.95, mu + 0.25 * (noise(d3 * 3.0) - 0.5)));
        tint = mix(tint, sheen, 0.4 * (1.0 - smoothstep(0.35, 0.9, mu)));
        vec3 ball = tint * (0.4 + 0.6 * tint) * (0.07 + 0.1 * pale + 1.25 * day * day) + tint * 0.12 * pow(1.0 - mu, 2.0) * (1.0 + 2.0 * pale);
        float sp = sat(dot(reflect(rd, n), normalize(vec3(-0.62, 0.5, -0.5))));
        ball += vec3(1.0, 0.97, 0.92) * (0.5 * pow(sp, 24.0) + 0.1 * pow(sp, 4.0)) * (1.0 - 0.5 * max(-uOwn[2], 0.0));
        ball = ball * (0.85 + 0.3 * uLevel) + hue * (0.06 + heat * heat * 0.25) * uLevel;
        col = mix(col, ball, -uOwn[3]);
      }
      if (uOwn[6] > 0.0) {                     // wound of thread
        vec2 k = skein(d3);
        float lum = dot(col, vec3(0.33)), round1 = mix(0.6, sqrt(max(1.0 - k.x * k.x, 0.0)), smoothstep(0.05, 0.4, mu));
        vec3 yarn = mix(hue, uKind[int(k.y)], 0.55) * (0.35 + 0.8 * lum) * (0.22 + 0.9 * round1) * (0.75 + 0.5 * noise(d3 * 70.0));
        col = mix(col, yarn * (0.35 + 0.8 * mu), uOwn[6]);
      }
      if (uOwn[6] < 0.0) {                     // made of dots, with nothing between
        vec3 k = dotsOn(d3, 46.0);
        float lum = sat(dot(col, vec3(0.4)) + 0.15), r1 = 0.1 + 0.25 * lum;
        float in1 = smoothstep(r1 + 0.07, r1 - 0.07, k.x);
        cover = mix(1.0, in1, -uOwn[6] * 0.97);
        col *= 1.0 - uOwn[6] * 0.35;
      }
      col *= cover;
    }
  }
  // corona: falls off from the limb, streaked by where the ray passes
  float out_ = max(b - gR * (eclipse ? 1.0 : 0.96), 0.0);
  float s1 = noise(dir * 3.2 + vec3(0.0, uTime * 0.05, 0.0)), s2 = noise(dir * 11.0 + vec3(uTime * 0.07, 0.0, 2.0));
  float reach = (eclipse ? 0.2 + 0.28 * uLevel + 0.22 * uHigh : 0.07 + 0.2 * uLevel + 0.2 * uHigh);
  float rays = (0.35 + 1.3 * s1 * s1) * (0.55 + 0.9 * s2 * s2);
  float cor0 = reach, cor = exp(-out_ / (reach * (0.35 + 0.9 * s1))) * rays / (1.0 + out_ * out_ * 6.0) + (eclipse ? 0.5 : 1.3) * exp(-out_ * 14.0);
  vec3 corCol = eclipse ? mix(vec3(0.85, 0.9, 1.0), mixc, 0.55 + 0.35 * gDye) : mix(mixc, vec3(1.0, 0.9, 0.8), 0.2);
  if (uOwn[4] > 0.0) {                         // needles
    vec2 u = rot(0.02 * sin(uTime * 0.05)) * pl / max(length(pl), 1e-4);
    float nn = noise(vec3(u * 31.0, 5.0 + uTime * 0.02)), n4 = noise(vec3(u * 11.0, 9.0 + uTime * 0.03)), len = 0.1 + 1.5 * n4 * n4 * n4;
    nn = smoothstep(0.52, 0.8, nn);
    cor = mix(cor, (0.15 + 1.9 * nn * nn) * exp(-out_ / (len * (0.35 + 2.2 * cor0))) * 0.8 + 0.5 * exp(-out_ * 9.0), uOwn[4]);
  }
  if (uOwn[4] < 0.0) {                         // a round glow, and halos
    float h1 = (b - 1.12 - 0.04 * uLow) / 0.035, h2 = (b - 1.52) / 0.06, hz = 0.6 * exp(-out_ * 2.2) + 0.5 * exp(-out_ * 9.0);
    h1 = h1 < 0.0 ? h1 * 1.8 : h1 * 0.35;
    hz += (0.35 + 0.5 * uMid) * exp(-h1 * h1) * (0.7 + 0.5 * s1) + (0.12 + 0.3 * uHigh) * exp(-h2 * h2);
    cor = mix(cor, hz, -uOwn[4]);
  }
  if (uOwn[3] < 0.0 && !eclipse) cor *= 1.0 + 0.92 * uOwn[3] * (1.0 - 0.6 * max(abs(uOwn[4]), 0.0));
  if (eclipse && uOwn[6] < 0.0) {              // the corona in dots, large where it is bright
    float row = floor(b * 24.0), rm = (row + 0.5) / 24.0, m = floor(TAU * rm * 24.0 + 0.5), a = (atan(pl.y, pl.x + 1e-6) / TAU + 0.5) * m + 0.5 * mod(row, 2.0);
    float k = length(vec2(fract(a) - 0.5, b * 24.0 - row - 0.5)), r1 = 0.5 * sqrt(sat(cor * (0.5 + 0.9 * uLevel) * 1.6));
    cor = mix(cor, (1.0 - smoothstep(r1 - 0.06, r1 + 0.06, k)) * (0.5 + cor), -uOwn[6]);
  }
  if (eclipse && uOwn[6] > 0.0) {              // the corona in fine lines round it
    float lv = 15.0 * out_ + 5.0 * (noise(dir * 2.6 + 3.0) - 0.5) * min(out_ * 4.0, 1.0), fl = 22.0 * 2.3 / uRes.y, li = abs(fract(lv - uTime * 0.04) - 0.5);
    cor = mix(cor, smoothstep(0.08 + fl, 0.08, 0.5 - li) * (0.12 + 1.6 * cor) + 0.2 * cor, uOwn[6]);
  }
  float behind = tHit < 1e8 ? 0.0 : 1.0;
  if (cover < 1.0) cor *= mix(1.0, 0.2, smoothstep(gR + 0.1, gR * 0.8, b));
  if (cover < 1.0) behind = max(behind, 1.0 - cover);
  float gm = gR, bm = b;                       // the dark body in front, and how far from its middle
  if (eclipse && uOwn[2] != 0.0) {
    if (uOwn[2] > 0.0) gm *= 1.0 - 0.15 * uOwn[2];
    else bm = length(pl - uOwn[2] * vec2(-0.4, -0.2) * -1.0 * (gR / 0.62));
  }
  if (eclipse) behind = smoothstep(gm - 0.004, gm + 0.004, bm);
  if (uOwn[1] != 0.0) {
    vec3 back = stage(sea > 0.0 ? p : pWas);
    if (pale > 0.0) { back *= mix(vec3(1.0), 0.35 + 0.65 * corCol, pale * sat(cor * 0.9)); cor *= 1.0 - 0.35 * pale; }
    col += back * behind;
  }
  if (eclipse && uOwn[2] != 0.0) {             // what shows of the star itself
    float lm = sqrt(max(1.0 - b * b / (gR * gR), 0.0));
    vec3 k = mix(corCol * corCol, mix(corCol, vec3(1.0, 0.96, 0.88), 0.5), smoothstep(0.0, 0.8, lm));
    col += k * (0.75 + 0.5 * lm + 0.6 * uLevel + 0.9 * max(uOwn[2], 0.0)) * min(abs(uOwn[2]) * 4.0, 1.0) * behind * (1.0 - smoothstep(gR - 0.004, gR + 0.004, b)) * (0.75 + 0.5 * s2);
  }
  if (uOwn[7] > 0.0) {                         // shells of gas, each thrown out in its time
    for (int k = 0; k < 3; k++) {
      float fk = float(k), go = 0.06 * sin(uTime * 0.05 + fk * 2.0), w = noise(dir * (2.0 + fk) + fk * 7.0), rk = gR + 0.3 + 0.34 * fk + go + 0.42 * (w - 0.45) * (0.5 + 0.35 * fk);
      vec3 q = vec3(pl * (5.0 + 3.0 * fk), fk * 5.0 + uTime * 0.02);
      float fil = fbm(q + 2.0 * noise(q * 0.5)), e = (b - rk) / (0.04 + 0.035 * fk), in1 = exp(-e * e) + (e < 0.0 ? 0.3 * exp(e * 0.12) : 0.0);
      vec3 hk = k == 0 ? uKind[3] : k == 1 ? uKind[1] : uKind[0];
      col += uOwn[7] * rich(hk, 1.3) * in1 * (0.15 + 2.6 * fil * fil) * (0.4 + 0.5 * band(0.2 + 0.3 * fk) + 0.5 * uLevel) * behind * (1.0 - 0.5 * pale);
    }
  }
  col += corCol * cor * behind * (eclipse ? 0.55 + 1.1 * uLevel : 0.3 + 0.8 * uLevel);

  // a hit: a loop of fire thrown off the limb, growing as it fades; a cue throws a bigger one from the other side
  for (int k = 0; k < 2; k++) {
    float amt = k == 0 ? uHits : uCue;
    if (amt < 0.01) continue;
    float a = uTime * 0.03 + (k == 0 ? 0.9 : 3.6);
    vec3 radial = rt * cos(a) + up * sin(a), side = -rt * sin(a) + up * cos(a);
    float grow = 1.0 - amt;
    float rf = 0.1 + (k == 0 ? 0.42 : 0.7) * grow;
    vec3 cc = radial * (gR + rf * 0.55);
    float tp = dot(cc - ro, fw) / dot(rd, fw);
    vec3 q = ro + rd * tp - cc;
    float x = dot(q, side), y = dot(q, radial);
    float ring = abs(length(vec2(x * (1.0 + 0.5 * grow), y)) - rf);
    float lit = (0.35 + 0.65 * noise(vec2(atan(x, y) * 3.0, uTime * 0.3 + float(k) * 7.0))) * exp(-ring * (19.0 - 9.0 * grow)) * smoothstep(gR - 0.05, gR + 0.05, b) * (tp < tHit ? 1.0 : 0.0);
    col += (rich(uKind[4], 1.5) + vec3(0.8, 0.5, 0.3)) * lit * sqrt(amt) * 2.2;
    col += vec3(1.0, 0.9, 0.8) * exp(-length(pc - radial * gR) * 9.0) * amt * 1.2 * (eclipse ? behind : 1.0);   // the flash where it left
  }
  if (eclipse) {
    // the dark body in front: just enough light on it to see that it is a ball
    if (bm < gm) {
      vec3 pd = pc;
      if (uOwn[2] < 0.0) pd = rt * (pl.x + uOwn[2] * 0.4 * gR / 0.62) + up * (pl.y + uOwn[2] * 0.2 * gR / 0.62);
      vec3 n = normalize(pd - rd * sqrt(max(gm * gm - bm * bm, 0.0)));
      col += vec3(0.05, 0.08, 0.14) * (0.02 + 0.1 * pow(1.0 - sat(dot(n, -rd)), 3.0)) * (0.6 + 0.4 * noise(n * 6.0));
      if (uOwn[3] > 0.0) {                     // a world with a day side
        vec3 d3 = gSpin * n;
        float la = dot(n, normalize(vec3(-0.75, 0.55, -0.1))), day = smoothstep(-0.12, 0.75, la), soil = fbm(d3 * 2.7 + 2.0), cl = smoothstep(0.5, 0.72, fbm(d3 * vec3(2.5, 5.0, 2.5) + vec3(uTime * 0.01, 4.0, 0.0)));
        vec3 k = mix(uKind[2] * uKind[2] * 0.6, uKind[0] * 0.9, smoothstep(0.44, 0.54, soil)) * (0.7 + 0.6 * noise(d3 * 18.0));
        k = mix(k, vec3(0.9), cl * 0.8);
        col += uOwn[3] * (k * (day * 1.1 + 0.015 + 0.1 * uLevel) + uKind[1] * 0.8 * pow(1.0 - sat(dot(n, -rd)), 4.0) * (0.15 + day));
      }
      if (uOwn[3] < 0.0) {                     // clear glass: the light behind gathered in it, upside down
        float q = bm / gm, q2 = q * q;
        vec3 gl = mixc * (0.08 + 0.75 * q2 * q2 * q2 * (0.5 + s1)) + corCol * exp(-q2 * 9.0) * (0.35 + 0.8 * uLevel);
        vec3 bk = uOwn[1] != 0.0 ? stage(-pWas * (0.7 + q2)) * (1.0 - 0.5 * q2) : vec3(0.0);
        float sp = sat(dot(reflect(rd, n), normalize(vec3(-0.5, 0.7, -0.5))));
        col += -uOwn[3] * (gl + bk * 0.8 + vec3(0.9) * pow(sp, 60.0) + mixc * 0.2 * pow(sp, 6.0));
      }
    }
  }
  if (uOwn[0] > 0.0) {                         // two smaller stars on their rounds
    for (int k = 0; k < 2; k++) {
      float fk = float(k), a = uTime * (0.07 - 0.02 * fk) + 2.4 + 2.3 * fk, rr = k == 0 ? 1.12 : 1.42, sz = (k == 0 ? 0.17 : 0.1) * uOwn[0];
      vec3 c = vec3(cos(a) * rr, sin(a) * (0.34 - 0.5 * fk), sin(a) * rr * 0.9);
      vec3 rel = c - ro; float tp = dot(rel, rd);
      vec3 off = rel - rd * tp; float l = length(off);
      vec3 hk = rich(mix(k == 0 ? uKind[1] : uKind[3], mixc, 0.2), 1.4);
      float lv = 0.5 + 0.9 * (k == 0 ? uPad : uPhrase);
      float vis = c.z < 0.0 ? 1.0 : behind;
      if (l < sz) {
        vec3 n = (-off - rd * sqrt(max(sz * sz - l * l, 0.0))) / sz;
        float nz = fbm(gSpin * n * 3.0 + fk * 5.0), mu = sat(dot(n, -rd));
        vec3 f = fire(0.25 + 0.7 * nz * (0.6 + lv), hk) * (0.3 + 0.7 * lv) + hk * 0.3 * pow(1.0 - mu, 2.0);
        if (uOwn[3] < 0.0) { float la = sat(dot(n, normalize(vec3(-0.62, 0.5, -0.5)))); f = mix(f, hk * (0.06 + 1.2 * la) + 0.4 * pow(la, 30.0), -uOwn[3]); }
        if (uOwn[3] > 0.0) f *= 1.0 - 0.6 * uOwn[3];
        col = mix(col, f, vis * (1.0 - smoothstep(sz - 0.006, sz, l)) * min(uOwn[0] * 6.0, 1.0));
      } else col += hk * vis * uOwn[0] * exp(-(l - sz) * 11.0) * 0.4 * lv * (1.0 - 0.6 * pale);
    }
  }
  if (uOwn[0] < 0.0) {                         // a girdle of dust
    vec3 dn = normalize(vec3(0.34, 0.9, -0.3));
    float den = dot(rd, dn), tp = -dot(ro, dn) / (abs(den) < 1e-3 ? 1e-3 : den);
    vec3 q = ro + rd * tp; float rr = length(q);
    vec3 ax = normalize(cross(dn, vec3(0, 0, 1))); vec2 uv = vec2(dot(q, ax), dot(q, cross(dn, ax)));
    float an = uTime * 0.12 / max(rr, 0.5), gap = noise(vec2(rr * 26.0, 3.0)) * 0.55 + noise(vec2(rr * 7.0, 8.0)) * 0.6;
    vec2 tu = rot(an - floor(an / TAU) * TAU) * uv;
    float edge = smoothstep(gR * 1.3, gR * 1.42, rr) * (1.0 - smoothstep(gR * 2.3, gR * 3.0, rr));
    float al = edge * smoothstep(0.25, 0.75, gap) * (0.75 + 0.5 * noise(uv * 30.0));
    float hid = tp > tHit || (eclipse && bm < gm && tp > tc) || (eclipse && uOwn[2] != 0.0 && b < gR && tp > tc) ? 0.0 : 1.0;
    float ang = atan(uv.y, uv.x + 1e-6) / TAU + 0.5;
    vec4 pm = piece(vec2(ang, sat(1.0 - (rr / gR - 1.3) / 1.5)));
    vec3 dust = mix(uKind[2], uKind[1], gap) * (0.16 + 0.5 * uLevel + 0.5 * exp(-(rr - gR) * 2.0)) + pm.rgb * 0.7 * smoothstep(0.0, 0.05, ang) * (1.0 - smoothstep(0.95, 1.0, ang));
    if (pale > 0.0) dust *= 1.0 + 0.4 * pale;
    // the ball's shadow lies over the far side of it
    if (uOwn[3] < 0.0) { vec3 sl = normalize(vec3(-0.62, 0.5, -0.5)); float al2 = dot(q, sl); vec3 of = q - sl * al2; dust *= 1.0 + uOwn[3] * 0.85 * (1.0 - smoothstep(gR - 0.05, gR + 0.05, length(of))) * step(al2, 0.0); }
    col = mix(col, dust, -uOwn[0] * 0.92 * al * hid);
  }
  if (uOwn[7] < 0.0) {                         // cloud goes by in front
    float dr = mod(uTime * 0.02, 512.0);
    vec2 q = pWas * vec2(1.5, 4.2) + vec2(dr, 0.35 * sin(uTime * 0.03));
    q += 0.5 * vec2(noise(q * 1.3 + 4.0), noise(q * 1.1 + 11.0));
    float f = fbm(q + 3.0), f2 = fbm(q * 1.6 + vec2(0.1, -0.3) + 7.0), th = smoothstep(0.36, 0.66, f), near = exp(-b * 1.15);
    vec3 lit = corCol * near * (0.75 + 1.2 * uLevel) * (0.25 + 1.6 * th * (1.0 - th)) * (0.6 + 0.8 * f2) + stage(pWas) * (0.35 + 0.5 * f2);
    lit += uKind[0] * uKind[0] * 0.06 * (0.4 + f2);
    col = mix(col, lit, -uOwn[7] * th * 0.95);
  }
  if (uOwn[5] < 0.0) {                         // hills, with mist between
    for (int k = 0; k < 4; k++) {
      float fk = float(k), x = pWas.x * (0.8 + 0.55 * fk) + fk * 5.3;
      float y = -0.5 - 0.33 * uOwn[5] - 0.1 * fk + 0.24 * (noise(vec2(x * 1.3, fk)) - 0.5) * -uOwn[5] + 0.05 * (noise(vec2(x * 4.3, fk + 4.0)) - 0.5) + 0.007 * noise(vec2(x * 26.0, fk)) ;
      float dp = y - pWas.y, mist = noise(vec2(pWas.x * 2.2 + mod(uTime * (0.01 + 0.004 * fk), 512.0), pWas.y * 9.0 + fk)) * 0.6 + 0.4 * noise(vec2(pWas.x * 6.0 - mod(uTime * 0.02, 512.0), pWas.y * 21.0));
      vec3 air = corCol * exp(-length(pWas * vec2(1.0, 1.6) - vec2(0.0, 0.0)) * 1.8) * (0.12 + 0.4 * uLevel) + uKind[1] * uKind[1] * 0.12 + stage(pWas) * (0.75 - 0.15 * fk);
      vec3 land = mix(uKind[2] * uKind[2] * 0.12 + 0.004, air, 0.5 - 0.15 * fk);
      col = mix(col, land + air * (0.5 + 0.7 * mist) * smoothstep(0.02, 0.2, dp) * (0.9 - 0.15 * fk), smoothstep(-1.0, 1.0, dp * uRes.y));
    }
  }
  if (sea > 0.0) {
    float fr = 0.45 + 0.5 * exp(-under * 5.0);
    col = col * fr + (uKind[0] * uKind[0] * 0.05 + 0.004) * (1.0 - fr) + stage(vec2(p.x, 0.4)) * 0.12;
    col *= smoothstep(0.0, 0.012, under) * 0.35 + 0.65;
  }
  return screenOf(col);
}
