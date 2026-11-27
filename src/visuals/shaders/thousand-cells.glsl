// name: Thousand cells
// a: Great cell kite
// b: Long train
// what: A great kite of some two hundred small four-cornered cells in thin rust-red silk hangs tilted in a pale sky, the light coming through so that single cells glow and layered ones go deep; or a train of sixty round painted paper kites on one line, large at lower left, curving up and away over the flats until the last are specks.
// follows: The mix opens the great kite wider, the low band tilts it, each kind of sound dyes its tier; a hit runs through the silk from the near corner, a cue is a gust that swings it. In the train each kite is a moment of the loop: its marks fill as the piece does there, in its colours, and the one playing turns to face you; hits and cues run up the line as light.
// own: 0 1 the kite is built up into a whole pyramid of cells (b: many more kites, close together), -1 a few great cells near to us (b: few kites, far apart); 1 1 each cell a round disc (b: four-cornered kites), -1 bare frames with no silk (b: kites with petals like flowers); 2 1 night, each lit from inside, -1 plain paper behind; 3 1 a great low sun behind, -1 ranges of hills in mist below; 4 1 seen from right underneath (b: the line winds straight up), -1 seen from the end (b: the line is an arch over the land); 5 1 dyed in the colours of the sounds, -1 undyed white; 6 1 long streamers (b: a fringe of plumes all round), -1 torn, many cells gone; 7 1 over still water that mirrors it, -1 it turns, slowly and on and on
float tcPx, tcTall; // a pixel, and how tall the frame is, 0 to 1
// ---- a: the great cell kite. Everything is counted in cells from the four faces of one long tetrahedron.
const int TCN = 18, TCL = 5;
// Which cells are built: the outer walls and the floor of the bank; inside it is hollow.
bool tcCell(ivec4 c) { int k = c.z + c.w; return min(min(c.x, c.y), min(c.z, c.w)) >= 0 && c.x + c.y + k == TCN - 1 && (k == TCL || (k < TCL && min(c.z, c.w) < 1)); }
float tcSeg(vec2 p, vec2 a, vec2 b) { vec2 v = b - a, w = p - a; return length(w - v*sat(dot(w, v)/max(dot(v, v), 1e-6))); }
vec3 tcSkyWas(vec2 p) {
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
// What lies behind, where it is not the plain sky: p is the place, c what was there.
vec3 tcBehind(vec3 c, vec2 p) {
  if (uOwn[5] > 0.0) {
    float l = dot(c, vec3(0.3, 0.55, 0.15));
    c = mix(c, mix(uKind[1], vec3(1.0), 0.35 + 0.45*(1.0 - smoothstep(-0.5, 0.1, p.y)))*(0.35 + 0.72*l), 0.75*uOwn[5]);
  }
  if (uOwn[2] > 0.0) {
    float h = sat(0.5 - p.y);
    vec3 n = mix(vec3(0.02, 0.03, 0.06), vec3(0.05, 0.075, 0.12), h*h) + uKind[0]*(0.03 + 0.10*h*h*h);
    vec2 g = p*46.0, v = fract(g) - 0.5; float r = hash21(floor(g));
    n += vec3(0.75, 0.78, 0.8)*(1.0 - smoothstep(0.02, 0.08, length(v - 0.6*(hash22(floor(g) + 3.0) - 0.5))))*step(0.9, r)*(0.25 + 4.0*(r - 0.9))*smoothstep(-0.3, 0.2, p.y);
    c = mix(c, n, uOwn[2]);
  }
  if (uOwn[2] < 0.0) {
    float f = noise(p*vec2(70.0, 240.0)) + noise(rot(1.0)*p*vec2(60.0, 300.0));
    c = mix(c, vec3(0.93, 0.905, 0.85)*(0.97 + 0.025*f) - 0.06*dot(p, p), -uOwn[2]);
  }
  if (uOwn[3] > 0.0) {
    vec2 d = p - (uVar < 0.5 ? vec2(0.1, -0.04) : vec2(0.2, 0.06)); float l = length(d);
    vec3 warm = mix(vec3(1.0, 0.72, 0.42), mix(uKind[4], uKind[3], 0.35), max(uOwn[5], 0.0)), disc = mix(vec3(1.0, 0.93, 0.74), mix(uKind[4], vec3(1.0), 0.25), max(uOwn[5], 0.0));
    c = mix(c, warm*(0.85 + 0.2*uLevel), uOwn[3]*0.75*exp(-l*l*3.2)*(1.0 - 0.6*max(uOwn[2], 0.0)));
    c = mix(c, disc, uOwn[3]*(1.0 - smoothstep(0.268, 0.272, l))*(0.86 + 0.14*smoothstep(-0.25, 0.2, d.y)));
  }
  if (uOwn[3] < 0.0) {
    vec3 far = mix(c, vec3(0.75), 0.15), near = mix(vec3(0.16, 0.21, 0.22), uKind[0]*0.35, 0.6)*(1.0 - 0.7*max(uOwn[2], 0.0));
    for (int i = 0; i < 4; i++) {
      float f = float(i), x = p.x*(0.9 + 0.35*f) + f*7.3 + 0.004*uTime*(f + 1.0)*0.3;
      float y = -0.13 - 0.105*f + (0.17 - 0.025*f)*(noise(vec2(x*2.1, f)) - 0.5) + 0.05*noise(vec2(x*6.0, f + 9.0)) + 0.012*noise(vec2(x*24.0, f));
      float in_ = (1.0 - smoothstep(-tcPx, tcPx, p.y - y));
      vec3 k = mix(far, near, 0.22 + 0.24*f);
      k = mix(k, far, 0.75*sat((y - p.y)*5.0));          // mist lies in the valleys
      c = mix(c, k, in_*min(1.0, -uOwn[3]*2.0));
    }
  }
  return c;
}
vec3 tcSky(vec2 p) {
  vec3 c = tcSkyWas(p);
  if (uOwn[5] > 0.0 || uOwn[2] != 0.0 || uOwn[3] != 0.0) c = tcBehind(c, p);
  return c;
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
  float big = max(uOwn[0], 0.0), few = max(-uOwn[0], 0.0), under = max(uOwn[4], 0.0), end_ = max(-uOwn[4], 0.0);
  if (uOwn[4] != 0.0) { ya = mix(ya, 0.04*sin(uTime*0.061), under) + 0.62*end_; ta += -0.78*under + 0.34*end_; ro = mix(ro, 0.03*sin(uTime*0.047), under) - 0.16*end_; }
  if (uOwn[7] < 0.0) ya += -uOwn[7]*uTime*0.16;
  mat3 Ry = mat3(cos(ya), 0, -sin(ya), 0, 1, 0, sin(ya), 0, cos(ya));
  mat3 Rx = mat3(1, 0, 0, 0, cos(ta), sin(ta), 0, -sin(ta), cos(ta));
  mat3 Rz = mat3(cos(ro), sin(ro), 0, -sin(ro), cos(ro), 0, 0, 0, 1);
  mat3 R = Rz*Rx*Ry;
  vec3 S = vec3(open, 1.0/open, 1.0)*2.2*(1.0 + 0.75*few), O = vec3(-0.13, 0.07 + 0.012*sin(uTime*0.11), 2.45), M = vec3(0.0, 0.22 - 0.22*big, 0.0);
  if (uOwn[0] > 0.0 || uOwn[4] > 0.0) { O.z += 1.05*big; O.y += 0.05*big; O.xy += vec2(0.13, -0.02)*max(big, under); }
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
  float built = float(TCL + 1); if (uOwn[0] > 0.0) built += ceil(12.0*uOwn[0]);
  float lt = (built - q0.z - q0.w)/dl;
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
      float pr = 1.0;
      if (uOwn[0] == 0.0 && uOwn[6] >= 0.0) { if (!tcCell(c)) continue; }
      else {                                              // how much of this cell there is
        int k = c.z + c.w;
        if (min(min(c.x, c.y), min(c.z, c.w)) < 0 || c.x + c.y + k != TCN - 1) continue;
        bool wall = min(c.z, c.w) < 1, floor_ = k == TCL;
        pr = k > TCL ? (wall ? sat(13.0*big - float(k - TCL - 1)) : 0.0) : wall ? 1.0 : floor_ ? 1.0 - sat(3.0*big) : 0.0;
        if (uOwn[0] < 0.0) pr *= sat((mix(1.3, 0.3, few) - abs(2.0*(f.x + 0.5)/float(TCN - k) - 1.0))*9.0);
        if (uOwn[6] < 0.0) pr *= sat((hash31(f.xyz*2.3 + 5.0) + 0.08 + 0.73*uOwn[6])*12.5);
        if (pr <= 0.01) continue;
      }
      vec3 b = fa ? q.yzw - f.yzw : q.xzw - f.xzw;       // the place in the triangle of silk
      vec3 r = fa ? dq.yzw/dq.x : dq.xzw/dq.y;
      vec3 ux = fa ? gx.yzw - r*gx.x : gx.xzw - r*gx.y, uy = fa ? gy.yzw - r*gy.x : gy.xzw - r*gy.y;
      vec3 e = b/(t*sqrt(ux*ux + uy*uy) + 1e-5);         // pixels from each of its sides
      float m = min(e.x, min(e.y, e.z));
      float dim = 1.0;
      if (pr < 1.0 || uOwn[1] > 0.0) {                    // smaller, or round
        float sc = dot(e, vec3(1.0)), mb = min(b.x, min(b.y, b.z));
        mb = mix(mb, (0.36 - length(b - 1.0/3.0))*0.82, max(uOwn[1], 0.0));
        m = (mb - (1.0 - pr)/3.0)*sc;
        vec3 thin = e/max(b, 1e-4);                        // seen from its edge it fades and does not break into dots
        dim = smoothstep(0.02, 0.25, pr)*mix(1.0, sat(0.5*min(thin.x, min(thin.y, thin.z))), max(uOwn[1], 0.0));
      }
      float cov = sat(m + 0.5)*dim;
      float own = hash31(f.xyz*1.7 + (fa ? 3.0 : 11.0));
      float br = sin(uTime*(0.35 + 0.3*own) + own*40.0);
      float bel = 27.0*b.x*b.y*b.z;
      float along = f.x/float(TCN);
      int tier = c.z + c.w;
      float k = float(tier)/float(TCL);
      // this tier's sound dyes the sunlit side of its cells, one by one
      float tt = float(tier); if (uOwn[0] > 0.0) { tt = min(tt*mix(1.0, 5.0/17.0, big), 5.0); k = tt/float(TCL); }
      int ti = int(tt + 0.5);
      float on = smoothstep(-0.25, 0.25, lv[ti]*1.0 - 0.15 - own*1.0);
      vec3 kc = kindColour(ti == 0 ? 4.0 : 5.0 - float(ti)); kc -= 0.4*min(kc.r, min(kc.g, kc.b)); kc = kc*kc; kc /= max(max(kc.r, kc.g), max(kc.b, 0.02));
      // a hit runs through the silk from the near corner, a cue's gust more slowly and broadly
      float away = 0.75*along + 0.25*(1.0 - k), ring = away - 1.2*(1.0 - uHits) - 0.08, wide = away - 1.2*(1.0 - uCue) - 0.12;
      float hit = uHits*exp(-ring*ring*70.0) + 0.45*uCue*exp(-wide*wide*12.0);
      vec3 dye = mix(mix(vec3(0.92, 0.20, 0.06), vec3(0.80, 0.08, 0.05), fract(own*7.7)), mix(vec3(0.5, 0.12, 0.04), kc*kc*0.72, 0.8), on*(fa ? 0.25 : 0.8));
      vec3 kk = vec3(0.0);
      if (uOwn[5] > 0.0) { kk = uKind[(ti + int(own*1.35) + 4)%5]; kk = kk*kk*mix(0.8, 1.25, on); dye = mix(dye, min(kk, 0.97), uOwn[5]); }
      if (uOwn[5] < 0.0) dye = mix(dye, mix(vec3(0.93, 0.91, 0.87), kc*0.5 + 0.45, 0.35*on), -uOwn[5]);
      float air = 1.0 - sat((t - 0.9)*(0.25 + 0.3*uSpace));   // far silk is paler
      vec3 T = exp(-(0.12 + 2.3*(1.0 - dye))*(0.8 + 0.4*own)*air);
      float L = (fa ? 0.17 : 0.04)*(0.75 + 0.5*own)*(1.0 - 0.35*k) + (fa ? 0.10 : 0.04)*(b.x - b.z)*(1.0 + (0.5 + 1.5*uMic)*br) + 0.04*bel;
      L = max(L, 0.01)*(0.6 + 0.8*uTone)*(1.0 + 2.2*on*uEnergy + 0.5*band(abs(2.0*along - 1.0))*uEnergy) + 0.4*hit;
      if (uOwn[2] > 0.0) L += uOwn[2]*(0.18 + 0.2*own + 0.5*on*(0.5 + uEnergy))*(0.5 + 0.9*bel)*air;
      if (uOwn[0] > 0.0) L += 0.5*big*on*(0.4 + uEnergy)*(fa ? 1.0 : 0.6);
      if (uOwn[5] < 0.0) L += 0.2*-uOwn[5]*(0.4 + own)*(fa ? 1.0 : 0.35)*(1.0 - 0.6*max(uOwn[2], 0.0));
      float bare = max(-uOwn[1], 0.0);
      if (bare > 0.0) { L *= 1.0 - bare*(1.0 - 0.15*on); T = mix(T, vec3(1.0), bare*(1.0 - 0.16*on)); }
      add += tr*cov*dye*L + tr*cov*0.10*hit;
      tr *= mix(vec3(1.0), T, cov);
      float sp = sat(1.15 - abs(m - 0.5))*step(-0.5, m);
      if (bare > 0.0) {
        sp = mix(sp, sat(1.9 - abs(m - 0.9))*step(-0.5, m), bare);
        add += tr*sp*bare*dye*(0.08 + 0.5*on*uEnergy + 1.0*hit)*(0.4 + 0.9*max(uOwn[2], 0.0));
        tr *= 1.0 - 0.3*sp*bare;
      }
      tr *= 1.0 - 0.5*sp;
    }
  }
  // the bare spars that run the whole length of the wing
  float sd = 1.0, lw = float(TCL + 1)/float(TCN);
  for (int c = 0; c <= TCL; c++) for (int d = 0; d <= TCL - c; d++) {
    if (c + d < TCL && min(c, d) > 0) continue;
    float n = float(TCN - c - d);
    vec3 b0 = A + ((C - A)*float(c) + (D - A)*float(d))/float(TCN), b1 = b0 + (B - A)*n/float(TCN);
    if (uOwn[0] < 0.0) { vec3 bm = 0.5*(b0 + b1); b0 = mix(b0, bm, 0.66*few); b1 = mix(b1, bm, 0.66*few); }
    sd = min(sd, tcSeg(p, b0.xy*foc/b0.z, b1.xy*foc/b1.z));
  }
  if (uOwn[0] > 0.0) lw = mix(lw, 1.0, uOwn[0]);
  vec3 E[6] = vec3[6](A, A + (C - A)*lw, A + (D - A)*lw, B, B + (C - B)*lw, B + (D - B)*lw);
  if (uOwn[0] < 0.0) for (int k = 0; k < 3; k++) { vec3 em = 0.5*(E[k] + E[k + 3]); E[k] = mix(E[k], em, 0.66*few); E[k + 3] = mix(E[k + 3], em, 0.66*few); }
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
  if (uOwn[2] > 0.0) add += 0.05*spar*uOwn[2];
  if (uOwn[6] > 0.0) {                                    // streamers from its corners
    for (int k = 0; k < 6; k++) {
      float fk = float(k), len = (0.34 + 0.3*fract(fk*0.618))*uOwn[6]*(1.0 + 0.3*few), dn = V[k].y - p.y + 0.004;
      if (dn < 0.0 || dn > len) continue;
      float q = dn/len, x = V[k].x - 0.55*dn*(0.6 + q) + (0.016 + 0.05*q)*q*sin(dn*17.0 - uTime*0.9 + fk*2.0);
      float tw = cos(dn*21.0 - uTime*0.7 + fk*1.7), w = 0.0015 + 0.014*abs(tw)*(1.0 - 0.75*q)*smoothstep(0.0, 0.05, q);
      float a = sat(0.5 + (w - abs(p.x - x)*0.86)/tcPx)*(1.0 - smoothstep(0.75, 1.0, q));
      vec3 c = mix(vec3(0.72, 0.12, 0.06), uKind[k%5]*uKind[k%5], max(uOwn[5], 0.0)); c = mix(c, vec3(0.9, 0.88, 0.84), max(-uOwn[5], 0.0));
      tr *= mix(vec3(1.0), c*0.75 + 0.06, a); add += c*a*(0.05 + 0.06*tw + 0.35*lv[k]*uEnergy + 0.25*max(uOwn[2], 0.0));
    }
  }
  return pow(bg*tr + add, vec3(0.4545));
}
// ---- b: the long train. Sixty round paper kites on one line.
float tcGust; vec2 tcK0, tcK1, tcK2, tcK3;
// Which place on the line kite i has, 0 at our hand's end to 1 at the far end.
float tcDeep;                    // after how many kites the next is half as large again
float tcS(float i) { return 1.2*i/(i + tcDeep); }
// The line on the screen: one hanging curve, the slow wave that runs up it, and the gust.
void tcLine() {
  float l = 0.05*uLow;
  tcDeep = 11.8; if (uOwn[0] != 0.0) tcDeep *= exp2(uOwn[0]);
  vec2 a = vec2(-0.66, -0.17), b = 3.0*vec2(-0.12, -0.60 + l), c = 3.0*vec2(1.10, -0.12 + l), d = vec2(0.06, 0.39 + 0.4*l);
  if (uOwn[4] > 0.0) { a = mix(a, vec2(-0.34, -0.31), uOwn[4]); b = mix(b, 3.0*vec2(0.22, -0.20 + l), uOwn[4]); c = mix(c, 3.0*vec2(-0.12, 0.12 + l), uOwn[4]); d = mix(d, vec2(0.34, 0.45), uOwn[4]); }
  if (uOwn[4] < 0.0) { a = mix(a, vec2(-0.62, -0.30), -uOwn[4]); b = mix(b, 3.0*vec2(-0.42, 0.62 + l), -uOwn[4]); c = mix(c, 3.0*vec2(0.5, 0.52 + l), -uOwn[4]); d = mix(d, vec2(0.80, -0.34), -uOwn[4]); }
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
  vec3 sky = tcDusk(p);
  if (uOwn[5] > 0.0 || uOwn[2] != 0.0 || uOwn[3] != 0.0) sky = tcBehind(sky, p);
  float lamp = max(uOwn[2], 0.0), wide = 1.0; if (uOwn[0] != 0.0) wide = exp2(-0.35*uOwn[0]);
  vec3 bg = pow(sky, vec3(2.2)), add = vec3(0.0), tr = vec3(1.0);
  float here = smoothstep(0.0, 0.07, uLoop)*(1.0 - smoothstep(0.93, 1.0, uLoop));
  float sw = sin(uTime*0.37);
  const vec3 lineCol = vec3(0.13, 0.09, 0.07);
  vec2 c = tcAt(0.0);
  // which kites can touch this pixel: the line is tried in fifteen lengths of four
  int i0 = 60, i1 = 0;
  for (int g = 0; g < 15; g++) {
    float g0 = 4.0*float(g), rg = 1.0/(1.0 + g0/tcDeep);
    vec2 ce = tcAt(tcS(g0 + 4.0)), cm = 0.5*(c + ce), gv = p - cm, hv = ce - c;
    float hb = 0.52*length(hv) + 0.44*rg*rg*wide + 3.0*tcPx;
    c = ce;
    if (dot(gv, gv) < hb*hb) { i0 = min(i0, 4*g); i1 = 4*g + 4; }
  }
  vec2 n = tcAt(tcS(float(i0)));
  for (int i = i0; i < i1; i++) {
    float fi = float(i), s = tcS(fi), r = 1.0/(1.0 + fi/tcDeep); r *= 0.205*r; r *= wide;
    vec2 c0 = n, v = p - c0;
    n = tcAt(tcS(fi + 1.0));
    if (dot(v, v) > 4.6*r*r + 9.0*tcPx*tcPx) continue;
    vec2 T = normalize(n - c0 + 1e-6), N = vec2(-T.y, T.x);
    float haze = s*s*(0.10 + 0.5*uSpace), px = tcPx/r;
    float df = (s - uLoop)/0.07, face = here*exp(-df*df);
    float hs = (s - (1.0 - uHits)*1.1)/0.09, hc = (s - (1.0 - uCue)*1.1 - 0.08)/0.22, hit = uHits*exp(-hs*hs) + 0.7*uCue*exp(-hc*hc);
    float ratio = mix(0.60 + 0.08*sw*(1.0 - fi*0.03) + 0.12*tcGust, 1.0, face);
    float u = dot(v, N)/r, w = dot(v, T)/(r*ratio), d = length(vec2(u, w)), whole = 1.0, u0 = u;
    if (uOwn[7] < 0.0) { vec2 uw = rot(-uOwn[7]*(uTime*0.32 + fi*0.21))*vec2(u, w); u = uw.x; w = uw.y; }
    if (uOwn[1] > 0.0) { float sq = sqrt(u*u*0.5 + w*w*0.5 + abs(u*w) + 1e-5)*1.3; d = mix(d, max(sq, 0.0), uOwn[1]); }
    if (uOwn[1] < 0.0) { float an = atan(w, u + 1e-4); d = d*(1.0 + -uOwn[1]*0.26*(1.0 - abs(cos(an*(i%2 == 0 ? 3.0 : 2.5))))*smoothstep(0.15, 0.6, d) ); }
    if (uOwn[6] < 0.0) {                                   // some are gone, and some have lost a part
      float hh = hash11(fi*3.7 + 1.0);
      whole = sat((hh + 0.1 + 0.4*uOwn[6])*10.0);
      float hole = noise(vec2(u, w)*2.6 + fi*5.0) + 0.25*noise(vec2(u, w)*9.0 + fi) - 0.2*d;
      if (d < 1.0) whole *= 1.0 - smoothstep(0.0, 0.05, hole - 1.05 - 0.45*uOwn[6] - 0.15*hh);
    }
    if (d < 1.0 + 2.0*px/ratio) {
      float dd = (1.0 - d)*d/max(length(vec2(u, w/ratio)), 1e-3)/px;  // pixels in from the rim
      int j = int(fi), k = (j*3 + ((j*j) >> 2))%5, kind = j%3;
      vec3 ink = k == 0 ? vec3(0.03, 0.06, 0.19) : k == 1 ? vec3(0.46, 0.035, 0.02) : k == 2 ? vec3(0.58, 0.24, 0.02) : k == 3 ? vec3(0.025, 0.022, 0.025) : vec3(0.03, 0.15, 0.11);
      vec3 paper = vec3(1.02, 0.90, 0.67);
      if (uOwn[5] > 0.0) { vec3 k1 = uKind[(j*2 + j/5)%5], k2 = uKind[(j*2 + j/5 + 2 + j%2)%5]; paper = mix(paper, k1*k1*1.05 + 0.05, uOwn[5]); ink = mix(ink, k2*k2*0.45, uOwn[5]); }
      if (uOwn[5] < 0.0) { paper = mix(paper, vec3(1.0, 0.985, 0.95), -uOwn[5]); ink = mix(ink, vec3(0.5, 0.48, 0.45), -0.85*uOwn[5]); }
      // paper, lit from behind
      float fib = 0.93 + 0.14*noise(vec2(u*9.0 + fi*7.0, w*23.0));
      vec3 pap = paper*fib*(0.79 + 0.10*uTone + 0.14*w + 0.12*u + 0.25*face);
      pap += (pap*lv[k]*0.5*uEnergy + 0.22*hit)*vec3(1.0, 0.9, 0.7);
      if (lamp > 0.0) pap *= mix(vec3(1.0), (0.22 + 2.3*exp(-d*d*2.6))*vec3(1.1, 0.92, 0.72)*(0.5 + 1.5*lv[k]*uEnergy + 0.8*face), lamp);
      // its mark, as full as the piece is at its moment: a depth at the back of the room in the ring or half disc, one at the front in the heart
      int l = (j + j/3)%3;
      vec4 far = tcInk(0.02 + 0.96*s, l == 0 ? 0.84 : l == 1 ? 0.53 : 0.67), near = tcInk(0.02 + 0.96*s, (j & 1) == 0 ? 0.21 : 0.36);
      float wob = 0.04*(noise(vec2(u*4.0, w*4.0) + fi*3.0) - 0.5);
      float ring = kind == 1 ? min(w + wob*1.6 - 0.06 + 0.35*far.a, 0.88 - d - wob) : 0.10 + (kind == 0 ? 0.0 : -0.04) + 0.13*far.a - abs(d - 0.68 + wob);
      float heart = (kind == 2 ? 0.20 : 0.0) - 0.04 + 0.34*near.a - d + wob;
      float aa = px/ratio*0.7 + 0.01;
      vec3 i0 = mix(ink, far.rgb, smoothstep(0.02, 0.14, far.a)), i1 = mix(ink, near.rgb, smoothstep(0.02, 0.14, near.a));
      float lit = (0.65 + 0.55*fib)*(0.9 + 0.5*face);
      pap = mix(pap, i0*lit*(1.0 + 0.35*smoothstep(0.0, 0.07, ring)), smoothstep(-aa, aa, ring)*(0.96 - 0.72*max(-uOwn[5], 0.0)));
      pap = mix(pap, i1*lit*(1.0 + 0.35*smoothstep(0.0, 0.07, heart)), smoothstep(-aa, aa, heart)*(0.96 - 0.5*max(-uOwn[5], 0.0)));
      pap *= 1.0 - 0.5*sat(1.4 - abs(dd - 1.2)/max(1.0, 0.012/px));
      pap *= 1.0 - 0.25*(1.0 - smoothstep(0.03, 0.03 + px, abs(w)));  // the pole seen through the paper
      float alpha = sat(dd + 0.5)*0.94;
      if (uOwn[3] > 0.0) alpha *= 1.0 - 0.22*uOwn[3];
      if (uOwn[6] < 0.0) alpha *= whole;
      add += tr*mix(pap, bg, haze)*alpha; tr *= 1.0 - alpha;
    }
    // the pole, bent by the wind, and the plumes at its ends
    float au = abs(u), wp = w*ratio - 0.05*u*u;
    if (uOwn[6] > 0.0) {                                   // a fringe of plumes
      float rr = length(vec2(u, w)), an = atan(w, u + 1e-4)/TAU*(26.0 + 4.0*float(i%3)), z = fract(an) - 0.5, q = sat((rr - 0.97)/(0.62 + 0.22*hash11(floor(an) + fi*9.0)));
      float fw = (0.16 + 0.26*q)*(1.0 - q*q*q), a = q > 0.0 && q < 1.0 ? sat(0.5 + (fw - abs(z + 0.12*sin(uTime*0.6 + fi)*q))*rr*TAU/26.0*ratio/px)*0.9*uOwn[6] : 0.0;
      vec3 pl = mix(mix(vec3(0.42, 0.13, 0.06), mix(vec3(0.42, 0.13, 0.06), uKind[(i + 1)%5]*uKind[(i + 1)%5], max(uOwn[5], 0.0)), 1.0), vec3(0.96, 0.90, 0.78), smoothstep(0.1, 0.5, q + abs(z)))*(1.0 - 0.6*lamp);
      add += tr*mix(pl, bg, haze)*a; tr *= 1.0 - a;
    }
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
      float la = sat(1.0 - min(abs(u0), abs(abs(u0) - 0.92 + 0.13*al))/px)*mix(0.6, 0.25, s);
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
  float deep = -1.0, sea = max(uOwn[7], 0.0);
  if (uOwn[7] > 0.0) {                                     // the water, and what it mirrors
    float yh = mix(-1.4, -0.17, sqrt(sea));
    deep = yh - p.y;
    if (deep > 0.0) {
      float far = 1.0/(0.05 + deep), rip = noise(vec2(p.x*(3.0 + 2.0*far), 9.0*far + uTime*0.35)) - 0.5;
      p.y = yh + deep*1.05 + rip*0.07*deep/(0.2 + deep); p.x += rip*0.035*sat(deep*6.0);
    }
    p = p*(1.0 + 0.32*sea) - vec2(0.0, (uVar < 0.5 ? 0.13 : 0.17)*sea);
    tcPx *= 1.0 + 0.32*sea;
  }
  if (uVar < 0.5) c = tcKite(p); else c = tcTrain(p);
  if (deep > 0.0) c = c*mix(vec3(0.62, 0.68, 0.72), vec3(0.42, 0.50, 0.54), sat(deep*2.2)) + 0.03*exp(-deep*30.0);
  return clamp(c, 0.0, 1.0);
}
