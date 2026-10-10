#pragma once

// Glimmer: a tremolo for every narrow band of the spectrum, each on its own
// clock, with the level of the whole held.
//
//   in ─┬─► (Stft's own ring, 2304 late) ─────────────────────────► dry ─┐
//       │                                                                 ├─► out = dry + Mix·(1 − pass)·(wet − dry)
//       ├─► Hann ─► FFT ─► × gain per bin ─► IFFT ─► Hann ─► overlap ─► wet ─┘                 │
//       │                     │                                                               │
//       │         bands ─► flicker law ─► lift                                                │
//       └─► attacks (the rise of the input's edge, 64 samples at a time) ─► pass, 2304 ahead ─┘
//
// The frames are kit::Stft<2048, 512>: the latency is 2304 samples, and the
// dry path is the Stft's own, so Mix is a straight cross-fade of two signals
// in step (a gain per bin turns no phase) and Mix 0 is the input 2304 late,
// bit for bit.
//
// Bands. The spectrum is laid out in bands of equal width on the scale
//
//   p(f) = (K / W) · ln(1 + f / K)        in bands, counted from 0 Hz
//
// so a band is W wide at the bottom and W·(1 + f/K) wide at f: even in hertz
// under the knee K and even in pitch above it. Grain sets both: from
// W = 120 Hz, K = 200 Hz (nine bands of about an octave) to W = 47 Hz,
// K = 4 kHz (some 160 bands, two bins wide at the bottom, where a pad's
// partials each have one of their own). W is never under two bins: a gain
// per bin is a filter three bins wide, and nothing narrower would be heard.
// Band j is centred on p = j and level for a quarter of a band either side;
// a bin in the half between two bands takes their gains joined by half a
// cosine, so the gain is smooth across the spectrum and has no edges.
//
// Between two bands. A join of two gains that move apart from one another
// has less power than either: half way between two bands of Scatter at full
// Depth a partial sat 0.8 dB under one on a band's centre. So the join is
// raised by what it loses. With β the share of the upper band, P the bands'
// own mean power (1 unless the lift is capped) and C = E[g_j·g_j+1], the
// join's power is P·(1 − 2β(1−β)·q), q = 1 − C/P, and the gain is
//
//   g = (g_j + β·(g_j+1 − g_j)) · (1 + 4β(1−β)·e_j),   e_j = 1/√(1 − q/2) − 1
//
// which is exact half way and within 0.06 dB elsewhere, and never over the
// tallest lift. C is in closed form: the two bands' lights are independent
// on Scatter (C from their means) and one sixth of a cycle apart on a wave
// (C from the flash's overlap with itself that far on, summed over 96 points
// of a cycle whenever Soft moves).
//
// The flicker. Every band has a phase P in cycles. In a cycle its light m
// rises from 0 to 1 and falls again:
//
//   x = P − floor(P) − 1/2                (−1/2 .. 1/2, the flash at 0)
//   m = 1 for |x| ≤ a, 0 for |x| ≥ b, half a cosine between
//   a = 0.06·(1 − Soft),  b = 0.14 + 0.36·Soft
//
// which is a raised cosine at Soft 1 and a flash a fifth of the cycle long
// with edges of 8 % at Soft 0. Vary scales each flash by its own height
// 1 − Vary·u, u in 0..1 from a hash of the band and the number of the cycle:
// a cycle is a function of its number, so nothing is kept and nothing drifts.
//
// The patterns give P from one clock θ, which counts cycles of Rate:
//
//   Scatter    P = φ_j + s_j·θ            φ_j anywhere, s_j from 45/64 to 91/64
//   Upward     P = θ − j/6                six bands to a wave, running up
//   Downward   P = θ + j/6
//   Outward    P = θ − |j − j(800 Hz)|/6  both ways from the middle
//
// The right side runs Apart·δ_j of a cycle off the left on Scatter (δ_j in
// ±1/2) and Apart/3 of a cycle on the waves; at Apart 0 it is the left's
// very gains, and a mono input stays mono bit for bit. A third of a cycle
// and not a half: with the sides half a cycle apart the two flickers are
// each other's opposite and their sum is steady, so a wave summed to mono
// lost its ripple altogether (13 dB measured); a third keeps half of it
// (−6 dB) and 87 % of the movement from side to side. A change of Pattern
// cross-fades the gains over 85 ms.
//
// The clock runs by the sample count, awake or asleep, and a change of Rate
// carries the phase on from where it stood: the flicker keeps its place
// through silence as a clock would and never starts again from the sound.
// θ wraps at 4096 cycles; every s_j·4096 is whole, so nothing jumps there.
//
// The gain of band j, with its depth d_j = Depth × the lean's share:
//
//   g_j = L_j · (1 − d_j + d_j·m)
//   L_j = min(2, 1 / √E[(1 − d_j + d_j·m)²])    over one cycle, in closed form
//
// L is the lift that keeps the band's power over a cycle at the input's, so
// the sound as a whole holds its level while its bands come and go. It is
// never more than 2 (+6 dB): a band is never louder than twice its input,
// and where the lift asked for is more (deep, sudden, varied all at once:
// Depth 1, Soft 0, Vary 1 asks for 12 dB) the level falls by what is missing,
// 6.2 dB at that corner. Lean takes depth away along the pitch scale from
// 100 Hz to 6.4 kHz: to the right the lows keep still (share 1 − Lean at
// 100 Hz and under, 1 at 6.4 kHz and over), to the left the highs.
//
// Attacks. A gain per bin is a filter, and a filter as narrow as a band
// rings for as long as the band is narrow: a struck note came out with a
// fifth of its attack's peak up to 15 ms ahead of itself (−14 dB, and −6 dB
// on the deepest fast wave). So attacks go round the flicker. The input's
// edge (its first difference, which a held low note has little of) is summed
// over 64 samples at a time; a sum over three times the largest of the 2048
// samples before it is an attack. The output is 2304 samples behind the
// input, so there is time: from 1280 samples before the attack is heard the
// output turns to the dry sound (over 256), stays on it until 256 after, and
// turns back over 768. Held sound has no attacks and is not touched; a note
// struck over a held chord takes the chord's flicker away for those 45 ms.
// Both sides pass together, so a mono input stays mono.
//
// Everything is read once per frame, at the frame's own time on the sample
// count: the overlap cross-fades any change over a frame, so nothing but
// Mix needs a smoother, and the output is the same at any block size, also
// across a sleep. Grain is read a little earlier: 128 samples before the
// left side's frame, in a block that holds neither side's transforms, so
// that laying the bands out again (a logarithm per bin) never lands on top
// of a frame's work. No state is kept per bin: the device sleeps as soon as
// the frames in flight have played out.
//
// Storage: two Stft channels of 88 KB, and about 5 KB of tables.

