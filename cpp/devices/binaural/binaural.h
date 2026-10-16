#pragma once

// Binaural: each key is a pair of warm tones a few hertz apart, one to an ear.
//
//   per key (up to 8): carrier phase ─► sine, 2nd and 3rd partial ─► × envelope × gain ─┐
//                                                                                      ▼
//   one half-beat clock for all keys ─► the pair: hi = sin(c + h), lo = sin(c - h) ─► Ears ─► left, right
//   (Beat on its way to Target)         Cross: two tones an ear, a quarter clock                  │
//                                                                                                 ▼
//   bed: two unlike noises ─► colour ─► × Bed × the loudest key ──────────────────────► + ─► volume ─► soft clip
//
// - A key is folded by octaves into 80 Hz to 1 kHz, where a beat between the
//   ears works. Its two tones stand half of Beat above and below it. Beat is
//   in hertz and the same on every key: every key's pair is made from its own
//   carrier phase and ONE half-beat phase the device owns (kit/beat.h), so all
//   the pairs turn together and the sum of any chord beats to nothing as one.
// - The left ear is the higher one. Ears crosses the two by the family's law
//   (kit::ear_gains): at 1 each ear has one tone, at 0 both ears have both and
//   are the same to the sample. The mid is the same at every setting.
// - Cross gives each ear two tones Beat apart: the left ear the key less a
//   quarter of Beat and plus three quarters, the right ear the key less three
//   quarters and plus a quarter. Each ear then beats in the air at Beat, the
//   left pair is half of Beat above the right pair, and the four are centred
//   on the key. They are made from a second clock at a quarter of Beat that
//   is stepped by half the half-beat's step and restarted with it.
// - Warmth adds the second and third partials (kSecond and kThird of the
//   first at Warmth 1). A partial at or under 1 kHz is split by the same Beat
//   in hertz as its key; one above is the same in both ears. The voice is
//   scaled so that its peak does not move with Warmth.
// - The sum of the keys is scaled by 1 / sqrt(max(1, sum of envelope²)): one
//   key at gain 0.7 peaks near -18 dBFS, and eight at full gain, even in
//   step, reach 0.495 and stop short of the soft clip's knee at 0.5 (at
//   Volume 0 dB or under; the bed is added on top). The clip is a guard: in
//   its knee it would make difference tones inside each ear.
// - The bed is one stereo noise (kit/colour.h), two unlike streams, as loud
//   at Bed 1 as one bare key and a square law under that. It follows the
//   loudest key's envelope times its gain, so there is none before a key and
//   none after the last release.
// - Beat glides to Target over Glide minutes in closed form (kit::RateGlide):
//   armed by any change of the three, started by the first key after that (at
//   once if a key sounds), counting on through releases and sleep.
//
// What restarts and when. A key that arrives with no voice sounding restarts
// everything that runs on its own, at that sample: both beat clocks to 0 (the
// beat's crest), the bed's noise and its filters, the control clock, and every
// smoother to its target. A later key joins what is running. The glide alone
// is never restarted by a key. Asleep, the glide counts on by the block's
// frames, which is the same as that many single steps; nothing else needs to.
//
// A key struck again plays on in its own voice (its envelope rises again from
// where it stands), so no second voice piles up on it in step. A stolen voice
// fades over kStealSeconds and the new key waits in it.
//
// Two keys can sound one pitch: A1 and A2 both fold to 110 Hz. A key that
// starts on a pitch another voice is sounding takes that voice's carrier
// phase, so the two add in step however far apart they were struck. Left to
// start at phase 0 the second one cancelled the first by anything up to
// 54 dB, by the accident of a few milliseconds.
//
// Storage: eight voices, two noise filters; no delay line.

#include "../../kit/kit.h"
#include "../../kit/beat.h"
#include "../../kit/colour.h"
#include "params.gen.h"

