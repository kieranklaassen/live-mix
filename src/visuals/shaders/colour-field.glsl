// name: Colour field
// a: Fog
// b: Coarse print
// what: The piece laid on wet ground as light under a low fog, looked across from the front of the room to the back: each sound a bank of glowing colour, the far ones small on the horizon, all of them drawn out long in the wet floor; or the same field flat on, made only of grain, like a photograph printed coarse.
// follows: Each stroke of the piece glows in its colour and swells as it plays, melting into its neighbours; the place now playing is a seam of light drifting across, and a hit flares along it; a cue blooms where it fell; in the print the grain is as dense as the field is bright.
// own: 0 the ground and the sky: 1 pale day (b: white paper, the grain laid on as ink), -1 dusk with a glow along the horizon (b: deep tinted paper); 1 1 ridges of hills one behind another (b: the field bent into rings round a middle), -1 open water that mirrors (b: a meadow laid back to a horizon); 2 1 the fog heaped in round clouds (b: few and great grains), -1 combed into level sheets (b: fine as dust); 3 1 tall trunks stand in it (b: grain drawn out into strokes), -1 round stones (b: hollow rings); 4 1 tall curtains (b: set in an even lattice), -1 broken into round lights (b: swept into a swirl); 5 1 from high above, no sky (b: wrapped on a globe), -1 a low horizon and much sky (b: cut into upright panels); 6 1 a low sun (b: domed beads lit from one side), -1 a vast pale disc beyond (b: out of focus, depth behind depth); 7 1 steams upward (b: rises), -1 blown across (b: falls)

float fiWorld;   // 0 as it draws itself, 1 another world
// The piece a little softer than it comes, so that strokes melt.
vec4 fiSoft(vec2 uv, float r) {
  vec4 m = piece(uv) * 0.36;
  m += 0.16 * (piece(uv + vec2(r, 0.0)) + piece(uv - vec2(r, 0.0)) + piece(uv + vec2(0.0, r * 0.7)) + piece(uv - vec2(0.0, r * 0.7)));
  return m;
}
// From what the piece holds to light: deep at the edge of a glow, hot at its heart, turning through the hues next to its own.
vec3 fiGlow(vec4 m) {
  float a = m.a;
  vec3 h = m.rgb / max(a, 0.03);
  float l = dot(h, vec3(0.3333));
 h = max(mix(vec3(l), h, mix(1.9, 1.2, fiWorld)), 0.);
 h = hueShift(h, (.42 - a)*.13*(1. - .75*fiWorld));
  h = max(h, 0.0);
 return h*(a*a*1.9 + a*.16) + vec3(1., .9, .8)*pow(a, 5.)*.5*(1. - .8*fiWorld);
}
// The light of the field at a place: x the loop, y the room. soft is how wide it is smeared.
vec3 fiLight(vec2 uv, float soft) {
  float edge = smoothstep(-0.02, 0.1, uv.x) * smoothstep(1.02, 0.9, uv.x) * smoothstep(-0.02, 0.1, uv.y) * smoothstep(1.02, 0.92, uv.y);
  vec4 m = fiSoft(clamp(uv, 0.004, 0.996), soft);
  vec3 col = fiGlow(m);
  // the place now playing: a seam of light
  float dx = uv.x - uLoop;
  float seam = (exp(-dx * dx / (0.00022 + soft * soft * 0.3)) + 0.3 * exp(-dx * dx / 0.006)) * (1.0 + 1.5 * uHits);
 seam *= 1. - .6*fiWorld;
  col += (col * 2.2 + fiGlow(vec4(m.rgb, m.a) * 0.6 + vec4(0.02)) * 0.6 + vec3(0.012, 0.013, 0.016)) * seam * (0.5 + 0.8 * uLevel);
  return col * edge;
}

