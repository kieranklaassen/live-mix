// name: Dot lattice
// a: Points
// b: Rods
// what: A flight through lamps hung in a lattice that fills space, with the piece laid through it across and along and echoed on the levels above and below, the far lamps sinking into fog.
// follows: Loudness lights and swells the lamps; lows send slow wide waves of light through, mids quicker ones, highs make single lamps sparkle; a hit or cue sends a shell of light out from the middle.
// own: 0 1 great balls that all but fill their cells, -1 fine points; 1 a: drawn out into upright strands, b: every rod upright like rain; -1 a: flat level discs, b: all rods lying one way; 2 1 thinned to wide level sheets above and below you, -1 to tall columns far apart (their bonds run only along them); 3 1 strewn, of every size and many gone, -1 the rows bent in slow waves; 4 1 pale air, the lamps dark or coloured in it, -1 deep coloured water lit from above; 5 1 matte balls lit from one side, -1 clear, only their rims; 6 1 you rise straight up, all of it sinking past, -1 you drift sideways; 7 1 thin bonds join every lamp to its neighbours, -1 far out of focus, soft round discs of light
const vec3 PERIOD = vec3(32.0, 8.0, 48.0); // the lattice repeats: the room there and back across, eight levels up, one turn of the loop along

vec3 tone(vec3 c) { c = max(c, 0.0); float l = max(c.r, max(c.g, c.b)); c *= (1.0 + l * 0.1) / (1.0 + l); c = mix(c, vec3(l / (1.0 + l)), sat(l * 0.12 - 0.1)); return pow(c, vec3(0.4545)); }
float bump(float x) { x = sat(1.0 - x * x); return x * x; }
float wave(float x) { x = abs(fract(x) - 0.5) * 2.0; return x * x * (3.0 - 2.0 * x); } // a smooth wave, 0 to 1, once for each 1 of x

vec3 gMid; // where a hit's shell starts

// The light of the lamp in one cell (rgb), and how big it is (a).
vec4 lampAt(vec3 id) {
  vec3 c = id + 0.5;
  vec3 w = mod(c, PERIOD);
  float level = w.y - 4.0;                           // levels above and below the middle one
  float echo = 1.0 / (1.0 + 0.35 * level * level);   // the piece is strongest on the middle level, fainter away from it
  vec2 uv = vec2(fract(w.z / PERIOD.z - level * 0.03), abs(w.x / 16.0 - 1.0));
  vec4 m = piece(uv);
  float loud = sat(m.a * (0.6 + 0.6 * uEnergy)) * (0.3 + 0.7 * echo);
  vec3 hue = m.rgb / max(m.a, 0.001);
  hue = max(mix(vec3(dot(hue, vec3(0.3333))), hue, 1.9), 0.0);
  float dz = (fract(uv.x - uLoop + 0.5) - 0.5) * PERIOD.z;
  float head = bump(dz * 0.35);
  vec3 light = hue * loud * (0.75 + 1.3 * head);
  // lows: one slow wide wave. mids: a quicker, shorter one across it.
  vec3 k = w / PERIOD;
  float lo = wave(k.x + k.z * 2.0 - uTime * 0.09);
  float mi = wave(k.x * 3.0 + k.y - k.z * 3.0 - uTime * 0.2);
  lo *= lo; mi *= mi;
  light += uKind[0] * uLow * lo * lo * 0.3 + mix(uKind[1], uKind[2], wave(k.z + 0.3)) * uMid * mi * mi * mi * 0.3;
  // highs: single lamps sparkle
  float h = hash31(w);
  float tw = wave(uTime * (0.3 + 0.5 * h) + h * 9.0);
  tw *= tw; tw *= tw;
  light += vec3(1.0, 0.9, 0.75) * uHigh * tw * tw * step(0.75, fract(h * 7.3)) * 1.6;
  // a hit: a shell of light going out from the middle
  if (uHits > 0.01) {
    float dist = length(c - gMid);
    float sh = uHits * bump((dist - 0.5 - (1.0 - uHits) * 12.0) * 1.3) + 0.7 * uCue * bump((dist - 0.5 - (1.0 - uCue) * 17.0) * 0.9);
    vec3 red = max(mix(vec3(dot(uKind[4], vec3(0.3333))), uKind[4], 1.8), 0.0);
    light += mix(red, vec3(1.0, 0.9, 0.8), 0.3) * sh * 1.6;
  }
  light += vec3(0.012, 0.018, 0.03);
  float big = max(light.r, max(light.g, light.b));
  return vec4(light, 0.014 + 0.09 * sqrt(sat(big * 0.8)));
}