namespace livemix {

class Binaural : public kit::DeviceBase<binaural::kNumParams> {
 public:
  static constexpr int kVoices = 8;
  // Keys fold by octaves into this range.
  static constexpr float kLowHz = 80.0f;
  static constexpr float kHighHz = 1000.0f;
  // A partial above this is not split between the ears.
  static constexpr float kSplitTopHz = 1000.0f;
  // One key at full gain, in each ear, before Volume: eight in step come to
  // 8 / sqrt(8) of it, 0.495.
  static constexpr float kVoiceAmp = 0.175f;
  // The second and third partial against the first at Warmth 1.
  static constexpr float kSecond = 0.5f;
  static constexpr float kThird = 0.25f;
  // What the coloured noise (RMS kit::kColourRms) is scaled by at Bed 1 for
  // a key at full gain: the RMS of one bare tone of kVoiceAmp, 0.125.
  static constexpr float kBedLevel = 0.625f;
  // A stolen voice fades over this long; a note id struck again at another
  // pitch lets its old voice go in that long.
  static constexpr float kStealSeconds = 0.005f;
  static constexpr float kRestrikeSeconds = 0.03f;
  // Two keys this near in pitch (as a part of it) are one pitch and share a
  // carrier: a few steps of a float, where a host's octaves may round apart.
  static constexpr float kSamePitch = 1.0e-6f;
  // Colour follows its knob with this time constant, on the control clock.
  static constexpr float kColourSeconds = 0.02f;
  // Nothing outlives the envelopes, so the hold only has to be there.
  static constexpr float kIdleSeconds = 0.1f;
  static constexpr int kControlPeriod = 32;

  // The pitch a key sounds at: brought into 80 Hz to 1 kHz by octaves.
  static float fold(float hz) {
    if (!(hz > 1.0f)) hz = 1.0f;
    while (hz > kHighHz) hz *= 0.5f;
    while (hz < kLowHz) hz *= 2.0f;
    return hz;
  }

  // Whether two folded keys are one pitch.
  static bool same_pitch(float a, float b) {
    const float apart = a - b;
    return (apart < 0.0f ? -apart : apart) <= kSamePitch * b;
  }

  void init(float sample_rate) {
    using namespace binaural;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    const float control_rate = sr / static_cast<float>(kControlPeriod);
    pool_.reset();
    for (int v = 0; v < kVoices; ++v) {
      pool_.voices[v] = Voice();
      pool_.voices[v].env.set_sample_rate(sr);
    }
    half_beat_.reset();
    quarter_beat_.reset();
    glide_.reset(sr);
    rate_ = -1.0;
    half_step_ = 0.0;
    for (int c = 0; c < 2; ++c) {
      noise_[c].seed(kNoiseSeed + static_cast<uint64_t>(c));
      colour_filter_[c].init(sr);
    }
    ears_.set_time(kSmoothingSeconds, sr);
    cross_.set_time(kSmoothingSeconds, sr);
    warmth_.set_time(kSmoothingSeconds, sr);
    bed_.set_time(kSmoothingSeconds, sr);
    volume_.set_time(kSmoothingSeconds, sr);
    colour_.set_time(kColourSeconds, control_rate);
    gain_coeff_ = 1.0f - kit::time_to_coeff(kSmoothingSeconds, sr);
    clock_.reset(kControlPeriod);
    idle_.reset(sr, kIdleSeconds);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    set_colour(colour_.value);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The reading named by "meters" in device.json, for a display: how far the
  // glide has come, 0 while it waits, 1 once it holds. It counts on asleep.
  float meter(int index) const { return index == 0 ? glide_.place() : 0.0f; }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = fold(kit::clamp(frequency, 8.0f, 12000.0f));
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    if (pool_.count_active() == 0) restart();
    glide_.key();

    for (int v = 0; v < kVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (pool_.note_id_of(v) != note_id || !voice.active()) continue;
      if (voice.pending) {
        // Struck again before it could start: the waiting note is this one.
        voice.next_frequency = frequency;
        voice.next_gain = gain;
        return;
      }
      if (voice.fade_step > 0.0f) continue;  // already on its way out
      if (same_pitch(voice.frequency, frequency)) {
        // Struck again, held or still fading: the voice plays on.
        voice.gain_target = gain;
        voice.env.gate_on();
        return;
      }
      // The same note id at another pitch: let the old one go quickly.
      voice.fade_step = 1.0f / (kRestrikeSeconds * sample_rate());
    }

    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    if (stolen) {
      // The old note fades out first; the new one waits in the voice.
      voice.pending = true;
      voice.next_frequency = frequency;
      voice.next_gain = gain;
      if (voice.fade_step == 0.0f) voice.fade_step = 1.0f / (kStealSeconds * sample_rate());
    } else {
      start(voice, frequency, gain);
    }
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held < 0) return;
    Voice& voice = pool_.voices[held];
    if (voice.pending) {
      voice.pending = false;  // let go before it could start: the fade just finishes
    } else {
      voice.env.gate_off();
    }
  }

