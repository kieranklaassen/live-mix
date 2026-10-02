#pragma once

// Cascade: little loops of what was just played, stacked at octave (and
// fifth) speeds in a pattern.
//
//   in ─┬─────────────────────────────────────────────────────────► dry ─┐
//       └─ L+R ─► DC block ─► ring (x1) ─► half-band ─► ring (x2) ─►      │
//                                half-band ─► ring (x4)                   │
//           slice clock ─► loop voices ─► tone ─► hold ─► limit ─► wet ───┴─► out
//
// - A slice clock of period Time cuts the input into slots. A slot that had
//   sound in it is captured by reference (a position and a length in the
//   ring) and handed to a set of loop voices. A slot that starts in silence
//   waits: it begins at the first sound. A note played over one that still
//   sounds cuts the slot short and starts the next. Either way a note is
//   captured from its attack, and what was captured first comes back exactly
//   one Time after its slot began.
// - A voice replays its slice in passes. Each pass reads a stretch of the
//   slice at a speed (1/2, 1, 3/2, 2, 3 or 4) under a window, at a place in
//   the stereo field, through a low-pass that closes a little more on every
//   repeat. Everything a pass uses is fixed when the pass starts, at a point
//   where its window is zero, so the controls that shape it cannot click.
//   High, Low, Spread, Tone and Mix act on what is already sounding.
// - Speeds above 1 would alias. They read copies of the ring decimated by 2
//   and by 4 through half-band filters (kit::Halfband2x), so a x2 or x4 voice
//   reads one stored sample per output sample and what it shifts up was
//   band-limited first.
// - Patterns differ only in the passes they schedule (start_pass and the
//   functions after it): Mosaic loops the slice at every speed at once, Strum
//   strikes its start in a quickening or slowing run, Tunnel loops a piece
//   of it into a drone, Steps plays each repeat at the next speed.
// - The capture is mono (the sum of the inputs); the width comes from where
//   the voices are placed. The half-speed voice stays in the centre.
// - When the pool is full the quietest voice fades out over 10 ms.
// - A slice is read for at most kMaxLifeSeconds: Repeats x Time is cut short
//   at that (it matters above 1.1 s of Time).

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
    make_kernel();
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
    // Never longer than the ring holds a slice for (it matters above 96 kHz).
    max_life_ = kit::min(kMaxLifeSeconds * sr, static_cast<float>(kRing0) - 3.2f * sr);
    fast_.set(0.0005f, 0.01f, sr);
    slow_.set(0.02f, 0.08f, sr);
    slice_count_ = 0;
    step_ = 0;
    cycle_ = 480.0f;
    restart_slots();
    for (int c = 0; c < 2; ++c) tone_[c].reset();
    tone_hz_.set_time(0.01f, sr / kControlPeriod);
    high_.set_time(kSmoothingSeconds, sr);
    low_.set_time(kSmoothingSeconds, sr);
    spread_.set_time(kSmoothingSeconds, sr);
    trim_.set_time(0.02f, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    mix_seen_ = -1.0f;
    held_ = 0.0f;
    hold_attack_ = kit::time_to_coeff(0.002f, sr);
    hold_release_ = kit::time_to_coeff(0.25f, sr);
    control_left_ = 0;
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
    int done = 0;
    if (was_asleep) {
      // Start again at the first sample that is not silence, wherever in the
      // host's block it falls, so that what follows does not depend on how
      // the silence before it was cut into blocks.
      while (done < frames - 1 && in_left_[done] == 0.0f && in_right_[done] == 0.0f) {
        out_left_[done] = 0.0f;
        out_right_[done] = 0.0f;
        ++done;
      }
      wake();
    }
    while (done < frames) {
      if (control_left_ == 0) {
        control();
        control_left_ = kControlPeriod;
      }
      // A chunk ends at the next control tick or at the end of the slot,
      // whichever is first, wherever the host's blocks fall.
      int count = frames - done < control_left_ ? frames - done : control_left_;
      const long long until = slot_begin_ + slot_samples_ - written_;
      if (until >= 1 && until < count) count = static_cast<int>(until);
      count = chunk(done, count);
      done += count;
      control_left_ -= count;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  // 21.8 s at 96 kHz: a slice is read for at most kMaxLifeSeconds after it
  // was captured, and is up to 2 s long.
  static constexpr int kRing0 = 1 << 21;
  static constexpr int kRing1 = kRing0 / 2;
  static constexpr int kRing2 = kRing0 / 4;
  static constexpr float kMaxLifeSeconds = 18.0f;
  // Up to kMaxLive voices sound; the rest of the pool holds those fading out
  // after a steal (a slice starts at most kMaxPerSlice voices).
  static constexpr int kMaxLive = 32;
  static constexpr int kMaxPerSlice = 6;
  static constexpr int kMaxVoices = kMaxLive + kMaxPerSlice;
  static constexpr int kControlPeriod = 16;
  // The decimated rings trail the input: sample m of the x2 ring is the
  // input at 2m - 31, sample j of the x4 ring the input at 4j - 93. A slice
  // ends kGuardSeconds before the voices that read it start, so that all of
  // it (and the eight samples past it the sinc reads) is in every ring by
  // then.
  static constexpr double kLag1 = 31.0;
  static constexpr double kLag2 = 93.0;
  static constexpr float kGuardSeconds = 0.0035f;
  static constexpr float kPrerollSeconds = 0.002f;
  static constexpr float kStealSeconds = 0.01f;
  static constexpr float kAttackSeconds = 0.002f;
  // -60 dBFS: what counts as sound in a slot.
  static constexpr float kThreshold = 0.001f;
  // -2 dBFS: where the wet level starts to be held down.
  static constexpr float kCeiling = 0.8f;
  // A new note: the fast level follower this far above the slow one.
  static constexpr float kOnsetRatio = 2.5f;
  static constexpr float kOnsetFloor = 0.003f;

  enum Role : int { kRoleMain = 0, kRoleHigh, kRoleLow, kNumRoles };
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
    int first_step = 0;
    double slice_start = 0.0;
    float slice_len = 0.0f;
    float period = 0.0f;
    int repeats = 1;
    float trim = 1.0f;
    float cycle = 480.0f;
    int next_half = 0;
    float next_unlike = 0.0f;
    kit::Rng rng;
    // Where it is in its schedule.
    int pass = 0;
    float elapsed = 0.0f;
    // The pass being played.
    int level = 0;
    bool exact = false;
    long long quarter = 0;
    int quarter_step = 0;
    double position = 0.0;
    double step = 0.0;
    float phase = 0.0f;
    float phase_step = 0.0f;
    float attack = 0.5f;
    float inv_attack = 2.0f;
    float inv_release = 2.0f;
    float shape = 0.5f;
    // Tunnel: how unlike each other the two voices are where this pass fades
    // in and where it fades out (0 = the same sound, 1 = unrelated).
    float unlike_in = 0.0f;
    float unlike_out = 0.0f;
    float gain = 0.0f;
    float pan = 0.0f;
    int role = kRoleMain;
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
    fast_.reset();
    slow_.reset();
    start_delay_ = 0;
  }

  // The ring was not written while asleep. Take up recording on a whole
  // group of four samples with the decimators and the clocks at rest; the
  // slot starts here (the ring just before holds the silence that let the
  // device fall asleep).
  void wake() {
    while (written_ & 3) {
      ring0_[written_ & (kRing0 - 1)] = 0.0f;
      ++written_;
    }
    half_[0].reset();
    half_[1].reset();
    held1_ = 0.0f;
    held2_ = 0.0f;
    dc_.reset();
    for (int c = 0; c < 2; ++c) tone_[c].reset();
    held_ = 0.0f;
    control_left_ = 0;
    step_ = 0;
    restart_slots();
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

  // A voice at x1, x2 or x4 reads whole samples of its ring. The others move
  // by three quarters of a sample (x3/2, x3) or half a sample (x1/2) per
  // output sample, so only four fractional positions ever occur: they use a
  // four-phase, 16-tap windowed sinc (Kaiser, 50 dB). A cubic would leave
  // images of the top octave of the ring at -15 dB, from 16 kHz up.
  static constexpr int kTaps = 16;
  void make_kernel() {
    const double cutoff = 0.915;
    const double beta = 4.55;
    for (int phase = 0; phase < 4; ++phase) {
      double sum = 0.0;
      double taps[kTaps];
      for (int t = 0; t < kTaps; ++t) {
        const double u = static_cast<double>(t - 7) - 0.25 * phase;
        const double x = 3.14159265358979323846 * cutoff * u;
        const double sinc = (u > -1.0e-9 && u < 1.0e-9) ? cutoff : std::sin(x) / (3.14159265358979323846 * u);
        const double r = u / 8.5;
        taps[t] = sinc * bessel_i0(beta * std::sqrt(1.0 - r * r)) / bessel_i0(beta);
        sum += taps[t];
      }
      for (int t = 0; t < kTaps; ++t) kernel_[phase][t] = static_cast<float>(taps[t] / sum);
    }
  }
  static double bessel_i0(double x) {
    double sum = 1.0;
    double term = 1.0;
    for (int k = 1; k < 32; ++k) {
      term *= (x / (2.0 * k)) * (x / (2.0 * k));
      sum += term;
    }
    return sum;
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
    int direction = 0;
    float swell = 0.5f;
    switch (voice.pattern) {
      case kStrum:
        if (!strum_pass(voice, &speed, &length, &grid, &pan)) return false;
        age = static_cast<float>(k);
        break;
      case kTunnel:
        if (!tunnel_pass(voice, &speed, &offset, &length, &grid, &pan, &direction, &swell)) return false;
        extra_dark = 0.3f;
        break;
      case kSteps:
        if (voice.part == 1) {
          if (k >= (count + 1) / 2) return false;
          speed = 0.5f;
          grid = 2.0f * period;
        } else {
          if (k >= count) return false;
          const int step = voice.first_step + k;
          speed = voice.fifths ? kStepsFifths[step & 7] : kStepsOctaves[step & 3];
          if (speed > 1.0f) pan = ((step & 1) ? 1.0f : -1.0f) * (0.4f + 0.6f * (speed - 1.0f) / 3.0f);
        }
        break;
      case kMosaic:
      default:
        if (!mosaic_pass(voice, &speed, &grid, &accent, &pan)) return false;
        break;
    }
    const float run = length / speed;
    if (voice.elapsed + run > max_life_) return false;

    voice.role = speed > 1.0f ? kRoleHigh : (speed < 1.0f ? kRoleLow : kRoleMain);
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

    const bool chance = voice.rng.uniform() < param(kReverse);
    const bool reversed = direction < 0 || (direction == 0 && chance);
    voice.level = speed > 2.0f ? 2 : (speed > 1.0f ? 1 : 0);
    const double scale = static_cast<double>(1 << voice.level);
    const double lag = voice.level == 0 ? 0.0 : (voice.level == 1 ? kLag1 : kLag2);
    const double rate = static_cast<double>(speed) / scale;
    const double from = voice.slice_start + offset + (reversed ? length : 0.0f);
    voice.position = (from + lag) / scale;
    voice.step = reversed ? -rate : rate;
    voice.exact = rate == 1.0;
    if (voice.exact) voice.position = std::floor(voice.position + 0.5);
    if (!voice.exact) {
      voice.quarter = std::llround(voice.position * 4.0);
      voice.quarter_step = (reversed ? -1 : 1) * (rate == 0.75 ? 3 : 2);
    }

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
    voice.attack = kit::lerp(kit::min(swell, kAttackSeconds * sr * voice.phase_step), swell, voice.shape);
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
  static constexpr float kPanFour[4] = {-0.9f, 0.5f, -0.5f, 0.9f};
  static constexpr float kAccentFour[4] = {0.8f, 1.15f, 0.95f, 1.1f};
  static constexpr float kPanThree[3] = {0.65f, -0.65f, 0.0f};
  static constexpr float kAccentThree[3] = {0.9f, 1.1f, 1.0f};
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
        *pan = (k & 1) ? 0.6f : -0.6f;
        break;
      case 1:
        *pan = (k & 1) ? -1.0f : 1.0f;
        *accent = (k & 1) ? 1.1f : 0.9f;
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

  // How unlike itself the ring is `lag` samples on: the squared difference
  // between `points` samples from `at` (every `stride`-th) and the same
  // samples `lag` later, over the energy of both. 0 is a perfect repeat, 1
  // unrelated sound. (The difference function of de Cheveigné and Kawahara's
  // YIN, normalised.)
  static float unlikeness(const float* ring, int mask, long long at, long long lag, int points, int stride) {
    float difference = 0.0f;
    float energy = 1.0e-12f;
    for (int n = 0; n < points; ++n) {
      const float a = ring[(at + n * stride) & mask];
      const float b = ring[(at + n * stride + lag) & mask];
      difference += (a - b) * (a - b);
      energy += a * a + b * b;
    }
    return difference / energy;
  }

  // The lag, in input samples, at which the slice is most like itself from
  // `from` on: its period if it is one note, the common period if it is a
  // chord. Searched from 2.5 to 25 ms on the x4 ring, then to the sample (and
  // a fraction, by a parabola through the minimum) on the full one.
  float find_cycle(double from, float room) const {
    const float sr = sample_rate();
    const float longest = kit::min(0.025f * sr, room / 3.0f);
    const float shortest = kit::min(0.0025f * sr, 0.5f * longest);
    const float span = kit::min(0.03f * sr, room - longest);
    const long long at4 = static_cast<long long>((from + kLag2) * 0.25);
    // Every lag and every other sample at 48 kHz; half as many of both at 96.
    const int skip = sr > 60000.0f ? 2 : 1;
    const int points4 = static_cast<int>(span * 0.125f) / skip;
    int best4 = static_cast<int>(shortest * 0.25f) + 1;
    float lowest = 1.0e9f;
    for (int lag = best4; lag <= static_cast<int>(longest * 0.25f); lag += skip) {
      const float value = unlikeness(ring2_, kRing2 - 1, at4, lag, points4, 2 * skip);
      if (value < lowest) {
        lowest = value;
        best4 = lag;
      }
    }
    const long long at = static_cast<long long>(from);
    const int points = static_cast<int>(span * 0.25f);
    float around[19];
    int best = 9;
    for (int i = 0; i < 19; ++i) {
      around[i] = unlikeness(ring0_, kRing0 - 1, at, 4 * best4 - 9 + i, points, 4);
      if (around[i] < around[best]) best = i;
    }
    float fraction = 0.0f;
    if (best > 0 && best < 18) {
      const float curve = around[best - 1] - 2.0f * around[best] + around[best + 1];
      if (curve > 1.0e-9f) fraction = kit::clamp(0.5f * (around[best - 1] - around[best + 1]) / curve, -0.5f, 0.5f);
    }
    return static_cast<float>(4 * best4 - 9 + best) + fraction;
  }

  // Tunnel: a piece of the slice, past its attack, looped until Repeats x
  // Time has gone by, each pass 12 % of the first piece longer. Parts 0 and 1
  // play the same piece half a pass apart, and the piece is cut to a whole
  // number of the slice's cycles on each side of its middle, so wherever the
  // two overlap they are playing the same phase of the sound: under a full
  // swell they join into one unbroken drone instead of beating against each
  // other. Parts 2 (above) and 3 (x1/2) loop the same piece alone.
  float tunnel_start(const Voice& voice) const {
    return kit::min(0.1f * voice.slice_len, 0.02f * sample_rate());
  }

  // Half the length of pass k's piece in input samples: the wanted length as
  // a whole number of cycles, then moved a few samples to where the slice
  // repeats best.
  int tunnel_half(const Voice& voice, int k, float* unlike = nullptr) const {
    const float sr = sample_rate();
    const float start = tunnel_start(voice);
    const float most = 0.5f * (voice.slice_len - start) - 8.0f;
    const float wanted = kit::min(
        kit::max(0.125f * voice.period, 0.015f * sr) * (1.0f + 0.12f * static_cast<float>(k)), most);
    int cycles = static_cast<int>(wanted / voice.cycle + 0.5f);
    if (cycles < 1) cycles = 1;
    while (cycles > 1 && static_cast<float>(cycles) * voice.cycle > most) --cycles;
    const int centre = static_cast<int>(kit::min(static_cast<float>(cycles) * voice.cycle, most) + 0.5f);
    const int reach = cycles >= 48 ? 8 : 2 + cycles / 8;
    const int stride = 1 + static_cast<int>(kit::min(static_cast<float>(centre), 0.03f * sr)) / 256;
    const int points = static_cast<int>(kit::min(static_cast<float>(centre), 0.03f * sr)) / stride;
    const long long at = static_cast<long long>(voice.slice_start + start);
    int best = centre;
    float lowest = 1.0e9f;
    for (int lag = centre - reach; lag <= centre + reach; ++lag) {
      if (lag < 16 || static_cast<float>(lag) > most) continue;
      // Ties (silence) go to the wanted length.
      const float value = unlikeness(ring0_, kRing0 - 1, at, lag, points, stride) +
                          1.0e-6f * static_cast<float>(lag > centre ? lag - centre : centre - lag);
      if (value < lowest) {
        lowest = value;
        best = lag;
      }
    }
    // How well the loop closes there: near 0 for a note, near 1 for noise or
    // a dense chord, which have no cycle to cut on.
    if (unlike) *unlike = lowest < 1.0f ? (lowest > 0.0f ? lowest : 0.0f) : 1.0f;
    return best < 16 ? 16 : best;
  }

  bool tunnel_pass(Voice& voice, float* speed, float* offset, float* length, float* grid,
                   float* pan, int* direction, float* swell) const {
    const int k = voice.pass;
    if (voice.elapsed >= static_cast<float>(voice.repeats) * voice.period) return false;
    // Parts 0 and 1 cross over each other at a lag of this pass's half (part
    // 0 fades in at the lag of the pass before). Where the slice does not
    // repeat at that lag the two are unrelated sounds, and a crossfade whose
    // gains add up to one would dip 3 dB at every crossing: the window is
    // bent towards equal power by how unlike they are (see render).
    float unlike = voice.next_unlike;
    const float half = static_cast<float>(voice.part == 1 && k > 0 ? voice.next_half
                                                                   : tunnel_half(voice, k, &unlike));
    if (voice.part <= 1) {
      voice.unlike_in = (voice.part == 0 && k > 0) ? voice.unlike_out : unlike;
      voice.unlike_out = unlike;
    }
    *offset = tunnel_start(voice);
    *speed = voice.part == 3 ? 0.5f : (voice.part == 2 ? (voice.fifths ? 1.5f : 2.0f) : 1.0f);
    if (voice.part == 1) {
      // From the middle of part 0's pass k to the middle of its pass k + 1
      // (whose half this voice needs again for its own next pass).
      voice.next_half = tunnel_half(voice, k + 1, &voice.next_unlike);
      const float next = static_cast<float>(voice.next_half);
      *length = half + next;
      *swell = half / (half + next);
      *direction = 1;
      *pan = 0.5f;
    } else {
      *length = 2.0f * half;
      if (voice.part == 0) {
        *direction = 1;
        *pan = -0.5f;
      } else if (voice.part == 2) {
        *pan = (k & 1) ? 0.8f : -0.8f;
      }
    }
    *grid = *length / *speed;
    return true;
  }

  float role_level(int role) const {
    return role == kRoleHigh ? high_.value : (role == kRoleLow ? low_.value : 1.0f);
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
      voice.first_step = step_;
      voice.slice_start = start;
      voice.slice_len = length;
      voice.period = period;
      voice.repeats = repeats();
      voice.trim = trim;
      voice.cycle = cycle_;
      voice.wait = delay + start_delay_;
      voice.rng.seed(rng_.next_u32());
      ++live_;
      ++active_;
      return;
    }
  }

  // A slot with sound in it has ended: hand its slice to the pattern.
  void capture(long long start, float length, float period, int delay) {
    start_delay_ = delay;
    using namespace cascade;
    const int pattern = kit::clamp_int(static_cast<int>(param(kPattern) + 0.5f), 0, 3);
    const bool fifths = param(kInterval) > 0.5f;
    const bool high = param(kHigh) > 0.001f;
    const bool low = param(kLow) > 0.001f;
    const double at = static_cast<double>(start);
    Voice probe;
    if (pattern == kTunnel) {
      probe.slice_start = at;
      probe.slice_len = length;
      probe.period = period;
      const float start = tunnel_start(probe);
      cycle_ = find_cycle(at + start, length - start);
      probe.cycle = cycle_;
    }
    // In Mosaic the loop at the played speed sits 1.4 dB under the ones above
    // it at full High, so they are what is heard first.
    add(pattern, 0, at, length, period, pattern == kMosaic ? 0.85f : 1.0f, 0);
    switch (pattern) {
      case kStrum:
        if (high) add(pattern, 1, at, length, period, 1.0f, 0);
        if (low) add(pattern, 2, at, length, period, 1.0f, 0);
        break;
      case kTunnel: {
        // Part 1 starts in the middle of part 0's first pass.
        add(pattern, 1, at, length, period, 1.0f, tunnel_half(probe, 0));
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
    // Strum and Steps leave gaps, so they play a little hotter.
    float level = 1.0f;
    switch (kit::clamp_int(static_cast<int>(param(kPattern) + 0.5f), 0, 3)) {
      case kStrum:
        parts = 0.3f * (1.0f + 0.5f * high + low);
        level = 1.3f;
        break;
      case kTunnel:
        parts = 2.0f + high + low;
        break;
      case kSteps:
        parts = 0.25f + 0.35f * high + low;
        level = 1.15f;
        break;
      default:
        parts = 0.72f + 2.0f * high + low;
        break;
    }
    const float power = window * generations * parts;
    return level * std::pow(kit::max(1.0f, power / kFullPower), -kTrimSlope);
  }
  static constexpr float kFullPower = 0.6f;
  static constexpr float kTrimSlope = 0.3f;

  // A smoother's next value, without the arithmetic once it has arrived.
  static float glide(kit::Smoother& smoother) {
    return smoother.value == smoother.target ? smoother.value : smoother.next();
  }

  void release(Voice& voice) {
    if (!voice.fading) --live_;
    voice.active = false;
    --active_;
  }

  void control() {
    using namespace cascade;
    const float sr = sample_rate();
    const float hz = tone_hz_.next();
    for (int c = 0; c < 2; ++c) tone_[c].set(hz, 0.6f, sr);
    trim_.set_target(wet_trim());
    slot_samples_ = static_cast<long long>(param(kTime) * 0.001f * sr);
    onset_gap_ = static_cast<long long>(kit::max(0.06f * sr, 0.25f * static_cast<float>(slot_samples_)));
  }

  // `count` output frames of one voice, added per role to a centre sum and
  // a left/right difference (a voice at `pan` adds pan times its signal to
  // the latter).
  void render(Voice& voice, int count, float (*mid)[kControlPeriod], float (*side)[kControlPeriod]) {
    int at = 0;
    while (at < count) {
      if (voice.remaining == 0) {
        if (voice.fading) {
          release(voice);
          return;
        }
        if (voice.wait > 0) {
          const int skip = voice.wait < count - at ? voice.wait : count - at;
          voice.wait -= skip;
          at += skip;
          continue;
        }
        if (!start_pass(voice)) {
          release(voice);
          return;
        }
      }
      const int run = voice.remaining < count - at ? voice.remaining : count - at;
      float* centre = mid[voice.role] + at;
      float* across = side[voice.role] + at;
      const float* ring = voice.level == 0 ? ring0_ : (voice.level == 1 ? ring1_ : ring2_);
      const int mask = (kRing0 >> voice.level) - 1;
      const float a = voice.lp_a;
      const float fade_step = voice.fading ? fade_step_ : 0.0f;
      const float unlike_in = voice.unlike_in;
      const float unlike_out = voice.unlike_out;
      float phase = voice.phase;
      float lp1 = voice.lp1;
      float lp2 = voice.lp2;
      float fade = voice.fade;
      long long whole = static_cast<long long>(voice.position);
      const int direction = voice.step < 0.0 ? -1 : 1;
      for (int i = 0; i < run; ++i) {
        float window;
        if (phase < voice.attack) {
          const float t = phase * voice.inv_attack;
          window = t * t * (3.0f - 2.0f * t);
          if (unlike_in > 0.0f) window += unlike_in * (std::sqrt(window) - window);
        } else {
          const float t = (phase - voice.attack) * voice.inv_release;
          float fall = 1.0f - t * t * (3.0f - 2.0f * t);
          if (unlike_out > 0.0f) fall += unlike_out * ((fall > 0.0f ? std::sqrt(fall) : 0.0f) - fall);
          const float steep = fall * fall * fall * fall;
          window = steep + voice.shape * (fall - steep);
        }
        phase += voice.phase_step;
        float sample;
        if (voice.exact) {
          sample = ring[whole & mask];
          whole += direction;
        } else {
          const float* taps = kernel_[voice.quarter & 3];
          const int first = static_cast<int>(((voice.quarter >> 2) - 7) & mask);
          sample = 0.0f;
          if (first + kTaps <= mask) {
            const float* x = ring + first;
            for (int t = 0; t < kTaps; ++t) sample += taps[t] * x[t];
          } else {
            for (int t = 0; t < kTaps; ++t) sample += taps[t] * ring[(first + t) & mask];
          }
          voice.quarter += voice.quarter_step;
        }
        if (a > 0.0f) {
          lp1 = sample + (lp1 - sample) * a;
          lp2 = lp1 + (lp2 - lp1) * a;
          sample = lp2;
        }
        sample *= window * voice.gain * fade;
        fade -= fade_step;
        if (fade < 0.0f) fade = 0.0f;
        centre[i] += sample;
        across[i] += sample * voice.pan;
      }
      if (voice.exact) voice.position = static_cast<double>(whole);
      voice.phase = phase;
      voice.lp1 = flush_denormal(lp1);
      voice.lp2 = flush_denormal(lp2);
      voice.fade = fade;
      voice.remaining -= run;
      at += run;
      if (voice.fading && fade <= 0.0f) voice.remaining = 0;
    }
  }

  // Up to kControlPeriod frames: record the input, render the voices, mix.
  // Returns how many it did (fewer than asked when a new note cut the slot).
  int chunk(int offset, int count) {
    using namespace cascade;
    const float sr = sample_rate();
    float dry[2][kControlPeriod];
    bool cut = false;
    long long cut_begin = 0;
    float cut_length = 0.0f;
    int cut_delay = 0;
    for (int i = 0; i < count; ++i) {
      take_input(offset + i, &dry[0][i], &dry[1][i]);
      const float x = dc_.process(0.5f * (dry[0][i] + dry[1][i]));
      if (!slot_has_sound_ && (x > kThreshold || x < -kThreshold)) {
        slot_has_sound_ = true;
        if (written_ - preroll_ > slot_begin_) slot_begin_ = written_ - preroll_;
      }
      // A new note over one still sounding (the level jumps by 8 dB within a
      // few milliseconds) ends the slot early and starts the next at its
      // attack, so notes are captured whole. What the cut slot held still
      // comes back one Time after it started.
      const float magnitude = x < 0.0f ? -x : x;
      fast_.process(magnitude);
      const long long into = written_ - slot_begin_;
      if (fast_.level > kOnsetRatio * slow_.level + kOnsetFloor && slot_has_sound_ && into >= onset_gap_ &&
          into < slot_samples_) {
        cut = true;
        cut_begin = slot_begin_;
        cut_length = static_cast<float>(into - guard_);
        cut_delay = static_cast<int>(slot_samples_ - into) - 1;
        slot_begin_ = written_ - preroll_;
      }
      slow_.process(magnitude);
      record(x);
      // The chunk ends with the sample that cut the slot, so the voices
      // start (and any they push out fade) on a sample the host's blocks do
      // not decide.
      if (cut) count = i + 1;
    }

    float mid[kNumRoles][kControlPeriod] = {};
    float side[kNumRoles][kControlPeriod] = {};
    if (active_ > 0) {
      for (Voice& voice : voices_) {
        if (voice.active) render(voice, count, mid, side);
      }
    }

    for (int i = 0; i < count; ++i) {
      const float high = glide(high_);
      const float low = glide(low_);
      const float centre = mid[kRoleMain][i] + high * mid[kRoleHigh][i] + low * mid[kRoleLow][i];
      const float across =
          glide(spread_) * (side[kRoleMain][i] + high * side[kRoleHigh][i] + low * side[kRoleLow][i]);
      const float trim = glide(trim_);
      float wet[2] = {tone_[0].lowpass((centre - across) * trim), tone_[1].lowpass((centre + across) * trim)};
      // A held tone whose period divides Time comes back in phase with itself
      // once per repeat and adds up in amplitude. Past kCeiling the wet level
      // is turned down (2 ms to act, 250 ms to let go) rather than clipped;
      // the clipper after it only catches what gets through while it acts.
      const float left = wet[0] < 0.0f ? -wet[0] : wet[0];
      const float right = wet[1] < 0.0f ? -wet[1] : wet[1];
      const float loudest = left > right ? left : right;
      held_ = flush_denormal(loudest + (held_ - loudest) * (loudest > held_ ? hold_attack_ : hold_release_));
      const float hold = held_ > kCeiling ? kCeiling / held_ : 1.0f;
      for (int c = 0; c < 2; ++c) wet[c] = 2.0f * kit::soft_clip(0.5f * wet[c] * hold);
      const float mix = glide(mix_);
      if (mix != mix_seen_) {
        mix_seen_ = mix;
        kit::equal_power(mix, &dry_gain_, &wet_gain_);
      }
      out_left_[offset + i] = dry[0][i] * dry_gain_ + wet[0] * wet_gain_;
      out_right_[offset + i] = dry[1][i] * dry_gain_ + wet[1] * wet_gain_;
    }

    const long long elapsed = written_ - slot_begin_;
    if (elapsed >= slot_samples_) {
      const float length = static_cast<float>(elapsed - guard_);
      // Steps counts slots from the first one after a silence, so that
      // everything sounding moves to the next speed together.
      if (slot_has_sound_ && length >= 0.02f * sr) {
        capture(slot_begin_, length, static_cast<float>(elapsed), 0);
        ++step_;
      } else {
        step_ = 0;
      }
      slot_begin_ = written_;
      slot_has_sound_ = false;
    }
    if (cut && cut_length >= 0.02f * sr) {
      capture(cut_begin, cut_length, static_cast<float>(slot_samples_), cut_delay);
      ++step_;
    }
    return count;
  }

  float ring0_[kRing0];
  float ring1_[kRing1];
  float ring2_[kRing2];
  float kernel_[4][kTaps];
  kit::Halfband2x half_[2];
  kit::DcBlocker dc_;
  Voice voices_[kMaxVoices];
  kit::Rng rng_;
  kit::Svf tone_[2];
  kit::Smoother tone_hz_, high_, low_, spread_, trim_, mix_;
  kit::IdleGate idle_;
  long long written_ = 0;
  float held1_ = 0.0f;
  float held2_ = 0.0f;
  int control_left_ = 0;
  int live_ = 0;
  int active_ = 0;
  int guard_ = 0;
  int preroll_ = 0;
  float fade_step_ = 0.0f;
  float max_life_ = 0.0f;
  // The slice clock.
  long long slot_begin_ = 0;
  long long slot_samples_ = 0;
  long long onset_gap_ = 0;
  // Added to the delay of every voice capture() starts: a cut slot's voices
  // wait until one Time after it began.
  int start_delay_ = 0;
  kit::Follower fast_, slow_;
  bool slot_has_sound_ = false;
  long long slice_count_ = 0;
  int step_ = 0;
  float cycle_ = 480.0f;
  float held_ = 0.0f, hold_attack_ = 0.0f, hold_release_ = 0.0f;
  float mix_seen_ = -1.0f, dry_gain_ = 1.0f, wet_gain_ = 0.0f;
};

}  // namespace livemix