#include "../../kit/kit.h"
#include "../../kit/stft.h"
#include "params.gen.h"

namespace livemix {

class Glimmer : public kit::DeviceBase<glimmer::kNumParams> {
 public:
  using Stft = kit::Stft<2048, 512>;
  static constexpr int kLatency = Stft::kLatency;  // 2304: "latencySamples" in device.json

  // The law's constants, which the display (src/react/components/displays/glimmer.ts) copies.
  static constexpr int kMaxCells = 200;
  static constexpr float kBroadHz = 120.0f;       // W at Grain 0
  static constexpr float kFineHz = 47.0f;         // W at Grain 1
  static constexpr float kBroadKneeHz = 200.0f;   // K at Grain 0
  static constexpr float kFineKneeHz = 4000.0f;   // K at Grain 1
  static constexpr float kLeanLowHz = 100.0f;     // the lean runs from here
  static constexpr float kLeanOctaves = 6.0f;     // over so many octaves
  static constexpr float kMidHz = 800.0f;         // where Outward starts
  static constexpr float kWaveCells = 6.0f;       // bands to one wave
  static constexpr float kEdgeShare = 0.5f;       // of the way between two bands' centres, the part that blends
  static constexpr float kMaxLift = 2.0f;         // +6 dB
  static constexpr int kOverlapPoints = 96;       // a cycle in so many points, for a flash's overlap with itself
  static constexpr float kGlintPlateau = 0.06f;   // a at Soft 0
  static constexpr float kGlintReach = 0.14f;     // b at Soft 0
  static constexpr double kClockWrap = 4096.0;    // θ wraps here, cycles
  static constexpr int kSpeedLowest = 45;         // s_j = (45 .. 91) / 64
  static constexpr int kSpeedSpan = 47;
  static constexpr float kPatternFadeSeconds = 0.085f;
  static constexpr double kWaveApart = 1.0 / 3.0;  // of a cycle between the sides at Apart 1, on the waves
  // Attacks, in samples at any rate (the frame is, and so is what it smears).
  static constexpr int kSegment = 64;          // the input's edge is summed over so many samples
  static constexpr int kLookSegments = 32;     // and held against the largest of so many sums before it
  static constexpr float kAttackRise = 3.0f;   // an attack is so many times that
  static constexpr float kAttackFloor = 64.0f * 1.0e-8f;  // or, from silence, an edge over −80 dBFS
  static constexpr int kPassAhead = 1280;      // the output turns dry from so long before an attack is heard
  static constexpr int kPassRise = 256;        // over so long
  static constexpr int kPassAfter = 256;       // stays dry until so long after it
  static constexpr int kPassFall = 768;        // and turns back over so long
  static constexpr int kLayoutAhead = 128;     // Grain is read so long before the left side's frame

