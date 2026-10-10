#pragma once

// Feedback: a string, a pickup, an amplifier and a speaker pointed back at
// the string.
//
//   per key (up to 12):
//
//     pluck, hum ──────────────────────────────┐
//                                              ▼
//     string ──► v ───────────────────────────(+)──► y ──► string
//                                              ▲
//         y, the last period and a half        │
//          └─► band on one overtone ─► saturator ─► × what the limiter gives
//
//     y ─► amplifier (the same clip, against the string's size) ─► left,
//     and a fraction of a cycle later ─► right
//
//   all keys, left and right ─► DC blocker ─► volume ─► soft clip ─► out
//
// - The string is a delay loop with its own loss (FeedbackString): plucked
//   and left alone it rings for a few seconds and darkens as it dies.
// - The band is what the speaker's place in the room does: it favours one
//   overtone of the note (Distance, 1 to 8, anywhere between). It is fifteen
//   taps of the string itself, a sixteenth of a period apart and centred one
//   whole period back, so at every overtone it has no phase at all and the
//   feedback cannot pull the string off its pitch (a resonant filter here
//   pulled low notes tens of cents). Its mean is taken out, so it has no
//   gain at 0 Hz either.
// - The feedback is set against what the string loses: Gain at one half
//   gives back exactly what the overtone that sings loses in a trip round,
//   so below it a note dies (more slowly as Gain rises) and above it the
//   overtone grows until the limiter holds it.
// - The limiter holds each string at a level: its size (its mean over
//   exactly one period, so it carries no ripple at the note's pitch) against
//   the level its key asked for. Over the level it is given less than it
//   loses, under it more, and far under it much more, so a held note finds
//   its level again whatever took it away (a new overtone, a louder
//   neighbour gone). Bloom opens that level after the key and Release closes
//   it: a held note swells and sinks along those curves at every pitch.
// - Crowd makes the limiter see, for each string, less of the string itself
//   and more of all the strings together. The held strings then settle at
//   sizes that stand to one another as their strengths taken to a power:
//   1 at Crowd 0 (each by itself), about 3 at the middle (a leader, the
//   others under it), without end at the top (one string has it all). The
//   sum falls from all of them to one string's worth as Crowd rises.
//   Whatever Crowd says, all the strings together may only come to so much
//   (kCeiling).
// - The saturator in the loop is a soft clip scaled to pass a tone at the
//   string's level unchanged in size whatever Grit is: Grit sets how square
//   it comes out, and the string rings on the odd overtones of what it is
//   fed. What is heard is the string through a second clip of the same
//   kind, driven against the size the string has now, so Grit is a shape
//   and never a level.
// - Wander drifts each key's favoured overtone and its hold on the shared
//   amplifier (its strength, for Crowd), slowly and each on its own path, so
//   overtones take over from one another inside a note and notes from one
//   another inside a chord.
// - Key up: the feedback lets go over the Release time and a hand comes
//   down on the string when Release is shorter than its own ring.
// - Each string is heard as it is on the left and a fraction of a cycle
//   later on the right (Width), a little to one side of the middle. Keys
//   pressed together are picked a little over a millisecond apart, and a
//   pick is smaller the more the amplifier already carries.
//
// Pick and the key's strength are read when a string starts; everything
// else reaches held notes on the control clock or is smoothed. The
// instrument sleeps when no string sounds.

#include "../../kit/kit.h"
#include "feedback_string.h"
#include "params.gen.h"

namespace livemix {

class Feedback : public kit::DeviceBase<feedback::kNumParams> {
 public:
  static constexpr int kMaxVoices = 12;
  // 27 Hz at 96 kHz is 3556 samples, and the band reads 1.44 periods back.
  using String = FeedbackString<8192>;

  void init(float sample_rate) {
    using namespace feedback;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) {
      pool_.voices[v].clear();
      pool_.voices[v].index = v;
    }
    for (int c = 0; c < 2; ++c) {
      dc_[c].reset();
      dc_[c].set_cutoff(8.0f, sr);
    }
    tick_rate_ = sr / static_cast<float>(kControlPeriod);
    ratio_.set_time(0.02f, tick_rate_);
    crowd_.set_time(0.02f, tick_rate_);
    amp_.set_time(0.02f, tick_rate_);
    distance_.set_time(0.03f, tick_rate_);
    wander_.set_time(0.03f, tick_rate_);
    width_.set_time(0.02f, tick_rate_);
    damp_.set_time(0.03f, tick_rate_);
    volume_.set_time(kSmoothingSeconds, sr);
    hum_ = kHum * std::sqrt(sr / 48000.0f);
    attack_ = kit::time_to_coeff(0.001f, sr);
    width_applied_ = -1.0f;
    steal_step_ = 1.0f / kit::max(2.0f, std::floor(kStealSeconds * tick_rate_ + 0.5f));
    air_ = shared_ = picked_ = 0.0f;
    fit_ = 1.0f;
    chunk_left_ = 0;
    together_ = 0;
    idle_.reset(sr, 0.1f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    restart();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, kLowestHz, kit::min(kHighestHz, 0.11f * sample_rate()));
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    // Nothing sounds: whatever moved in the silence has arrived, and the
    // clock starts with the note, at any block size.
    if (pool_.count_active() == 0) restart();