// How near a ray passes a short rod from a to b; t is where along the ray.
float rodDist(vec3 ro, vec3 rd, vec3 a, vec3 b, out float t) {
  vec3 ba = b - a, oa = ro - a;
  float baba = dot(ba, ba), bard = dot(ba, rd), baoa = dot(ba, oa), rdoa = dot(rd, oa);
  float s = clamp((baoa - rdoa * bard) / max(baba - bard * bard, 1e-5), 0.0, 1.0);
  vec3 q = a + ba * s;
  t = dot(q - ro, rd);
  return length(ro + rd * t - q);
}

// One lamp, as a soft point or rod of light dd from the ray at t along it, laid over what is already there.
void lay(vec4 L, float r, float dd, float t, inout vec3 col, inout float alpha) {
  float fog = exp(-t * 0.17) * step(0.05, t);
  float w = 0.006 + t * 1.2 / uRes.y + 0.012 * abs(t - 5.0) / (1.0 + 0.4 * t); // far lamps are softer, and so are the ones at your shoulder
  float cov = smoothstep(r + w, max(r - w, 0.0) - 1e-4, dd) * min(1.0, 2.0 * r * r / (w * w));
  float core = sat(1.0 - dd / (r + w));
  col += (1.0 - alpha) * cov * L.rgb * (0.5 + 1.6 * core * core) * fog * 1.5;
  alpha += (1.0 - alpha) * cov * 0.9 * step(0.05, t);
  float g = sat(1.0 - (dd - r) / (0.02 + 1.6 * r));
  col += (1.0 - alpha) * L.rgb * g * g * g * 0.3 * fog;
}

vec3 points(vec3 ro, vec3 rd) {
  vec3 inv = 1.0 / rd, id = floor(ro), stp = sign(rd);
  vec3 tMax = (id + max(stp, 0.0) - ro) * inv, tDel = abs(inv);
  vec3 col = vec3(0.0); float alpha = 0.0;
  for (int i = 0; i < 24; i++) {
    vec3 oc = id + 0.5 - ro; float tca = dot(oc, rd), d2 = dot(oc, oc) - tca * tca;
    if (d2 < 0.085) {
      vec4 L = lampAt(id);
      lay(L, L.a, sqrt(max(d2, 0.0)), tca, col, alpha);
      if (alpha > 0.98) break;
    }
    if (tMax.x < tMax.y && tMax.x < tMax.z) { tMax.x += tDel.x; id.x += stp.x; }
    else if (tMax.y < tMax.z) { tMax.y += tDel.y; id.y += stp.y; }
    else { tMax.z += tDel.z; id.z += stp.z; }
  }
  return col;
}

