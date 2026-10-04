#pragma once

// Echo Memory: an echo beside a one-minute memory of what was played.
//
//   in ─┬──────────────────────────────────────────────────────────► dry ─┐
//       ├─► ping pong ─(+)─► limit ─► echo line ─► tone ─┬─► × Echo ──┐    │
//       │               ▲                                │            (+)─► limit ─► wet ─┴─► out
//       │               └──── feedback ◄─ low cut ◄──────┘            │
//       └─(+)─► memory (16-bit, 68 s) ─► two snippet voices ─► tone ─┬┴─ × Memory
//          ▲                                                         │
//          └────────────── Build Up (-9 dB per generation) ◄──────────┘
//
// - The echo voice is an ordinary feedback delay on its own float line. Time
//   is the distance to the playback head and glides (a 120 ms motor lag, at
//   most two samples a sample) until it lands exactly, so moving it bends
//   the repeats. Tone is a
//   low-pass on the playback, so every repeat is darker than the last; the
//   loop also loses its lows below 70 Hz and is limited (exactly linear up
//   to ±1). Spread records the input on the left and crosses the feedback.
// - The memory is everything that came in, kept for 68 s as 16-bit stereo
//   with TPDF dither (the 16 bits span ±2, behind the echo's limiter, so a
//   note over full scale is rounded like an echo of it, not squared off),
//   at no more than 48 kHz: at 88.2 and 96 kHz it is
//   recorded through a half-band filter at half rate (memory_store.h). A map
//   of the peak level of every 100 ms goes with it.
// - The memory voice is two snippet voices. Every so often (Wander: 20 s
//   down to 0.2 s, each wait jittered ±30 %) it looks for a moment: a 100 ms
//   block between two seconds and Reach ago, chosen with a probability
//   proportional to its level (silence, below -60 dBFS, is never chosen). It
//   plays Size seconds centred there under a raised-cosine window (40 %
//   fade each end), as it was or, with a chance of Vary, backwards (45 %),
//   at half speed (30 %), backwards at half speed (10 %) or at double speed
//   (15 %). Successive moments sit on opposite sides (Spread), and older
//   ones are fainter (down to -8 dB at the end of Reach). A moment is never
//   longer than 1.4 waits, so two voices are always enough, and never longer
//   than the memory it may read.
// - Speeds are exact powers of two and a moment starts on a whole frame, so
//   every read falls on a quarter frame and is reconstructed by a fixed
//   24-tap windowed-sinc kernel; the double-speed read goes through a
//   half-band kernel so nothing above a quarter of the rate folds back.
// - Build Up adds what the memory voice plays (after Tone) to what the memory
//   records, 9.6 dB down, so each generation is quieter and duller.
// - Rest: a moment can start only while something above -60 dBFS lies within
//   Reach, and lasts at most Size, so with Build Up off the output is exact
//   zero within Reach + Size of the input stopping (23 s at the defaults;
//   the echo's own tail is shorter). With Build Up on at most seven
//   generations fit between full scale and -60 dB: 8 x (Reach + Size). The
//   device then sleeps, once the echo line has been blank for its whole
//   length, and wakes with a blank memory: what was played before a sleep is
//   never recalled.

#include "../../kit/kit.h"
#include "memory_store.h"
#include "params.gen.h"