  void process(int frames);

 private:
  struct Voice {
    kit::Adsr env;
    double carrier = 0.0;    // phase in cycles
    double increment = 0.0;  // cycles a sample
    float frequency = 0.0f;  // the folded key
    float gain = 0.0f;       // the key's gain, smoothed
    float gain_target = 0.0f;
    float fade = 0.0f;       // 0..1 along the fade of a voice that is making room
    float fade_step = 0.0f;  // 0 while it is not fading
    float next_frequency = 0.0f;
    float next_gain = 0.0f;
    bool split_second = true;  // the second partial is at or under kSplitTopHz
    bool split_third = true;
    bool pending = false;      // a key waits for the fade to finish

    bool active() const { return env.active() || pending; }
    // A voice making room with no key waiting is as good as released.
    bool releasing() const { return !pending && (env.releasing() || fade_step > 0.0f); }
    // From the envelope and the key's gain, never from the output: a held
    // key counts at its full level from the moment it is taken (its attack
    // may be seconds long and its pair may stand in the beat's null), a
    // released one at where its envelope stands, a waiting one above all.
    float level() const {
      if (pending) return 2.0f;
      return (env.releasing() ? env.level() : 1.0f) * gain_target * (1.0f - fade);
    }
  };

  static constexpr uint64_t kNoiseSeed = 0xB1A0ull;

  static int choice(float value) { return static_cast<int>(value + 0.5f); }

  void set_envelope(Voice& voice) const {
    // Sustain is 1, so the decay time is never heard.
    voice.env.set(param(binaural::kAttack), 0.1f, 1.0f, param(binaural::kRelease));
  }

  // Start a key in a voice that is silent. The carrier begins at phase 0, or
  // in step with a voice that already sounds this pitch; where the pair
  // stands in its beat is the device's clock's to say. `passed` is how many
  // voices have already moved their carriers on in the sample being made
  // (none when a key arrives between blocks).
  void start(Voice& voice, float frequency, float gain, int passed = 0) {
    voice.frequency = frequency;
    voice.carrier = 0.0;
    voice.increment = static_cast<double>(frequency) / static_cast<double>(sample_rate());
    for (int v = 0; v < kVoices; ++v) {
      const Voice& other = pool_.voices[v];
      if (&other == &voice || !other.env.active() || !same_pitch(other.frequency, frequency)) continue;
      voice.frequency = other.frequency;
      voice.increment = other.increment;
      voice.carrier = v < passed ? kit::wrap_phase(other.carrier - other.increment) : other.carrier;
      break;
    }
    voice.gain = gain;
    voice.gain_target = gain;
    voice.fade = 0.0f;
    voice.fade_step = 0.0f;
    voice.pending = false;
    voice.split_second = 2.0f * voice.frequency <= kSplitTopHz;
    voice.split_third = 3.0f * voice.frequency <= kSplitTopHz;
    voice.env.reset();
    set_envelope(voice);
    voice.env.gate_on();
  }

