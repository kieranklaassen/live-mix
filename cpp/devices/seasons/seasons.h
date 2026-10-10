#pragma once

// Seasons: one dial turns the year, and the year can turn by itself.
//
//   in ─► tone ─► × high-band gain ─► × side-to-side gain ───────────────────────────► (+) ─► width ─► limit ─► mix ─► out
//        (low and  (shimmer, crumble)   (sway, tumble)      │                           ▲                         ▲
//         high shelf)                                       ├─► (+) ─► moving delay ─┬─► six early taps ─────────┤          in
//   in ─► low pass ─► ring ─► sparks (glitter) ─────────────┘            (vibrato)   └─► eight-line network ─────┘
//                                                                                        (decay, damping, low cut,
//                                                                                         two lines turned in pitch)
//
// - The year is a place on a circle, 0..1: 0 spring, 0.25 summer, 0.5 autumn,
//   0.75 winter. Each season has a weight cos²(2π·distance) inside a quarter
//   of the circle either side of its centre and none beyond, so two
//   neighbours are heard at a time and their weights add to one all the way
//   round, across the join at 1 to 0 as well. Every figure below is the
//   weighted blend of the four seasons' figures (decibels and amounts as they
//   are, frequencies and times in octaves), and Depth takes each from "nothing
//   is done" to that blend. At Depth 0 the wet signal is the input to the bit.
// - Tone: a first-order low shelf and high shelf side by side,
//   y = x + (gl - 1)·low(x) + (gh - 1)·high(x). Spring is bright and light,
//   summer warm and full, autumn dark with a low warmth, winter thin and glassy.
// - Movement, all by the clock (the sample count since init, which runs on
//   through sleep, so nothing here is restarted by the sound and the output is
//   the same at every block size): spring shimmers (the high band's gain at
//   5.3 Hz, out of step between the sides, and a small fast vibrato on what
//   feeds the room), summer sways (level from side to side at 0.19 Hz and a
//   slow wide vibrato), autumn tumbles (two slow sines that never line up).
//   Two of the room's eight lines pass through a frequency shifter: up in
//   spring, so a tail climbs; down in autumn, so it sinks; not at all in
//   summer and winter.
// - Texture. Autumn crumbles: the high band's gain dips in short smooth
//   dropouts and is roughened in 2 ms cells. Winter (and the first of spring)
//   glitters: short sparks that play the last fraction of a second of the
//   input two, three or four times as fast, into the sound and the room. Both
//   are worked out from the sample count alone (a hash of the slot a sample
//   falls in), so they keep their place through silence.
// - The room: six early taps a side and a network of eight delay lines mixed
//   by a Hadamard matrix. The lengths never change; the seasons differ in how
//   much of each is heard, how long the network rings, and what it loses on
//   every pass (highs in summer and autumn, lows in winter).
// - Width: the season's own (summer wide, winter narrow) times the knob.
// - Level: each season has a trim so loudness holds round the year, the
//   network's level falls as its decay grows, the loop is held to ±4 and the
//   wet signal to ±2 (linear and exact to ±1).
// - Mix is a linear crossfade: the seasoned sound is coherent with the dry.
//   Nothing is delayed, so there is no latency.
// - The year's own turning: a phase added to the Year knob, counted in
//   samples. Still walks that phase back to nothing at a year in four
//   seconds, the shorter way round, so the year comes to rest where the knob
//   says.
//
// Storage: eight lines of 8,192 samples, two early lines of 8,192, two
// vibrato lines of 2,048 and two rings of 65,536 for the sparks: about
// 0.9 MB, sized for 96 kHz.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

