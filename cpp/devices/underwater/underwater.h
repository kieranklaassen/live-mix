#pragma once

// Underwater: what a sound is like heard from under water. Depth is the one
// knob; the others say how much of each thing the water does.
//
//   in ─► waver ─┬─► light ─► absorb ─┬─► body ─► squeeze ─(+)─► close in ─► mix ─► out
//                │                    │                    ▲                 ▲
//                ├─► attacks ─► bubbles ───────────────────┘                 │
//                                     └──────────────────────────────────────┘
//
// - Waver: a delay swung by the surface, a swell at Swell Hz and a ripple at
//   0.382 of it (3 : 1 in size). The swing is sized so the pitch bends by at
//   most 45 cents either way at full Waver whatever the rate, down to 0.14 Hz;
//   under that the swing stops at 35 ms and the bend is gentler. The right
//   side rides the same surface up to 23 ms later (Width), which puts the two
//   sides up to 0.6 ms apart: the sound leans a little one way, then the other.
//   It stands first, and what Mix calls dry is taken after it: the dry sound
//   rides the same surface as the wet one, as high as Mix lets the water be
//   heard, so part-way Mix is a blend of two sounds in step and never a comb.
//   A thrown knob (Waver, Swell, Depth through the surface, Mix) moves the
//   swing only as fast as keeps the pitch within those 45 cents, and the
//   surface does not speed up before the swing has come down to suit.
// - Light (Surface): the top end, above a one-pole split at 2.2 kHz, flickers
//   in level with three free sines (7.3, 11.9 and 17.3 Hz), out of step
//   between the two sides. It stands before the absorption, so the water
//   itself takes it away as the sound goes deep.
// - Absorb: a fourth-order Butterworth low-pass whose corner falls with Depth
//   from 16 kHz to 300 Hz, faded in over the first tenth of Depth (the sound
//   going through the surface). Mix makes the water shallower instead of
//   blending the dry sound back over it: the corner stands where Depth times
//   Mix puts it. A blend of a sound with its own fourth-order low-pass has a
//   hole at the corner, where the two are half a turn apart (17 dB deep at
//   half Mix, a null at 0.57), and a hole that moves when Depth does.
// - Body: a broad resonance (Q 1.6) added on top, at 520 Hz just under the
//   surface and 250 Hz at the bottom. At full Body and Depth the hump stands
//   12 dB over what is around it, and the whole is trimmed 5.6 dB so it is a
//   colour and not a gain.
// - Squeeze (Pressure): gain that follows the level's peak, held for 40 ms
//   and then let go over 150 ms, 2 : 1 over -34 dBFS at full Pressure and
//   Depth, made up so a level of -15 dBFS stays where it was. The hold keeps
//   the gain still through a low note's cycle, so the squeeze does not bend
//   the wave; a leap in level is followed at once (no attack gets through
//   more than a quarter of a dB louder).
// - Attacks: the sound in three bands (under 600 Hz, to 2.4 kHz, over it). In
//   each a follower is held against the highest it has lately been (its
//   ceiling, held 120 ms and then let fall); a jump over the ceiling is an
//   attack. What repeats (the pulses of a low note, a beat, a tremolo, the
//   surges of steady noise) stays under its own ceiling, and a soft note over
//   a held sound still jumps in the band where the held sound is weak.
// - Bubbles: an attack sends up a count of bubbles set by Bubbles. Each is a
//   sine that swells in over three cycles and dies away over twelve while its
//   pitch climbs, high and quick for a small bubble, low and slow for a large
//   one; the later ones of a flight are higher. They are as loud as the note
//   that sent them is heard in the water (what the attack added to the wet
//   sound, not to the dry one), and the squeeze holds them as it holds the
//   note, so a flight stays under its note at any Depth. They are not
//   absorbed: they are in the water with the listener.
// - Close in: the side signal is turned down with Depth, as far as Width
//   allows.
//
// Everything is scaled by Depth so that Depth 0 is the input, sample for
// sample, wherever the other knobs stand; so is Mix 0, once the swing has
// come down. Mix is a linear crossfade from the sound with only its highs
// taken (as far as Mix lets the water be heard: at Mix 0 that is the input)
// to the whole of the water: the two are one sound, in step at every
// frequency, so part way nothing cancels.
//
// Storage: two delay lines of 16,384 samples (2 x 35 ms at 192 kHz and the
// interpolator's margin), 128 kB; no heap. No latency is reported: the
// waver's delay is the effect.
//
// The surface runs freely, also while the device sleeps: its phases are
// counted in whole steps per sample, so they stand at the same place whatever
// the block size. Sound arriving after 3.5 s of silent input finds the filters
// and followers cleared and every knob where it was last put: the device may
// have slept in that silence or not, which depends on the block size, and
// either way the next note is the same.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Underwater : public kit::DeviceBase<underwater::kNumParams> {
 public:
  void init(float sample_rate) {
    using namespace underwater;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (int c = 0; c < 2; ++c) line_[c].clear();
    depth_.set_time(kSmoothingSeconds, sr);
    surface_.set_time(kSmoothingSeconds, sr);
    resonance_.set_time(kSmoothingSeconds, sr);
    pressure_.set_time(kSmoothingSeconds, sr);
    width_.set_time(kSmoothingSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    for (int c = 0; c < 2; ++c) {
      split_[c].set_cutoff(kLightSplitHz, sr);
      band_low_[c].set(kBandLowHz, kit::kSqrtHalf, sr);
      band_high_[c].set(kBandHighHz, kit::kSqrtHalf, sr);
    }
    for (kit::Follower& follower : fast_) follower.set(kFollowRiseSeconds, kFollowFallSeconds, sr);
    ceiling_fall_ = kit::time_to_coeff(kCeilingFallSeconds, sr);
    ceiling_lag_ = kit::time_to_coeff(kCeilingLagSeconds, sr);
    ceiling_hold_samples_ = static_cast<int>(kCeilingHoldSeconds * sr);
    bed_coeff_ = kit::time_to_coeff(kBedSeconds, sr);
    release_ = kit::time_to_coeff(kSqueezeReleaseSeconds, sr);
    rise_ = kit::time_to_coeff(kSqueezeRiseSeconds, sr);
    squeeze_hold_samples_ = static_cast<int>(kSqueezeHoldSeconds * sr);
    window_samples_ = static_cast<int>(kWindowSeconds * sr);
    if (window_samples_ < 1) window_samples_ = 1;
    refractory_samples_ = static_cast<int>(kRefractorySeconds * sr);
    quiet_samples_ = static_cast<long>(kQuietSeconds * sr);
    silent_run_ = quiet_samples_;
    swell_phase_ = 0u;
    ripple_phase_ = 0u;
    swing_ = 0.0f;
    swing_target_ = 0.0f;
    for (int k = 0; k < kFlickers; ++k) {
      flicker_phase_[k] = 0u;
      flicker_inc_[k] = step_of(kFlickerHz[k], sr);
    }
    rng_.seed(0x5EA51DE5u);
    bubble_count_ = 0;
    last_pitch_ = 0.0f;
    squeeze_ = 1.0f;
    // Longer than the last bubble of a flight after its attack (under 2 s),
    // and than the 3.5 s after which arriving sound starts afresh.
    idle_.reset(sr, kHoldSeconds);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    restart();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // sin(2 pi phase) for a phase that may lie under nought (down to -1): the
  // right side reads the surface `late` cycles back, so its phase does.
  // kit::SineTable::lookup brings a phase into [0, 1) by taking its floor
  // off, and for a phase from -2^-25 up to nought that comes to 1 as a float:
  // it then reads the entry after the table's last. The turn added here is
  // the one the lookup adds, so every other phase gives the number it always
  // gave. Public for the harness.
  static float surface_sine(float phase) {
    return kit::SineTable::lookup(phase < 0.0f ? phase + 1.0f : phase);
  }

  // The readings named by "meters" in device.json, for the display: 0 and 1,
  // where the swell and the ripple are in their cycles (0..1); 2, how many
  // bubbles have started sounding (it wraps at 65,536); 3, the pitch the last
  // of them started at in Hz; 4, the share of its level the squeeze leaves the
  // sound before make-up (1 at rest); 5, the flicker of the light on the left
  // side now, -1..1 (0 with no Surface, out of the water or the mix, and asleep).
  float meter(int index) const {
    switch (index) {
      case 0:
        return turns(swell_phase_);
      case 1:
        return turns(ripple_phase_);
      case 2:
        return static_cast<float>(bubble_count_);
      case 3:
        return last_pitch_;
      case 4:
        return idle_.asleep() ? 1.0f : squeeze_;
      case 5:
        return idle_.asleep() ? 0.0f : glint_;
      default:
        return 0.0f;
    }
  }

  void process(int frames) {
    using namespace underwater;
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      // The surface keeps moving while nothing sounds, and the silence is counted.
      const uint32_t steps = static_cast<uint32_t>(frames);
      swell_phase_ += swell_inc_ * steps;
      ripple_phase_ += ripple_inc_ * steps;
      for (int k = 0; k < kFlickers; ++k) flicker_phase_[k] += flicker_inc_[k] * steps;
      silent_run_ += frames;
      if (silent_run_ > quiet_samples_) silent_run_ = quiet_samples_;
      silence_output(frames);
      return;
    }
    const float max_delay = kit::DelayLine<kLineSize>::max_delay() - 2.0f;
    float wet_peak = 0.0f;
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      // A NaN or an infinity would stay in the filters for good.
      in[0] = sane(in[0]);
      in[1] = sane(in[1]);
      if (in[0] == 0.0f && in[1] == 0.0f) {
        if (silent_run_ < quiet_samples_ && ++silent_run_ == quiet_samples_) hush();
      } else {
        if (silent_run_ >= quiet_samples_) restart();
        silent_run_ = 0;
      }

      const float depth = depth_.next();
      const float mix = mix_.next();
      if (depth != depth_seen_) derive(depth);
      // The water the sound is heard through is as deep as Mix lets it be.
      const float sunk = depth * mix;
      if (sunk != sunk_seen_) sink(sunk);
      const float under = immersion_;
      const float width = width_.next();
      for (int k = 0; k < kFlickers; ++k) flicker_phase_[k] += flicker_inc_[k];

      // The surface moves the sound in time, the right side a little later;
      // what Mix calls dry is taken here, after it.
      line_[0].write(in[0]);
      line_[1].write(in[1]);
      float dry[2] = {in[0], in[1]};
      if (swing_ > 0.0f || swing_target_ > 0.0f) {
        // The surface runs no faster than the swing it has lets it.
        float rate = rate_target_;
        if (swing_ > 0.0f) rate = kit::min(rate, kRoom * kBend * sample_rate() / (swing_ * kSteepness));
        if (rate != rate_now_) set_rate_now(rate);
        swell_phase_ += swell_step_;
        ripple_phase_ += ripple_step_;
        // How much later the right side rides it, in cycles of the swell: it
        // comes round to a new rate or Width slowly, or the right side would jump.
        const float late = rate * kStereoLagSeconds * param(kWidth);
        const float turn = kLateRoom * kBend / (kit::max(swing_, 1.0f) * kSteepness);
        late_ += kit::clamp(late - late_, -turn, turn);
        const float height[2] = {surface_height(0.0f), surface_height(late_)};
        if (!surface_live_) {
          surface_seen_[0] = height[0];
          surface_seen_[1] = height[1];
          surface_live_ = true;
        }
        // The swing moves towards where the knobs put it, as fast as leaves
        // the pitch within the bend of a full Waver on both sides.
        float least = -kMostStep, most = kMostStep;
        for (int c = 0; c < 2; ++c) {
          // What the surface itself moves the delay by this sample, and how
          // much of a step of the swing reaches the delay (none in a trough).
          const float moved = swing_ * (height[c] - surface_seen_[c]);
          const float reach = 1.0f / kit::max(1.0f + height[c], kLeastReach);
          least = kit::max(least, (-kBend - moved) * reach);
          most = kit::min(most, (kBend - moved) * reach);
          surface_seen_[c] = height[c];
        }
        if (least > 0.0f) least = 0.0f;
        if (most < 0.0f) most = 0.0f;
        swing_ += kit::clamp(swing_target_ - swing_, least, most);
        if (swing_ < 1.0e-6f && swing_target_ == 0.0f) swing_ = 0.0f;
        for (int c = 0; c < 2; ++c) {
          dry[c] = read(line_[c], kit::min(1.0f + swing_ * (1.0f + height[c]), max_delay));
        }
      } else {
        if (rate_now_ != rate_target_) set_rate_now(rate_target_);
        swell_phase_ += swell_step_;
        ripple_phase_ += ripple_step_;
        surface_live_ = false;
      }

      // Light on the water: the top end flickers.
      float x[2] = {dry[0], dry[1]};
      const float light = surface_.next() * under * mix;
      const float high[2] = {split_[0].highpass(dry[0]), split_[1].highpass(dry[1])};
      float glint = 0.0f;
      if (light > 0.0f) {
        glint = flicker(0);
        x[0] = dry[0] + light * glint * high[0];
        x[1] = dry[1] + light * flicker(1) * high[1];
      }
      glint_ = glint;

      // The water takes the highs, and its body rings. `water` is the sound
      // with only its highs taken: what Mix blends the rest of the water into.
      const float ring = kBodyGain * resonance_.next() * depth;
      const float trim = 1.0f / (1.0f + kBodyTrim * ring);
      float water[2];
      float wet[2];
      for (int c = 0; c < 2; ++c) {
        const float dark = absorb_b_[c].lowpass(absorb_a_[c].lowpass(x[c]));
        water[c] = x[c] + sunk_under_ * (dark - x[c]);
        wet[c] = (water[c] + ring * body_[c].bandpass(water[c])) * trim;
      }
      // What the sound is in the water before the squeeze: an attack's size is read from it.
      const float heard = 0.5f * (wet[0] * wet[0] + wet[1] * wet[1]);

      // The water squeezes: the level's peak, held and then let go.
      const float press = pressure_.next() * depth;
      const float left_size = wet[0] < 0.0f ? -wet[0] : wet[0];
      const float right_size = wet[1] < 0.0f ? -wet[1] : wet[1];
      const float size = left_size > right_size ? left_size : right_size;
      if (size >= level_) {
        // A peak a little over the last one is come up to over 5 ms; a leap is
        // followed at once, to within 6 % (a quarter of a dB at the output).
        level_ = kit::max(size * kSqueezeLeap, size + (level_ - size) * rise_);
        level_hold_ = squeeze_hold_samples_;
      } else if (level_hold_ > 0) {
        --level_hold_;
      } else {
        level_ = kit::max(size, flush_denormal(level_ * release_));
      }
      float held = 1.0f;
      float gain = 1.0f;
      if (press > 0.0f) {
        held = 1.0f - press * (1.0f - std::sqrt(kSqueezeThreshold /
                                                kit::max(level_, kSqueezeThreshold)));
        gain = held / (1.0f - press * (1.0f - kSqueezeReferenceRoot));
        wet[0] *= gain;
        wet[1] *= gain;
      }
      squeeze_ = held;

      // Attacks send up bubbles, held by the squeeze as the note is.
      listen(dry, heard);
      if (active_ > 0) {
        float air[2];
        rise(air);
        if (under > 0.0f) {
          wet[0] += under * gain * kit::soft_clip(air[0]);
          wet[1] += under * gain * kit::soft_clip(air[1]);
        }
      }

      // Left and right close in.
      const float close = 0.5f * depth * (1.0f - width) * (wet[0] - wet[1]);
      wet[0] -= close;
      wet[1] += close;

      out_left_[i] = water[0] + (wet[0] - water[0]) * mix;
      out_right_[i] = water[1] + (wet[1] - water[1]) * mix;
      const float a = wet[0] < 0.0f ? -wet[0] : wet[0];
      const float b = wet[1] < 0.0f ? -wet[1] : wet[1];
      if (a > wet_peak) wet_peak = a;
      if (b > wet_peak) wet_peak = b;
    }
    // The wet path counts too: at Mix 0 the bubbles still rise out of earshot.
    idle_.settle(kit::max(output_peak(frames), wet_peak), frames);
  }

 private:
  // The delay swings up to twice kMaxSwingSeconds: 13,440 samples at 192 kHz.
  // A line of 8,192 held it up to 96 kHz; at 176.4 and 192 kHz a slow swell
  // ran into the line's end and the delay stood still there.
  static constexpr int kLineSize = 16384;
  static constexpr int kVoices = 24;
  static constexpr int kFlickers = 3;

  // Absorption: the corner at Depth 0 and at Depth 1, and how much of Depth
  // it takes to go under.
  static constexpr float kTopHz = 16000.0f;
  static constexpr float kDeepHz = 300.0f;
  static constexpr float kSurfaceDepth = 0.1f;
  static constexpr float kButterworthQ[2] = {0.54119610f, 1.30656296f};
  // The body of water: where it rings just under the surface and at the
  // bottom, how broad, how much it adds at full Body and Depth (the hump
  // stands 12 dB over what is around it), and how much of that is taken off
  // the whole so the sound does not simply get louder (5.6 dB at the most).
  static constexpr float kBodyTopHz = 520.0f;
  static constexpr float kBodyDeepHz = 250.0f;
  static constexpr float kBodyQ = 1.6f;
  static constexpr float kBodyGain = 3.0f;
  static constexpr float kBodyTrim = 0.3f;
  // Light: the split, and the three rates of the flicker with their shares.
  static constexpr float kLightSplitHz = 2200.0f;
  static constexpr float kFlickerHz[kFlickers] = {7.3f, 11.9f, 17.3f};
  static constexpr float kFlickerShare[kFlickers] = {0.5f, 0.3f, 0.2f};
  static constexpr float kFlickerRightTurns[kFlickers] = {0.31f, 0.57f, 0.83f};
  // Waver: the ripple's rate and size against the swell's, the bend at full
  // Waver (45 cents), the longest half swing, how much later the right side
  // rides the surface at full Width (the bend times this is how far apart in
  // time the two sides get: 0.6 ms at the most, about what two ears are apart).
  static constexpr float kRippleRatio = 0.381966f;
  static constexpr float kSwellShare = 0.75f;
  static constexpr float kRippleShare = 0.25f;
  static constexpr float kBend = 0.026334f;
  static constexpr float kMaxSwingSeconds = 0.035f;
  static constexpr float kStereoLagSeconds = 0.023f;
  // The steepest the surface gets, per Hz of Swell (2 pi times the swell's
  // share and the ripple's at its rate); the least of a step of the swing
  // that is taken to reach the delay (in a trough the delay stands at nothing
  // whatever the swing); the most the swing moves in one sample; and the room
  // the surface's rate is given over what the swing allows, so a settled
  // swing never holds the rate a rounding under what Swell asks; and the
  // share of a full bend the right side's lateness may add while it changes.
  static constexpr float kSteepness = 6.2831853f * (kSwellShare + kRippleShare * kRippleRatio);
  static constexpr float kLeastReach = 0.25f;
  static constexpr float kRoom = 1.01f;
  static constexpr float kLateRoom = 0.1f;
  static constexpr float kMostStep = 4.0f * kBend;
  // Squeeze: -34 dBFS, and the level that keeps its place (-15 dBFS) as the
  // root of the threshold over it; how long a peak is held before it is let
  // go, and how a new peak is come up to (at once to within 6 %, the rest
  // over 5 ms, so the peaks of a low chord, no two alike, do not each step
  // the gain).
  static constexpr float kSqueezeThreshold = 0.02f;
  static constexpr float kSqueezeReferenceRoot = 0.33333333f;
  static constexpr float kSqueezeReleaseSeconds = 0.15f;
  static constexpr float kSqueezeHoldSeconds = 0.04f;
  static constexpr float kSqueezeRiseSeconds = 0.005f;
  static constexpr float kSqueezeLeap = 1.0f / 1.06f;
  // Attacks: the two splits between the three bands; each band's follower; how
  // long a band's ceiling is held, how fast it then falls, and how far behind
  // it the mark an attack must jump over rises; how far over (the low band
  // moves most on its own, so it must jump further) and the least a jump is;
  // how long the attack is measured and how soon the next may come; and the
  // time over which the sound before the attack is averaged.
  static constexpr int kBands = 3;
  static constexpr float kBandLowHz = 600.0f;
  static constexpr float kBandHighHz = 2400.0f;
  static constexpr float kFollowRiseSeconds = 0.002f;
  static constexpr float kFollowFallSeconds = 0.02f;
  static constexpr float kCeilingHoldSeconds = 0.12f;
  static constexpr float kCeilingFallSeconds = 0.4f;
  static constexpr float kCeilingLagSeconds = 0.015f;
  static constexpr float kJump[kBands] = {1.8f, 1.3f, 1.3f};
  static constexpr float kJumpFloor = 0.002f;
  static constexpr float kWindowSeconds = 0.008f;
  static constexpr float kRefractorySeconds = 0.05f;
  static constexpr float kBedSeconds = 0.06f;
  // Bubbles: the most one attack sends up, the pitch of a small and of a large
  // one, the spread of a flight in time (a small and a large one's time
  // constant; none later than three of them), how much higher the last of a
  // flight is than the first and how far each strays (octaves), the cycles a
  // bubble takes to die away by 1/e and how far its pitch climbs in that
  // time, the cycles it swells in over (and the least time), its level
  // against the attack's as heard in the water, the loudest attack that
  // counts and the softest that sends anything.
  static constexpr float kMostBubbles = 12.0f;
  static constexpr float kSmallHz = 2400.0f;
  static constexpr float kLargeHz = 420.0f;
  static constexpr float kFlightSmallSeconds = 0.07f;
  static constexpr float kFlightLargeSeconds = 0.27f;
  static constexpr float kFlightRiseOctaves = 0.8f;
  static constexpr float kStrayOctaves = 0.35f;
  static constexpr float kBubbleCycles = 12.0f;
  static constexpr float kChirp = 0.3f;
  static constexpr float kFadeInCycles = 3.0f;
  static constexpr float kFadeInSeconds = 0.002f;
  static constexpr float kBubbleGain = 0.5f;
  static constexpr float kMostAttack = 0.5f;
  static constexpr float kLeastAttack = 1.0e-4f;
  // Silence and sleep.
  static constexpr float kQuietSeconds = 3.5f;
  static constexpr float kHoldSeconds = 4.0f;
  static constexpr float kInputLimit = 16.0f;
  static constexpr float kPhaseSteps = 4294967296.0f;

  struct Bubble {
    bool active = false;
    int wait = 0;        // samples until it starts
    float phase = 0.0f;  // cycles
    float step = 0.0f;   // cycles per sample, climbing by `climb` each sample
    float climb = 0.0f;
    float level = 0.0f;  // dying away by `decay` each sample
    float decay = 0.0f;
    float fade = 0.0f;   // 0..1 over the swell in
    float fade_step = 0.0f;
    float left = 0.0f;
    float right = 0.0f;
    float hz = 0.0f;
  };

  static float sane(float x) {
    if (x > -kInputLimit && x < kInputLimit) return x;
    return x >= kInputLimit ? kInputLimit : (x <= -kInputLimit ? -kInputLimit : 0.0f);
  }

  static float turns(uint32_t phase) { return static_cast<float>(phase) * (1.0f / kPhaseSteps); }

  static uint32_t step_of(float hz, float sr) {
    return static_cast<uint32_t>(static_cast<double>(hz) / static_cast<double>(sr) * 4294967296.0);
  }

  // Hermite between samples; under two samples of delay the sample ahead of
  // the newest does not exist yet, and the newest stands in for it.
  static float read(const kit::DelayLine<kLineSize>& line, float delay) {
    const int whole = static_cast<int>(delay);
    const float fraction = delay - static_cast<float>(whole);
    const float y0 = line.read(whole);
    const float ym1 = whole >= 2 ? line.read(whole - 1) : y0;
    return kit::hermite(ym1, y0, line.read(whole + 1), line.read(whole + 2), fraction);
  }

  // Sound has arrived after a long silence: nothing of before is left to hear,
  // so the filters and followers start from nothing and every knob is where
  // it was last put. Decided on the count of silent samples, which is the
  // same whatever the block size and whether or not the device slept: asleep
  // nothing glides, awake it does, and the two must give the same next note.
  void restart() {
    for (int c = 0; c < 2; ++c) {
      split_[c].reset();
      band_low_[c].reset();
      band_high_[c].reset();
      absorb_a_[c].reset();
      absorb_b_[c].reset();
      body_[c].reset();
    }
    for (int band = 0; band < kBands; ++band) {
      fast_[band].reset();
      ceiling_[band] = 0.0f;
      mark_[band] = 0.0f;
      ceiling_hold_[band] = 0;
    }
    bed_ = 0.0f;
    level_ = 0.0f;
    level_hold_ = 0;
    squeeze_ = 1.0f;
    glint_ = 0.0f;
    window_ = 0;
    refractory_ = 0;
    window_sum_ = 0.0f;
    window_bed_ = 0.0f;
    for (Bubble& bubble : bubbles_) bubble.active = false;
    active_ = 0;
    depth_.snap(depth_.target);
    surface_.snap(surface_.target);
    resonance_.snap(resonance_.target);
    pressure_.snap(pressure_.target);
    width_.snap(width_.target);
    mix_.snap(mix_.target);
    hush();
    depth_seen_ = -1.0f;
    sunk_seen_ = -1.0f;
  }

  // Nothing has come in for so long that the line is empty: the swing and the
  // surface's rate are put where the knobs have them, out of earshot. From
  // here on the surface moves as it does while the device sleeps.
  void hush() {
    swing_ = swing_target_;
    late_ = rate_target_ * kStereoLagSeconds * param(underwater::kWidth);
    set_rate_now(rate_target_);
    surface_live_ = false;
  }

  void set_rate_now(float rate) {
    rate_now_ = rate;
    if (rate == rate_target_) {
      swell_step_ = swell_inc_;
      ripple_step_ = ripple_inc_;
    } else {
      swell_step_ = step_of(rate, sample_rate());
      ripple_step_ = step_of(rate * kRippleRatio, sample_rate());
    }
  }

  bool quiet() const { return silent_run_ >= quiet_samples_; }

  // How far under the surface the sound is, 0..1 over the first tenth of Depth.
  static float immersion(float depth) {
    const float t = kit::clamp(depth * (1.0f / kSurfaceDepth), 0.0f, 1.0f);
    return t * t * (3.0f - 2.0f * t);
  }

  // What follows from Depth: how far under, where the body rings.
  void derive(float depth) {
    depth_seen_ = depth;
    immersion_ = immersion(depth);
    body_[0].set(kBodyTopHz * std::pow(kBodyDeepHz / kBodyTopHz, depth), kBodyQ, sample_rate());
    copy(body_[0], &body_[1]);
  }

  // What follows from how deep the water heard is (Depth times Mix): how far
  // its low-pass is in, and the corner.
  void sink(float sunk) {
    sunk_seen_ = sunk;
    sunk_under_ = immersion(sunk);
    const float sr = sample_rate();
    const float corner = kTopHz * std::pow(kDeepHz / kTopHz, sunk);
    absorb_a_[0].set(corner, kButterworthQ[0], sr);
    absorb_b_[0].set(corner, kButterworthQ[1], sr);
    copy(absorb_a_[0], &absorb_a_[1]);
    copy(absorb_b_[0], &absorb_b_[1]);
  }

  static void copy(const kit::Svf& from, kit::Svf* to) {
    to->g = from.g;
    to->k = from.k;
    to->a1 = from.a1;
    to->a2 = from.a2;
    to->a3 = from.a3;
  }

  // The surface's height, -1..1, `late` cycles of the swell ago.
  float surface_height(float late) const {
    return kSwellShare * surface_sine(turns(swell_phase_) - late) +
           kRippleShare * surface_sine(turns(ripple_phase_) - late * kRippleRatio);
  }

  // The flicker of the light on one side, -1..1.
  float flicker(int side) const {
    float sum = 0.0f;
    for (int k = 0; k < kFlickers; ++k) {
      const float turn = turns(flicker_phase_[k]) + (side == 0 ? 0.0f : kFlickerRightTurns[k]);
      sum += kFlickerShare[k] * kit::SineTable::lookup(turn);
    }
    return sum;
  }

  // Half the swing of the delay in samples: sized so the steepest the surface
  // gets bends the pitch by kBend at full Waver, never past the line, and as
  // far as Mix lets the water be heard (the dry sound rides it too).
  void set_swing(bool ramp) {
    using namespace underwater;
    const float seconds = kit::min(kMaxSwingSeconds, kBend / (kSteepness * param(kRate)));
    swing_target_ = param(kWaver) * immersion(param(kDepth)) * param(kMix) * seconds * sample_rate();
    if (!ramp) hush();
  }

  // Follow the sound for attacks, and send bubbles up after one. `heard` is
  // the power of the sound in the water now: what an attack adds to it over
  // the window, against what was there before, is the size of the attack.
  void listen(const float* sound, float heard) {
    float level[kBands];
    for (int c = 0; c < 2; ++c) {
      band_low_[c].process(sound[c]);
      band_high_[c].process(band_low_[c].high);
    }
    level[0] = larger(band_low_[0].low, band_low_[1].low);
    level[1] = larger(band_high_[0].low, band_high_[1].low);
    level[2] = larger(band_high_[0].high, band_high_[1].high);
    bool jumped = false;
    for (int band = 0; band < kBands; ++band) {
      const float fast = fast_[band].process(level[band]);
      if (fast > kJump[band] * mark_[band] + kJumpFloor) jumped = true;
      // The ceiling: the highest the band has been, held and then let fall.
      if (fast >= ceiling_[band]) {
        ceiling_[band] = fast;
        ceiling_hold_[band] = ceiling_hold_samples_;
      } else if (ceiling_hold_[band] > 0) {
        --ceiling_hold_[band];
      } else {
        ceiling_[band] = kit::max(fast, flush_denormal(ceiling_[band] * ceiling_fall_));
      }
      // The mark to jump over: the ceiling, late on the way up and at once on the way down.
      mark_[band] = ceiling_[band] < mark_[band]
                        ? ceiling_[band]
                        : flush_denormal(ceiling_[band] + (mark_[band] - ceiling_[band]) * ceiling_lag_);
    }
    if (window_ > 0) {
      window_sum_ += heard;
      if (--window_ == 0) {
        const float added = window_sum_ / static_cast<float>(window_samples_) - window_bed_;
        send_up(added > 0.0f ? std::sqrt(2.0f * added) : 0.0f);
      }
    } else if (refractory_ > 0) {
      --refractory_;
    } else if (jumped) {
      window_ = window_samples_;
      refractory_ = refractory_samples_;
      window_sum_ = 0.0f;
      window_bed_ = bed_;
    }
    bed_ = flush_denormal(heard + (bed_ - heard) * bed_coeff_);
  }

  static float larger(float a, float b) {
    const float x = a < 0.0f ? -a : a;
    const float y = b < 0.0f ? -b : b;
    return x > y ? x : y;
  }

  // One attack's flight of bubbles: how many by Bubbles, how loud by the attack.
  void send_up(float attack) {
    using namespace underwater;
    const float amount = param(kBubbles);
    if (!(amount > 0.0f) || !(param(kDepth) > 0.0f) || !(attack > kLeastAttack)) return;
    int count = static_cast<int>(amount * kMostBubbles + 0.5f);
    if (count < 1) count = 1;
    const float sr = sample_rate();
    const float large = param(kBubbleSize);
    const float centre = kSmallHz * std::pow(kLargeHz / kSmallHz, large);
    const float flight = kit::lerp(kFlightSmallSeconds, kFlightLargeSeconds, large);
    const float strength = kBubbleGain * kit::min(attack, kMostAttack);
    for (int n = 0; n < count; ++n) {
      // Draw first, so a full pool does not change what the next attack draws.
      const float late = -std::log(1.0f - 0.95f * rng_.uniform());  // 0..3 time constants
      const float stray = rng_.bipolar();
      const float share = rng_.uniform();
      const float pan = rng_.bipolar();
      Bubble* bubble = nullptr;
      for (Bubble& candidate : bubbles_) {
        if (!candidate.active) {
          bubble = &candidate;
          break;
        }
      }
      if (bubble == nullptr) continue;
      const float octaves = kFlightRiseOctaves * late * (1.0f / 3.0f) + kStrayOctaves * stray;
      const float hz = kit::clamp(centre * std::exp2(octaves), 120.0f, 0.2f * sr);
      const float dying = kBubbleCycles / hz * sr;  // samples to 1/e
      bubble->active = true;
      bubble->wait = static_cast<int>(late * flight * sr);
      bubble->phase = 0.0f;
      bubble->step = hz / sr;
      bubble->climb = bubble->step * kChirp / dying;
      bubble->level = strength * (0.45f + 0.55f * share);
      bubble->decay = std::exp(-1.0f / dying);
      bubble->fade = 0.0f;
      bubble->fade_step = 1.0f / kit::max(1.0f, kit::max(kFadeInCycles / hz, kFadeInSeconds) * sr);
      kit::pan_gains(0.8f * pan, &bubble->left, &bubble->right);
      bubble->hz = hz;
      ++active_;
    }
  }

  // One sample of every bubble that is on its way or sounding.
  void rise(float* air) {
    float left = 0.0f;
    float right = 0.0f;
    for (Bubble& bubble : bubbles_) {
      if (!bubble.active) continue;
      if (bubble.wait > 0) {
        if (--bubble.wait == 0) {
          bubble_count_ = (bubble_count_ + 1) & 0xFFFF;
          last_pitch_ = bubble.hz;
        }
        continue;
      }
      if (bubble.fade < 1.0f) {
        bubble.fade += bubble.fade_step;
        if (bubble.fade > 1.0f) bubble.fade = 1.0f;
      }
      // It swells in on a soft edge: no corner at either end of the rise.
      const float swell = bubble.fade * bubble.fade * (3.0f - 2.0f * bubble.fade);
      const float sample = bubble.level * swell * kit::SineTable::lookup(bubble.phase);
      left += sample * bubble.left;
      right += sample * bubble.right;
      bubble.phase += bubble.step;
      if (bubble.phase >= 1.0f) bubble.phase -= 1.0f;
      if (bubble.step < 0.45f) bubble.step += bubble.climb;
      bubble.level *= bubble.decay;
      if (bubble.level < 1.0e-5f) {
        bubble.active = false;
        --active_;
      }
    }
    air[0] = left;
    air[1] = right;
  }

  void apply(int id) {
    using namespace underwater;
    // In a long silence there is nothing to glide under: the knob is there at once.
    const bool ramp = primed() && !quiet();
    const float value = param(id);
    switch (id) {
      case kDepth:
        depth_.set(value, ramp);
        set_swing(ramp);
        break;
      case kWaver:
        set_swing(ramp);
        break;
      case kRate:
        rate_target_ = value;
        swell_inc_ = step_of(value, sample_rate());
        ripple_inc_ = step_of(value * kRippleRatio, sample_rate());
        // The surface takes the new rate as the swing lets it (in process), at once when nothing sounds.
        set_swing(ramp);
        break;
      case kResonance:
        resonance_.set(value, ramp);
        break;
      case kSurface:
        surface_.set(value, ramp);
        break;
      case kPressure:
        pressure_.set(value, ramp);
        break;
      case kWidth:
        width_.set(value, ramp);
        if (!ramp) hush();
        break;
      case kMix:
        mix_.set(value, ramp);
        set_swing(ramp);
        break;
      default:
        break;  // Bubbles and Bubble Size are read when an attack sends a flight up
    }
  }

  kit::DelayLine<kLineSize> line_[2];
  kit::Svf absorb_a_[2], absorb_b_[2], body_[2];
  kit::Svf band_low_[2], band_high_[2];
  kit::OnePole split_[2];
  kit::Smoother depth_, surface_, resonance_, pressure_, width_, mix_;
  kit::Follower fast_[kBands];
  kit::Rng rng_;
  kit::IdleGate idle_;
  Bubble bubbles_[kVoices];
  // The surface: where the swell and the ripple are, their steps at the rate
  // Swell asks for and at the rate they run at now, and the swing.
  uint32_t swell_phase_ = 0u, ripple_phase_ = 0u, swell_inc_ = 0u, ripple_inc_ = 0u;
  uint32_t swell_step_ = 0u, ripple_step_ = 0u;
  uint32_t flicker_phase_[kFlickers] = {0u, 0u, 0u};
  uint32_t flicker_inc_[kFlickers] = {0u, 0u, 0u};
  float rate_target_ = 0.3f, rate_now_ = 0.3f;
  float swing_ = 0.0f, swing_target_ = 0.0f, late_ = 0.0f;
  float surface_seen_[2] = {0.0f, 0.0f};
  bool surface_live_ = false;
  float depth_seen_ = -1.0f;
  float immersion_ = 0.0f;
  float sunk_seen_ = -1.0f;
  float sunk_under_ = 0.0f;
  // Attacks.
  float ceiling_[kBands] = {0.0f, 0.0f, 0.0f}, mark_[kBands] = {0.0f, 0.0f, 0.0f};
  int ceiling_hold_[kBands] = {0, 0, 0};
  float ceiling_fall_ = 0.0f, ceiling_lag_ = 0.0f;
  int ceiling_hold_samples_ = 1;
  float bed_ = 0.0f, bed_coeff_ = 0.0f, window_sum_ = 0.0f, window_bed_ = 0.0f;
  int window_ = 0, refractory_ = 0, window_samples_ = 1, refractory_samples_ = 1;
  int active_ = 0;
  // The squeeze.
  float level_ = 0.0f, release_ = 0.0f, rise_ = 0.0f;
  int level_hold_ = 0, squeeze_hold_samples_ = 1;
  long silent_run_ = 0, quiet_samples_ = 0;
  // For meter() only: never read by the sound.
  int bubble_count_ = 0;
  float last_pitch_ = 0.0f;
  float squeeze_ = 1.0f;
  float glint_ = 0.0f;
};

}  // namespace livemix
