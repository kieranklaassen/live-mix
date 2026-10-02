#pragma once

// Glitch: a buffer that misbehaves by chance.
//
//   in ──┬──────────────────────────────────── × room ──┐
//        └─► ring (10 s) ─► two readers ─► tone ─► pan ─┴─► out
//
// - The input is always recorded and, while nothing is happening, passed
//   through bit for bit. A slice clock (Time) divides it; when a slice ends
//   with nothing playing, a seeded random draw decides with probability
//   Chance whether an event starts, and which kind, weighted by Repeat, Skip,
//   Reverse and Slow. When an event ends the draw is made again at once.
// - Repeat plays the slice that just ended again, one to eight times (few
//   more likely than many). Decay makes each repeat 6 dB quieter and an
//   octave darker at full; Bounce makes each one shorter than the last by a
//   fixed ratio, down to 8 ms.
// - Skip jumps back to somewhere in the last slice and loops a fragment of
//   20 to 120 ms three to ten times: a stuck disc.
// - Reverse plays the slice that just ended backwards, starting from the
//   present, so it leaves the input without a jump.
// - Slow takes hold of the input where it is and either drops to half speed
//   for one or two slices, or slows linearly to a stop and spins back up in
//   a third of the time. A stopped tape fades out; it does not hold a sample.
// - Octaves: a repeat or a stuck fragment may play at double speed (a repeat
//   then plays twice, so it keeps its time) or at half speed. Double-speed
//   reads go through a half-band filter, so the top octave of the recording
//   is removed instead of folding down.
// - An event is a chain of fragments, each played by a reader; a fragment
//   fades in while the one before it (or the input) fades out. Calm sets the
//   fade, from none at all (a hard cut and its click) to 80 ms, never more
//   than half of either fragment, and closes a 12 dB per octave low-pass on
//   the readers from open to 4 kHz. `room` is what the fade leaves the input.
// - Spread throws each event to a random pan position, narrowing a stereo
//   source towards mono as it goes so neither channel is lost.
// - Everything but Mix is read when a slice ends or a fragment starts, so no
//   control can click. Mix is a linear crossfade against the input: between
//   events both sides of it are the same signal.
// - Sleep: once the ring holds nothing but exact silence as far back as a new
//   event could reach (Time + 0.3 s) and nothing is playing, the device stops
//   and writes zeros. This is decided per sample, so it does not depend on the
//   block size. The first sound after that starts the slice clock afresh.

#include "../../kit/kit.h"
#include "params.gen.h"
#include "ring.h"

namespace livemix {

class Glitch : public kit::DeviceBase<glitch::kNumParams> {
 public:
  // Named apart from the parameter ids kRepeat, kSkip, kReverse in params.gen.h.
  enum Kind : int { kNone = 0, kRepeating, kSkipping, kReversing, kHalfSpeed, kTapeStop };

