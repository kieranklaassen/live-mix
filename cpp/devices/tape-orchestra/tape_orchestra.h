#pragma once

// Tape Orchestra: orchestral sections played from a strip of tape per key.
//
//   per key (up to 16), three or four players:
//     recording (tapes.h) read at  note × player's tuning and vibrato × tape speed
//       ─► × player's attack, swell and place ─┐
//     bow / breath noise ─► band-pass ─────────┴─► brightness ─► tape saturation
//       ─► × dropouts × tape length × attack/release ─┐
//                                                     ▼
//   out ◄─ soft clip ◄─ volume ◄─(+ hiss)◄─ tone ◄─ tape band (low cut, roll-off)
//
// Nothing here is sampled. When a key goes down its "recording" is made on
// the spot (tapes.h): one period of the instrument at that pitch, built from
// its harmonic levels by an inverse FFT, twice, a little flat and a little
// sharp of the note. A player reads that period at its own speed and leans
// from the flat one to the sharp one as its vibrato bends the pitch, so the
// harmonics move under resonances that stay where they are, as they do in a
// bowed or blown instrument. The recording depends only on the tape and the
// key, so a key is the same take every time it is struck.
//
// A key is a small section: a lead player and two or three behind it, each
// with its own tuning, place across the stereo field, entry (up to 40 ms
// late), swell, slow level wander and a vibrato that starts late and at its
// own pace. Section sets how far they differ.
//
// Every key has its own strip of tape: it sits a few cents off, has its own
// wow (0.3 to 1 Hz) and flutter (6 to 10 Hz), starts flat and comes up to
// pitch in 80 ms as the tape is gripped, drops out now and then when worn,
// and runs out after Length seconds. The tape's speed scales the read rate,
// so Half lowers the pitch, the resonances and the band together, and
// stretches everything that was recorded (attack, swell, vibrato, wow,
// length) to twice as long. What the machine does in real time (the lurch,
// Attack, Release, the hiss) keeps its own pace.
//
// Control values move once every 32 samples and ramp linearly in between.
// A block is rendered in runs that end on those ticks, so the output does
// not depend on the host's block size. One recording is made per tick: the
// last note of a ten-note chord starts 6 ms after the first.
//
// The instrument sleeps when no key sounds, and wakes with its shared
// filters and noise in the same state every time.

#include "../../kit/kit.h"
#include "params.gen.h"
#include "tapes.h"

namespace livemix {

class TapeOrchestra : public kit::DeviceBase<tape_orchestra::kNumParams> {
 public:
  static constexpr int kMaxVoices = 16;
  static constexpr int kControlPeriod = 32;
  static constexpr int kMaxPlayers = tape_orchestra_dsp::kMaxPlayers;

  // --- the tape under a key -------------------------------------------------
  // Each key sits this far from its pitch, in cents: a little when new, more
  // when worn (Age 0 .. 1).
  static constexpr float kKeyCents = 1.5f;
  static constexpr float kKeyCentsAge = 5.0f;
  // ... and this far from the others in level, in dB.
  static constexpr float kKeyLevelDb = 0.4f;
  static constexpr float kKeyLevelDbAge = 2.0f;
  // Wow and flutter, peak cents.
  static constexpr float kWowCents = 1.0f;
  static constexpr float kWowCentsAge = 11.0f;
  static constexpr float kFlutterCents = 0.3f;
  static constexpr float kFlutterCentsAge = 3.2f;
  // The lurch: a note starts this flat as the tape is gripped and comes up
  // to pitch along half a cosine in this long.
  static constexpr float kLurchCents = 4.0f;
  static constexpr float kLurchCentsAge = 46.0f;
  static constexpr float kLurchSeconds = 0.08f;
  // Dropouts start here on the Age knob.
  static constexpr float kDropoutFromAge = 0.45f;
  // The last stretch of a tape fades out.
  static constexpr float kRunOutSeconds = 0.5f;
  // Length at or above this never runs out.
  static constexpr float kEndlessFrom = 8.95f;
  // Level into the tape (the RMS of one key against the saturator's knee).
  static constexpr float kTapeLevel = 0.2f;
  static constexpr float kTapeLevelAge = 0.14f;
  // The band the tape passes at Tone 0 and Age 0.
  static constexpr float kLowCutHz = 75.0f;
  static constexpr float kRollOffHz = 7000.0f;
  // Speed changes glide, as a motor does.
  static constexpr float kSpeedGlideSeconds = 0.14f;
  // A stolen voice fades over this long before the new note takes it.
  static constexpr float kStealSeconds = 0.004f;
  // Changing Tape: sounding notes dip for this long each way.
  static constexpr float kSwapSeconds = 0.03f;
  // One key at full velocity peaks near -11 dBFS before Volume, which
  // leaves ten held keys under the knee of the output clipper.
  static constexpr float kVoiceGain = 0.138f;
  // Hiss at Hiss 1 with one key down, RMS.
  static constexpr float kHissGain = 0.012f;

