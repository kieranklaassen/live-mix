#pragma once

// The solids of Wire Lantern: wire of one length strung along every edge, and
// all of its waves found once, in init.
//
// On such a net a wave exp(jkx) runs along each edge, the corners join what
// meets there, and a tone can stand where cos(kL) is an eigenvalue of the walk
// matrix (from a corner to any neighbour alike), or where sin(kL) is 0 (waves
// with a node at every corner: they run round the loops). So a solid has a
// family of tones for each kL, and how such a family is heard from one place
// when it is played at another is the projector of its eigenspace: G for the
// corner families, H for the loop families. No eigenvector is needed beyond
// that, and a family with five shapes at one pitch is still two lines: what
// the touched corner feels (A), and the rest of what the player woke (B).

#include <cmath>

#include "../../kit/math.h"

namespace livemix {
namespace wire_lantern_solids {

constexpr int kMaxCorners = 8;
constexpr int kMaxEdges = 12;
constexpr int kMaxRoots = 6;
constexpr int kFamilies = 24;
constexpr int kMaxWalk = 12;

enum Kind : int { kCorner = 0, kLoop };

struct Family {
  Kind kind = kCorner;
  int root = 0;        // of a corner family; 0 odd, 1 even for a loop family
  bool cosine = false; // a loop family that also has the cosine, felt at the corners
  bool loops = false;
  float kl = 0.0f;     // the phase along one edge, radians
  float turns = 0.0f;  // the same in turns
  float over_sine = 0.0f;  // 1 / sin(kL) of a corner family
  float natural = 1.0f;    // cents over the lowest family
  float just = 1.0f;       // cents of the open interval it bends to
  float ratio = 1.0f;
};

struct Solid {
  int corners = 0, edges = 0, roots = 0, walk = 0;
  int from[kMaxEdges] = {}, to[kMaxEdges] = {};
  int edge_of[kMaxCorners][kMaxCorners] = {};  // edge + 1, or 0
  int route[kMaxWalk] = {};                    // the corners the ears go round by
  float corner_scale = 1.0f, cosine_scale = 1.0f;
  float g[kMaxRoots][kMaxCorners][kMaxCorners] = {};
  float h[2][kMaxEdges][kMaxEdges] = {};
  Family family[kFamilies];
};

// Jacobi's rotations: `a` ends diagonal, the rows of `v` are its vectors.
template <int N>
inline void jacobi(double (&a)[N][N], double (&v)[N][N], int n) {
  for (int i = 0; i < n; ++i) {
    for (int j = 0; j < n; ++j) v[i][j] = i == j ? 1.0 : 0.0;
  }
  for (int sweep = 0; sweep < 40; ++sweep) {
    double off = 0.0;
    for (int i = 0; i < n; ++i) {
      for (int j = i + 1; j < n; ++j) off += a[i][j] * a[i][j];
    }
    if (off < 1.0e-24) return;
    for (int p = 0; p < n; ++p) {
      for (int q = p + 1; q < n; ++q) {
        if (std::fabs(a[p][q]) < 1.0e-15) continue;
        const double theta = (a[q][q] - a[p][p]) / (2.0 * a[p][q]);
        const double t = (theta >= 0.0 ? 1.0 : -1.0) / (std::fabs(theta) + std::sqrt(theta * theta + 1.0));
        const double c = 1.0 / std::sqrt(t * t + 1.0), s = t * c;
        for (int k = 0; k < n; ++k) {
          const double akp = a[k][p], akq = a[k][q];
          a[k][p] = c * akp - s * akq;
          a[k][q] = s * akp + c * akq;
        }
        for (int k = 0; k < n; ++k) {
          const double apk = a[p][k], aqk = a[q][k];
          a[p][k] = c * apk - s * aqk;
          a[q][k] = s * apk + c * aqk;
        }
        for (int k = 0; k < n; ++k) {
          const double vpk = v[p][k], vqk = v[q][k];
          v[p][k] = c * vpk - s * vqk;
          v[q][k] = s * vpk + c * vqk;
        }
      }
    }
  }
}

// The nearest open interval: octave, second, fourth, fifth, sixth, seventh,
// and from two octaves up the odd harmonics as well. In cents.
inline float open_interval(double cents) {
  static const double kClasses[6] = {0.0, 203.910, 498.045, 701.955, 884.359, 996.090};
  static const double kHigh[5] = {2786.314, 3368.826, 3986.314, 4568.826, 4688.269};
  if (cents < 1.0) return 0.0f;
  double best = 0.0, away = 1.0e9;
  for (int octave = 0; octave < 8; ++octave) {
    for (double c : kClasses) {
      const double at = c + 1200.0 * octave;
      if (std::fabs(at - cents) < away) away = std::fabs(at - cents), best = at;
    }
  }
  for (double at : kHigh) {
    if (std::fabs(at - cents) < away) away = std::fabs(at - cents), best = at;
  }
  return static_cast<float>(best);
}

inline void join(Solid& s, int a, int b) {
  s.from[s.edges] = a;
  s.to[s.edges] = b;
  s.edge_of[a][b] = s.edge_of[b][a] = ++s.edges;
}

// The route of each solid starts at corner 0, the one a finger touches.
inline void lay_out(Solid& s, int which) {
  static const int kRing[6] = {0, 1, 2, 3, 4, 5};
  static const int kTetra[4] = {0, 1, 2, 3};
  static const int kOcta[6] = {0, 2, 1, 4, 3, 5};
  static const int kCube[8] = {0, 1, 3, 2, 6, 7, 5, 4};
  static const int kPrism[6] = {0, 1, 2, 5, 4, 3};
  static const int kWeb[7] = {4, 5, 6, 3, 0, 2, 1};
  const int* route = kRing;
  switch (which) {
    case 0:  // ring: one loop of six edges
      s.corners = s.walk = 6;
      for (int i = 0; i < 6; ++i) join(s, i, (i + 1) % 6);
      break;
    case 1:  // tetrahedron
      s.corners = s.walk = 4;
      route = kTetra;
      for (int a = 0; a < 4; ++a) {
        for (int b = a + 1; b < 4; ++b) join(s, a, b);
      }
      break;
    case 2:  // octahedron: all but the opposite corner (0 and 1, 2 and 3, 4 and 5)
      s.corners = s.walk = 6;
      route = kOcta;
      for (int a = 0; a < 6; ++a) {
        for (int b = a + 1; b < 6; ++b) {
          if (a / 2 != b / 2) join(s, a, b);
        }
      }
      break;
    case 3:  // cube: corners one bit apart
      s.corners = s.walk = 8;
      route = kCube;
      for (int a = 0; a < 8; ++a) {
        for (int b = a + 1; b < 8; ++b) {
          const int d = a ^ b;
          if (d == 1 || d == 2 || d == 4) join(s, a, b);
        }
      }
      break;
    case 4:  // prism: two triangles and three posts
      s.corners = s.walk = 6;
      route = kPrism;
      for (int i = 0; i < 3; ++i) {
        join(s, i, (i + 1) % 3);
        join(s, i, i + 3);
        join(s, 3 + i, 3 + (i + 1) % 3);
      }
      break;
    default:  // web: a hub, a small triangle and a large one, three spokes
      s.corners = s.walk = 7;
      route = kWeb;
      for (int i = 0; i < 3; ++i) {
        join(s, 0, 1 + i);
        join(s, 1 + i, 1 + (i + 1) % 3);
        join(s, 1 + i, 4 + i);
        join(s, 4 + i, 4 + (i + 1) % 3);
      }
      break;
  }
  for (int i = 0; i < s.walk; ++i) s.route[i] = route[i];
}

inline void build_loops(Solid& s, int even) {
  // A loop wave leaves nothing at any corner: the null space of what the
  // edges bring there, signed for the even ones.
  double a[kMaxEdges][kMaxEdges] = {}, v[kMaxEdges][kMaxEdges];
  for (int i = 0; i < s.edges; ++i) {
    for (int j = 0; j < s.edges; ++j) {
      const double sign = even ? -1.0 : 1.0;
      double sum = 0.0;
      if (s.from[i] == s.from[j]) sum += 1.0;
      if (s.to[i] == s.to[j]) sum += 1.0;
      if (s.from[i] == s.to[j]) sum += sign;
      if (s.to[i] == s.from[j]) sum += sign;
      a[i][j] = sum;
    }
  }
  jacobi(a, v, s.edges);
  for (int m = 0; m < s.edges; ++m) {
    if (std::fabs(a[m][m]) > 1.0e-6) continue;
    for (int i = 0; i < s.edges; ++i) {
      for (int j = 0; j < s.edges; ++j) s.h[even][i][j] += static_cast<float>(v[m][i] * v[m][j]);
    }
  }
}

inline void build(Solid& s, int which) {
  constexpr double kPi = 3.14159265358979323846;
  s = Solid();
  lay_out(s, which);
  s.corner_scale = std::sqrt(2.0f * static_cast<float>(s.edges));
  s.cosine_scale = 1.41421356f;
  int degree[kMaxCorners] = {};
  for (int e = 0; e < s.edges; ++e) {
    ++degree[s.from[e]];
    ++degree[s.to[e]];
  }
  double a[kMaxCorners][kMaxCorners] = {}, v[kMaxCorners][kMaxCorners];
  for (int e = 0; e < s.edges; ++e) {
    const int i = s.from[e], j = s.to[e];
    a[i][j] = a[j][i] = 1.0 / std::sqrt(static_cast<double>(degree[i] * degree[j]));
  }
  jacobi(a, v, s.corners);
  double root[kMaxRoots] = {};
  bool bipartite = false;
  for (int m = 0; m < s.corners; ++m) {
    const double mu = a[m][m];
    if (mu < -1.0 + 1.0e-8) bipartite = true;
    if (std::fabs(mu) > 1.0 - 1.0e-8) continue;
    int r = 0;
    while (r < s.roots && std::fabs(root[r] - mu) > 1.0e-7) ++r;
    if (r == s.roots) {
      if (s.roots == kMaxRoots) continue;
      root[s.roots++] = mu;
    }
    for (int i = 0; i < s.corners; ++i) {
      for (int j = 0; j < s.corners; ++j) {
        s.g[r][i][j] += static_cast<float>(v[m][i] * v[m][j] / std::sqrt(static_cast<double>(degree[i] * degree[j])));
      }
    }
  }
  build_loops(s, 0);
  build_loops(s, 1);
  // All families, lowest first.
  double kl[96];
  int tag[96], count = 0;
  for (int n = 0; n < 24 && count < 80; ++n) {
    for (int r = 0; r < s.roots && count < 90; ++r) {
      const double theta = std::acos(root[r]);
      kl[count] = 2.0 * kPi * n + theta;
      tag[count++] = r;
      kl[count] = 2.0 * kPi * (n + 1) - theta;
      tag[count++] = r;
    }
    if (count > 90) break;
    if (bipartite || s.h[0][0][0] > 1.0e-6f) {
      kl[count] = kPi * (2 * n + 1);
      tag[count++] = 100;
    }
    kl[count] = 2.0 * kPi * (n + 1);
    tag[count++] = 101;
  }
  for (int i = 1; i < count; ++i) {
    for (int j = i; j > 0 && kl[j] < kl[j - 1]; --j) {
      const double k = kl[j];
      kl[j] = kl[j - 1];
      kl[j - 1] = k;
      const int t = tag[j];
      tag[j] = tag[j - 1];
      tag[j - 1] = t;
    }
  }
  for (int f = 0; f < kFamilies; ++f) {
    Family& family = s.family[f];
    const int t = tag[f];
    family.kind = t >= 100 ? kLoop : kCorner;
    family.root = t >= 100 ? t - 100 : t;
    family.loops = t >= 100 && s.h[family.root][0][0] > 1.0e-6f;
    family.cosine = t == 101 || (t == 100 && bipartite);
    family.kl = static_cast<float>(kl[f]);
    family.turns = static_cast<float>(kl[f] / (2.0 * kPi));
    family.over_sine = t >= 100 ? 0.0f : static_cast<float>(1.0 / std::sin(kl[f]));
    family.ratio = static_cast<float>(kl[f] / kl[0]);
    const double cents = 1200.0 * std::log2(kl[f] / kl[0]);
    family.natural = static_cast<float>(cents);
    family.just = open_interval(cents);
  }
}

// Where a note was played, as the ears need it.
struct Played {
  float corner_a[kFamilies][kMaxCorners] = {};
  float corner_b[kFamilies][kMaxCorners] = {};
  float loop_b[kFamilies] = {};
  int edge = 0;
};

inline float sine(float turns) { return kit::SineTable::lookup(turns); }

// Plays an edge, `at` of the way along it. The six steps are three edges, by
// how far they are from the touched corner, each from its near end and from
// its far one. What is handed back is each family's share in the touched
// corner's shape (A) and in the rest of what was woken (B).
inline void play(const Solid& s, int step, float at, Played& played, float* a, float* b) {
  const int touched = s.route[0];
  int near[kMaxCorners], order[kMaxEdges];
  for (int c = 0; c < s.corners; ++c) near[c] = c == touched ? 0 : (s.edge_of[touched][c] ? 1 : 2);
  const auto away = [&](int e) { return near[s.from[e]] + near[s.to[e]]; };
  for (int e = 0; e < s.edges; ++e) {
    int j = e;
    for (; j > 0 && away(order[j - 1]) > away(e); --j) order[j] = order[j - 1];
    order[j] = e;
  }
  const int e = order[(step / 2) * (s.edges - 1) / 2];
  const int u = s.from[e], v = s.to[e];
  if ((near[u] > near[v]) != ((step & 1) != 0)) at = 1.0f - at;
  played.edge = e;
  for (int f = 0; f < kFamilies; ++f) {
    const Family& family = s.family[f];
    const float s1 = sine(family.turns * (1.0f - at)), s2 = sine(family.turns * at);
    a[f] = b[f] = 0.0f;
    if (family.kind == kLoop) {
      const float own = s.h[family.root][e][e];
      if (family.cosine) a[f] = s.cosine_scale * sine(family.turns * at + 0.25f);
      played.loop_b[f] = own > 1.0e-6f ? s.corner_scale / std::sqrt(own) : 0.0f;
      b[f] = own > 1.0e-6f ? s.corner_scale * std::sqrt(own) * s2 : 0.0f;
      continue;
    }
    const auto& g = s.g[family.root];
    const float alpha = s1 * family.over_sine * s.corner_scale, beta = s2 * family.over_sine * s.corner_scale;
    const bool felt = g[touched][touched] > 1.0e-6f;
    const float unit = felt ? 1.0f / std::sqrt(g[touched][touched]) : 0.0f;
    a[f] = (alpha * g[touched][u] + beta * g[touched][v]) * unit;
    const float all = alpha * alpha * g[u][u] + 2.0f * alpha * beta * g[u][v] + beta * beta * g[v][v];
    const float rest = all - a[f] * a[f];
    b[f] = rest > 1.0e-4f * all ? std::sqrt(rest) : 0.0f;
    for (int w = 0; w < s.corners; ++w) {
      const float shape = g[touched][w] * unit;
      played.corner_a[f][w] = shape * s.corner_scale;
      played.corner_b[f][w] =
          b[f] > 0.0f ? (alpha * g[u][w] + beta * g[v][w] - a[f] * shape) * s.corner_scale / b[f] : 0.0f;
    }
  }
}

// The size of every line's wave at a place on the route, `where` in edges.
inline void hear(const Solid& s, const Played& played, float where, float* heard) {
  const float length = static_cast<float>(s.walk);
  where -= length * std::floor(where / length);
  int leg = static_cast<int>(where);
  if (leg >= s.walk) leg = 0, where = 0.0f;
  float x = where - static_cast<float>(leg);
  int u = s.route[leg], v = s.route[leg + 1 == s.walk ? 0 : leg + 1];
  const int e = s.edge_of[u][v] - 1;
  if (s.from[e] != u) {
    const int swap = u;
    u = v;
    v = swap;
    x = 1.0f - x;
  }
  for (int f = 0; f < kFamilies; ++f) {
    const Family& family = s.family[f];
    const float s2 = sine(family.turns * x);
    if (family.kind == kCorner) {
      const float a = sine(family.turns * (1.0f - x)) * family.over_sine, b = s2 * family.over_sine;
      heard[2 * f] = a * played.corner_a[f][u] + b * played.corner_a[f][v];
      heard[2 * f + 1] = a * played.corner_b[f][u] + b * played.corner_b[f][v];
    } else {
      heard[2 * f] = family.cosine ? s.cosine_scale * sine(family.turns * x + 0.25f) : 1.0f;
      heard[2 * f + 1] = played.loop_b[f] * s.h[family.root][played.edge][e] * s2;
    }
  }
}

// What a solid's wire and corners are like, beyond its pitches.
struct Voicing {
  float tilt;      // power of the ratio: above 0 darker
  float root;      // the lowest family
  float loop;      // the loop families
  float keep;      // ring time
  float slope;     // how much sooner the upper families die
  float rise;      // how slowly it speaks
  float noise;     // of the contact
  float dust;      // how long the contact stays in the net
  float size;      // of the case round it: above 1 smaller
  float held;      // power of the ratio, for a bow or a breath
  float tremble;   // how much a held tone shakes by itself
  float shakes;    // and how often a second
  float hair;      // the top of the contact, for a bow or a breath
  float sings;     // the ratio a held tone is fullest at
};
inline const Voicing& voicing(int solid) {
  static const Voicing kTable[6] = {
      {-0.85f, 1.1f, 0.80f, 0.50f, 0.40f, 0.7f, 1.0f, 0.8f, 1.60f, -0.65f, 0.00f, 1.0f, 2.2f, 2.0f},  // ring: plain harmonics, wiry
      {-0.45f, 1.1f, 1.3f, 3.0f, 0.4f, 14.0f, 0.5f, 1.0f, 0.70f, 0.70f, 0.25f, 0.7f, 0.5f, 1.7f},      // tetrahedron: few tones, glass
      {-0.15f, 0.95f, 0.9f, 1.00f, 0.30f, 1.0f, 1.0f, 1.0f, 1.00f, 0.10f, 0.10f, 0.4f, 0.8f, 3.6f},   // octahedron: the harp
      {1.65f, 1.2f, 0.8f, 5.6f, 1.6f, 2.5f, 0.5f, 1.4f, 0.50f, 1.60f, 0.12f, 0.25f, 0.1f, 1.0f},      // cube: a heavy dark bell
      {-0.25f, 1.1f, 0.9f, 0.26f, 0.6f, 0.7f, 1.1f, 0.4f, 1.35f, 1.20f, 0.70f, 5.2f, 0.25f, 4.2f},    // prism: dry, quick keys
      {-0.55f, 0.40f, 0.7f, 0.80f, 0.20f, 220.0f, 1.0f, 20.0f, 1.15f, -0.10f, 0.85f, 0.8f, 3.5f, 9.0f},    // web: slow to speak, dust
  };
  return kTable[kit::clamp_int(solid, 0, 5)];
}

// Decibels that bring the solids and the exciters to one level.
constexpr float kTrim[6][4] = {
    {-2.8f, -2.3f, 1.0f, 3.9f},
    {-0.0f, -1.0f, 1.2f, 4.1f},
    {0.6f, -0.8f, 0.8f, 3.6f},
    {1.8f, 1.7f, 0.4f, 3.9f},
    {-1.9f, -1.6f, 1.5f, 4.5f},
    {0.3f, -1.1f, -1.0f, 1.7f},
};

// And how thick that edge's wire is, as a power of the ratio.
constexpr float kGauge[6] = {0.0f, 0.15f, -0.30f, 0.30f, -0.25f, 0.45f};

// The knot tied in each of the six edges: what it leaves of a tone `ratio`
// times the lowest. The first edge has none.
inline float knot(int step, float ratio) {
  static const float kAt[6] = {0.0f, 0.25f, 0.1666667f, 0.25f, 0.125f, 0.0714286f};
  static const float kPhase[6] = {0.25f, 0.0f, 0.0f, 0.25f, 0.25f, 0.0f};
  const float wave = sine(kAt[step] * ratio + kPhase[step]);
  return step == 0 ? 1.0f : 0.05f + 1.0f * wave * wave;
}

// The shell round the lantern: four broad resonances and what is between, as
// the logarithm of a gain.
inline float shell_log_gain(float hertz, float size) {
  static const float kAt[4] = {215.0f, 520.0f, 1250.0f, 2900.0f};
  static const float kHigh[4] = {2.4f, 2.6f, 2.0f, 1.0f};
  static const float kQ[4] = {4.0f, 5.0f, 5.5f, 6.0f};
  float sum = 0.16f;
  for (int i = 0; i < 4; ++i) {
    const float centre = kAt[i] * size;
    const float x = kQ[i] * (hertz / centre - centre / hertz);
    sum += kHigh[i] / (1.0f + x * x);
  }
  return 1.8f * std::log(sum);
}

}  // namespace wire_lantern_solids
}  // namespace livemix