  void init(float sample_rate) {
    using namespace glimmer;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    stft_[0].init();                   // left: works as soon as a frame is whole
    stft_[1].init(Stft::kMaxStagger);  // right: half a hop later, on the same frames
    for (int j = 0; j < kMaxCells; ++j) {
      const uint32_t cell = static_cast<uint32_t>(j);
      phi_[j] = unit(hash(cell, kSeedPhase));
      speed_[j] = static_cast<uint8_t>(kSpeedLowest + hash(cell, kSeedSpeed) % static_cast<uint32_t>(kSpeedSpan));
      delta_[j] = unit(hash(cell, kSeedApart)) - 0.5f;
      place_[j] = 0.0f;
      gain_[0][j] = 1.0f;
      gain_[1][j] = 1.0f;
      floor_[j] = 1.0f;
      swing_[j] = 0.0f;
      level_[j] = 1.0f;
      raise_[j] = 0.0f;
    }
    overlap_soft_ = -1.0f;
    overlap_wave_ = 0.0f;
    overlap_middle_ = 0.0f;
    middle_cell_ = 0;
    for (int k = 0; k < Stft::kBins; ++k) {
      cell_[k] = 0;
      blend_[k] = 0.0f;
      hump_[k] = 0.0f;
    }
    for (float& weight : weight_) weight = 0.0f;
    cells_ = 1;
    middle_ = 0.0f;
    grain_seen_ = -1.0f;
    grain_read_ = param(kGrain);
    rest_attacks();
    now_ = 0;
    table_time_ = 0;
    table_ready_ = false;
    rate_ = param(kRate);
    clock_base_ = 0.0;
    clock_from_ = 0;
    earlier_rate_ = rate_;
    earlier_base_ = 0.0;
    earlier_from_ = 0;
    clock_meter_ = 0.0f;
    asleep_ = false;
    mix_.set_time(kSmoothingSeconds, sr);
    mix_.snap(param(kMix));
    // Nothing is held: once the input stops, a latency and a frame play out.
    idle_.reset(sr, static_cast<float>(Stft::kLatency + Stft::kFrame + Stft::kHop) / sr);
  }

  void set_param(int id, float value) {
    using namespace glimmer;
    if (!store_param(id, value)) return;
    if (id == kMix) {
      mix_.set(param(kMix), primed());
    } else if (id == kGrain) {
      if (!primed()) grain_read_ = param(kGrain);  // set before the first block: there from the first frame
    } else if (id == kRate && static_cast<double>(param(kRate)) != rate_) {
      // The phase carries on from where it stands; what came before keeps the rate it had.
      const double here = clock_at(now_);
      earlier_rate_ = rate_;
      earlier_base_ = clock_base_;
      earlier_from_ = clock_from_;
      rate_ = param(kRate);
      clock_base_ = here;
      clock_from_ = now_;
    }
    // The rest is read once per frame.
  }

