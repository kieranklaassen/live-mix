#pragma once

// Shortwave: a night on the short waves as an instrument. Every key is a far
// station.
//
//   per key (up to ten):
//
//     tune in + drift ─► pitch ─► sine at the note ───────┐
//                              ├► sine at the Shift ──────┼─► keying ─┐
//                              └► the same pair, a few    │  (Warble, │
//                                 hertz up (Beat) ────────┘   Pips)   ├─► envelope ─► fading L / R ─┐
//                                                                     │                             │
//     five pairs of slow noises ─► on five harmonics, weighed by a mouth ──────┘ (Voices)           │
//                                                                                                   │
//   static (hiss + crackle, as loud as the loudest key) ─► sweeping notch L / R ────────────────────┤
//                                                                                                   │
//   out ◄─ soft clip ◄─ volume ◄─ band (low cut, high cut) ◄────────────────────────────────────────┘
//
// - Whistle is one sine. Warble crossfades it with a second sine an octave
//   below, an octave above or two octaves above (Shift), changing tone Rate
//   times a second. Pips are pulses of the sine, Rate a second, with silence
//   between. Every edge is a gate walked in a straight line over a few
//   milliseconds and then eased, so no Rate, however it is thrown about,
//   makes an edge a jump.
// - Voices is breath on the note: each of the note's first five harmonics is
//   a sine and a cosine carried by two slow noises of its own, which makes a
//   narrow band of noise around it. A mouth sets how loud each one is, a
//   syllable at a time: it opens and shuts (the level falls 12 dB between
//   syllables) and its two formants take a new place over the harmonics
//   while it opens. Rate is syllables a second; they are of uneven length
//   and loudness, and now and then one is left out. Never words.
// - Tune in starts a note up to a fourth off, in a direction drawn from a
//   seeded generator, and eases it on to the note; it then is exactly there.
//   The time grows faster than the distance (the 1.5th power of the knob):
//   a little is a quick chirp, a lot a slow turn of the dial. Drift is a
//   slow wander of up to a quarter tone on top.
// - Fading is per station: a slow gain that sinks and swells (both sides
//   together) and a notch that wanders across the note, one for the left and
//   one for the right, worked out as the gain a notch filter would give that
//   tone. The gain goes from kFadeLift over the level without Fading to
//   kFadeDb under that, so the loudest moments of a faded station are about
//   where they are without it, and every note starts at the level it has
//   without Fading, with its notches far away. A second, real notch per side
//   sweeps the static, which is what hollows it.
// - Beat adds the same signal a few hertz higher and quieter. On Voices it
//   is a plain sine under the breath.
// - Static is noise and single-sample crackles scaled by the loudest key's
//   envelope, so it comes and goes with the keys and the instrument reaches
//   exact silence. Band is a first-order low cut and a second-order high cut
//   over everything.
// - Above four keys the stations share the air: each is turned down as more
//   sound (by the 0.6th power of four over their number), so ten held keys
//   stay under the clip knee.
//
// Every random source is seeded in init(). The first key after every voice
// has ended restarts whatever runs on through a silence (the sweeps, the
// static, the control clock, the smoothing), so what it plays does not depend
// on when, or whether, the device fell asleep; and what is left in the band's
// filters after the last voice is faded to exact zero in a fixed time, so
// the output is the same, sample for sample, whatever the block size.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {
namespace shortwave_parts {

// A value set on the control clock and walked there in a straight line, so
// nothing worked out at control rate steps in the audio.
struct Ramp {
  float value = 0.0f;
  float target = 0.0f;
  float step = 0.0f;

  void snap(float v) {
    value = v;
    target = v;
    step = 0.0f;
  }
  // Land on the last target, then leave for `next` over 1 / inverse_period samples.
  void aim(float next, float inverse_period, bool snap_now) {
    if (snap_now) {
      snap(next);
      return;
    }
    value = target;
    target = next;
    step = (next - value) * inverse_period;
  }
  float next() {
    value += step;
    return value;
  }
};

// A smooth random walk in [-1, 1]: a new seeded target every cycle, joined by
// eased segments. `begin` starts a segment from a chosen value.
struct Wander {
  kit::Rng rng;
  float from = 0.0f;
  float to = 0.0f;
  float phase = 0.0f;

  void seed(uint32_t value) {
    rng.seed(value);
    from = rng.bipolar();
    to = rng.bipolar();
    phase = 0.0f;
  }
  void begin(float value) {
    from = value;
    to = rng.bipolar();
    phase = 0.0f;
  }
  // The value now; then move on by `cycles`.
  float next(float cycles) {
    const float eased = phase * phase * (3.0f - 2.0f * phase);
    const float value = from + (to - from) * eased;
    phase += cycles;
    while (phase >= 1.0f) {
      phase -= 1.0f;
      from = to;
      to = rng.bipolar();
    }
    return value;
  }
};

inline float ease(float x) {
  x = kit::clamp(x, 0.0f, 1.0f);
  return x * x * (3.0f - 2.0f * x);
}

// The mouth of one voice of Voices, a syllable at a time: it opens and shuts
// once (the level), and its two formants go to a new place while it opens
// and stay there while it is open. Syllables are of uneven length and
// loudness, and now and then one is left out, like a gap between words.
struct Mouth {
  static constexpr float kShut = 0.25f;  // the level between syllables
  kit::Rng rng;
  float phase = 0.5f;   // through the syllable
  float pace = 1.0f;    // how fast this syllable passes, against the Rate
  float stress = 1.0f;  // how loud it gets
  float from[2] = {0.5f, 0.5f};  // each formant's place, 0..1
  float to[2] = {0.5f, 0.5f};