namespace seasons_parts {

constexpr int kSeasons = 4;  // spring, summer, autumn, winter

// What each season is, at Depth 1 and with its part's knob full up.
constexpr float kLowShelfDb[kSeasons] = {-2.0f, 3.0f, 2.0f, -7.0f};
constexpr float kLowShelfHz[kSeasons] = {200.0f, 260.0f, 180.0f, 400.0f};
constexpr float kHighShelfDb[kSeasons] = {4.5f, -2.0f, -9.0f, 3.0f};
constexpr float kHighShelfHz[kSeasons] = {2800.0f, 4500.0f, 1300.0f, 6500.0f};
// The room: level of the early taps and of the network, and its decay to -60 dB.
constexpr float kEarlyLevel[kSeasons] = {0.7f, 0.25f, 0.4f, 0.1f};
constexpr float kLateLevel[kSeasons] = {1.2f, 1.5f, 1.8f, 1.6f};
constexpr float kDecaySeconds[kSeasons] = {0.5f, 3.2f, 0.9f, 8.0f};
// Above the high crossover and below the low one the network rings for this
// share of its decay time: summer and autumn lose their top, winter its body.
constexpr float kHighCrossHz[kSeasons] = {6000.0f, 3000.0f, 1600.0f, 5000.0f};
constexpr float kHighDecay[kSeasons] = {0.6f, 0.35f, 0.25f, 0.7f};
constexpr float kLowCrossHz[kSeasons] = {250.0f, 150.0f, 150.0f, 600.0f};
constexpr float kLowDecay[kSeasons] = {0.5f, 1.0f, 0.8f, 0.2f};
// Movement: shimmer (share of the high band's gain), sway and tumble (share
// of the level, opposite on the two sides), the vibrato each gives what feeds
// the room (milliseconds either way), and the shift of two lines (Hz).
constexpr float kShimmer[kSeasons] = {0.4f, 0.05f, 0.0f, 0.0f};
constexpr float kSway[kSeasons] = {0.03f, 0.2f, 0.04f, 0.1f};
constexpr float kTumble[kSeasons] = {0.0f, 0.02f, 0.14f, 0.0f};
constexpr float kShimmerMs[kSeasons] = {0.1f, 0.02f, 0.0f, 0.0f};
constexpr float kSwayMs[kSeasons] = {0.3f, 2.2f, 0.6f, 0.3f};
constexpr float kTumbleMs[kSeasons] = {0.0f, 0.2f, 1.0f, 0.0f};
constexpr float kShiftHz[kSeasons] = {4.0f, 0.0f, -3.0f, 0.0f};
// Texture (crumble, glitter, warmth) and width.
constexpr float kCrumble[kSeasons] = {0.0f, 0.0f, 1.0f, 0.15f};
constexpr float kGlitter[kSeasons] = {0.35f, 0.0f, 0.0f, 1.0f};
constexpr float kWarmth[kSeasons] = {0.0f, 1.0f, 0.45f, 0.0f};
constexpr float kWidth[kSeasons] = {1.0f, 1.5f, 0.9f, 0.45f};
// What holds the loudness round the year (dB at Depth 1), found by measuring.
constexpr float kTrimDb[kSeasons] = {0.05f, -1.55f, 0.5f, 2.75f};

constexpr float kShimmerHz = 5.3f;
constexpr float kSwayHz = 0.19f;
constexpr float kTumbleHz = 0.83f;
constexpr float kTumbleRatio = 0.6180340f;  // the second tumble sine, against the first
constexpr float kVibratoBaseMs = 6.0f;

// The weight of season k at `year` (any real number; the circle is 0..1).
inline float weight(int k, float year) {
  float d = year - 0.25f * static_cast<float>(k);
  d -= std::floor(d + 0.5f);  // -0.5..0.5, the shorter way round
  if (d < 0.0f) d = -d;
  if (d >= 0.25f) return 0.0f;
  const float c = kit::SineTable::cos_lookup(d);  // cos(2π·d)
  return c * c;
}

// A figure blended over the seasons as it is, and one blended in octaves.
inline float blend(const float* table, const float* w) {
  return table[0] * w[0] + table[1] * w[1] + table[2] * w[2] + table[3] * w[3];
}
inline float blend_log(const float* table, const float* w) {
  return std::exp(std::log(table[0]) * w[0] + std::log(table[1]) * w[1] +
                  std::log(table[2]) * w[2] + std::log(table[3]) * w[3]);
}

// A number in 0..1 that depends on nothing but (a, b): what makes the
// dropouts and the sparks fall where they do for a given sample count.
inline uint32_t hash(uint32_t a, uint32_t b) {
  uint32_t h = a * 0x9E3779B1u + b * 0x85EBCA77u + 0x27D4EB2Fu;
  h ^= h >> 15;
  h *= 0x2C1B3C6Du;
  h ^= h >> 12;
  h *= 0x297A2D39u;
  h ^= h >> 15;
  return h;
}
inline float unit(uint32_t h) { return static_cast<float>(h >> 8) * (1.0f / 16777216.0f); }

}  // namespace seasons_parts

class Seasons : public kit::DeviceBase<seasons::kNumParams> {
 public:
  static constexpr int kLines = 8;
  static constexpr int kEarlyTaps = 6;
  static constexpr int kControlPeriod = 32;

  void init(float sample_rate) {
    using namespace seasons;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    const float ms = 0.001f * sr;
    for (int i = 0; i < kLines; ++i) {
      line_[i].clear();
      damp_[i].reset();
      cut_[i].reset();
      length_[i] = kit::clamp_int(static_cast<int>(kLineMs[i] * ms) | 1, 8, kLineSize - 8);
      gain_[i] = 0.0f;
      high_loss_[i] = 0.0f;
      low_loss_[i] = 0.0f;
    }
    for (int c = 0; c < 2; ++c) {
      early_[c].clear();
      vib_[c].clear();
      low_[c].reset();
      high_[c].reset();
      ring_low_[c].reset();
      ring_low_[c].set(kSparkBandHz, kit::kSqrtHalf, sr);
      feed_cut_[c].reset();
      feed_cut_[c].set(kFeedCutHz, kit::kSqrtHalf, sr);
      hilbert_[c].reset();
      warm_low_[c].reset();
      warm_low_[c].set_cutoff(kWarmBandHz, sr);
      top_low_[c].reset();
      top_low_[c].set_cutoff(kTopBandHz, sr);
      warm_env_[c].reset();
      warm_env_[c].set(kWarmAttackSeconds, kWarmReleaseSeconds, sr);
      for (int k = 0; k < kDiffusers; ++k) {
        diffuse_[c][k].clear();
        diffuse_length_[c][k] =
            kit::clamp_int(static_cast<int>(kDiffuseMs[c][k] * ms), 1, kDiffuseSize - 4);
      }
      for (int i = 0; i < kRingSize; ++i) ring_[c][i] = 0.0f;
      for (int k = 0; k < kEarlyTaps; ++k) {
        tap_[c][k] = kit::clamp_int(static_cast<int>(kTapMs[c][k] * ms), 1, kEarlySize - 8);
      }
      texture_[c] = Texture();
    }
    drop_slot_length_ = static_cast<int64_t>(kCrumbleSlotSeconds * sr);
    cell_length_ = static_cast<int64_t>(kCrumbleCellSeconds * sr);
    spark_slot_length_ = static_cast<int64_t>(kSparkSlotSeconds * sr);
    if (cell_length_ < 1) cell_length_ = 1;
    cell_step_ = 1.0f / static_cast<float>(cell_length_);
    for (Ramp& ramp : ramp_) ramp = Ramp();
    next_ = Targets();
    knob_coeff_ = std::exp(-static_cast<float>(kControlPeriod) / (kKnobSeconds * sr));
    count_ = 0;
    turn_from_ = 0;
    turn_base_ = 0.0;
    turn_step_ = 0.0;
    shift_phase_ = 0.0f;
    crumble_seen_ = 1.0f;
    glitter_seen_ = 0.0f;
    sway_seen_ = 0.0f;
    mix_.set_time(kSmoothingSeconds, sr);
    // Longer than the sparks' ring at any rate and than the longest line, so
    // nothing is left in any of them by the time the device sleeps.
    hold_ = static_cast<int64_t>(kHoldSeconds * sr);
    quiet_ = 0;
    asleep_ = true;
    move_knobs(true);
    mix_.snap(param(kMix));
    set_turning();
  }