  // The readings named by "meters" in device.json, for the display. 0: the
  // clock θ in cycles, 0 to 4096, as it stood at the end of the last block;
  // the display works the bands out from it by the law above. 1: how much of
  // the flicker an attack is passing round just now, 0 to 1 (what Mix is
  // scaled by is 1 less this).
  float meter(int index) const { return index == 0 ? clock_meter_ : index == 1 ? pass_meter_ : 0.0f; }

  void process(int frames) {
    using namespace glimmer;
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      silence_output(frames);
      stft_[0].skip(frames);  // the frame clock and the flicker's run on through the sleep
      stft_[1].skip(frames);
      // Grain as it stood at the moment it is read, had the device been awake.
      if (((kLayoutPhase - static_cast<uint32_t>(now_)) & kHopMask) < static_cast<uint32_t>(frames)) grain_read_ = param(kGrain);
      now_ += static_cast<uint64_t>(frames);
      asleep_ = true;
      clock_meter_ = static_cast<float>(clock_at(now_));
      pass_meter_ = 0.0f;
      return;
    }
    if (asleep_) {
      mix_.snap(mix_.target);  // a knob moved while asleep does not glide in
      rest_attacks();          // and the silence slept through was silence: nothing of it is left
      asleep_ = false;
    }
    float passing = 0.0f;
    for (int i = 0; i < frames; ++i) {
      const uint32_t at = static_cast<uint32_t>(now_);
      if ((at & (kSegment - 1)) == 0) next_segment(at / kSegment);
      if ((at & kHopMask) == kLayoutPhase) {
        grain_read_ = param(kGrain);
        if (grain_read_ != grain_seen_) layout();
      }
      float in[2];
      take_input(i, &in[0], &in[1]);
      // The input's edge, summed for the attack detector. What the Stft takes as silence is silence here.
      for (int c = 0; c < 2; ++c) {
        const float x = (in[c] > -kEdgeLimit && in[c] < kEdgeLimit) ? in[c] : 0.0f;
        const float edge = x - edge_last_[c];
        edge_last_[c] = x;
        edge_sum_[c] += edge * edge;
      }
      pass_ += kit::clamp(pass_goal_ - pass_, -1.0f / kPassFall, 1.0f / kPassRise);
      passing = pass_ * pass_ * (3.0f - 2.0f * pass_);  // eased at both ends
      const float mix = mix_.next() * (1.0f - passing);
      float out[2];
      for (int c = 0; c < 2; ++c) {
        const float wet = stft_[c].process(in[c], [this, c](float* re, float* im) { frame(c, re, im); });
        const float dry = stft_[c].dry();
        out[c] = dry + (wet - dry) * mix;
      }
      out_left_[i] = out[0];
      out_right_[i] = out[1];
      ++now_;
    }
    idle_.settle(output_peak(frames), frames);
    clock_meter_ = static_cast<float>(clock_at(now_));
    pass_meter_ = passing;
  }

