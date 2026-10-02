#pragma once

// Tanpura: the four-string drone lute. A held key is a tanpura tuned to that
// key: its four strings are plucked one after another, round and round.
//
//   held key ─► pluck clock ─► finger, then a soft pluck ─► string 1..4 (jawari_string.h)
//                                                               │  at twice the sample rate
//   per key (a pool of them)                                    ▼
//                     place in the stereo field ─► sum ─► 2x down ─► DC ─► spread ─► gourd ─► volume
//
// - The key is the Sa of the two middle strings. The first string is the Pa
//   (a fourth below), the Ma (a fifth below) or the Ni (a semitone below),
//   and the last the Sa an octave down: 3 : 4 : 4 : 2 on Pa.
// - Each string is a stiff string loop with a jawari bridge. That bridge is
//   the instrument: every pluck opens into a band of overtones that slides
//   down as the string rings.
// - Before a pluck the finger rests on the string for a moment, so a string
//   is plucked again rather than piled onto itself. Pluck times, strengths
//   and places vary a little from one per-key generator, the same way after
//   every init.
// - Releasing the key stops the plucking and damps the strings; when the
//   last has rung down the voice is free and the instrument sleeps.
//
// Tuning, Decay and Detune reach a string at its next pluck. Jawari, Body,
// Spread and Volume move at once and are smoothed.

#include "../../kit/kit.h"
#include "jawari_string.h"
#include "params.gen.h"

namespace livemix {

class Tanpura : public kit::DeviceBase<tanpura::kNumParams> {
 public:
  static constexpr int kMaxVoices = 8;
  static constexpr int kStrings = 4;
  // C1 to C7. The lowest string is an octave under the key.
  static constexpr float kMinHz = 32.7f;
  static constexpr float kMaxHz = 2093.0f;

  // What a lone string needs to be heard as the instrument hears it (the
  // harness plucks one by itself). All choices.
  // A fingertip is a soft pluck, so the pick filter sits a few harmonics
  // above the string, whatever its pitch.
  static constexpr float kPickHarmonics = 4.6f;
  // The bridge shifts a string's rest position while it buzzes: DC and a
  // slow heave under it that no gourd would radiate.
  static constexpr float kDcHz = 25.0f;
  // The bloom is nearly all there at half contact, so the Jawari knob is
  // bent to grow it evenly along its length (see the harness).
  static float contact_for(float jawari) { return jawari * std::sqrt(jawari); }