namespace livemix {

class EchoMemory : public kit::DeviceBase<echo_memory::kNumParams> {
 public:
  void init(float sample_rate) {
    using namespace echo_memory;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    // The memory holds at most 48 kHz: above that it is recorded at half rate.
    halved_ = sr > 50000.0f;
    store_rate_ = halved_ ? sr * 0.5f : sr;
    memory_.prepare(store_rate_);
    memory_.clear();
    for (int c = 0; c < 2; ++c) {
      line_[c].clear();
      down_[c].init();
    }
    glide_ = 1.0f - std::exp(-1.0f / (kMotorLagSeconds * sr));
    feedback_.set_time(kSmoothingSeconds, sr);
    echo_level_.set_time(kSmoothingSeconds, sr);
    memory_level_.set_time(kSmoothingSeconds, sr);
    spread_.set_time(kSmoothingSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    build_up_.set_time(0.03f, sr);
    tone_.set_time(0.02f, sr / kControlPeriod);
    rng_.seed(0x3C6EF372u);
    last_recall_ = Recall();
    side_ = 1.0f;
    // The echo line is blank once nothing above the floor has been written
    // for the longest Time plus the motor lag.
    echo_hold_ = static_cast<long>((kParamMax[kTime] * 0.001f + 0.5f) * sr);
    asleep_ = true;
    for (int id = 0; id < kNumParams; ++id) apply(id);
    restart();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json, for a display to draw:
  // 0, how far behind the echo's playback head is now, in milliseconds (Time,
  // or on its way there); then for each of the two memory voices, how many
  // seconds ago the frame it is reading was played (0 while it rests) and
  // how loud it plays it: its window times how much fainter it is for being
  // old, 0..1, below zero while it reads backwards.
  float meter(int index) const {
    if (index == 0) return static_cast<float>(delay_) * 1000.0f / sample_rate();
    if (index < 1 || index > 2 * kNumSnippets) return 0.0f;
    const Snippet& snippet = snippets_[(index - 1) / 2];
    if (!snippet.active) return 0.0f;
    if ((index & 1) == 1) {
      return static_cast<float>(memory_.written() - snippet.position_q / 4) / store_rate_;
    }
    const float window = window_at(static_cast<float>(snippet.index) * snippet.per_length);
    const float fade = std::sqrt(0.5f * (snippet.gain_left * snippet.gain_left +
                                         snippet.gain_right * snippet.gain_right));
    return snippet.step_q < 0 ? -window * fade : window * fade;
  }

  void process(int frames) {
    using namespace echo_memory;
    frames = begin_block(frames);
    const bool excited = input_present(frames);
    if (asleep_) {
      if (!excited) {
        silence_output(frames);
        return;
      }
      asleep_ = false;
      memory_.forget();
      restart();
    }
    const float max_delay = kit::DelayLine<kLineSize>::max_delay() - 8.0f;
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      // A NaN or runaway input must not sit in the memory for a minute.
      if (!(in[0] > -8.0f && in[0] < 8.0f)) in[0] = 0.0f;
      if (!(in[1] > -8.0f && in[1] < 8.0f)) in[1] = 0.0f;
      if (clock_.tick()) control();

      // --- echo voice ---
      // Time is the distance to the playback head: it glides there with a
      // motor's lag, never faster than kMaxSlew, so the repeats bend by at
      // most an octave and a fifth up and never play backwards fast.
      // The position is a double: the lag's last steps are smaller than a
      // float of this size can hold, and the head would stop short of Time.
      if (delay_ != delay_target_) {
        const double gap = static_cast<double>(delay_target_) - delay_;
        const double step = gap * glide_;
        delay_ += step > kMaxSlew ? kMaxSlew : (step < -kMaxSlew ? -kMaxSlew : step);
        if (std::fabs(static_cast<double>(delay_target_) - delay_) < 1.0e-3) delay_ = delay_target_;
      }
      // Whole samples and the fraction are split here, so the read is as
      // fine at four seconds as at fifty milliseconds.
      const double delay = delay_ < 4.0 ? 4.0 : (delay_ > max_delay ? max_delay : delay_);
      const int whole = static_cast<int>(delay);
      const float fraction = static_cast<float>(delay - whole);
      float echo[2];
      for (int c = 0; c < 2; ++c) {
        echo[c] = echo_tone_[c].lowpass(
            kit::hermite(line_[c].read(whole - 1), line_[c].read(whole), line_[c].read(whole + 1),
                         line_[c].read(whole + 2), fraction));
      }
      const float feedback = feedback_.next();
      const float spread = spread_.next();
      const float back[2] = {low_cut_[0].highpass(echo[0]), low_cut_[1].highpass(echo[1])};
      const float send_left = (in[0] + spread * in[1]) * kit::lerp(1.0f, kit::kSqrtHalf, spread);
      const float send_right = in[1] * (1.0f - spread);
      const float record[2] = {
          flush_denormal(limit(send_left + feedback * kit::lerp(back[0], back[1], spread))),
          flush_denormal(limit(send_right + feedback * kit::lerp(back[1], back[0], spread)))};
      line_[0].write(record[0]);
      line_[1].write(record[1]);
      if (record[0] > kFloor || record[0] < -kFloor || record[1] > kFloor || record[1] < -kFloor) {
        echo_blank_ = 0;
      } else if (echo_blank_ < kLongEnough) {
        ++echo_blank_;
      }

      // --- memory voice ---
      float recalled[2] = {0.0f, 0.0f};
      until_next_ -= 1.0f;
      if (until_next_ <= 0.0f) recall();
      for (Snippet& snippet : snippets_) {
        if (!snippet.active) continue;
        float left, right;
        memory_.read(snippet.position_q, snippet.decimate, &left, &right);
        const float window = window_at(static_cast<float>(snippet.index) * snippet.per_length);
        recalled[0] += left * window * snippet.gain_left;
        recalled[1] += right * window * snippet.gain_right;
        snippet.position_q += snippet.step_q;
        if (++snippet.index >= snippet.length) snippet.active = false;
      }
      recalled[0] = memory_tone_[0].lowpass(recalled[0]);
      recalled[1] = memory_tone_[1].lowpass(recalled[1]);

      // --- record into the memory ---
      // What Build Up adds is quieter and duller on every generation, so
      // memories of memories always die away.
      const float build_up = build_up_.next() * kBuildUpGain;
      const float keep[2] = {in[0] + build_up * recalled[0], in[1] + build_up * recalled[1]};
      if (!halved_) {
        remember(keep[0], keep[1]);
      } else if (second_of_pair_) {
        remember(down_[0].down(held_[0], keep[0]), down_[1].down(held_[1], keep[1]));
        second_of_pair_ = false;
      } else {
        held_[0] = keep[0];
        held_[1] = keep[1];
        second_of_pair_ = true;
      }

      const float echo_level = echo_level_.next();
      const float memory_level = memory_level_.next();
      const float wet_left = limit(echo_level * echo[0] + memory_level * recalled[0]);
      const float wet_right = limit(echo_level * echo[1] + memory_level * recalled[1]);
      const float mix = mix_.next();
      if (mix != mix_seen_) {
        mix_seen_ = mix;
        dry_gain_ = kit::SineTable::cos_lookup(0.25f * mix);
        wet_gain_ = kit::SineTable::lookup(0.25f * mix);
      }
      out_left_[i] = in[0] * dry_gain_ + wet_left * wet_gain_;
      out_right_[i] = in[1] * dry_gain_ + wet_right * wet_gain_;
    }
    // Asleep once nothing is coming in, no moment is playing or could still
    // be chosen, the whole echo line is blank and the output has died away.
    bool playing = false;
    for (const Snippet& snippet : snippets_) playing = playing || snippet.active;
    if (!excited && !playing && !recallable() && echo_blank_ > echo_hold_ &&
        output_peak(frames) <= kFloor) {
      asleep_ = true;
    }
  }

  // What the memory voice last chose, for meters and the harness.
  struct Recall {
    int count = 0;              // moments started since init
    float age_seconds = 0.0f;   // how long ago the middle of the moment was played
    float start_age_seconds = 0.0f;  // how long ago the first frame it plays was recorded
    float level = 0.0f;         // how loud the memory was there (peak)
    float seconds = 0.0f;       // how long it plays for
    float speed = 1.0f;
    float gain = 1.0f;          // how much fainter it plays for being old
    bool reversed = false;
  };
  const Recall& last_recall() const { return last_recall_; }
  bool asleep() const { return asleep_; }

 private:
  // 4 s at 96 kHz plus the motor lag's overshoot room.
  static constexpr int kLineSize = 524288;
  // 68.75 s at 48 kHz: the longest Reach plus the longest Size, and a margin.
  static constexpr int kMemoryFrames = 3300000;
  static constexpr long kLongEnough = 1L << 30;
  static constexpr float kFloor = kit::IdleGate::kFloor;
  static constexpr float kMotorLagSeconds = 0.12f;
  // Fastest the echo's playback head moves, in samples per sample.
  static constexpr float kMaxSlew = 2.0f;
  static constexpr float kLowCutHz = 70.0f;
  static constexpr int kControlPeriod = 16;
  static constexpr int kNumSnippets = 2;
  // A moment can be recalled once it is this old: nearer than that is the
  // echo's business.
  static constexpr float kNearestSeconds = 2.0f;
  // Below this (-60 dBFS) a stretch of memory counts as silence: it is never
  // chosen, and it does not keep the device awake.
  static constexpr float kHeard = 0.001f;
  // Louder than this (-12 dBFS) a moment is no likelier to be chosen.
  static constexpr float kLoudEnough = 0.25f;
  // What Build Up records of a recalled moment. With both voices at their
  // loudest on one side (2 x 1.375) the loop gain is still under one.
  static constexpr float kBuildUpGain = 0.33f;
  // Widest pan of a recalled moment (Spread 1), of a full ±1.
  static constexpr float kWidestPan = 0.7f;
  // Share of a moment spent fading in, and again fading out.
  static constexpr float kEdge = 0.4f;
  // Level of a moment recalled from the far end of Reach (-8 dB).
  static constexpr float kOldestGain = 0.4f;
  static constexpr float kRetrySeconds = 0.05f;
  static constexpr float kShortestSeconds = 0.15f;

  struct Snippet {
    bool active = false;
    bool decimate = false;
    long long position_q = 0;  // quarter frames of memory
    int step_q = 4;
    int index = 0;             // output samples played
    int length = 1;
    float per_length = 1.0f;
    float gain_left = 0.0f;
    float gain_right = 0.0f;
  };

  // Seconds between recalled moments: 20 s at Wander 0, 2 s at the centre,
  // five a second at 1.
  static float interval_seconds(float wander) { return 20.0f * std::pow(0.01f, wander); }

  static float window_at(float phase) {
    if (phase < kEdge) return 0.5f - 0.5f * kit::SineTable::cos_lookup(phase * (0.5f / kEdge));
    if (phase > 1.0f - kEdge) {
      return 0.5f - 0.5f * kit::SineTable::cos_lookup((1.0f - phase) * (0.5f / kEdge));
    }
    return 1.0f;
  }

  // The memory takes ±2 and is fed through the echo's limiter: exact up to
  // full scale, rounded above it (kept at ±1 it squared off anything over).
  void remember(float left, float right) {
    memory_.write(limit(left), limit(right));
    if (left > kHeard || left < -kHeard || right > kHeard || right < -kHeard) {
      last_loud_ = memory_.written();
    }
  }

  // True while the memory holds something a moment could still be chosen from.
  bool recallable() const {
    if (last_loud_ < 0 || param(echo_memory::kMemory) <= 0.0f) return false;
    const long long reach =
        static_cast<long long>(param(echo_memory::kReach) * store_rate_) + 2 * memory_.block_frames();
    return memory_.written() - last_loud_ <= reach;
  }

  // The memory voice looks for a moment to bring back. It starts one only
  // when a voice is free and the reachable memory holds sound.
  void recall() {
    using namespace echo_memory;
    const float sr = sample_rate();
    until_next_ = kRetrySeconds * sr;
    if (!recallable()) return;
    Snippet* voice = nullptr;
    for (Snippet& snippet : snippets_) {
      if (!snippet.active) {
        voice = &snippet;
        break;
      }
    }
    if (voice == nullptr) return;

    // What may be read: no newer than kNearestSeconds, no older than Reach,
    // nothing from before the device last woke.
    const long long now = memory_.written();
    const int block = memory_.block_frames();
    const long long newest = now - static_cast<long long>(kNearestSeconds * store_rate_);
    long long oldest = now - static_cast<long long>(param(kReach) * store_rate_);
    const long long first_kept = memory_.valid_from() + echo_memory::Memory<kMemoryFrames>::kGuard;
    if (oldest < first_kept) oldest = first_kept;
    // The oldest frame must still be in the ring when the moment ends (only
    // above 96 kHz can Reach + Size ask for more than the ring holds).
    const long long kept = kMemoryFrames - echo_memory::Memory<kMemoryFrames>::kGuard - 64 -
                           static_cast<long long>(param(kSize) * store_rate_);
    if (oldest < now - kept) oldest = now - kept;
    const long long room = newest - oldest;
    if (room < static_cast<long long>(kShortestSeconds * store_rate_)) return;

    // Choose a 100 ms block, each weighted by how loud it was.
    const long long first_block = (oldest + block - 1) / block;
    const long long last_block = newest / block - 1;
    float total = 0.0f;
    for (long long b = first_block; b <= last_block; ++b) total += weight(memory_.level_at_block(b));
    if (!(total > 0.0f)) return;
    float pick = rng_.uniform() * total;
    long long chosen = last_block;
    for (long long b = first_block; b <= last_block; ++b) {
      const float w = weight(memory_.level_at_block(b));
      if (w <= 0.0f) continue;
      chosen = b;
      pick -= w;
      if (pick < 0.0f) break;
    }

    // How it comes back.
    float speed = 1.0f;
    bool reversed = false;
    const float change = rng_.uniform();
    const float kind = rng_.uniform();
    if (change < param(kVary)) {
      if (kind < 0.45f) {
        reversed = true;
      } else if (kind < 0.75f) {
        speed = 0.5f;
      } else if (kind < 0.85f) {
        speed = 0.5f;
        reversed = true;
      } else {
        speed = 2.0f;
      }
    }

    // How long: Size, but no longer than two voices can cover at this
    // Wander, and no more memory than there is to read.
    const float interval = interval_seconds(param(kWander));
    float seconds = kit::min(param(kSize), 1.4f * interval);
    const float room_seconds = static_cast<float>(room) / (store_rate_ * speed);
    if (seconds > room_seconds) seconds = room_seconds;
    const long long span = static_cast<long long>(seconds * speed * store_rate_);

    // Centre the moment on the chosen block and keep it inside the room.
    const long long centre = chosen * block + static_cast<long long>(rng_.uniform() * block);
    long long from = centre - span / 2;
    if (from > newest - span) from = newest - span;
    if (from < oldest) from = oldest;

    const int step_q = static_cast<int>(4.0f * speed * store_rate_ / sr + 0.5f);
    voice->active = true;
    voice->decimate = step_q == 8;
    voice->step_q = reversed ? -step_q : step_q;
    voice->position_q = 4 * (reversed ? from + span : from);
    voice->index = 0;
    voice->length = static_cast<int>(seconds * sr);
    if (voice->length < 8) voice->length = 8;
    voice->per_length = 1.0f / static_cast<float>(voice->length);
    // Constant power, unity in the centre; successive moments change sides.
    const float pan = side_ * kWidestPan * param(kSpread) * (0.25f + 0.75f * rng_.uniform());
    side_ = -side_;
    kit::pan_gains(pan, &voice->gain_left, &voice->gain_right);
    // Older is fainter: full level for what was just played, kOldestGain
    // for a moment at the far end of Reach. The memory voice therefore
    // thins out as the last sound ages instead of stopping at full level.
    const float age = static_cast<float>(now - centre) / (param(kReach) * store_rate_);
    const float fade = 1.0f - (1.0f - kOldestGain) * kit::clamp(age * age, 0.0f, 1.0f);
    voice->gain_left *= fade * 2.0f * kit::kSqrtHalf;
    voice->gain_right *= fade * 2.0f * kit::kSqrtHalf;
    last_recall_.gain = fade;

    last_recall_.count += 1;
    last_recall_.age_seconds = static_cast<float>(now - centre) / store_rate_;
    last_recall_.start_age_seconds =
        static_cast<float>(now - (reversed ? from + span : from)) / store_rate_;
    last_recall_.level = memory_.level_at_block(chosen);
    last_recall_.seconds = seconds;
    last_recall_.speed = speed;
    last_recall_.reversed = reversed;
    until_next_ = interval * sr * (0.7f + 0.6f * rng_.uniform());
  }

  static float weight(float level) {
    if (level <= kHeard) return 0.0f;
    return level < kLoudEnough ? level : kLoudEnough;
  }

  // Exactly linear up to ±1, never past ±2.
  static float limit(float x) { return 2.0f * kit::soft_clip(0.5f * x); }

  // Everything settled, nothing sounding (init and wake).
  void restart() {
    for (int c = 0; c < 2; ++c) {
      echo_tone_[c].reset();
      memory_tone_[c].reset();
      low_cut_[c].reset();
      low_cut_[c].set_cutoff(kLowCutHz, sample_rate());
      down_[c].reset();
    }
    clock_.reset(kControlPeriod);
    delay_ = delay_target_;
    feedback_.snap(feedback_.target);
    echo_level_.snap(echo_level_.target);
    memory_level_.snap(memory_level_.target);
    spread_.snap(spread_.target);
    mix_.snap(mix_.target);
    build_up_.snap(build_up_.target);
    tone_.snap(tone_.target);
    tone_seen_ = -1.0f;
    mix_seen_ = -1.0f;
    echo_blank_ = 0;
    for (Snippet& snippet : snippets_) snippet.active = false;
    last_loud_ = -1;
    second_of_pair_ = false;
    held_[0] = held_[1] = 0.0f;
    until_next_ = interval_seconds(param(echo_memory::kWander)) * sample_rate() *
                  (0.7f + 0.6f * rng_.uniform());
  }

  void control() {
    using namespace echo_memory;
    const float tone = tone_.next();
    if (tone != tone_seen_) {
      tone_seen_ = tone;
      const float hz = std::exp(tone);
      for (int c = 0; c < 2; ++c) {
        echo_tone_[c].set(hz, 0.6f, sample_rate());
        memory_tone_[c].set(hz, 0.6f, sample_rate());
      }
    }
    // Wander is followed at once instead of after a long wait has run out.
    const float longest = 1.3f * interval_seconds(param(kWander)) * sample_rate();
    if (until_next_ > longest) until_next_ = longest;
  }

  void apply(int id) {
    using namespace echo_memory;
    const float value = param(id);
    // Nothing sounds while asleep, so a value set then has nothing to glide from.
    const bool glide = primed() && !asleep_;
    switch (id) {
      case kTime:
        delay_target_ = value * 0.001f * sample_rate();
        if (!glide) delay_ = delay_target_;
        break;
      case kFeedback:
        feedback_.set(value, glide);
        break;
      case kEcho:
        echo_level_.set(value, glide);
        break;
      case kMemory:
        memory_level_.set(value, glide);
        break;
      case kBuildUp:
        build_up_.set(value >= 0.5f ? 1.0f : 0.0f, glide);
        break;
      case kTone:
        tone_.set(std::log(value), glide);
        break;
      case kSpread:
        spread_.set(value, glide);
        break;
      case kMix:
        mix_.set(value, glide);
        break;
      default:
        break;  // Reach, Wander, Size and Vary are read when a moment is chosen
    }
  }

  echo_memory::Memory<kMemoryFrames> memory_;
  kit::DelayLine<kLineSize> line_[2];
  kit::Halfband2x down_[2];
  kit::Svf echo_tone_[2];
  kit::Svf memory_tone_[2];
  kit::OnePole low_cut_[2];
  kit::Smoother feedback_, echo_level_, memory_level_, spread_, mix_, tone_;
  kit::LinearRamp build_up_;
  kit::ControlClock clock_;
  kit::Rng rng_;
  bool halved_ = false;
  bool asleep_ = true;
  float store_rate_ = 48000.0f;
  float tone_seen_ = -1.0f;
  float mix_seen_ = -1.0f, dry_gain_ = 1.0f, wet_gain_ = 0.0f;
  double delay_ = 24000.0;  // samples to the echo's playback head (double: see process)
  float delay_target_ = 24000.0f, glide_ = 0.0f;
  long echo_blank_ = 0;
  long echo_hold_ = 216000;
  Snippet snippets_[kNumSnippets];
  Recall last_recall_;
  float until_next_ = 0.0f;   // host samples until the memory voice next looks for a moment
  long long last_loud_ = -1;  // memory frame count just after the last frame above kHeard
  float held_[2] = {0.0f, 0.0f};  // first frame of the pair when recording at half rate
  bool second_of_pair_ = false;
  float side_ = 1.0f;         // recalled moments alternate sides
};

}  // namespace livemix
