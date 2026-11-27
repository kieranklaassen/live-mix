// name: Card hills
// a: White model
// b: Poured lake
// what: A valley built of some twenty glued sheets of white card stands in low window light, every sheet a contour with a cut edge and its shadow, with a wood of dried yarrow and one red-roofed house; or sheets of cork that step down into a hollow filled with clear resin, honey at the shore and green below, the window lying on it.
// follows: The piece is the land: a place that sounds swells, its edges in the colour of its kind. Drone lifts the valley floor or the resin, pad warms the light, texture stirs trees or the net of light, the phrase is a thread on one contour, bands lift spurs, keys light the house or the shore. A hit slips one sheet out, a cue swings the light, the loop is the hour.
// own: 0 one round hill, or a long lake, at -1, a narrower valley, or a hill in the lake, at 1; 1 last red light at -1, high soft noon at 1; 2 black card, or lime wood and ice, at -1, brown board, or walnut and amber, at 1; 3 thin sheets at -1, thick boards at 1; 4 seen from high up at -1, from low down at 1; 5 no trees and a low lake at -1, a forest and a full lake at 1; 6 a slow swell of ridges in rows, or a winding river, at -1, a crater with a ring of rim, or many round pools, at 1; 7 a dark room and the cut edges lit from inside at -1, sheets dyed by their height in the sounds' colours on a pale table at 1
const float chD = 1.25;
float chS, chLv, chPx, chJ, chK0, chGn, chPen, chWet, chN, chTop;
vec3 chL, chSun, chSky, chAbs, chGl;
mat2 chM; vec2 chMv; // how many trees, how they sway
vec4 chGz, chEd; // an edge the ray grazed, and where it ended: how far, which sheet, how far inside it, what (top, cut, side, table, wall)
vec4 chPc, chA, chB; vec3 chQ; float chEnd, chFl, chHy; // the lay of the land
const vec2 chHouse = vec2(.36, -.27);
#define CH_A max(uOwn[6], 0.)
#define CH_B max(-uOwn[6], 0.)
#define CH_DYE max(uOwn[7], 0.)
#define CH_GLOW max(-uOwn[7], 0.)
// A slow wave like a sine, its argument in turns.
float chSn(float x) { x = abs(fract(x - .25) - .5)*2.; return 1. - 2.*x*x*(3. - 2.*x); }
// The land before it is cut into sheets.
float chLand(vec2 m) {
  bool A = uVar < .5;
  float near = dot(m, vec2(.48, .88)), c = m.x + chA.x*chSn(chA.y*m.y + chA.z), y = m.y + chA.w;
  bool R = c > 0.;
  float f = chQ.x*c*c + chQ.y*y*y + chQ.z*c*y, w = f/(f + chB.x), g = 1. - w;
  float s2 = chSn(A ? .43*y - .12 : .53*m.x + .16), k = .5 + .5*c/(abs(c) + .12);
  g *= g; g *= g; // a hill in the middle
  float h = chB.y + chB.z*w*(A ? (.6 + .16*k + (.22 - .1*k)*s2) + .1*near : .88 + .09*near + .06*s2) + chB.w*g*g;
  if (uOwn[6] > 0.) {
    float u = length(m + vec2(-.05, .0)) - .62, z = u*u;
    h = mix(h, A ? .12 + .7/(1. + (u > 0. ? 4. : 3.)*z + (u > 0. ? 22. : 9.)*z*z)*(.9 + .1*s2) : .62 + .2*cos(m.x*5.2 + .6*s2)*cos(m.y*5.2 + .9) + .07*near, uOwn[6]);
  }
  if (uOwn[6] < 0.) {
    float a = m.x + .35*m.y, b = m.y + .5*chSn(.36*m.x + .1);
    float q = a*7.2 + .9*chSn(.45*m.y + .012*uTime) - uTime*.07;
    h = mix(h, A ? .36 + (.13 + .06*s2)*sin(q) + .05*sin(q*.43 + m.y*3.) + .1*near : .3 + .62*b*b/(.09 + b*b) + .07*s2 + .05*near, CH_B);
  }
  // the knoll the house stands on; in b a dam at the edge
  vec2 q = m - chHouse;
  float rim = max(abs(m.x), abs(m.y)), kn = A ? 1./(1. + 34.*dot(q, q)) : .85*smoothstep(.6, 1.1, rim), dm = smoothstep(.95, 1.2, rim);
  h += A ? .17*kn*(1. - kn*.45) : max(.72 - h, 0.)*dm;
  float s3 = chSn(A ? .41*m.x + .25*m.y + .16 : .8*m.x + .64*m.y), v = c/(abs(c) + abs(y) + 1e-4);
  v = A ? m.y*3.2 + 4. + .6*s3 - 1.36*abs(c) : (y > 0. ? 1. - v : 3. + v)*4. + .2*s3;
  float e = A ? c*c/(.05 + c*c)*w*(1. - w)*4./(1. + 2.*c*c*c*c) : w*w*(1. - w)*4.5*(1. - dm), b = A && R ? 8. : 0.;
  if (uOwn[6] != 0.) e *= 1. - (uVar < .5 ? .94 : .75)*abs(uOwn[6]);
  // sixteen spurs, each as high as its band
  float i = floor(v), x = v - i; x *= 1. - x;
  int n = int(i + b) & 15;
  h += chFl*(1. - w) + 16.*x*x*e*(.09*fract(float(n)*.618 + .2) + .1*uBands[n]*chGn);
  chPc = piece(vec2(m.x, -m.y)/(2.*chD) + .5);
  h += chS*1.5*chGn*(1. - kn)*chPc.a; // a place that sounds
  return h + chS*chJ*max(1. - abs(h/chS - chK0)*.55, 0.);
}
// Through the stack sheet by sheet. A grazed edge is kept with what is behind it, so that the cut is drawn smooth.
bool chTrace(vec3 o, vec3 d, float t0, float t1, float ty0, float ho) {
  float k = floor((o.y + d.y*t0)/chS) + 1., ta = t0, run = length(d.xz)/-d.y, q = 1./(1. + 1.05*run), l = 0., r = 0., fl = 0., fr = 1., hm = 0., vx = .5, kEnd = floor((o.y + d.y*t1)/chS) + 1.;
  int mode = 0;
  for (int i = ho < (k - .5)*chS ? 1 : 0; i < 64; i++) {
    float tb = i == 0 ? t0 : ((k - 1.)*chS - o.y)/d.y, tk = (k*chS - o.y)/d.y, te = mode > 1 ? tk : mode > 0 ? l + (r - l)*fl/(fl - fr) : min(tb, t1);
    if (mode < 0) te = mix(ta, te, vx);
    float hb = chLand(o.xz + d.xz*te), f = hb - (k - .5)*chS;
    if (mode > 0) { // closing in on a cut
      if (mode > 1 && f > 0.) { chEd = vec4(tk, k, f, 0.); return true; }
      if (f > 0.) { r = te; fr = f; } else { l = te; fl = min(f, -1e-5); }
      if (--mode == 0) { chEd = vec4(l + (r - l)*fl/(fl - fr), k, 0., 1.); return true; }
    } else if (mode == 0 && i > 0 && f <= 0. && abs(ho - hb) < .8*chS && max(ho - hb, 0.) + f > -(chWet > .5 ? .12 : .3)*chS) {
      hm = hb; mode = -1; vx = .5; // a small knoll may lie between: look half way
    } else if (f > 0. && mode == 0) {
      if (i == 0) { chEd = vec4(t0, k, f, ty0); return true; }
      l = ta; r = te; fr = f; fl = min(ho - (k - .5)*chS, -1e-5); mode = ta < tk - 1e-4 ? 2 : 1;
    } else if (i > 0) {
      if (mode < 0) { // a bow through the three heights
        float fa = ho - hb + f, fb = hm - hb + f, b = 4.*f - 3.*fa - fb, a = min(2.*(fa + fb) - 4.*f, -1e-6), q = b*b - 4.*a*fa, x = (b - sqrt(max(q, 0.)))/(-2.*a);
        if (mode < -1 ? f > 0. : q > 0. && x > 0. && x < 1.) { if (mode < -1) x = vx; chEd = vec4(max(ta + (min(tb, t1) - ta)*x, tk), k, 0., 1.); return true; }
        if (mode > -2 && q <= 0. && b > -1.8*a*.11 && b < -1.8*a && fa - .25*b*b/a > -.4*chS) { vx = -.5*b/a; mode = -2; continue; } // a narrow one: look at its top
        f = fb; hb = hm; mode = 0;
      }
      chEnd = hb;
      if (tb >= t1) return false;
      k -= 1.; f += chS;
      float thr = .3*tb*chPx*(abs(hb - ho)/max((ta - tb)*d.y, .01) + .5);
      ta = tb; ho = hb;
      bool one = chGz.x > 0.;
      if (f > thr || (one && f > 0.)) { chEd = vec4(tb, k, f, 0.); return true; }
      if (f > -thr && !one) chGz = vec4(tb, k, f, 0.);
      k = max(k - max(floor(-f/chS*q + .15), 0.), min(k, kEnd));
    } else ho = hb;
  }
  return false;
}
// The house is a block under two roofs: where a ray goes in and comes out.
vec2 chBox(vec3 o, vec3 d, out vec3 n) {
  o -= vec3(chHouse.x, chHy, chHouse.y);
  d.xz += step(abs(d.xz), vec2(1e-4))*2e-4;
  vec2 id = 1./d.xz, c = -o.xz*id, e = abs(id)*vec2(.064, .044), n2 = c - e, f2 = c + e;
  vec2 rd = vec2(.78, .78)*d.y + vec2(.625, -.625)*d.z, rf = .098 - .78*o.y - vec2(.625, -.625)*o.z;
  rd += step(abs(rd), vec2(1e-4))*2e-4;
  vec2 rt = rf/rd, ri = mix(vec2(-1e5), rt, step(rd, vec2(0.))), ro = mix(rt, vec2(1e5), step(rd, vec2(0.)));
  float a = max(max(n2.x, n2.y), max(ri.x, ri.y));
  n = a == n2.x ? vec3(-sign(d.x), 0., 0.) : a == n2.y ? vec3(0., 0., -sign(d.z)) : vec3(0., .78, a == ri.x ? .625 : -.625);
  return vec2(max(a, 1e-5), min(min(f2.x, f2.y), min(ro.x, ro.y)));
}
const vec2 chMid = vec2(.5, .55);
float chNear(vec2 w) { w -= chMid; return dot(w*vec2(1., .8), w); }
// A wood of dried yarrow, a tree to a cell: walked along a ray from its far end f back to its near end. soft is for its shade.
vec4 chWood(vec3 o, vec3 d, float f, float n, float soft) {
  vec4 res = vec4(0.);
  const mat2 tw = mat2(.921, .389, -.389, .921);
  const float C = .145;
  vec2 O = tw*o.xz/C, D = tw*d.xz/C;
  float l2 = max(dot(D, D), 1e-5), l = sqrt(l2), t = f - 1e-4, dir = soft > 0. ? 1. : -1.;
  if (soft > 0.) t = 1e-4;
  D += step(abs(D), vec2(1e-4))*1e-4;
  for (int i = 0; i < 6; i++) {
    vec2 c = floor(O + D*t), hs = hash22(c + 41.), m = c + .5 + (hs - .5)*(.4 - .22*max(uOwn[5], 0.)), rel = m - O, w = m*C*tw;
    float x = (rel.y*D.x - rel.x*D.y)/l*C, tt = dot(rel, D)/l2;
    float sz = smoothstep(0., .25, chN - chNear(w) - .3*hs.x)*(.75 + .5*hs.y), R = .043*sz*(1. - .08*max(uOwn[5], 0.));
    sz *= step(max(abs(w.x), abs(w.y)), chD - .04);
    for (bool go = sz > .05 && abs(x) < R*1.4 && tt > 0. && tt < f; go; go = false) {
      float y = soft > 0. ? d.y*tt + .02 : o.y + d.y*tt - chLand(w) + .03, Y = .12*sz, px = tt*chPx + soft*tt;
      if (y > 0. && y < Y + R) {
        float id = hs.x*20.;
        x += chMv.x*sin(chMv.y + id)*y*y*3.;
        vec2 q = vec2(x, (y - Y)*1.45)/R;
        float e = px/R, rr = length(q) + .16*sin(q.x*11. + id)*cos(q.y*9. + id);
        float cr = (1. - smoothstep(1. - e, 1. + e, rr))*smoothstep(-.75 - e, -.75 + e, q.y + .3*abs(q.x));
        float st = (1. - smoothstep(.0035*sz - px*.3, .0035*sz + px, abs(x)))*sat(sz*3.)*step(y, Y);
        st = max(st, (1. - smoothstep(.0025 - px*.3, .0025 + px, abs(abs(x) - max(y - Y*.5, 0.)*.75)))*step(Y*.5, y)*step(y, Y));
        float cv = max(cr, st);
        vec3 al = mix(vec3(.2, .13, .06), mix(vec3(.5, .33, .1), vec3(.42, .36, .17), hs.y)*(.55 + .75*mix(hash21(floor(q*5. + id)), noise(q*5. + id), max(uOwn[5], 0.))), cr);
        al *= .75 + .45*sat(.5 - .5*q.x + .5*q.y);
        res = vec4(mix(res.rgb, al, res.a > 0. ? cv : 1.), max(cv, res.a));
      }
    }
    // to the next cell
    vec2 g = (c + step(0., D*dir) - O)/D;
    t = (dir > 0. ? min(g.x, g.y) : max(g.x, g.y)) + dir*1e-3;
    if (t < n || t > f || res.a > .95) break;
  }
  return res;
}
// How much window light comes to a place, past the sheets above it.
float chShade(vec3 P, vec3 L) {
  float s = 1., j = floor(P.y/chS + .02) + 1.;
  float q = .7*L.y/max(length(L.xz), .05);
  for (int i = 0; i < (chWet > .5 ? 3 : 4); i++) {
    float t = (j*chS - P.y)/L.y; vec2 m = P.xz + L.xz*t;
    float e = chD - max(abs(m.x), abs(m.y));
    if (j*chS > chTop || e < -.02) break;
    float w = (.005 + chPen*t);
    float f = chLand(m) - (j - .5)*chS;
    s *= 1. - smoothstep(-w, w, f)*smoothstep(-.01, .01, e);
    if (s < .06) break;
    j += 1. + max(floor((-f - w)/chS*q), 0.);
  }
  return s;
}
float chNet(vec2 s) {
  s += .35*vec2(chSn(s.y*.31 + uTime*.04), chSn(s.x*.27 - uTime*.035));
  float c = chSn(s.x*.42 + .22*chSn(s.y*.37 + uTime*.05)) + chSn(s.y*.45 - .25*chSn(s.x*.33 - uTime*.045) + .3*chSn((s.x + s.y)*.21));
  c = sat(1. - abs(c)*.9); return c*c*c;
}
// The wall behind, with the light that falls on it and, in b, the window in two leaves of three panes.
vec3 chWall(vec3 o, vec3 d) {
  vec3 dv = vec3(chM*d.xz, d.y), ov = vec3(chM*o.xz, o.y);
  float tw = (4.6 - ov.y)/max(dv.y, .05), bw = tw*chPx + .012;
  vec2 w = vec2(ov.x + dv.x*tw, ov.z + dv.z*tw);
  float pat = smoothstep(-.25, .25, w.x - .9 - .5*w.y)*(1.0 - smoothstep(-.2, .2, w.x - 3.2 - .5*w.y))*(1. - .55*(1.0 - smoothstep(.03, .13, abs(w.x - 2.05 - .5*w.y))));
  vec3 wall = mix(vec3(.52, .5, .465), vec3(.8, .79, .77), CH_DYE)*(chSky*(.75 + .1*w.y - .06*w.x) + chSun*.3*pat);
  vec2 wq = (w - vec2(-1.35, 2.35))/vec2(.85, 1.25);
  float py = abs(fract(wq.y*1.5 + .5) - .5), pane = smoothstep(-bw, bw, min(min(1. - abs(wq.x), 1. - abs(wq.y))*.9, min(py, min(abs(wq.x), 1. - abs(wq.x))) - .05));
  return wall + uVar*pane*chSun*(2.6 + 1.1*wq.y)*(1. + .5*uPad);
}
vec4 chPaint(vec3 o, vec3 d, vec4 hit, bool whole) {
  float t = hit.x, k = hit.y, ty = hit.w, cv = 1., O = uOwn[2], h = (k - .5)*chS + hit.z;
  vec2 g = vec2(0.);
  if (ty > 3.5) return vec4(chWall(o, d), 1.);
  vec3 P = o + d*t;
  for (int i = ty > 2.5 ? 2 : 0; i < 2; i++) {
    float f = chLand(P.xz + (i == 0 ? vec2(.012, 0.) : vec2(0., .012)));
    if (i == 0) g.x = f; else g.y = f;
  }
  g = (g - h)/.012;
  if (!whole) {
    float run = length(d.xz)/-d.y;
    vec2 fw = d.xz/max(length(d.xz), 1e-4);
    cv = sat(.5 + hit.z/(t*chPx*length(vec2(dot(g, vec2(-fw.y, fw.x)), dot(g, fw)*run)) + 1e-5));
    if (cv < .04) return vec4(0.);
  }
  float gl = max(length(g), .04);
  vec4 pc = chPc;
  vec3 hue = pc.rgb/max(pc.a, .03);
  vec3 n = vec3(0., 1., 0.), al, ed;
  if (ty > .5) n = vec3(-g.x, 0., -g.y)/gl;
  if (ty > 1.5) n = abs(P.x) > abs(P.z) ? vec3(sign(P.x), 0., 0.) : vec3(0., 0., sign(P.z));
  vec2 v = chM*P.xz;
  vec2 at = ty > 2.5 ? vec2(v.x*1.2, v.y*17. + 2.*chSn(v.x*.4)) : uVar < .5 && ty > .5 ? vec2((P.x - P.z)*90., k*3.7) : P.xz*62. + P.zx*vec2(17., -17.) + k*7. + (ty > .5 ? P.y*70. : 0.);
  float yy = fract(P.y/chS), big = noise(at), gr = uVar < .5 ? big : abs(fract(big*2.3) - .5)*2.;
  float pw = t*chPx/chS/max(abs(dot(d, n)), .04);
  if (ty > 2.5) {
    al = ed = mix(vec3(.27, .235, .195), vec3(.31, .272, .228), big);
    n = vec3(0., 1., 0.);
    if (uOwn[7] > 0.) al = ed = mix(al, vec3(.7, .69, .67) + .1*big, CH_DYE);
    al *= 1. - .6*CH_GLOW;
  } else if (uVar < .5) {
    al = mix(mix(vec3(.86, .845, .81), vec3(.085, .087, .095), max(-O, 0.)), vec3(.5, .345, .21), max(O, 0.))*(.96 + .06*gr);
    ed = al*mix(vec3(.97, .95, .91), vec3(1.5, 1.45, 1.4), max(-O, 0.));
  } else {
    al = mix(vec3(.47, .29, .15), vec3(.6, .4, .22), gr)*(1. - .5*smoothstep(.45, 1., .65*big + .5*gr));
    al = mix(mix(al, vec3(.74, .66, .52)*(.9 + .15*gr), max(-O, 0.)), vec3(.2, .105, .055)*(.7 + .6*big), max(O, 0.));
    ed = al*.85;
  }
  float up = sat((ty > 1.5 ? P.y : (k - .5)*chS)*1.05 - .05);
  if (uOwn[7] > 0. && ty < 2.5) {
    vec3 c = kindColour(4.*(uVar < .5 ? up : sat(up*1.5 - .25)));
    c = c*c*1.15 + .01; al = mix(al, c*(.85 + .2*gr), CH_DYE); ed = mix(ed, c*1.1, CH_DYE);
  }
  float nl = sat(dot(n, chL)), sh = nl > .001 ? chShade(P + n*.004, chL) : 0., ao;
  if (ty > 2.5) { ao = sat(1. - 9.*max(max(abs(P.x), abs(P.z)) - chD, 0.)); ao = 1. - .45*ao*ao; }
  else if (ty < .5) {
    ao = sat(1. - 9.*((k + .5)*chS - h)/gl); ao = 1. - .5*ao*ao*ao;
  } else { al = ed*(.93 + .14*gr)*(1. - .5*(1. - smoothstep(0., .14 + pw, min(yy, 1. - yy)))/(1. + 3.*pw*pw)); ao = .6 + .4*smoothstep(0., .5, yy); }
  float tint = sat(pc.a*1.4*chGn)*step(ty, 2.5);
  vec3 th = hue/max(max(hue.r, hue.g), max(hue.b, .05)); th *= th;
  al = mix(al, max(al, .25)*th*1.15, tint*(ty > .5 ? .75 : .14));
  float low = sat(P.y/.7);
  vec3 amb = chSky*(.62 + .38*low)*(.72 + .28*n.y + .25*dot(n, vec3(chL.x, 0., chL.z)));
  for (bool go = uVar < .5 && sh*nl > .02; go; go = false) {
    vec3 hb; vec2 hx = chBox(P + n*.003, chL, hb);
    sh *= 1. - smoothstep(0., .012, hx.y - hx.x);
    for (bool by = chNear(P.xz + .15*chL.xz/chL.y) < chN + .3; by; by = false) sh *= 1. - .85*chWood(P, chL, .17/chL.y, 0., .02).a;
  }
  vec3 col = al*(chSun*nl*sh + amb*ao);
  for (bool go = chWet > .5; go; go = false) col *= 1. + 3.5*chNet(P.xz*7.)*smoothstep(.0, .25, chLv - P.y)*(.4 + .9*uTexture)*step(ty, .5);
  if (uOwn[7] < 0. && ty < 2.5) { // lit from inside
    vec3 g = mix(vec3(1.5, .72, .24), kindColour(4.*up)*1.4, .75); g *= g*.6;
    float far = ((k + .5)*chS - h)/gl, ins = ty < .5 ? .3/(1. + 260.*far*far) + .03 : ty < 1.5 ? .55 + .6*(1. - yy) : .12 + .5*step(.5, yy);
    col += CH_GLOW*g*ins*(.7 + .55*uBands[int(up*15.)]*chGn + .15*uLevel)*(ty < .5 ? al + .15 : vec3(1.));
  }
  // the phrase: a thread of light walks one contour
  float r = P.x/(abs(P.x) + abs(P.z) + 1e-4); r = (P.z > 0. ? 1. - r : 3. + r)*.25;
  r = fract(r - uTime*.021);
  float r4 = (1. - r)*(1. - r); r4 *= r4;
  float ln = (abs(h - (floor((uVar > .5 ? .62 : .3)/chS) + .5)*chS)/gl + (ty > .5 ? (1. - yy)*chS : 0.))*70.;
  ln = 1./(1. + ln*ln*(1. + ln))*(.15 + r4*smoothstep(0., .02, r))*step(ty, 1.5);
  col += (uKind[3]*uKind[3] + .15)*ln*uPhrase*(uVar < .5 ? 4.5 : 2.6)*chGn;
  // the keys and the voice light the house
  vec2 u = P.xz - chHouse;
  col += al*vec3(1.5, .8, .25)*(1. - uVar)*(uKeys + uMic + .5*uCue)*sat(1. - 22.*dot(u, u));
  // the sheet a hit moves lights along its edge
  float on = step(abs(k - chK0), .5)*(ty < .5 ? .3*sat(1. - 6.*(h - (k - .5)*chS)/gl) : 1.);
  col += (uKind[4]*uKind[4]*.8 + .25)*uHits*uHits*on*1.6*al;
  return vec4(col, cv);
}
vec3 render(vec2 p) {
  float V = step(.5, uVar), o3 = uOwn[3], vw = uOwn[4], hr = uOwn[1];
  chWet = chHy = chEnd = 0.;
  chA = V > .5 ? vec4(.14, .41, .1, .05) : vec4(-.28, .255, .08, -.3);
  float lay = uOwn[0];
  float up = max(lay, 0.), dn = max(-lay, 0.);
  if (V > .5) { chQ = mix(vec3(.95, .95, .12), vec3(1.3, .35, 1.07), dn); chB = vec4(.6, .04, 1. - .05*up, .68*up); }
  else { chQ = vec3(1., .9*dn, .4*dn); chB = vec4(.3 + 1.3*dn - .2*up, .1, 1. - .8*dn - .15*up, .8*dn); }
  chGn = .55 + uEnergy;
  chS = .05*(1. + (o3 > 0. ? .8*o3 : .3*o3)); chTop = V > .5 ? 1.1 : 1.15;
  chPx = 1./(uRes.y*1.5);
  float jh = 4.*uHits*(1. - uHits), jc = 4.*uCue*(1. - uCue);
  chJ = .9*jh; chK0 = floor((V > .5 ? .7 : .38)/chS + .5);
  chN = .5 + (uOwn[5] > 0. ? 1.6 : .55)*uOwn[5];
  chMv = vec2(.12 + .9*uTexture, uTime*.9);
  chLv = .56 + .05*uDrone + (uOwn[5] > 0. ? .07 : .25)*uOwn[5];
  // the light
  float ho = cos(TAU*uLoop), az = (V > .5 ? .62 : 1.22) + .12*sin(TAU*uLoop) - .5*jc + .04*sin(uTime*.05);
  float el = .42 + .05*ho + (hr > 0. ? .5*hr : .14*hr);
  vec3 Lv = normalize(vec3(-sin(az)*cos(el), sin(el), cos(az)*cos(el)));
  chPen = mix(.1, .03, uTone) + .25*max(hr, 0.);
  chSun = mix(vec3(3.3, 2.95, 2.45), vec3(3.6, 2.5, 1.5), .75*uPad)*(1. + .25*uCue);
  chSun = mix(chSun, hr > 0. ? vec3(1.15, 1.2, 1.25) : vec3(3.4, 1.35, .5), abs(hr));
  chSky = mix(vec3(.5, .57, .68), hr > 0. ? vec3(.85, .9, .95) : vec3(.16, .2, .36), abs(hr));
  chSun *= 1. - .93*CH_GLOW; chSky *= 1. - .84*CH_GLOW;
  chAbs = mix(vec3(2.1, .6, .9), uOwn[2] < 0. ? vec3(1.5, .5, .3) : vec3(.3, 1.5, 4.), abs(uOwn[2]));
  chGl = mix(vec3(.01, .1, .085), uOwn[2] < 0. ? vec3(.1, .22, .3) : vec3(.24, .06, .005), abs(uOwn[2]));
  // the eye
  float tu = (V > .5 ? .5 : .58) + .07*sin(uTravel*.02), pt = .52 - .06*vw + (vw < 0. ? -.6*vw : 0.) + .03*uSpace;
  float R = (V > .5 ? 2.42 : 2.85) + .1*uSpace - .25*max(vw, 0.);
  if (vw > 0.) pt -= .1*vw;
  vec3 ro = vec3(.0, (V > .5 ? .36 : .27) + R*sin(pt), -R*cos(pt) + .04), dv = normalize(vec3(p, 1.5));
  dv.yz = vec2(dv.y*cos(pt) - dv.z*sin(pt), dv.z*cos(pt) + dv.y*sin(pt));
  float ca = cos(tu), sa = sin(tu);
  mat2 m = mat2(ca, -sa, sa, ca); // from the room to the table
  chM = mat2(ca, sa, -sa, ca);
  chFl = V < .5 ? .7*chS*uDrone : 0.;
  if (V < .5) chHy = chLand(chHouse) - .04;
  vec3 o = ro, d = dv; o.xz = m*ro.xz; d.xz = m*dv.xz;
  chL = Lv; chL.xz = m*Lv.xz;
  vec3 acc = vec3(0.), tr = vec3(1.);
  float tmax = 1e3;
  for (int ph = 0; ph < 2; ph++) {
    vec2 id = 1./(abs(d.xz) + 1e-5), c = -o.xz*sign(d.xz), n2 = (c - chD)*id, f2 = (c + chD)*id;
    float dy = min(d.y, -.02), dt = (chTop - o.y)/dy, t0 = ph > 0 ? 0. : max(max(n2.x, n2.y), dt), t1 = min(f2.x, f2.y), tl = V > .5 && ph < 1 ? (chLv - o.y)/dy : 1e3;
    bool in_ = t0 < t1 && d.y < -.02, lake = in_ && tl < t1 && tl > t0, done = false;
    chGz = vec4(-1.);
    if (in_) done = chTrace(o, d, t0 + 1e-4, min(t1, tl), ph > 0 ? 0. : 2., ph > 0 ? chEnd : n2.x > dt || n2.y > dt ? 9. : 0.);
    if (!done && !lake) { // past the model: the table or the wall
      float tt = -o.y/min(d.y, -.001), z = (chM*(o.xz + d.xz*tt)).y;
      float m = d.y < -.001 ? (1.0 - smoothstep(2.32, 2.38, z)) : 0.;
      chEd = m > .5 ? vec4(tt, 0., 0., 3.) : vec4(9., 0., 0., 4.);
      done = true;
    }
    for (int i = chGz.x > 0. ? 0 : 1; i < (done ? 2 : 1); i++) {
      vec4 hit = i > 0 ? chEd : chGz, cl = chPaint(o, d, hit, i > 0);
      if (ph > 0) { vec3 ab = exp(-chAbs*(hit.x + max(chLv - o.y - d.y*hit.x, 0.)/chL.y)); cl.rgb = cl.rgb*ab + chGl*(1. - ab); }
      acc += tr*cl.a*cl.rgb;
      tr *= 1. - cl.a;
      if (cl.a > .5) tmax = min(tmax, hit.w > 3.5 ? 1e3 : hit.x);
    }
    if (done || !lake || tr.x < .01) break;
    // the polished top of the resin: the window lies on it, and the eye goes on down
    vec3 P = o + d*tl, n = normalize(vec3(.003*sin(P.z*5. + P.x*2.), 1., .003*sin(P.x*6. - P.z)));
    float fr = 1. - sat(-dot(d, n)); fr = .04 + .96*fr*fr*fr*fr*fr;
    acc += tr*(fr*chWall(P, reflect(d, n)) + (chSky*.6 + chSun*.15)*(.5 + 2.2*chSun*(uKeys + uMic))*(1. - smoothstep(0., .006 + .024*(uKeys + uMic), abs((floor(chLv/chS) + .5)*chS - chEnd))));
    tr *= 1. - fr;
    o = P; d = refract(d, n, .667); chWet = 1.;
    chL = -refract(-chL, vec3(0., 1., 0.), .667);
  }
  for (bool it = V < .5; it; it = false) {
    vec3 n; vec2 b = chBox(o, d, n);
    if (b.x < b.y && b.x < tmax) {
      bool roof = n.y > .1;
      vec3 P = o + d*b.x - vec3(chHouse.x, 0., chHouse.y);
      vec3 al = roof ? vec3(.62, .075, .04) : vec3(.85, .82, .76);
      float u = abs(n.x) > .5 ? P.z : P.x, e = b.x*chPx, win = roof ? 0. : 1. - smoothstep(-e, e, max(abs(abs(u) - .021) - .008, abs(P.y - chHy - .045) - .011));
      vec3 col = al*(chSun*sat(dot(n, chL)) + chSky*(.8 + .2*n.y))*(1. - .8*win) + vec3(3., 1.7, .6)*win*(uKeys + uMic + .8*uCue);
      acc = mix(acc, col, sat((b.y - b.x)/(tmax*chPx*2.))); tmax = b.x;
    }
    vec2 fe = (chD - o.xz*sign(d.xz))/(abs(d.xz) + 1e-5);
    vec4 w = vec4(0.);
    float f = min(tmax, min(fe.x, fe.y)), n1 = (1.05 - o.y)/min(d.y, -.02);
    // only where the ray is over the wood
    const vec2 sq = vec2(1., .8);
    vec2 oc = o.xz - chMid;
    float qa = max(dot(d.xz*sq, d.xz), 1e-4), qb = dot(oc*sq, d.xz), qd = qb*qb - qa*(dot(oc*sq, oc) - chN - .06), qs = sqrt(max(qd, 0.));
    f = min(f, (qs - qb)/qa); n1 = max(n1, (-qb - qs)/qa);
    for (bool go = d.y < -.02 && qd > 0. && f > n1; go; go = false) w = chWood(o, d, f, n1, 0.);
    acc = mix(acc, w.rgb*(chSun*.55 + chSky*.8), w.a);
  }
  return screenOf(acc*.82);
}