  void init(float sample_rate) {
    using namespace tanpura;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    loop_rate_ = 2.0f * sr;
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      for (int k = 0; k < kStrings; ++k) voice.strings[k].init(loop_rate_, sr / kChunk);
      stop(voice);
      voice.rng.seed(0x7A4B1D35u + 7919u * static_cast<uint32_t>(v));
      voice.fingered = false;
      voice.clock = 0.0f;
      voice.pace = 1.0f;
      voice.next = voice.excited = 0;
    }
    for (int k = 0; k < kStrings; ++k) kit::pan_gains(kPan[k], &pan_[k][0], &pan_[k][1]);
    for (int c = 0; c < 2; ++c) {
      half_[c].init();
      dc_[c].reset();
      dc_[c].set_cutoff(kDcHz, sr);
      for (int m = 0; m < kBodyModes; ++m) {
        body_[c][m].reset();
        body_[c][m].set(kBodyHz[m], kBodyQ[m], sr);
      }
    }
    jawari_.set_time(kSmoothingSeconds, sr);
    width_.set_time(kSmoothingSeconds, sr);
    body_amount_.set_time(kSmoothingSeconds, sr);
    volume_.set_time(kSmoothingSeconds, sr);
    steal_step_ = 1.0f / (0.002f * loop_rate_);
    chunk_left_ = 0;
    // Nothing outlives the strings but the decimator and the gourd.
    idle_.reset(sr, 0.25f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, kMinHz, kMaxHz);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    const int held = pool_.find_held(note_id);
    bool stolen = false;
    Voice& voice = pool_.voices[held >= 0 ? held : pool_.note_on(note_id, &stolen)];
    // Read at the next pluck; a voice that is fading out plucks no more.
    voice.key_hz = frequency;
    voice.amp = 0.25f + 0.75f * gain;
    if (held >= 0) {
      // A key struck again keeps its tanpura and starts the round over: the
      // finger goes to the first string and plucks it a moment later. One
      // still waiting for its stolen voice just takes the new pitch.
      if (voice.pending) return;
      voice.next = 0;
      voice.fingered = false;
      voice.clock = 1.0f - finger_lead();
    } else if (stolen) {
      // Fade the old tanpura over 2 ms, then start (see control).
      voice.pending = true;
      voice.fading = true;
      voice.held = false;
    } else {
      start(voice);
    }
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held < 0) return;
    Voice& voice = pool_.voices[held];
    // Released before its stolen start: it never sounds, the fade runs out.
    voice.pending = false;
    voice.held = false;
    for (int k = 0; k < kStrings; ++k) voice.strings[k].damp(kReleaseSeconds);
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(pool_.count_active() > 0)) {
      silence_output(frames);
      return;
    }
    clear_input(frames);  // an instrument ignores its input
    int done = 0;
    while (done < frames) {
      if (chunk_left_ == 0) {
        control();
        chunk_left_ = kChunk;
      }
      const int n = kit::clamp_int(frames - done, 1, chunk_left_);
      float left[2 * kChunk] = {}, right[2 * kChunk] = {}, contact[2 * kChunk];
      for (int i = 0; i < n; ++i) contact[2 * i] = contact[2 * i + 1] = contact_for(jawari_.next());
      for (int v = 0; v < kMaxVoices; ++v) {
        if (pool_.voices[v].sounding) render_voice(pool_.voices[v], n, contact, left, right);
      }
      finish_chunk(left, right, n, done);
      chunk_left_ -= n;
      done += n;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr int kChunk = 16;  // control period, host samples

  // Sa of the middle strings is 1. The first string comes from Tuning.
  static constexpr float kFirstString[3] = {3.0f / 4.0f, 2.0f / 3.0f, 15.0f / 16.0f};
  // Where each string sits with Spread at 1: the two middle strings, which
  // beat against each other, wide apart; the first and the low one inside.
  static constexpr float kPan[kStrings] = {-0.35f, 0.8f, -0.8f, 0.2f};

  // The player. All choices.
  static constexpr float kFingerSeconds = 0.03f;  // the finger rests this long before a pluck
  static constexpr float kFingerRing = 0.05f;     // and the string under it rings this long
  static constexpr float kReleaseSeconds = 3.0f;  // ring time once the key is up
  static constexpr float kTimeSpread = 0.03f;     // pluck to pluck
  static constexpr float kLevelSpreadDb = 1.5f;
  static constexpr float kPlaceSpread = 0.02f;    // around the middle of the string

  // The gourd: five broad resonances, the same on both sides so that Spread
  // at zero is exactly mono. Loosely a large gourd's air and plate modes.
  static constexpr int kBodyModes = 5;
  static constexpr float kBodyHz[kBodyModes] = {98.0f, 187.0f, 262.0f, 410.0f, 640.0f};
  static constexpr float kBodyQ[kBodyModes] = {4.0f, 5.0f, 6.0f, 6.0f, 6.0f};
  static constexpr float kBodyGain[kBodyModes] = {0.9f, 1.0f, 0.8f, 0.6f, 0.45f};

  // A full pluck swings a string by about 2; this puts one key at full
  // velocity near -12 dBFS before Volume.
  static constexpr float kOutGain = 0.12f;

  struct Voice {
    JawariString strings[kStrings];
    kit::PluckExciter exciter;
    kit::Rng rng;
    float key_hz = 110.0f;
    float amp = 0.0f;
    float clock = 0.0f;  // 0 at a pluck, 1 at the next
    float pace = 1.0f;   // this pluck's share of the even time
    int next = 0;        // the string the finger goes to
    int excited = 0;     // the string the pluck is in
    float steal = 1.0f;  // fades the old tanpura out before a stolen start
    bool sounding = false, held = false, fingered = false, fading = false, pending = false;

    bool active() const { return sounding; }
    bool releasing() const { return !held && !pending; }
    float level() const {
      float most = 0.0f;
      for (int k = 0; k < kStrings; ++k) most = kit::max(most, strings[k].level());
      return most;
    }
  };

  float pluck_seconds() const { return 0.25f * param(tanpura::kSpeed); }
  float finger_lead() const { return kit::min(0.5f, kFingerSeconds / pluck_seconds()); }

  // A fresh tanpura on the voice's key: nothing rings, the first string is
  // plucked at once.
  void start(Voice& voice) {
    stop(voice);
    voice.sounding = voice.held = true;
    voice.next = 0;
    pluck(voice);
  }

  // Pluck the string the finger is on and move to the next.
  void pluck(Voice& voice) {
    using namespace tanpura;
    const int k = voice.next;
    const float detune = kit::cents_to_ratio(0.5f * param(kDetune));
    const float ratios[kStrings] = {kFirstString[kit::clamp_int(static_cast<int>(param(kTuning) + 0.5f), 0, 2)],
                                    1.0f / detune, detune, 0.5f};
    const float hz = voice.key_hz * ratios[k];
    voice.strings[k].strike(hz, param(kDecay), 0.5f + kPlaceSpread * voice.rng.bipolar());
    const float amp = voice.amp * kit::db_to_gain(kLevelSpreadDb * voice.rng.bipolar());
    voice.exciter.strike(amp, hz, kPickHarmonics * hz, 0.0f, loop_rate_);
    voice.excited = k;
    voice.next = (k + 1) % kStrings;
    voice.clock = 0.0f;
    voice.pace = 1.0f + kTimeSpread * voice.rng.bipolar();
    voice.fingered = false;
  }

  // Every kChunk samples: the pluck clocks, string levels, voices ending.
  void control() {
    const float step = static_cast<float>(kChunk) / (sample_rate() * pluck_seconds());
    const float lead = finger_lead();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.sounding) continue;
      if (voice.fading) {
        if (voice.steal > 0.0f) continue;
        if (voice.pending) {
          start(voice);
        } else {
          stop(voice);
        }
        continue;
      }
      for (int k = 0; k < kStrings; ++k) voice.strings[k].follow();
      if (voice.held) {
        voice.clock += step / voice.pace;
        if (!voice.fingered && voice.clock >= 1.0f - lead) {
          voice.strings[voice.next].damp(kFingerRing);
          voice.fingered = true;
        }
        if (voice.clock >= 1.0f) pluck(voice);
      } else if (voice.level() == 0.0f && !voice.exciter.active()) {
        stop(voice);
      }
    }
  }

  void stop(Voice& voice) {
    for (int k = 0; k < kStrings; ++k) voice.strings[k].sleep();
    voice.exciter.stop();
    voice.sounding = voice.held = voice.pending = voice.fading = false;
    voice.steal = 1.0f;
  }

  // `n` host samples of one tanpura, added to the two buses at 2x.
  void render_voice(Voice& voice, int n, const float* contact, float* left, float* right) {
    const int n2 = 2 * n;
    float excite[2 * kChunk], fade[2 * kChunk], mono[2 * kChunk];
    const bool plucking = voice.exciter.active();
    if (plucking) {
      for (int i = 0; i < n2; ++i) excite[i] = voice.exciter.next(voice.rng);
    }
    if (voice.fading) {
      for (int i = 0; i < n2; ++i) {
        voice.steal = kit::max(0.0f, voice.steal - steal_step_);
        fade[i] = voice.steal;
      }
    }
    for (int k = 0; k < kStrings; ++k) {
      JawariString& string = voice.strings[k];
      if (!string.awake()) continue;
      string.render(plucking && k == voice.excited ? excite : nullptr, contact, mono, n2);
      const float to_left = pan_[k][0], to_right = pan_[k][1];
      if (voice.fading) {
        for (int i = 0; i < n2; ++i) mono[i] *= fade[i];
      }
      for (int i = 0; i < n2; ++i) {
        left[i] += to_left * mono[i];
        right[i] += to_right * mono[i];
      }
    }
  }

  void finish_chunk(const float* left, const float* right, int n, int offset) {
    for (int i = 0; i < n; ++i) {
      const float l = dc_[0].process(half_[0].down(left[2 * i], left[2 * i + 1]));
      const float r = dc_[1].process(half_[1].down(right[2 * i], right[2 * i + 1]));
      // Spread narrows the side signal, so the sum of the two channels is
      // the same at any setting.
      const float mid = 0.5f * (l + r);
      const float side = 0.5f * (l - r) * width_.next();
      const float body = body_amount_.next();
      const float volume = volume_.next() * kOutGain;
      const float in[2] = {mid + side, mid - side};
      float out[2];
      for (int c = 0; c < 2; ++c) {
        float modes = 0.0f;
        for (int m = 0; m < kBodyModes; ++m) modes += kBodyGain[m] * body_[c][m].bandpass(in[c]);
        out[c] = in[c] * (1.0f - 0.5f * body) + modes * body;
      }
      out_left_[offset + i] = kit::soft_clip(out[0] * volume);
      out_right_[offset + i] = kit::soft_clip(out[1] * volume);
    }
  }

  void apply(int id) {
    using namespace tanpura;
    const float value = param(id);
    switch (id) {
      case kJawari:
        jawari_.set(value, primed());
        break;
      case kSpread:
        width_.set(value, primed());
        break;
      case kBody:
        body_amount_.set(value, primed());
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      default:
        break;  // read at the next pluck (Speed: on the control clock)
    }
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::Halfband2x half_[2];
  kit::DcBlocker dc_[2];
  kit::Svf body_[2][kBodyModes];
  kit::Smoother jawari_, width_, body_amount_, volume_;
  kit::IdleGate idle_;
  float pan_[kStrings][2] = {};
  float loop_rate_ = 96000.0f;
  float steal_step_ = 0.01f;
  int chunk_left_ = 0;
};

}  // namespace livemix