  void seed(uint32_t value) { rng.seed(value); }
  // A note begins in the middle of a syllable, mouth open.
  void begin() {
    phase = 0.5f;
    pace = 1.0f;
    stress = 1.0f;
    for (int f = 0; f < 2; ++f) {
      from[f] = rng.uniform();
      to[f] = rng.uniform();
    }
  }
  // The level now and the formants' places; then move on by `cycles` of a
  // syllable at the Rate.
  float next(float cycles, float* place) {
    const float glide = ease(2.0f * phase);
    for (int f = 0; f < 2; ++f) place[f] = from[f] + (to[f] - from[f]) * glide;
    // Open for most of the syllable, shut smoothly at both ends of it.
    const float sine = kit::SineTable::lookup(0.5f * phase);
    const float shut = 1.0f - sine * sine;
    const float level = kShut + (stress - kShut) * (1.0f - shut * shut);
    phase += cycles * pace;
    while (phase >= 1.0f) {
      phase -= 1.0f;
      for (int f = 0; f < 2; ++f) {
        from[f] = to[f];
        to[f] = rng.uniform();
      }
      const float length = rng.uniform();
      const float loud = rng.uniform();
      pace = 1.0f / (0.6f + 1.0f * length * length);  // mostly short, a few long
      stress = rng.uniform() < 0.14f ? kShut : 0.6f + 0.4f * loud;
    }
    return level;
  }
};

}  // namespace shortwave_parts

class Shortwave : public kit::DeviceBase<shortwave::kNumParams> {
 public:
  static constexpr int kMaxVoices = 10;
  static constexpr int kHarmonics = 5;
  enum Signal : int { kWhistle = 0, kWarble, kPips, kVoices, kSignals };

  // What the knobs mean, for the harness.
  static constexpr float kTuneCents = 500.0f;    // how far off a note starts at Tune in 1
  static constexpr float kTuneSeconds = 3.0f;    // and how long it takes to arrive
  static constexpr float kDriftCents = 50.0f;    // the widest wander at Drift 1
  static constexpr float kBeatLowHz = 0.5f;      // Beat just above 0
  static constexpr float kBeatSpan = 16.0f;      // times that at Beat 1
  static constexpr float kBeatLevel = 0.45f;     // the second station against the first
  static constexpr float kFadeDb = 18.0f;        // from a station's best to its worst at Fading 1
  static constexpr float kFadeLift = 4.0f;       // of which this much is above its level without Fading
  static constexpr float kPipSeconds = 0.3f;     // the longest pip
  static constexpr float kPipDuty = 0.45f;       // and the most of its cycle a pip fills

  // How long a note takes to arrive: a little Tune in is a quick chirp on to
  // the note, a lot of it a slow turn of the dial.
  static float slide_seconds(float tune_in) { return kTuneSeconds * tune_in * std::sqrt(tune_in); }
  // The second station's distance in hertz.
  static float beat_hz(float beat) { return kBeatLowHz * std::pow(kBeatSpan, beat); }

  void init(float sample_rate) {
    using namespace shortwave;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    period_ = sr > 60000.0f ? 128 : 64;
    inverse_period_ = 1.0f / static_cast<float>(period_);
    tick_seconds_ = static_cast<float>(period_) / sr;
    const float control_rate = sr / static_cast<float>(period_);
    noise_scale_ = std::sqrt(sr / 48000.0f);
    edge_step_ = 1.0f / (kEdgeSeconds * sr);
    tail_step_ = 1.0f / (kTailSeconds * sr);
    pip_step_ = 1.0f / (kPipEdgeSeconds * sr);

    pool_.reset();
    uint32_t stream = 0;
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      voice = Voice();
      voice.env.set_sample_rate(sr);
      voice.drift.seed(seed_for(stream++));
      voice.drift.set_rate(0.17f, sr);
      voice.fade_a.seed(seed_for(stream++));
      voice.fade_b.seed(seed_for(stream++));
      voice.notch[0].seed(seed_for(stream++));
      voice.notch[1].seed(seed_for(stream++));
      voice.mouth.seed(seed_for(stream++));
      voice.breath.seed(seed_for(stream++));
      // No two stations fade at quite the same pace.
      kit::Rng pace;
      pace.seed(seed_for(stream++));
      for (float& rate : voice.pace) rate = 0.8f + 0.4f * pace.uniform();
    }
    start_.seed(kStartSeed);

