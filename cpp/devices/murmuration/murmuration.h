#pragma once

// Murmuration: a chorus made by flying a flock instead of wobbling delays.
//
//   in ─┬──────────────────────────────────────────────────────────── dry ─┐
//       ├─ low (below Ground, each side) ──────────────────── straight on ─┤
//       └─ the rest, each side ─► a delay line a side                      │
//             bird 1: both sides read at its distance / 343 m/s            │
//                     ─► dulled by distance and height                     │
//                     ─► quieter by distance ─► leant to its side ─┐       │
//             bird 2 … bird 16 the same                            ├─► sum │
//                                                                  ┘    │  │
//       out ◄─ mix (equal power) ◄─ level hold where the flock is tight ◄──┘
//
// - Where the birds are is flock.h: a closed form of the flight time, which
//   runs at Speed from the moment the device starts and never stops, sound or
//   no sound. Nothing in the flight listens to the audio.
// - A bird's distance is its delay, so a bird flying towards the listener
//   plays sharp and one flying away plays flat: real Doppler, bounded by
//   flock::kMaxDepthRate (see max_bend). Range is the farthest distance in
//   metres; the nearest is an eighth of it.
// - Ground: a flock that keeps together is one late copy of a low note, and
//   one late copy mixed with the dry sound cancels the note whose half period
//   is the delay, for as long as the flock stays at that distance (measured
//   before this was here: a 33 Hz note more than 10 dB down for six seconds
//   on end at the defaults). So what lies below Ground does not fly: a
//   one-pole takes it out of what the birds copy and it goes straight to the
//   output at its own level, whatever Mix says:
//       out = low + dry gain * (in - low) + wet gain * flock(in - low)
//   At Mix 0 that is the input, sample for sample. With Ground fully down
//   nothing is kept and everything flies.
// - Air is the power of the distance law (1 is open air, 6 dB per doubling)
//   and how many octaves the farthest bird is dulled. A bird three sevenths
//   of the way out is as loud as the voice, which keeps the flock's mean
//   level near the input's: nearer birds are louder, farther ones quieter,
//   and the flock as a whole is held to 3 dB over the voice
//   (flock::ceiling).
// - The sum is divided by the square root of the number of birds, which holds
//   the level where their delays are far enough apart to add in power. In a
//   tight flock the lows still add in phase, so the wet sum goes through a
//   second-order shelf that takes them down by as much as the birds agree:
//   its depth is the birds' own count, its corner the spread of their delays.
// - Birds fade in and out over 30 ms when the count changes (flock::ease);
//   every bird keeps its own flight whatever the count, so the others do not
//   move.
// - Spread opens the flock up to a quarter turn either side of straight
//   ahead. Each bird copies both sides of the input and leans them towards
//   where it flies, by level only (the sine of its bearing, equal power, no
//   time difference between the sides): a bird straight ahead gives each
//   side its own side at the voice's level, a bird hard left gives the left
//   side 3 dB up and nothing on the right. So a sound that is the same on
//   both sides is flown all round, a sound that is wide stays wide, and one
//   that is out of phase between the sides does not cancel. Folded to mono a
//   bird keeps between its own level and 3 dB more, but the birds then meet
//   in one place: a held note is 10 dB down in the fold about twice as often
//   as in stereo (3 % of the time at the defaults against 1.7 %).
// - Turns follows its control at flock::kTurnsSlew per second of flight, and
//   Range and Together glide over a quarter of a second, since each moves
//   every delay: a step of any of them bends the birds instead of throwing
//   them. The rest glide over 50 ms.
// - Rest: after kRestSeconds of exact silence in, nothing is left in the
//   delay lines that a bird can reach, and the device stops working until
//   sound returns. That moment is counted in samples, not blocks, and the
//   flight time goes on meanwhile, so the output is the same at any block
//   size across a silence. Knobs moved at rest are where they were put when
//   sound returns. (kit::IdleGate decides by block, which is why it is not
//   used here.)
// - Bad input: what the birds and Ground are given is clamped to ±16 and
//   anything that is not a number counts as silence. The dry path is a wire.
//
// Storage: two delay lines of 32768 samples, interleaved (175 ms at 96 kHz
// and room to glide), 256 KB.

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
    low_[0] = low_[1] = 0.0f;
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
    low_open_ = low_open_next_ = low_open_of(now_.ground);
    low_open_step_ = 0.0f;
    low_on_ = low_on_of();
    hold_gain_ = 0.0f;
    hold_gain_step_ = 0.0f;
    hold_gain_next_ = 0.0f;
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json, for the display. 0: the
  // flight time of the last sample put out, in seconds, wrapped at
  // flock::kPeriod; every bird's place is flock::place at this time. 1: the
  // Turns the flight is flown with, which follows the control slowly; at
  // rest it is the control itself, which is what sound will wake to.
  float meter(int index) const {
    if (index == 1) return silent_ >= rest_samples_ ? param(murmuration::kTurns) : now_.turns;
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

      // What lies below Ground stays where it is; the birds copy the rest.
      const float safe[2] = {feed(in[0]), feed(in[1])};
      low_open_ += low_open_step_;
      low_[0] = flush_denormal(low_[0] + (safe[0] * low_on_ - low_[0]) * low_open_);
      low_[1] = flush_denormal(low_[1] + (safe[1] * low_on_ - low_[1]) * low_open_);

      float wet[2] = {0.0f, 0.0f};
      for (int b = 0; b < flock::kMaxBirds; ++b) {
        Bird& bird = birds_[b];
        if (!bird.sounding) continue;
        bird.delay += bird.delay_step;
        bird.left += bird.left_step;
        bird.right += bird.right_step;
        float heard[2];
        line_.read(bird.delay, &heard[0], &heard[1]);
        bird.tone[0] = flush_denormal(bird.tone[0] + (heard[0] - bird.tone[0]) * bird.open);
        bird.tone[1] = flush_denormal(bird.tone[1] + (heard[1] - bird.tone[1]) * bird.open);
        wet[0] += bird.tone[0] * bird.left;
        wet[1] += bird.tone[1] * bird.right;
      }
      line_.write(safe[0] - low_[0], safe[1] - low_[1]);

      hold_gain_ += hold_gain_step_;
      for (int c = 0; c < 2; ++c) wet[c] += hold_gain_ * hold_[c].lowpass(wet[c]);

      const float mix = mix_.next();
      // Equal power from the sine table: exact at Mix 0, and forced at Mix 1.
      const float dry_gain = mix >= 1.0f ? 0.0f : kit::SineTable::cos_lookup(0.25f * mix);
      const float wet_gain = kit::SineTable::lookup(0.25f * mix);
      const float low_gain = 1.0f - dry_gain;
      out_left_[i] = in[0] * dry_gain + wet[0] * wet_gain + low_[0] * low_gain;
      out_right_[i] = in[1] * dry_gain + wet[1] * wet_gain + low_[1] * low_gain;
    }
  }

 private:
  static constexpr int kLineSize = 32768;
  // Geometry glides so a knob bends the birds instead of zipping them; Range
  // and Together move every delay, so they are the slowest.
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
  // What a bird that is not flying weighs where the hold's corner is worked
  // out, so that the corner is already where a bird that joins will need it.
  static constexpr float kStandby = 1.0e-3f;

  // The two sides of the input, a sample of each side by side, so that one
  // bird's read of both costs one index. Read before write, as kit::DelayLine:
  // read(d) is x[n - d], d >= 2.
  struct Line {
    static constexpr int kMask = kLineSize - 1;
    float buffer[2 * kLineSize] = {};
    int at = 0;

    void clear() {
      for (float& sample : buffer) sample = 0.0f;
      at = 0;
    }
    void write(float left, float right) {
      buffer[2 * at] = left;
      buffer[2 * at + 1] = right;
      at = (at + 1) & kMask;
    }
    void read(float delay, float* left, float* right) const {
      const int whole = static_cast<int>(delay);
      const float fraction = delay - static_cast<float>(whole);
      const float* ym1 = &buffer[2 * ((at - whole + 1) & kMask)];
      const float* y0 = &buffer[2 * ((at - whole) & kMask)];
      const float* y1 = &buffer[2 * ((at - whole - 1) & kMask)];
      const float* y2 = &buffer[2 * ((at - whole - 2) & kMask)];
      *left = kit::hermite(ym1[0], y0[0], y1[0], y2[0], fraction);
      *right = kit::hermite(ym1[1], y0[1], y1[1], y2[1], fraction);
    }
  };

  struct Bird {
    float delay = 4.0f, delay_step = 0.0f, delay_next = 4.0f;
    float left = 0.0f, left_step = 0.0f, left_next = 0.0f;
    float right = 0.0f, right_step = 0.0f, right_next = 0.0f;
    float open = 1.0f;             // the one-pole's step: 1 - exp(-2 pi f / sr)
    float tone[2] = {0.0f, 0.0f};  // its state, a side each
    float active = 0.0f;           // 0..1, the fade when Birds changes
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
    float range, speed, together, turns, air, spread, lift, ground;
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
    return {param(kRange), param(kSpeed),  param(kTogether), param(kTurns),
            param(kAir),   param(kSpread), param(kLift),     param(kGround)};
  }

  void settle_controls() {
    now_ = targets();
    mix_.snap(param(murmuration::kMix));
    const int count = bird_count();
    for (int b = 0; b < flock::kMaxBirds; ++b) birds_[b].active = b < count ? 1.0f : 0.0f;
  }

  // The step of the one-pole that keeps what lies below Ground.
  float low_open_of(float hz) const {
    return 1.0f - std::exp(-kit::kTwoPi * kit::min(hz, 0.45f * sample_rate()) / sample_rate());
  }
  // Ground fully down keeps nothing: the one-pole is given less and less of
  // the sound (low_on_ glides to nought) and what it held runs out through it.
  float low_on_of() const {
    using namespace murmuration;
    return param(kGround) > kParamMin[kGround] ? 1.0f : 0.0f;
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
    const float most = static_cast<float>(kLineSize - 8);
    float share[flock::kMaxBirds];
    float power = 0.0f;
    for (int b = 0; b < flock::kMaxBirds; ++b) {
      share[b] = flock::ease(birds_[b].active);
      power += share[b] * share[b];
    }
    const float norm = power > 1.0e-9f ? 1.0f / std::sqrt(power) : 0.0f;
    // The birds that fly, by loudness: how many there are to agree. And every
    // bird, flying or standing by, for how far apart in time they are: the
    // spread of the delays pair by pair, which is what a bird that joins or
    // leaves changes the sum by.
    float weight[flock::kMaxBirds];
    float sum = 0.0f, sum_sq = 0.0f;
    float all = 0.0f, all_sq = 0.0f, all_d = 0.0f, all_dd = 0.0f;
    float first = 0.0f;
    for (int b = 0; b < flock::kMaxBirds; ++b) {
      Voice& voice = voices[b];
      const flock::Place place = flock::place(b, tau, flight);
      const float seconds = flock::delay_seconds(now_.range, place.u);
      const float loud = flock::loudness(place.u, now_.air);
      if (b == 0) first = seconds;
      const float apart = seconds - first;
      const float standing = loud * kit::max(share[b], kStandby);
      all += standing;
      all_sq += standing * standing;
      all_d += standing * apart;
      all_dd += standing * apart * apart;
      weight[b] = loud * share[b];
      sum += weight[b];
      sum_sq += weight[b] * weight[b];
      if (share[b] <= 0.0f) {
        voice = {birds_[b].delay_next, 0.0f, 0.0f, birds_[b].open};
        continue;
      }
      const float turn = (flock::pan(place.v, now_.spread) + 1.0f) * 0.125f;
      voice.delay = kit::clamp(seconds * sr, 2.0f, most);
      voice.left = kAhead * kit::SineTable::cos_lookup(turn);
      voice.right = kAhead * kit::SineTable::lookup(turn);
      const float hz =
          kit::min(flock::cutoff_hz(place.u, place.h, now_.air, now_.lift), 0.49f * sr);
      voice.open = 1.0f - std::exp(-kit::kTwoPi * hz / sr);
    }
    // No louder as a whole than the ceiling allows.
    const float level = norm * flock::ceiling(sum_sq * norm * norm);
    for (int b = 0; b < flock::kMaxBirds; ++b) {
      voices[b].left *= weight[b] * level;
      voices[b].right *= weight[b] * level;
    }

    const float mean = all_d / all;
    const float variance = kit::max(0.0f, all_dd / all - mean * mean);
    const float pairs = all * all / all_sq;  // above 1: there are sixteen birds here
    const float spread = std::sqrt(variance * pairs / (pairs - 1.0f));
    const float agree = sum_sq > 1.0e-12f ? kit::max(1.0f, sum * sum / sum_sq) : 1.0f;
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
    const float per_tick = static_cast<float>(kControlPeriod) / sample_rate();
    now_.range = to.range + (now_.range - to.range) * range_coeff_;
    now_.together = to.together + (now_.together - to.together) * range_coeff_;
    now_.speed = to.speed + (now_.speed - to.speed) * glide_coeff_;
    now_.air = to.air + (now_.air - to.air) * glide_coeff_;
    now_.spread = to.spread + (now_.spread - to.spread) * glide_coeff_;
    now_.lift = to.lift + (now_.lift - to.lift) * glide_coeff_;
    // Ground moves what the lines hold against what goes straight on, and the
    // lines take as long as a bird is late to follow: slowly, or the two add.
    now_.ground = to.ground + (now_.ground - to.ground) * range_coeff_;
    low_on_ = low_on_of() + (low_on_ - low_on_of()) * range_coeff_;
    const float slew = flock::kTurnsSlew * flock::flight_rate(now_.speed, now_.range) * per_tick;
    now_.turns += kit::clamp(to.turns - now_.turns, -slew, slew);
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
      if (!was) bird.tone[0] = bird.tone[1] = 0.0f;
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
    low_open_ = low_open_next_;
    low_open_next_ = low_open_of(now_.ground);
    low_open_step_ = (low_open_next_ - low_open_) * per;
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
      bird.tone[0] = bird.tone[1] = 0.0f;
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
    low_[0] = low_[1] = 0.0f;
    low_open_ = low_open_next_ = low_open_of(now_.ground);
    low_open_step_ = 0.0f;
    low_on_ = low_on_of();
  }

  Line line_;
  Bird birds_[flock::kMaxBirds];
  Controls now_ = {};
  kit::Smoother mix_;
  kit::Svf hold_[2];
  float hold_gain_ = 0.0f, hold_gain_step_ = 0.0f, hold_gain_next_ = 0.0f;
  // What lies below Ground, a side each, and the one-pole's step.
  float low_[2] = {0.0f, 0.0f};
  float low_open_ = 0.0f, low_open_step_ = 0.0f, low_open_next_ = 0.0f;
  float low_on_ = 1.0f;
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
