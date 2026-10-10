#pragma once

// Murmuration: a chorus made by flying a flock instead of wobbling delays.
//
//   in ─┬───────────────────────────────────────────────── dry ─┐
//       └─ L+R ─► one delay line ─► bird 1: read at its distance / 343 m/s
//                                   ─► dulled by distance and height
//                                   ─► quieter by distance ─► panned by its side ─┐
//                                   bird 2 … bird 16 the same                     ├─► sum
//                                                                                 ┘    │
//                 out ◄─ mix (equal power) ◄─ level hold where the flock is tight ◄───┘
//
// - Where the birds are is flock.h: a closed form of the flight time, which
//   runs at Speed from the moment the device starts and never stops, sound or
//   no sound. Nothing in the flight listens to the audio.
// - A bird's distance is its delay, so a bird flying towards the listener
//   plays sharp and one flying away plays flat: real Doppler, bounded by
//   flock::kMaxDepthRate (see max_bend). Range is the farthest distance in
//   metres; the nearest is an eighth of it.
// - Air is the power of the distance law (1 is open air, 6 dB per doubling)
//   and how many octaves the farthest bird is dulled. A bird three sevenths
//   of the way out is as loud as the voice, which keeps the flock's mean
//   level near the input's: nearer birds are louder, farther ones quieter.
// - The sum is divided by the square root of the number of birds, which holds
//   the level where their delays are far enough apart to add in power. In a
//   tight flock the lows still add in phase, so the wet sum goes through a
//   second-order shelf that takes them down by as much as the birds agree:
//   its depth is the birds' own count, its corner the spread of their delays.
// - Birds fade in and out over 30 ms when the count changes; every bird keeps
//   its own flight whatever the count, so the others do not move.
// - Spread opens the flock up to a quarter turn either side of straight
//   ahead. A bird is panned by the sine of its bearing, equal power, by level
//   only (no time difference between the sides), so the mono fold never
//   cancels: it is within 3 dB of the stereo sum. A bird straight ahead is
//   at the voice's own level on both sides.
// - Rest: after kRestSeconds of exact silence in, nothing is left in the
//   delay line that a bird can reach, and the device stops working until
//   sound returns. That moment is counted in samples, not blocks, and the
//   flight time goes on meanwhile, so the output is the same at any block
//   size across a silence. Knobs moved at rest are where they were put when
//   sound returns. (kit::IdleGate decides by block, which is why it is not
//   used here.)
// - Bad input: what goes into the delay line is clamped to ±16 and anything
//   that is not a number goes in as silence. The dry path is a wire.
//
// Storage: one mono delay line of 32768 samples (175 ms at 96 kHz and room
// to glide), 128 KB.

#include "../../kit/kit.h"
#include "flock.h"
#include "params.gen.h"

namespace livemix {

class Murmuration : public kit::DeviceBase<murmuration::kNumParams> {
 public:
  static constexpr int kControlPeriod = 32;