    tone_mix_.set_time(kSwitchSeconds, sr);
    warble_mix_.set_time(kSwitchSeconds, sr);
    pips_mix_.set_time(kSwitchSeconds, sr);
    voices_mix_.set_time(kSwitchSeconds, sr);
    beat_level_.set_time(kSwitchSeconds, sr);
    sweep_depth_.set_time(kSwitchSeconds, sr);
    volume_.set_time(kSmoothingSeconds, sr);
    rate_.set_time(kKnobSeconds, control_rate);
    band_.set_time(kKnobSeconds, control_rate);
    fading_.set_time(kKnobSeconds, control_rate);
    static_.set_time(kKnobSeconds, control_rate);
    // The band filters ring for a few milliseconds; nothing else outlives the envelopes.
    idle_.reset(sr, 0.1f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    restart();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    // Room above the note for the slide in and for an octave of Shift.
    frequency = kit::clamp(frequency, 16.0f, kit::min(12000.0f, 0.3f * sample_rate()));
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    if (pool_.count_active() == 0) restart();

    const int held = pool_.find_held(note_id);
    if (held >= 0) {
      Voice& again = pool_.voices[held];
      if (again.waiting) {
        // Struck again before it could start: the waiting note is this one.
        again.next_hz = frequency;
        again.next_gain = gain;
        return;
      }
      again.env.fast_release(kRestrikeSeconds);  // a key struck again while held
    }

    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    voice.next_hz = frequency;
    voice.next_gain = gain;
    if (stolen) {
      // The voice fades out first and starts the new note from silence.
      voice.waiting = true;
      voice.env.fast_release(kStealSeconds);
    } else {
      start(voice);
    }
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held < 0) return;
    Voice& voice = pool_.voices[held];
    if (voice.waiting) {
      voice.waiting = false;  // released before it began: the fade just finishes
    } else {
      voice.env.gate_off();
    }
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(pool_.count_active() > 0)) {
      silence_output(frames);
      return;
    }
    clear_input(frames);  // an instrument ignores its input
    for (int i = 0; i < frames; ++i) {
      if (clock_.tick()) control();
      const bool air_tick = air_clock_.tick();

      const float tone_mix = tone_mix_.next();
      const float warble_mix = warble_mix_.next();
      const float pips_mix = pips_mix_.next();
      const float voices_mix = voices_mix_.next();
      const float beat = beat_level_.next();
      const double beat_increment = static_cast<double>(beat_increment_.next());

      float left = 0.0f, right = 0.0f;
      bool sounding = false;
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        if (!voice.env.active()) {
          if (!voice.waiting) continue;
          start(voice);
        }
        sounding = true;
        const double increment = static_cast<double>(voice.increment.next());
        voice.phase += increment;
        if (voice.phase >= 2.0) voice.phase -= 2.0;
        const float phase = static_cast<float>(voice.phase);
        float second = 0.0f;  // the phase of the station a few hertz up
        if (beat > 0.0f) {
          voice.beat_phase += increment + beat_increment;
          if (voice.beat_phase >= 2.0) voice.beat_phase -= 2.0;
          second = static_cast<float>(voice.beat_phase);
        }
        voice.key += key_increment_;
        if (voice.key >= 2.0) voice.key -= 2.0;
        const float key = static_cast<float>(voice.key);

        float signal = 0.0f;
        if (tone_mix > 0.0f) {
          // How much of the note and of the Shift tone is sounding now.
          float on_note = 1.0f, on_shift = 0.0f;
          if (warble_mix > 0.0f) {
            voice.warble_gate = walk(voice.warble_gate, warble_wanted(key), edge_step_);
            on_shift = warble_mix * shortwave_parts::ease(voice.warble_gate);
            on_note = 1.0f - on_shift;
          }
          if (pips_mix > 0.0f) {
            voice.pip_gate = walk(voice.pip_gate, pip_wanted(key), pip_step_);
            const float open = 1.0f - pips_mix * (1.0f - shortwave_parts::ease(voice.pip_gate));
            on_note *= open;
            on_shift *= open;
          }
          // A new Shift waits until the second tone is silent.
          if (on_shift == 0.0f) voice.ratio = kit::min(shift_ratio_, voice.highest_ratio);
          float tone = on_note * kit::SineTable::lookup(phase);
          if (on_shift > 0.0f) tone += on_shift * kit::SineTable::lookup(phase * voice.ratio);
          if (beat > 0.0f) {
            float other = on_note * kit::SineTable::lookup(second);
            if (on_shift > 0.0f) other += on_shift * kit::SineTable::lookup(second * voice.ratio);
            tone += beat * other;
          }
          signal = tone_mix * tone;
        }
        if (voices_mix > 0.0f) {
          if (air_tick) breathe(voice, false);
          float breath = murmur(voice, phase);
          if (beat > 0.0f) breath += beat * kit::SineTable::lookup(second);
          signal += voices_mix * breath;
        }

        signal *= voice.env.next();
        left += signal * voice.gain[0].next();
        right += signal * voice.gain[1].next();
      }

      // Static: the two sides share most of their hiss.
      float air_left = crackle_[0], air_right = crackle_[1];
      crackle_[0] = 0.0f;
      crackle_[1] = 0.0f;
      const float hiss = static_gain_.next();
      if (hiss != 0.0f) {
        const float mid = noise_.bipolar();
        const float side = kStaticSide * noise_.bipolar();
        air_left += hiss * (mid + side);
        air_right += hiss * (mid - side);
      }
      // The notch that sweeps through the static, one for each side. The
      // stations have notches of their own (in their gains), which start
      // far from the note; this one stands where it stands, and over the
      // stations it would hollow the same notes on the same side every time.
      const float depth = sweep_depth_.next();
      sweep_[0].process(air_left);
      sweep_[1].process(air_right);
      left += air_left - depth * sweep_[0].k * sweep_[0].band;
      right += air_right - depth * sweep_[1].k * sweep_[1].band;

      // The receiver's band.
      left = high_cut_[0].lowpass(low_cut_[0].highpass(left));
      right = high_cut_[1].lowpass(low_cut_[1].highpass(right));

      // Once the last station has gone, what is left of it in the band's
      // filters (far under hearing) is faded to exact silence in a fixed
      // time. The block the device falls asleep in depends on the host's
      // block size; this way nothing of that moment is in the output.
      tail_ = sounding ? 1.0f : kit::max(0.0f, tail_ - tail_step_);
      const float volume = volume_.next();
      if (tail_ > 0.0f) {
        out_left_[i] = kit::soft_clip(left * volume) * tail_;
        out_right_[i] = kit::soft_clip(right * volume) * tail_;
      } else {
        out_left_[i] = 0.0f;
        out_right_[i] = 0.0f;
      }
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  using Ramp = shortwave_parts::Ramp;
  using Wander = shortwave_parts::Wander;
  using Mouth = shortwave_parts::Mouth;

  struct Voice {
    kit::Adsr env;
    double phase = 0.0;       // of the note, in cycles; wraps at 2 so half of it is continuous
    double beat_phase = 0.0;  // of the station a few hertz up
    double key = 0.0;         // keying clock: tone changes or pips since the note began, wraps at 2
    Ramp increment;           // cycles per sample, with the slide in and the drift
    Ramp gain[2];             // velocity and fading, left and right
    float hz = 220.0f;
    float velocity = 0.0f;
    float ratio = 2.0f;          // the Shift in use
    float highest_ratio = 4.0f;  // the widest Shift that stays under Nyquist for this note
    // Tune in.
    float slide_cents = 0.0f;
    float slide_seconds = 0.0f;
    float age = 0.0f;
    // Slow movement, seeded per voice.
    kit::Drift drift;
    Wander fade_a, fade_b, notch[2];
    float pace[4] = {1.0f, 1.0f, 1.0f, 1.0f};
    // Warble and Pips: how far the second tone, and the pip, have come in
    // (0..1), walked in a straight line so no Rate can make an edge a jump.
    float warble_gate = 0.0f;
    float pip_gate = 0.0f;
    // Voices.
    Mouth mouth;
    kit::Rng breath;
    kit::OnePole narrow[kHarmonics][4];
    Ramp air[kHarmonics][2];         // each harmonic's two narrow noises, at its level
    float partial[kHarmonics] = {};  // the level of each harmonic under the formants
    float narrow_gain = 0.0f;
    int harmonics = 0;  // how many fit under Nyquist
    // A stolen voice waits for its fade before it plays the next note.
    bool waiting = false;
    float next_hz = 0.0f;
    float next_gain = 0.0f;

    bool active() const { return env.active() || waiting; }
    // A waiting voice is as good as held: it must not be stolen twice.
    bool releasing() const { return env.releasing() && !waiting; }
    // A voice that has just been taken counts as loud before it has sounded,
    // or the next note of the same chord would take it again.
    float level() const {
      return (waiting || env.stage() == kit::Adsr::kAttack) ? 2.0f : env.level();
    }
  };

  static constexpr uint32_t kStartSeed = 0x5A0F7E31u;
  static constexpr uint32_t kNoiseSeed = 0x0BADA1F5u;
  static constexpr uint32_t kDiceSeed = 0x7C0FFEE1u;
  static constexpr uint32_t kSweepSeed[2] = {0x243F6A88u, 0x85A308D3u};

  // One key at gain 0.7 peaks near -21.5 dBFS at the default volume, which
  // (with the gain control below) leaves ten held keys under the clip's knee.
  static constexpr float kVoiceGain = 0.33f;
  static constexpr float kVelocityFloor = 0.25f;
  static constexpr float kCrowd = 4.0f;
  static constexpr float kCrowdSlope = 0.6f;  // 0.5 would hold the power of the sum
  // Voices against a whistle: about the same loudness, with taller peaks.
  static constexpr float kMurmurGain = 1.05f;
  static constexpr float kMurmurDirect = 0.35f;  // the bare source under the formants
  static constexpr float kMurmurSecond = 0.7f;   // the upper formant against the lower
  static constexpr float kFormantQ = 4.0f;
  static constexpr int kAirPeriod = 16;  // samples between points of the narrow noises
  static constexpr int kAirWarmUp = 24;
  static constexpr float kStealSeconds = 0.004f;
  static constexpr float kRestrikeSeconds = 0.02f;
  static constexpr float kSwitchSeconds = 0.012f;
  static constexpr float kTailSeconds = 0.03f;
  static constexpr float kKnobSeconds = 0.03f;
  static constexpr float kEdgeSeconds = 0.008f;     // of a Warble change
  static constexpr float kPipEdgeSeconds = 0.012f;  // of a pip
  // The slide in can sit a fourth above the note, the drift a quarter tone more.
  static constexpr float kSlideHeadroom = 1.38f;
  // Fading: the two flat fades, and each side's notch, in cycles per second.
  static constexpr float kFadeHz[2] = {0.19f, 0.43f};
  // Where the two walks start, so that a note begins at the level it has
  // without Fading: sunk^1.5 = kFadeLift / kFadeDb at sunk = 0.5 + 0.5 * start.
  static constexpr float kFadeStart = -0.2663f;
  static constexpr float kNotchHz[2] = {0.22f, 0.34f};
  static constexpr float kNotchStart = 0.7f;  // of its reach: far enough to leave the note whole
  static constexpr float kNotchOctaves = 2.0f;  // how far from the note a notch wanders
  static constexpr float kNotchQ = 1.2f;
  static constexpr float kNotchDepth = 0.85f;
  // The notch over the static.
  static constexpr float kSweepHz[2] = {0.09f, 0.14f};
  static constexpr float kSweepCentre = 900.0f;
  static constexpr float kSweepOctaves = 1.6f;
  static constexpr float kSweepQ = 1.5f;
  static constexpr float kSweepDepth = 0.85f;
  // Static: the hiss against one key at full level, at Static 1 and 48 kHz.
  static constexpr float kHiss = 0.6f;
  static constexpr float kStaticSide = 0.6f;
  static constexpr float kCracklesLow = 0.5f;    // a second, just above Static 0
  static constexpr float kCracklesHigh = 11.0f;  // more at Static 1
  static constexpr float kCrackleSmall = 0.3f;   // a crackle against the key, at Static 1
  static constexpr float kCrackleLarge = 1.0f;
  // Band: the corners at 0 and how far they close by 1.
  static constexpr float kLowCutHz = 20.0f;
  static constexpr float kLowCutSpan = 25.0f;    // to 500 Hz
  static constexpr float kHighCutHz = 18000.0f;
  static constexpr float kHighCutSpan = 0.14f;   // to 2.5 kHz

  // An unrelated seed per stream.
  static uint32_t seed_for(uint32_t stream) {
    uint32_t x = (stream + 1u) * 0x9E3779B9u;
    x ^= x >> 16;
    x *= 0x85EBCA6Bu;
    x ^= x >> 13;
    x *= 0xC2B2AE35u;
    x ^= x >> 16;
    return x;
  }

  static int choice(float value) { return static_cast<int>(value + 0.5f); }

  // Warble: the note for one count of the keying clock, the Shift tone for
  // the next. The change is begun an edge before the count ends, so it is
  // made by the time the count is.
  float warble_wanted(float key) const {
    return (key >= 1.0f - warble_lead_ && key < 2.0f - warble_lead_) ? 1.0f : 0.0f;
  }

  // Pips: open for the first part of every count, shut for the rest.
  float pip_wanted(float key) const {
    const float within = key >= 1.0f ? key - 1.0f : key;
    return within < pip_shut_ ? 1.0f : 0.0f;
  }

  // One sample of a gate on its way to what is wanted of it.
  static float walk(float value, float wanted, float step) {
    return wanted > value ? kit::min(value + step, wanted) : kit::max(value - step, wanted);
  }

  // Voices: breath on the note and its harmonics. Each harmonic carries a
  // narrow band of noise of its own, as the sine and cosine parts of it; the
  // formants are in the harmonics' levels.
  float murmur(Voice& voice, float phase) {
    // sin and cos of the harmonics from one pair of table reads:
    // f((n + 1)x) = 2 cos(x) f(nx) - f((n - 1)x).
    const float sine = kit::SineTable::lookup(phase);
    const float cosine = kit::SineTable::cos_lookup(phase);
    const float twice = 2.0f * cosine;
    float sin_n = sine, sin_before = 0.0f, cos_n = cosine, cos_before = 1.0f;
    float sum = 0.0f;
    for (int h = 0; h < voice.harmonics; ++h) {
      sum += voice.air[h][0].next() * sin_n + voice.air[h][1].next() * cos_n;
      const float sin_next = twice * sin_n - sin_before;
      const float cos_next = twice * cos_n - cos_before;
      sin_before = sin_n;
      sin_n = sin_next;
      cos_before = cos_n;
      cos_n = cos_next;
    }
    return sum;
  }

  // The next point of a voice's narrow noises, every kAirPeriod samples:
  // white noise through two one-poles, twice for each harmonic. A pair's
  // size is pulled half way (in decibels) towards its average, which keeps
  // the breath from vanishing and from towering over a whistle.
  void breathe(Voice& voice, bool snap) {
    for (int h = 0; h < voice.harmonics; ++h) {
      kit::OnePole* const pole = voice.narrow[h];
      const float a = pole[1].lowpass(pole[0].lowpass(voice.breath.bipolar())) * voice.narrow_gain;
      const float b = pole[3].lowpass(pole[2].lowpass(voice.breath.bipolar())) * voice.narrow_gain;
      const float level = voice.partial[h] / std::sqrt(std::sqrt(a * a + b * b) + 0.05f);
      voice.air[h][0].aim(a * level, 1.0f / static_cast<float>(kAirPeriod), snap);
      voice.air[h][1].aim(b * level, 1.0f / static_cast<float>(kAirPeriod), snap);
    }
  }

  // The level of harmonic `n` of a voice under the mouth's two formants: a
  // band-pass each (unity at its centre), over a little of the bare source.
  static float formant_level(float harmonic_hz, const float* centre) {
    float level = kMurmurDirect;
    static constexpr float kWeight[2] = {1.0f, kMurmurSecond};
    for (int f = 0; f < 2; ++f) {
      const float x = harmonic_hz / centre[f];
      const float skirt = x * (1.0f / kFormantQ);
      const float off = 1.0f - x * x;
      level += kWeight[f] * skirt / std::sqrt(off * off + skirt * skirt);
    }
    return level;
  }

  // Begin the note a voice has been given.
  void start(Voice& voice) {
    using namespace shortwave;
    const float sr = sample_rate();
    voice.waiting = false;
    voice.hz = voice.next_hz;
    voice.velocity = kVelocityFloor + (1.0f - kVelocityFloor) * voice.next_gain;
    // Stacked keys do not add up in phase.
    voice.phase = static_cast<double>(start_.uniform());
    voice.beat_phase = static_cast<double>(start_.uniform());
    voice.key = 0.0;
    voice.warble_gate = 0.0f;
    voice.pip_gate = 0.0f;
    // Tune in: which way off is drawn, how far and how long is the knob.
    const float amount = param(kTuneIn);
    const float direction = (start_.next_u32() >> 31) != 0u ? 1.0f : -1.0f;
    const float reach = 0.8f + 0.2f * start_.uniform();
    voice.slide_cents = direction * reach * kTuneCents * amount;
    voice.slide_seconds = slide_seconds(amount);
    voice.age = 0.0f;
    voice.highest_ratio = 4.0f;
    while (voice.highest_ratio > 1.0f && voice.hz * voice.highest_ratio * kSlideHeadroom > 0.49f * sr) {
      voice.highest_ratio *= 0.5f;
    }
    voice.ratio = kit::min(shift_ratio_, voice.highest_ratio);
    // The station comes in at the level it has without Fading, with its
    // notches far off, and rises or sinks from there.
    voice.fade_a.begin(kFadeStart);
    voice.fade_b.begin(kFadeStart);
    voice.mouth.begin();
    for (Wander& notch : voice.notch) notch.begin(notch.rng.uniform() < 0.5f ? -kNotchStart : kNotchStart);
    // Voices: a band of noise 4 % of the note wide, and the harmonics that fit.
    const float narrow_hz = kit::clamp(0.04f * voice.hz, 8.0f, 90.0f);
    for (auto& pair : voice.narrow) {
      for (kit::OnePole& pole : pair) {
        pole.reset();
        pole.set_cutoff(narrow_hz, sr / static_cast<float>(kAirPeriod));
      }
    }
    // Two one-poles in series leave this share of a white noise's power (a
    // third for values spread evenly over -1..1); the gain brings each
    // noise to a power of one.
    const float pole = voice.narrow[0][0].a;
    const float kept = (1.0f - pole) * (1.0f + pole * pole) / ((1.0f + pole) * (1.0f + pole) * (1.0f + pole));
    voice.narrow_gain = std::sqrt(3.0f / kit::max(kept, 1.0e-12f));
    voice.harmonics = 0;
    while (voice.harmonics < kHarmonics &&
           static_cast<float>(voice.harmonics + 1) * voice.hz * kSlideHeadroom < 0.45f * sr) {
      ++voice.harmonics;
    }
    voice.env = kit::Adsr();
    voice.env.set_sample_rate(sr);
    voice.env.set(param(kAttack), 0.01f, 1.0f, param(kRelease));
    voice.env.gate_on();
    steer(voice, true);
    // Let the noise filters fill before the first point is taken.
    for (int n = 0; n < kAirWarmUp; ++n) breathe(voice, true);
  }

  // The gain a notch `position` (in -1..1 of its reach) away from a tone
  // leaves of it.
  float notch_gain(float position) const {
    const float ratio_squared = std::exp2(2.0f * kNotchOctaves * position);
    const float off = (ratio_squared - 1.0f) * (ratio_squared - 1.0f);
    const float through = std::sqrt(off / (off + ratio_squared * (1.0f / (kNotchQ * kNotchQ))));
    return 1.0f - notch_depth_ * (1.0f - through);
  }

  // One control step of a voice: its pitch, its fading and its formants.
  // `snap` lands on them at once (a note starting).
  void steer(Voice& voice, bool snap) {
    const float sr = sample_rate();
    float cents = 0.0f;
    if (voice.age < voice.slide_seconds) {
      const float left = 1.0f - voice.age / voice.slide_seconds;
      cents = voice.slide_cents * left * left * left;
    }
    voice.age += tick_seconds_;
    if (drift_cents_ > 0.0f) cents += drift_cents_ * voice.drift.next(period_);
    const float bend = cents != 0.0f ? std::exp2(cents * (1.0f / 1200.0f)) : 1.0f;
    voice.increment.aim(voice.hz * bend / sr, inverse_period_, snap);

    // The walks move whatever Fading is, so turning it up finds them under way.
    const float a = voice.fade_a.next(kFadeHz[0] * voice.pace[0] * tick_seconds_);
    const float b = voice.fade_b.next(kFadeHz[1] * voice.pace[1] * tick_seconds_);
    const float near_left = voice.notch[0].next(kNotchHz[0] * voice.pace[2] * tick_seconds_);
    const float near_right = voice.notch[1].next(kNotchHz[1] * voice.pace[3] * tick_seconds_);
    float left = voice.velocity * kVoiceGain * crowd_;
    float right = left;
    if (fade_db_ > 0.0f) {
      const float sunk = kit::clamp(0.5f + 0.5f * (0.6f * a + 0.4f * b), 0.0f, 1.0f);
      const float flat = std::exp2((fade_lift_db_ - fade_db_ * sunk * std::sqrt(sunk)) * (1.0f / 6.0206f));
      left *= flat * notch_gain(near_left);
      right *= flat * notch_gain(near_right);
    }
    voice.gain[0].aim(left, inverse_period_, snap);
    voice.gain[1].aim(right, inverse_period_, snap);

    if (murmuring_) {
      // The mouth: a syllable's level, and two formants, one placed over
      // the first three harmonics and one over the third to the sixth.
      float place[2];
      const float level = kMurmurGain * voice.mouth.next(syllable_cycles_, place);
      const float centre[2] = {std::exp2(0.2f + 1.4f * place[0]), std::exp2(1.6f + 1.0f * place[1])};
      for (int h = 0; h < voice.harmonics; ++h) {
        const float n = static_cast<float>(h + 1);
        voice.partial[h] = level * formant_level(n, centre) / n;
      }
    }
  }

  // Before the first key after every voice has ended (and at init). A
  // sleeping device stands still and the block it falls asleep in depends on
  // the host's block size, so nothing that runs on through a silence is
  // carried into the next note, and a knob moved in the silence is simply
  // there. Nothing audible is sounding at this point.
  void restart() {
    clock_.reset(period_);
    air_clock_.reset(kAirPeriod);
    kit::Smoother* const smoothers[] = {&tone_mix_, &warble_mix_, &pips_mix_, &voices_mix_, &beat_level_, &sweep_depth_,
                                        &volume_,   &rate_,       &band_,     &fading_,     &static_};
    for (kit::Smoother* smoother : smoothers) smoother->snap(smoother->target);
    noise_.seed(kNoiseSeed);
    dice_.seed(kDiceSeed);
    for (int c = 0; c < 2; ++c) {
      sweep_walk_[c].seed(kSweepSeed[c]);
      sweep_[c].reset();
      low_cut_[c].reset();
      high_cut_[c].reset();
      crackle_[c] = 0.0f;
    }
    static_gain_.snap(0.0f);
    tail_ = 1.0f;
    crowd_ = 1.0f;
    band_set_ = -1.0f;
    fresh_ = true;  // the next control step lands on its targets
    knobs();
  }

  // What the control-rate knobs come to, from where their smoothers stand.
  void knobs() {
    using namespace shortwave;
    const float rate = rate_.value;
    key_increment_ = static_cast<double>(rate) / static_cast<double>(sample_rate());
    warble_lead_ = kit::min(kEdgeSeconds * rate, 0.25f);
    // A pip is shut an edge before its time is up, so it ends on time.
    const float pip_counts = kit::min(kPipDuty, kPipSeconds * rate);
    pip_shut_ = pip_counts - kit::min(kPipEdgeSeconds * rate, 0.5f * pip_counts);
    syllable_cycles_ = rate * tick_seconds_;
    const float drift = param(kDrift);
    drift_cents_ = kDriftCents * drift * std::sqrt(drift);
    fade_db_ = kFadeDb * fading_.value;
    fade_lift_db_ = kFadeLift * fading_.value;
    // The notches deepen sooner than the gain sinks, so a little Fading already parts the sides.
    notch_depth_ = kNotchDepth * fading_.value * (2.0f - fading_.value);
    murmuring_ = voices_mix_.target > 0.0f || voices_mix_.value > 0.0f;
  }

  // Every control period: the knobs read here, every sounding voice, the
  // static and the two filters over the output.
  void control() {
    using namespace shortwave;
    const float sr = sample_rate();
    const bool snap = fresh_;
    fresh_ = false;

    rate_.next();
    fading_.next();
    knobs();
    beat_increment_.aim(beat_hz(param(kBeat)) / sr, inverse_period_, snap);

    // The receiver's gain control: past four stations at full level, each
    // more turns all of them down, a little more than would keep their sum's
    // power where it is.
    float held = 0.0f;
    for (int v = 0; v < kMaxVoices; ++v) held += pool_.voices[v].env.level();
    crowd_ = held > kCrowd ? std::pow(kCrowd / held, kCrowdSlope) : 1.0f;

    float loudest = 0.0f;
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.env.active()) continue;
      voice.env.set(param(kAttack), 0.01f, 1.0f, param(kRelease));
      steer(voice, false);
      loudest = kit::max(loudest, voice.env.level() * voice.velocity);
    }

    // Static is a balance against the loudest key, so it comes and goes with
    // the keys. The dice are thrown every step, whatever Static is.
    const float amount = static_.next();
    const float key = loudest * kVoiceGain;
    static_gain_.aim(key * kHiss * amount * std::sqrt(amount) * noise_scale_, inverse_period_, snap);
    const float chance = dice_.uniform();
    const float size = dice_.uniform();
    const float lean = dice_.bipolar();
    if (key > 0.0f && amount > 0.0f && chance < (kCracklesLow + kCracklesHigh * amount * amount) * tick_seconds_) {
      // Mostly small, a few large: 1 / (u + 0.08) rescaled to 0..1. A
      // crackle grows with the square root of Static where the hiss grows
      // faster, so it stands out of a light hiss and sinks into a heavy one.
      // It is one sample long, so it is scaled by the rate (the hiss by its
      // root) to ring the band as loudly at any sample rate.
      const float heavy = (1.0f / (size + 0.08f) - 0.9259f) * (1.0f / 11.574f);
      const float crack = key * std::sqrt(amount) * noise_scale_ * noise_scale_ *
                          (kCrackleSmall + (kCrackleLarge - kCrackleSmall) * heavy);
      crackle_[0] = crack * (1.0f + 0.5f * lean);
      crackle_[1] = crack * (1.0f - 0.5f * lean);
    }

    for (int c = 0; c < 2; ++c) {
      const float walk = sweep_walk_[c].next(kSweepHz[c] * tick_seconds_);
      sweep_[c].set(kSweepCentre * std::exp2(kSweepOctaves * walk), kSweepQ, sr);
    }
    const float band = band_.next();
    if (band != band_set_) {
      band_set_ = band;
      const float low_cut = kLowCutHz * std::pow(kLowCutSpan, band);
      const float high_cut = kit::min(kHighCutHz * std::pow(kHighCutSpan, band), 0.45f * sr);
      for (int c = 0; c < 2; ++c) {
        low_cut_[c].set_cutoff(low_cut, sr);
        high_cut_[c].set(high_cut, 0.6f + 0.5f * band, sr);
      }
    }
  }

  void apply(int id) {
    using namespace shortwave;
    const float value = param(id);
    switch (id) {
      case kSignal: {
        const int signal = kit::clamp_int(choice(value), 0, kSignals - 1);
        tone_mix_.set(signal == kVoices ? 0.0f : 1.0f, primed());
        warble_mix_.set(signal == kWarble ? 1.0f : 0.0f, primed());
        pips_mix_.set(signal == kPips ? 1.0f : 0.0f, primed());
        voices_mix_.set(signal == kVoices ? 1.0f : 0.0f, primed());
        break;
      }
      case kShift: {
        static constexpr float kRatios[3] = {0.5f, 2.0f, 4.0f};
        shift_ratio_ = kRatios[kit::clamp_int(choice(value), 0, 2)];
        break;
      }
      case kRate:
        rate_.set(value, primed());
        break;
      case kFading:
        fading_.set(value, primed());
        sweep_depth_.set(kSweepDepth * value, primed());
        break;
      case kBeat:
        // The second station is at its level by a fifth of the way up.
        beat_level_.set(kBeatLevel * shortwave_parts::ease(value * 5.0f), primed());
        break;
      case kStatic:
        static_.set(value, primed());
        break;
      case kBand:
        band_.set(value, primed());
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      default:
        break;  // read on the control clock or when a note starts
    }
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::Svf sweep_[2];
  Wander sweep_walk_[2];
  kit::OnePole low_cut_[2];
  kit::Svf high_cut_[2];
  kit::Rng start_, noise_, dice_;
  // Per sample.
  kit::Smoother tone_mix_, warble_mix_, pips_mix_, voices_mix_, beat_level_, sweep_depth_, volume_;
  Ramp static_gain_, beat_increment_;
  // Per control period.
  kit::Smoother rate_, band_, fading_, static_;
  kit::ControlClock clock_, air_clock_;
  kit::IdleGate idle_;
  float crackle_[2] = {0.0f, 0.0f};
  float shift_ratio_ = 2.0f;
  double key_increment_ = 0.0;
  float warble_lead_ = 0.1f, pip_shut_ = 0.3f;
  float edge_step_ = 0.01f, pip_step_ = 0.01f;  // a gate's way per sample
  float syllable_cycles_ = 0.001f;              // syllables per control period, at the Rate
  float drift_cents_ = 0.0f;
  float fade_db_ = 0.0f, fade_lift_db_ = 0.0f, notch_depth_ = 0.0f;
  float crowd_ = 1.0f;
  float tail_ = 1.0f, tail_step_ = 0.001f;  // the fade to silence after the last voice
  float band_set_ = -1.0f;
  float noise_scale_ = 1.0f;
  float tick_seconds_ = 0.001f, inverse_period_ = 1.0f / 64.0f;
  int period_ = 64;
  bool murmuring_ = false;
  bool fresh_ = true;
};

}  // namespace livemix