// The colour of the fog over a sound: purer than the piece's own, and turning toward the next hue as it rises.
vec3 fiDeep(vec4 m, float up) {
  vec3 h = m.rgb / max(m.a, 0.04);
 h = max(mix(vec3(dot(h, vec3(.3333))), h, mix(1.75, 1.2, fiWorld)), 0.);
 return max(hueShift(h, (-.03 + .045*min(up, 2.5))*(1. - .8*fiWorld)), 0.)*m.a*(1. - .3*fiWorld);
}
// A place on the ground as a place in the piece: across is the loop, far is the back of the room.
vec2 fiGround(float x, float z) { return vec2(x / (5.2 + 0.9 * z) + 0.5, 1.0 - log(z / 2.1) / 2.9); }
float fiSeam(float x) { float d = x - uLoop; return (exp(-d * d / 0.00016) + 0.25 * exp(-d * d / 0.004)) * (1.0 + 1.2 * uHits) + 0.5 * uHits * exp(-d * d / 0.012); }
vec3 fiAir; float fiDay, fiDusk;   // how far it is either
// Another sky than black: day, dusk, a sun, a disc beyond.
vec3 fiSky(vec2 d) {
 float up = max(d.y, 0.);
 vec3 c = vec3(0.);
 if (fiDay > 0.) {
  vec3 tint = mix(vec3(1.), uKind[1]/(max(max(uKind[1].r, uKind[1].g), uKind[1].b) + .01), .3);
  c += fiDay*mix(vec3(2.3, 2.2, 2.05), vec3(1.25, 1.3, 1.36)*tint, smoothstep(0., .6, up));
  }
 if (fiDusk > 0.) {
  float veil = .8 + .4*noise(vec2(d.x*1.1 + uTime*.006, d.y*8.));
  c += fiDusk*(.85 + .35*uLevel)*(uKind[3]*uKind[3]*1.15*exp(-up*9.)*veil + uKind[1]*uKind[1]*.75*exp(-up*3.2)*veil + uKind[0]*uKind[0]*.2);
  }
 if (uOwn[6] > 0.) {
  vec2 e = d - vec2(-.3, .115);
  float r = length(e), lit = smoothstep(.058, .054, r);
  vec3 k = uKind[3]*mix(uKind[3], vec3(1.), .3);
  c += uOwn[6]*(1. - .6*fiDay)*k*(.5*exp(-r*4.) + .6*exp(-r*13.))*(.8 + .4*uLevel);
  c = mix(c, mix(k*2.6, uKind[4]*1.2, fiDay), lit*uOwn[6]);
  }
 if (uOwn[6] < 0.) {
  vec2 e = (d - vec2(.3, .1))/.36;
  float r2 = dot(e, e), z = sqrt(max(1. - r2, 0.));
  float lamp = sat(dot(vec3(e, z), vec3(-.62, .34, .7)));
  float bands = fbm(vec2(e.y*5. + .5*fbm(e*3.), e.x*.8 + uTime*.004));
  vec3 body = mix(uKind[2], uKind[1], bands)*(.05 + 1.05*lamp*lamp)*(.6 + .7*bands)*(.85 + .3*uLevel);
  float edge = 1.4/(.36*uRes.y);
  c = mix(c, mix(body, c*.62 + body*.5, fiDay), -uOwn[6]*smoothstep(1. + edge, 1. - edge, sqrt(r2)));
  c += -uOwn[6]*(1. - fiDay)*uKind[1]*.1*exp(-max(sqrt(r2) - 1., 0.)*5.)*smoothstep(.9, 1., sqrt(r2));
  }
 return c;
}
// What stands at one depth, laid over what lies further.
void fiThing(float fl, vec2 rd, float eye, float cx, float mirror, inout vec3 col, inout float through) {
 if (through < .01) return;
 float z = 2.1*pow(1.26, fl + .5), y = eye + rd.y*z, x = rd.x*z + cx, px = z/uRes.y;
 vec2 uv = fiGround(x, z);
 vec4 m = piece(uv)*smoothstep(0., .07, uv.x)*smoothstep(1., .93, uv.x);
 float seam = fiSeam(uv.x)*.6, far = 1. - exp(-z*.055);
 vec3 hue = m.rgb*.75, air = fiAir;
 vec3 mist = hue*(m.a*1.5 + .1)*(1. + 2.*seam);
 vec3 tint = m.rgb/max(m.a, .05)*1.9;
 if (uOwn[1] > 0.) {
  vec2 k = vec2(x/z*1.7 + fl*5.3, fl*9.1); float n = .52*noise(k) + .27*noise(k*2.1) + .14*noise(k*4.3);
  float crest = uOwn[1]*z*(.03 + .36*fl/11.)*(n*1.75 - .28), d = (crest - y)/z;
  float cover = smoothstep(-px, px, crest - y)*sat(uOwn[1]*4.), foot = smoothstep(0., .15, d);
  vec3 rock = uKind[2]*uKind[2]*(.03 + .2*fiDay) + hue*m.a*.12;
  vec3 low = mix(mist + air*.6, mix(air, tint, sat(m.a*1.3)*.75), fiDay);
  vec3 f = mix(mix(rock, air, far*(.65 + .3*fiDay)), low, foot*(.55 + .4*fiDay));
  f += (mist*.5 + vec3(.02))*exp(-d*60.)*seam*(1. - fiDay);
  col += through*cover*f; through *= 1. - cover;
  }
 if (uOwn[2] > 0.) { 
  float k = 1./(.8 + .09*z), n = noise(vec2(x*.8*k + fl*17., fl*3.3 + uTime*.012));
  vec2 b = vec2(x, y)*k; float blow = .02*uTime + 2.*fl;
  float puff = abs(noise(b*2.3 + vec2(blow, fl)) - .5) + .5*abs(noise(b*5.1 - vec2(blow, fl)) - .5);
  float d = (n*n*2.1 - .12)*(.3 + .8*piece(clamp(uv, .01, .99)).a + .25*n)*(.35 + .1*z) - y - puff*.5/k;
  float cover = smoothstep(0., .16/k, d)*smoothstep(-.5, -.02, y*k)*uOwn[2]*(.4 + .6*sat(m.a*2.));
  float top = exp(-max(d, 0.)*k*2.6), form = .35 + 1.5*puff;
  vec3 idle = mix(uKind[0], uKind[1], n), own = mix(idle, m.rgb/max(m.a, .04), sat(m.a*2.5));
  vec3 f = own*own*(.1 + 1.1*m.a)*(.18 + 1.3*top*form)*(1. + 1.5*seam) + air*(.1 + .8*top*form);
  f = mix(f, (own*1.35 + .25)*(.62 + .75*top*(.5 + form*.6)), fiDay);
  f = mix(f, air, far*max(fiDay, fiDusk)*.7);
  col += through*cover*f; through *= 1. - cover;
  }
 float ya = y < 0. ? -y : y, seen = y < 0. ? mirror : 1.;
 if (uOwn[3] > 0.) {
  float w = 1.25, id = floor(x/w);
  vec2 h = hash22(vec2(id, fl*3.7 + 1.));
  float dx = x - (id + .5 + (h.x - .5)*.5)*w + (h.y - .5)*.1*ya + .03*sin(ya*1.7 + h.x*30.);
  float hw = (.035 + .085*h.y)*uOwn[3]*smoothstep(.38, .46, fract(h.x*7.3) - .2*step(fl, 1.5))*(1. + .5*exp(-ya*4.))/(1. + .05*ya);
  float cover = smoothstep(px, -px, abs(dx) - hw)*smoothstep(0., px*2., ya)*seen*step(.004, hw);
  if (cover > .002) {
  float side = dx/max(hw, .01), bark = noise(vec2(dx*26., ya*3. + h.x*40.));
  vec3 f = (mist*.5 + air*.25)*smoothstep(.2, 1., -side)*(.4 + bark) + uKind[2]*uKind[2]*(.012 + fiDay*.24*(.45 + bark)*(.75 - .4*side));
  f = mix(f, mix(mist, mix(air, tint, sat(m.a)*.5), fiDay) + (1. - fiDay)*air, far*mix(.75, 1., fiDay));
  col += through*cover*f; through *= 1. - cover; }
  }
 if (uOwn[3] < 0.) {
  float w = 1.9, id = floor(x/w);
  vec2 h = hash22(vec2(id, fl*5.1 + 2.));
  float R = (.1 + .62*h.y*h.y)*-uOwn[3]*smoothstep(.4, .5, fract(h.x*9.1)) + 1e-3;
  vec2 e = vec2(x - (id + .5 + (h.x - .5)*.5)*w, ya*1.2)/R;
  float r2 = dot(e, e), cover = smoothstep(1. + px/R, 1. - px/R, sqrt(r2))*seen*step(.02, R);
  float nz = sqrt(max(1. - r2, 0.)), lamp = sat(.3 + .75*e.y - .45*e.x*.8);
  float grit = .75 + .5*noise(e*9. + h*40.);
  vec3 f = uKind[2]*uKind[2]*grit*(.02 + lamp*lamp*(.12 + .55*fiDay + .16*fiDusk)) + (mist*.8 + air*.5)*pow(1. - nz, 2.5)*sat(e.y + .3);
  f += mist*.35*exp(-ya*5.);
  f = mix(f, mix(mist, mix(air, tint, sat(m.a)*.5), fiDay) + (1. - fiDay)*air, far*mix(.6, .95, fiDay));
  col += through*cover*f; through *= 1. - cover;
  }
 if (uOwn[4] < 0. && fl > .5) {
  float w = 1. + .05*z, id = floor(x/w);
  vec2 h = hash22(vec2(id, fl*2.3 + 7.));
  float go = fract(h.x*5.7 + uTime*.02*max(uOwn[7], 0.)), y0 = mix(.22 + .55*h.y, .1 + 2.6*go, max(uOwn[7], 0.));
  float on = mix(1., smoothstep(0., .15, go)*smoothstep(1., .7, go), max(uOwn[7], 0.))*-uOwn[4];
  vec4 k = piece(clamp(fiGround((id + .5)*w, z), .01, .99));
  vec3 own = k.rgb/max(k.a, .04)*k.a + mix(uKind[1], uKind[3], h.x)*.5*(1. - k.a);
  float R = (.06 + .1*h.y)*(.7 + .5*k.a), stretch = y < 0. ? mix(1., .28, smoothstep(0., y0, ya)) : 1.;
  vec2 e = vec2(x - (id + .5 + (h.x - .5)*.4)*w, (ya - y0)*stretch)/R;
  float r = length(e), in_ = smoothstep(.5*w, 0., abs(e.x)*R);
  vec3 b = own*own*(.2 + 1.1*k.a)*(1. + 2.*fiSeam(uv.x));
  float core = smoothstep(1. + px/R, .6, r)*seen*on;
  col += through*on*in_*seen*b*(1.1*exp(-r*r*.12) + .25*exp(-r*.9))*(1. - .7*fiDay);
  col += through*core*(b*1.5 + vec3(1., .9, .75)*(.06 + .3*k.a*k.a))*(1. - fiDay);
  col += through*core*fiDay*own*1.4; through *= 1. - core*fiDay*.92;
  }
}
// The field laid on wet ground as light under a low fog, looked across from the front of the room to the back.
vec3 fiFog(vec2 p) {
  float eye = 1.9 + 0.12 * sin(uTime * 0.05);
  vec2 rd = vec2(p.x, p.y - 0.21);
 float water = max(-uOwn[1], 0.), high = max(uOwn[5], 0.);
 bool world = uOwn[0] != 0. || uOwn[6] != 0., things = uOwn[1] > 0. || uOwn[2] > 0. || uOwn[3] != 0. || uOwn[4] < 0.;
 if (uOwn[5] != 0.) { rd.y += uOwn[5] > 0. ? -.6*uOwn[5] : -.36*uOwn[5]; eye *= 1. + 1.1*high; }
  float jit = hash21(gl_FragCoord.xy + fract(uTime) * 37.0);
  float cx = 0.8 * sin(uTime * 0.043);
 jit = mix(jit, .5, .85*max(max(-uOwn[2], max(uOwn[4], max(uOwn[1], 0.))), max(uOwn[7], .5*max(uOwn[3], 0.))));
  // the ground under this ray: rough where dry, a mirror where water lies
  float zg = rd.y < -0.001 ? min(eye / -rd.y, 60.0) : 60.0;
  vec2 g = vec2(rd.x * zg + cx, zg);
  float pool = smoothstep(0.36, 0.68, noise(g * vec2(0.42, 0.26) + 2.0) * 0.75 + 0.25 * noise(g * 1.3));
  float mirror = rd.y < 0.0 ? mix(0.1, 0.46, pool) : 0.0;
 if (water > 0.) { mirror = rd.y < 0. ? mix(mirror, .8, water) : 0.; pool = mix(pool, 1., water); }
  // the depths that are looked into: from above only where the fog lies
 float z0 = 2.1, zr = 1.26, lay = 0.;
 if (high > 0.) { float into = max((eye - 2.)/max(-rd.y, .05), 1.); z0 = mix(2.1, into, high); zr = mix(1.26, pow(max(zg*1.25, into*1.1)/into, 1./12.), high); }
 bool other = fiWorld > 0.;
 if (things) fiAir = fiSky(vec2(rd.x, 0.))*(.8*fiDay + .28*fiDusk);
  vec3 col = vec3(0.0);
  float through = 1.0; // how much of what lies further still reaches the eye
  for (int i = 0; i < 12; i++) {
    float z = 2.1 * pow(1.26, float(i) + jit);
  if (high > 0.) z = z0*pow(zr, float(i) + jit);
  if (things) while (lay < 11.5 && 2.1*pow(1.26, lay + .5) < z) { fiThing(lay, rd, eye, cx, mirror, col, through); lay += 1.; }
    float y = eye + rd.y * z;
    float x = rd.x * z + cx;
    vec2 uv = fiGround(x, z);
    vec4 m = piece(uv) * smoothstep(0.0, 0.07, uv.x) * smoothstep(1.0, 0.93, uv.x); // the ends of the loop fade out
    float thick = 0.14 + 0.04 * z;
  float wisp = other ? 0. : noise(vec2(x*.5 + uTime*.03, z*.5 - uTime*.05) + y);
    wisp = 0.25 + 2.6 * wisp * wisp;
  float ya = abs(y), body = 0.;
  if (other) {
   float heap = max(uOwn[2], 0.), sheet = max(-uOwn[2], 0.), tall = max(uOwn[4], 0.), rise = max(uOwn[7], 0.), blow = max(-uOwn[7], 0.);
   vec3 idle = mix(uKind[0], uKind[1], noise(vec2(x*.3, z*.4)));
   float some = .17*max(sheet, max(tall, .6*rise))*smoothstep(40., 20., z)*(1. - m.a);
   m += vec4(idle*some, some);
   thick *= (1. + 4.5*tall)*(1. + 1.2*high)*(1. + 1.6*rise + 1.8*blow);
   float xx = x + blow*(ya*2.6 + uTime*.16);
   float w = noise(vec2(xx*mix(.5, .75, blow) + uTime*.03, z*.5 - uTime*.05) + ya*(1. - .7*blow));
   w = mix(.25 + 2.6*w*w, 5.*w*w*w, blow);
   if (rise > 0.) { float v = noise(vec2(x*1.6 + .5*sin(ya*1.4 + z), ya*1.1 - uTime*.22 + z*3.)); w = mix(w, 5.*v*v*v, rise); }
   if (tall > 0.) { float v = noise(vec2(xx*1.7 + .5*sin(z + uTime*.04) + .3*sin(ya*1.3 + z*2.), z*.35 + 5.)); w = mix(w, .08 + 4.6*v*v*v, tall); }
   body = exp(-ya/thick)*w;
   if (sheet > 0.) {
    float at = ya/(.2 + .035*z) + .6*noise(vec2(x*.16, z*.25 + uTime*.02));
    float s = .5 + .5*cos(at*4.2); s *= s; s *= s;
    body = mix(body, exp(-ya/(thick*4.))*(.04 + 3.4*s*s), sheet);
   }
   body *= 1. - max(.9*heap, .8*max(-uOwn[4], 0.));
  }
    // under the ground lies the same fog as the wet floor holds it: drawn out long toward the eye, as wet ground does
    float dens = (y < 0.0 ? exp(y / (thick * 2.6)) * mirror : exp(-y / thick) * wisp) * z * 0.14;
  if (other) dens = (y < 0. ? mix(mix(exp(y/(thick*2.6)), body, water)*mirror, body*exp(y*1.6), max(max(uOwn[4], 0.), max(uOwn[7], 0.))*(1. - water)) : body)*z*mix(.14, 1.1*log(zr), high);
    vec3 e = fiDeep(m, abs(y) / thick);
  if (fiDay > 0.) {
   float w = fiDay*(1. - exp(-m.a*dens*3.2));
   vec3 hue = m.rgb/max(m.a, .04), lit = (hue*1.25 + .06)*(.82 + .3*sat(y*1.2))*(1. + .3*fiSeam(uv.x));
   col += through*(lit*w + (1. - fiDay)*e*(m.a*2.7 + .07)*(1. + 3.5*fiSeam(uv.x))*dens);
   through *= (1. - w)*mix(exp(-m.a*dens*1.6), 1., fiDay);
   continue;
  }
    col += through * e * (m.a * 2.7 + 0.07) * (1.0 + 3.5 * fiSeam(uv.x)) * dens;
    through *= exp(-m.a * dens * 1.6);
  }
 if (things) while (lay < 11.5) { fiThing(lay, rd, eye, cx, mirror, col, through); lay += 1.; }
  // the ground itself, lit by the fog over it: grit that catches the light, finer the further off
  if (rd.y < -0.001) {
    vec2 uv = fiGround(g.x, g.y);
    vec4 m = piece(uv);
    float grain = 48.0 / exp2(floor(log2(max(zg, 1.0))));
    vec2 id = floor(g * grain), ff = fract(g * grain) - 0.5;
    vec2 h = hash22(id);
    float speck = smoothstep(0.3, 0.1, length(ff - (h - 0.5) * 0.5)) * step(0.72, h.x) * (0.4 + 0.6 * sin(uTime * (0.4 + h.y) + h.y * 40.0));
  if (world) {
   vec2 w = g*vec2(.5, 2.2) + vec2(uTime*.02, uTime*.05);
   float rip = (noise(w*1.7) + .5*noise(w*vec2(5., 4.)) - .75)*(.05 + .05*water)*exp(-zg*.07);
   vec3 sky = fiSky(vec2(rd.x + rip, max(-rd.y + rip*1.6, 0.)));
   vec3 floor_ = fiDay*vec3(1.75, 1.7, 1.62)*(.9 + .16*(noise(g*vec2(1.2, .8)) - .5)*smoothstep(30., 8., zg) + .1*(noise(g*6.) - .5)*smoothstep(14., 4., zg));
   floor_ = mix(floor_, fiSky(vec2(rd.x, 0.)), fiDay*(1. - exp(-zg*.07)));
   floor_ += fiDusk*.75*(1. - exp(-zg*.045))*fiSky(vec2(rd.x, 0.));
   vec3 tint = m.rgb/max(m.a, .05);
   floor_ = mix(floor_, tint*1.6, fiDay*.55*sat(m.a*1.4)*smoothstep(60., 20., zg));
   col += through*mix(floor_, sky*.82*mix(1., .9, fiDay), mirror*mix(smoothstep(60., 8., zg), 1.15, water))*mix(1., .75, fiDay*water);
   through *= 1. - fiDay*(1. - .25*water);
  }
  col += through*(1. - .9*max(water, uOwn[2]))*fiDeep(m, 0.)*(m.a*1.6 + .2)*(1. + 4.*fiSeam(uv.x))*(.1 + .9*max(speck, 0.))*(1. - .8*pool)*smoothstep(60., 20., zg);
 } else if (world) col += through*fiSky(rd);
  return col;
}