  void init(float sample_rate) {
    using namespace murmuration;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    line_.clear();
    for (Bird& bird : birds_) bird = Bird();
    for (kit::Svf& filter : hold_) {
      filter.reset();
      filter.set(1000.0f, 0.5f, sr);
    }
    mix_.set_time(kSmoothingSeconds, sr);
    const float per_tick = static_cast<float>(kControlPeriod) / sr;
    glide_coeff_ = std::exp(-per_tick / kGlideSeconds);
    range_coeff_ = std::exp(-per_tick / kRangeGlideSeconds);
    fade_step_ = per_tick / kFadeSeconds;
    rest_samples_ = static_cast<long>(kRestSeconds * sr);
    silent_ = rest_samples_;
    phase_ = 0;
    tau_ = 0.0;
    tau_before_ = 0.0;
    for (int id = 0; id < kNumParams; ++id) apply(id);
    settle_controls();
    hold_gain_ = 0.0f;
    hold_gain_step_ = 0.0f;
    hold_gain_next_ = 0.0f;
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The reading named by "meters" in device.json, for the display: the
  // flight time of the last sample put out, in seconds, wrapped at
  // flock::kPeriod. Every bird's place is flock::place at this time.
  float meter(int index) const {
    if (index != 0) return 0.0f;
    // A whole control period done leaves the clock at nought again.
    const int done = phase_ == 0 ? kControlPeriod : phase_;
    double now = tau_before_ +
                 (tau_ - tau_before_) * (static_cast<double>(done) / kControlPeriod);
    if (now < 0.0) now += flock::kPeriod;
    return static_cast<float>(now);
  }

  // The most a bird can bend the pitch at these settings, as a share of the
  // frequency: its greatest speed towards or away from the listener over the
  // speed of sound.
  static float max_bend(float range, float speed) {
    return range * (1.0f - flock::kNearShare) * flock::kMaxDepthRate *
           flock::flight_rate(speed, range) / flock::kSoundSpeed;
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (silent_ >= rest_samples_ && !input_present(frames)) {
      fly_at_rest(frames);
      silence_output(frames);
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      const bool resting = silent_ >= rest_samples_;
      if (phase_ == 0) {
        if (resting) {
          rest_tick();
        } else {
          tick();
        }
      }
      if (in[0] != 0.0f || in[1] != 0.0f) {
        if (resting) wake();
        silent_ = 0;
      } else if (silent_ < rest_samples_) {
        ++silent_;
      }
      if (++phase_ == kControlPeriod) phase_ = 0;
      if (silent_ >= rest_samples_) {
        // At rest: the input is silence and so is everything a bird can reach.
        out_left_[i] = 0.0f;
        out_right_[i] = 0.0f;
        continue;
      }

      float wet[2] = {0.0f, 0.0f};
      for (int b = 0; b < flock::kMaxBirds; ++b) {
        Bird& bird = birds_[b];
        if (!bird.sounding) continue;
        bird.delay += bird.delay_step;
        bird.left += bird.left_step;
        bird.right += bird.right_step;
        const float heard = line_.read_hermite(bird.delay);
        bird.tone = flush_denormal(bird.tone + (heard - bird.tone) * bird.open);
        wet[0] += bird.tone * bird.left;
        wet[1] += bird.tone * bird.right;
      }
      line_.write(feed(0.5f * (in[0] + in[1])));

      hold_gain_ += hold_gain_step_;
      for (int c = 0; c < 2; ++c) wet[c] += hold_gain_ * hold_[c].lowpass(wet[c]);

      const float mix = mix_.next();
      // Equal power from the sine table: exact at Mix 0, and forced at Mix 1.
      const float dry_gain = mix >= 1.0f ? 0.0f : kit::SineTable::cos_lookup(0.25f * mix);
      const float wet_gain = kit::SineTable::lookup(0.25f * mix);
      out_left_[i] = in[0] * dry_gain + wet[0] * wet_gain;
      out_right_[i] = in[1] * dry_gain + wet[1] * wet_gain;
    }
  }

 private:
  static constexpr int kLineSize = 32768;
  // Geometry glides so a knob bends the birds instead of zipping them; Range
  // moves every delay, so it is the slowest.
  static constexpr float kGlideSeconds = 0.05f;
  static constexpr float kRangeGlideSeconds = 0.25f;
  static constexpr float kFadeSeconds = 0.03f;
  // Longer than the longest delay (175 ms) and the time a bird's tone takes
  // to ring out below anything a float holds.
  static constexpr float kRestSeconds = 0.35f;
  static constexpr float kFeedLimit = 16.0f;
  // A bird straight ahead is as loud on each side as the voice it copies, so
  // the flock is as loud as the dry sound it is mixed against; a bird hard to
  // one side is 3 dB up on that side and silent on the other.
  static constexpr float kAhead = 1.41421356f;
  // The level hold: N birds whose delays spread by s seconds (their standard
  // deviation) add in phase well below 1 / (2 pi s) and in power well above
  // it, so the wet sum is taken down by sqrt(N) below a corner of
  // kHoldCorner * N^kHoldRise / (2 pi s), with a Q that rises with N: a
  // second-order shelf. Its shape is the nearest such shelf to
  // 1 / sqrt(1 + (N - 1) exp(-(2 pi f s)^2)); the corner was then set by
  // measuring the flock itself, octave by octave (the harness prints it).
  static constexpr float kHoldCorner = 1.8f;
  static constexpr float kHoldRise = 0.14f;

  struct Bird {
    float delay = 4.0f, delay_step = 0.0f, delay_next = 4.0f;
    float left = 0.0f, left_step = 0.0f, left_next = 0.0f;
    float right = 0.0f, right_step = 0.0f, right_next = 0.0f;
    float open = 1.0f;   // the one-pole's step: 1 - exp(-2 pi f / sr)
    float tone = 0.0f;   // its state
    float active = 0.0f; // 0..1, the fade when Birds changes
    bool sounding = false;
  };

  // What one bird's place comes to in sound.
  struct Voice {
    float delay;  // samples
    float left;
    float right;
    float open;
  };

  // The controls as the flight reads them: gliding while sound runs.
  struct Controls {
    float range, speed, together, turns, air, spread, lift;
  };

  static float feed(float x) {
    if (!(x == x) || x - x != 0.0f) return 0.0f;  // not a number, or infinite
    return kit::clamp(x, -kFeedLimit, kFeedLimit);
  }

  void apply(int id) {
    using namespace murmuration;
    if (id == kMix) {
      if (silent_ >= rest_samples_) {
        mix_.snap(param(kMix));
      } else {
        mix_.set_target(param(kMix));
      }
    }
    // The rest is read on the control clock.
  }

  Controls targets() const {
    using namespace murmuration;
    return {param(kRange), param(kSpeed), param(kTogether), param(kTurns),
            param(kAir),   param(kSpread), param(kLift)};
  }

  void settle_controls() {
    now_ = targets();
    mix_.snap(param(murmuration::kMix));
    const int count = bird_count();
    for (int b = 0; b < flock::kMaxBirds; ++b) birds_[b].active = b < count ? 1.0f : 0.0f;
  }

  int bird_count() const {
    return kit::clamp_int(static_cast<int>(param(murmuration::kBirds) + 0.5f), 1,
                          flock::kMaxBirds);
  }

  void advance_flight() {
    tau_before_ = tau_;
    tau_ += static_cast<double>(flock::flight_rate(now_.speed, now_.range)) * kControlPeriod /
            static_cast<double>(sample_rate());
    if (tau_ >= flock::kPeriod) {
      tau_ -= flock::kPeriod;
      tau_before_ -= flock::kPeriod;
    }
  }

  // At rest the flight goes on and the knobs are where they were put.
  void rest_tick() {
    now_ = targets();
    advance_flight();
  }

  void fly_at_rest(int frames) {
    while (frames > 0) {
      if (phase_ == 0) rest_tick();
      const int step = kit::clamp_int(kControlPeriod - phase_, 1, frames);
      phase_ += step;
      if (phase_ == kControlPeriod) phase_ = 0;
      frames -= step;
    }
  }

  // What the level hold is set to.
  struct Hold {
    float gain;    // of the low-passed sum added back: 1 / sqrt(N) - 1
    float corner;  // Hz
    float q;
  };

  // Every bird's sound at flight time `tau`, and the level hold that goes
  // with them.
  void voices_at(double tau, Voice* voices, Hold* hold) const {
    const float sr = sample_rate();
    const flock::Flight flight = flock::flight(tau, now_.together, now_.turns);
    const float most = kit::DelayLine<kLineSize>::max_delay() - 4.0f;
    float power = 0.0f;
    for (int b = 0; b < flock::kMaxBirds; ++b) power += birds_[b].active * birds_[b].active;
    const float norm = power > 1.0e-9f ? 1.0f / std::sqrt(power) : 0.0f;
    float sum = 0.0f, sum_sq = 0.0f, sum_d = 0.0f, sum_dd = 0.0f;
    for (int b = 0; b < flock::kMaxBirds; ++b) {
      Voice& voice = voices[b];
      if (birds_[b].active <= 0.0f) {
        voice = {birds_[b].delay_next, 0.0f, 0.0f, birds_[b].open};
        continue;
      }
      const flock::Place place = flock::place(b, tau, flight);
      const float seconds = flock::delay_seconds(now_.range, place.u);
      const float weight = birds_[b].active * flock::loudness(place.u, now_.air);
      const float turn = (flock::pan(place.v, now_.spread) + 1.0f) * 0.125f;
      voice.delay = kit::clamp(seconds * sr, 2.0f, most);
      voice.left = weight * norm * kAhead * kit::SineTable::cos_lookup(turn);
      voice.right = weight * norm * kAhead * kit::SineTable::lookup(turn);
      const float hz =
          kit::min(flock::cutoff_hz(place.u, place.h, now_.air, now_.lift), 0.49f * sr);
      voice.open = 1.0f - std::exp(-kit::kTwoPi * hz / sr);
      sum += weight;
      sum_sq += weight * weight;
      sum_d += weight * seconds;
      sum_dd += weight * seconds * seconds;
    }
    // How many birds there are to agree (weighted), and how far apart in time.
    *hold = {0.0f, 1000.0f, 0.5f};
    if (sum <= 1.0e-9f || sum_sq <= 1.0e-12f) return;
    const float agree = sum * sum / sum_sq;
    if (agree <= 1.0001f) return;
    const float mean = sum_d / sum;
    const float spread = std::sqrt(kit::max(0.0f, sum_dd / sum - mean * mean));
    const float log_agree = std::log2(agree);
    hold->gain = 1.0f / std::sqrt(agree) - 1.0f;
    hold->corner = kit::clamp(kHoldCorner * std::exp2(kHoldRise * log_agree) /
                                  (kit::kTwoPi * kit::max(spread, 1.0e-6f)),
                              20.0f, 0.45f * sr);
    hold->q = kit::clamp(0.32f + 0.083f * log_agree, 0.4f, 0.7f);
  }

  // Every kControlPeriod samples while sound runs: move the controls on,
  // fly to the next tick's time, and aim every bird there in a straight line.
  void tick() {
    const Controls to = targets();
    now_.range = to.range + (now_.range - to.range) * range_coeff_;
    now_.speed = to.speed + (now_.speed - to.speed) * glide_coeff_;
    now_.together = to.together + (now_.together - to.together) * glide_coeff_;
    now_.turns = to.turns + (now_.turns - to.turns) * glide_coeff_;
    now_.air = to.air + (now_.air - to.air) * glide_coeff_;
    now_.spread = to.spread + (now_.spread - to.spread) * glide_coeff_;
    now_.lift = to.lift + (now_.lift - to.lift) * glide_coeff_;
    const int count = bird_count();
    for (int b = 0; b < flock::kMaxBirds; ++b) {
      Bird& bird = birds_[b];
      const float goal = b < count ? 1.0f : 0.0f;
      if (bird.active < goal) bird.active = kit::min(goal, bird.active + fade_step_);
      if (bird.active > goal) bird.active = kit::max(goal, bird.active - fade_step_);
    }
    advance_flight();
    Voice voices[flock::kMaxBirds];
    Hold hold;
    voices_at(tau_, voices, &hold);
    const float per = 1.0f / static_cast<float>(kControlPeriod);
    for (int b = 0; b < flock::kMaxBirds; ++b) {
      Bird& bird = birds_[b];
      const Voice& voice = voices[b];
      const bool was = bird.sounding;
      bird.sounding = bird.active > 0.0f || bird.left_next != 0.0f || bird.right_next != 0.0f;
      if (!bird.sounding) continue;
      // Land exactly where the last tick aimed, then aim again.
      bird.left = bird.left_next;
      bird.right = bird.right_next;
      // A bird that was not sounding comes in where it is, not from where it was last heard.
      bird.delay = was ? bird.delay_next : voice.delay;
      if (!was) bird.tone = 0.0f;
      bird.delay_next = voice.delay;
      bird.left_next = voice.left;
      bird.right_next = voice.right;
      bird.delay_step = (bird.delay_next - bird.delay) * per;
      bird.left_step = (bird.left_next - bird.left) * per;
      bird.right_step = (bird.right_next - bird.right) * per;
      bird.open = voice.open;
    }
    hold_gain_ = hold_gain_next_;
    hold_gain_next_ = hold.gain;
    hold_gain_step_ = (hold_gain_next_ - hold_gain_) * per;
    for (kit::Svf& filter : hold_) filter.set(hold.corner, hold.q, sample_rate());
  }

  // Sound after rest: the knobs have arrived, and every bird stands where the
  // flight has it on this sample, part of the way from the last tick's time
  // to the next one's.
  void wake() {
    settle_controls();
    Voice from[flock::kMaxBirds], to[flock::kMaxBirds];
    Hold hold_from, hold_to;
    voices_at(tau_before_, from, &hold_from);
    voices_at(tau_, to, &hold_to);
    const float per = 1.0f / static_cast<float>(kControlPeriod);
    const float along = static_cast<float>(phase_) * per;
    for (int b = 0; b < flock::kMaxBirds; ++b) {
      Bird& bird = birds_[b];
      bird.sounding = bird.active > 0.0f;
      bird.tone = 0.0f;
      bird.delay_next = to[b].delay;
      bird.left_next = to[b].left;
      bird.right_next = to[b].right;
      bird.delay_step = (to[b].delay - from[b].delay) * per;
      bird.left_step = (to[b].left - from[b].left) * per;
      bird.right_step = (to[b].right - from[b].right) * per;
      bird.delay = from[b].delay + (to[b].delay - from[b].delay) * along;
      bird.left = from[b].left + (to[b].left - from[b].left) * along;
      bird.right = from[b].right + (to[b].right - from[b].right) * along;
      bird.open = to[b].open;
    }
    hold_gain_next_ = hold_to.gain;
    hold_gain_step_ = (hold_to.gain - hold_from.gain) * per;
    hold_gain_ = hold_from.gain + (hold_to.gain - hold_from.gain) * along;
    for (kit::Svf& filter : hold_) {
      filter.reset();
      filter.set(hold_to.corner, hold_to.q, sample_rate());
    }
  }

  kit::DelayLine<kLineSize> line_;
  Bird birds_[flock::kMaxBirds];
  Controls now_ = {};
  kit::Smoother mix_;
  kit::Svf hold_[2];
  float hold_gain_ = 0.0f, hold_gain_step_ = 0.0f, hold_gain_next_ = 0.0f;
  float glide_coeff_ = 0.0f;
  float range_coeff_ = 0.0f;
  float fade_step_ = 1.0f;
  // Flight time at the next control tick and at the last one, in seconds.
  double tau_ = 0.0;
  double tau_before_ = 0.0;
  long rest_samples_ = 1;
  long silent_ = 1;
  int phase_ = 0;
};

}  // namespace livemix