// The same lattice with a rod in place of each point, turned by a slow wave that runs through the lattice.
vec3 rods(vec3 ro, vec3 rd) {
  vec3 inv = 1.0 / rd, id = floor(ro), stp = sign(rd);
  vec3 tMax = (id + max(stp, 0.0) - ro) * inv, tDel = abs(inv);
  vec3 col = vec3(0.0); float alpha = 0.0;
  for (int i = 0; i < 24; i++) {
    vec3 oc = id + 0.5 - ro; float tca = dot(oc, rd), d2 = dot(oc, oc) - tca * tca;
    if (d2 < 0.2 && tca > -0.5) {
      vec4 L = lampAt(id);
      vec3 k = mod(id + 0.5, PERIOD) / PERIOD;
      float a = (k.z * 2.0 + k.x) * TAU + uTime * 0.17, b = 0.7 * (wave(k.y + k.z * 3.0 - uTime * 0.02) * 2.0 - 1.0);
      vec3 ax = vec3(cos(a) * cos(b), sin(b), sin(a) * cos(b)) * (0.1 + 2.2 * L.a);
      float t, dd = rodDist(ro, rd, id + 0.5 - ax, id + 0.5 + ax, t);
      lay(L, 0.01 + L.a * 0.3, dd, t, col, alpha);
      if (alpha > 0.98) break;
    }
    if (tMax.x < tMax.y && tMax.x < tMax.z) { tMax.x += tDel.x; id.x += stp.x; }
    else if (tMax.y < tMax.z) { tMax.y += tDel.y; id.y += stp.y; }
    else { tMax.z += tDel.z; id.z += stp.z; }
  }
  return col;
}

// The numbers of its own, by name: they are known before the shader is made.
#define own0 uOwn[0]
#define own1 uOwn[1]
#define own2 uOwn[2]
#define own3 uOwn[3]
#define own4 uOwn[4]
#define own5 uOwn[5]
#define own6 uOwn[6]
#define own7 uOwn[7]
vec3 gSun;

struct Lamp { vec3 c; float r; vec3 hue; vec3 light; float loud; float h; float kept; };

Lamp lampOf(vec3 id) {
  vec3 w = mod(id + 0.5, PERIOD), k = w / PERIOD;
  float h = hash31(w), h2 = fract(h * 57.31 + 0.37), h3 = fract(h * 173.7 + 0.11), strewn = max(own3, 0.0), bent = max(-own3, 0.0);
  float level = w.y - 4.0;
  vec4 L = lampAt(id);
  float big = max(L.r, max(L.g, L.b));
  Lamp d;
  d.h = h; d.light = L.rgb; d.loud = sat(big * 0.9);
  vec3 rest = mix(mix(uKind[0], uKind[1], wave(k.x + k.z * 2.0)), mix(uKind[2], uKind[3], h2), step(0.7, h3));
  d.hue = mix(rest, L.rgb / max(big, 0.001), smoothstep(0.08, 0.4, big) * mix(1.0, smoothstep(0.2, 0.45, 1.0 - min(L.r, min(L.g, L.b)) / max(big, 0.001)), sat(abs(own4) + abs(own5))));
  // what is left of the lattice: level sheets, or columns
  float sheet = step(abs(mod(w.y, 4.0) - 2.5), 0.1), column = step(abs(mod(w.x, 4.0) - 2.5), 0.1) * step(abs(mod(w.z, 4.0) - 2.5), 0.1);
  float left = mix(1.0, sheet, max(own2, 0.0)) * mix(1.0, column, max(-own2, 0.0));
  left *= mix(1.0, smoothstep(0.4, 0.5, h3), strewn);
  d.kept = smoothstep(0.02, 0.1, left);
  float hit = uHits * step(0.76, h2);
  d.light += uKind[4] * hit * 0.8; d.hue = mix(d.hue, uKind[4], 0.8 * hit); d.loud = max(d.loud, 0.8 * hit);
  float r = sqrt(L.a * L.a + 0.0016) * (1.0 + 0.3 * hit) * exp2(own0 * (own0 > 0.0 ? 2.1 : 1.0)) * mix(1.0, 0.5 + 1.3 * h2 * h2, strewn) * (1.0 + 0.7 * abs(own2));
  d.r = clamp(r * left, 0.003, 0.4);
  vec3 by = strewn * (vec3(h, h2, h3) - 0.5) * 0.9 + bent * 0.4 * (vec3(wave(k.y * 2.0 + k.z * 2.0 + uTime * 0.02), wave(k.x * 2.0 + k.z * 3.0 - uTime * 0.03), wave(k.x * 3.0 + k.y + uTime * 0.025)) * 2.0 - 1.0);
  float room = 0.47 - (uVar > 0.5 ? min(0.1 + 2.2 * d.r + 0.15 * abs(own1), 0.44) : d.r);
  d.c = id + 0.5 + clamp(by, -room, room);
  return d;
}