  // Before the first key after every voice has ended. A sleeping device
  // stands still and the block it falls asleep in depends on the host's
  // block size, so nothing that runs on through a silence may be carried
  // into the next note: the beat starts at its crest, the bed's noise starts
  // from its seed with empty filters, the control clock starts on this
  // sample, and a control moved in the silence is simply there. The glide is
  // not touched: it counts by samples, asleep or awake.
  void restart() {
    half_beat_.reset();
    quarter_beat_.reset();
    clock_.reset(kControlPeriod);
    kit::Smoother* const smoothers[] = {&ears_, &cross_, &warmth_, &bed_, &volume_, &colour_};
    for (kit::Smoother* smoother : smoothers) smoother->snap(smoother->target);
    for (int c = 0; c < 2; ++c) {
      noise_[c].seed(kNoiseSeed + static_cast<uint64_t>(c));
      colour_filter_[c].reset();
    }
    set_colour(colour_.value);
  }

  void set_colour(float colour) {
    colour_set_ = colour;
    colour_filter_[0].set_colour(colour);
    colour_filter_[1].set_colour(colour);
  }

  // Every 32 samples: the bed's colour follows its knob.
  void control() {
    const float colour = colour_.next();
    if (colour != colour_set_) set_colour(colour);
  }

  void apply(int id) {
    using namespace binaural;
    const float value = param(id);
    switch (id) {
      case kBeat:
      case kTarget:
      case kGlide:
        // Any change of the three arms the glide; with a key sounding it
        // starts at this sample, otherwise at the next key.
        glide_.set(param(kBeat), param(kTarget), 60.0 * static_cast<double>(param(kGlide)), pool_.count_active() > 0);
        break;
      case kEars:
        ears_.set(value, primed());
        break;
      case kLayout:
        cross_.set(choice(value) == 1 ? 1.0f : 0.0f, primed());
        break;
      case kWarmth:
        warmth_.set(value, primed());
        break;
      case kBed:
        bed_.set(value * value * kBedLevel, primed());
        break;
      case kColour:
        colour_.set(value, primed());
        break;
      case kAttack:
      case kRelease:
        for (int v = 0; v < kVoices; ++v) set_envelope(pool_.voices[v]);
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      default:
        break;
    }
  }

  kit::VoicePool<Voice, kVoices> pool_;
  kit::SlowClock half_beat_;     // turns at half of Beat: the pair
  kit::SlowClock quarter_beat_;  // turns at a quarter of Beat: Cross
  kit::RateGlide glide_;
  double rate_ = -1.0;           // the beat rate half_step_ was worked out for
  double half_step_ = 0.0;       // cycles a sample of the half-beat clock
  kit::StreamRng noise_[2];
  kit::ColourFilter colour_filter_[2];
  // Per sample.
  kit::Smoother ears_, cross_, warmth_, bed_, volume_;
  // On the control clock.
  kit::Smoother colour_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  float gain_coeff_ = 0.0f;
  float colour_set_ = -1.0f;  // the Colour the filters were last set for
};