 private:
  enum Pattern : int { kScatter = 0, kUpward, kDownward, kOutward, kNumPatterns };
  static constexpr uint32_t kSeedPhase = 0x51ED270Bu;
  static constexpr uint32_t kSeedSpeed = 0x2F0B4C87u;
  static constexpr uint32_t kSeedApart = 0x6C8E9CF5u;
  static constexpr uint32_t kSeedVary = 0x1B873593u;
  static constexpr uint32_t kHopMask = Stft::kHop - 1;
  static constexpr uint32_t kLayoutPhase = Stft::kHop - kLayoutAhead;  // where in a hop Grain is read
  static constexpr float kEdgeLimit = 64.0f;                          // the Stft's own: at or past it a sample is silence
  static constexpr int kHitRing = 64;                                  // segments remembered
  // An attack in segment s is heard kLatency later: segment q passes when one of the segments
  // q − kHitLast .. q − kHitFirst held an attack.
  static constexpr int kHitFirst = (kLatency - kPassAhead) / kSegment;
  static constexpr int kHitLast = (kLatency + kPassAfter) / kSegment;
  static_assert((kSegment & (kSegment - 1)) == 0 && kLatency % kSegment == 0 && kPassAhead % kSegment == 0 &&
                    kPassAfter % kSegment == 0 && kHitLast < kHitRing && kLayoutAhead % 128 == 0,
                "the attack pass counts in whole segments");
  // Asleep, everything the detector holds has run out: sleep begins only after more silence than
  // its longest memory (the pass ends kLatency + kPassAfter + kPassFall after an attack).
  static_assert(kLatency + kPassAfter + kPassFall + 2 * kSegment < Stft::kLatency + Stft::kFrame + Stft::kHop &&
                    kLookSegments * kSegment <= Stft::kFrame,
                "the idle hold outlasts the attack detector");

  // The attack detector at rest: as after a long silence.
  void rest_attacks() {
    for (int c = 0; c < 2; ++c) {
      for (float& sum : edge_seen_[c]) sum = 0.0f;
      edge_sum_[c] = 0.0f;
      edge_last_[c] = 0.0f;
    }
    for (uint8_t& hit : hit_) hit = 0;
    pass_ = 0.0f;
    pass_goal_ = 0.0f;
    pass_meter_ = 0.0f;
  }

  // Segment q begins: the one before it is closed (an attack or not), and whether this one passes is read off.
  void next_segment(uint32_t q) {
    const uint32_t closed = q - 1;
    bool attack = false;
    for (int c = 0; c < 2; ++c) {
      float largest = 0.0f;
      for (const float sum : edge_seen_[c]) largest = kit::max(largest, sum);
      attack = attack || edge_sum_[c] > kAttackRise * largest + kAttackFloor;
      edge_seen_[c][closed % kLookSegments] = edge_sum_[c];
      edge_sum_[c] = 0.0f;
    }
    hit_[closed % kHitRing] = attack ? 1 : 0;
    bool pass = false;
    for (int k = kHitFirst; k <= kHitLast; ++k) pass = pass || hit_[(q - static_cast<uint32_t>(k)) % kHitRing] != 0;
    pass_goal_ = pass ? 1.0f : 0.0f;
  }

  // Two numbers stirred into one: every band's constants, and every flash's height, come from this.
  static uint32_t hash(uint32_t a, uint32_t b) {
    uint32_t h = (a * 0x9E3779B1u) ^ ((b + 0x7F4A7C15u) * 0x85EBCA6Bu);
    h ^= h >> 15;
    h *= 0x2C1B3C6Du;
    h ^= h >> 12;
    h *= 0x297A2D39u;
    h ^= h >> 15;
    return h;
  }
  // 0 .. 1 from a hash, in steps of 2⁻²⁴.
  static float unit(uint32_t h) { return static_cast<float>(h >> 8) * (1.0f / 16777216.0f); }

  // θ at a sample count, in cycles, 0 to kClockWrap. A frame of the right
  // side can lie just before the newest change of Rate; it is read on the
  // rate that ran then.
  double clock_at(uint64_t time) const {
    const bool earlier = time < clock_from_;
    const double base = earlier ? earlier_base_ : clock_base_;
    const double rate = earlier ? earlier_rate_ : rate_;
    const int64_t since = static_cast<int64_t>(time - (earlier ? earlier_from_ : clock_from_));
    const double cycles = base + rate * static_cast<double>(since) / static_cast<double>(sample_rate());
    return cycles - kClockWrap * std::floor(cycles * (1.0 / kClockWrap));
  }