  void set_param(int id, float value) {
    using namespace seasons;
    if (!store_param(id, value)) return;
    if (id == kYear) place_year();
    if (id == kTurn || id == kTurning) set_turning();
    if (id == kMix) mix_.set(param(kMix), primed() && !asleep_);
  }

  // The readings named by "meters" in device.json, for the display: where
  // the year is now (0..1, turning on through sleep), the high band's gain
  // under the crumble (1 is whole), how loud the sparks are (the bell of the
  // one sounding, times its level), and the side-to-side movement (the share
  // of the level that has gone to the left).
  float meter(int index) const {
    if (index == 0) {
      // Asleep the knob has already landed: the glide is not run in silence.
      const double place =
          (asleep_ ? static_cast<double>(param(seasons::kYear)) : year_) + turned(count_);
      return static_cast<float>(place - std::floor(place));
    }
    if (asleep_) return index == 1 ? 1.0f : 0.0f;
    if (index == 1) return crumble_seen_;
    if (index == 2) return glitter_seen_;
    if (index == 3) return sway_seen_;
    return 0.0f;
  }

  // At rest: nothing coming in, going out or left in the room.
  bool asleep() const { return asleep_; }

  void process(int frames) {
    using namespace seasons;
    frames = begin_block(frames);
    if (asleep_ && !input_present(frames)) {
      silence_output(frames);
      count_ += frames;  // the clock runs on
      return;
    }
    float crumble_now = crumble_seen_;
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      // Asleep and awake are decided sample by sample, so neither depends on
      // where the host's blocks fall.
      const bool fed = in[0] != 0.0f || in[1] != 0.0f;
      in[0] = guard(in[0]);
      in[1] = guard(in[1]);
      const int64_t n = count_;
      if (asleep_) {
        if (!fed) {
          out_left_[i] = 0.0f;
          out_right_[i] = 0.0f;
          ++count_;
          continue;
        }
        asleep_ = false;
        quiet_ = 0;
        mix_.snap(param(kMix));
        wake(n);
      } else if ((n & (kControlPeriod - 1)) == 0) {
        tick(n);
      }
      float r[kNumRamps];
      for (int k = 0; k < kNumRamps; ++k) {
        r[k] = ramp_[k].value;
        ramp_[k].value += ramp_[k].step;
      }

      // Tone, the high band's movement and texture, the warmth and the sparks.
      float direct[2], moved[2], early[2], fed_room[2];
      for (int c = 0; c < 2; ++c) {
        const float x = in[c];
        ring_[c][n & kRingMask] = ring_low_[c].lowpass(x);
        const float low = low_[c].lowpass(x);
        const float high = x - high_[c].lowpass(x);
        float toned = x + r[kLowGain] * low + r[kHighGain] * high;
        toned += r[kWarmAmount] * warmth(c, x);
        // The top of the sound (above 900 Hz, whatever the tone did to it)
        // is what shimmers and what crumbles.
        const float broken = crumble(c, n, r[kCrumbleAmount]);
        if (c == 0) crumble_now = broken;
        const float top = toned - top_low_[c].lowpass(toned);
        toned += (r[kTopLeft + c] * broken - 1.0f) * top;
        const float spark = sparks(c, n, r[kGlitterAmount]);
        direct[c] = r[kGainLeft + c] * (toned + kSparkDirect * spark);
        // What feeds the room goes through the moving delay; the early taps
        // hear it as it is, the network through two short allpasses.
        moved[c] = vib_[c].read_hermite(r[kVibLeft + c]);
        vib_[c].write(feed_cut_[c].highpass(toned + spark));
        float sum = 0.0f;
        for (int k = 0; k < kEarlyTaps; ++k) sum += kTapGain[k] * early_[c].read(tap_[c][k]);
        early[c] = sum;
        early_[c].write(moved[c]);
        float smeared = moved[c];
        for (int k = 0; k < kDiffusers; ++k) {
          smeared = diffuse_[c][k].process(smeared, diffuse_length_[c][k], kDiffuseGain);
        }
        fed_room[c] = smeared;
      }

      // The network.
      float v[kLines];
      float late_left = 0.0f, late_right = 0.0f;
      float inside = 0.0f;  // the loudest thing still travelling
      for (int k = 0; k < kLines; ++k) {
        const bool breathes = k >= kFirstBreathing && k < kFirstBreathing + kBreathing;
        const float out = breathes ? line_[k].read_hermite(r[kBreathe + k - kFirstBreathing])
                                   : line_[k].read(length_[k]);
        late_left += kOutLeft[k] * out;
        late_right += kOutRight[k] * out;
        inside = kit::max(inside, out < 0.0f ? -out : out);
        const float top = out - damp_[k].lowpass(out);
        const float bottom = cut_[k].lowpass(out);
        v[k] = (out - high_loss_[k] * top - low_loss_[k] * bottom) * gain_[k];
      }
      // Two lines are turned in pitch on every pass, a quarter turn apart.
      shift_phase_ += r[kShiftStep];
      shift_phase_ -= std::floor(shift_phase_);
      for (int k = 0; k < 2; ++k) {
        float in_phase, quadrature;
        hilbert_[k].process(v[k], &in_phase, &quadrature);
        const float turn = shift_phase_ + 0.25f * static_cast<float>(k);
        // kit::Hilbert's quadrature output leads its in-phase one, so this
        // sign is upward for a positive step.
        v[k] = in_phase * kit::SineTable::cos_lookup(turn) + quadrature * kit::SineTable::lookup(turn);
      }
      kit::hadamard<kLines>(v);
      for (int k = 0; k < kLines; ++k) {
        const float fed_line = v[k] + kFeedGain * kInSign[k] * fed_room[k & 1];
        line_[k].write(flush_denormal(4.0f * kit::soft_clip(0.25f * fed_line)));
      }

      float wet[2] = {direct[0] + r[kEarlyGain] * early[0] + r[kLateLevelGain] * late_left,
                      direct[1] + r[kEarlyGain] * early[1] + r[kLateLevelGain] * late_right};
      const float side = 0.5f * (wet[0] - wet[1]) * r[kWidthMore];
      wet[0] += side;
      wet[1] -= side;
      // Exact up to ±1, never past ±2.
      wet[0] = 2.0f * kit::soft_clip(0.5f * wet[0]);
      wet[1] = 2.0f * kit::soft_clip(0.5f * wet[1]);
      const float mix = mix_.next();
      const float left = in[0] * (1.0f - mix) + wet[0] * mix;
      const float right = in[1] * (1.0f - mix) + wet[1] * mix;
      out_left_[i] = left;
      out_right_[i] = right;
      ++count_;

      // Rest: nothing coming in, nothing going out and nothing left in the
      // room or on its way there, for as long as the hold.
      const float heard = kit::max(left < 0.0f ? -left : left, right < 0.0f ? -right : right);
      const float waiting = kit::max(kit::max(moved[0] < 0.0f ? -moved[0] : moved[0],
                                              moved[1] < 0.0f ? -moved[1] : moved[1]),
                                     kit::max(early[0] < 0.0f ? -early[0] : early[0],
                                              early[1] < 0.0f ? -early[1] : early[1]));
      if (fed || heard > kFloor || inside > kFloor || waiting > kFloor) {
        quiet_ = 0;
      } else if (++quiet_ >= hold_) {
        asleep_ = true;
      }
    }
    crumble_seen_ = crumble_now;
    glitter_seen_ = kit::max(texture_[0].spark_level, texture_[1].spark_level);
  }

 private:
  static constexpr int kLineSize = 16384;
  static constexpr int kEarlySize = 8192;
  static constexpr int kVibratoSize = 2048;
  static constexpr int kDiffuseSize = 1024;
  static constexpr int kDiffusers = 2;
  static constexpr int kRingSize = 65536;
  static constexpr int kRingMask = kRingSize - 1;

  // Lengths in milliseconds, turned into samples in init.
  static constexpr float kLineMs[kLines] = {41.3f, 49.7f, 59.9f, 71.3f, 83.9f, 97.7f, 113.3f, 131.9f};
  // Two short allpasses a side smear what goes into the network, so a room
  // of long lines is not a row of separate echoes while it is short.
  static constexpr float kDiffuseMs[2][kDiffusers] = {{4.7f, 7.9f}, {5.3f, 8.9f}};
  static constexpr float kDiffuseGain = 0.55f;
  static constexpr float kTapMs[2][kEarlyTaps] = {{9.1f, 14.9f, 22.3f, 31.7f, 43.3f, 57.9f},
                                                  {10.7f, 17.3f, 25.1f, 35.3f, 47.9f, 61.3f}};
  // They add to one whatever their signs, so the early level is the most the
  // taps can take from a held tone or add to it.
  static constexpr float kTapGain[kEarlyTaps] = {0.26f, -0.21f, 0.18f, -0.145f, 0.115f, -0.09f};
  // The room is fed above this (12 dB an octave): the bass stays out of it,
  // where no drift is wide enough to keep the room from combing the dry sound.
  static constexpr float kFeedCutHz = 200.0f;
  // The room's own wander, whatever the season: the moving delay drifts by
  // up to 1.5 ms either way on two slow sines a side. A room that stood
  // still against the dry sound would take some held notes away and double
  // others for as long as they are held (a comb); one that drifts does
  // neither for long, and a held note cannot sit on one of the network's
  // resonances.
  static constexpr float kWanderMs = 1.5f;
  static constexpr float kWanderHz[2][2] = {{0.13f, 0.31f}, {0.17f, 0.37f}};
  // Four of the lines breathe by a quarter of a millisecond, each at its own
  // slow rate, so the network has no fixed resonances for a long tail to
  // settle on: its ring stays a wash and does not thin to a few whistles.
  static constexpr int kFirstBreathing = 2;
  static constexpr int kBreathing = 4;
  static constexpr float kBreatheHz[kBreathing] = {0.11f, 0.17f, 0.23f, 0.31f};
  static constexpr float kBreatheMs = 0.25f;
  // How the two sides go into the eight lines and come out of them.
  static constexpr float kInSign[kLines] = {1.0f, 1.0f, -1.0f, 1.0f, 1.0f, -1.0f, -1.0f, -1.0f};
  static constexpr float kOutLeft[kLines] = {1.0f, 1.0f, -1.0f, -1.0f, 1.0f, -1.0f, 1.0f, -1.0f};
  static constexpr float kOutRight[kLines] = {1.0f, -1.0f, 1.0f, -1.0f, -1.0f, -1.0f, 1.0f, 1.0f};
  static constexpr float kFeedGain = 0.5f;
  static constexpr float kLateGain = 0.33f;
  // The network's level falls with its decay by this power of the time.
  static constexpr float kDecayLevelPower = 0.3f;
  // Tails: every season's decay times 0.4 at the bottom, 1 in the middle, 2.5 at the top.
  static constexpr float kTailLeast = 0.4f;
  static constexpr float kTailSpan = 6.25f;
  // What the room adds to the loudness at Space 1, taken off the trim (dB).
  static constexpr float kSpaceTrimDb[seasons_parts::kSeasons] = {1.6f, 2.8f, 2.2f, 0.55f};

  // Crumble: a slot of 45 ms holds at most one dropout, which may run into
  // the next slot; the grain is a random level every 2 ms, joined by lines.
  static constexpr float kCrumbleSlotSeconds = 0.045f;
  static constexpr float kCrumbleChance = 0.7f;
  static constexpr float kCrumbleCellSeconds = 0.002f;
  static constexpr float kCrumbleRough = 0.5f;
  // Glitter: a slot of 110 ms holds at most one spark.
  static constexpr float kSparkSlotSeconds = 0.11f;
  static constexpr float kSparkChance = 0.45f;
  static constexpr float kSparkGain = 0.7f;
  static constexpr float kSparkDirect = 0.5f;  // how much of a spark is heard outside the room
  // The sparks play a copy of the input kept under this (12 dB an octave),
  // so four times as fast it still lies under half the sample rate.
  static constexpr float kSparkBandHz = 3500.0f;
  // Warmth: the body of the sound (under 1.8 kHz) pressed against its own
  // level, so a quiet pad is warmed as much as a loud one: the body divided
  // by its envelope goes through tanh(k·u) / k and is put back at its level,
  // and what that changed is added to the sound.
  static constexpr float kTopBandHz = 900.0f;
  static constexpr float kWarmBandHz = 1800.0f;
  static constexpr float kWarmDrive = 1.1f;
  static constexpr float kWarmMakeup = 1.22f;
  static constexpr float kWarmAttackSeconds = 0.002f;
  static constexpr float kWarmReleaseSeconds = 0.15f;
  static constexpr float kWarmFloor = 1.0e-4f;

  static constexpr float kKnobSeconds = 0.03f;
  static constexpr float kGuard = 8.0f;
  static constexpr float kHoldSeconds = 2.0f;
  static constexpr float kFloor = 1.0e-7f;  // -140 dBFS

  enum RampId : int {
    kLowGain = 0,  // gl - 1
    kHighGain,     // gh - 1
    kTopLeft,      // the top's gain under the shimmer, a side (1 is still)
    kTopRight,
    kGainLeft,  // trim and side-to-side movement
    kGainRight,
    kVibLeft,  // the moving delay, samples
    kVibRight,
    kCrumbleAmount,
    kGlitterAmount,
    kWarmAmount,
    kEarlyGain,
    kLateLevelGain,
    kWidthMore,  // width - 1
    kShiftStep,  // cycles a sample
    kBreathe,    // the first of four line lengths, samples
    kNumRamps = kBreathe + kBreathing,
  };

  enum Knob : int { kKDepth = 0, kKSpace, kKMotion, kKGrit, kKTail, kKWidth, kNumKnobs };

  struct Ramp {
    float value = 0.0f;
    float step = 0.0f;
  };

  // Everything the control clock works out for one moment.
  struct Targets {
    float ramp[kNumRamps] = {};
    float low_a = 0.0f, high_a = 0.0f;  // the shelves' poles
    float damp_a = 0.0f, cut_a = 0.0f;  // the network's two crossovers
    // What a pass through each line keeps: of everything, and how much less
    // of the top and of the bottom.
    float gain[kLines] = {};
    float high_loss[kLines] = {};
    float low_loss[kLines] = {};
    float sway = 0.0f;
  };

  struct Drop {
    bool on = false;
    int64_t start = 0;
    float length = 1.0f;
    float depth = 0.0f;
  };
  struct Spark {
    bool on = false;
    int64_t start = 0;
    int64_t length = 1;
    int ratio = 2;
    float gain = 0.0f;
  };
  static constexpr int64_t kNever = -(static_cast<int64_t>(1) << 60);

  // What the hash gave for the slots a sample falls in: worked out again
  // only when the clock leaves the slot (`from` is where it began).
  struct Texture {
    int64_t drop_from = kNever;
    Drop drop[2];
    int64_t cell_from = kNever;
    float rough[2] = {0.0f, 0.0f};
    int64_t spark_from = kNever;
    Spark spark[2];
    float spark_level = 0.0f;  // for meter() only
  };

  static float guard(float x) {
    if (!(x == x)) return 0.0f;
    return kit::clamp(x, -kGuard, kGuard);
  }

  // How far the year has turned by itself at sample `n` since the Year knob
  // last placed it, in years.
  double turned(int64_t n) const {
    return turn_base_ + static_cast<double>(n - turn_from_) * turn_step_;
  }

  // Turn or Turning moved: carry on from where the year is now. Still holds
  // it there.
  void set_turning() {
    using namespace seasons;
    const double place = turned(count_);
    const int mode = kit::clamp_int(static_cast<int>(param(kTurn) + 0.5f), 0, 2);
    turn_from_ = count_;
    turn_base_ = place - std::floor(place);
    turn_step_ = mode == 0 ? 0.0
                           : (mode == 1 ? 1.0 : -1.0) /
                                 (static_cast<double>(param(kTurning)) * sample_rate());
  }

  // The Year knob was set: the year goes there (gliding the shorter way round
  // from wherever it had turned to) and turns on from there.
  void place_year() {
    year_ += turned(count_);
    year_ -= std::floor(year_);
    turn_from_ = count_;
    turn_base_ = 0.0;
  }

  // What the warmth adds to the sound of one side: the body pressed against
  // its own level, less the body.
  float warmth(int c, float x) {
    const float body = warm_low_[c].lowpass(x);
    const float level = warm_env_[c].process(body) + kWarmFloor;
    const float pressed = level * kit::fast_tanh(kWarmDrive * body / level) * (kWarmMakeup / kWarmDrive);
    return pressed - body;
  }

  // sin(2π·hz·n / rate + turn): the movement's sines, read off the clock.
  float clock_sine(int64_t n, float hz, float turn = 0.0f) const {
    const double cycles = static_cast<double>(n) * static_cast<double>(hz) / sample_rate();
    return kit::SineTable::lookup(static_cast<float>(cycles - std::floor(cycles)) + turn);
  }

  // Everything for sample `n`, from the smoothed knobs and the clock.
  void compute(int64_t n, Targets* t) const {
    using namespace seasons_parts;
    const float sr = sample_rate();
    const double place = year_ + turned(n);
    const float year = static_cast<float>(place - std::floor(place));
    float w[kSeasons];
    for (int k = 0; k < kSeasons; ++k) w[k] = weight(k, year);
    const float depth = knob_[kKDepth];
    const float space = depth * knob_[kKSpace];
    const float motion = depth * knob_[kKMotion];
    const float grit = depth * knob_[kKGrit];

    // Tone.
    const float low = kit::db_to_gain(depth * blend(kLowShelfDb, w));
    const float high = kit::db_to_gain(depth * blend(kHighShelfDb, w));
    t->low_a = std::exp(-kit::kTwoPi * blend_log(kLowShelfHz, w) / sr);
    t->high_a = std::exp(-kit::kTwoPi * blend_log(kHighShelfHz, w) / sr);

    // Movement.
    const float shimmer_left = clock_sine(n, kShimmerHz);
    const float shimmer_right = clock_sine(n, kShimmerHz, 0.25f);
    const float sway = clock_sine(n, kSwayHz);
    const float tumble =
        0.6f * clock_sine(n, kTumbleHz) + 0.4f * clock_sine(n, kTumbleHz * kTumbleRatio, 0.31f);
    const float shimmer = motion * blend(kShimmer, w);
    const float side = motion * (blend(kSway, w) * sway + blend(kTumble, w) * tumble);
    const float trim = kit::db_to_gain(depth * blend(kTrimDb, w) - space * blend(kSpaceTrimDb, w));
    const float ms = 0.001f * sr;
    const float vib_shimmer = motion * blend(kShimmerMs, w) * ms;
    const float vib_slow = motion * (blend(kSwayMs, w) * sway + blend(kTumbleMs, w) * tumble) * ms;

    float* r = t->ramp;
    r[kLowGain] = low - 1.0f;
    r[kHighGain] = high - 1.0f;
    r[kTopLeft] = 1.0f + shimmer * shimmer_left;
    r[kTopRight] = 1.0f + shimmer * shimmer_right;
    r[kGainLeft] = trim * (1.0f + side);
    r[kGainRight] = trim * (1.0f - side);
    float wander[2];
    for (int c = 0; c < 2; ++c) {
      wander[c] = kWanderMs * ms *
                  (0.6f * clock_sine(n, kWanderHz[c][0]) + 0.4f * clock_sine(n, kWanderHz[c][1], 0.2f));
    }
    r[kVibLeft] = kVibratoBaseMs * ms + wander[0] + vib_shimmer * shimmer_left + vib_slow;
    r[kVibRight] = kVibratoBaseMs * ms + wander[1] + vib_shimmer * shimmer_right - vib_slow;
    r[kCrumbleAmount] = grit * blend(kCrumble, w);
    r[kGlitterAmount] = grit * blend(kGlitter, w);
    r[kWarmAmount] = grit * blend(kWarmth, w);
    r[kWidthMore] = (1.0f + depth * (blend(kWidth, w) - 1.0f)) * knob_[kKWidth] - 1.0f;
    r[kShiftStep] = motion * blend(kShiftHz, w) / sr;
    for (int k = 0; k < kBreathing; ++k) {
      r[kBreathe + k] = static_cast<float>(length_[kFirstBreathing + k]) +
                        kBreatheMs * ms * clock_sine(n, kBreatheHz[k], 0.17f * static_cast<float>(k));
    }

    // The room.
    const float decay =
        blend_log(kDecaySeconds, w) * kTailLeast * std::pow(kTailSpan, knob_[kKTail]);
    r[kEarlyGain] = trim * space * blend(kEarlyLevel, w);
    r[kLateLevelGain] =
        trim * space * blend(kLateLevel, w) * kLateGain * std::pow(decay, -kDecayLevelPower);
    const float high_decay = decay * blend(kHighDecay, w);
    const float low_decay = decay * blend(kLowDecay, w);
    for (int i = 0; i < kLines; ++i) {
      const float length = static_cast<float>(length_[i]);
      const float kept = kit::rt60_gain(length, decay, sr);
      t->gain[i] = kept;
      t->high_loss[i] = 1.0f - kit::rt60_gain(length, high_decay, sr) / kept;
      t->low_loss[i] = 1.0f - kit::rt60_gain(length, low_decay, sr) / kept;
    }
    t->damp_a = std::exp(-kit::kTwoPi * blend_log(kHighCrossHz, w) / sr);
    t->cut_a = std::exp(-kit::kTwoPi * blend_log(kLowCrossHz, w) / sr);
    t->sway = side;
  }

  // Take what was worked out for this moment as the filters' settings.
  void use(const Targets& t) {
    for (int c = 0; c < 2; ++c) {
      low_[c].a = t.low_a;
      high_[c].a = t.high_a;
    }
    for (int i = 0; i < kLines; ++i) {
      damp_[i].a = t.damp_a;
      cut_[i].a = t.cut_a;
      gain_[i] = t.gain[i];
      high_loss_[i] = t.high_loss[i];
      low_loss_[i] = t.low_loss[i];
    }
    sway_seen_ = t.sway;
  }

  void aim() {
    for (int i = 0; i < kNumRamps; ++i) {
      ramp_[i].step = (next_.ramp[i] - ramp_[i].value) * (1.0f / kControlPeriod);
    }
  }

  float knob_target(int k) const {
    using namespace seasons;
    static constexpr int kIds[kNumKnobs] = {kDepth, kSpace, kMotion, kGrit, kTail, kWidth};
    return param(kIds[k]);
  }

  // One step of the knobs' glide (30 ms), or all the way when `snap`.
  void move_knobs(bool snap) {
    for (int k = 0; k < kNumKnobs; ++k) {
      const float target = knob_target(k);
      const float left = knob_[k] - target;
      knob_[k] = (snap || (left < 1.0e-5f && left > -1.0e-5f)) ? target : target + left * knob_coeff_;
    }
    // The Year knob goes the shorter way round, and lands.
    const double wanted = static_cast<double>(param(seasons::kYear));
    double away = wanted - year_;
    away -= std::floor(away + 0.5);
    if (snap || (away < 1.0e-6 && away > -1.0e-6)) {
      year_ = wanted;
    } else {
      year_ += away * (1.0 - static_cast<double>(knob_coeff_));
    }
  }

  // Awake again (or for the first time): stand where a device that had never
  // slept would stand at sample `n`, on the control clock's own grid, so the
  // sound does not depend on which sample the host's block woke it at.
  void wake(int64_t n) {
    move_knobs(true);
    const int64_t grid = n - (n & (kControlPeriod - 1));
    compute(grid, &next_);
    use(next_);
    for (int i = 0; i < kNumRamps; ++i) ramp_[i].value = next_.ramp[i];
    compute(grid + kControlPeriod, &next_);
    aim();
    for (int64_t k = grid; k < n; ++k) {
      for (int i = 0; i < kNumRamps; ++i) ramp_[i].value += ramp_[i].step;
    }
    shift_phase_ = 0.0f;
    for (Texture& texture : texture_) texture = Texture();
    for (kit::Follower& follower : warm_env_) follower.reset();
  }

  // Every 32 samples of the clock.
  void tick(int64_t n) {
    move_knobs(false);
    use(next_);
    compute(n + kControlPeriod, &next_);
    aim();
  }

  // The high band's gain under the crumble at sample `n`: 1 with none.
  float crumble(int c, int64_t n, float amount) {
    using namespace seasons_parts;
    Texture& t = texture_[c];
    if (n < t.drop_from || n >= t.drop_from + drop_slot_length_) {
      const int64_t slot = n / drop_slot_length_;
      t.drop_from = slot * drop_slot_length_;
      for (int j = 0; j < 2; ++j) {
        const int64_t k = slot - j;
        const uint32_t h = hash(static_cast<uint32_t>(k), 0xC0u + static_cast<uint32_t>(c));
        const float span = static_cast<float>(drop_slot_length_);
        Drop& drop = t.drop[j];
        drop.on = unit(h) < kCrumbleChance;
        drop.start = k * drop_slot_length_ + static_cast<int64_t>(unit(hash(h, 1u)) * 0.8f * span);
        drop.length = (0.25f + 0.9f * unit(hash(h, 2u))) * span;
        drop.depth = 0.4f + 0.9f * unit(hash(h, 3u));
      }
    }
    if (n < t.cell_from || n >= t.cell_from + cell_length_) {
      const int64_t cell = n / cell_length_;
      t.cell_from = cell * cell_length_;
      const uint32_t seed = 0xD0u + static_cast<uint32_t>(c);
      t.rough[0] = unit(hash(static_cast<uint32_t>(cell), seed));
      t.rough[1] = unit(hash(static_cast<uint32_t>(cell + 1), seed));
    }
    if (amount <= 0.0f) return 1.0f;
    float gain = 1.0f;
    for (const Drop& drop : t.drop) {
      if (!drop.on) continue;
      const float along = static_cast<float>(n - drop.start) / drop.length;
      if (along < 0.0f || along >= 1.0f) continue;
      const float bell = kit::SineTable::lookup(0.5f * along);
      gain *= 1.0f - kit::min(1.0f, amount * drop.depth) * bell * bell;
    }
    const float between = static_cast<float>(n - t.cell_from) * cell_step_;
    return gain * (1.0f - amount * kCrumbleRough * kit::lerp(t.rough[0], t.rough[1], between));
  }

  // The sparks of one side at sample `n`: the ring read two, three or four
  // times as fast under a bell, ending just behind the newest sample.
  float sparks(int c, int64_t n, float amount) {
    using namespace seasons_parts;
    Texture& t = texture_[c];
    if (n < t.spark_from || n >= t.spark_from + spark_slot_length_) {
      const int64_t slot = n / spark_slot_length_;
      t.spark_from = slot * spark_slot_length_;
      for (int j = 0; j < 2; ++j) {
        const int64_t k = slot - j;
        const uint32_t h = hash(static_cast<uint32_t>(k), 0xE0u + static_cast<uint32_t>(c));
        const float span = static_cast<float>(spark_slot_length_);
        static constexpr int kRatios[4] = {2, 2, 3, 4};
        Spark& spark = t.spark[j];
        spark.on = unit(h) < kSparkChance;
        spark.start = k * spark_slot_length_ + static_cast<int64_t>(unit(hash(h, 1u)) * 0.4f * span);
        spark.length = static_cast<int64_t>((0.35f + 0.6f * unit(hash(h, 2u))) * span);
        spark.ratio = kRatios[hash(h, 3u) & 3u];
        spark.gain = 0.5f + 0.5f * unit(hash(h, 4u));
      }
    }
    t.spark_level = 0.0f;
    if (amount <= 0.0f) return 0.0f;
    float sum = 0.0f;
    for (const Spark& spark : t.spark) {
      const int64_t into = n - spark.start;
      if (!spark.on || into < 0 || into >= spark.length) continue;
      const float along = static_cast<float>(into) / static_cast<float>(spark.length);
      const float bell = 0.5f - 0.5f * kit::SineTable::cos_lookup(along);
      const int64_t at = spark.start - spark.length * (spark.ratio - 1) - 4 + into * spark.ratio;
      sum += spark.gain * bell * ring_[c][at & kRingMask];
      t.spark_level += amount * spark.gain * bell;
    }
    return sum * amount * kSparkGain;
  }

  kit::DelayLine<kLineSize> line_[kLines];
  kit::DelayLine<kEarlySize> early_[2];
  kit::AllpassDelay<kDiffuseSize> diffuse_[2][kDiffusers];
  int diffuse_length_[2][kDiffusers] = {};
  kit::DelayLine<kVibratoSize> vib_[2];
  float ring_[2][kRingSize];
  kit::OnePole low_[2], high_[2], warm_low_[2], top_low_[2];
  kit::Svf feed_cut_[2], ring_low_[2];
  kit::Follower warm_env_[2];
  kit::OnePole damp_[kLines], cut_[kLines];
  kit::Hilbert hilbert_[2];
  int length_[kLines] = {};
  int tap_[2][kEarlyTaps] = {};
  int64_t drop_slot_length_ = 1, cell_length_ = 1, spark_slot_length_ = 1;
  float cell_step_ = 1.0f;

  Ramp ramp_[kNumRamps];
  Targets next_;
  float gain_[kLines] = {};
  float high_loss_[kLines] = {};
  float low_loss_[kLines] = {};
  float knob_[kNumKnobs] = {};
  float knob_coeff_ = 0.0f;
  double year_ = 0.0;  // the Year knob, smoothed, not wrapped
  Texture texture_[2];
  float shift_phase_ = 0.0f;

  // The clock: samples since init, asleep or not, and the year's own turning.
  int64_t count_ = 0;
  int64_t turn_from_ = 0;
  double turn_base_ = 0.0;
  double turn_step_ = 0.0;

  kit::Smoother mix_;
  // Rest, counted in samples: asleep after `hold_` quiet ones in a row.
  int64_t hold_ = 1;
  int64_t quiet_ = 0;
  bool asleep_ = true;
  // For meter() only.
  float crumble_seen_ = 1.0f;
  float glitter_seen_ = 0.0f;
  float sway_seen_ = 0.0f;
};

}  // namespace livemix
