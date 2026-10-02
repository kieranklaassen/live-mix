#pragma once

// Cascade: little loops of what was just played, stacked at octave (and
// fifth) speeds in a pattern.
//
//   in ─┬──────────────────────────────────────────────────────► dry ─┐
//       └─ L+R ─► DC block ─► ring (x1) ─► half-band ─► ring (x2) ─►   │
//                                half-band ─► ring (x4)                │
//                    slice clock ─► loop voices ─► tone ─► limit ─► wet ┴─► out
//
// - A slice clock of period Time cuts the input into slots. A slot that had
//   sound in it is captured by reference (a position and a length in the
//   ring) and handed to a set of loop voices. A slot that starts in silence
//   waits: it begins at the first sound, so a note is captured from its
//   attack and its replays land exactly on multiples of Time after it.
// - A voice replays its slice in passes. Each pass reads a stretch of the
//   slice at a speed (1/2, 1, 3/2, 2, 3 or 4) under a window, at a place in
//   the stereo field, through a low-pass that closes a little more on every
//   repeat. Everything a pass uses is fixed when the pass starts, at a point
//   where its window is zero, so no control can click.
// - Speeds above 1 would alias. They read copies of the ring decimated by 2
//   and by 4 through half-band filters (kit::Halfband2x), so a x2 or x4 voice
//   reads one stored sample per output sample and what it shifts up was
//   band-limited first.
// - Patterns differ only in the passes they schedule (see schedule()).
// - The capture is mono (the sum of the inputs); the width comes from where
//   the voices are placed. The half-speed voice stays in the centre.
// - When the pool is full the quietest voice fades out over 10 ms.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Cascade : public kit::DeviceBase<cascade::kNumParams> {
 public:
  void init(float sample_rate) {
    using namespace cascade;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (int i = 0; i < kRing0; ++i) ring0_[i] = 0.0f;
    for (int i = 0; i < kRing1; ++i) ring1_[i] = 0.0f;
    for (int i = 0; i < kRing2; ++i) ring2_[i] = 0.0f;
    half_[0].init();
    half_[1].init();
    written_ = kRing0;
    held1_ = 0.0f;
    held2_ = 0.0f;
    dc_.reset();
    dc_.set_cutoff(15.0f, sr);
    for (Voice& voice : voices_) voice = Voice();
    live_ = 0;
    active_ = 0;
    rng_.seed(0xCA5CADE5u);
    guard_ = static_cast<int>(kGuardSeconds * sr);
    preroll_ = static_cast<int>(kPrerollSeconds * sr);
    fade_step_ = 1.0f / (kStealSeconds * sr);
    slice_count_ = 0;
    restart_slots();
    for (int c = 0; c < 2; ++c) tone_[c].reset();
    tone_hz_.set_time(0.01f, sr / kControlPeriod);
    high_.set_time(kSmoothingSeconds, sr);
    low_.set_time(kSmoothingSeconds, sr);
    spread_.set_time(kSmoothingSeconds, sr);
    trim_.set_time(0.02f, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    mix_seen_ = -1.0f;
    clock_.reset(kControlPeriod);
    idle_.reset(sr, 0.05f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void process(int frames) {
    using namespace cascade;
    frames = begin_block(frames);
    const bool was_asleep = idle_.asleep();
    if (!idle_.wake(input_present(frames) || active_ > 0 || slot_has_sound_)) {
      silence_output(frames);
      return;
    }
    // The ring was not written while asleep: a slot must not span the gap.
    if (was_asleep) restart_slots();
    const float sr = sample_rate();
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);

      if (clock_.tick()) {
        const float hz = tone_hz_.next();
        for (int c = 0; c < 2; ++c) tone_[c].set(hz, 0.6f, sr);
        trim_.set_target(wet_trim());
        slot_samples_ = static_cast<long long>(param(kTime) * 0.001f * sr);
      }

      const float x = dc_.process(0.5f * (in[0] + in[1]));
      if (!slot_has_sound_ && (x > kThreshold || x < -kThreshold)) {
        slot_has_sound_ = true;
        if (written_ - preroll_ > slot_begin_) slot_begin_ = written_ - preroll_;
      }
      record(x);
      const long long elapsed = written_ - slot_begin_;
      if (elapsed >= slot_samples_) {
        const float length = static_cast<float>(elapsed - guard_);
        if (slot_has_sound_ && length >= 0.02f * sr) {
          capture(slot_begin_, length, static_cast<float>(elapsed));
        }
        slot_begin_ = written_;
        slot_has_sound_ = false;
      }

      const float role_gain[kNumRoles] = {1.0f, high_.next(), low_.next()};
      const float spread = spread_.next();
      const float trim = trim_.next();
      float mid = 0.0f;
      float side = 0.0f;
      if (active_ > 0) render(role_gain, &mid, &side);
      float wet[2] = {(mid - spread * side) * trim, (mid + spread * side) * trim};
      for (int c = 0; c < 2; ++c) {
        // Linear up to full scale: only a pile-up of loud voices is held.
        wet[c] = 2.0f * kit::soft_clip(0.5f * tone_[c].lowpass(wet[c]));
      }

      const float mix = mix_.next();
      if (mix != mix_seen_) {
        mix_seen_ = mix;
        kit::equal_power(mix, &dry_gain_, &wet_gain_);
      }
      out_left_[i] = in[0] * dry_gain_ + wet[0] * wet_gain_;
      out_right_[i] = in[1] * dry_gain_ + wet[1] * wet_gain_;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  // 21.8 s at 96 kHz: a slice is read for at most kMaxLifeSeconds after it
  // was captured, and is up to 2 s long.
  static constexpr int kRing0 = 1 << 21;
  static constexpr int kRing1 = kRing0 / 2;
  static constexpr int kRing2 = kRing0 / 4;
  static constexpr float kMaxLifeSeconds = 19.0f;
  // Up to kMaxLive voices sound; the rest of the pool holds those fading out
  // after a steal (a slice starts at most kMaxPerSlice voices).
  static constexpr int kMaxLive = 32;
  static constexpr int kMaxPerSlice = 6;
  static constexpr int kMaxVoices = kMaxLive + kMaxPerSlice;
  static constexpr int kControlPeriod = 16;
  // The decimated rings trail the input: sample m of the x2 ring is the
  // input at 2m - 31, sample j of the x4 ring the input at 4j - 93. A slice
  // ends kGuardSeconds before the voices that read it start, so that all of
  // it is in every ring by then.
  static constexpr double kLag1 = 31.0;
  static constexpr double kLag2 = 93.0;
  static constexpr float kGuardSeconds = 0.003f;
  static constexpr float kPrerollSeconds = 0.002f;
  static constexpr float kStealSeconds = 0.01f;
  static constexpr float kAttackSeconds = 0.002f;
  // -60 dBFS: what counts as sound in a slot.
  static constexpr float kThreshold = 0.001f;

  enum Role : int { kMain = 0, kHigh, kLow, kNumRoles };
  enum Pattern : int { kMosaic = 0, kStrum, kTunnel, kSteps };

  struct Voice {
    bool active = false;
    bool fading = false;
    float fade = 1.0f;
    // What it replays, fixed when it starts.
    int pattern = 0;
    int part = 0;
    bool fifths = false;
    bool flip = false;
    double slice_start = 0.0;
    float slice_len = 0.0f;
    float period = 0.0f;
    int repeats = 1;
    float trim = 1.0f;
    // Where it is in its schedule.
    int pass = 0;
    float elapsed = 0.0f;
    // The pass being played.
    int level = 0;
    bool exact = false;
    double position = 0.0;
    double step = 0.0;
    float phase = 0.0f;
    float phase_step = 0.0f;
    float attack = 0.5f;
    float inv_attack = 2.0f;
    float inv_release = 2.0f;
    float shape = 0.5f;
    float gain = 0.0f;
    float pan = 0.0f;
    int role = kMain;
    float lp_a = 0.0f;
    float lp1 = 0.0f;
    float lp2 = 0.0f;
    int remaining = 0;
    int wait = 0;
  };

  void apply(int id) {
    using namespace cascade;
    const float value = param(id);
    switch (id) {
      case kHigh:
        high_.set(value, primed());
        break;
      case kLow:
        low_.set(value, primed());
        break;
      case kSpread:
        spread_.set(value, primed());
        break;
      case kTone:
        tone_hz_.set(value, primed());
        break;
      case kMix:
        mix_.set(value, primed());
        break;
      default:
        break;  // the rest is read when a slice is captured or a pass starts
    }
    if (!primed()) trim_.snap(wet_trim());
  }

  void restart_slots() {
    slot_begin_ = written_;
    slot_has_sound_ = false;
  }

  int repeats() const { return kit::clamp_int(static_cast<int>(param(cascade::kRepeats) + 0.5f), 1, 16); }
  // Gain ratio from one repeat to the next: 0 to -12 dB.
  float repeat_gain() const { return std::exp(-1.3815511f * param(cascade::kDecay)); }

  // Store one input sample in the ring and in its two decimated copies.
  void record(float x) {
    ring0_[written_ & (kRing0 - 1)] = x;
    if (written_ & 1) {
      const long long m = written_ >> 1;
      const float half = half_[0].down(held1_, x);
      ring1_[m & (kRing1 - 1)] = half;
      if (m & 1) {
        ring2_[(m >> 1) & (kRing2 - 1)] = half_[1].down(held2_, half);
      } else {
        held2_ = half;
      }
    } else {
      held1_ = x;
    }
    ++written_;
  }

  static float hermite_at(const float* ring, int mask, double position) {
    const double floored = std::floor(position);
    const long long whole = static_cast<long long>(floored);
    const float t = static_cast<float>(position - floored);
    return kit::hermite(ring[(whole - 1) & mask], ring[whole & mask], ring[(whole + 1) & mask],
                        ring[(whole + 2) & mask], t);
  }

  float read(const Voice& voice) const {
    const float* ring = voice.level == 0 ? ring0_ : (voice.level == 1 ? ring1_ : ring2_);
    const int mask = (kRing0 >> voice.level) - 1;
    if (voice.exact) return ring[static_cast<long long>(voice.position) & mask];
    return hermite_at(ring, mask, voice.position);
  }

  // Work out pass number `voice.pass` of a voice: what stretch of the slice
  // it reads, how fast, how loud, where, and how long until the next pass.
  // False when the voice has nothing left to play.
  bool start_pass(Voice& voice) {
    using namespace cascade;
    const float sr = sample_rate();
    const float period = voice.period;
    const int count = voice.repeats;
    const int k = voice.pass;
    float speed = 1.0f;
    float offset = 0.0f;
    float length = voice.slice_len;
    float grid = period;
    float accent = 1.0f;
    float pan = 0.0f;
    float age = voice.elapsed / period;
    float extra_dark = 0.0f;
    switch (voice.pattern) {
      case kStrum:
        if (!strum_pass(voice, &speed, &length, &grid, &pan)) return false;
        age = static_cast<float>(k);
        break;
      case kTunnel:
        if (!tunnel_pass(voice, &speed, &offset, &length, &pan)) return false;
        grid = length / speed;
        extra_dark = 0.3f;
        break;
      case kSteps:
        if (voice.part == 1) {
          if (k >= (count + 1) / 2) return false;
          speed = 0.5f;
          grid = 2.0f * period;
        } else {
          if (k >= count) return false;
          speed = voice.fifths ? kStepsFifths[k & 7] : kStepsOctaves[k & 3];
          if (speed > 1.0f) pan = ((k & 1) ? 1.0f : -1.0f) * (0.3f + 0.7f * (speed - 1.0f) / 3.0f);
        }
        break;
      case kMosaic:
      default:
        if (!mosaic_pass(voice, &speed, &grid, &accent, &pan)) return false;
        break;
    }
    const float run = length / speed;
    if (voice.elapsed + run > kMaxLifeSeconds * sr) return false;

    voice.role = speed > 1.0f ? kHigh : (speed < 1.0f ? kLow : kMain);
    const float placed = pan * param(kSpread);
    voice.pan = pan;
    voice.gain = std::pow(repeat_gain(), age) * accent * voice.trim / std::sqrt(1.0f + placed * placed);
    // Each repeat is darker: two poles that start open and close by octaves.
    const float octaves = (1.5f * param(kDecay) + extra_dark) * age;
    if (octaves < 0.01f) {
      voice.lp_a = 0.0f;
    } else {
      const float hz = kit::clamp(16000.0f * std::exp2(-octaves), 250.0f, 0.45f * sr);
      voice.lp_a = std::exp(-kit::kTwoPi * hz / sr);
    }

    const bool reversed = rng_.uniform() < param(kReverse);
    voice.level = speed > 2.0f ? 2 : (speed > 1.0f ? 1 : 0);
    const double scale = static_cast<double>(1 << voice.level);
    const double lag = voice.level == 0 ? 0.0 : (voice.level == 1 ? kLag1 : kLag2);
    const double rate = static_cast<double>(speed) / scale;
    const double from = voice.slice_start + offset + (reversed ? length : 0.0f);
    voice.position = (from + lag) / scale;
    voice.step = reversed ? -rate : rate;
    voice.exact = rate == 1.0;
    if (voice.exact) voice.position = std::floor(voice.position + 0.5);

    const long begin = std::lround(voice.elapsed);
    const long next = std::lround(voice.elapsed + grid);
    int samples = static_cast<int>(std::lround(run));
    if (samples > next - begin) samples = static_cast<int>(next - begin);
    if (samples < 8) samples = 8;
    voice.remaining = samples;
    voice.wait = static_cast<int>(next - begin) - samples;
    if (voice.wait < 0) voice.wait = 0;
    voice.phase = 0.0f;
    voice.phase_step = 1.0f / static_cast<float>(samples);
    voice.shape = param(kShape);
    voice.attack = kit::lerp(kit::min(0.5f, kAttackSeconds * sr * voice.phase_step), 0.5f, voice.shape);
    voice.inv_attack = 1.0f / voice.attack;
    voice.inv_release = 1.0f / (1.0f - voice.attack);
    voice.elapsed += grid;
    ++voice.pass;
    return true;
  }

  // Mosaic: every part loops the whole slice at its own speed, back to back,
  // so a x2 part comes round twice and a x4 part four times in one Time.
  // Parts: 0 = x1, 1 = x2, 2 = x4, 3 = x1/2, 4 = x3/2, 5 = x3.
  static constexpr float kMosaicSpeed[6] = {1.0f, 2.0f, 4.0f, 0.5f, 1.5f, 3.0f};
  static constexpr float kPanFour[4] = {-1.0f, 0.4f, -0.4f, 1.0f};
  static constexpr float kAccentFour[4] = {0.6f, 1.0f, 0.8f, 0.9f};
  static constexpr float kPanThree[3] = {0.55f, -0.55f, 0.0f};
  static constexpr float kAccentThree[3] = {0.8f, 1.0f, 0.9f};
  static constexpr float kStepsOctaves[4] = {1.0f, 2.0f, 4.0f, 2.0f};
  static constexpr float kStepsFifths[8] = {1.0f, 1.5f, 2.0f, 3.0f, 4.0f, 3.0f, 2.0f, 1.5f};

  bool mosaic_pass(const Voice& voice, float* speed, float* grid, float* accent, float* pan) const {
    const int k = voice.pass;
    *speed = kMosaicSpeed[voice.part];
    *grid = voice.period / *speed;
    const int passes = voice.part == 3 ? (voice.repeats + 1) / 2
                                       : static_cast<int>(static_cast<float>(voice.repeats) * *speed + 0.5f);
    if (k >= passes) return false;
    switch (voice.part) {
      case 0:
        *pan = (k & 1) ? 0.25f : -0.25f;
        break;
      case 1:
        *pan = (k & 1) ? -0.7f : 0.7f;
        *accent = (k & 1) ? 1.0f : 0.75f;
        break;
      case 2:
        *pan = kPanFour[k & 3];
        *accent = kAccentFour[k & 3];
        break;
      case 4:
        *pan = kPanThree[k % 3];
        *accent = kAccentThree[k % 3];
        break;
      case 5:
        *pan = -1.5f * kPanThree[k % 3];
        *accent = kAccentThree[(k + 1) % 3];
        break;
      default:
        break;  // the half-speed part stays in the centre
    }
    return true;
  }

  // Strum: the first part of the slice, struck once per repeat. The gaps
  // between strokes form a geometric series from Time / 2 down to Time / 8
  // (a bouncing ball) or, for every other slice, the same series backwards.
  // A stroke is cut to the gap it has. Parts: 0 = x1, 1 = above, 2 = x1/2.
  bool strum_pass(const Voice& voice, float* speed, float* length, float* grid, float* pan) const {
    const float sr = sample_rate();
    const int k = voice.pass;
    const int strokes = voice.repeats;
    if (k >= strokes) return false;
    *speed = voice.part == 2 ? 0.5f : (voice.part == 1 ? ((voice.fifths && !(k & 1)) ? 1.5f : 2.0f) : 1.0f);
    const float piece = kit::min(voice.slice_len, kit::clamp(voice.period / 3.0f, 0.03f * sr, 0.25f * sr));
    float run = piece / *speed;
    if (k < strokes - 1) {
      const int gaps = strokes - 1;
      const float longest = 0.5f * voice.period;
      float gap = longest;
      if (gaps >= 2) {
        const int index = voice.flip ? gaps - 1 - k : k;
        gap = longest * std::exp2(-2.0f * static_cast<float>(index) / static_cast<float>(gaps - 1));
      }
      gap = kit::max(gap, 0.012f * sr);
      if (run > gap) run = gap;
      *grid = gap;
    } else {
      *grid = run;
    }
    *length = run * *speed;
    if (voice.part != 2 && strokes > 1) {
      const float across = 2.0f * static_cast<float>(k) / static_cast<float>(strokes - 1) - 1.0f;
      *pan = voice.flip ? -across : across;
    }
    return true;
  }

  // Tunnel: a short piece of the slice, past its attack, looped until
  // Repeats x Time has gone by. Each pass takes in 12 % more of the slice.
  // Parts 0 and 1 are the same loop half a pass apart (part 1's passes are
  // the mean of part 0's neighbours, so it stays half a pass behind): under
  // a full swell they add up to a steady drone. 2 = above, 3 = x1/2.
  bool tunnel_pass(const Voice& voice, float* speed, float* offset, float* length, float* pan) const {
    const int k = voice.pass;
    if (voice.elapsed >= static_cast<float>(voice.repeats) * voice.period) return false;
    *offset = 0.1f * voice.slice_len;
    const float room = voice.slice_len - *offset;
    const float first = tunnel_piece(voice);
    const float grown = first * std::pow(1.12f, static_cast<float>(k));
    float piece = kit::min(grown, room);
    if (voice.part == 1) piece = 0.5f * (piece + kit::min(grown * 1.12f, room));
    *length = piece;
    *speed = voice.part == 3 ? 0.5f : (voice.part == 2 ? (voice.fifths ? 1.5f : 2.0f) : 1.0f);
    *pan = voice.part == 0 ? -0.5f : (voice.part == 1 ? 0.5f : (voice.part == 2 ? ((k & 1) ? 0.8f : -0.8f) : 0.0f));
    return true;
  }

  float tunnel_piece(const Voice& voice) const {
    const float room = 0.9f * voice.slice_len;
    return kit::min(kit::max(0.25f * voice.period, 0.03f * sample_rate()), 0.5f * room);
  }

  float role_level(int role) const {
    return role == kHigh ? high_.value : (role == kLow ? low_.value : 1.0f);
  }

  // Start one part of a slice. With the pool full the quietest voice that
  // has already played makes room (it fades; the oldest goes on a tie).
  void add(int pattern, int part, double start, float length, float period, float trim, int delay) {
    using namespace cascade;
    if (live_ >= kMaxLive) {
      Voice* victim = nullptr;
      float lowest = 1.0e9f;
      for (Voice& voice : voices_) {
        if (!voice.active || voice.fading || voice.pass == 0) continue;
        const float loudness = voice.gain * role_level(voice.role);
        if (loudness < lowest || (loudness == lowest && victim && voice.elapsed > victim->elapsed)) {
          lowest = loudness;
          victim = &voice;
        }
      }
      if (victim) {
        victim->fading = true;
        --live_;
      }
    }
    for (Voice& voice : voices_) {
      if (voice.active) continue;
      voice = Voice();
      voice.active = true;
      voice.pattern = pattern;
      voice.part = part;
      voice.fifths = param(kInterval) > 0.5f;
      voice.flip = (slice_count_ & 1) != 0;
      voice.slice_start = start;
      voice.slice_len = length;
      voice.period = period;
      voice.repeats = repeats();
      voice.trim = trim;
      voice.wait = delay;
      ++live_;
      ++active_;
      return;
    }
  }

  // A slot with sound in it has ended: hand its slice to the pattern.
  void capture(long long start, float length, float period) {
    using namespace cascade;
    const int pattern = kit::clamp_int(static_cast<int>(param(kPattern) + 0.5f), 0, 3);
    const bool fifths = param(kInterval) > 0.5f;
    const bool high = param(kHigh) > 0.001f;
    const bool low = param(kLow) > 0.001f;
    const double at = static_cast<double>(start);
    add(pattern, 0, at, length, period, 1.0f, 0);
    switch (pattern) {
      case kStrum:
        if (high) add(pattern, 1, at, length, period, 1.0f, 0);
        if (low) add(pattern, 2, at, length, period, 1.0f, 0);
        break;
      case kTunnel: {
        Voice probe;
        probe.slice_len = length;
        probe.period = period;
        add(pattern, 1, at, length, period, 1.0f, static_cast<int>(0.5f * tunnel_piece(probe)));
        if (high) add(pattern, 2, at, length, period, 1.0f, 0);
        if (low) add(pattern, 3, at, length, period, 1.0f, 0);
        break;
      }
      case kSteps:
        if (low) add(pattern, 1, at, length, period, 1.0f, 0);
        break;
      default: {
        // With fifths there are four parts above instead of two: each is
        // 3 dB down so High means the same total either way.
        const float each = fifths ? kit::kSqrtHalf : 1.0f;
        if (high) {
          add(pattern, 1, at, length, period, each, 0);
          add(pattern, 2, at, length, period, each, 0);
          if (fifths) {
            add(pattern, 4, at, length, period, each, 0);
            add(pattern, 5, at, length, period, each, 0);
          }
        }
        if (low) add(pattern, 3, at, length, period, 1.0f, 0);
        break;
      }
    }
    ++slice_count_;
  }

  // Wet gain. On held material the generations of every part overlap and add
  // in power; the estimate below is that power relative to the input, and
  // the wet level gives back part of what exceeds kFullPower so that long,
  // slow-fading settings neither swamp the dry signal nor start too quietly.
  float wet_trim() const {
    using namespace cascade;
    const float ratio = repeat_gain();
    const float squared = ratio * ratio;
    const int count = repeats();
    const float generations =
        squared > 0.999f ? static_cast<float>(count)
                         : (1.0f - std::pow(squared, static_cast<float>(count))) / (1.0f - squared);
    const float window = kit::lerp(0.2f, 0.375f, param(kShape));
    const float high = param(kHigh) * param(kHigh);
    const float low = param(kLow) * param(kLow);
    float parts;
    switch (kit::clamp_int(static_cast<int>(param(kPattern) + 0.5f), 0, 3)) {
      case kStrum:
        parts = 0.3f * (1.0f + 0.5f * high + low);
        break;
      case kTunnel:
        parts = 2.0f + high + low;
        break;
      case kSteps:
        parts = 0.25f + 0.35f * high + low;
        break;
      default:
        parts = 1.0f + 1.4f * high + low;
        break;
    }
    const float power = window * generations * parts;
    return kWetLevel * std::pow(kit::max(1.0f, power / kFullPower), -kTrimSlope);
  }
  static constexpr float kWetLevel = 1.0f;
  static constexpr float kFullPower = 0.6f;
  static constexpr float kTrimSlope = 0.3f;

  void release(Voice& voice) {
    if (!voice.fading) --live_;
    voice.active = false;
    --active_;
  }

  // One output frame of every voice, as a centre sum and a left/right
  // difference (a voice at `pan` adds pan times its signal to the latter).
  void render(const float* role_gain, float* mid, float* side) {
    float sum = 0.0f;
    float difference = 0.0f;
    for (Voice& voice : voices_) {
      if (!voice.active) continue;
      if (voice.remaining == 0) {
        if (voice.fading) {
          release(voice);
          continue;
        }
        if (voice.wait > 0) {
          --voice.wait;
          continue;
        }
        if (!start_pass(voice)) {
          release(voice);
          continue;
        }
      }
      float window;
      if (voice.phase < voice.attack) {
        window = 0.5f - 0.5f * kit::SineTable::cos_lookup(0.5f * voice.phase * voice.inv_attack);
      } else {
        const float fall =
            0.5f + 0.5f * kit::SineTable::cos_lookup(0.5f * (voice.phase - voice.attack) * voice.inv_release);
        const float steep = fall * fall * fall * fall;
        window = steep + voice.shape * (fall - steep);
      }
      float sample = read(voice);
      voice.position += voice.step;
      voice.phase += voice.phase_step;
      if (voice.lp_a > 0.0f) {
        voice.lp1 = flush_denormal(sample + (voice.lp1 - sample) * voice.lp_a);
        voice.lp2 = flush_denormal(voice.lp1 + (voice.lp2 - voice.lp1) * voice.lp_a);
        sample = voice.lp2;
      }
      sample *= window * voice.gain * role_gain[voice.role];
      if (voice.fading) {
        sample *= voice.fade;
        voice.fade -= fade_step_;
        if (voice.fade <= 0.0f) voice.remaining = 1;
      }
      sum += sample;
      difference += sample * voice.pan;
      --voice.remaining;
    }
    *mid = sum;
    *side = difference;
  }

  float ring0_[kRing0];
  float ring1_[kRing1];
  float ring2_[kRing2];
  kit::Halfband2x half_[2];
  kit::DcBlocker dc_;
  Voice voices_[kMaxVoices];
  kit::Rng rng_;
  kit::Svf tone_[2];
  kit::Smoother tone_hz_, high_, low_, spread_, trim_, mix_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  long long written_ = 0;
  float held1_ = 0.0f;
  float held2_ = 0.0f;
  int live_ = 0;
  int active_ = 0;
  int guard_ = 0;
  int preroll_ = 0;
  float fade_step_ = 0.0f;
  // The slice clock.
  long long slot_begin_ = 0;
  long long slot_samples_ = 0;
  bool slot_has_sound_ = false;
  long long slice_count_ = 0;
  float mix_seen_ = -1.0f, dry_gain_ = 1.0f, wet_gain_ = 0.0f;
};

}  // namespace livemix