  // Where every bin lies among the bands, for the Grain as it is now.
  void layout() {
    using namespace glimmer;
    const float sr = sample_rate();
    const float grain = grain_read_;
    grain_seen_ = grain;
    const float bin_hz = sr / static_cast<float>(Stft::kFrame);
    const float width = kit::max(2.0f * bin_hz, kBroadHz * std::pow(kFineHz / kBroadHz, grain));
    const float knee = kBroadKneeHz * std::pow(kFineKneeHz / kBroadKneeHz, grain);
    const float scale = knee / width;  // bands per e-fold above the knee
    int last = 0;
    for (int k = 0; k < Stft::kBins; ++k) {
      const float p = scale * std::log(1.0f + static_cast<float>(k) * bin_hz / knee);
      const int j = kit::clamp_int(static_cast<int>(p), 0, kMaxCells - 2);
      // A band is level about its centre; the half cosine to the next takes the middle `kEdgeShare` of the way.
      const float between =
          kit::clamp((p - static_cast<float>(j) - 0.5f * (1.0f - kEdgeShare)) * (1.0f / kEdgeShare), 0.0f, 1.0f);
      cell_[k] = static_cast<uint16_t>(j);
      blend_[k] = 0.5f - 0.5f * kit::SineTable::cos_lookup(0.5f * between);
      hump_[k] = 4.0f * blend_[k] * (1.0f - blend_[k]);
      last = j;
    }
    cells_ = last + 2;  // the band above the last bin's is read too
    for (int j = 0; j < cells_; ++j) {
      const float hz = knee * (std::exp(static_cast<float>(j) / scale) - 1.0f);
      place_[j] = hz > kLeanLowHz ? kit::min(1.0f, std::log2(hz / kLeanLowHz) * (1.0f / kLeanOctaves)) : 0.0f;
    }
    middle_ = scale * std::log(1.0f + kMidHz / knee);
    overlap_soft_ = -1.0f;  // the pair of bands that straddles the middle has moved
  }

  // The unit flash at `x` of a cycle (0..1, its middle at 1/2).
  static float flash(float x, float a, float b, float per_edge) {
    const float off = std::fabs(x - 0.5f);
    if (off >= b) return 0.0f;
    return off <= a ? 1.0f : 0.5f + 0.5f * kit::SineTable::cos_lookup(0.5f * (off - a) * per_edge);
  }

  // The mean over a cycle of a flash times itself `lag` of a cycle on.
  static float overlap(float lag, float a, float b, float per_edge) {
    float sum = 0.0f;
    for (int i = 0; i < kOverlapPoints; ++i) {
      const float x = (static_cast<float>(i) + 0.5f) * (1.0f / kOverlapPoints);
      float on = x + lag;
      on -= std::floor(on);
      sum += flash(x, a, b, per_edge) * flash(on, a, b, per_edge);
    }
    return sum * (1.0f / kOverlapPoints);
  }

  // A band's light at phase `phase` (cycles, never wrapped): the flash, as
  // tall as this cycle's hash says. `period` is how many of the band's
  // cycles go by while θ wraps, so that the heights come round with it.
  float light(double phase, int j, int period, float a, float b, float per_edge, float vary) const {
    const double cycle = std::floor(phase);
    const float x = std::fabs(static_cast<float>(phase - cycle) - 0.5f);
    if (x >= b) return 0.0f;
    float m = x <= a ? 1.0f : 0.5f + 0.5f * kit::SineTable::cos_lookup(0.5f * (x - a) * per_edge);
    if (vary > 0.0f) {
      const int64_t count = static_cast<int64_t>(cycle);
      const uint32_t number = static_cast<uint32_t>(((count % period) + period) % period);
      m *= 1.0f - vary * unit(hash(static_cast<uint32_t>(j) ^ kSeedVary, number));
    }
    return m;
  }