// The air of a world, seen along a ray.
vec3 sky(vec3 rd) {
  float pale = max(own4, 0.0), deep = max(-own4, 0.0), up = sat(rd.y * 0.75 + 0.5);
  vec3 a = uKind[1] * uKind[1], b = uKind[0] * uKind[0];
  vec3 c = deep * (mix(b * 0.12, a * 0.75, up * up) + mix(a, vec3(1.0), 0.3) * 0.9 * pow(up, 5.0) * (0.7 + 0.5 * uLevel));
  return c + pale * mix(vec3(0.8, 0.78, 0.75), 0.12 + 0.75 * uKind[1], 0.35 + 0.35 * (1.0 - up)) * (0.6 + 0.4 * up);
}

vec3 field(vec3 ro, vec3 rd) {
  vec3 inv = 1.0 / rd, id = floor(ro), stp = sign(rd);
  vec3 tMax = (id + max(stp, 0.0) - ro) * inv, tDel = abs(inv);
  vec3 col = vec3(0.0); float alpha = 0.0;
  float pale = max(own4, 0.0), clear = max(-own5, 0.0), day = max(max(own5, 0.0), pale * (1.0 - clear)), dim = max(-own7, 0.0), bond = max(own7, 0.0), lit = max(day, clear), rods = step(0.5, uVar);
  vec3 air = sky(rd);
  float drawn = exp2(1.9 * own1);
  int steps = int(24.0 - (11.0 - max(-own2, 0.0)) * sat(2.0 * (abs(own0) + abs(own1) + abs(own2) + abs(own3) + abs(own4) + abs(own5) + abs(own7))));
  for (int i = 0; i < 24; i++) {
    if (i >= steps) break;
    vec3 o2 = id + 0.5 - ro; float t0 = dot(o2, rd), m2 = dot(o2, o2) - t0 * t0;
    if (m2 < 0.5 && t0 > -0.5) {
      Lamp d = lampOf(id);
      vec3 oc = d.c - ro, off, sq = vec3(1.0);
      float t, dd, r = d.r;
      if (rods > 0.5) {
        vec3 k = mod(id + 0.5, PERIOD) / PERIOD;
        float a = k.z * 2.0 + k.x + uTime * 0.02706, b = 0.7 * (wave(k.y + k.z * 3.0 - uTime * 0.02) * 2.0 - 1.0), sb = b - b * b * b / 6.0, cb = sqrt(1.0 - sb * sb);
        float up = max(own1, 0.0), lie = max(-own1, 0.0);
        vec3 ax = vec3((2.0 * wave(a) - 1.0) * cb, sb, (2.0 * wave(a - 0.25) - 1.0) * cb);
        ax = mix(mix(ax, vec3(0.08, 1.0, 0.0), up), vec3(1.0, 0.0, 0.12 + 0.25 * (d.h - 0.5)), lie);
        ax /= max(length(ax), 0.05);
        r = min(0.012 + 0.34 * d.r, 0.2);
        ax *= min(0.1 + 2.2 * d.r + 0.15 * abs(own1), 0.48 - r) * d.kept;
        dd = rodDist(ro, rd, d.c - ax, d.c + ax, t);
        vec3 q = d.c + ax * clamp(dot(ro + rd * t - d.c, ax) / max(dot(ax, ax), 1e-5), -1.0, 1.0);
        off = ro + rd * t - q;
        r *= d.kept;
      } else { // drawn upright, or pressed flat
        r *= own1 > 0.0 ? mix(1.0, 0.55, own1) : mix(1.0, 1.3, -own1);
        r = min(r, 0.44);
        float tall = min(drawn * r, 0.47) / r;
        sq.y = 1.0 / tall;
        vec3 p2 = oc * sq, r2 = rd * sq;
        float rr = dot(r2, r2); t = dot(p2, r2) / rr;
        off = r2 * t - p2; dd = length(off);
      }
      float near = smoothstep(0.1, 0.9 + 2.6 * max(own6, 0.0) * (1.0 - 0.8 * max(own5, 0.0)), t - r) * sat(float(steps - i) * 0.25);
      float fog = exp(-max(t, 0.0) * (0.17 - 0.1 * pale)) * near;
      float w = 0.006 + t * 1.2 / uRes.y + 0.012 * (1.0 - 0.85 * max(max(own0, 0.0), lit)) * abs(t - 5.0) / (1.0 + 0.4 * t);
      vec3 aside = abs(d.c - id - 0.5); float room = 0.47 - max(aside.x, max(aside.y, aside.z));   // a lamp's light ends inside its cell
      w = min(w, max((rods > 0.5 ? 0.47 : room) - r, 0.01));
      float small_ = min(1.0, 2.0 * r * r / (w * w));
      if (dim > 0.0) { r = mix(r, min(0.06 + 1.6 * r, room - 0.01), dim); w = mix(w, 0.012 + t * 1.2 / uRes.y, dim); small_ = mix(small_, 0.75, dim); }
      float cov = smoothstep(r + w, max(r - w, 0.0) - 1e-4, dd) * small_ * d.kept, core = sat(1.0 - dd / (r + w));
      float nz = sqrt(sat(1.0 - dd * dd / (r * r)));
      vec3 n = (off / r - rd * nz) * sq; n /= max(length(n), 1e-4);
      float ndv = sat(-dot(n, rd)), rim = 1.0 - ndv; rim *= rim;
      vec3 glow = d.light * mix((0.5 + 1.6 * core * core) * 1.5, 0.5 + 0.7 * rim, dim) + dim * d.hue * (0.05 + 0.07 * rim);
      vec3 c = glow, pig = d.hue * (0.3 + 0.7 * d.hue);
      float wrap = sat(dot(n, gSun) * 0.7 + 0.3), spec = sat(dot(reflect(rd, n), gSun));
      spec *= spec; spec *= spec; spec *= spec; spec *= spec * spec; // to the 24th
      c = mix(c, pig * (0.12 + 0.16 * pale + 1.15 * wrap * wrap) * (0.65 + 0.7 * d.loud) + d.light * 0.3 * (1.0 - pale) + spec * 0.15, day);
      c = mix(c, air * (0.9 - 0.4 * pale * rim) + (mix(pig, d.hue, 0.5) * (1.0 - 0.75 * pale) * rim * (0.45 + 1.2 * d.loud)) * (1.0 - 0.4 * pale) + d.light * 0.25 * (1.0 - pale) + spec * spec * 0.7, clear);
      c = mix(c, pig * (0.25 + 0.4 * d.loud), clear * pale * rim * 0.8);
      float see = fog * (1.0 - alpha);
      float body = cov * mix(1.0, 0.35 + 0.65 * rim, clear);
      // night: light on black. elsewhere: a thing in the air, and the farther the more air
      float lie = max(abs(own4), lit);
      col += (1.0 - alpha) * body * mix(c * fog, mix(air, c, fog / max(near, 0.01)) * near, lie);
      alpha += (1.0 - alpha) * body * mix(mix(0.9, 1.0, lie), 0.16, dim) * near;
      float g = sat(1.0 - (dd - r) / min(0.02 + 1.6 * r, max((rods > 0.5 ? 0.47 : room) - r, 0.02)));
      col += see * d.light * g * g * g * 0.3 * d.kept * (1.0 - pale) * (1.0 - 0.7 * lit);
      if (bond > 0.0) {
        vec3 e = ro - d.c;
        // the three threads through the lamp, each along an axis
        vec3 along = vec3(dot(e, rd)) - rd * e, ab = max(1.0 - rd * rd, 1e-3);
        vec3 tb = -along / ab;
        vec3 px = e + rd * tb.x, py = e + rd * tb.y, pz = e + rd * tb.z;
        vec3 ds = vec3(length(px.yz), length(py.xz), length(pz.xy)), hold = step(abs(vec3(px.x, py.y, pz.z)), vec3(0.5));
        vec3 wb = 0.012 + tb * 0.8 / uRes.y;
        vec3 cb = smoothstep(wb + 0.012, wb * 0.4, ds) * hold * smoothstep(0.5, 1.6, tb) * min(0.02 / wb, vec3(1.0)) * exp(-tb * 0.16) * vec3(1.0 - max(-own2, 0.0), 1.0 - max(own2, 0.0), 1.0 - max(-own2, 0.0));
        float bc = max(cb.x, max(cb.y, cb.z)) * bond * d.kept * (1.0 - 0.8 * max(own3, 0.0)) * (1.0 - cov);
        col += (1.0 - alpha) * bc * mix(d.hue * (0.03 + 0.5 * d.loud), pig * (0.35 + 0.3 * d.loud), max(pale, day));
        alpha += (1.0 - alpha) * bc * lie;
      }
      if (alpha > 0.98) break;
    }
    if (tMax.x < tMax.y && tMax.x < tMax.z) { tMax.x += tDel.x; id.x += stp.x; }
    else if (tMax.y < tMax.z) { tMax.y += tDel.y; id.y += stp.y; }
    else { tMax.z += tDel.z; id.z += stp.z; }
  }
  return col + (1.0 - alpha) * air;
}