inline void Binaural::process(int frames) {
  frames = begin_block(frames);
  if (!idle_.wake(pool_.count_active() > 0)) {
    // Asleep the glide counts on, by the same count as awake. Nothing else
    // has to: the next key restarts the rest.
    glide_.advance(frames);
    silence_output(frames);
    return;
  }
  clear_input(frames);  // an instrument ignores its input
  const double sr = static_cast<double>(sample_rate());
  for (int i = 0; i < frames; ++i) {
    if (clock_.tick()) control();

    // The beat: one half-beat phase for every key, and its half for Cross.
    const double rate = glide_.step();
    if (rate != rate_) {
      rate_ = rate;
      half_step_ = kit::SlowClock::increment(0.5 * rate, sr);
    }
    const kit::SinCos half = kit::sin_cos(half_beat_.phase);
    const kit::SinCos quarter = kit::sin_cos(quarter_beat_.phase);
    half_beat_.step(half_step_);
    quarter_beat_.step(0.5 * half_step_);

    // The keys: what is split between the ears is gathered as one sine and
    // one cosine (the pair is linear in them), what is not as one signal.
    const float warmth = warmth_.next();
    const float second = kSecond * warmth;
    const float third = kThird * warmth;
    float split_s = 0.0f, split_c = 0.0f, whole = 0.0f, power = 0.0f, loudest = 0.0f;
    for (int v = 0; v < kVoices; ++v) {
      Voice& voice = pool_.voices[v];
      float fade = 1.0f;
      if (voice.fade_step > 0.0f) {
        voice.fade += voice.fade_step;
        if (voice.fade >= 1.0f || !voice.env.active()) {
          // The old note is gone: the key that waited starts, or the voice is free.
          voice.env.reset();
          voice.fade = 0.0f;
          voice.fade_step = 0.0f;
          if (voice.pending) start(voice, voice.next_frequency, voice.next_gain, v);
        } else {
          fade = 0.5f + 0.5f * kit::SineTable::cos_lookup(0.5f * voice.fade);
        }
      }
      if (!voice.env.active()) continue;
      const float env = voice.env.next() * fade;
      voice.gain += (voice.gain_target - voice.gain) * gain_coeff_;
      const float amp = env * voice.gain;
      power += env * env;
      if (amp > loudest) loudest = amp;

      const kit::SinCos turn = kit::sin_cos(voice.carrier);
      voice.carrier = kit::wrap_phase(voice.carrier + voice.increment);
      split_s += amp * turn.s;
      split_c += amp * turn.c;
      if (second > 0.0f) {
        const kit::SinCos two = kit::second_partial(turn);
        const kit::SinCos three = kit::third_partial(turn);
        if (voice.split_second) {
          split_s += amp * second * two.s;
          split_c += amp * second * two.c;
        } else {
          whole += amp * second * two.s;
        }
        if (voice.split_third) {
          split_s += amp * third * three.s;
          split_c += amp * third * three.c;
        } else {
          whole += amp * third * three.s;
        }
      }
    }

    // Pair: the key plus and minus half of Beat. Cross: two tones an ear, the
    // higher pair a quarter under and three quarters over the key.
    const kit::SinCos sum = {split_s, split_c};
    const kit::TonePair pair = kit::tone_pair(sum, half);
    float hi = pair.hi;
    float lo = pair.lo;
    const float cross = cross_.next();
    if (cross > 0.0f) {
      const kit::TonePair near = kit::tone_pair(sum, quarter);
      const kit::TonePair far = kit::tone_pair(sum, kit::third_partial(quarter));
      hi += cross * (0.5f * (near.lo + far.hi) - hi);
      lo += cross * (0.5f * (far.lo + near.hi) - lo);
    }
    float left, right;
    kit::to_ears(kit::ear_gains(ears_.next()), hi, lo, &left, &right);

    // One level for any number of keys, and a peak that does not move with
    // Warmth: the partials' amplitudes add up to one.
    const float norm = kVoiceAmp / ((1.0f + second + third) * std::sqrt(power > 1.0f ? power : 1.0f));
    left = (left + whole) * norm;
    right = (right + whole) * norm;

    // The bed, under the loudest key.
    const float bed = bed_.next();
    if (bed > 0.0f && loudest > 0.0f) {
      const float gate = bed * loudest;
      left += gate * colour_filter_[0].process(noise_[0].bipolar());
      right += gate * colour_filter_[1].process(noise_[1].bipolar());
    }

    const float volume = volume_.next();
    out_left_[i] = kit::soft_clip(left * volume);
    out_right_[i] = kit::soft_clip(right * volume);
  }
  idle_.settle(output_peak(frames), frames);
}

}  // namespace livemix
