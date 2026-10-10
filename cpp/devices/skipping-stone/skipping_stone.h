#pragma once

// Skipping Stone: echoes that land the way a stone skips over water.
//
//   in ─┬──────────────────────────────────────────────────────────► dry ──┐
//       └─ L+R ─(+)─► soft limit ─► ring ─► landing 1 ─► sink ─┬─ pan ──► (+)─► wet ─┴─► out
//                ▲                     ├──► landing 2 ─► sink ─┤           ▲
//                │                     ├──► ...                ├─ ripple ─► rings (allpasses)
//                │                     └──► landing n ─► sink ─┘
//                └────────── Again ◄── the last landing, before Loss
//
// - The landings. The first comes First after the sound. Every gap after it
//   is Bounce times the gap before, so under 1 they close up and over 1 they
//   spread out: landing k is First x (1 + Bounce + ... + Bounce^(k-1)) late.
//   The throw ends after Skips landings, or sooner: when a gap gets shorter
//   than 2 ms the stone has sunk, and one that would land more than 20 s
//   late is out of sight.
// - Each landing is softer than the one before by Loss, duller by Sink (two
//   one-pole low-passes whose corner falls 0.6 of an octave a skip at full
//   Sink, and stands open at 20 kHz for the first), and lower by Drop. It
//   sits across the stereo field where the stone is at that moment: Throw
//   carries it from one side to the other at a steady speed, so landings
//   that crowd in time crowd in space.
// - Ripple turns a share of every landing into rings: a share Ripple of what
//   is still sharp at each skip goes to five allpasses a side (unity gain,
//   so the landing keeps its energy and only its outline spreads). The first
//   landing is always sharp.
// - Drop reads a landing through two heads that slide back through a short
//   window and cross-fade (a delay-line pitch shifter on the ring itself, no
//   storage of its own). The window is as long as a head slides in four
//   seconds, 60 ms at most: a few cents of Drop move a landing by a few
//   milliseconds and cross-fade every two seconds, and with none the read is
//   the plain tap. A steady tone dips where two heads cross out of phase, as
//   it does in every shifter of this kind.
// - Again throws the stone again from where it stopped: the last landing,
//   as dull and as low as it has become but before its Loss, goes back into
//   the ring at that gain. It is under 1, and the ring is written through a
//   limiter that is exactly linear below -6 dBFS.
// - Landing times are whole samples. When First, Bounce or Skips move, every
//   landing cross-fades from where it was to where it is to be (30 ms),
//   so nothing bends in pitch. Gains ramp over 5 ms.
// - Asleep the device forgets the ring. It falls asleep and wakes on a
//   sample, not on a block: once nothing has gone in, nothing has been
//   written to the ring for as long as the longest landing takes, and the
//   landings and their rings have been silent for a quarter second. On
//   waking every control stands where its knob is and the Drop heads start
//   again from the same places.
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
  // Sink: the corner of the first landing's low-passes, and how many octaves
  // it falls per skip with Sink at 1.
  static constexpr float kOpenHz = 20000.0f;
  static constexpr float kSinkOctaves = 0.6f;
  // Drop: no landing is read slower than this many cents down, a head slides
  // through its window once in 1 / kSpliceHz seconds where the window has
  // room for that, and the window is never longer than kMaxWindowSeconds.
  // The heads cross-fade on a smoothstep of a triangle (see read).
  static constexpr float kMaxDropCents = 3600.0f;
  static constexpr float kSpliceHz = 0.25f;
  static constexpr float kMaxWindowSeconds = 0.06f;
  // How long a landing takes to cross-fade to a new place.
  static constexpr float kFadeSeconds = 0.03f;
  // The rings: allpass gain, and the delays of the five a side in milliseconds.
  static constexpr int kRings = 5;
  static constexpr float kRingGain = 0.62f;
  static constexpr float kRingMs[2][kRings] = {{5.3f, 8.9f, 14.3f, 22.7f, 35.1f},
                                               {6.1f, 9.7f, 13.1f, 24.1f, 33.3f}};
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
    gain_coeff_ = 1.0f - std::exp(-static_cast<float>(kControlPeriod) / (kSmoothingSeconds * sr));
    window_coeff_ = 1.0f - std::exp(-static_cast<float>(kControlPeriod) / (kWindowLagSeconds * sr));
    fade_step_ = 1.0f / kit::max(1.0f, kFadeSeconds * sr);
    open_pole_ = std::exp(-kit::kTwoPi * kit::min(kOpenHz, 0.45f * sr) / sr);
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
      if (clock_.tick()) control();

      // What the ring is given: the two sides as one. A sample that is not a
      // number is left out (the limiter below takes care of one that is huge).
      float mono = 0.5f * (in[0] + in[1]);
      if (!(mono == mono)) mono = 0.0f;

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
        landing.phase += landing.phase_step;
        if (landing.phase >= 1.0f) landing.phase -= 1.0f;
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
  // How slowly a Drop window changes its length: fast enough to follow the
  // knob, slow enough that the heads do not race through the sound.
  static constexpr float kWindowLagSeconds = 0.06f;
  // Under this many samples of window a landing is read as a plain tap.
  static constexpr float kPlainWindow = 0.01f;
  // Under this what is written to the ring is not worth staying awake for:
  // sixteen landings of it together are under the idle floor.
  static constexpr float kWriteFloor = 5.0e-9f;
  static constexpr float kGolden = 0.61803399f;

  enum Ramp : int { kDirectLeft = 0, kDirectRight, kSendLeft, kSendRight, kBack, kWindow, kNumRamps };

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
    float read_hermite(float delay) const {
      const int whole = static_cast<int>(delay);
      if (whole + 2 > held_) return whole <= held_ ? buffer_[(write_ - whole) & kMask] : 0.0f;
      const float fraction = delay - static_cast<float>(whole);
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
    // The gains and the Drop window as they are now, their step per sample,
    // where the ramp of this control period ends and what the knobs ask for.
    float now[kNumRamps] = {};
    float step[kNumRamps] = {};
    float goal[kNumRamps] = {};
    float target[kNumRamps] = {};
    // Sink: the pole of the two low-passes, what the knobs ask for, and their states.
    float pole = 0.0f;
    float pole_target = 0.0f;
    float low[2] = {0.0f, 0.0f};
    // Drop: the speed it is read at, where the first head is in its window and how fast it moves.
    float ratio = 1.0f;
    float phase = 0.0f;
    float phase_step = 0.0f;
  };

  // One landing's sample at `delay`: the plain tap, or with Drop two heads
  // half a window apart, each loudest where it crosses the landing's own time.
  float read(const Landing& landing, int delay) const {
    const float window = landing.now[kWindow];
    if (window < kPlainWindow) return ring_.read(delay);
    const float first = landing.phase;
    const float second = first >= 0.5f ? first - 0.5f : first + 0.5f;
    const float base = static_cast<float>(delay);
    const float a = ring_.read_hermite(kit::max(2.0f, base + (first - 0.5f) * window));
    const float b = ring_.read_hermite(kit::max(2.0f, base + (second - 0.5f) * window));
    // The first head is loudest in the middle of its window, where it reads
    // the landing's own time; the second has what is left of 1.
    const float rise = first < 0.5f ? 2.0f * first : 2.0f - 2.0f * first;
    const float gain = rise * rise * (3.0f - 2.0f * rise);
    return b + (a - b) * gain;
  }

  // What the knobs ask of every landing.
  void retarget() {
    using namespace skipping_stone;
    const float sr = sample_rate();
    float seconds[kMaxLandings];
    const int skips = kit::clamp_int(static_cast<int>(param(kSkips) + 0.5f), 1, kMaxLandings);
    const int count = landings(param(kFirst), param(kBounce), skips, seconds);
    const float loss = kit::db_to_gain(-param(kLoss));
    const float sharp = 1.0f - param(kRipple);
    const float flight = seconds[count - 1] - seconds[0];
    float gain = 1.0f;
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
        target[kBack] = k == count - 1 ? param(kAgain) : 0.0f;
      } else {
        for (int j = 0; j < kWindow; ++j) target[j] = 0.0f;
      }
      gain *= loss;
      kept *= sharp;

      const float corner = kit::min(kOpenHz, 0.45f * sr) * std::exp2(-param(kSink) * kSinkOctaves * skipped);
      landing.pole_target = kit::clamp(
          (std::exp(-kit::kTwoPi * corner / sr) - open_pole_) / (1.0f - open_pole_), 0.0f, 0.99995f);

      const float cents = kit::min(param(kDrop) * skipped, kMaxDropCents);
      landing.ratio = std::exp2(-cents * (1.0f / 1200.0f));
      const float room = 2.0f * static_cast<float>(landing.wanted - 8);
      target[kWindow] = kit::max(
          0.0f, kit::min(kit::min((1.0f - landing.ratio) * sr / kSpliceHz, kMaxWindowSeconds * sr), room));
    }
  }

  // Every kControlPeriod samples: the next stretch of every ramp, a fade to
  // the landings' new places when one is due, and how long silence must last.
  void control() {
    if (dirty_) {
      retarget();
      dirty_ = false;
    } else if (settled_) {
      return;
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
          goal += (target - goal) * (j == kWindow ? window_coeff_ : gain_coeff_);
          const float left = target - goal;
          const float near = 1.0e-5f * (target < 0.0f ? -target : target) + 1.0e-7f;
          if (left > -near && left < near) goal = target;
          landing.goal[j] = goal;
          arriving = true;
        }
        landing.step[j] = (goal - landing.now[j]) * per_sample;
        if (landing.step[j] != 0.0f) ramping = true;
        if (j != kWindow && (goal != 0.0f || landing.now[j] != 0.0f)) sounds = true;
      }
      if (landing.pole != landing.pole_target) {
        landing.pole += (landing.pole_target - landing.pole) * gain_coeff_;
        const float left = landing.pole_target - landing.pole;
        if (left > -1.0e-6f && left < 1.0e-6f) landing.pole = landing.pole_target;
        arriving = true;
      }
      const float window = landing.goal[kWindow];
      landing.phase_step =
          window >= kPlainWindow ? (1.0f - landing.ratio) / window : kSpliceHz / sample_rate();
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
    // rings and the Drop window ring on a little after.
    hold_ = static_cast<long>(reach) + rest_;
    // With every ramp at its end and every landing in its place there is
    // nothing to do here until a knob moves.
    settled_ = !ramping && !arriving && !moved && !fading_;
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
      // The heads of the landings start apart, so they do not all splice at once.
      const float turn = kGolden * static_cast<float>(k);
      landing.phase = turn - std::floor(turn);
      landing.phase_step = 0.0f;
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
  float window_coeff_ = 1.0f;
  float fade_step_ = 1.0f;
  float open_pole_ = 0.0f;
  float fade_ = 0.0f;
  bool fading_ = false;
  bool ramping_ = false;
  bool dirty_ = false;
  int run_ = 0;
  float mix_seen_ = -1.0f, dry_gain_ = 1.0f, wet_gain_ = 0.0f;
  bool settled_ = false;
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