    const int held = pool_.find_held(note_id);
    if (held >= 0) {
      Voice& again = pool_.voices[held];
      if (again.pending) {
        // Struck again before it could start: the waiting note is this one.
        again.next_hz = frequency;
        again.next_gain = gain;
        return;
      }
      again.released = true;  // a key struck again while held
      again.choke = true;
    }
    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    if (stolen) {
      // The old note fades over 2 ms, then this one starts (see render).
      voice.pending = true;
      voice.released = false;
      voice.next_hz = frequency;
      voice.next_gain = gain;
      voice.fresh = level_for(gain);
    } else {
      start(voice, frequency, gain, true);
    }
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held < 0) return;
    Voice& voice = pool_.voices[held];
    if (voice.pending) {
      // Released before its stolen start: it never sounds.
      voice.pending = false;
      voice.choke = true;
    }
    voice.released = true;
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (frames > 0) together_ = 0;
    if (!idle_.wake(pool_.count_active() > 0)) {
      silence_output(frames);
      return;
    }
    clear_input(frames);  // an instrument ignores its input
    int done = 0;
    while (done < frames) {
      if (chunk_left_ == 0) {
        control();
        chunk_left_ = kControlPeriod;
      }
      const int n = frames - done < chunk_left_ ? frames - done : chunk_left_;
      float left[kControlPeriod] = {}, right[kControlPeriod] = {};
      bool any = false;
      for (int v = 0; v < kMaxVoices; ++v) {
        if (!pool_.voices[v].sounding) continue;
        render(pool_.voices[v], n, left, right);
        any = true;
      }
      if (!any) {
        // The last string has stopped (under -128 dB): exact silence from
        // this tick of the control clock on, not from whichever block the
        // host happens to be in when the instrument falls asleep.
        dc_[0].reset();
        dc_[1].reset();
      }
      for (int i = 0; i < n; ++i) {
        const float volume = kOutputGain * volume_.next();
        out_left_[done + i] = any ? kit::soft_clip(dc_[0].process(left[i]) * volume) : 0.0f;
        out_right_[done + i] = any ? kit::soft_clip(dc_[1].process(right[i]) * volume) : 0.0f;
      }
      chunk_left_ -= n;
      done += n;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr int kControlPeriod = 32;
  static constexpr int kTaps = 15;        // the band: taps -7 to 7
  static constexpr int kTapsPerPeriod = 16;
  static constexpr float kBandPoints = 12.0f;
  static constexpr int kMaxBandEvery = 4;
  static constexpr float kLowestHz = 27.0f;
  static constexpr float kHighestHz = 4300.0f;
  // The size a string is held at, at full velocity.
  static constexpr float kLevel = 0.25f;
  // Gain at 1: this many times what the favoured overtone loses.
  static constexpr float kMaxRatio = 8.0f;
  // The most that comes back in one trip round, whatever the limiter asks.
  static constexpr float kMaxFeedback = 1.0f;
  // The most all the strings' sizes may add up to. Past it the levels the
  // held strings ask for are scaled to fit, each keeping its share, so a new
  // key still comes up among twelve; and nothing is given at all that would
  // take the sum past kCeilingRoom times it (picks, and strings on their
  // way down).
  static constexpr float kCeiling = 1.5f;
  static constexpr float kCeilingRoom = 1.15f;
  // Crowd: how sharply the strings' shares follow their strengths. A string
  // sits (its strength over the leader's) to the power kCrowdSlope * Crowd /
  // (1 - Crowd)^kCrowdBend under the leader, so the middle of the knob is a
  // leader with the others under it and only the very top is all to one.
  static constexpr float kCrowdSlope = 3.2f;
  static constexpr float kCrowdBend = 0.317f;
  // Wander at 1: overtones either way, and octaves by which a string's hold
  // on the amplifier leans (at Crowd 0, where it changes nothing; see
  // lean_of_shares).
  static constexpr float kWanderOvertones = 2.5f;
  static constexpr float kWanderShare = 2.65f;
  static constexpr float kShareKnee = 2.0f;
  static constexpr float kShareLeast = 0.12f;
  static constexpr float kWanderHz = 0.07f;
  static constexpr float kSlowestDrift = 0.4f;
  // A string under this size counts as this size against the others.
  static constexpr float kFaint = 1.0e-6f;
  // The string alone: seconds to -60 dB at 110 Hz, less for higher notes.
  static constexpr float kRingSeconds = 3.2f;
  static constexpr float kHighHz = 3000.0f;
  // No overtone above this is favoured: high notes sing on themselves.
  static constexpr float kTopHz = 5000.0f;
  static constexpr float kMaxSharpCents = 2.0f;
  // Saturator drive at Grit 0 and 1, in units of the string's level.
  static constexpr float kDriveClean = 0.1f;
  static constexpr float kDriveTorn = 8.0f;
  // The hum, at 48 kHz and kHumHz: lower strings get more, as the square
  // root of their length, so every overtone of every string starts from the
  // same level and a low note comes out of the hum as soon as a high one.
  static constexpr float kHum = 6.0e-5f;
  static constexpr float kHumHz = 220.0f;
  // The band is drawn again once the favoured overtone has moved this far.
  static constexpr float kRedraw = 0.01f;
  // An overtone the band passes less than this share of (of the window's
  // sum, where a centred one passes half) is not one it can hold.
  static constexpr float kLeastPassed = 0.05f;
  static constexpr float kAmpRoom = 0.06f;
  // The amplifier follows the string's size down to this share of its level.
  static constexpr float kAmpFloor = 0.3f;
  // The pluck's size at Pick 1, against the level the string is held at.
  static constexpr float kPickLevel = 1.6f;
  // The sizes already asked of the amplifier at which a pick is halved, and
  // how long a pick counts against the next ones.
  static constexpr float kPickRoom = 1.0f;
  static constexpr float kPickSeconds = 0.05f;
  static constexpr float kStrumSeconds = 0.0012f;
  static constexpr float kStealSeconds = 0.002f;
  static constexpr float kChokeSeconds = 0.03f;
  static constexpr float kSilence = 4.0e-7f;
  static constexpr float kHoldGone = 1.0e-9f;
  // The string's offset is taken out over this long: four periods, or 20 ms
  // for the strings shorter than that.
  static constexpr float kSettlePeriods = 4.0f;
  static constexpr float kSettleSeconds = 0.02f;
  // Right is this share of the favoured overtone's cycle behind left.
  static constexpr float kSideCycles = 0.1f;
  // Where each string sits at Width 1: the outermost is 6 dB louder on its
  // own side, so a key by itself is never badly lopsided.
  static constexpr float kPan[kMaxVoices] = {-0.15f, 0.15f, -0.33f, 0.33f, -0.07f, 0.07f,
                                             -0.26f, 0.26f, -0.4f,  0.4f,  -0.2f,  0.2f};
  // One key at gain 0.7 peaks near -21 dBFS at the default volume.
  static constexpr float kOutputGain = 0.7f;

  struct Voice {
    String string;
    kit::PluckExciter pluck;
    kit::Rng rng;
    kit::Drift drift_overtone, drift_gain;
    float hz = 110.0f;
    float target = kLevel;       // where the follower is held, from velocity
    float need = 0.0f;           // what the overtone that sings loses in a trip round
    float share = 1.0f;          // Wander: this string's hold on the amplifier, about 1
    float drift = 0.0f;          // Wander: where its favoured overtone has drifted, -1 to 1
    float hum = 0.0f;            // the amplifier's hum into this string
    float follow = 0.0f;         // peak follower: is it sounding, how loud for stealing
    // Two running sums over the last whole period, each sample added as it
    // comes and taken off as it leaves. In doubles: in floats the rounding
    // of a minute of loud string stayed in them for good, and the offset it
    // left in `sum` was fed to a released string for ever (one low string
    // at 96 kHz never ended).
    double mean = 0.0;           // of |string|: its size
    double sum = 0.0;            // of the string: its offset
    float settle = 0.0f;         // how much of that offset is taken out of each sample
    float size = 0.0f;           // the string's amplitude from that sum, on the control clock
    int whole_period = 64;
    float follow_release = 0.0f;
    float fresh = 0.0f;          // loudness reported until the follower has seen the note
    float overtone = -1.0f;      // what the band is drawn for
    float max_overtone = 8.0f;
    float max_pole = 0.98f;
    // What comes back from the amplifier, worked out every few samples.
    float shaped = 0.0f, shaped_step = 0.0f;
    int band_every = 1, band_left = 0;
    int tap_delay[kTaps] = {};
    float tap_weight[kTaps] = {};
    float feedback = 0.0f, feedback_step = 0.0f;
    float bloom = 0.0f;          // 0 at the key, towards 1
    float hold = 1.0f;           // 1 while held, to 0 after key up
    float extra = 1.0f;          // the hand on the string at key up
    float side = 0.0f, side_step = 0.0f;
    // The amplifier as it is heard: gain into the clip, and out of it to each side.
    float amp_into = 1.0f, amp_left = 0.0f, amp_right = 0.0f;
    float amp_into_step = 0.0f, amp_left_step = 0.0f, amp_right_step = 0.0f;
    float pan_left = 0.7f, pan_right = 0.7f;
    float steal = 1.0f;
    float next_hz = 0.0f, next_gain = 0.0f;
    float ring = 0.0f, ring_high = 0.0f;  // what the string was last set to
    int pluck_wait = 0;
    int index = 0;
    bool sounding = false, released = false, pending = false, choke = false;

    void clear() {
      string.reset();
      pluck.stop();
      follow = fresh = size = 0.0f;
      mean = sum = 0.0;
      overtone = -1.0f;
      feedback = feedback_step = shaped = shaped_step = 0.0f;
      band_every = 1;
      band_left = 0;
      bloom = 0.0f;
      hold = extra = steal = 1.0f;
      side = side_step = amp_into_step = amp_left_step = amp_right_step = 0.0f;
      sounding = released = pending = choke = false;
    }

    bool active() const { return sounding; }
    bool releasing() const { return released; }
    float level() const { return follow > fresh ? follow : fresh; }
  };

  static float level_for(float gain) { return kLevel * (0.4f + 0.6f * gain); }

  // A string starts: silent, then the pluck (if any) and the hum.
  // `strummed`: it is a key just pressed, picked after the others pressed
  // with it; a note that waited for a stolen string has waited already.
  void start(Voice& voice, float hz, float gain, bool strummed) {
    using namespace feedback;
    const float sr = sample_rate();
    voice.clear();
    voice.hz = hz;
    voice.target = level_for(gain);
    voice.fresh = voice.target;
    voice.sounding = true;
    voice.max_overtone = kit::clamp(kTopHz / hz, 1.0f, 8.0f);
    // The string's loss filter may put the highest overtone the feedback can
    // favour no more than two cents off the note's harmonic: the low-pass's
    // delay falls by about w² a (1 + a) / (6 (1 - a)³) samples at w.
    {
      const float period = sr / hz;
      const float w = kit::kTwoPi * voice.max_overtone / period;
      const float most = kMaxSharpCents / 1731.0f * period * 6.0f / (w * w);
      float lo = 0.0f, hi = 0.98f;
      for (int i = 0; i < 16; ++i) {
        const float mid = 0.5f * (lo + hi);
        const float one = 1.0f - mid;
        if (mid * (1.0f + mid) < most * one * one * one) {
          lo = mid;
        } else {
          hi = mid;
        }
      }
      voice.max_pole = lo;
    }
    voice.whole_period = static_cast<int>(sr / hz + 0.5f);
    voice.settle = 1.0f / kit::max(kSettlePeriods * static_cast<float>(voice.whole_period), kSettleSeconds * sr);
    voice.follow_release = kit::time_to_coeff(kit::clamp(3.0f / hz, 0.01f, 0.12f), sr);
    voice.ring = kRingSeconds * kit::clamp(std::sqrt(110.0f / hz), 0.3f, 1.5f);
    voice.ring_high = 0.0f;
    const uint32_t seed = 0x7F4A7C15u + 7919u * static_cast<uint32_t>(voice.index) +
                          static_cast<uint32_t>(hz * 64.0f) * 2654435761u;
    voice.rng.seed(seed);
    voice.drift_overtone.seed(seed ^ 0x51ED270Bu);
    // A low string answers more slowly, and its overtone drifts more slowly
    // too: every note has time to find the next overtone before it lets go
    // of the last.
    voice.drift_overtone.set_rate(kWanderHz * kit::clamp(std::sqrt(hz / kHumHz), kSlowestDrift, 1.0f), tick_rate_);
    voice.drift_gain.seed(seed ^ 0x2545F491u);
    voice.drift_gain.set_rate(kWanderHz * 0.73f, tick_rate_);
    voice.hum = hum_ * std::sqrt(kHumHz / hz);
    wander(voice);
    const float pick = param(kPick);
    if (pick > 0.0f) {
      // A harder key and a brighter string get a sharper pick.
      const float pick_hz = 500.0f * std::pow(10.0f, 1.0f - damp_.target) * (0.5f + gain);
      // The pick is heard through the same amplifier: the more the strings
      // already ask of it (those sounding, and those picked in the last
      // moments), the less this one is given, so ten keys picked hard
      // together come to a few times one and not to ten.
      const float size = kPickLevel * pick * voice.target * kPickRoom / (kPickRoom + air_ + picked_);
      picked_ += size;
      voice.pluck.strike(size, hz, pick_hz, 0.1f, sr);
      // Keys pressed together are picked one after another, as a hand
      // would: ten picks on one sample add up to ten times one. A key by
      // itself is picked at once, whichever string it lands on.
      voice.pluck_wait = 0;
      if (strummed) {
        voice.pluck_wait = static_cast<int>(kStrumSeconds * sr) * together_;
        if (together_ < kMaxVoices - 1) ++together_;
      }
    }
    steer(voice, true);
  }

  // `n` samples of one string, inside one control period: everything that
  // moves over the period is a ramp set by steer().
  void render(Voice& voice, int n, float* left, float* right) {
    String& string = voice.string;
    // The saturator in the loop, in units of this string's level.
    const float into_loop = amp_.value / voice.target;
    const float out_of_loop = voice.target / tone_gain(amp_.value);
    const float hum = voice.hum * voice.hold;
    float feedback = voice.feedback, side = voice.side, follow = voice.follow;
    double mean = voice.mean, sum = voice.sum;
    const float settle = voice.settle;
    const int whole_period = voice.whole_period;
    float shaped = voice.shaped, shaped_step = voice.shaped_step;
    int band_left = voice.band_left;
    float amp_into = voice.amp_into, amp_left = voice.amp_left, amp_right = voice.amp_right;
    const float feedback_step = voice.feedback_step, side_step = voice.side_step;
    const float into_step = voice.amp_into_step, left_step = voice.amp_left_step, right_step = voice.amp_right_step;
    const float release = voice.follow_release;
    const bool plucking = voice.pluck.active();
    for (int i = 0; i < n; ++i) {
      const float round = string.loop();
      if (band_left == 0) {
        // The band, and the saturator after it, `every` samples from now:
        // the string a whole period before then, read either side of it.
        // Between two such points what comes back moves in a straight line.
        const int every = voice.band_every;
        float band = 0.0f;
        for (int j = 0; j < kTaps; ++j) band += voice.tap_weight[j] * string.at(voice.tap_delay[j] - every);
        const float next = kit::fast_tanh(band * into_loop) * out_of_loop;
        shaped_step = (next - shaped) / static_cast<float>(every);
        band_left = every;
      }
      --band_left;
      // What goes into the string: the amplifier, the hum, and the string's
      // own offset taken out. (A high string's loop loses next to nothing at
      // 0 Hz: the hum and the pick piled up there, the limiter took the
      // offset for sound and a released note never came to rest.) The mean
      // over a whole period has nothing of the note's overtones in it, so
      // this leaves the pitch alone.
      float x = feedback * shaped + hum * voice.rng.bipolar() - settle * static_cast<float>(sum);
      shaped += shaped_step;
      if (plucking) {
        if (voice.pluck_wait > 0) {
          --voice.pluck_wait;
        } else {
          x += voice.pluck.next(voice.rng);
        }
      }
      const float y = round + x;
      string.write(y);

      // Two readings of how large the string is: a peak follower (is it
      // still sounding) and its mean size over exactly one period, which
      // has no ripple at the note's pitch to leak into the feedback.
      const float magnitude = y < 0.0f ? -y : y;
      follow = magnitude + (follow - magnitude) * (magnitude > follow ? attack_ : release);
      const float leaving = string.at(whole_period + 1);
      mean += static_cast<double>(magnitude) - static_cast<double>(leaving < 0.0f ? -leaving : leaving);
      sum += static_cast<double>(y) - static_cast<double>(leaving);

      // What is heard is the amplifier: the string through the same kind of
      // clip, scaled to leave a tone of the string's size as loud as it was.
      left[i] += kit::fast_tanh(y * amp_into) * amp_left;
      right[i] += kit::fast_tanh(string.at_linear(1.0f + side) * amp_into) * amp_right;
      feedback += feedback_step;
      side += side_step;
      amp_into += into_step;
      amp_left += left_step;
      amp_right += right_step;
    }
    voice.feedback = feedback;
    voice.side = side;
    voice.follow = flush_denormal(follow);
    voice.mean = mean;
    voice.sum = sum;
    voice.shaped = shaped;
    voice.shaped_step = shaped_step;
    voice.band_left = band_left;
    voice.amp_into = amp_into;
    voice.amp_left = amp_left;
    voice.amp_right = amp_right;
  }

  // Every 32 samples: the knobs on their way, and each string's feedback,
  // band, hand and place for the next 32.
  void control() {
    using namespace feedback;
    ratio_.next();
    distance_.next();
    wander_.next();
    width_.next();
    damp_.next();
    crowd_.next();
    const float dt = 1.0f / tick_rate_;
    bloom_rate_ = 1.0f - std::exp(-3.0f * dt / param(kBloom));
    hold_coeff_ = std::exp(-6.9f * dt / param(kRelease));  // 60 dB down in the Release time
    choke_coeff_ = std::exp(-6.0f * dt / kChokeSeconds);
    picked_ = flush_denormal(picked_ * std::exp(-dt / kPickSeconds));
    amp_.next();
    top_ = 0.6f * std::pow(0.05f, damp_.value);
    air_ = 0.0f;
    shared_ = 0.0f;
    lean_of_shares();
    float asked = 0.0f;
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.sounding) continue;
      // A tone's mean size is 2/π of its amplitude.
      voice.size = (voice.mean > 0.0 ? static_cast<float>(voice.mean) : 0.0f) * kit::kHalfPi / static_cast<float>(voice.whole_period);
      wander(voice);
      air_ += voice.size;
      shared_ += voice.size * voice.share;
      asked += voice.target * voice.bloom * voice.bloom * voice.hold;
    }
    // What the held strings ask for together (see steer), against the ceiling.
    asked *= std::sqrt(ratio_.value);
    fit_ = ratio_.value > 1.0f && asked > kCeiling ? kCeiling / asked : 1.0f;
    repan_ = width_.value != width_applied_;
    width_applied_ = width_.value;
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (voice.sounding) steer(voice, false);
    }
  }

  // How far a string's hold on the amplifier leans at the most, in octaves:
  // the cube root of Wander, so a little is already heard, and less as Crowd
  // rises, because Crowd raises the power the holds are taken to. Between
  // them a held chord has a leader and the rest some way under it at any
  // Crowd, and only at the very top is the rest left with nothing.
  void lean_of_shares() {
    const float crowd = crowd_.value;
    const float spread = kShareKnee * (1.0f - crowd) / (kShareKnee * (1.0f - crowd) + crowd);
    share_octaves_ = kWanderShare * std::cbrt(wander_.value) * (kShareLeast + (1.0f - kShareLeast) * spread);
  }

  // One step of the slow drifts Wander works with: where the favoured
  // overtone has gone, and how much of the shared amplifier this string has
  // for now. Neither moves the threshold: a note holds or dies by Gain.
  void wander(Voice& voice) {
    const float amount = wander_.value;
    voice.drift = voice.drift_overtone.next();
    const float hold = voice.drift_gain.next();
    voice.share = amount > 0.0f ? std::exp2(share_octaves_ * hold) : 1.0f;
  }

  void steer(Voice& voice, bool snap) {
    using namespace feedback;
    const float sr = sample_rate();
    if (!snap) {
      if (voice.pending) {
        // A stolen string fades over a few ticks, then the new note starts.
        if (voice.steal <= 0.0f) {
          start(voice, voice.next_hz, voice.next_gain, false);
          return;
        }
        voice.steal = kit::max(0.0f, voice.steal - steal_step_);
      } else {
        voice.fresh = 0.0f;  // the follower has the note now
      }
      voice.bloom += (1.0f - voice.bloom) * bloom_rate_;
      if (voice.released) {
        voice.hold *= voice.choke ? choke_coeff_ : hold_coeff_;
        if (voice.hold < kHoldGone) voice.hold = 0.0f;
        if (!voice.pending && voice.follow < kSilence && !voice.pluck.active()) {
          voice.sounding = false;
          return;
        }
      }
    }
    // The string's own ring: Damp takes the top away sooner.
    const float ring = voice.ring;
    const float ring_high = ring * top_;
    if (ring_high != voice.ring_high) {
      voice.ring_high = ring_high;
      voice.string.set(voice.hz, sr, ring, ring_high, kHighHz, voice.max_pole);
      voice.overtone = -1.0f;  // the losses moved: draw the band again
    }
    // Key up: a hand on the string when Release is shorter than its ring.
    if (voice.released) {
      const float wanted = voice.choke ? kChokeSeconds : param(kRelease);
      const float hand =
          wanted < ring ? std::pow(10.0f, -3.0f / voice.hz * (1.0f / wanted - 1.0f / ring)) : 1.0f;
      voice.extra += (hand - voice.extra) * 0.25f;
      voice.string.set_extra(voice.extra);
    }

    const float overtone = kit::clamp(distance_.value + wander_.value * kWanderOvertones * voice.drift, 1.0f,
                                      voice.max_overtone);
    const float moved = overtone - voice.overtone;
    if (snap || moved > kRedraw || moved < -kRedraw) draw(voice, overtone);

    // The limiter. `lift` is how many times its own loss the overtone that
    // sings can be given back (Gain): under 1 the note dies whatever its
    // size, over 1 it grows until what the limiter sees of it is `level`
    // times the root of lift, and is held there. Bloom opens that level
    // after the key (as its square) and Release closes it, so a held note
    // swells and sinks along those two curves at any pitch.
    const float lift = ratio_.value;
    const float bloom3 = voice.bloom * voice.bloom * voice.bloom;
    const float level = voice.target * voice.bloom * voice.bloom * voice.hold * fit_;
    // What the limiter sees of this string. Alone, its own size. With Crowd
    // it leans from its own size towards the size of all the strings
    // together (each weighed by its hold on the amplifier against this
    // one's), in the proportion Crowd gives: the stronger a string, the
    // less the others let it have, and at the very top only the strongest
    // is left. Held strings then settle at sizes that stand to one another
    // as their strengths to a power that rises with Crowd, and their sum
    // falls from all of them to one string's worth.
    float seen = voice.size;
    const float crowd = crowd_.value;
    const float all = shared_ / voice.share;
    if (crowd > 0.0f && all > seen) {
      seen = crowd >= 1.0f ? all
                           : std::exp2((1.0f - crowd) * std::log2(kit::max(seen, kFaint)) +
                                       crowd * std::log2(kit::max(all, kFaint)));
    }
    // Under its level a string that can hold is given more than Gain asks,
    // the more the further over the threshold Gain is: a note that has lost
    // its overtone finds the next one before it is missed, and a note with
    // no pick comes out of the hum as fast as Bloom lets it.
    float most = lift * bloom3;
    if (lift > 1.0f) most = lift * (bloom3 + lift * lift * lift - 1.0f);
    most *= voice.hold;
    // (The fourth power of level over size: a firm hold, so a note that is
    // 3 dB under its level is already given four times its loss.)
    float give = most;
    const float wanted = lift * level * level, size = seen * seen;
    if (wanted * wanted < most * size * size) {
      give = wanted / size;
      give *= give;
    }
    // A string not read yet is not a silent one. On its first tick it has
    // no size, and being given the most for that tick and the next let a
    // high string (several trips round in 64 samples) go round on its own
    // pick: at Gain 1 a top note's pick came out four times its size.
    if (voice.size <= 0.0f) give = 0.0f;
    // One amplifier has only so much to give. The levels asked for are
    // already scaled to fit under the ceiling (fit_); this is for what that
    // cannot see, the picks and the strings still on their way down: a
    // little past the ceiling no string is given more than it loses,
    // whatever Gain and Crowd say. (As a factor on what the limiter gives
    // this was no ceiling at all: the limiter gave more to make up for it.)
    if (air_ > 0.5f * kCeiling) {
      float room = kCeilingRoom * kCeiling / air_;
      room *= room;
      room *= room;
      room *= room;  // the eighth power: a firm ceiling
      if (give > room) give = room;
    }
    const float feedback = kit::min(give * voice.need, kMaxFeedback);

    const float width = width_.value;
    const float side = width * kSideCycles * voice.string.period() / voice.overtone;
    if (snap || repan_) {
      if (width > 0.0f) {
        kit::pan_gains(kPan[voice.index] * width, &voice.pan_left, &voice.pan_right);
      } else {
        voice.pan_left = voice.pan_right = kit::kSqrtHalf;
      }
    }
    // The amplifier as it is heard is driven against the size the string
    // has now, and gives a tone back at the size it came in: Grit sets how
    // square the string comes out and never how loud, so a note that dies,
    // waits or is turned down by the ceiling sounds as far down as it is.
    // (Against a fixed level, ten torn notes each came out full size.) Under
    // a floor the drive stays where it is and a fading note cleans up. It is
    // driven no harder than the favoured overtone leaves room for under
    // half the sample rate.
    const float drive = kit::min(amp_.value, kAmpRoom * sr / (voice.hz * voice.overtone));
    const float against = kit::max(voice.size, kAmpFloor * voice.target);
    const float amp_into = drive / against;
    const float amp_out = against / tone_gain(drive) * voice.steal;
    const float amp_left = amp_out * voice.pan_left, amp_right = amp_out * voice.pan_right;
    if (snap) {
      voice.feedback = feedback;
      voice.side = side;
      voice.amp_into = amp_into;
      voice.amp_left = amp_left;
      voice.amp_right = amp_right;
      voice.feedback_step = voice.side_step = 0.0f;
      voice.amp_into_step = voice.amp_left_step = voice.amp_right_step = 0.0f;
    } else {
      const float inv = 1.0f / static_cast<float>(kControlPeriod);
      voice.feedback_step = (feedback - voice.feedback) * inv;
      voice.side_step = (side - voice.side) * inv;
      voice.amp_into_step = (amp_into - voice.amp_into) * inv;
      voice.amp_left_step = (amp_left - voice.amp_left) * inv;
      voice.amp_right_step = (amp_right - voice.amp_right) * inv;
    }
  }

  // The band for one favoured overtone (it need not be a whole one): a Hann
  // window of cosines over one period, centred a whole period back, with its
  // mean removed. Of the note's whole overtones, the one that sings is the
  // one that gets the most back for what it loses; the band is scaled to pass
  // that one as it is and Gain is measured against its loss. So a note holds
  // or dies by Gain alone wherever the band stands, and as the band moves
  // from one overtone to the next what comes back never jumps: at the place
  // where the two change over both are held alike.
  void draw(Voice& voice, float overtone) {
    voice.overtone = overtone;
    const float period = voice.string.period();
    // Often enough that the favoured overtone has twelve points to a cycle.
    voice.band_every = kit::clamp_int(static_cast<int>(period / (kBandPoints * overtone)), 1, kMaxBandEvery);
    float weight[kTaps], ahead[kTaps];
    float sum = 0.0f, window_sum = 0.0f;
    for (int j = 0; j < kTaps; ++j) {
      const float offset = static_cast<float>(j - kTaps / 2) / static_cast<float>(kTapsPerPeriod);
      const float window = 0.5f + 0.5f * kit::SineTable::cos_lookup(offset);
      weight[j] = window * kit::SineTable::cos_lookup(overtone * offset);
      voice.tap_delay[j] = kit::clamp_int(static_cast<int>(period * (1.0f - offset) + 0.5f), 1, String::kMask - 4);
      // The tap as an overtone meets it: its whole-sample place, not the ideal one.
      ahead[j] = (period - static_cast<float>(voice.tap_delay[j])) / period;
      voice.tap_weight[j] = window;
      sum += weight[j];
      window_sum += window;
    }
    for (int j = 0; j < kTaps; ++j) weight[j] -= voice.tap_weight[j] * sum / window_sum;
    const float w = kit::kTwoPi * voice.hz / sample_rate();
    const int top = static_cast<int>(voice.max_overtone);
    float least = 1.0e9f, passed = 1.0f;
    for (int h = 1; h <= top; ++h) {
      float through = 0.0f;
      for (int j = 0; j < kTaps; ++j) through += weight[j] * kit::SineTable::cos_lookup(static_cast<float>(h) * ahead[j]);
      if (through < kLeastPassed * window_sum) continue;
      const float loss = 1.0f - voice.string.gain_at(w * static_cast<float>(h));
      if (loss < least * through) {
        least = loss / through;
        passed = through;
        voice.need = loss;
      }
    }
    if (least >= 1.0e9f) {
      // Nothing passes (it cannot happen with a window this wide): no feedback.
      voice.need = 0.0f;
    }
    const float scale = 1.0f / passed;
    for (int j = 0; j < kTaps; ++j) voice.tap_weight[j] = weight[j] * scale;
  }

  // No string sounds: a knob moved in the silence has arrived, and the clock
  // starts with the next note whatever the block size.
  void restart() {
    ratio_.snap(ratio_.target);
    distance_.snap(distance_.target);
    wander_.snap(wander_.target);
    width_.snap(width_.target);
    damp_.snap(damp_.target);
    crowd_.snap(crowd_.target);
    volume_.snap(volume_.target);
    amp_.snap(amp_.target);
    lean_of_shares();
    top_ = 0.6f * std::pow(0.05f, damp_.value);
    dc_[0].reset();
    dc_[1].reset();
    air_ = shared_ = picked_ = 0.0f;
    fit_ = 1.0f;
    chunk_left_ = 0;
  }

  // Crowd as the limiter uses it: 0 is every string by itself, 1 is all of
  // them as one. Between, the strings' sizes stand as their strengths to the
  // power 1 / (1 - this).
  static float crowding(float crowd) {
    if (crowd >= 0.9999f) return 1.0f;
    const float power = 1.0f + kCrowdSlope * crowd / std::pow(1.0f - crowd, kCrowdBend);
    return 1.0f - 1.0f / power;
  }

  // The size of the tone a soft clip driven by `drive` returns for a tone of
  // size one (its describing function): `drive` while it is linear, 4/π once
  // it is a square. Within 4 % of the integral for kit::fast_tanh.
  static float tone_gain(float drive) {
    const float square = drive * (kit::kPi * 0.25f);
    return drive / std::sqrt(1.0f + square * square);
  }

  void apply(int id) {
    using namespace feedback;
    const float value = param(id);
    switch (id) {
      case kGain:
        ratio_.set(kMaxRatio * value * value * value, primed());
        break;
      case kDistance:
        distance_.set(value, primed());
        break;
      case kWander:
        wander_.set(value, primed());
        break;
      case kWidth:
        width_.set(value, primed());
        break;
      case kDamp:
        damp_.set(value, primed());
        break;
      case kCrowd:
        crowd_.set(crowding(value), primed());
        break;
      case kGrit:
        amp_.set(kDriveClean * std::pow(kDriveTorn / kDriveClean, value), primed());
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      default:
        break;  // read on the control clock or when a string starts
    }
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::DcBlocker dc_[2];
  kit::Smoother ratio_, distance_, damp_, crowd_, amp_, wander_, width_;  // on the control clock
  kit::Smoother volume_;                           // per sample
  kit::IdleGate idle_;
  float tick_rate_ = 1500.0f;
  float hum_ = 0.0f;
  float steal_step_ = 0.01f;
  float air_ = 0.0f;     // every string's size, summed on the control clock
  float shared_ = 0.0f;  // the same, each weighed by its hold on the amplifier
  float share_octaves_ = 0.0f;
  float picked_ = 0.0f;  // the picks of the last moments, for the next pick's size
  float fit_ = 1.0f;     // what the levels asked for are scaled by to fit under the ceiling
  int chunk_left_ = 0;
  int together_ = 0;  // keys picked since the last sample was rendered
  float attack_ = 0.0f;
  float bloom_rate_ = 1.0f, hold_coeff_ = 0.0f, choke_coeff_ = 0.0f;
  float width_applied_ = -1.0f;
  float top_ = 0.6f;  // the ring of the top of the string over the note's own
  bool repan_ = true;
};

}  // namespace livemix