// To the screen: worlds that are lit, and not all lamps, keep the colours of things.
vec3 shown(vec3 col) {
  vec3 was = tone(col * 1.2);
  float lit = sat(max(max(own4, 0.0), 0.8 * max(own5, 0.0)));
  return lit > 0.0 ? mix(was, pow(1.0 - exp(-1.75 * max(col, 0.0)), vec3(0.4545)), lit) : was;
}

vec3 render(vec2 p) {
  vec3 fly = normalize(vec3(0.26, 0.11, 1.0));
  vec3 way = fly;
  if (own2 != 0.0 || own6 != 0.0) {
    way.y *= 1.0 - max(own2, 0.0);
    way = mix(way, vec3(0.05, 0.6, 0.12), max(own6, 0.0));
    way = mix(way, vec3(0.7, 0.03, 0.06), max(-own6, 0.0));
  }
  vec3 ro = mod(way * uTravel * 3.2 + vec3(0.5, 4.3, 0.0), PERIOD);
  // look along the flight, wandering a little, rolling slowly
  vec3 fw = normalize(fly + vec3(0.32 * sin(uTime * 0.07), 0.2 * sin(uTime * 0.053 + 1.0), 0.0));
  vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)), up = cross(fw, rt);
  float lean = 0.25 * sin(uTime * 0.041);
  p = rot(lean) * p;
  vec3 rd = normalize(fw * 0.8 + rt * p.x + up * p.y);
  rd += step(abs(rd), vec3(1e-4)) * 2e-4;
  gMid = ro + fw * 8.0;
  gSun = normalize(rt * -0.65 + up * 0.6 - fw * 0.4);
  vec3 col;
  if (abs(own0) + abs(own1) + abs(own2) + abs(own3) + abs(own4) + abs(own5) + abs(own7) > 0.0) col = field(ro, rd);
  else if (uVar < 0.5) col = points(ro, rd); else col = rods(ro, rd);
  return shown(col);
}