  void init(float sample_rate) {
    using namespace tape_orchestra;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    recorder_.init();
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      voice.on = false;
      voice.need_record = false;
      voice.fresh = false;
      voice.let_go = false;
      voice.env = kit::Adsr();
      voice.env.set_sample_rate(sr);
      voice.cut = Ramp();
      for (float& value : voice.recording) value = 0.0f;
    }
    for (int c = 0; c < 2; ++c) {
      low_cut_[c].reset();
      roll_off_[c].reset();
      shelf_[c].reset();
      hiss_low_[c].reset();
      hiss_high_[c].reset();
      hiss_low_[c].set_cutoff(9000.0f, sr);
      hiss_high_[c].set_cutoff(600.0f, sr);
    }
    hiss_rng_[0].seed(0x3C6EF372u);
    hiss_rng_[1].seed(0xA54FF53Au);
    volume_.set_time(kSmoothingSeconds, sr);
    tilt_.set_time(kSmoothingSeconds * 4.0f, sr);
    hiss_ = Ramp();
    hiss_side_ = Ramp();
    speed_ = 1.0f;
    roll_off_hz_ = kRollOffHz;
    low_cut_hz_ = kLowCutHz;
    const float dt = static_cast<float>(kControlPeriod) / sr;
    speed_coeff_ = 1.0f - std::exp(-dt / kSpeedGlideSeconds);
    band_coeff_ = 1.0f - std::exp(-dt / 0.01f);
    drop_coeff_ = 1.0f - std::exp(-dt / 0.012f);
    // White noise through the hiss filters at 48 kHz has an RMS near 0.43;
    // at other rates the same band holds a different share of it.
    hiss_trim_ = std::sqrt(sr / 48000.0f) / 0.43f;
    for (int t = 0; t < tape_orchestra_dsp::kNumTapes; ++t) {
      noise_gain_[t] = tape_orchestra_dsp::db_to_linear(tape_orchestra_dsp::kTapes[t].noise_db);
      burst_gain_[t] = tape_orchestra_dsp::db_to_linear(tape_orchestra_dsp::kTapes[t].burst_db) - 1.0f;
      // What brings a section to unit amplitude (in phase) and to unit power.
      float sum = 1.0f, power = 1.0f;
      for (int p = 1; p < tape_orchestra_dsp::kTapes[t].players; ++p) {
        const float level = tape_orchestra_dsp::kTapes[t].blend * kPlayerLevel[p];
        sum += level;
        power += level * level;
      }
      as_one_[t] = 1.0f / sum;
      as_many_[t] = 1.0f / std::sqrt(power);
    }
    noise_speed_ = 1.0f;
    speed_moving_ = false;
    order_ = 0;
    settle_ = true;
    clock_.reset(kControlPeriod);
    // Nothing outlives the envelopes but the ring of the tape filters.
    idle_.reset(sr, 0.1f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    using namespace tape_orchestra;
    const int tape_before = static_cast<int>(param(kTape) + 0.5f);
    if (!store_param(id, value)) return;
    apply(id);
    if (id == kTape && static_cast<int>(param(kTape) + 0.5f) != tape_before) change_tape();
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, 16.0f, 12000.0f);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    // A key struck again while held: its tape is let go quickly.
    const int held = pool_.find_held(note_id);
    if (held >= 0) {
      Voice& old = pool_.voices[held];
      if (old.need_record && old.fresh) {
        old.on = false;  // never started
        old.need_record = false;
      } else {
        old.env.fast_release(0.03f);
      }
    }
    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    const bool sounding = voice.on && !voice.waiting();
    voice.on = true;
    voice.need_record = true;
    voice.fresh = true;
    voice.let_go = false;
    voice.order = ++order_;
    voice.next_frequency = frequency;
    voice.next_gain = gain;
    if (sounding) {
      // Fade what it was playing; the new note starts when that is done.
      voice.cut.step = -1.0f / (kStealSeconds * sample_rate());
    } else {
      voice.cut.value = 0.0f;
      voice.cut.step = 0.0f;
    }
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held < 0) return;
    Voice& voice = pool_.voices[held];
    if (voice.need_record && voice.fresh) {
      voice.let_go = true;
    } else {
      voice.env.gate_off();
    }
  }

  void process(int frames) {
    using namespace tape_orchestra;
    frames = begin_block(frames);
    const bool was_asleep = idle_.asleep();
    if (!idle_.wake(pool_.count_active() > 0)) {
      silence_output(frames);
      return;
    }
    clear_input(frames);  // an instrument ignores its input
    if (was_asleep) wake();
    int done = 0;
    while (done < frames) {
      // Work in runs that end on the control clock, whatever the block size.
      if (clock_.counter == 0) control();
      int count = clock_.period - clock_.counter;
      if (count > frames - done) count = frames - done;
      clock_.counter += count;
      if (clock_.counter >= clock_.period) clock_.counter = 0;

      float bus_left[kControlPeriod];
      float bus_right[kControlPeriod];
      for (int n = 0; n < count; ++n) {
        bus_left[n] = 0.0f;
        bus_right[n] = 0.0f;
      }
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        if (!voice.on || voice.waiting()) continue;
        render(voice, bus_left, bus_right, count);
      }
      for (int n = 0; n < count; ++n) {
        const float tilt = tilt_.next();
        const float volume = volume_.next();
        const float hiss = hiss_.next();
        const float side = hiss_side_.next();
        const float mid_noise = hiss_rng_[0].bipolar();
        const float side_noise = hiss_rng_[1].bipolar() * side;
        float x[2] = {bus_left[n], bus_right[n]};
        const float grain[2] = {mid_noise + side_noise, mid_noise - side_noise};
        for (int c = 0; c < 2; ++c) {
          float y = roll_off_[c].lowpass(low_cut_[c].highpass(x[c]));
          y += tilt * (y - shelf_[c].lowpass(y));
          y += hiss * hiss_low_[c].lowpass(hiss_high_[c].highpass(grain[c]));
          x[c] = kit::soft_clip(y * volume);
        }
        out_left_[done + n] = x[0];
        out_right_[done + n] = x[1];
      }
      done += count;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  // A value that moves in a straight line from one control tick to the next.
  struct Ramp {
    float value = 0.0f;
    float step = 0.0f;
    void aim(float target, bool snap) {
      if (snap) {
        value = target;
        step = 0.0f;
      } else {
        step = (target - value) * (1.0f / static_cast<float>(kControlPeriod));
      }
    }
    float next() {
      const float v = value;
      value += step;
      return v;
    }
  };

  struct Player {
    // Read per sample.
    float phase = 0.0f;
    Ramp increment;  // cycles per sample
    Ramp fade;       // 0 = period A (flat), 1 = period B (sharp)
    Ramp left, right;
    // The performance, fixed by the key (set in start_voice).
    float detune = 0.0f;        // place in the section's tuning, -1..1
    float pan = 0.0f;           // place in the image, -1..1
    float onset = 0.0f;         // seconds of tape before this player comes in, at Section 1
    float vibrato_pace = 0.0f;  // rate against the tape's, -1..1 (scaled by Section)
    float vibrato_wait = 0.0f;  // -1..1, seconds scaled by Section
    float vibrato_phase = 0.0f;
    float wander_phase[2] = {0.0f, 0.0f};  // tuning, level
    float wander_rate[2] = {0.0f, 0.0f};
    // State.
    float speak = 0.0f, voice = 0.0f;  // the attack, two poles
    float swell = 0.0f;
  };

  struct Voice {
    bool on = false;
    bool need_record = false;  // waiting for its recording (new note or new tape)
    bool fresh = false;        // ... and for a new note
    bool let_go = false;       // released before it started
    bool snap = false;         // the next control tick sets its ramps outright
    uint32_t order = 0;        // who asked first
    // The note waiting to start.
    float next_frequency = 220.0f;
    float next_gain = 0.0f;

    int tape = 0;
    float frequency = 220.0f;  // as recorded
    float velocity = 0.0f;
    float tape_time = 0.0f;    // seconds of tape played
    float gripped = 0.0f;      // seconds since the key went down
    kit::Adsr env;
    Ramp cut;                  // steal and tape-change fades, 0..1
    Ramp amp;                  // velocity, key level, run-out, dropouts
    Ramp bright;               // brightness low-pass coefficient
    Ramp noise;                // bow / breath level
    float lp_left = 0.0f, lp_right = 0.0f;
    float pre = 0.2f, post = 5.0f;  // level into and out of the saturator
    float open = 0.0f;         // how far the players have come in, 0..1
    kit::Rng noise_rng;
    float noise_low = 0.0f, noise_high = 0.0f;  // the noise band's two poles
    float noise_low_coeff = 0.0f, noise_high_coeff = 0.0f;
    float noise_level = 0.0f;  // of the band against the tone, at full speed
    float noise_centre = 1000.0f;  // of the band, at full speed
    float burst = 0.0f;        // the scrape or chiff, dying away
    bool retune = false;       // the noise band has to be set
    // This key's tape (set in start_voice).
    float key_cents = 0.0f, key_level = 0.0f;  // -1..1
    float wow_phase = 0.0f, wow_rate = 0.0f, sway_phase = 0.0f;
    float flutter_phase = 0.0f, flutter_rate = 0.0f;
    kit::Rng drop_rng;
    float drop_at = 0.0f, drop_until = 0.0f, drop_depth = 0.0f, drop = 0.0f;
    Player player[kMaxPlayers];
    float recording[tape_orchestra_dsp::kRecordingFloats] = {};

    bool waiting() const { return need_record && cut.value <= 0.0f; }
    bool active() const { return on; }
    bool releasing() const { return on && !(need_record && fresh) && env.releasing(); }
    float level() const { return (need_record && fresh) ? 2.0f : env.level() * amp.value; }
  };

  // How loud each player is under the first, before the tape's own blend.
  static constexpr float kPlayerLevel[kMaxPlayers] = {1.0f, 1.0f, 0.85f, 0.7f};

  // The tape's curve: a cubic with a trace of asymmetry, flat where it is
  // clamped. Third order only, so a recording that ends near 10 kHz folds
  // nothing audible back at 44.1 kHz.
  static constexpr float kEven = 0.05f;
  static constexpr float kClampHigh = 1.0512492f;   // kEven + sqrt(kEven² + 1)
  static constexpr float kClampLow = -0.9512492f;   // kEven - sqrt(kEven² + 1)
  static float saturate(float x) {
    x = x < kClampLow ? kClampLow : (x > kClampHigh ? kClampHigh : x);
    return x + x * x * (kEven - x * (1.0f / 3.0f));
  }

  // `count` samples of one key, added to the bus.
  void render(Voice& voice, float* bus_left, float* bus_right, int count) {
    using namespace tape_orchestra_dsp;
    float mix_left[kControlPeriod];
    float mix_right[kControlPeriod];
    for (int n = 0; n < count; ++n) {
      mix_left[n] = 0.0f;
      mix_right[n] = 0.0f;
    }
    const float* recording = voice.recording;
    for (int p = 0; p < kMaxPlayers; ++p) {
      Player& player = voice.player[p];
      if (player.left.value == 0.0f && player.left.step == 0.0f && player.right.value == 0.0f &&
          player.right.step == 0.0f) {
        continue;  // not playing (yet)
      }
      float phase = player.phase;
      float increment = player.increment.value;
      float fade = player.fade.value;
      float left = player.left.value;
      float right = player.right.value;
      const float increment_step = player.increment.step;
      const float fade_step = player.fade.step;
      const float left_step = player.left.step;
      const float right_step = player.right.step;
      for (int n = 0; n < count; ++n) {
        const float position = phase * static_cast<float>(kTableSize);
        const int index = static_cast<int>(position);
        const float fraction = position - static_cast<float>(index);
        const float* frame = recording + 2 * index;
        const float a = frame[0] + (frame[2] - frame[0]) * fraction;
        const float b = frame[1] + (frame[3] - frame[1]) * fraction;
        const float sample = a + (b - a) * fade;
        mix_left[n] += sample * left;
        mix_right[n] += sample * right;
        phase += increment;
        if (phase >= 1.0f) phase -= 1.0f;
        increment += increment_step;
        fade += fade_step;
        left += left_step;
        right += right_step;
      }
      player.phase = phase;
      player.increment.value = increment;
      player.fade.value = fade;
      player.left.value = left;
      player.right.value = right;
    }

    // Bow or breath noise through two one-pole filters, the brightness
    // low-pass, the tape, and the level. State lives in locals for the run.
    const float pre = voice.pre;
    const float post = voice.post;
    const float noise_low_coeff = voice.noise_low_coeff;
    const float noise_high_coeff = voice.noise_high_coeff;
    float noise_low = voice.noise_low;
    float noise_high = voice.noise_high;
    float noise = voice.noise.value;
    float bright = voice.bright.value;
    float amp = voice.amp.value;
    float cut = voice.cut.value;
    float cut_step = voice.cut.step;
    float lp_left = voice.lp_left;
    float lp_right = voice.lp_right;
    const float noise_step = voice.noise.step;
    const float bright_step = voice.bright.step;
    const float amp_step = voice.amp.step;
    kit::Rng rng = voice.noise_rng;
    for (int n = 0; n < count; ++n) {
      const float white = rng.bipolar();
      noise_low += (white - noise_low) * noise_low_coeff;
      noise_high += (white - noise_low - noise_high) * noise_high_coeff;
      const float breath = noise_high * noise;
      lp_left += (mix_left[n] + breath - lp_left) * bright;
      lp_right += (mix_right[n] + breath - lp_right) * bright;
      cut += cut_step;
      if (cut <= 0.0f) {
        cut = 0.0f;
        cut_step = 0.0f;
      } else if (cut >= 1.0f) {
        cut = 1.0f;
        cut_step = 0.0f;
      }
      const float gain = voice.env.next() * amp * cut * post;
      bus_left[n] += saturate(lp_left * pre) * gain;
      bus_right[n] += saturate(lp_right * pre) * gain;
      noise += noise_step;
      bright += bright_step;
      amp += amp_step;
    }
    voice.noise_rng = rng;
    voice.noise_low = flush_denormal(noise_low);
    voice.noise_high = flush_denormal(noise_high);
    voice.noise.value = noise;
    voice.bright.value = bright;
    voice.amp.value = amp;
    voice.cut.value = cut;
    voice.cut.step = cut_step;
    voice.lp_left = flush_denormal(lp_left);
    voice.lp_right = flush_denormal(lp_right);
    // Faded out, or stopped before its new tape arrived: the voice is free.
    if (!voice.env.active() && !(voice.need_record && voice.fresh)) {
      voice.on = false;
      voice.need_record = false;
    }
  }

  // Every 32 samples: the motor, one waiting note, the tape band, the keys.
  void control() {
    using namespace tape_orchestra;
    const float sr = sample_rate();
    const float dt = static_cast<float>(kControlPeriod) / sr;

    // The motor: Speed glides between full and half.
    const float speed = param(kSpeed) > 0.5f ? 0.5f : 1.0f;
    speed_moving_ = settle_ || speed_ != speed;
    if (settle_) {
      speed_ = speed;
    } else {
      speed_ += (speed - speed_) * speed_coeff_;
      if (speed_ - speed < 1.0e-4f && speed - speed_ < 1.0e-4f) speed_ = speed;
    }

    noise_speed_ = 1.0f / std::sqrt(speed_);

    // One recording per tick: a chord's notes start within a few
    // milliseconds of each other, in the order they were played.
    Voice* next = nullptr;
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (voice.on && voice.waiting() && (!next || voice.order < next->order)) next = &voice;
    }
    if (next) start(*next);

    // The band the tape passes: narrower with Age, lower at half speed.
    const float age = param(kAge);
    const float tone = param(kTone);
    const float roll_off = kRollOffHz * std::exp2(tone * (tone < 0.0f ? 1.6f : 0.55f)) *
                           (1.0f - 0.5f * age) * speed_;
    const float low_cut = kLowCutHz * (1.0f + 0.8f * age) * speed_;
    if (settle_) {
      roll_off_hz_ = roll_off;
      low_cut_hz_ = low_cut;
    } else {
      roll_off_hz_ += (roll_off - roll_off_hz_) * band_coeff_;
      low_cut_hz_ += (low_cut - low_cut_hz_) * band_coeff_;
    }
    low_cut_[0].set(low_cut_hz_, 0.9f, sr);
    roll_off_[0].set(roll_off_hz_, 0.62f, sr);
    copy_tuning(low_cut_[0], &low_cut_[1]);
    copy_tuning(roll_off_[0], &roll_off_[1]);
    shelf_[0].set_cutoff(1200.0f * speed_, sr);
    shelf_[1].a = shelf_[0].a;

    float sounding = 0.0f;
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.on || voice.waiting()) continue;
      sounding += control_voice(voice, dt, sr);
    }

    // Hiss: every key down adds its tape's noise, and powers add.
    const float amount = param(kHiss);
    const float hiss = kHissGain * amount * (0.25f + 0.75f * amount) * std::sqrt(sounding) *
                       hiss_trim_;
    hiss_.aim(hiss, settle_);
    if (hiss == 0.0f && hiss_.value < 1.0e-6f) hiss_.aim(0.0f, true);
    hiss_side_.aim(0.8f * param(kSpread), settle_);
    settle_ = false;
  }

  static uint32_t scramble(uint32_t x) {
    x ^= x >> 16;
    x *= 0x7FEB352Du;
    x ^= x >> 15;
    x *= 0x846CA68Bu;
    x ^= x >> 16;
    return x == 0 ? 0x2545F491u : x;
  }

  // 1 - e^-x for x >= 0, within a few percent: the coefficient of a one-pole
  // low-pass whose corner is x / 2π of the sample rate.
  static float pole(float x) {
    return 1.0f - 1.0f / (1.0f + x * (1.0f + x * (0.5f + x * (1.0f / 6.0f))));
  }

  // 2^(cents/1200) to second order: exact to 0.01 cent over ±100 cents.
  static float ratio(float cents) {
    const float x = cents * (0.69314718f / 1200.0f);
    return 1.0f + x + 0.5f * x * x;
  }

  // Give a waiting voice its recording. A new note also gets its players
  // and its tape, all fixed by the key: the same key is the same take.
  void start(Voice& voice) {
    using namespace tape_orchestra;
    using namespace tape_orchestra_dsp;
    const int tape = kit::clamp_int(static_cast<int>(param(kTape) + 0.5f), 0, kNumTapes - 1);
    if (voice.fresh) {
      voice.frequency = voice.next_frequency;
      voice.velocity = 0.35f + 0.65f * voice.next_gain;
    }
    const int key =
        kit::clamp_int(static_cast<int>(std::floor(kit::hz_to_midi(voice.frequency) + 0.5f)), 0, 140);
    const uint32_t seed = scramble(static_cast<uint32_t>(key * 8 + tape + 1));
    recorder_.record(tape, voice.frequency, seed, voice.recording);
    voice.tape = tape;
    voice.need_record = false;
    {
      // The noise band of this tape at this key, and the gain that puts it
      // at the tape's level under a tone of unit RMS (its RMS through the
      // two poles is 0.577 * sqrt(3.614 * centre / rate)).
      const TapeDef& def = kTapes[tape];
      const float sr = sample_rate();
      voice.noise_centre =
          kit::clamp(def.noise_hz + def.noise_track * voice.frequency, 100.0f, 0.25f * sr);
      voice.noise_level = noise_gain_[tape] * 0.707f /
                          (0.577f * std::sqrt(3.614f * voice.noise_centre / sr));
      voice.retune = true;
    }
    if (!voice.fresh) {
      voice.cut.step = 1.0f / (kSwapSeconds * sample_rate());
      return;
    }
    voice.fresh = false;

    kit::Rng rng;
    rng.seed(scramble(seed ^ 0x9E3779B9u));
    voice.tape_time = 0.0f;
    voice.gripped = 0.0f;
    voice.lp_left = 0.0f;
    voice.lp_right = 0.0f;
    voice.open = 0.0f;
    voice.noise_low = 0.0f;
    voice.noise_high = 0.0f;
    voice.burst = burst_gain_[tape];
    voice.noise_rng.seed(scramble(seed ^ 0x51ED270Bu));
    voice.key_cents = rng.bipolar();
    voice.key_level = rng.bipolar();
    voice.wow_phase = rng.uniform();
    voice.wow_rate = 0.3f + 0.7f * rng.uniform();
    voice.sway_phase = rng.uniform();
    voice.flutter_phase = rng.uniform();
    voice.flutter_rate = 6.0f + 4.0f * rng.uniform();
    voice.drop_rng.seed(scramble(seed ^ 0x0BADC0DEu));
    voice.drop_at = 0.3f + 1.5f * voice.drop_rng.uniform();
    voice.drop_until = 0.0f;
    voice.drop_depth = 0.0f;
    voice.drop = 0.0f;

    // Where each player sits in the tuning and in the image, for sections
    // of three and of four; alternate keys are seated the other way round.
    static constexpr float kDetune[2][kMaxPlayers] = {{0.1f, -1.0f, 0.9f, 0.0f},
                                                      {-0.1f, 1.0f, -1.0f, 0.4f}};
    static constexpr float kSeat[2][kMaxPlayers] = {{0.3f, -0.85f, 0.85f, 0.0f},
                                                    {-0.3f, 0.85f, -0.85f, 0.4f}};
    const int layout = kTapes[tape].players >= 4 ? 1 : 0;
    const float side = rng.uniform() < 0.5f ? -1.0f : 1.0f;
    const float apart = kit::clamp(param(kPlayers) * 5.0f, 0.0f, 1.0f);
    const float vibrato_phase = rng.uniform();
    for (int p = 0; p < kMaxPlayers; ++p) {
      Player& player = voice.player[p];
      player = Player();
      player.detune = kDetune[layout][p] * (0.75f + 0.25f * rng.uniform());
      player.pan = kit::clamp(side * (kSeat[layout][p] + 0.15f * rng.bipolar()), -1.0f, 1.0f);
      player.onset = p == 0 ? 0.0f : rng.uniform();
      player.vibrato_pace = rng.bipolar();
      player.vibrato_wait = rng.bipolar();
      player.vibrato_phase = vibrato_phase + 0.5f * apart * rng.bipolar();
      player.vibrato_phase -= std::floor(player.vibrato_phase);
      player.wander_phase[0] = rng.uniform();
      player.wander_phase[1] = rng.uniform();
      player.wander_rate[0] = 0.17f + 0.3f * rng.uniform();
      player.wander_rate[1] = 0.11f + 0.25f * rng.uniform();
      player.phase = apart * rng.uniform();
    }

    voice.env.reset();
    voice.env.set(param(kAttack), 0.01f, 1.0f, param(kRelease));
    voice.env.gate_on();
    if (voice.let_go) voice.env.gate_off();
    voice.let_go = false;
    voice.cut.value = 1.0f;
    voice.cut.step = 0.0f;
    voice.snap = true;
  }

  // One key, every 32 samples: its tape's speed, its players, its level.
  // Returns the weight of its hiss (a power).
  float control_voice(Voice& voice, float dt, float sr) {
    using namespace tape_orchestra;
    using namespace tape_orchestra_dsp;
    const TapeDef& def = kTapes[voice.tape];
    const bool snap = voice.snap;
    voice.snap = false;
    const float age = param(kAge);
    const float section = param(kPlayers);
    const float spread = param(kSpread);
    const float vibrato = param(kVibrato);
    // What is on the tape runs at the tape's speed; the machine does not.
    const float tape_dt = dt * speed_;
    voice.env.set(param(kAttack), 0.01f, 1.0f, param(kRelease));

    // The transport of this key.
    const float wow = 0.8f * kit::SineTable::lookup(voice.wow_phase) +
                      0.2f * kit::SineTable::lookup(voice.sway_phase);
    const float flutter = kit::SineTable::lookup(voice.flutter_phase);
    voice.wow_phase += voice.wow_rate * tape_dt;
    voice.wow_phase -= std::floor(voice.wow_phase);
    voice.sway_phase += voice.wow_rate * 0.37f * tape_dt;
    voice.sway_phase -= std::floor(voice.sway_phase);
    voice.flutter_phase += voice.flutter_rate * tape_dt;
    voice.flutter_phase -= std::floor(voice.flutter_phase);
    float lurch = 0.0f;
    if (voice.gripped < kLurchSeconds) {
      lurch = 0.5f + 0.5f * kit::SineTable::cos_lookup(0.5f * voice.gripped / kLurchSeconds);
      voice.gripped += dt;
    }
    const float cents = voice.key_cents * (kKeyCents + kKeyCentsAge * age) +
                        wow * (kWowCents + kWowCentsAge * age) +
                        flutter * (kFlutterCents + kFlutterCentsAge * age) -
                        lurch * (kLurchCents + kLurchCentsAge * age * age);
    const float base = voice.frequency / sr * speed_ * ratio(cents);

    // Dropouts sit at fixed places on a key's tape; Age makes them deep.
    if (voice.tape_time >= voice.drop_at) {
      voice.drop_until = voice.drop_at + 0.04f + 0.12f * voice.drop_rng.uniform();
      voice.drop_depth = 0.35f + 0.5f * voice.drop_rng.uniform();
      voice.drop_at += 0.5f + 2.2f * voice.drop_rng.uniform();
    }
    const float wear = smoothstep((age - kDropoutFromAge) / (1.0f - kDropoutFromAge));
    const float dip = voice.tape_time < voice.drop_until ? voice.drop_depth * wear : 0.0f;
    voice.drop += (dip - voice.drop) * drop_coeff_;

    // The end of the tape.
    float run_out = 1.0f;
    const float length = param(kLength);
    if (length < kEndlessFrom) {
      const float left = (length - voice.tape_time) / kRunOutSeconds;
      if (left <= 0.0f && !(voice.need_record && voice.fresh)) voice.env.reset();
      run_out = kit::clamp(left, 0.0f, 1.0f);
      run_out *= run_out;
    }

    // The players.
    // The first player leads and the others sit under them, so the section
    // thickens the note without the deep beating of equal voices. Together
    // they are scaled to one player's power (or, played as one, amplitude).
    const int players = def.players;
    const float apart = kit::clamp(section * 5.0f, 0.0f, 1.0f);
    const float norm = as_one_[voice.tape] + (as_many_[voice.tape] - as_one_[voice.tape]) * apart;
    const float speak_x = tape_dt / (def.attack * 0.4f);
    const float speak_coeff = speak_x / (1.0f + speak_x);
    const float swell_x = tape_dt / (def.swell * 0.35f);
    const float swell_coeff = swell_x / (1.0f + swell_x);
    float open = 0.0f;
    for (int p = 0; p < kMaxPlayers; ++p) {
      Player& player = voice.player[p];
      const bool in = p < players && voice.tape_time >= player.onset * 0.04f * section;
      const float goal = in ? 1.0f : 0.0f;
      player.speak += (goal - player.speak) * speak_coeff;
      player.voice += (player.speak - player.voice) * speak_coeff;
      player.swell += (goal - player.swell) * swell_coeff;
      if (!in && player.voice < 1.0e-4f) {
        player.speak = 0.0f;
        player.voice = 0.0f;
        player.swell = 0.0f;
        player.left.aim(0.0f, true);
        player.right.aim(0.0f, true);
        continue;
      }
      float level = player.voice * (1.0f - def.swell_amount * (1.0f - player.swell));
      open += level;

      const float tuning = kit::SineTable::lookup(player.wander_phase[0]);
      const float loud = kit::SineTable::lookup(player.wander_phase[1]);
      for (int w = 0; w < 2; ++w) {
        player.wander_phase[w] += player.wander_rate[w] * tape_dt;
        player.wander_phase[w] -= std::floor(player.wander_phase[w]);
      }
      level *= 1.0f + 0.12f * section * loud;

      // Vibrato arrives late and at the player's own rate.
      const float since = voice.tape_time - (0.3f + 0.2f * section * player.vibrato_wait);
      const float shake = smoothstep(since * 2.0f) * vibrato *
                          (1.0f + 0.2f * section * player.vibrato_wait) *
                          kit::SineTable::lookup(player.vibrato_phase);
      player.vibrato_phase +=
          def.vibrato_hz * (1.0f + 0.12f * section * player.vibrato_pace) * tape_dt;
      player.vibrato_phase -= std::floor(player.vibrato_phase);
      const float bend = def.detune_cents * section * player.detune + 3.0f * section * tuning +
                         def.vibrato_cents * shake;
      level *= (1.0f + def.tremolo * shake) * norm * (p == 0 ? 1.0f : def.blend * kPlayerLevel[p]);
      player.increment.aim(base * ratio(bend), snap);
      player.fade.aim(kit::clamp(0.5f + bend * (0.5f / kVibratoSpanCents), 0.0f, 1.0f), snap);
      const float angle = (player.pan * spread + 1.0f) * 0.125f;
      player.left.aim(level * kit::SineTable::cos_lookup(angle), snap);
      player.right.aim(level * kit::SineTable::lookup(angle), snap);
    }
    open *= 1.0f / static_cast<float>(players);
    voice.open = open;

    // Brightness opens as the players come in; a dropout dulls it.
    const float closed = def.closed_hz + def.closed_track * voice.frequency;
    const float opened = def.open_hz + def.open_track * voice.frequency;
    float cutoff = closed + (opened - closed) * open * open * open;
    cutoff *= (0.6f + 0.4f * voice.velocity) * (1.0f - 0.7f * voice.drop) * speed_;
    cutoff = kit::min(cutoff, 0.45f * sr);
    voice.bright.aim(pole(kit::kTwoPi * cutoff / sr), snap);

    // Bow or breath: follows the tone, with a burst as the note starts. The
    // band is on the tape, so it comes down with the speed.
    if (voice.retune || speed_moving_) {
      const float centre = voice.noise_centre * speed_;
      voice.noise_low_coeff = pole(kit::kTwoPi * centre * 0.625f / sr);
      voice.noise_high_coeff = pole(kit::kTwoPi * centre * 1.6f / sr);
      voice.retune = false;
    }
    voice.noise.aim(voice.noise_level * noise_speed_ * open * (1.0f + voice.burst), snap);
    voice.burst *= 1.0f / (1.0f + tape_dt / def.burst_seconds);

    // e^y to second order: the key's level is within a few dB of the rest.
    const float y = 0.1151293f * voice.key_level * (kKeyLevelDb + kKeyLevelDbAge * age);
    voice.amp.aim(kVoiceGain * voice.velocity * (1.0f + y + 0.5f * y * y) * run_out *
                      (1.0f - voice.drop),
                  snap);
    voice.pre = kTapeLevel + kTapeLevelAge * age;
    voice.post = 1.0f / voice.pre;
    voice.tape_time += tape_dt;
    const float weight = voice.env.level() * voice.cut.value * run_out;
    return weight * weight;
  }

  static void copy_tuning(const kit::Svf& from, kit::Svf* to) {
    to->g = from.g;
    to->k = from.k;
    to->a1 = from.a1;
    to->a2 = from.a2;
    to->a3 = from.a3;
  }

  // Back from sleep: whatever moved while nothing sounded is simply there,
  // and the control clock starts on the first sample.
  void wake() {
    volume_.snap(volume_.target);
    tilt_.snap(tilt_.target);
    for (int c = 0; c < 2; ++c) {
      low_cut_[c].reset();
      roll_off_[c].reset();
      shelf_[c].reset();
      hiss_low_[c].reset();
      hiss_high_[c].reset();
    }
    hiss_ = Ramp();
    clock_.reset(kControlPeriod);
    settle_ = true;
  }

  // Tape was switched: the keys that are down cross over to the new one.
  void change_tape() {
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.on || voice.need_record || voice.env.releasing()) continue;
      voice.need_record = true;
      voice.fresh = false;
      voice.order = ++order_;
      voice.cut.step = -1.0f / (kSwapSeconds * sample_rate());
    }
  }

  void apply(int id) {
    using namespace tape_orchestra;
    const float value = param(id);
    switch (id) {
      case kTone:
        tilt_.set(value > 0.0f ? value : 0.5f * value, primed());
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      default:
        break;  // read on the control clock
    }
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  tape_orchestra_dsp::Recorder recorder_;
  kit::Svf low_cut_[2], roll_off_[2];
  kit::OnePole shelf_[2], hiss_low_[2], hiss_high_[2];
  kit::Rng hiss_rng_[2];
  kit::Smoother volume_, tilt_;
  Ramp hiss_;
  Ramp hiss_side_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  float speed_ = 1.0f;       // tape speed now, 0.5..1
  float roll_off_hz_ = 7000.0f;
  float low_cut_hz_ = 75.0f;
  // Per control tick.
  float speed_coeff_ = 0.0f, band_coeff_ = 0.0f, drop_coeff_ = 0.0f;
  float hiss_trim_ = 1.0f;
  float noise_speed_ = 1.0f;  // keeps the noise at its level as its band narrows
  bool speed_moving_ = false;
  // Per tape: the noise under the tone and the extra at the start, linear.
  float noise_gain_[tape_orchestra_dsp::kNumTapes] = {};
  float burst_gain_[tape_orchestra_dsp::kNumTapes] = {};
  float as_one_[tape_orchestra_dsp::kNumTapes] = {};
  float as_many_[tape_orchestra_dsp::kNumTapes] = {};
  uint32_t order_ = 0;
  bool settle_ = true;       // the next control tick snaps instead of gliding
};

}  // namespace livemix
