#pragma once

// Skipping Stone: echoes that land the way a stone skips over water.
//
//   in ─┬──────────────────────────────────────────────────────────────► dry ──┐
//       └─ L+R ─(+)─► soft limit ─► ring ─► landing 1 ─► sink ─┬─ pan ──► (+)─► hold ─► wet ─┴─► out
//                ▲                     ├──► landing 2 ─► sink ─┤           ▲
//                │                     ├──► ...                ├─ ripple ─► rings (allpasses)
//                │                     └──► landing n ─► sink ─┘
//                └─ hold ◄─ no DC ◄─ Again ◄── the last landing, before Loss
//
// - The landings. The first comes First after the sound. Every gap after it
//   is Bounce times the gap before, so under 1 they close up and over 1 they
//   spread out: landing k is First x (1 + Bounce + ... + Bounce^(k-1)) late.
//   The throw ends after Skips landings, or sooner: when a gap gets shorter
//   than 2 ms the stone has sunk, and one that would land more than 20 s
//   late is out of sight.
// - Each landing is softer than the one before by Loss, duller by Sink (two
//   one-pole low-passes whose corner falls 0.6 of an octave a skip at full
//   Sink, the same corner at every sample rate, and stands open for the
//   first), and lower by Drop. It sits across the stereo field where the
//   stone is at that moment: Throw carries it from one side to the other at
//   a steady speed, so landings that crowd in time crowd in space.
// - The level. A throw as a whole is as loud as the sound that was thrown:
//   the landings share its power, so many skips with little Loss are each
//   softer and a held sound comes out of the skips at the level it went in
//   (see `level`). The skips are mono: the two sides go into the ring as one.
// - Ripple turns a share of every landing into rings: a share Ripple of what
//   is still sharp at each skip goes to five allpasses a side (unity gain,
//   so the landing keeps its energy and only its outline spreads). The first
//   landing is always sharp.
// - Drop reads a landing a little slower than it was written, with one head
//   that so falls behind the landing's own time. When it is half a window
//   late (a window is 20 to 60 ms) it goes back by about a window: to the
//   place, within 12 ms of that, where the sound is most like what the head
//   has just played, over a cross-fade of 15 ms whose gain is set by how
//   alike the two places are. So a held tone is spliced in phase and keeps
//   its level, noise is spliced at equal power, and a landing comes back
//   once, up to half a window before or after its time. With no Drop the
//   read is the plain tap.
// - Again throws the stone again from where it stopped: the last landing,
//   as dull and as low as it has become but before its Loss, goes back into
//   the ring at that gain, without its DC. A loop adds up a held sound, so
//   what is thrown back is held to the level of what was thrown in (as loud
//   as the loudest of it lately, see `hold`), and the ring is written through
//   a limiter that is exactly linear below -6 dBFS.
// - The skips on each side are held to 3 dB over what was thrown in, in the
//   same way: landings that add up in step on a held tone (an even throw is
//   a comb) do not come out many times louder than the tone went in. Sound
//   with gaps in it, whose landings do not add up, is never touched. (With
//   Drop the landings of a held tone are at different pitches and beat
//   against one another; a beat shorter than the hold's 50 ms goes by it.)
// - Landing times are whole samples. When First, Bounce or Skips move, every
//   landing cross-fades from where it was to where it is to be (30 ms),
//   so nothing bends in pitch. Gains ramp over 5 ms.
// - Asleep the device forgets the ring. It falls asleep and wakes on a
//   sample, not on a block: once nothing has gone in, nothing has been
//   written to the ring for as long as the longest landing takes, and the
//   landings and their rings have been silent for a quarter second. On
//   waking every control stands where its knob is and every Drop head
//   starts again on its landing's own time.
//
// Storage: one mono ring of 2^21 samples (8 MB, 21.8 s at 96 kHz) and ten
// allpass lines of 4096 samples (160 kB).

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class SkippingStone : public kit::DeviceBase<skipping_stone::kNumParams> {
 public:
  static constexpr int kMaxLandings = 16;
  // A gap shorter than this ends the throw: the stone has sunk.
  static constexpr float kMinGapSeconds = 0.002f;
  // A landing later than this is not played: it is out of sight.
  static constexpr float kMaxThrowSeconds = 20.0f;
  // Sink: over this corner a landing's low-passes stand open (the first
  // landing's always do), under kSinkKneeHz the corner is the one asked for,
  // and it falls this many octaves per skip with Sink at 1.
  static constexpr float kOpenHz = 20000.0f;
  static constexpr float kSinkKneeHz = 10000.0f;
  static constexpr float kSinkOctaves = 0.6f;
  // Drop: no landing is read slower than this many cents down. A head falls
  // behind until it is half a window late and then goes back by a window or
  // a little less. The window is as long as the head falls behind in
  // 1 / kSpliceHz seconds, between kMinWindowSeconds and kMaxWindowSeconds;
  // the jump may be shorter than the window by up to twice kSearchSeconds
  // (and never by more than half the window), and takes kSpliceSeconds.
  static constexpr float kMaxDropCents = 3600.0f;
  static constexpr float kSpliceHz = 0.25f;
  static constexpr float kMinWindowSeconds = 0.02f;
  static constexpr float kMaxWindowSeconds = 0.06f;
  static constexpr float kSearchSeconds = 0.006f;
  static constexpr float kSpliceSeconds = 0.015f;
  // How long a landing takes to cross-fade to a new place.
  static constexpr float kFadeSeconds = 0.03f;
  // The rings: allpass gain, and the delays of the five a side in milliseconds.
  static constexpr int kRings = 5;
  static constexpr float kRingGain = 0.62f;
  static constexpr float kRingMs[2][kRings] = {{5.3f, 8.9f, 14.3f, 22.7f, 35.1f},
                                               {6.1f, 9.7f, 13.1f, 24.1f, 33.3f}};
  // The hold (see `hold`). What Again throws back is held to kLoopCeiling
  // times the power of what was thrown in, and the skips on either side to
  // kWetCeiling times it. Levels are mean squares over kLevelTimeSeconds; the
  // level thrown in is remembered at its highest and falls by half (or, with
  // Again over 0.7, as fast as a throw is softer than the one before) in the
  // length of a throw and kHoldRestSeconds. A hold closes in kHoldAttackSeconds
  // and opens in kHoldReleaseSeconds.
  static constexpr float kLoopCeiling = 1.0f;
  static constexpr float kWetCeiling = 2.0f;
  static constexpr float kLevelTimeSeconds = 0.05f;
  static constexpr float kHoldRestSeconds = 0.4f;
  static constexpr float kHoldAttackSeconds = 0.03f;
  static constexpr float kHoldReleaseSeconds = 0.3f;
  // The corner under which the loop passes nothing back: no DC adds up in it.
  static constexpr float kLoopLowHz = 8.0f;
  // A sample larger than this (36 dB over full scale), or one that is not a
  // number, is not sound: it is left out of the ring.
  static constexpr float kAbsurd = 64.0f;
  // For a display (see meter): how much of the newest sound its level is
  // taken from, and where its clock goes round.
  static constexpr float kLevelSeconds = 0.02f;
  static constexpr float kClockSeconds = 64.0f;

  // The throw the knobs ask for: when each of the sixteen landings would
  // come, in seconds after the sound, and how many of them are played.
  static int landings(float first_ms, float bounce, int skips, float* seconds) {
    float gap = first_ms * 0.001f;
    float at = 0.0f;
    int count = 0;
    for (int k = 0; k < kMaxLandings; ++k) {
      if (k > 0) gap *= bounce;
      at += gap;
      seconds[k] = at;
      if (count == k && k < skips && gap >= kMinGapSeconds && at <= kMaxThrowSeconds) count = k + 1;
    }
    return count;
  }

  // The gain of the first landing (every later one is Loss under the one
  // before). The landings of one throw share the power of what was thrown:
  // with every one of them in the middle, steady sound that is the same on
  // both sides comes out of the skips as loud as it went in, however many
  // they are and whatever Loss is. Thrown again, a held sound adds up in the
  // ring by as much as the loop lets it (never more than kLoopCeiling, see
  // `hold`), and the skips are turned down by that too.
  static float level(float loss_db, int count, float again) {
    const float loss = kit::db_to_gain(-loss_db);
    float power = 0.0f;
    float gain = 1.0f;
    for (int k = 0; k < count; ++k) {
      power += gain * gain;
      gain *= loss;
    }
    const float loop = again * again / (1.0f - again * again);
    return std::sqrt(2.0f / (power * (1.0f + kit::min(loop, kLoopCeiling))));
  }

  // Sink: the pole of each of a landing's two low-passes for a corner. Each
  // is 3 dB down at the corner whatever the sample rate; between kSinkKneeHz
  // and kOpenHz the pole fades to nothing, so an open landing is not filtered
  // at all.
  static float sink_pole(float corner_hz, float sample_rate) {
    if (corner_hz >= kOpenHz) return 0.0f;
    const double w = 2.0 * 3.14159265358979323846 * kit::min(corner_hz, 0.49f * sample_rate) / sample_rate;
    const double c = 2.0 - std::cos(w);
    const double pole = c - std::sqrt(c * c - 1.0);
    const float open = kit::clamp((kOpenHz - corner_hz) / (kOpenHz - kSinkKneeHz), 0.0f, 1.0f);
    return kit::clamp(static_cast<float>(pole) * open, 0.0f, 0.99995f);
  }

  void init(float sample_rate) {
    using namespace skipping_stone;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    ring_.clear();
    for (int side = 0; side < 2; ++side) {
      for (int stage = 0; stage < kRings; ++stage) {
        rings_[side][stage].clear();
        ring_delay_[side][stage] = kit::clamp_int(
            static_cast<int>(kRingMs[side][stage] * 0.001f * sr + 0.5f), 1, kRingLine - 4);
      }
    }
    mix_.set_time(kSmoothingSeconds, sr);
    const float period = static_cast<float>(kControlPeriod);
    gain_coeff_ = 1.0f - std::exp(-period / (kSmoothingSeconds * sr));
    hold_attack_ = 1.0f - std::exp(-period / (kHoldAttackSeconds * sr));
    hold_release_ = 1.0f - std::exp(-period / (kHoldReleaseSeconds * sr));
    level_coeff_ = 1.0f - std::exp(-1.0f / (kLevelTimeSeconds * sr));
    low_coeff_ = 1.0f - std::exp(-kit::kTwoPi * kLoopLowHz / sr);
    fade_step_ = 1.0f / kit::max(1.0f, kFadeSeconds * sr);
    splice_step_ = 1.0f / kit::max(1.0f, kSpliceSeconds * sr);
    // The search compares the sound every quarter millisecond or so, whatever the rate.
    stride_ = kit::clamp_int(static_cast<int>(sr / 12000.0f + 0.5f), 1, 16);
    level_span_ = static_cast<int>(kLevelSeconds * sr);
    if (level_span_ < 1) level_span_ = 1;
    ran_ = 0;
    asleep_ = true;
    restart();
  }

  void set_param(int id, float value) {
    using namespace skipping_stone;
    if (!store_param(id, value)) return;
    if (id == kMix) {
      // Nothing sounds while asleep, so a value set then has nothing to glide from.
      mix_.set(param(kMix), primed() && !asleep_);
    } else {
      dirty_ = true;
    }
  }

  // The readings named by "meters" in device.json, for a display to draw:
  // 0, the level that was just written to the ring (the highest sample of the
  // last 20 to 40 ms, the sound that went in and what Again threw back);
  // 1, how long the device has run, in seconds, going round at 64: it moves
  // on with every sample the device works, so a display can tell a device
  // that runs from one that stands. Asleep, when the ring is forgotten, that
  // is -1 and the level 0.
  float meter(int index) const {
    if (asleep_) return index == 1 ? -1.0f : 0.0f;
    if (index == 0) return kit::max(level_now_, level_before_);
    if (index == 1) {
      const double lap = static_cast<double>(kClockSeconds) * sample_rate();
      const double frames = static_cast<double>(ran_);
      return static_cast<float>((frames - lap * std::floor(frames / lap)) / sample_rate());
    }
    return 0.0f;
  }

  void process(int frames) {
    using namespace skipping_stone;
    frames = begin_block(frames);
    if (asleep_ && !input_present(frames)) {
      silence_output(frames);
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      if (asleep_) {
        if (in[0] == 0.0f && in[1] == 0.0f) {
          out_left_[i] = 0.0f;
          out_right_[i] = 0.0f;
          continue;
        }
        asleep_ = false;
        restart();
      }
      if (clock_.tick()) {
        if (dirty_ || !settled_) control();
        hold();
      }

      // What the ring is given: the two sides as one. A sample that is not a
      // number, or is absurdly large, is left out: it is not sound, and half
      // a second of it would otherwise be thrown at full scale for as long as
      // Again keeps throwing.
      float mono = 0.5f * (in[0] + in[1]);
      if (!(mono > -kAbsurd && mono < kAbsurd)) mono = 0.0f;

      float direct[2] = {0.0f, 0.0f};
      float send[2] = {0.0f, 0.0f};
      float back = 0.0f;
      const float fade = fade_;
      for (int k = 0; k < run_; ++k) {
        Landing& landing = landings_[k];
        float x = read(landing, landing.delay);
        if (fading_ && landing.next != landing.delay) {
          x += (read(landing, landing.next) - x) * fade;
        }
        if (landing.dropped) advance(landing);
        // Sink: two one-poles at the same corner. With the pole at 0 they pass the sample as it is.
        landing.low[0] = flush_denormal(x + (landing.low[0] - x) * landing.pole);
        landing.low[1] = flush_denormal(landing.low[0] + (landing.low[1] - landing.low[0]) * landing.pole);
        const float y = landing.low[1];
        direct[0] += y * landing.now[kDirectLeft];
        direct[1] += y * landing.now[kDirectRight];
        send[0] += y * landing.now[kSendLeft];
        send[1] += y * landing.now[kSendRight];
        back += y * landing.now[kBack];
        if (ramping_) {
          for (int j = 0; j < kNumRamps; ++j) landing.now[j] += landing.step[j];
        }
      }
      if (fading_) {
        fade_ += fade_step_;
        if (fade_ >= 1.0f) {
          for (Landing& landing : landings_) landing.delay = landing.next;
          fading_ = false;
          fade_ = 0.0f;
        }
      }

      // What Again throws back: without its DC (an offset would add up in the
      // loop to twenty times itself), and held to the level of what was
      // thrown in.
      loop_low_ = flush_denormal(loop_low_ + (back - loop_low_) * low_coeff_);
      back -= loop_low_;
      back_level_ = flush_denormal(back_level_ + (back * back - back_level_) * level_coeff_);
      back *= back_hold_;
      back_hold_ += back_hold_step_;

      // The level thrown in, as the ring takes it, remembered at its highest.
      const float thrown = kit::soft_clip(mono);
      in_level_ = flush_denormal(in_level_ + (thrown * thrown - in_level_) * level_coeff_);
      held_ = flush_denormal(held_ * held_decay_);
      if (in_level_ > held_) held_ = in_level_;

      const float written = flush_denormal(kit::soft_clip(mono + back));
      ring_.write(written);
      const float size = written < 0.0f ? -written : written;
      if (size > level_now_) level_now_ = size;
      if (++level_count_ >= level_span_) {
        level_before_ = level_now_;
        level_now_ = 0.0f;
        level_count_ = 0;
      }
      ++ran_;

      float wet[2];
      for (int side = 0; side < 2; ++side) {
        // A sample after the landing, so the rings begin beside it and not under it.
        float rings = sent_[side];
        sent_[side] = send[side];
        for (int stage = 0; stage < kRings; ++stage) {
          rings = rings_[side][stage].process(rings, ring_delay_[side][stage], kRingGain);
        }
        wet[side] = direct[side] + rings;
      }
      // The skips, held on the louder side to kWetCeiling times what was thrown in.
      wet_level_[0] = flush_denormal(wet_level_[0] + (wet[0] * wet[0] - wet_level_[0]) * level_coeff_);
      wet_level_[1] = flush_denormal(wet_level_[1] + (wet[1] * wet[1] - wet_level_[1]) * level_coeff_);
      wet[0] *= wet_hold_;
      wet[1] *= wet_hold_;
      wet_hold_ += wet_hold_step_;

      const float mix = mix_.next();
      if (mix != mix_seen_) {
        mix_seen_ = mix;
        dry_gain_ = kit::SineTable::cos_lookup(0.25f * mix);
        wet_gain_ = kit::SineTable::lookup(0.25f * mix);
      }
      out_left_[i] = in[0] * dry_gain_ + wet[0] * wet_gain_;
      out_right_[i] = in[1] * dry_gain_ + wet[1] * wet_gain_;

      // Sleep is decided sample by sample and before Mix, so it does not
      // depend on the block size or on where Mix stands: nothing has gone in,
      // nothing worth hearing has been written to the ring for as long as its
      // longest landing takes, and the landings and their rings have been
      // silent for a quarter second.
      const float floor = kit::IdleGate::kFloor;
      const bool heard = in[0] != 0.0f || in[1] != 0.0f;
      if (heard || size > kWriteFloor) {
        stale_ = 0;
      } else {
        ++stale_;
      }
      if (heard || wet[0] > floor || wet[0] < -floor || wet[1] > floor || wet[1] < -floor) {
        quiet_ = 0;
      } else {
        ++quiet_;
      }
      if (stale_ >= hold_ && quiet_ >= rest_) asleep_ = true;
    }
  }

 private:
  // 2^21 samples: 20 s at 96 kHz and the Drop window beyond it.
  static constexpr int kRingSize = 2097152;
  static constexpr int kRingLine = 4096;
  static constexpr int kControlPeriod = 32;
  // Drop: a head is never closer to the newest sample than this, and the
  // search for a place to go back to compares this many samples `stride_`
  // apart behind each place (half as many, twice as far apart, on its first
  // pass, which tries a place every four strides).
  static constexpr int kHeadRoom = 16;
  static constexpr int kComparePoints = 128;
  // Under this what is written to the ring is not worth staying awake for:
  // sixteen landings of it together are under the idle floor.
  static constexpr float kWriteFloor = 5.0e-9f;
  // A mean square under this is silence to the hold.
  static constexpr float kQuietPower = 1.0e-14f;

  enum Ramp : int { kDirectLeft = 0, kDirectRight, kSendLeft, kSendRight, kBack, kNumRamps };

  // The ring: x[n - d] for d >= 1, read before the write of x[n]. What was
  // written before forget() reads as silence without the memory being touched.
  class Ring {
   public:
    void clear() {
      for (int i = 0; i < kRingSize; ++i) buffer_[i] = 0.0f;
      write_ = 0;
      held_ = 0;
    }
    void forget() { held_ = 0; }
    void write(float x) {
      buffer_[write_] = x;
      write_ = (write_ + 1) & kMask;
      if (held_ < kRingSize - 8) ++held_;
    }
    float read(int delay) const { return delay <= held_ ? buffer_[(write_ - delay) & kMask] : 0.0f; }
    // Between x[n - whole] and x[n - whole - 1], `fraction` of the way: the
    // place is given in two parts because a float cannot hold a twentieth of
    // a sample twenty seconds back.
    float read_hermite(int whole, float fraction) const {
      if (whole < 2) return read(2);
      if (whole + 2 > held_) return whole <= held_ ? buffer_[(write_ - whole) & kMask] : 0.0f;
      return kit::hermite(buffer_[(write_ - whole + 1) & kMask], buffer_[(write_ - whole) & kMask],
                          buffer_[(write_ - whole - 1) & kMask], buffer_[(write_ - whole - 2) & kMask],
                          fraction);
    }

   private:
    static constexpr int kMask = kRingSize - 1;
    float buffer_[kRingSize] = {};
    int write_ = 0;
    int held_ = 0;
  };

  struct Landing {
    // Where it reads, in samples behind the write point, and where it is fading to.
    int delay = 2;
    int next = 2;
    int wanted = 2;
    // The gains as they are now, their step per sample, where the ramp of
    // this control period ends and what the knobs ask for.
    float now[kNumRamps] = {};
    float step[kNumRamps] = {};
    float goal[kNumRamps] = {};
    float target[kNumRamps] = {};
    // Sink: the pole of the two low-passes, what the knobs ask for, and their states.
    float pole = 0.0f;
    float pole_target = 0.0f;
    float low[2] = {0.0f, 0.0f};
    // Drop. `rate` is how much slower than the sound the head reads (0 for no
    // Drop) and `half` half its window, in samples. While `dropped`, the head
    // reads `pos` samples behind the landing's own time. During a splice
    // (`splice` under 1) the head it came from still reads at `from`; the new
    // one has the share `weight`, the two were `alike` by that much where
    // they met, and `norm` is the gain that keeps their sum as loud as one.
    float rate = 0.0f;
    float half = 0.0f;
    bool dropped = false;
    float pos = 0.0f;
    float from = 0.0f;
    float splice = 1.0f;
    float weight = 1.0f;
    float alike = 0.0f;
    float norm = 1.0f;
  };

  // One landing's sample at `delay`: the plain tap, or with Drop the head
  // where it has fallen to, cross-faded with the one it came from while a
  // splice lasts.
  float read(const Landing& landing, int delay) const {
    if (!landing.dropped) return ring_.read(delay);
    const float head = read_behind(delay, landing.pos);
    if (landing.splice >= 1.0f) return head;
    const float old = read_behind(delay, landing.from);
    return (old + (head - old) * landing.weight) * landing.norm;
  }

  // The ring `behind` samples (not a whole number, and maybe under 0) behind `delay`.
  float read_behind(int delay, float behind) const {
    const float floored = std::floor(behind);
    return ring_.read_hermite(delay + static_cast<int>(floored), behind - floored);
  }

  // A dropped landing, one sample on: its head falls behind by `rate`, a
  // splice moves on, and a head that has fallen half a window behind goes back.
  void advance(Landing& landing) {
    landing.pos += landing.rate;
    if (landing.splice < 1.0f) {
      landing.from += landing.rate;
      landing.splice += splice_step_;
      if (landing.splice >= 1.0f) {
        landing.splice = 1.0f;
        landing.weight = 1.0f;
        landing.norm = 1.0f;
      } else {
        // Two sounds alike by `alike` (their correlation), in the shares w
        // and 1 - w, have the power w^2 + (1 - w)^2 + 2 alike w (1 - w) of
        // one of them: the gain puts that back to 1. Alike, the fade is the
        // plain one; not alike at all, it is the equal-power one.
        const float t = landing.splice;
        const float w = t * t * (3.0f - 2.0f * t);
        landing.weight = w;
        landing.norm = 1.0f / std::sqrt(1.0f - 2.0f * w * (1.0f - w) * (1.0f - landing.alike));
      }
    } else if (landing.rate > 0.0f && landing.half >= 1.0f && landing.pos >= landing.half) {
      go_back(landing);
    }
  }

  // How alike the sound behind two places in the ring is: the correlation of
  // `points` samples `spacing` apart, counted back from `here` and from `there`.
  float likeness(int here, int there, int points, int spacing) const {
    float both = 0.0f, first = 0.0f, second = 0.0f;
    for (int j = 0; j < points; ++j) {
      const float a = ring_.read(here + j * spacing);
      const float b = ring_.read(there + j * spacing);
      both += a * b;
      first += a * a;
      second += b * b;
    }
    const float scale = first * second;
    return scale > 1.0e-30f ? both / std::sqrt(scale) : 0.0f;
  }

  // The head of a dropped landing has fallen half a window behind: it goes
  // back by a window, or by up to a `reach` less, to wherever in that stretch
  // the sound behind it is most like the sound behind where it is now.
  void go_back(Landing& landing) {
    const int here = landing.delay + static_cast<int>(landing.pos);
    int longest = static_cast<int>(2.0f * landing.half + 0.5f);
    if (longest > here - 2) longest = here - 2;
    if (longest < 1) longest = 1;
    const int reach = static_cast<int>(kit::min(2.0f * kSearchSeconds * sample_rate(), landing.half));
    const int shortest = kit::clamp_int(longest - reach, 1, longest);
    const int coarse = 4 * stride_;
    const int fine = stride_ > 1 ? stride_ / 2 : 1;
    int best = longest;
    float most = -2.0f;
    for (int lag = shortest; lag <= longest; lag += coarse) {
      const float alike = likeness(here, here - lag, kComparePoints / 2, 2 * stride_);
      if (alike > most) {
        most = alike;
        best = lag;
      }
    }
    const int from = kit::clamp_int(best - coarse, shortest, longest);
    const int to = kit::clamp_int(best + coarse, shortest, longest);
    most = -2.0f;
    for (int lag = from; lag <= to; lag += fine) {
      const float alike = likeness(here, here - lag, kComparePoints, stride_);
      if (alike > most) {
        most = alike;
        best = lag;
      }
    }
    landing.from = landing.pos;
    landing.pos -= static_cast<float>(best);
    start_splice(landing, most);
  }

  // Drop has been turned off under a head that is away from its landing's
  // own time: it goes there, and the landing is the plain tap from then on.
  void go_home(Landing& landing) {
    const int here = landing.delay + static_cast<int>(landing.pos);
    const float alike = likeness(kit::clamp_int(here, 2, kRingSize - 16384), landing.delay, kComparePoints, stride_);
    landing.from = landing.pos;
    landing.pos = 0.0f;
    start_splice(landing, alike);
  }

  void start_splice(Landing& landing, float alike) {
    landing.alike = kit::clamp(alike, 0.0f, 1.0f);
    landing.splice = 0.0f;
    landing.weight = 0.0f;
    landing.norm = 1.0f;
  }

  // What the knobs ask of every landing.
  void retarget() {
    using namespace skipping_stone;
    const float sr = sample_rate();
    float seconds[kMaxLandings];
    const int skips = kit::clamp_int(static_cast<int>(param(kSkips) + 0.5f), 1, kMaxLandings);
    // Never none: `seconds[count - 1]` below is read whatever First is.
    const int count = kit::clamp_int(landings(param(kFirst), param(kBounce), skips, seconds), 1, kMaxLandings);
    const float loss = kit::db_to_gain(-param(kLoss));
    const float sharp = 1.0f - param(kRipple);
    const float flight = seconds[count - 1] - seconds[0];
    const float again = param(kAgain);
    float gain = level(param(kLoss), count, again);
    float kept = 1.0f;
    for (int k = 0; k < kMaxLandings; ++k) {
      Landing& landing = landings_[k];
      const float skipped = static_cast<float>(k);
      landing.wanted = kit::clamp_int(
          static_cast<int>(kit::min(seconds[k], kMaxThrowSeconds) * sr + 0.5f), 2, kRingSize - 16384);
      float* target = landing.target;
      if (k < count) {
        // Where the stone is when it lands: it crosses at a steady speed.
        const float across = flight > 0.0f ? 2.0f * (seconds[k] - seconds[0]) / flight - 1.0f : 0.0f;
        float left, right;
        kit::pan_gains(param(kThrow) * across, &left, &right);
        const float direct = gain * std::sqrt(kept);
        const float rings = gain * std::sqrt(1.0f - kept);
        target[kDirectLeft] = direct * left;
        target[kDirectRight] = direct * right;
        target[kSendLeft] = rings * left;
        target[kSendRight] = rings * right;
        target[kBack] = k == count - 1 ? again : 0.0f;
      } else {
        for (int j = 0; j < kNumRamps; ++j) target[j] = 0.0f;
      }
      gain *= loss;
      kept *= sharp;

      landing.pole_target = sink_pole(kOpenHz * std::exp2(-param(kSink) * kSinkOctaves * skipped), sr);

      const float cents = kit::min(param(kDrop) * skipped, kMaxDropCents);
      landing.rate = 1.0f - std::exp2(-cents * (1.0f / 1200.0f));
      // The window: as long as the head falls behind in 1 / kSpliceHz seconds,
      // within its two limits, and never so long that the head would get
      // ahead of the sound.
      const float room = 2.0f * static_cast<float>(landing.wanted - kHeadRoom);
      const float window = kit::clamp(landing.rate * sr / kSpliceHz, kMinWindowSeconds * sr, kMaxWindowSeconds * sr);
      landing.half = landing.rate > 0.0f ? 0.5f * kit::max(0.0f, kit::min(window, room)) : 0.0f;
    }
    // How fast the level thrown in is forgotten: by half in the length of a
    // throw and its rest, or, where a throw thrown again loses less than
    // that, as slowly as the loop itself dies away.
    const float keeps = kit::max(0.5f, again * again);
    held_decay_ = std::exp(std::log(keeps) / ((seconds[count - 1] + kHoldRestSeconds) * sr));
  }

  // Every kControlPeriod samples while a knob is on its way: the next stretch
  // of every ramp, a fade to the landings' new places when one is due, and
  // how long silence must last.
  void control() {
    if (dirty_) {
      retarget();
      dirty_ = false;
    }
    const float per_sample = 1.0f / static_cast<float>(kControlPeriod);
    bool ramping = false;
    bool moved = false;
    bool arriving = false;
    int run = 0;
    int reach = 0;
    for (int k = 0; k < kMaxLandings; ++k) {
      Landing& landing = landings_[k];
      bool sounds = false;
      for (int j = 0; j < kNumRamps; ++j) {
        landing.now[j] = landing.goal[j];
        const float target = landing.target[j];
        float goal = landing.goal[j];
        if (goal != target) {
          goal += (target - goal) * gain_coeff_;
          const float left = target - goal;
          const float near = 1.0e-5f * (target < 0.0f ? -target : target) + 1.0e-7f;
          if (left > -near && left < near) goal = target;
          landing.goal[j] = goal;
          arriving = true;
        }
        landing.step[j] = (goal - landing.now[j]) * per_sample;
        if (landing.step[j] != 0.0f) ramping = true;
        if (goal != 0.0f || landing.now[j] != 0.0f) sounds = true;
      }
      if (landing.pole != landing.pole_target) {
        landing.pole += (landing.pole_target - landing.pole) * gain_coeff_;
        const float left = landing.pole_target - landing.pole;
        if (left > -1.0e-6f && left < 1.0e-6f) landing.pole = landing.pole_target;
        arriving = true;
      }
      // Drop: a landing that is to be read slower gets a head; one that is
      // not any more sends its head home, and is the plain tap once it is there.
      if (landing.rate > 0.0f) {
        landing.dropped = true;
      } else if (landing.dropped) {
        if (!sounds || (landing.splice >= 1.0f && landing.pos == 0.0f)) {
          // Home, or not heard (and so not moved on): the plain tap at once.
          landing.dropped = false;
          landing.pos = 0.0f;
          landing.splice = 1.0f;
        } else {
          if (landing.splice >= 1.0f) go_home(landing);
          arriving = true;
        }
      }
      if (sounds) {
        run = k + 1;
        if (landing.delay > reach) reach = landing.delay;
        if (landing.next > reach) reach = landing.next;
        if (landing.wanted > reach) reach = landing.wanted;
      }
      if (landing.wanted != landing.delay) moved = true;
    }
    ramping_ = ramping;
    run_ = run;
    if (moved && !fading_) {
      for (Landing& landing : landings_) landing.next = landing.wanted;
      fading_ = true;
      fade_ = 0.0f;
    }
    // Sound written now is last heard when the longest landing plays it; the
    // rings and a Drop head ring on a little after.
    hold_ = static_cast<long>(reach) + rest_;
    // With every ramp at its end and every landing in its place there is
    // nothing to do here until a knob moves.
    settled_ = !ramping && !arriving && !moved && !fading_;
  }

  // Every kControlPeriod samples: the two holds. A loop adds a held sound up,
  // and landings that come in step add up too (a held tone through an even
  // throw is a comb): either way the skips could come out many times louder
  // than the sound went in. So the level thrown in is remembered (`held_`),
  // and what Again throws back is turned down to kLoopCeiling times that,
  // the skips on their louder side to kWetCeiling times that, for as long as
  // they are over it. A throw of sound with gaps in it stays under both by itself
  // (its landings share the power of what was thrown), so it is not touched.
  void hold() {
    const float per_sample = 1.0f / static_cast<float>(kControlPeriod);
    {
      const float most = held_ * kLoopCeiling;
      const float want = back_level_ > most && back_level_ > kQuietPower ? std::sqrt(most / back_level_) : 1.0f;
      back_hold_ = back_hold_goal_;
      back_hold_goal_ = toward(back_hold_goal_, want);
      back_hold_step_ = (back_hold_goal_ - back_hold_) * per_sample;
    }
    {
      const float most = held_ * kWetCeiling;
      const float level = kit::max(wet_level_[0], wet_level_[1]);
      const float want = level > most && level > kQuietPower ? std::sqrt(most / level) : 1.0f;
      wet_hold_ = wet_hold_goal_;
      wet_hold_goal_ = toward(wet_hold_goal_, want);
      wet_hold_step_ = (wet_hold_goal_ - wet_hold_) * per_sample;
    }
  }

  // A hold's gain one control period on: it closes fast and opens slowly.
  float toward(float gain, float want) const {
    gain += (want - gain) * (want < gain ? hold_attack_ : hold_release_);
    const float left = want - gain;
    return left > -1.0e-6f && left < 1.0e-6f ? want : gain;
  }

  // Everything where the knobs say, nothing in flight (init and wake).
  void restart() {
    ring_.forget();
    retarget();
    dirty_ = false;
    for (int k = 0; k < kMaxLandings; ++k) {
      Landing& landing = landings_[k];
      landing.delay = landing.wanted;
      landing.next = landing.wanted;
      for (int j = 0; j < kNumRamps; ++j) {
        landing.now[j] = landing.target[j];
        landing.goal[j] = landing.target[j];
        landing.step[j] = 0.0f;
      }
      landing.pole = landing.pole_target;
      landing.low[0] = 0.0f;
      landing.low[1] = 0.0f;
      // Every head on its landing's own time.
      landing.dropped = landing.rate > 0.0f;
      landing.pos = 0.0f;
      landing.from = 0.0f;
      landing.splice = 1.0f;
      landing.weight = 1.0f;
      landing.alike = 0.0f;
      landing.norm = 1.0f;
    }
    for (int side = 0; side < 2; ++side) {
      for (int stage = 0; stage < kRings; ++stage) rings_[side][stage].clear();
      sent_[side] = 0.0f;
    }
    fading_ = false;
    fade_ = 0.0f;
    ramping_ = false;
    run_ = 0;
    clock_.reset(kControlPeriod);
    mix_.snap(param(skipping_stone::kMix));
    mix_seen_ = -1.0f;
    quiet_ = 0;
    stale_ = 0;
    hold_ = 1;
    rest_ = static_cast<long>(0.25f * sample_rate());
    settled_ = false;
    in_level_ = 0.0f;
    held_ = 0.0f;
    back_level_ = 0.0f;
    wet_level_[0] = 0.0f;
    wet_level_[1] = 0.0f;
    loop_low_ = 0.0f;
    back_hold_ = 1.0f;
    back_hold_goal_ = 1.0f;
    back_hold_step_ = 0.0f;
    wet_hold_ = 1.0f;
    wet_hold_goal_ = 1.0f;
    wet_hold_step_ = 0.0f;
    level_now_ = 0.0f;
    level_before_ = 0.0f;
    level_count_ = 0;
  }

  Ring ring_;
  kit::AllpassDelay<kRingLine> rings_[2][kRings];
  int ring_delay_[2][kRings] = {};
  float sent_[2] = {0.0f, 0.0f};
  Landing landings_[kMaxLandings];
  kit::Smoother mix_;
  kit::ControlClock clock_;
  float gain_coeff_ = 1.0f;
  float fade_step_ = 1.0f;
  float splice_step_ = 1.0f;
  int stride_ = 4;
  float fade_ = 0.0f;
  bool fading_ = false;
  bool ramping_ = false;
  bool dirty_ = false;
  int run_ = 0;
  float mix_seen_ = -1.0f, dry_gain_ = 1.0f, wet_gain_ = 0.0f;
  bool settled_ = false;
  // The hold: the mean squares of what is thrown in, of what Again throws
  // back and of the skips on each side, the level thrown in at its highest and
  // how fast that is forgotten, the low end taken out of the loop, and the
  // two gains with their ramps.
  float level_coeff_ = 1.0f;
  float low_coeff_ = 0.0f;
  float hold_attack_ = 1.0f;
  float hold_release_ = 1.0f;
  float in_level_ = 0.0f;
  float held_ = 0.0f;
  float held_decay_ = 1.0f;
  float back_level_ = 0.0f;
  float wet_level_[2] = {0.0f, 0.0f};
  float loop_low_ = 0.0f;
  float back_hold_ = 1.0f, back_hold_goal_ = 1.0f, back_hold_step_ = 0.0f;
  float wet_hold_ = 1.0f, wet_hold_goal_ = 1.0f, wet_hold_step_ = 0.0f;
  long quiet_ = 0;
  long stale_ = 0;
  long hold_ = 1;
  long rest_ = 1;
  bool asleep_ = true;
  // For meter() only: never read by the sound.
  float level_now_ = 0.0f;
  float level_before_ = 0.0f;
  int level_count_ = 0;
  int level_span_ = 1;
  long long ran_ = 0;
};

}  // namespace livemix