  // The gains of every band, both sides, for the frame that ends at `time`
  // (a sample count). Worked out once per frame, by whichever side comes to
  // it first: the left, unless the device slept through the left's turn.
  void prepare(uint64_t time) {
    using namespace glimmer;
    if (table_ready_ && time == table_time_) return;
    const float sr = sample_rate();
    const int target = kit::clamp_int(static_cast<int>(param(kPattern) + 0.5f), 0, kNumPatterns - 1);
    // The patterns cross-fade by the clock: so much of the way for the time since the last frame.
    const float step = table_ready_
                           ? static_cast<float>(static_cast<double>(time - table_time_) / (kPatternFadeSeconds * sr))
                           : 1.0f;
    for (int p = 0; p < kNumPatterns; ++p) {
      const float goal = p == target ? 1.0f : 0.0f;
      weight_[p] += kit::clamp(goal - weight_[p], -step, step);
    }
    table_time_ = time;
    table_ready_ = true;
    if (grain_read_ != grain_seen_) layout();  // the first frame, or Grain moved in a sleep

    const double theta = clock_at(time);
    const float depth = param(kDepth);
    const float lean = param(kLean);
    const float soft = param(kSoft);
    const float vary = param(kVary);
    const float apart = param(kApart);
    const float a = kGlintPlateau * (1.0f - soft);
    const float b = kGlintReach + (0.5f - kGlintReach) * soft;
    const float per_edge = 1.0f / (b - a);
    // The mean of the light over a cycle and of its square, with the flashes' heights in them.
    const float mean = (a + b) * (1.0f - 0.5f * vary);
    const float square = (1.25f * a + 0.75f * b) * (1.0f - vary + vary * vary * (1.0f / 3.0f));
    const bool two = apart > 0.0f;
    const double wave = 1.0 / kWaveCells;
    for (int j = 0; j < cells_; ++j) {
      const float share = lean >= 0.0f ? 1.0f - lean * (1.0f - place_[j]) : 1.0f + lean * place_[j];
      const float d = depth * share;
      const float still = 1.0f - d;
      const float power = still * still + 2.0f * d * still * mean + d * d * square;
      const float lift = kit::min(kMaxLift, 1.0f / std::sqrt(power));
      floor_[j] = lift * still;
      swing_[j] = lift * d;
      level_[j] = lift * std::sqrt(power);
      float left = 0.0f;
      float right = 0.0f;
      for (int p = 0; p < kNumPatterns; ++p) {
        const float weight = weight_[p];
        if (weight <= 0.0f) continue;
        double phase;
        int period = static_cast<int>(kClockWrap);
        double off = kWaveApart * apart;
        switch (p) {
          case kUpward:
            phase = theta - wave * j;
            break;
          case kDownward:
            phase = theta + wave * j;
            break;
          case kOutward:
            phase = theta - wave * std::fabs(static_cast<double>(j) - middle_);
            break;
          case kScatter:
          default:
            phase = phi_[j] + theta * speed_[j] * (1.0 / 64.0);
            period = speed_[j] * 64;
            off = static_cast<double>(apart) * delta_[j];
            break;
        }
        left += weight * light(phase, j, period, a, b, per_edge, vary);
        if (two) right += weight * light(phase + off, j, period, a, b, per_edge, vary);
      }
      gain_[0][j] = lift * (still + d * left);
      gain_[1][j] = two ? lift * (still + d * right) : gain_[0][j];
    }

    // What the join of each band with the next is raised by (the header's "Between two bands").
    if (soft != overlap_soft_) {
      overlap_soft_ = soft;
      overlap_wave_ = overlap(static_cast<float>(wave), a, b, per_edge);
      // Outward: the two bands either side of the middle are less than a sixth of a cycle apart.
      const float under = std::floor(middle_);
      overlap_middle_ = overlap(std::fabs(2.0f * (middle_ - under) - 1.0f) * static_cast<float>(wave), a, b, per_edge);
      middle_cell_ = static_cast<int>(under);
    }
    const float heights = (1.0f - 0.5f * vary) * (1.0f - 0.5f * vary);  // two bands' flashes are as tall as they like
    const float apart_lights = mean * mean;
    const float waves = weight_[kUpward] + weight_[kDownward];
    for (int j = 0; j + 1 < cells_; ++j) {
      const float lights = weight_[kScatter] * apart_lights + waves * heights * overlap_wave_ +
                           weight_[kOutward] * heights * (j == middle_cell_ ? overlap_middle_ : overlap_wave_);
      const float together = floor_[j] * floor_[j + 1] + (floor_[j] * swing_[j + 1] + floor_[j + 1] * swing_[j]) * mean +
                             swing_[j] * swing_[j + 1] * lights;
      const float lost = kit::clamp(1.0f - together / (level_[j] * level_[j + 1]), 0.0f, 0.99f);
      raise_[j] = 1.0f / std::sqrt(1.0f - 0.5f * lost) - 1.0f;
    }
    raise_[cells_ - 1] = 0.0f;
  }