  void init(float sample_rate) {
    using namespace glitch;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    ring_.clear();
    Ring::design_half_band(half_band_);
    rng_.seed(0x1D208977u);
    mix_.set_time(kSmoothingSeconds, sr);
    for (Reader& reader : readers_) reader = Reader();
    event_ = Event();
    current_ = -1;
    dormant_ = true;
    quiet_ = 0;
    until_boundary_ = 0;
    segment_left_ = 0;
    events_ = 0;
    boundaries_ = 0;
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // For the harness: how many slice boundaries were free to start an event,
  // how many did, and what is playing now.
  long boundary_count() const { return boundaries_; }
  long event_count() const { return events_; }
  int event_kind() const { return event_.active ? event_.kind : static_cast<int>(kNone); }

  void process(int frames) {
    frames = begin_block(frames);
    if (dormant_ && !input_present(frames)) {
      silence_output(frames);
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      // A NaN or a runaway value must not sit in the buffer for ten seconds.
      if (!(in[0] > -64.0f && in[0] < 64.0f)) in[0] = 0.0f;
      if (!(in[1] > -64.0f && in[1] < 64.0f)) in[1] = 0.0f;
      const bool sound = in[0] != 0.0f || in[1] != 0.0f;
      const float mix = mix_.next();

      if (dormant_) {
        if (!sound) {
          out_left_[i] = 0.0f;
          out_right_[i] = 0.0f;
          continue;
        }
        wake();
      }
      ring_.write(in[0], in[1]);
      quiet_ = sound ? 0 : quiet_ + 1;

      if (event_.active) {
        if (segment_left_ <= 0) next_segment();
      } else if (until_boundary_ <= 0) {
        boundary();
      }
      if (event_.active) {
        --segment_left_;
      } else {
        --until_boundary_;
      }

      if (readers_[0].active || readers_[1].active) {
        // The input keeps what a lone reader's fade leaves it; two readers
        // are one fragment handing over to the next, with no input at all.
        float wet[2] = {0.0f, 0.0f};
        float room = 0.0f;
        if (readers_[0].active && readers_[1].active) {
          render(readers_[0], wet);
          render(readers_[1], wet);
        } else {
          room = render(readers_[readers_[0].active ? 0 : 1], wet);
        }
        out_left_[i] = in[0] + mix * (wet[0] - (1.0f - room) * in[0]);
        out_right_[i] = in[1] + mix * (wet[1] - (1.0f - room) * in[1]);
      } else {
        // Nothing is happening: the input itself, bit for bit.
        out_left_[i] = in[0];
        out_right_[i] = in[1];
        if (quiet_ >= lookback_ && !event_.active) dormant_ = true;
      }
    }
  }

 private:
  // 10.9 s at 96 kHz: the longest slice plus the longest event.
  static constexpr int kRingFrames = 1 << 20;
  using Ring = glitch::StereoRing<kRingFrames>;

  static constexpr float kMaxEventSeconds = 7.0f;
  static constexpr int kMaxRepeats = 8;

  struct Reader {
    bool active = false;
    bool releasing = false;
    int mode = kRepeating;     // how the speed moves: see render()
    double position = 0.0;
    float rate = 1.0f;
    bool halved = false;       // rate 2: read through the half-band filter
    float length = 1.0f;       // nominal length in output samples
    float age = 0.0f;          // output samples played
    float in_phase = 1.0f, in_step = 0.0f;
    bool linear_in = false;    // fading in over the input it starts on
    float out_phase = 0.0f, out_step = 0.0f;
    // out_left = ll·L + lr·R, out_right = rl·L + rr·R (gain, pan and narrowing)
    float ll = 1.0f, lr = 0.0f, rl = 0.0f, rr = 1.0f;
    bool filtered = false;
    bool primed = false;
    float pole = 0.0f;
    float state[2][2] = {{0.0f, 0.0f}, {0.0f, 0.0f}};
    // Speed programme.
    float glide = 0.0f;        // kHalfSpeed: what is left of the fall to half speed
    float glide_coeff = 0.0f;
    float stop_length = 1.0f;  // kTapeStop: samples spent slowing down
    float spin_length = 1.0f;  //            and spinning back up
  };

  struct Event {
    bool active = false;
    int kind = kNone;
    long long source = 0;      // where the fragment starts in the ring
    float slice = 0.0f;        // slice length when the event began, in samples
    float fragment = 0.0f;     // skip: fragment length in samples
    int count = 0;             // repeats or loops in the event
    int index = 0;             // which one comes next
    int part = 0;              // an octave-up repeat plays in two halves
    float rate = 1.0f;         // skip: fragment speed
    float shrink = 1.0f;       // repeat: length ratio between repeats
    float pan = 0.0f;
  };

  void apply(int id) {
    using namespace glitch;
    if (id == kTime) {
      const float sr = sample_rate();
      slice_ = std::floor(param(kTime) * 0.001f * sr + 0.5f);
      if (slice_ < 16.0f) slice_ = 16.0f;
      lookback_ = static_cast<long>(slice_ + kLookbackSeconds * sr);
      // A shorter Time cuts the wait for the next slice short, but never
      // into a fade that is still running.
      if (!event_.active && until_boundary_ > static_cast<long>(slice_)) {
        until_boundary_ = static_cast<long>(slice_);
        for (const Reader& reader : readers_) {
          if (!reader.active || !reader.releasing) continue;
          const long left = static_cast<long>((1.0f - reader.out_phase) / reader.out_step) + 2;
          if (until_boundary_ < left) until_boundary_ = left;
        }
      }
    } else if (id == kMix) {
      mix_.set(param(kMix), primed());
    }
    // Everything else is read when a slice ends or a fragment starts.
  }

  // The first sound after a silence: forget what the ring held and start the
  // slice grid here.
  void wake() {
    dormant_ = false;
    mix_.snap(mix_.target);
    ring_.forget();
    quiet_ = 0;
    until_boundary_ = static_cast<long>(slice_);
    segment_left_ = 0;
    event_ = Event();
    current_ = -1;
    for (Reader& reader : readers_) reader.active = false;
  }

  // The gain of each side half way through a splice: 0.5^0.75 = 0.59. Linear
  // (0.5) would dip 3 dB where the two sides are unrelated, equal power
  // (0.71) would swell 3 dB where they happen to be in phase; this is 1.5 dB
  // either way.
  static float splice_gain(float ramp) {
    const float root = std::sqrt(ramp);
    return root * std::sqrt(root);
  }

  // One output frame of a reader, added to wet[] under its fade gain.
  // Returns the gain that is left for the input while this reader is the
  // only one playing: the other side of its fade.
  float render(Reader& reader, float* wet) {
    float fade = 1.0f;
    float other = 0.0f;
    if (reader.in_phase < 1.0f) {
      const float ramp = 0.5f - 0.5f * kit::SineTable::cos_lookup(0.5f * reader.in_phase);
      // A reader that starts on the input itself fades in over the same
      // audio, so its fade is linear.
      fade = reader.linear_in ? ramp : splice_gain(ramp);
      other = reader.linear_in ? 1.0f - ramp : splice_gain(1.0f - ramp);
      reader.in_phase += reader.in_step;
    }
    if (reader.releasing) {
      const float ramp = 0.5f - 0.5f * kit::SineTable::cos_lookup(0.5f * reader.out_phase);
      fade *= splice_gain(1.0f - ramp);
      other = splice_gain(ramp);
      reader.out_phase += reader.out_step;
      if (reader.out_phase >= 1.0f) reader.active = false;
    }

    float left, right;
    if (reader.halved) {
      ring_.read_halved(static_cast<long long>(reader.position), half_band_, &left, &right);
    } else {
      ring_.read(reader.position, &left, &right);
    }

    // The speed for the next frame, and for a stopping tape its level: a
    // tape that is barely moving plays nothing, not a held sample.
    float level = 1.0f;
    float rate = reader.rate;
    if (reader.mode == kHalfSpeed) {
      rate = 0.5f + reader.glide;
      reader.glide = flush_denormal(reader.glide * reader.glide_coeff);
    } else if (reader.mode == kTapeStop) {
      if (reader.age < reader.stop_length) {
        rate = 1.0f - reader.age / reader.stop_length;
      } else {
        rate = kit::min(1.0f, (reader.age - reader.stop_length) / reader.spin_length);
      }
      const float t = kit::clamp(rate * (1.0f / kStopFadeRate), 0.0f, 1.0f);
      level = t * t * (3.0f - 2.0f * t);
    }
    reader.position += static_cast<double>(rate);
    reader.age += 1.0f;

    if (reader.filtered) {
      if (!reader.primed) {
        reader.primed = true;
        reader.state[0][0] = reader.state[0][1] = left;
        reader.state[1][0] = reader.state[1][1] = right;
      }
      const float keep = reader.pole;
      reader.state[0][0] = flush_denormal(left + (reader.state[0][0] - left) * keep);
      reader.state[0][1] = flush_denormal(reader.state[0][0] + (reader.state[0][1] - reader.state[0][0]) * keep);
      reader.state[1][0] = flush_denormal(right + (reader.state[1][0] - right) * keep);
      reader.state[1][1] = flush_denormal(reader.state[1][0] + (reader.state[1][1] - reader.state[1][0]) * keep);
      left = reader.state[0][1];
      right = reader.state[1][1];
    }

    const float gain = fade * level;
    wet[0] += gain * (reader.ll * left + reader.lr * right);
    wet[1] += gain * (reader.rl * left + reader.rr * right);
    return other;
  }

  // Fade length in samples at this Calm: none at 0 (a hard cut, the click
  // included), 2 ms at 0.3, 17 ms at 0.6, 80 ms at 1.
  float fade_length() const {
    const float calm = param(glitch::kCalm);
    return kLongestFadeSeconds * calm * calm * calm * sample_rate();
  }

  // Let the newest fragment go over `fade` samples.
  void release_current(float fade) {
    if (current_ < 0) return;
    Reader& reader = readers_[current_];
    current_ = -1;
    if (!reader.active || reader.releasing) return;
    if (fade < 2.0f) {
      reader.active = false;  // a hard cut
      return;
    }
    reader.releasing = true;
    reader.out_phase = 0.0f;
    reader.out_step = 1.0f / fade;
  }

  // Start a fragment: `length` output samples from `position` at `rate`,
  // crossfaded with whatever was playing (the previous fragment or the
  // input). The fade never takes more than half of either fragment, so the
  // old one has always gone before the new one ends: two readers are enough.
  Reader& start_fragment(double position, float rate, float length, float gain, float cutoff) {
    float fade = kit::min(fade_length(), 0.5f * length);
    if (current_ >= 0 && readers_[current_].active && !readers_[current_].releasing) {
      fade = kit::min(fade, 0.5f * readers_[current_].length);
    }
    fade = std::floor(kit::max(fade, 1.0f));
    const int previous = current_;
    release_current(fade);
    const int slot = previous == 0 ? 1 : 0;
    Reader& reader = readers_[slot];
    reader = Reader();
    reader.active = true;
    reader.position = position;
    reader.rate = rate;
    reader.halved = rate == 2.0f;
    reader.length = length;
    if (fade >= 2.0f) {
      reader.in_phase = 0.0f;
      reader.in_step = 1.0f / fade;
    }

    // Pan by constant power around unity at the centre, narrowing a stereo
    // source towards mono as it moves so the far channel is not lost.
    const float pan = event_.pan;
    const float narrow = 0.5f * (pan < 0.0f ? -pan : pan);
    float pan_left, pan_right;
    kit::pan_gains(pan, &pan_left, &pan_right);
    pan_left *= gain * kSqrtTwo;
    pan_right *= gain * kSqrtTwo;
    reader.ll = pan_left * (1.0f - narrow);
    reader.lr = pan_left * narrow;
    reader.rl = pan_right * narrow;
    reader.rr = pan_right * (1.0f - narrow);

    // Calm darkens every fragment; Decay darkens each repeat further.
    const float sr = sample_rate();
    cutoff *= kOpenHz * std::pow(kCalmDarkening, param(glitch::kCalm));
    reader.filtered = cutoff < kBypassHz;
    if (reader.filtered) {
      reader.pole = std::exp(-kit::kTwoPi * kit::clamp(cutoff, kFloorHz, 0.45f * sr) / sr);
    }
    current_ = slot;
    segment_left_ = static_cast<long>(length);
    return reader;
  }

  static constexpr float kSqrtTwo = 1.41421356f;
  static constexpr float kLongestFadeSeconds = 0.08f;
  static constexpr float kOpenHz = 20000.0f;
  static constexpr float kCalmDarkening = 0.2f;   // Calm 1: a 4 kHz, 12 dB per octave low-pass
  static constexpr float kBypassHz = 18000.0f;
  static constexpr float kFloorHz = 300.0f;
  static constexpr float kStopFadeRate = 0.12f;   // tape speed under which a stopping tape fades out

  // A slice has ended with nothing playing (or an event just has): roll for
  // the next event. Nothing is rolled once the ring within reach is silent.
  void boundary() {
    using namespace glitch;
    const long wait = static_cast<long>(slice_);
    if (quiet_ < lookback_) {
      ++boundaries_;
      const float roll = rng_.uniform();
      const float pick = rng_.uniform();
      const float weights[4] = {param(kRepeat), param(kSkip), param(kReverse), param(kSlow)};
      const float total = weights[0] + weights[1] + weights[2] + weights[3];
      if (total > 0.0f && roll < param(kChance)) {
        float at = pick * total;
        int choice = 0;
        while (choice < 3 && at >= weights[choice]) at -= weights[choice++];
        while (weights[choice] <= 0.0f) choice = (choice + 3) & 3;  // rounding landed on an empty slot
        begin_event(choice);
        return;
      }
    }
    // Back to the input, with a fade that is over before the next slice ends.
    if (current_ >= 0) {
      const float fade = kit::min(kit::min(fade_length(), 0.5f * readers_[current_].length),
                                  static_cast<float>(wait - 2));
      release_current(std::floor(fade));
    }
    until_boundary_ = wait;
  }

  // 1 with probability 1 - Octaves, else 2 or 0.5.
  float octave_rate() {
    const float roll = rng_.uniform();
    const float side = rng_.uniform();
    if (roll >= param(glitch::kOctaves)) return 1.0f;
    return side < 0.5f ? 2.0f : 0.5f;
  }

  void begin_event(int choice) {
    using namespace glitch;
    const float sr = sample_rate();
    const long long now = ring_.written() - 1;
    event_ = Event();
    event_.active = true;
    event_.slice = slice_;
    ++events_;

    // Most events land well off centre, so Spread is heard on each of them.
    const float side = rng_.bipolar();
    const float depth = rng_.uniform();
    event_.pan = param(kSpread) * (side < 0.0f ? -1.0f : 1.0f) * (0.35f + 0.65f * depth);

    const int most = kit::clamp_int(static_cast<int>(kMaxEventSeconds * sr / slice_), 1, kMaxRepeats);
    switch (choice) {
      case 0: {
        // One to eight repeats, few more likely than many (weight 1/n).
        event_.kind = kRepeating;
        event_.source = now - static_cast<long long>(slice_);
        float total = 0.0f;
        for (int n = 1; n <= most; ++n) total += 1.0f / static_cast<float>(n);
        float at = rng_.uniform() * total;
        int count = 1;
        while (count < most && at >= 1.0f / static_cast<float>(count)) {
          at -= 1.0f / static_cast<float>(count);
          ++count;
        }
        // A bounce needs a few repeats to be heard as one.
        const float bounce = param(kBounce);
        event_.shrink = 1.0f - kBounceDepth * bounce;
        count += static_cast<int>(3.0f * bounce + 0.5f);
        event_.count = kit::clamp_int(count, 1, kMaxRepeats);
        break;
      }
      case 1: {
        // A fragment of 20 to 120 ms from somewhere in the last slice, three
        // to ten times over.
        event_.kind = kSkipping;
        event_.fragment = std::floor(kSkipShortest * std::pow(kSkipRange, rng_.uniform()) * sr);
        const float many = rng_.uniform();
        const int room = static_cast<int>(kMaxEventSeconds * sr / event_.fragment);
        event_.count = kit::clamp_int(3 + static_cast<int>(8.0f * many * many), 1, room);
        event_.rate = octave_rate();
        const float span = event_.fragment * event_.rate;
        const float back = kit::max(span, event_.fragment) + rng_.uniform() * slice_ + 2.0f;
        event_.source = now - static_cast<long long>(back);
        break;
      }
      case 2:
        event_.kind = kReversing;
        event_.count = 1;
        break;
      default: {
        const float which = rng_.uniform();
        const float longer = rng_.uniform();
        event_.kind = which < 0.5f ? kHalfSpeed : kTapeStop;
        // Two slices long now and then, when that is not an age.
        event_.count = (slice_ <= sr && longer < 0.4f) ? 2 : 1;
        break;
      }
    }
    next_segment();
  }

  // Start the event's next fragment, or end the event and roll again.
  void next_segment() {
    using namespace glitch;
    const float sr = sample_rate();
    const long long now = ring_.written() - 1;
    const float decay = param(kDecay);
    const int index = event_.index;
    const bool more = event_.kind == kRepeating || event_.kind == kSkipping ? index < event_.count : index < 1;
    if (!more) {
      event_.active = false;
      boundary();
      return;
    }
    const float step = static_cast<float>(index);
    const bool from_input = current_ < 0;
    switch (event_.kind) {
      case kRepeating: {
        float length = event_.slice * std::pow(event_.shrink, step);
        length = std::floor(kit::clamp(length, kit::min(kShortestRepeat * sr, event_.slice), event_.slice));
        if (event_.part == 0) event_.rate = octave_rate();
        const float gain = std::pow(10.0f, -kRepeatFade * decay * step);
        const float cutoff = std::pow(0.5f, decay * step);
        const double from = static_cast<double>(event_.source);
        if (event_.rate == 2.0f) {
          // Twice as fast, so twice over: the repeat still takes its time.
          const float half = std::floor(0.5f * length);
          start_fragment(from, 2.0f, event_.part == 0 ? half : length - half, gain, cutoff);
          if (++event_.part == 2) {
            event_.part = 0;
            ++event_.index;
          }
        } else {
          start_fragment(from, event_.rate, length, gain, cutoff);
          ++event_.index;
        }
        break;
      }
      case kSkipping: {
        const float gain = std::pow(10.0f, -kSkipFade * decay * step);
        const float cutoff = std::pow(0.5f, kSkipDarkening * decay * step);
        start_fragment(static_cast<double>(event_.source), event_.rate, event_.fragment, gain, cutoff);
        ++event_.index;
        break;
      }
      case kReversing:
        start_fragment(static_cast<double>(now - 1), -1.0f, event_.slice, 1.0f, 1.0f);
        ++event_.index;
        break;
      case kHalfSpeed: {
        // Starts on the input and falls to half speed; Calm sets how fast.
        const float length = event_.slice * static_cast<float>(event_.count);
        Reader& reader = start_fragment(static_cast<double>(now - 2), 1.0f, length, 1.0f, 1.0f);
        reader.mode = kHalfSpeed;
        reader.linear_in = from_input;
        reader.glide = 0.5f;
        reader.glide_coeff = std::exp(-1.0f / kit::max(1.0f, 0.5f * fade_length()));
        ++event_.index;
        break;
      }
      default: {
        // Slows to a stop over the slice, then spins back up in a third of it.
        const float stop = event_.slice * static_cast<float>(event_.count);
        const float spin = std::floor(kSpinUp * stop);
        Reader& reader = start_fragment(static_cast<double>(now - 2), 1.0f, stop + spin, 1.0f, 1.0f);
        reader.mode = kTapeStop;
        reader.linear_in = from_input;
        reader.stop_length = stop;
        reader.spin_length = kit::max(1.0f, spin);
        ++event_.index;
        break;
      }
    }
  }

  static constexpr float kBounceDepth = 0.45f;     // Bounce 1: each repeat 0.55 of the last
  static constexpr float kShortestRepeat = 0.008f;
  static constexpr float kRepeatFade = 0.3f;       // Decay 1: -6 dB and an octave darker per repeat
  static constexpr float kSkipFade = 0.12f;        // and -2.4 dB, a third of an octave per stuck loop
  static constexpr float kSkipDarkening = 0.35f;
  static constexpr float kSkipShortest = 0.020f;
  static constexpr float kSkipRange = 6.0f;        // up to 120 ms
  static constexpr float kSpinUp = 0.3f;


  static constexpr float kLookbackSeconds = 0.3f;

  Ring ring_;
  float half_band_[Ring::kHalfTaps] = {};
  kit::Rng rng_;
  kit::Smoother mix_;
  Reader readers_[2];
  Event event_;
  int current_ = -1;          // the reader playing the newest fragment, or -1
  bool dormant_ = true;
  long quiet_ = 0;            // samples since the last one that was not zero
  long lookback_ = 0;         // how far back a new event can reach
  float slice_ = 12000.0f;    // Time in samples
  long until_boundary_ = 0;   // samples until the next slice ends (no event playing)
  long segment_left_ = 0;     // samples until the next fragment starts (event playing)
  long events_ = 0;
  long boundaries_ = 0;
};

}  // namespace livemix
