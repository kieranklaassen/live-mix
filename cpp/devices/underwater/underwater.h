#pragma once

// Underwater: what a sound is like heard from under water. Depth is the one
// knob; the others say how much of each thing the water does.
//
//   in ─► light ─► absorb ─► body ─► waver ─► squeeze ─(+)─► close in ─► mix ─► out
//                                                       ▲
//   in ─► attacks ─► bubbles ───────────────────────────┘
//
// - Light (Surface): the top end, above a one-pole split at 2.2 kHz, flickers
//   in level with three free sines (7.3, 11.9 and 17.3 Hz), out of step
//   between the two sides. It stands before the absorption, so the water
//   itself takes it away as the sound goes deep.
// - Absorb: a fourth-order Butterworth low-pass whose corner falls with Depth
//   from 16 kHz to 300 Hz, faded in over the first tenth of Depth (the sound
//   going through the surface).
// - Body: a broad resonance (Q 1.6) added on top, at 520 Hz just under the
//   surface and 250 Hz at the bottom. At full Body and Depth the hump stands
//   12 dB over what is around it, and the whole is trimmed 5.6 dB so it is a
//   colour and not a gain.
// - Waver: a delay swung by the surface, a swell at Swell Hz and a ripple at
//   0.382 of it (3 : 1 in size). The swing is sized so the pitch bends by at
//   most 45 cents either way at full Waver whatever the rate, down to 0.14 Hz;
//   under that the swing stops at 35 ms and the bend is gentler. The right
//   side rides the same surface up to 23 ms later (Width), which puts the two
//   sides up to 0.6 ms apart: the sound leans a little one way, then the other.
// - Squeeze (Pressure): gain that follows the level with no attack time and a
//   150 ms release, 2 : 1 over -34 dBFS at full Pressure and Depth, made up so
//   a level of -15 dBFS stays where it was.
// - Bubbles: an attack in the input (its top end jumping over its own recent
//   average) sends up a count of bubbles set by Bubbles. Each is a sine that
//   dies away over 26 cycles while its pitch climbs, high and quick for a small
//   bubble, low and slow for a large one; the later ones of a flight are
//   higher. They are not absorbed: they are in the water with the listener.
// - Close in: the side signal is turned down with Depth, as far as Width
//   allows.
//
// Everything is scaled by Depth so that Depth 0 is the input, sample for
// sample, wherever the other knobs stand; so is Mix 0. The wet path is the
// input filtered and moved by a few milliseconds, so Mix is a linear
// crossfade.
//
// Storage: two delay lines of 8,192 samples (2 x 35 ms at 96 kHz and the
// interpolator's margin), 64 kB; no heap. No latency is reported: the waver's
// delay is the effect.
//
// The surface runs freely, also while the device sleeps: its phases are
// counted in whole steps per sample, so they stand at the same place whatever
// the block size. Sound arriving after 3.5 s of silent input finds the filters
// and followers cleared and every knob where it was last put.

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
    swing_.set_time(kGlideSeconds, sr);
    lag_.set_time(kGlideSeconds, sr);
    for (int c = 0; c < 2; ++c) {
      split_[c].set_cutoff(kLightSplitHz, sr);
      detect_split_[c].set_cutoff(kDetectSplitHz, sr);
    }
    fast_.set(0.0005f, 0.02f, sr);
    loud_.set(0.0005f, 0.05f, sr);
    slow_rise_ = kit::time_to_coeff(0.04f, sr);
    slow_fall_ = kit::time_to_coeff(0.2f, sr);
    release_ = kit::time_to_coeff(kSqueezeReleaseSeconds, sr);
    window_samples_ = static_cast<int>(kWindowSeconds * sr);
    refractory_samples_ = static_cast<int>(kRefractorySeconds * sr);
    quiet_samples_ = static_cast<long>(kQuietSeconds * sr);
    silent_run_ = quiet_samples_;
    swell_phase_ = 0u;
    ripple_phase_ = 0u;
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

  // The readings named by "meters" in device.json, for the display: 0 and 1,
  // where the swell and the ripple are in their cycles (0..1); 2, how many
  // bubbles have started sounding (it wraps at 65,536); 3, the pitch the last
  // of them started at in Hz; 4, the share of its level the squeeze leaves the
  // sound before make-up (1 at rest); 5, the flicker of the light on the left
  // side now, -1..1 (0 with no Surface, out of the water and asleep).
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
        if (silent_run_ < quiet_samples_) ++silent_run_;
      } else {
        if (silent_run_ >= quiet_samples_) restart();
        silent_run_ = 0;
      }

      const float depth = depth_.next();
      if (depth != depth_seen_) derive(depth);
      const float under = immersion_;

      swell_phase_ += swell_inc_;
      ripple_phase_ += ripple_inc_;
      for (int k = 0; k < kFlickers; ++k) flicker_phase_[k] += flicker_inc_[k];

      // Light on the water: the top end flickers.
      float x[2] = {in[0], in[1]};
      const float light = surface_.next() * under;
      const float high[2] = {split_[0].highpass(in[0]), split_[1].highpass(in[1])};
      float glint = 0.0f;
      if (light > 0.0f) {
        glint = flicker(0);
        x[0] = in[0] + light * glint * high[0];
        x[1] = in[1] + light * flicker(1) * high[1];
      }
      glint_ = glint;

      // The water takes the highs, and its body rings.
      const float ring = kBodyGain * resonance_.next() * depth;
      const float trim = 1.0f / (1.0f + kBodyTrim * ring);
      float y[2];
      for (int c = 0; c < 2; ++c) {
        const float dark = absorb_b_[c].lowpass(absorb_a_[c].lowpass(x[c]));
        const float absorbed = x[c] + under * (dark - x[c]);
        y[c] = (absorbed + ring * body_[c].bandpass(absorbed)) * trim;
      }

      // The surface moves the sound in time, the right side a little later.
      const float swing = swing_.next();
      const float width = width_.next();
      float wet[2];
      line_[0].write(y[0]);
      line_[1].write(y[1]);
      const float lag = lag_.next() * width;
      if (swing > 0.0f) {
        for (int c = 0; c < 2; ++c) {
          const float surface = surface_height(c == 0 ? 0.0f : lag);
          wet[c] = read(line_[c], kit::min(1.0f + swing * (1.0f + surface), max_delay));
        }
      } else {
        wet[0] = y[0];
        wet[1] = y[1];
      }

      // The water squeezes.
      const float press = pressure_.next() * depth;
      const float left_size = wet[0] < 0.0f ? -wet[0] : wet[0];
      const float right_size = wet[1] < 0.0f ? -wet[1] : wet[1];
      const float size = left_size > right_size ? left_size : right_size;
      const float fallen = flush_denormal(level_ * release_);
      level_ = size > fallen ? size : fallen;
      float held = 1.0f;
      if (press > 0.0f) {
        held = 1.0f - press * (1.0f - std::sqrt(kSqueezeThreshold /
                                                kit::max(level_, kSqueezeThreshold)));
        const float gain = held / (1.0f - press * (1.0f - kSqueezeReferenceRoot));
        wet[0] *= gain;
        wet[1] *= gain;
      }
      squeeze_ = held;

      // Attacks send up bubbles.
      listen(in);
      if (active_ > 0) {
        float air[2];
        rise(air);
        if (under > 0.0f) {
          wet[0] += under * kit::soft_clip(air[0]);
          wet[1] += under * kit::soft_clip(air[1]);
        }
      }

      // Left and right close in.
      const float close = 0.5f * depth * (1.0f - width) * (wet[0] - wet[1]);
      wet[0] -= close;
      wet[1] += close;

      const float mix = mix_.next();
      out_left_[i] = in[0] + (wet[0] - in[0]) * mix;
      out_right_[i] = in[1] + (wet[1] - in[1]) * mix;
      const float a = wet[0] < 0.0f ? -wet[0] : wet[0];
      const float b = wet[1] < 0.0f ? -wet[1] : wet[1];
      if (a > wet_peak) wet_peak = a;
      if (b > wet_peak) wet_peak = b;
    }
    // The wet path counts too: at Mix 0 the bubbles still rise out of earshot.
    idle_.settle(kit::max(output_peak(frames), wet_peak), frames);
  }

 private:
  static constexpr int kLineSize = 8192;
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
  // time the two sides get: 0.6 ms at the most, about what two ears are apart),
  // and the time a change of swing takes.
  static constexpr float kRippleRatio = 0.381966f;
  static constexpr float kSwellShare = 0.75f;
  static constexpr float kRippleShare = 0.25f;
  static constexpr float kBend = 0.026334f;
  static constexpr float kMaxSwingSeconds = 0.035f;
  static constexpr float kStereoLagSeconds = 0.023f;
  static constexpr float kGlideSeconds = 0.15f;
  // Squeeze: -34 dBFS, and the level that keeps its place (-15 dBFS) as the
  // root of the threshold over it.
  static constexpr float kSqueezeThreshold = 0.02f;
  static constexpr float kSqueezeReferenceRoot = 0.33333333f;
  static constexpr float kSqueezeReleaseSeconds = 0.15f;
  // Attacks: the top end over this split, how far it must jump over its own
  // recent average, the least it must be, how long the attack is measured and
  // how soon the next may come.
  static constexpr float kDetectSplitHz = 600.0f;
  static constexpr float kJump = 1.7f;
  static constexpr float kJumpFloor = 0.002f;
  static constexpr float kWindowSeconds = 0.008f;
  static constexpr float kRefractorySeconds = 0.05f;
  // Bubbles: the most one attack sends up, the pitch of a small and of a large
  // one, the spread of a flight in time (a small and a large one's time
  // constant; none later than three of them), how much higher the last of a
  // flight is than the first and how far each strays (octaves), the cycles a
  // bubble takes to die away by 1/e and how far its pitch climbs in that
  // time, its fade in, its level against the attack's and the loudest attack
  // that counts.
  static constexpr float kMostBubbles = 12.0f;
  static constexpr float kSmallHz = 2400.0f;
  static constexpr float kLargeHz = 420.0f;
  static constexpr float kFlightSmallSeconds = 0.07f;
  static constexpr float kFlightLargeSeconds = 0.27f;
  static constexpr float kFlightRiseOctaves = 0.8f;
  static constexpr float kStrayOctaves = 0.35f;
  static constexpr float kBubbleCycles = 26.0f;
  static constexpr float kChirp = 0.3f;
  static constexpr float kFadeInSeconds = 0.0015f;
  static constexpr float kBubbleGain = 0.5f;
  static constexpr float kMostAttack = 0.5f;
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
    float fade = 0.0f;   // 0..1 over the fade in
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
  // same whatever the block size and whether or not the device slept.
  void restart() {
    for (int c = 0; c < 2; ++c) {
      split_[c].reset();
      detect_split_[c].reset();
      absorb_a_[c].reset();
      absorb_b_[c].reset();
      body_[c].reset();
    }
    fast_.reset();
    loud_.reset();
    slow_ = 0.0f;
    level_ = 0.0f;
    squeeze_ = 1.0f;
    glint_ = 0.0f;
    window_ = 0;
    refractory_ = 0;
    attack_peak_ = 0.0f;
    for (Bubble& bubble : bubbles_) bubble.active = false;
    active_ = 0;
    depth_.snap(depth_.target);
    surface_.snap(surface_.target);
    resonance_.snap(resonance_.target);
    pressure_.snap(pressure_.target);
    width_.snap(width_.target);
    mix_.snap(mix_.target);
    swing_.snap(swing_.target);
    lag_.snap(lag_.target);
    depth_seen_ = -1.0f;
  }

  bool quiet() const { return silent_run_ >= quiet_samples_; }

  // How far under the surface the sound is, 0..1 over the first tenth of Depth.
  static float immersion(float depth) {
    const float t = kit::clamp(depth * (1.0f / kSurfaceDepth), 0.0f, 1.0f);
    return t * t * (3.0f - 2.0f * t);
  }

  // What follows from Depth: how far under, the corner, where the body rings.
  void derive(float depth) {
    depth_seen_ = depth;
    immersion_ = immersion(depth);
    const float sr = sample_rate();
    const float corner = kTopHz * std::pow(kDeepHz / kTopHz, depth);
    absorb_a_[0].set(corner, kButterworthQ[0], sr);
    absorb_b_[0].set(corner, kButterworthQ[1], sr);
    body_[0].set(kBodyTopHz * std::pow(kBodyDeepHz / kBodyTopHz, depth), kBodyQ, sr);
    copy(absorb_a_[0], &absorb_a_[1]);
    copy(absorb_b_[0], &absorb_b_[1]);
    copy(body_[0], &body_[1]);
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
    return kSwellShare * kit::SineTable::lookup(turns(swell_phase_) - late) +
           kRippleShare * kit::SineTable::lookup(turns(ripple_phase_) - late * kRippleRatio);
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
  // gets bends the pitch by kBend at full Waver, and never past the line.
  void set_swing(bool ramp) {
    using namespace underwater;
    const float rate = param(kRate);
    const float steepest = kit::kTwoPi * rate * (kSwellShare + kRippleShare * kRippleRatio);
    const float seconds = kit::min(kMaxSwingSeconds, kBend / steepest);
    swing_.set(param(kWaver) * immersion(param(kDepth)) * seconds * sample_rate(), ramp);
  }

  // Follow the input for attacks, and send bubbles up after one.
  void listen(const float* in) {
    const float top_left = detect_split_[0].highpass(in[0]);
    const float top_right = detect_split_[1].highpass(in[1]);
    const float left = top_left < 0.0f ? -top_left : top_left;
    const float right = top_right < 0.0f ? -top_right : top_right;
    const float fast = fast_.process(left > right ? left : right);
    const float whole_left = in[0] < 0.0f ? -in[0] : in[0];
    const float whole_right = in[1] < 0.0f ? -in[1] : in[1];
    const float loud = loud_.process(whole_left > whole_right ? whole_left : whole_right);
    if (window_ > 0) {
      if (loud > attack_peak_) attack_peak_ = loud;
      if (--window_ == 0) send_up(attack_peak_);
    } else if (refractory_ > 0) {
      --refractory_;
    } else if (fast > kJump * slow_ + kJumpFloor) {
      window_ = window_samples_ > 0 ? window_samples_ : 1;
      refractory_ = refractory_samples_;
      attack_peak_ = loud;
    }
    slow_ = flush_denormal(fast + (slow_ - fast) * (fast > slow_ ? slow_rise_ : slow_fall_));
  }

  // One attack's flight of bubbles: how many by Bubbles, how loud by the attack.
  void send_up(float attack) {
    using namespace underwater;
    const float amount = param(kBubbles);
    if (!(amount > 0.0f) || !(param(kDepth) > 0.0f)) return;
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
      kit::pan_gains(0.8f * pan, &bubble->left, &bubble->right);
      bubble->hz = hz;
      ++active_;
    }
  }

  // One sample of every bubble that is on its way or sounding.
  void rise(float* air) {
    const float fade_step = 1.0f / kit::max(1.0f, kFadeInSeconds * sample_rate());
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
        bubble.fade += fade_step;
        if (bubble.fade > 1.0f) bubble.fade = 1.0f;
      }
      const float sample = bubble.level * bubble.fade * kit::SineTable::lookup(bubble.phase);
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
        swell_inc_ = step_of(value, sample_rate());
        ripple_inc_ = step_of(value * kRippleRatio, sample_rate());
        // In cycles of the swell; it glides, or a change of rate would jump the right side.
        lag_.set(value * kStereoLagSeconds, ramp);
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
        break;
      case kMix:
        mix_.set(value, ramp);
        break;
      default:
        break;  // Bubbles and Bubble Size are read when an attack sends a flight up
    }
  }

  kit::DelayLine<kLineSize> line_[2];
  kit::Svf absorb_a_[2], absorb_b_[2], body_[2];
  kit::OnePole split_[2], detect_split_[2];
  kit::Smoother depth_, surface_, resonance_, pressure_, width_, mix_, swing_, lag_;
  kit::Follower fast_, loud_;
  kit::Rng rng_;
  kit::IdleGate idle_;
  Bubble bubbles_[kVoices];
  uint32_t swell_phase_ = 0u, ripple_phase_ = 0u, swell_inc_ = 0u, ripple_inc_ = 0u;
  uint32_t flicker_phase_[kFlickers] = {0u, 0u, 0u};
  uint32_t flicker_inc_[kFlickers] = {0u, 0u, 0u};
  float depth_seen_ = -1.0f;
  float immersion_ = 0.0f;
  float slow_ = 0.0f, slow_rise_ = 0.0f, slow_fall_ = 0.0f;
  float level_ = 0.0f, release_ = 0.0f;
  float attack_peak_ = 0.0f;
  int window_ = 0, refractory_ = 0, window_samples_ = 1, refractory_samples_ = 1;
  int active_ = 0;
  long silent_run_ = 0, quiet_samples_ = 0;
  // For meter() only: never read by the sound.
  int bubble_count_ = 0;
  float last_pitch_ = 0.0f;
  float squeeze_ = 1.0f;
  float glint_ = 0.0f;
};

}  // namespace livemix
