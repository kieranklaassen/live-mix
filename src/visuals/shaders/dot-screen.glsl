// name: Dot screen
// a: Flat
// b: Staggered, glowing
// what: The piece as a wall of dots, flat on. Across is the loop, down is the room; a dot is as big as the sound there.
// follows: Each stroke of the piece swells as it plays; a cue leaves a spreading spot; Glow makes every dot bigger.
vec3 render(vec2 p) {
  float asp = uRes.x / uRes.y;
  vec2 uv = vec2(p.x / asp + 0.5, 0.5 - p.y); // across 0 to 1, down 0 to 1
  float rows = mix(27.0, 36.0, uVar);
  vec2 g = uv * vec2(rows * asp, rows);
  float shift = uVar > 0.5 && mod(floor(g.y), 2.0) > 0.5 ? 0.5 : 0.0; // every other row half a dot along
  g.x += shift;
  vec2 id = floor(g), f = fract(g) - 0.5;
  vec4 m = piece(vec2((id.x + 0.5 - shift) / (rows * asp), (id.y + 0.5) / rows));
  float loud = sat(m.a * (0.6 + 0.6 * uEnergy));
  float r = 0.56 * sqrt(loud), d = length(f) - r;
  float edge = rows / uRes.y * 1.2;
  vec3 hue = m.rgb / max(m.a, 0.001);
  vec3 col = hue * (0.4 + 0.75 * m.a) * smoothstep(edge, -edge, d);
  col += hue * loud * loud * 0.5 * exp(-max(d, 0.0) * mix(9.0, 4.0, uVar)) * uVar; // b: light spills past the dot
  col += vec3(0.05) * smoothstep(0.05 + edge, 0.05 - edge, length(f)) * step(m.a, 0.02); // a speck where nothing sounds
  return col;
}