// One layer of grain: a speck in each cell, there if the field is brighter than the cell's own threshold.
vec3 fiSpecks(vec2 uv, float asp, float rows, float seed, float turn) {
  vec2 g = rot(turn) * (uv * vec2(asp, 1.0)) * rows + seed * 13.7;
  vec2 id = floor(g), f = fract(g) - 0.5;
  vec2 h = hash22(id + seed);
  vec2 at = (h - 0.5) * 0.56;
  vec2 c = (rot(-turn) * ((id + 0.5 + at - seed * 13.7) / rows)) / vec2(asp, 1.0); // the place of this speck in the field
  vec3 light = fiLight(c, 0.02);
  float lum = dot(light, vec3(0.4, 0.45, 0.35));
  float dens = 1.0 - exp(-lum * 3.2);
  float th = fract(h.x * 7.31 + h.y * 3.17);
  th = sat(th + 0.07 * sin(uTime * (0.25 + 0.5 * h.y) + h.x * 50.0)); // the grain boils slowly
  float there = smoothstep(th - 0.06, th + 0.1, dens);
  float r = (0.16 + 0.3 * h.y) * there * (0.7 + 0.5 * dens);
  float aa = rows / uRes.y * 1.3;
  float dot_ = smoothstep(r + aa, r - aa, length(f - at)) * step(0.001, there);
  vec3 hue = light / max(lum, 0.02);
  hue = max(hueShift(hue, (h.x - 0.5) * 0.22), 0.0); // each speck its own dye
  return hue * dot_ * (0.5 + 0.9 * dens);
}
vec3 fiPrint(vec2 p) {
  float asp = uRes.x / uRes.y;
  vec2 uv = vec2(p.x / asp * 1.04 + 0.5, 0.5 - p.y * 1.08);
  uv += 0.006 * vec2(sin(uTime * 0.07), cos(uTime * 0.053));
  vec3 col = fiSpecks(uv, asp, 118.0, 1.0, 0.31);
  col += fiSpecks(uv, asp, 171.0, 2.0, -0.52) * 0.8;
  col += fiSpecks(uv, asp, 67.0, 3.0, 1.13) * 0.9;
  // light spreading in the paper behind the brightest grain
  vec3 under = fiLight(uv, 0.06);
  col += hueShift(under, -0.04) * 0.13;
  return col;
}
// The print in another world: where in the field a place of the sheet is (z: whether the sheet is there at all, w: how lit).
vec4 fiPlace(vec2 c, float asp) {
 vec2 p = (c - .5)*vec2(asp, 1.);
 float mask = 1., lit = 1., r = length(p);
 if (uOwn[1] > 0.) {
  float a = r > 1e-4 ? atan(p.x, p.y)/TAU + .5 : .5;
  c = mix(c, vec2(fract(a), .02 + r/.5), uOwn[1]);
  float groove = .5 + .5*cos(r*95. + 2.2*noise(p*5.));
  mask *= mix(1., smoothstep(.53, .5, r)*smoothstep(.035, .07, r)*mix(1., smoothstep(.1, .6, groove), .75), uOwn[1]);
  }
 if (uOwn[5] > 0.) {
  vec2 n = p/.46; float n2 = dot(n, n), z = sqrt(max(1. - n2, 0.));
  vec2 ball = vec2(atan(n.x, z + 1e-3)/PI + .5, asin(clamp(n.y, -1., 1.))/PI + .5);
  c = mix(c, .04 + .92*ball, uOwn[5]);
  mask *= mix(1., smoothstep(1., .97, n2), uOwn[5]);
  lit *= mix(1., .16 + 1.1*sat(dot(vec3(n, z), vec3(-.5, -.45, .74))), uOwn[5]);
  }
 if (uOwn[4] < 0.) {
  p = (c - .5)*vec2(asp, 1.);
  vec2 q = p - vec2(-.16, .03);
  float l2 = dot(q, q);
  p = rot(uOwn[4]*(3.6*exp(-l2*4.5) + .12*sin(uTime*.07)))*q + vec2(-.16, .03);
  vec2 q2 = p - vec2(.52, -.1);
  p = rot(-uOwn[4]*2.2*exp(-dot(q2, q2)*8.))*q2 + vec2(.52, -.1);
  c = p/vec2(asp, 1.) + .5;
  }
 if (uOwn[5] < 0.) {
  float s = (c.x - .5)*6., id = floor(s), f = s - id;
  c.y = mix(c.y, c.y + .22*(hash11(id + 3.3) - .5), -uOwn[5]);
  mask *= mix(1., smoothstep(.1, .13, f)*smoothstep(.9, .87, f)*smoothstep(.02, .03, c.y)*smoothstep(.98, .97, c.y), -uOwn[5]);
  }
 return vec4(c, mask, lit);
}
// One layer of grain there: rgb its colour, w how far it covers; under it what shadow it throws.
vec4 fiGrain(vec2 uv, float asp, float rows, float seed, float turn, out float shade, out float dens, out vec3 ink) {
 float big = max(uOwn[2], 0.), m = max(-uOwn[1], 0.), even = max(uOwn[4], 0.), bend = max(sat(uOwn[1]), sat(-uOwn[4]));
 float stroke = max(uOwn[3], 0.), hollow = max(-uOwn[3], 0.), dome = max(uOwn[6], 0.), blur = max(-uOwn[6], 0.);
 shade = 0.; dens = 0.; ink = vec3(0.);
 rows *= exp2(-1.75*big + .85*max(-uOwn[2], 0.) - .8*max(abs(uOwn[3]), max(dome, 1.3*blur)));
 rows *= 1. - .3*m;
 rows = mix(rows, 56.*exp2(-1.2*big + 1.1*max(-uOwn[2], 0.)), even);
 turn *= (1. - even)*(1. - sat(4.*m))*(1. - .85*stroke);
 float k = exp2(.85*stroke*(1. - bend)), go = uTime*uOwn[7]*rows*.022*(.6 + .25*seed)/k;
 vec2 f, id, h, at, c; float scale = 1.;
 if (m > 0.) {                
  float v = uv.y - .3;
  if (v < 0.) return vec4(0.);
  float S = m/.5, V0 = 1. - m + S*.07, W = log((V0 + S*v)/V0)/S, W1 = log((V0 + S*.78)/V0)/S;
  float row = W*rows/k + go, j = floor(row);
  scale = V0*exp((j + .5 - go)*k/rows*S);
  float gx = (uv.x - .5)*asp/scale*rows*k + hash11(mod(j, 512.) + seed)*7.;
  id = vec2(floor(gx), j); f = vec2(gx, row) - id - .5;
  h = hash22(mod(id, 512.) + seed*3.1); at = (h - .5)*.5;
  c = vec2((gx - f.x + at.x - hash11(mod(j, 512.) + seed)*7.)*scale/(rows*k)/(asp*mix(1., .7 + .25*scale, m)) + .5, (j + .5 + at.y - go)*k/rows/W1);
 } else {
  mat2 tr = rot(turn);
  vec2 g = (tr*(uv*vec2(asp, 1.))*rows)*vec2(k, 1./k) + seed*13.7*(1. - even) + vec2(0., go);
  if (even > 0.) g.x += .5*mod(floor(g.y), 2.)*even;
  id = floor(g); f = g - id - .5;
  h = hash22(mod(id, 512.) + seed);
  at = (h - .5)*.56*(1. - even);
  vec2 w = id + .5 + at - vec2(0., go) - seed*13.7*(1. - even);
  if (even > 0.) w.x -= .5*mod(id.y, 2.)*even;
  c = (rot(-turn)*(w/vec2(k, 1./k)/rows))/vec2(asp, 1.);
  }
 vec2 sheet = c;
 if (uOwn[7] != 0.) { float t = fract(h.x*3.3 + h.y*11.); c.y += uOwn[7]*.42*t*t*t; }
 vec4 pl = fiPlace(c, asp);
 vec3 light = fiLight(pl.xy, .02);
 float lum = dot(light, vec3(.4, .45, .35)), th = fract(h.x*7.31 + h.y*3.17);
 float sound = 1. - exp(-lum*3.2), idle = max(max(.5*m, .22*even), max(.5*sat(uOwn[1]), max(.3*abs(uOwn[5]), .12*dome)));
 float now = exp(-(pl.x - uLoop)*(pl.x - uLoop)*160.);
 dens = (max(sound, idle) + now*(.12 + .4*uHits)*fiDay)*pl.z;
 th = sat(th + .07*sin(uTime*(.25 + .5*h.y) + h.x*50.));
 th = mix(th, .1, even);
 float there = smoothstep(th - .06, th + .1, dens)*smoothstep(0., .02, dens);
 float wide = mix(h.y, .75, even);
 float r = (.16 + .3*wide)*there*(.7 + .5*dens);
 if (even > 0.) r = mix(r, min(.12 + .36*sqrt(dens), .47)*step(.01, dens), even);
 if (blur > 0.) r = mix(r, min(r*1.4, .36), blur);
 float aa = rows*k/scale/uRes.y*1.3;
 vec2 o = f - at;
 if (stroke > 0. && bend > 0.) {
  vec2 q = (sheet - .5)*vec2(asp, 1.), e = q - vec2(-.16, .03);
  float flow = uOwn[1] > 0. ? atan(q.x, -q.y + 1e-5) : atan(e.x, -e.y + 1e-5);
  vec2 w = rot(flow)*(rot(-turn)*o);
  o = mix(o, w*vec2(.75, 1.9), stroke*bend);
  }
 float len = length(o), d = len - r;
 if (hollow > 0.) d = mix(d, abs(len - r*.72) - r*.24, hollow);
 float dot_ = smoothstep(aa, -aa, d)*step(.001, there);
 if (blur > 0.) {
  float soft = .035 + .1*fract(h.x*13.);
  dot_ = mix(dot_, smoothstep(soft + aa, -soft - aa, d)*(.3 + .45*smoothstep(.35, 1., len/max(r, .02)))*step(.001, there), blur);
  }
 shade = smoothstep(.16, -.14, length(f - at - vec2(.09, .12)) - r)*step(.001, there)*dome;
  vec3 hue = light / max(lum, 0.02);
 vec3 rest = mix(mix(uKind[0], uKind[1], h.x), uKind[2], step(.7, h.y)*.8);
 vec4 pm = piece(clamp(pl.xy, .01, .99));
 ink = mix(rest, pm.rgb/max(pm.a, .05), sat(pm.a*5. - idle));
 ink = max(hueShift(ink, (h.x - .5)*.06)*(.8 + .4*h.y), 0.)*mix(1., pl.w, .8);
 ink = mix(ink, uKind[4], now*sat(uHits)*.8);
 rest /= max(dot(rest, vec3(.4, .45, .35)), .05);
 hue = mix(rest*(.35 + .45*h.x), hue, sat((sound + 1e-4)/(idle + 1e-4)*step(1e-3, idle) + step(idle, 1e-3))*mix(1., smoothstep(0., .3, sound), step(1e-3, idle)));
 hue = max(hueShift(hue, (h.x - .5)*.22*(1. - .7*even)), 0.)*pl.w;
 if (dome > 0.) {
  vec2 n = (f - at)/max(r, .03); float n2 = min(dot(n, n), 1.);
  float lamp = sat(dot(vec3(n, sqrt(1. - n2)), vec3(-.48, -.58, .66)));
  float spark = pow(lamp, 24.);
  hue = mix(hue, hue*(.2 + lamp) + .6*spark, dome); ink = mix(ink, ink*(.45 + .8*lamp) + .7*spark, dome);
  }
 return vec4(hue, dot_);
}
vec3 fiSheet(vec2 p) {
 float asp = uRes.x/uRes.y, m = max(-uOwn[1], 0.), even = max(uOwn[4], 0.);
  vec2 uv = vec2(p.x / asp * 1.04 + 0.5, 0.5 - p.y * 1.08);
  uv += 0.006 * vec2(sin(uTime * 0.07), cos(uTime * 0.053));
 vec4 pl = fiPlace(uv, asp);
 float fibre = noise(p*190.)*.6 + noise(p*vec2(60., 90.))*.4, up = sat((.3 - uv.y)/.4);
 vec3 under = hueShift(fiLight(pl.xy, .06), -.04)*pl.z*pl.w*(m > 0. ? mix(1., smoothstep(.28, .5, uv.y)*.3, m) : 1.), col = under*.13*(1. + 2.5*max(-uOwn[6], 0.));
  // the paper: white and fibrous, or deep and washed with colour
 vec3 paper = vec3(1.62, 1.57, 1.47)*(.94 + .1*fibre);
 if (m > 0.) paper = mix(paper, mix(vec3(1.9, 1.85, 1.75), mix(vec3(1.), uKind[1], .5)*1.35, up), m*step(uv.y, .3))*mix(vec3(1.), mix((.12 + uKind[0])*.55, vec3(1.), smoothstep(.302, .298, uv.y)), m);
 paper *= mix(vec3(1.), .6 + .8*under/(max(max(under.r, under.g), under.b) + .15), .25*sat(dot(under, vec3(1.))));
 if (fiDusk > 0.) {
  float w = sat(.5 + .9*p.y + .25*(fbm(p*2.2 + 3.) - .5)), lay = .6 + .8*fbm(p*vec2(2., 5.) + 9.);
  if (m > 0.) w = mix(w, uv.y < .3 ? 1. - .9*up : .15, m);
  col += fiDusk*mix(uKind[0]*uKind[0]*.28, uKind[1]*uKind[1]*.55, w*w)*lay*(.85 + .15*fibre);
  }
 vec3 ink = paper;
 for (int i = 0; i < 3; i++) {
  float w = i == 2 ? 1. : .85*(1. - even), sh, dn; vec3 dye;
  if (even >= 1. && i < 2) continue;
  vec4 g = fiGrain(uv, asp, i == 0 ? 67. : i == 1 ? 171. : 118., i == 0 ? 3. : i == 1 ? 2. : 1., i == 0 ? 1.13 : i == 1 ? -.52 : .31, sh, dn, dye);
  float solid = max(max(uOwn[6], 0.), max(m, .5*even));
  col = mix(col, col*(1. - g.w*solid*w), step(1e-3, solid))*(1. - .4*sh*w*fiDusk) + g.rgb*g.w*(.5 + .9*dn)*w;
  ink *= 1. - .5*sh*w;
  ink = mix(ink, dye*mix(1.15, .8, dn), g.w*w*.95);
  }
 return mix(col, ink, fiDay);
}
vec3 render(vec2 p) {
 vec4 w0 = vec4(uOwn[0], uOwn[1], uOwn[2], uOwn[3]), w1 = vec4(uOwn[4], uOwn[5], uOwn[6], uOwn[7]);
 fiWorld = sat(2.*(dot(w0, w0) + dot(w1, w1)));
 fiDay = max(uOwn[0], 0.); fiDusk = max(-uOwn[0], 0.);
 vec3 col = uVar > .5 ? (fiWorld > 0. ? fiSheet(p) : fiPrint(p)) : fiFog(p);
  col *= 1.0 - 0.35 * dot(p, p);
  // to the screen with the weight of film: colours stay deep, darks stay down
  vec3 c = screenOf(col);
  c = sat(mix(vec3(dot(c, vec3(0.3, 0.5, 0.2))), c, 1.3));
  return mix(c, c * c * (3.0 - 2.0 * c), 0.55);
}
