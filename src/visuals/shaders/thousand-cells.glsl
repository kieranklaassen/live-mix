// name: Thousand cells
// a: Great cell kite
// b: Long train
// what: A great kite of some two hundred small four-cornered cells in thin rust-red silk hangs tilted in a pale sky, the light coming through so that single cells glow and layered ones go deep; or a train of sixty round painted paper kites on one line, large at lower left, curving up and away over the flats until the last are specks.
// follows: The mix opens the great kite wider, the low band tilts it, each kind of sound dyes its tier; a hit runs through the silk from the near corner, a cue is a gust that swings it. In the train each kite is a moment of the loop: its marks fill as the piece does there, in its colours, and the one playing turns to face you; hits and cues run up the line as light.
float tcPx, tcTall; // a pixel, and how tall the frame is, 0 to 1
// ---- a: the great cell kite. Everything is counted in cells from the four faces of one long tetrahedron.
const int TCN = 18, TCL = 5;
// Which cells are built: the outer walls and the floor of the bank; inside it is hollow.
bool tcCell(ivec4 c) { int k = c.z + c.w; return min(min(c.x, c.y), min(c.z, c.w)) >= 0 && c.x + c.y + k == TCN - 1 && (k == TCL || (k < TCL && min(c.z, c.w) < 1)); }
float tcSeg(vec2 p, vec2 a, vec2 b) { vec2 v = b - a, w = p - a; return length(w - v*sat(dot(w, v)/max(dot(v, v), 1e-6))); }
vec3 tcSky(vec2 p) {
  float g = dot(p, normalize(vec2(0.62, -1.0)));
  vec3 c = mix(vec3(0.56, 0.67, 0.74), vec3(0.88, 0.90, 0.885), smoothstep(-0.75, 0.25, g));
  c = mix(c, vec3(0.97, 0.94, 0.87), smoothstep(0.1, 0.85, g));
  // high thin cloud, combed one way
  vec2 w = rot(0.42)*p;
  w.y += 0.05*sin(w.x*3.1 + 1.0);
  float n = noise(vec2(w.x*1.2 + uTime*0.006, w.y*9.0)), st = noise(vec2(w.x*2.2 + uTime*0.009 + n*1.5, w.y*46.0 + w.x*3.0));
  n = smoothstep(0.25, 0.85, n)*(0.35 + 0.65*st) + 0.25*st*smoothstep(0.35, 0.6, n);
  return mix(c, vec3(0.975, 0.97, 0.95), 0.6*n*(1.0 - smoothstep(0.0, 0.6, abs(w.y - 0.12))));
}
vec3 tcKite(vec2 p) {
  float lv[6] = float[6](max(uKeys, 0.6*uHits), uHits, uPhrase, uTexture, uPad, uDrone);
  vec3 sky = tcSky(p), bg = pow(sky, vec3(2.2));
  float gust = 4.0*uCue*(1.0 - uCue);
  // the frame, opened sideways by the mix, then turned and tilted
  float open = 0.97 + 0.09*uLevel;
  float ya = 0.74 + 0.07*sin(uTime*0.061) - 0.16*gust;
  float ta = -0.52 + 0.04*sin(uTime*0.083 + 1.0) - 0.06*uLow - 0.10*gust;
  float ro = 0.21 + 0.03*sin(uTime*0.047 + 2.0) + 0.08*gust - 0.42*tcTall;
  mat3 Ry = mat3(cos(ya), 0, -sin(ya), 0, 1, 0, sin(ya), 0, cos(ya));
  mat3 Rx = mat3(1, 0, 0, 0, cos(ta), sin(ta), 0, -sin(ta), cos(ta));
  mat3 Rz = mat3(cos(ro), sin(ro), 0, -sin(ro), cos(ro), 0, 0, 0, 1);
  mat3 R = Rz*Rx*Ry;
  vec3 S = vec3(open, 1.0/open, 1.0)*2.2, O = vec3(-0.13, 0.07 + 0.012*sin(uTime*0.11), 2.45), M = vec3(0.0, 0.22, 0.0);
  vec3 A = R*(S*(vec3(-0.5, 0.3535, 0.0) - M)) + O, B = R*(S*(vec3(0.5, 0.3535, 0.0) - M)) + O;
  vec3 C = R*(S*(vec3(0.0, -0.3535, -0.5) - M)) + O, D = R*(S*(vec3(0.0, -0.3535, 0.5) - M)) + O;
  mat3 W = inverse(mat3(B - A, C - A, D - A))*float(TCN);
  const float foc = 1.62;
  vec3 rd = vec3(p, foc);
  // where the ray starts, how it runs and how much a pixel is, in cells from each of the four faces
  vec3 q3 = -W*A, d3 = W*rd, x3 = W[0], y3 = W[1];
  vec4 q0 = vec4(float(TCN) - q3.x - q3.y - q3.z, q3), dq = vec4(-d3.x - d3.y - d3.z, d3);
  vec4 gx = vec4(-x3.x - x3.y - x3.z, x3)*tcPx, gy = vec4(-y3.x - y3.y - y3.z, y3)*tcPx;
  dq += (step(0.0, dq)*2.0 - 1.0)*1e-5;
  vec4 at = -q0/dq;
  float tn = 0.0, tf = 1e3;
  for (int k = 0; k < 4; k++) { if (dq[k] > 0.0) tn = max(tn, at[k]); else tf = min(tf, at[k]); }
  float dl = dq.z + dq.w; dl += dl < 0.0 ? -1e-5 : 1e-5;
  float lt = (float(TCL + 1) - q0.z - q0.w)/dl;
  if (dl < 0.0) tn = max(tn, lt); else tf = min(tf, lt);
  vec3 tr = vec3(1.0), add = vec3(0.0);
  tn -= 0.003; tf += 0.003;
  if (tn < tf) {
    vec2 sg = sign(dq.xy), ix = sg*ceil(sg*(q0.xy + dq.xy*tn));
    for (int s = 0; s < 2*TCN; s++) {
      vec2 t2 = (ix - q0.xy)/dq.xy;
      bool fa = t2.x < t2.y;
      float t = fa ? t2.x : t2.y;
      if (t > tf || tr.x < 0.02) break;
      vec4 q = q0 + dq*t, f;
      if (fa) { f = floor(vec4(ix.x + 0.5, q.yzw)); ix.x += sg.x; } else { f = floor(vec4(q.x, ix.y + 0.5, q.zw)); ix.y += sg.y; }
      ivec4 c = ivec4(f);
      if (!tcCell(c)) continue;
      vec3 b = fa ? q.yzw - f.yzw : q.xzw - f.xzw;       // the place in the triangle of silk
      vec3 r = fa ? dq.yzw/dq.x : dq.xzw/dq.y;
      vec3 ux = fa ? gx.yzw - r*gx.x : gx.xzw - r*gx.y, uy = fa ? gy.yzw - r*gy.x : gy.xzw - r*gy.y;
      vec3 e = b/(t*sqrt(ux*ux + uy*uy) + 1e-5);         // pixels from each of its sides
      float m = min(e.x, min(e.y, e.z)), cov = sat(m + 0.5);
      float own = hash31(f.xyz*1.7 + (fa ? 3.0 : 11.0));
      float br = sin(uTime*(0.35 + 0.3*own) + own*40.0);
      float bel = 27.0*b.x*b.y*b.z;
      float along = f.x/float(TCN);
      int tier = c.z + c.w;
      float k = float(tier)/float(TCL);
      // this tier's sound dyes the sunlit side of its cells, one by one
      float on = smoothstep(-0.25, 0.25, lv[tier]*1.0 - 0.15 - own*1.0);
      vec3 kc = kindColour(tier == 0 ? 4.0 : 5.0 - float(tier)); kc -= 0.4*min(kc.r, min(kc.g, kc.b)); kc = kc*kc; kc /= max(max(kc.r, kc.g), max(kc.b, 0.02));
      // a hit runs through the silk from the near corner, a cue's gust more slowly and broadly
      float away = 0.75*along + 0.25*(1.0 - k), ring = away - 1.2*(1.0 - uHits) - 0.08, wide = away - 1.2*(1.0 - uCue) - 0.12;
      float hit = uHits*exp(-ring*ring*70.0) + 0.45*uCue*exp(-wide*wide*12.0);
      vec3 dye = mix(mix(vec3(0.92, 0.20, 0.06), vec3(0.80, 0.08, 0.05), fract(own*7.7)), mix(vec3(0.5, 0.12, 0.04), kc*kc*0.72, 0.8), on*(fa ? 0.25 : 0.8));
      float air = 1.0 - sat((t - 0.9)*(0.25 + 0.3*uSpace));   // far silk is paler
      vec3 T = exp(-(0.12 + 2.3*(1.0 - dye))*(0.8 + 0.4*own)*air);
      float L = (fa ? 0.17 : 0.04)*(0.75 + 0.5*own)*(1.0 - 0.35*k) + (fa ? 0.10 : 0.04)*(b.x - b.z)*(1.0 + (0.5 + 1.5*uMic)*br) + 0.04*bel;
      L = max(L, 0.01)*(0.6 + 0.8*uTone)*(1.0 + 2.2*on*uEnergy + 0.5*band(abs(2.0*along - 1.0))*uEnergy) + 0.4*hit;
      add += tr*cov*dye*L + tr*cov*0.10*hit;
      tr *= mix(vec3(1.0), T, cov);
      float sp = sat(1.15 - abs(m - 0.5))*step(-0.5, m);
      tr *= 1.0 - 0.5*sp;
    }
  }
  // the bare spars that run the whole length of the wing
  float sd = 1.0, lw = float(TCL + 1)/float(TCN);
  for (int c = 0; c <= TCL; c++) for (int d = 0; d <= TCL - c; d++) {
    if (c + d < TCL && min(c, d) > 0) continue;
    float n = float(TCN - c - d);
    vec3 b0 = A + ((C - A)*float(c) + (D - A)*float(d))/float(TCN), b1 = b0 + (B - A)*n/float(TCN);
    sd = min(sd, tcSeg(p, b0.xy*foc/b0.z, b1.xy*foc/b1.z));
  }
  vec3 E[6] = vec3[6](A, A + (C - A)*lw, A + (D - A)*lw, B, B + (C - B)*lw, B + (D - B)*lw);
  vec2 V[6];
  for (int k = 0; k < 6; k++) V[k] = E[k].xy*foc/E[k].z;
  for (int k = 0; k < 3; k++) sd = min(sd, min(tcSeg(p, V[k], V[k == 2 ? 0 : k + 1]), tcSeg(p, V[k + 3], V[k == 2 ? 3 : k + 4])));
  // the bridle and the line that holds it
  vec3 k0 = O + R*(S*vec3(0.02, -0.285, -0.20)), k1 = mix(E[1], E[4], 0.25), k2 = mix(E[1], E[4], 0.75);
  vec2 h0 = k0.xy*foc/k0.z;
  sd = min(sd, 0.35*tcPx + min(tcSeg(p, k1.xy*foc/k1.z, h0), tcSeg(p, k2.xy*foc/k2.z, h0)));
  float dn = h0.y - p.y, lx = h0.x - 0.35*dn - 0.5*dn*dn;
  if (dn > 0.0) sd = min(sd, 0.2*tcPx + abs(p.x - lx)/sqrt(1.0 + pow(0.35 + dn, 2.0)));
  float spar = sat(1.15 - sd/tcPx);
  tr *= 1.0 - 0.6*spar; add *= 1.0 - 0.5*spar;
  return pow(bg*tr + add, vec3(0.4545));
}
// ---- b: the long train. Sixty round paper kites on one line.
float tcGust; vec2 tcK0, tcK1, tcK2, tcK3;
// Which place on the line kite i has, 0 at our hand's end to 1 at the far end.
float tcS(float i) { return 1.2*i/(i + 11.8); }
// The line on the screen: one hanging curve, the slow wave that runs up it, and the gust.
void tcLine() {
  float l = 0.05*uLow;
  vec2 a = vec2(-0.66, -0.17), b = 3.0*vec2(-0.12, -0.60 + l), c = 3.0*vec2(1.10, -0.12 + l), d = vec2(0.06, 0.39 + 0.4*l);
  vec3 w = vec3(0.006, 0.05, 0.02)*sin(uTime*vec3(0.31, 0.23, 0.17) + vec3(0.0, 2.0, 4.2));
  vec2 o = vec2(0.5, 1.0), g = tcGust*vec2(0.10, 0.12);
  tcK0 = a + o*w.x; tcK1 = b - 3.0*a + o*(w.y - 2.0*w.x) + 1.6*g;
  tcK2 = 3.0*a - 2.0*b + c + o*(w.x - w.y + w.z) - 4.1*g; tcK3 = b - a - c + d + 2.5*g;
  vec2 st = vec2(1.0 - 0.28*tcTall, 1.0 + 0.9*tcTall); // a tall frame draws it upright
  tcK0 = tcK0*st + vec2(0.0, 0.3*(st.y - 1.0)); tcK1 *= st; tcK2 *= st; tcK3 *= st;
}
vec2 tcAt(float s) { return tcK0 + s*(tcK1 + s*(tcK2 + s*tcK3)); }
vec3 tcDusk(vec2 p) {
  float h = p.y + 0.5;
  vec3 c = mix(vec3(0.93, 0.89, 0.80), vec3(0.74, 0.82, 0.82), smoothstep(0.0, 0.75, h - 0.15*p.x));
  c = mix(c, vec3(0.50, 0.64, 0.70), smoothstep(0.35, 1.25, h - 0.2*p.x));
  // a low coast far off, and the flats in front of it
  if (h < 0.15) {
    float y = 0.092 + 0.018*noise(vec2(p.x*2.3, 1.0)) + 0.010*noise(vec2(p.x*11.0, 4.0)) - 0.02*p.x;
    c = mix(c, mix(vec3(0.70, 0.77, 0.78), c, 0.35), smoothstep(-tcPx, tcPx, y - h));
    float f = 0.088 - h;
    vec3 fl = mix(vec3(0.87, 0.83, 0.74), vec3(0.70, 0.70, 0.64), smoothstep(0.0, 0.09, f));
    fl *= 0.96 + 0.08*noise(vec2(p.x*3.0, 30.0*log(0.02 + max(f, 0.0))));
    c = mix(c, fl, smoothstep(-tcPx, tcPx, f));
  }
  return c;
}
// The piece at a place in the loop and a depth of the room: a deep ink of its colour, and how loud.
vec4 tcInk(float x, float y) {
  vec4 m = piece(vec2(x, y));
  vec3 c = max(m.rgb - 0.55*min(m.r, min(m.g, m.b)), 0.0);   // where two sounds lie on one another the paint stays clean
  c /= max(max(c.r, c.g), max(c.b, 0.02)); c = c*c*c + 0.02;
  return vec4(c*0.14/dot(c, vec3(0.28, 0.48, 0.24)), sat(m.a*1.3));
}
vec3 tcTrain(vec2 p) {
  float lv[5] = float[5](uDrone, uPad, uTexture, max(uPhrase, uMic), uKeys);
  tcGust = 4.0*uCue*(1.0 - uCue);
  tcLine();
  vec3 bg = pow(tcDusk(p), vec3(2.2)), add = vec3(0.0), tr = vec3(1.0);
  float here = smoothstep(0.0, 0.07, uLoop)*(1.0 - smoothstep(0.93, 1.0, uLoop));
  float sw = sin(uTime*0.37);
  const vec3 lineCol = vec3(0.13, 0.09, 0.07);
  vec2 c = tcAt(0.0);
  // which kites can touch this pixel: the line is tried in fifteen lengths of four
  int i0 = 60, i1 = 0;
  for (int g = 0; g < 15; g++) {
    float g0 = 4.0*float(g), rg = 1.0/(1.0 + g0/11.8);
    vec2 ce = tcAt(tcS(g0 + 4.0)), cm = 0.5*(c + ce), gv = p - cm, hv = ce - c;
    float hb = 0.52*length(hv) + 0.44*rg*rg + 3.0*tcPx;
    c = ce;
    if (dot(gv, gv) < hb*hb) { i0 = min(i0, 4*g); i1 = 4*g + 4; }
  }
  vec2 n = tcAt(tcS(float(i0)));
  for (int i = i0; i < i1; i++) {
    float fi = float(i), s = tcS(fi), r = 1.0/(1.0 + fi/11.8); r *= 0.205*r;
    vec2 c0 = n, v = p - c0;
    n = tcAt(tcS(fi + 1.0));
    if (dot(v, v) > 4.6*r*r + 9.0*tcPx*tcPx) continue;
    vec2 T = normalize(n - c0 + 1e-6), N = vec2(-T.y, T.x);
    float haze = s*s*(0.10 + 0.5*uSpace), px = tcPx/r;
    float df = (s - uLoop)/0.07, face = here*exp(-df*df);
    float hs = (s - (1.0 - uHits)*1.1)/0.09, hc = (s - (1.0 - uCue)*1.1 - 0.08)/0.22, hit = uHits*exp(-hs*hs) + 0.7*uCue*exp(-hc*hc);
    float ratio = mix(0.60 + 0.08*sw*(1.0 - fi*0.03) + 0.12*tcGust, 1.0, face);
    float u = dot(v, N)/r, w = dot(v, T)/(r*ratio), d = length(vec2(u, w));
    if (d < 1.0 + 2.0*px/ratio) {
      float dd = (1.0 - d)*d/max(length(vec2(u, w/ratio)), 1e-3)/px;  // pixels in from the rim
      int j = int(fi), k = (j*3 + ((j*j) >> 2))%5, kind = j%3;
      vec3 ink = k == 0 ? vec3(0.03, 0.06, 0.19) : k == 1 ? vec3(0.46, 0.035, 0.02) : k == 2 ? vec3(0.58, 0.24, 0.02) : k == 3 ? vec3(0.025, 0.022, 0.025) : vec3(0.03, 0.15, 0.11);
      // paper, lit from behind
      float fib = 0.93 + 0.14*noise(vec2(u*9.0 + fi*7.0, w*23.0));
      vec3 pap = vec3(1.02, 0.90, 0.67)*fib*(0.79 + 0.10*uTone + 0.14*w + 0.12*u + 0.25*face);
      pap += (pap*lv[k]*0.5*uEnergy + 0.22*hit)*vec3(1.0, 0.9, 0.7);
      // its mark, as full as the piece is at its moment: a depth at the back of the room in the ring or half disc, one at the front in the heart
      int l = (j + j/3)%3;
      vec4 far = tcInk(0.02 + 0.96*s, l == 0 ? 0.84 : l == 1 ? 0.53 : 0.67), near = tcInk(0.02 + 0.96*s, (j & 1) == 0 ? 0.21 : 0.36);
      float wob = 0.04*(noise(vec2(u*4.0, w*4.0) + fi*3.0) - 0.5);
      float ring = kind == 1 ? min(w + wob*1.6 - 0.06 + 0.35*far.a, 0.88 - d - wob) : 0.10 + (kind == 0 ? 0.0 : -0.04) + 0.13*far.a - abs(d - 0.68 + wob);
      float heart = (kind == 2 ? 0.20 : 0.0) - 0.04 + 0.34*near.a - d + wob;
      float aa = px/ratio*0.7 + 0.01;
      vec3 i0 = mix(ink, far.rgb, smoothstep(0.02, 0.14, far.a)), i1 = mix(ink, near.rgb, smoothstep(0.02, 0.14, near.a));
      float lit = (0.65 + 0.55*fib)*(0.9 + 0.5*face);
      pap = mix(pap, i0*lit*(1.0 + 0.35*smoothstep(0.0, 0.07, ring)), smoothstep(-aa, aa, ring)*0.96);
      pap = mix(pap, i1*lit*(1.0 + 0.35*smoothstep(0.0, 0.07, heart)), smoothstep(-aa, aa, heart)*0.96);
      pap *= 1.0 - 0.5*sat(1.4 - abs(dd - 1.2)/max(1.0, 0.012/px));
      pap *= 1.0 - 0.25*(1.0 - smoothstep(0.03, 0.03 + px, abs(w)));  // the pole seen through the paper
      float alpha = sat(dd + 0.5)*0.94;
      add += tr*mix(pap, bg, haze)*alpha; tr *= 1.0 - alpha;
    }
    // the pole, bent by the wind, and the plumes at its ends
    float au = abs(u), wp = w*ratio - 0.05*u*u;
    if (abs(wp) < 0.14 + 2.0*px) {
      float q = sat((au - 1.42)/0.60), fw = (0.02 + 0.085*q)*(1.0 - q*q*q*q*q);
      float pa = sat(0.85 + (0.017 - 0.006*au)/px - abs(wp)/px)*step(au, 1.50)*0.85;
      float tu = q > 0.0 && q < 1.0 ? sat(0.5 + (fw - abs(wp - 0.12*q*q))/px)*0.9 : 0.0;
      add += tr*mix(lineCol, bg, haze)*pa; tr *= 1.0 - pa;
      add += tr*mix(mix(vec3(0.42, 0.13, 0.06), vec3(0.96, 0.90, 0.78), smoothstep(0.1, 0.45, q + 4.0*abs(wp - 0.12*q*q)))*(0.92 + 0.10*(1.0 - smoothstep(0.007, 0.02, px))*sin(60.0*q + 180.0*abs(wp))), bg, haze)*tu; tr *= 1.0 - tu;
    }
    // three lines to the next
    float al = dot(v, T)/r;
    if (al > 0.0 && al < 0.96) {
      float la = sat(1.0 - min(abs(u), abs(abs(u) - 0.92 + 0.13*al))/px)*mix(0.6, 0.25, s);
      add += tr*mix(lineCol, bg, haze)*la; tr *= 1.0 - la;
    }
    if (tr.x < 0.01) break;
  }
  return pow(bg*tr + add, vec3(0.4545));
}
vec3 render(vec2 p) {
  tcTall = 1.0 - smoothstep(0.6, 1.3, uRes.x/uRes.y);
  float off = 1.0 + 1.1*tcTall;
  tcPx = off/uRes.y;
  p = p*off + (uVar < 0.5 ? vec2(0.045, 0.0)*tcTall : vec2(-0.13, 0.1)*tcTall);
  vec3 c;
  if (uVar < 0.5) c = tcKite(p); else c = tcTrain(p);
  return clamp(c, 0.0, 1.0);
}