  // One frame of channel c: every bin times its place between two bands' gains.
  void frame(int c, float* re, float* im) {
    prepare(now_ - static_cast<uint64_t>(c == 0 ? 0 : Stft::kMaxStagger));
    const float* gain = gain_[c];
    for (int k = 0; k < Stft::kBins; ++k) {
      const int j = cell_[k];
      const float under = gain[j];
      const float g = kit::min(kMaxLift, (under + blend_[k] * (gain[j + 1] - under)) * (1.0f + hump_[k] * raise_[j]));
      re[k] *= g;
      im[k] *= g;
    }
  }

  Stft stft_[2];
  float gain_[2][kMaxCells] = {};   // each band's gain now, left and right
  float place_[kMaxCells] = {};     // where a band lies along the lean, 0..1
  float phi_[kMaxCells] = {};       // Scatter: a band's phase at θ = 0, cycles
  float delta_[kMaxCells] = {};     // Scatter: how far the right side runs off at Apart 1, cycles
  uint8_t speed_[kMaxCells] = {};   // Scatter: a band's speed, in 64ths of Rate
  uint16_t cell_[Stft::kBins] = {};  // the band at or under each bin
  float blend_[Stft::kBins] = {};    // how much of the next band's gain the bin takes
  float hump_[Stft::kBins] = {};     // 4β(1−β): how much of the join's raise the bin takes
  float floor_[kMaxCells] = {};      // a band's gain with its light out, L·(1 − d)
  float swing_[kMaxCells] = {};      // and what its light adds, L·d
  float level_[kMaxCells] = {};      // the root of its mean power: 1 unless the lift is capped
  float raise_[kMaxCells] = {};      // e_j: what the join of band j and the next is raised by, half way
  float overlap_soft_ = -1.0f;       // the Soft the two overlaps below were worked out for
  float overlap_wave_ = 0.0f;        // a flash's overlap with itself a sixth of a cycle on
  float overlap_middle_ = 0.0f;      // and as far on as Outward's two middle bands are apart
  int middle_cell_ = 0;              // the band under Outward's middle
  float weight_[kNumPatterns] = {};  // how much of each pattern is in the gains
  int cells_ = 1;
  float middle_ = 0.0f;       // 800 Hz, in bands
  float grain_seen_ = -1.0f;  // the Grain the layout was made for
  float grain_read_ = 0.0f;   // Grain as last read, kLayoutAhead before the left side's frame
  float edge_sum_[2] = {};                  // the input's edge squared, summed over the segment in hand
  float edge_last_[2] = {};                 // the input sample before this one
  float edge_seen_[2][kLookSegments] = {};  // the sums of the segments before it
  uint8_t hit_[kHitRing] = {};              // which segments held an attack
  float pass_ = 0.0f;                       // how far the output has turned to the dry sound, 0..1
  float pass_goal_ = 0.0f;
  float pass_meter_ = 0.0f;
  uint64_t now_ = 0;          // samples since init, slept ones too
  uint64_t table_time_ = 0;   // the frame the gains are for
  bool table_ready_ = false;
  double rate_ = 1.0;         // Hz, since clock_from_
  double clock_base_ = 0.0;   // θ at clock_from_
  uint64_t clock_from_ = 0;
  double earlier_rate_ = 1.0;  // and the stretch before that
  double earlier_base_ = 0.0;
  uint64_t earlier_from_ = 0;
  float clock_meter_ = 0.0f;
  bool asleep_ = false;  // the block before this one was slept through
  kit::Smoother mix_;
  kit::IdleGate idle_;
};

}  // namespace livemix
