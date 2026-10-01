#pragma once

// Sampler: one loaded sound, played by the keys.
//
//   per key (16):  read head ─► loop / crossfade ─► envelope · velocity ─┐
//                  (rate = key · Tune · Fine · wobble,                    ├─► tone ─► out
//                   Hermite, from the mip level that fits the rate)       │
//   stolen voice or sample commit: last output ─► 8 ms fade-out tail ─────┘
//
// - Middle C (261.63 Hz) plays the sound at its own pitch; the stored sound's
//   sample rate is accounted for.
// - Start and End bound the region. A key starts at Start (at End with
//   Reverse) and, with Loop Off, ends when it reaches the other edge. Forward
//   jumps back; Ping-pong turns around at each edge.
// - The loop crossfade blends the last Crossfade of each pass with the audio
//   that leads into the loop start, so the jump lands on what is already
//   playing. Where the sound has no such lead-in (Start at 0) the loop start
//   moves in by the crossfade length. The blend is linear with a gain that
//   keeps the power level for the measured correlation of the two stretches:
//   a loop that already matches stays exactly as it was, and unrelated
//   material (a field recording) does not dip. Ping-pong needs no crossfade.
// - Aliasing guard: two half-band mip levels (1/2 and 1/4 rate) of the sound.
//   A key reads the level whose band still fits under Nyquist at its rate
//   (above 1.1x the first, above 2.2x the second). A commit must stay fast,
//   so the levels are built over the following blocks (30 s of sound takes
//   about 3 s); until then keys read the full-rate sound.
// - Wobble is one tape motor for all keys: a 0.8 Hz wow with a slower drift
//   and a trace of 6 Hz flutter, up to ±30 cents.
// - A sample commit overwrites the sound in place. Held keys restart on the
//   new sound under a 10 ms fade-in; what was sounding fades from its last
//   value over 8 ms instead of stepping. A stolen voice is handed over the
//   same way.
//
// Before anything is loaded the store holds a built-in sound: 3 s of a soft
// flute-like tone on middle C with a breathy attack and a release. Its
// middle (0.15 to 0.85, the default region) is exactly periodic.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Sampler : public kit::DeviceBase<sampler::kNumParams> {
 public:
  static constexpr int kMaxVoices = 16;
  // 31.25 s at 48 kHz, stereo.
  static constexpr int kStoreFrames = 1500000;
  static constexpr float kMiddleC = 261.6256f;

  void init(float sample_rate) {
    using namespace sampler;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) {
      pool_.voices[v] = Voice();
      pool_.voices[v].env.set_sample_rate(sr);
    }
    for (int c = 0; c < 2; ++c) tone_[c].reset();
    tone_hz_.set_time(0.02f, sr / kControlPeriod);  // advanced on the control clock
    pitch_.set_time(0.02f, sr / kControlPeriod);
    wobble_.set_time(kSmoothingSeconds, sr);
    volume_.set_time(kSmoothingSeconds, sr);
    fade_in_.set_time(kCommitFadeSeconds, sr);
    fade_in_.snap(1.0f);
    wow_phase_ = 0.0f;
    flutter_phase_ = 0.0f;
    wow_drift_.seed(0x3C6EF372u);
    wow_drift_.set_rate(0.35f, sr / kControlPeriod);
    drift_value_ = 0.0f;
    tail_length_ = static_cast<int>(kTailSeconds * sr);
    tail_count_ = tail_length_;
    tail_left_ = tail_right_ = 0.0f;
    last_left_ = last_right_ = 0.0f;
    clock_.reset(kControlPeriod);
    idle_.reset(sr, 0.1f);
    design_halfband();
    build_default_sound();
    adopt_store(true);
    while (!mips_ready_) build_mips(1 << 20);  // not on the audio path: build them now
    for (int id = 0; id < kNumParams; ++id) apply(id);
    control();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    using namespace sampler;
    if (!(frequency == frequency) || frames_ == 0) return;  // NaN, or nothing to play
    frequency = kit::clamp(frequency, 8.0f, 12000.0f);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    // A key struck again while held: let the old voice go quickly.
    const int held = pool_.find_held(note_id);
    if (held >= 0) pool_.voices[held].env.fast_release(0.02f);

    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    if (stolen) {
      const float scale = fade_in_.value * kVoiceGain;
      hand_to_tail(voice.out_left * scale, voice.out_right * scale);
    }
    refresh_region();
    voice.env.reset();
    voice.ratio = frequency / kMiddleC;
    const float amount = param(kVelocity);
    voice.gain = 1.0f - amount + amount * gain;
    voice.out_left = voice.out_right = 0.0f;
    place(voice);
    voice.env.set(param(kAttack), 0.01f, 1.0f, param(kRelease));
    voice.env.gate_on();
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held >= 0) pool_.voices[held].env.gate_off();
  }

  void process(int frames) {
    frames = begin_block(frames);
    build_mips(frames * kMipPerSample);
    const bool sounding = pool_.count_active() > 0 || tail_count_ < tail_length_;
    if (!idle_.wake(sounding)) {
      silence_output(frames);
      last_left_ = last_right_ = 0.0f;
      return;
    }
    clear_input(frames);  // an instrument ignores its input
    for (int i = 0; i < frames; ++i) {
      if (clock_.tick()) control();

      // The tape motor, shared by every key.
      wow_phase_ += wow_step_;
      wow_phase_ -= std::floor(wow_phase_);
      flutter_phase_ += flutter_step_;
      flutter_phase_ -= std::floor(flutter_phase_);
      const float motor = 0.7f * kit::SineTable::lookup(wow_phase_) + 0.25f * drift_value_ +
                          0.08f * kit::SineTable::lookup(flutter_phase_);
      const float speed = pitch_ratio_ * rate_scale_ * (1.0f + wobble_.next() * kWobbleDepth * motor);

      float left = 0.0f, right = 0.0f;
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        if (!voice.env.active()) continue;
        const float env = voice.env.next();
        if (!voice.env.active()) {
          voice.out_left = voice.out_right = 0.0f;
          continue;
        }
        play(voice, env, voice.ratio * speed);
        left += voice.out_left;
        right += voice.out_right;
      }
      const float fade = fade_in_.next() * kVoiceGain;
      left *= fade;
      right *= fade;
      if (tail_count_ < tail_length_) {
        const float gain = tail_gain();
        left += tail_left_ * gain;
        right += tail_right_ * gain;
        ++tail_count_;
      }
      last_left_ = left;
      last_right_ = right;
      const float volume = volume_.next();
      out_left_[i] = kit::soft_clip(tone_[0].lowpass(left) * volume);
      out_right_[i] = kit::soft_clip(tone_[1].lowpass(right) * volume);
    }
    idle_.settle(output_peak(frames), frames);
  }

  // --- sample entry points --------------------------------------------------------------

  int sample_capacity() { return store_.capacity(); }
  float* sample_buffer() { return store_.buffer(); }

  void sample_commit(int frames, int channels, float rate) {
    store_.commit(frames, channels, rate);
    adopt_store(channels >= 2);
    refresh_region();
    // Whatever was sounding read what has just been overwritten: let its
    // last value fade, and start held keys again on the new sound.
    tail_left_ = last_left_;
    tail_right_ = last_right_;
    tail_count_ = 0;
    bool any = false;
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.env.active()) continue;
      voice.out_left = voice.out_right = 0.0f;
      if (voice.env.releasing() || frames_ == 0) {
        voice.env.reset();
      } else {
        place(voice);
        any = true;
      }
    }
    if (any) {
      fade_in_.snap(0.0f);
      fade_in_.set_target(1.0f);
    }
  }

 private:
  struct Voice {
    kit::Adsr env;
    double position = 0.0;  // in the stored sound's frames
    float direction = 1.0f;
    float ratio = 1.0f;     // key frequency over middle C
    float gain = 0.0f;
    int mip = 0;            // mip level it reads
    float out_left = 0.0f, out_right = 0.0f;  // its last output, for a steal

    bool active() const { return env.active(); }
    bool releasing() const { return env.releasing(); }
    float level() const { return env.level(); }
  };

  // The playing region in frames, worked out on the control clock.
  struct Region {
    int start = 0, end = 0;  // [start, end)
    int mode = 1;            // 0 Off, 1 Forward, 2 Ping-pong
    bool reverse = false;
    int crossfade = 0;       // frames; 0 when it does not apply
    // Forward loop: playing forwards, End jumps to loop_start; playing
    // backwards, Start jumps to loop_end. They differ from Start and End
    // only where the sound has no lead-in for the crossfade.
    int loop_start = 0, loop_end = 0;
    float correlation = 1.0f;  // of the two stretches the crossfade blends
    // Per mip level, for the interpolation stencil at the region's edges:
    // the frame that stands for End and for Start, and the two loop spans.
    int high[3] = {0, 0, 0}, low[3] = {0, 0, 0};
    int span_forwards[3] = {0, 0, 0}, span_backwards[3] = {0, 0, 0};
  };

  // How a read treats frames past the edge its voice is heading for.
  enum Edge : int { kOpen = 0, kForwards, kBackwards };

  // One key at gain 0.7 peaks near -20 dBFS at the default volume (a
  // flute tone has little crest: that is about -25 dB RMS).
  static constexpr float kVoiceGain = 0.8f;
  static constexpr int kControlPeriod = 32;
  static constexpr float kTailSeconds = 0.008f;
  static constexpr float kCommitFadeSeconds = 0.01f;
  static constexpr float kEdgeFadeSeconds = 0.002f;
  static constexpr float kWobbleDepth = 0.01748f;  // 30 cents as a speed ratio, less one
  static constexpr int kHalfTaps = 16;     // odd taps each side of the half-band's centre
  static constexpr int kMipPerSample = 8;  // mip frames built per output sample after a commit

  // The built-in sound: 143892 frames at 48 kHz. Its middle, [21584, 122308)
  // (Start 0.15 to End 0.85), holds exactly 549 cycles of middle C, 10 of
  // vibrato and one period of the breath noise, so it loops as it stands.
  static constexpr int kDefaultFrames = 143892;
  static constexpr int kDefaultLoopStart = 21584;
  static constexpr int kDefaultLoopLength = 100724;
  static constexpr int kDefaultCycles = 549;
  static constexpr float kDefaultRate = 48000.0f;

  void build_default_sound() {
    const int n = kDefaultFrames, a = kDefaultLoopStart, length = kDefaultLoopLength;
    const int b = a + length;
    // Breath first: band-passed noise, one period per loop, the last 1024
    // frames of each period cross-faded into the next.
    kit::Rng rng;
    rng.seed(0x5BE0CD19u);
    const int blend = 1024;
    for (int c = 0; c < 2; ++c) {
      float* out = store_.channel(c);
      float low = 0.0f, lower = 0.0f;
      for (int j = 0; j < length + blend; ++j) {
        low += 0.45f * (rng.bipolar() - low);
        lower += 0.12f * (low - lower);
        const float breath = low - lower;
        if (j < length) {
          out[a + j] = breath;
        } else {
          const float t = static_cast<float>(j - length) / static_cast<float>(blend);
          out[a + j - length] = out[a + j - length] * std::sqrt(t) + breath * std::sqrt(1.0f - t);
        }
      }
      for (int i = 0; i < a; ++i) out[i] = out[i + length];
      for (int i = b; i < n; ++i) out[i] = out[i - length];
    }
    static constexpr float kHarmonics[6] = {1.0f, 0.42f, 0.18f, 0.07f, 0.035f, 0.012f};
    float* left = store_.channel(0);
    float* right = store_.channel(1);
    for (int i = 0; i < n; ++i) {
      const double x = static_cast<double>(i - a) / static_cast<double>(length);
      const float seconds = static_cast<float>(i) / kDefaultRate;
      // Envelope: a 120 ms rise, the steady middle, a 0.6 s fall to zero.
      float env = 1.0f;
      float fall = 0.0f;
      if (seconds < 0.12f) {
        const float t = seconds / 0.12f;
        env = t * t * (3.0f - 2.0f * t);
      } else if (i >= b) {
        fall = static_cast<float>(i - b) / static_cast<float>(n - b);
        env = (1.0f - fall) * (1.0f - fall);
      }
      // The attack is brighter and breathier, and starts a little flat.
      const float chiff = std::exp(-seconds / 0.04f);
      // Vibrato: ±5 cents, coming in over the first 0.4 s.
      const float vibrato_depth = 0.16f * kit::clamp((seconds - 0.1f) / 0.3f, 0.0f, 1.0f);
      const double vibrato = static_cast<double>(vibrato_depth) * std::sin(6.283185307179586 * 10.0 * x);
      const double cycles = kDefaultCycles * x + vibrato - 0.25 * static_cast<double>(chiff);
      float tone = 0.0f;
      float fade = 1.0f;
      for (int k = 0; k < 6; ++k) {
        const double phase = cycles * static_cast<double>(k + 1);
        const float amplitude = kHarmonics[k] * (k == 0 ? 1.0f : 1.0f + 1.5f * chiff) * fade;
        tone += amplitude * kit::SineTable::lookup(static_cast<float>(phase - std::floor(phase)));
        fade *= 1.0f - fall;  // the upper harmonics go first
      }
      const float swell = 1.0f + 0.04f * static_cast<float>(std::sin(6.283185307179586 * 10.0 * x + 1.0));
      const float air = 0.05f * (1.0f + 12.0f * chiff);
      left[i] = env * (0.3f * tone * swell + air * left[i]);
      right[i] = env * (0.3f * tone * swell + air * right[i]);
    }
    store_.commit(n, 2, kDefaultRate);
  }
  // --- mip levels -----------------------------------------------------------------------

  // Half-band low-pass: windowed sinc (Hamming), 63 taps of which the even
  // ones other than the centre are zero: flat to 0.22 of the sample rate,
  // 50 dB down from 0.28. halfband_[m] is tap 2m + 1.
  void design_halfband() {
    const double pi = 3.14159265358979323846;
    double sum = 0.5;
    double taps[kHalfTaps];
    for (int m = 0; m < kHalfTaps; ++m) {
      const double n = static_cast<double>(2 * m + 1);
      const double window = 0.54 + 0.46 * std::cos(pi * n / static_cast<double>(2 * kHalfTaps));
      taps[m] = std::sin(0.5 * pi * n) / (pi * n) * window;
      sum += 2.0 * taps[m];
    }
    for (int m = 0; m < kHalfTaps; ++m) halfband_[m] = static_cast<float>(taps[m] / sum);
    halfband_centre_ = static_cast<float>(0.5 / sum);
  }

  // One frame of the next level down: `source` filtered, read at `centre`.
  float decimate(const float* source, int frames, int centre) const {
    float sum = halfband_centre_ * source[centre];
    const int reach = 2 * kHalfTaps - 1;
    if (centre >= reach && centre + reach < frames) {
      for (int m = 0; m < kHalfTaps; ++m) {
        sum += halfband_[m] * (source[centre - 2 * m - 1] + source[centre + 2 * m + 1]);
      }
    } else {
      for (int m = 0; m < kHalfTaps; ++m) {
        const int below = centre - 2 * m - 1, above = centre + 2 * m + 1;
        sum += halfband_[m] * ((below >= 0 ? source[below] : 0.0f) + (above < frames ? source[above] : 0.0f));
      }
    }
    return sum;
  }

  void restart_mips() {
    mip_frames_[0] = frames_;
    mip_frames_[1] = (frames_ + 1) / 2;
    mip_frames_[2] = (mip_frames_[1] + 1) / 2;
    mip_level_ = 1;
    mip_index_ = 0;
    mips_ready_ = frames_ == 0;
  }

  // Build up to `budget` frames of the mip levels (level 1, then level 2).
  void build_mips(int budget) {
    while (budget > 0 && !mips_ready_) {
      const int level = mip_level_;
      const int total = mip_frames_[level];
      const int count = budget < total - mip_index_ ? budget : total - mip_index_;
      for (int c = 0; c < 2; ++c) {
        const float* source = level == 1 ? store_.channel(c) : mip1_[c];
        float* target = level == 1 ? mip1_[c] : mip2_[c];
        if (c == 1 && !stereo_) {
          const float* twin = level == 1 ? mip1_[0] : mip2_[0];
          for (int j = mip_index_; j < mip_index_ + count; ++j) target[j] = twin[j];
        } else {
          const int source_frames = mip_frames_[level - 1];
          for (int j = mip_index_; j < mip_index_ + count; ++j) target[j] = decimate(source, source_frames, 2 * j);
        }
      }
      mip_index_ += count;
      budget -= count;
      if (mip_index_ >= total) {
        mip_index_ = 0;
        if (++mip_level_ > 2) mips_ready_ = true;
      }
    }
  }

  void adopt_store(bool stereo) {
    frames_ = store_.frames() >= 16 ? store_.frames() : 0;
    stereo_ = stereo;
    rate_scale_ = kit::clamp(store_.sample_rate() / sample_rate(), 1.0f / 64.0f, 64.0f);
    restart_mips();
    region_dirty_ = true;
  }
  // --- reading --------------------------------------------------------------------------

  static float fetch(const float* data, int frames, int index) {
    return index >= 0 && index < frames ? data[index] : 0.0f;
  }

  // The frame a stencil index stands for. Past the edge a voice is heading
  // for, the neighbours are what it will play next: the other end of a
  // Forward loop, the mirror image in Ping-pong, the last frame with Loop
  // Off. So a loop that matches is exact, and the end of the sound is never
  // read as a drop to zero.
  int resolve(int index, int mip, int edge) const {
    const Region& region = region_;
    if (edge == kForwards && index >= region.high[mip]) {
      if (region.mode == 1) {
        index -= region.span_forwards[mip];
      } else if (region.mode == 2) {
        index = 2 * region.high[mip] - 1 - index;
      } else {
        index = region.high[mip] - 1;
      }
    } else if (edge == kBackwards && index < region.low[mip]) {
      if (region.mode == 1) {
        index += region.span_backwards[mip];
      } else if (region.mode == 2) {
        index = 2 * region.low[mip] - index;
      } else {
        index = region.low[mip];
      }
    }
    return kit::clamp_int(index, 0, mip_frames_[mip] - 1);
  }

  // The sound at `position` (in full-rate frames) from mip level `mip`,
  // Hermite-interpolated.
  void read(int mip, double position, int edge, float* left, float* right) {
    const float* data_left = mip == 0 ? store_.channel(0) : (mip == 1 ? mip1_[0] : mip2_[0]);
    const float* data_right = mip == 0 ? store_.channel(1) : (mip == 1 ? mip1_[1] : mip2_[1]);
    const double scaled = mip == 0 ? position : (mip == 1 ? position * 0.5 : position * 0.25);
    int index = static_cast<int>(scaled);
    if (scaled < 0.0) --index;
    const float t = static_cast<float>(scaled - static_cast<double>(index));
    const float t2 = t * t;
    const float t3 = t2 * t;
    const float w0 = -0.5f * t3 + t2 - 0.5f * t;
    const float w1 = 1.5f * t3 - 2.5f * t2 + 1.0f;
    const float w2 = -1.5f * t3 + 2.0f * t2 + 0.5f * t;
    const float w3 = 0.5f * (t3 - t2);
    const int floor_index = edge == kBackwards ? region_.low[mip] : 0;
    const int ceiling = edge == kForwards ? region_.high[mip] : mip_frames_[mip];
    if (index > floor_index && index < ceiling - 2) {
      const float* p = data_left + index - 1;
      *left = w0 * p[0] + w1 * p[1] + w2 * p[2] + w3 * p[3];
      if (stereo_) {
        const float* q = data_right + index - 1;
        *right = w0 * q[0] + w1 * q[1] + w2 * q[2] + w3 * q[3];
      } else {
        *right = *left;
      }
    } else {
      const int i0 = resolve(index - 1, mip, edge), i1 = resolve(index, mip, edge);
      const int i2 = resolve(index + 1, mip, edge), i3 = resolve(index + 2, mip, edge);
      *left = w0 * data_left[i0] + w1 * data_left[i1] + w2 * data_left[i2] + w3 * data_left[i3];
      *right = w0 * data_right[i0] + w1 * data_right[i1] + w2 * data_right[i2] + w3 * data_right[i3];
    }
  }

  // --- control --------------------------------------------------------------------------

  // Start, End, Loop, Reverse and Crossfade as frames. Crossfade is time in
  // the sound itself, so it shortens with the key like everything else.
  void update_region() {
    using namespace sampler;
    Region region;
    int a = static_cast<int>(static_cast<double>(param(kStart)) * frames_ + 0.5);
    int b = static_cast<int>(static_cast<double>(param(kEnd)) * frames_ + 0.5);
    if (a > b) {
      const int swap = a;
      a = b;
      b = swap;
    }
    if (b - a < 16) {
      b = a + 16;
      if (b > frames_) {
        b = frames_;
        a = b - 16 > 0 ? b - 16 : 0;
      }
    }
    region.start = a;
    region.end = b;
    region.mode = kit::clamp_int(static_cast<int>(param(kLoop) + 0.5f), 0, 2);
    region.reverse = param(kReverse) >= 0.5f;
    int fade = region.mode == 1 ? static_cast<int>(param(kCrossfade) * 0.001f * store_.sample_rate()) : 0;
    if (fade > (b - a) / 2) fade = (b - a) / 2;
    if (fade < 2) fade = 0;
    region.crossfade = fade;
    region.loop_start = a > fade ? a : fade;
    region.loop_end = b < frames_ - fade ? b : frames_ - fade;
    region.correlation = 1.0f;
    if (fade > 0) {
      // 256 points through the two stretches the crossfade blends: the end
      // of the pass and the lead-in to where it jumps (mirrored in reverse).
      const float* data = store_.channel(0);
      const int from = region.reverse ? a : b - fade;
      const int partner = region.reverse ? region.loop_end : region.loop_start - fade;
      double xy = 0.0, xx = 0.0, yy = 0.0;
      for (int k = 0; k < 256; ++k) {
        const int offset = static_cast<int>(static_cast<int64_t>(k) * fade / 256);
        const double x = data[from + offset], y = fetch(data, frames_, partner + offset);
        xy += x * y;
        xx += x * x;
        yy += y * y;
      }
      if (xx > 0.0 && yy > 0.0) region.correlation = kit::clamp(static_cast<float>(xy / std::sqrt(xx * yy)), 0.0f, 1.0f);
    }
    for (int mip = 0; mip < 3; ++mip) {
      const int scale = 1 << mip;
      region.high[mip] = (b + scale - 1) / scale;
      region.low[mip] = a / scale;
      region.span_forwards[mip] = (b - region.loop_start + scale / 2) / scale;
      region.span_backwards[mip] = (region.loop_end - a + scale / 2) / scale;
    }
    region_ = region;
  }

  // Recompute the region if a parameter behind it (or the sound) changed.
  void refresh_region() {
    using namespace sampler;
    const float key[5] = {param(kStart), param(kEnd), param(kLoop), param(kReverse), param(kCrossfade)};
    bool changed = region_dirty_;
    for (int k = 0; k < 5; ++k) {
      if (key[k] != region_key_[k]) changed = true;
      region_key_[k] = key[k];
    }
    if (changed) update_region();
    region_dirty_ = false;
  }

  // --- one voice ------------------------------------------------------------------------

  // Put a voice at the edge it starts from, on the mip level its rate needs.
  void place(Voice& voice) {
    voice.direction = region_.reverse ? -1.0f : 1.0f;
    voice.position = region_.reverse ? static_cast<double>(region_.end - 1) : static_cast<double>(region_.start);
    const float rate = voice.ratio * kit::semitones_to_ratio(pitch_.target) * rate_scale_;
    voice.mip = !mips_ready_ ? 0 : (rate > 2.2f ? 2 : (rate > 1.1f ? 1 : 0));
  }

  // One output frame of `voice` into its out_left / out_right, then move
  // its read head by `step` frames and deal with the edge of the region.
  void play(Voice& voice, float env, float step) {
    const Region& region = region_;
    const double position = voice.position;
    const bool forwards = voice.direction > 0.0f;
    float left, right;
    read(voice.mip, position, forwards ? kForwards : kBackwards, &left, &right);

    if (region.crossfade > 0) {
      // How far into the last Crossfade of this pass, and where the audio
      // that leads into the jump target is.
      const double into = forwards ? position - static_cast<double>(region.end - region.crossfade)
                                   : static_cast<double>(region.start + region.crossfade) - position;
      if (into > 0.0) {
        const double partner = forwards ? position - static_cast<double>(region.end - region.loop_start)
                                        : position + static_cast<double>(region.loop_end - region.start);
        float other_left, other_right;
        read(voice.mip, partner, kOpen, &other_left, &other_right);
        const float a = kit::clamp(static_cast<float>(into) / static_cast<float>(region.crossfade), 0.0f, 1.0f);
        // Linear blend, scaled to hold the power for this correlation.
        const float gain = 1.0f / std::sqrt(1.0f - 2.0f * a * (1.0f - a) * (1.0f - region.correlation));
        left = gain * (left + a * (other_left - left));
        right = gain * (right + a * (other_right - right));
      }
    }

    float amplitude = env * voice.gain;
    if (region.mode == 0) {
      // Loop Off: the last 2 ms before the edge fade, so a sound that does
      // not end at zero does not click.
      const double room = forwards ? static_cast<double>(region.end) - position
                                   : position - static_cast<double>(region.start);
      const float fade_frames = step * kEdgeFadeSeconds * sample_rate();
      if (room < fade_frames) amplitude *= kit::clamp(static_cast<float>(room) / fade_frames, 0.0f, 1.0f);
    }
    voice.out_left = left * amplitude;
    voice.out_right = right * amplitude;

    double next = position + static_cast<double>(voice.direction * step);
    if (forwards && next >= region.end) {
      if (region.mode == 0) {
        voice.env.reset();
      } else if (region.mode == 1) {
        next -= static_cast<double>(region.end - region.loop_start);
        if (next >= region.end) next = region.loop_start;
      } else {
        next = 2.0 * region.end - next;
        if (next < region.start) next = region.start;
        voice.direction = -1.0f;
      }
    } else if (!forwards && next < region.start) {
      if (region.mode == 0) {
        voice.env.reset();
      } else if (region.mode == 1) {
        next += static_cast<double>(region.loop_end - region.start);
        if (next < region.start) next = region.loop_end - 1;
      } else {
        next = 2.0 * region.start - next;
        if (next >= region.end) next = region.end - 1;
        voice.direction = 1.0f;
      }
    }
    voice.position = next;
  }

  // Every 32 samples.
  void control() {
    using namespace sampler;
    refresh_region();
    pitch_ratio_ = kit::semitones_to_ratio(pitch_.next());
    velocity_ = param(kVelocity);
    drift_value_ = wow_drift_.next(1);
    wow_step_ = 0.8f / sample_rate();
    flutter_step_ = 6.3f / sample_rate();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (voice.env.active()) voice.env.set(param(kAttack), 0.01f, 1.0f, param(kRelease));
    }
    const float hz = tone_hz_.next();
    for (int c = 0; c < 2; ++c) tone_[c].set(hz, kit::kSqrtHalf, sample_rate());
  }

  void apply(int id) {
    using namespace sampler;
    switch (id) {
      case kTune:
      case kFine:
        pitch_.set(param(kTune) + 0.01f * param(kFine), primed());
        break;
      case kTone:
        tone_hz_.set(param(kTone), primed());
        break;
      case kWobble:
        wobble_.set(param(kWobble), primed());
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(param(kVolume)), primed());
        break;
      default:
        break;  // read on the control clock
    }
  }

  float tail_gain() const {
    if (tail_count_ >= tail_length_) return 0.0f;
    const float t = static_cast<float>(tail_count_) / static_cast<float>(tail_length_);
    return 1.0f - t * t * (3.0f - 2.0f * t);
  }

  // Let `left`/`right`, which is about to stop, fade out instead.
  void hand_to_tail(float left, float right) {
    const float gain = tail_gain();
    tail_left_ = tail_left_ * gain + left;
    tail_right_ = tail_right_ * gain + right;
    tail_count_ = 0;
  }

  kit::SampleStore<kStoreFrames> store_;
  float mip1_[2][kStoreFrames / 2 + 4] = {};
  float mip2_[2][kStoreFrames / 4 + 4] = {};
  float halfband_[kHalfTaps] = {};
  float halfband_centre_ = 0.5f;
  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::Svf tone_[2];
  kit::Smoother tone_hz_, pitch_, wobble_, volume_;
  kit::LinearRamp fade_in_;
  kit::Drift wow_drift_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  // What the store holds.
  int frames_ = 0;
  bool stereo_ = false;
  float rate_scale_ = 1.0f;  // stored sample rate over the device's
  // Mip building.
  int mip_frames_[3] = {0, 0, 0};
  int mip_level_ = 1, mip_index_ = 0;
  bool mips_ready_ = false;
  // Control-rate values.
  Region region_;
  bool region_dirty_ = true;
  float region_key_[5] = {-1.0f, -1.0f, -1.0f, -1.0f, -1.0f};
  float pitch_ratio_ = 1.0f;
  float velocity_ = 0.6f;
  float wow_phase_ = 0.0f, flutter_phase_ = 0.0f, drift_value_ = 0.0f;
  float wow_step_ = 0.0f, flutter_step_ = 0.0f;
  // The fade-out that replaces whatever was cut off.
  float tail_left_ = 0.0f, tail_right_ = 0.0f;
  float last_left_ = 0.0f, last_right_ = 0.0f;
  int tail_count_ = 0;
  int tail_length_ = 1;
};

}  // namespace livemix
