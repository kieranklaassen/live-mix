#pragma once

// Coloured Noise: one bed of noise that the keys open, tint and let go.
//
//   stream 0 ─► colour ─► low cut ─► high cut ─► dark ─┬─────────────► × bed ──┐
//   stream 1 ─► (the same, a noise unlike the first)   └─► a band a key ─► × ──┴─► Width ─► × drift ─► Volume ─► out
//
// - The bed is two unlike noises (kit::StreamRng), each coloured by a
//   kit::ColourFilter: white at Colour 0, pink at 0.5, brown at 1, one RMS for
//   all of them and one level in each hertz at every sample rate. Low cut and
//   High cut fall by 24 dB an octave and are always in the path; over the
//   last half octave before the open end of its range a cut runs ahead of its
//   knob and ends outside the bed's band (10 Hz; 40 kHz, or as near as the
//   sample rate lets it), where it takes nothing.
// - A key does not add noise. The bed's level is the loudest open key's
//   (its envelope times its gain), so ten keys are as loud as one.
// - Tint gives each key a band of the bed at its own pitch, as wide as a
//   twelfth of the pitch, added to the bed in step with it: a peak that
//   stands 15 dB over the bed for one key at Tint 1. Several keys share what
//   one key has: the power a peak adds to the bed at its pitch, (1 + g)² - 1,
//   is split between the keys by the squares of their levels, so the level
//   does not grow with the keys here either. Keys at one pitch are one key
//   for this: their bands are the same band and would add in step.
// - Width is the Ears law of beat.h on the two noises: the same noise on both
//   sides at 0, one noise a side at 1, and one mono fold at every setting.
// - Drift is a train of swells on a clock of its own. Each swell is a dip of
//   raised-cosine shape that begins and ends at the crest; its length is the
//   Drift time times a seeded draw between a half and one and a half, and its
//   depth another draw. At the bottom of a full swell the bed is 9 dB down
//   and what lies over 700 Hz a further 6 dB.
//
// The first key after every voice has ended restarts all of it: the noise
// streams, every filter, the swells (at a crest), the control clock and the
// smoothing. What that key plays then depends on nothing that went before,
// on no block size, and on no moment at which the device fell asleep; a knob
// moved in the silence is simply there. A later key joins what is running.

#include "../../kit/kit.h"
#include "../../kit/beat.h"
#include "../../kit/colour.h"
#include "params.gen.h"

namespace livemix {

class ColouredNoise : public kit::DeviceBase<coloured_noise::kNumParams> {
 public:
  static constexpr int kMaxVoices = 10;

  // What a key may ask for.
  static constexpr float kLowestHz = 20.0f;
  static constexpr float kHighestHz = 12000.0f;
  // A key's band: its pitch over its width, and how many times over it is
  // added to the bed at Tint 1 (5.6 times the bed at the key's own pitch,
  // 15 dB).
  static constexpr float kBandQ = 12.0f;
  static constexpr float kTintGain = 4.6f;
  // A full swell at Drift 1: the level falls to 0.35 (9 dB down), and of
  // what lies over the corner half more is taken away (6 dB).
  static constexpr float kDriftLevel = 0.65f;
  static constexpr float kDriftDark = 0.5f;
  static constexpr float kDriftCornerHz = 700.0f;
  // A swell's length is Drift time times a draw from kSwellShortest to
  // kSwellShortest + 1 (1 on average); its depth a draw from kSwellShallowest
  // to 1.
  static constexpr float kSwellShortest = 0.5f;
  static constexpr float kSwellShallowest = 0.4f;
  // Over this much of its range before the open end a cut runs ahead of its
  // knob, and at the end itself stands kCutOpenOctaves outside the range
  // (10 Hz, 40 kHz), or at kCutHighest of the sample rate if that is lower:
  // kit::Svf goes no higher, and the cut should be on its way the moment the
  // knob leaves its end, not after a stretch in which nothing moves.
  static constexpr float kCutRunOctaves = 0.5f;
  static constexpr float kCutOpenOctaves = 1.0f;
  static constexpr float kCutHighest = 0.49f;

  void init(float sample_rate) {
    using namespace coloured_noise;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    kit::SineTable::init();
    control_period_ = sr > 60000.0f ? 32 : 16;
    const float control_rate = sr / static_cast<float>(control_period_);
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      voice = Voice();
      voice.env.set_sample_rate(sr);
    }
    for (int c = 0; c < 2; ++c) {
      colour_[c].init(sr);
      dark_[c].set_cutoff(kDriftCornerHz, sr);
    }
    gain_coeff_ = kit::time_to_coeff(kGainSeconds, sr);
    tint_.set_time(kSmoothingSeconds, sr);
    drift_.set_time(kSmoothingSeconds, sr);
    width_.set_time(kSmoothingSeconds, sr);
    volume_.set_time(kSmoothingSeconds, sr);
    colour_knob_.set_time(kSweepSeconds, control_rate);
    // Two stages of half the time each: a cut sets off from rest.
    low_octave_.set_time(0.5f * kSweepSeconds, control_rate);
    high_octave_.set_time(0.5f * kSweepSeconds, control_rate);
    low_glide_.set_time(0.5f * kSweepSeconds, control_rate);
    high_glide_.set_time(0.5f * kSweepSeconds, control_rate);
    // Nothing outlives the envelopes: the filters all stand before them.
    idle_.reset(sr, kHoldSeconds);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    restart();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, kLowestHz, kHighestHz);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    if (pool_.count_active() == 0) restart();

    // The key's own voice, if it has one: held, fading or waiting.
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& own = pool_.voices[v];
      if (pool_.note_id_of(v) != note_id || !own.active()) continue;
      if (own.waiting) {
        // Struck again before it could start: the waiting note is this one.
        // (Taking a second voice would leave one that no note off ends.)
        own.next_frequency = frequency;
        own.next_gain = gain;
        return;
      }
      if (own.frequency == frequency && !own.stolen) {
        // Struck again where it stands: the envelope rises from where it is,
        // so the bed does not dip and the band is not doubled.
        own.gain_target = gain;
        own.env.gate_on();
        return;
      }
      // The same id at another pitch: a held voice is let go quickly, so that
      // one note off ends the key; a fading one fades on.
      if (!own.env.releasing()) own.env.fast_release(kRestrikeSeconds);
    }

    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    voice.next_frequency = frequency;
    voice.next_gain = gain;
    if (stolen) {
      // The voice fades out first and starts the new key from silence.
      voice.waiting = true;
      voice.stolen = true;
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
      voice.waiting = false;  // let go before it began: the fade just finishes
    } else {
      voice.env.gate_off();
    }
  }

  void process(int frames);

 private:
  struct Voice {
    kit::Adsr env;
    kit::Svf band[2];            // the key's band of each noise
    float frequency = 0.0f;
    float gain = 0.0f;           // the key's gain, gliding to gain_target
    float gain_target = 0.0f;
    float amp = 0.0f;            // envelope times gain, this sample
    float lift = 0.0f;           // how much of its band is added to the bed, this sample
    int group = 0;               // the first voice at this pitch (itself, if none)
    // A voice taken for a new key fades out first; the key waits in it.
    bool waiting = false;
    bool stolen = false;         // fading out to make room: not this id's own sound
    float next_frequency = 0.0f;
    float next_gain = 0.0f;

    bool active() const { return env.active() || waiting; }
    // A waiting voice is as good as held: it must not be taken twice.
    bool releasing() const { return env.releasing() && !waiting; }
    // From the key, never from the output: a held key counts at its gain
    // from the moment it is taken, a fading one at where its envelope stands.
    float level() const {
      if (waiting) return 2.0f;
      return env.releasing() ? env.level() * gain_target : gain_target;
    }
  };

  // A voice taken for another key falls 60 dB in 30 ms. An exponential fall
  // is steepest where it starts, and a taken voice's band falls twice as fast
  // as the voice (its share goes by the square of its level): at 5 ms a
  // quarter of the whole change was in its first eight samples, here a tenth
  // at 44.1 kHz. The key that takes the voice begins when the fall is over,
  // 50 ms on.
  static constexpr float kStealSeconds = 0.03f;
  // An id sent again at another pitch: its old voice falls 60 dB in 50 ms.
  // Where another key holds the bed up the fall is cut short, and what is
  // left of it is its steep start.
  static constexpr float kRestrikeSeconds = 0.05f;
  static constexpr float kGainSeconds = 0.02f;
  static constexpr float kSweepSeconds = 0.02f;
  static constexpr float kHoldSeconds = 0.05f;
  // The two sections of a fourth-order Butterworth cut.
  static constexpr float kCutQ[2] = {0.54119610f, 1.30656296f};
  static constexpr uint64_t kNoiseSeed = 0x434F4C4F5552ull;
  static constexpr uint32_t kDriftSeed = 0xD21F7A11u;

  void start(Voice& voice);
  void regroup();
  void restart();
  void control();
  void next_swell();
  void set_drift_step();
  void set_cuts(bool low, float octave);
  void apply(int id);

  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::StreamRng rng_[2];
  kit::ColourFilter colour_[2];
  kit::Svf low_cut_[2][2];   // [side][section]
  kit::Svf high_cut_[2][2];
  kit::OnePole dark_[2];     // what lies under the drift's corner
  // Per sample.
  kit::Smoother tint_, drift_, width_, volume_;
  // Per control period: Colour, and the cuts in octaves (log2 of hertz).
  kit::Smoother colour_knob_, low_octave_, high_octave_;
  // A cut follows its knob through a second stage. One stage moves fastest
  // at the start, and a steep filter moved a tenth of an octave in its first
  // step turns the top of the band round at once: on white noise a third of
  // all a throw from 20 kHz to 500 Hz changes was there in eight samples.
  kit::Smoother low_glide_, high_glide_;
  float colour_set_ = -1.0f, low_set_ = -1.0f, high_set_ = -1.0f;
  // The drift: a phase in swells, and this swell's draws.
  kit::SlowClock swell_;
  kit::Rng swell_rng_;
  double swell_step_ = 0.0;
  float swell_length_ = 1.0f;
  float swell_depth_ = 1.0f;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  float gain_coeff_ = 0.0f;
  int control_period_ = 16;
};

inline void ColouredNoise::process(int frames) {
  frames = begin_block(frames);
  if (!idle_.wake(pool_.count_active() > 0)) {
    silence_output(frames);
    return;
  }
  clear_input(frames);  // an instrument ignores its input
  for (int i = 0; i < frames; ++i) {
    if (clock_.tick()) control();

    // The drift: where this sample stands in its swell.
    const double place = swell_.phase;
    swell_.step(swell_step_);
    if (swell_.phase < place) next_swell();
    const float sunk = drift_.next() * swell_depth_ * (0.5f - 0.5f * kit::SineTable::cos_lookup(static_cast<float>(place)));

    // The keys: the bed takes the loudest, the bands share one key's worth.
    float bed = 0.0f, power = 0.0f;
    float at_pitch[kMaxVoices] = {};  // the power of the voices at one pitch, under the first of them
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      voice.amp = 0.0f;
      if (!voice.env.active()) {
        if (!voice.waiting) continue;
        start(voice);
      }
      voice.gain = voice.gain_target + (voice.gain - voice.gain_target) * gain_coeff_;
      voice.amp = voice.env.next() * voice.gain;
      if (voice.amp > bed) bed = voice.amp;
      const float squared = voice.amp * voice.amp;
      at_pitch[voice.group] += squared;
      power += squared;
    }
    // One key's band is added `peak` times over, which lifts the power at
    // its pitch by (1 + peak)² - 1; several keys split that lift. Voices at
    // one pitch run the same band on the same noise, so their bands add in
    // step: together they take what one key of their summed power would, and
    // split that between them (taken singly, ten at one pitch would stand
    // 6 dB over one).
    const float peak = tint_.next() * kTintGain;
    const bool tinted = peak > 0.0f && power > 1.0e-20f;
    if (tinted) {
      const float lift = peak * (peak + 2.0f) / power;
      for (int v = 0; v < kMaxVoices; ++v) {
        // (sqrt(1 + lift p) - 1) / p for the power p at this pitch, written
        // so that nothing is lost where p is small.
        if (at_pitch[v] > 0.0f) at_pitch[v] = lift / (std::sqrt(1.0f + lift * at_pitch[v]) + 1.0f);
      }
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        if (voice.amp > 0.0f) voice.lift = at_pitch[voice.group] * voice.amp * voice.amp;
      }
    }
    const float dark = kDriftDark * sunk;

    float sound[2];
    for (int c = 0; c < 2; ++c) {
      float x = colour_[c].process(rng_[c].bipolar());
      x = low_cut_[c][1].highpass(low_cut_[c][0].highpass(x));
      x = high_cut_[c][1].lowpass(high_cut_[c][0].lowpass(x));
      // The swell's darkening: some of what lies over the corner is taken
      // away. With nothing sunk this is the sample itself.
      x -= dark * (x - dark_[c].lowpass(x));
      float bands = 0.0f;
      if (tinted) {
        for (int v = 0; v < kMaxVoices; ++v) {
          Voice& voice = pool_.voices[v];
          if (voice.amp > 0.0f) bands += voice.lift * voice.band[c].bandpass(x);
        }
      }
      sound[c] = bed * (x + bands);
    }

    float left, right;
    kit::to_ears(kit::ear_gains(width_.next()), sound[0], sound[1], &left, &right);
    const float level = (1.0f - kDriftLevel * sunk) * volume_.next();
    out_left_[i] = kit::soft_clip(left * level);
    out_right_[i] = kit::soft_clip(right * level);
  }
  idle_.settle(output_peak(frames), frames);
}

// A key begins in a voice that is silent.
inline void ColouredNoise::start(Voice& voice) {
  using namespace coloured_noise;
  voice.waiting = false;
  voice.stolen = false;
  voice.frequency = voice.next_frequency;
  voice.gain = voice.gain_target = voice.next_gain;
  voice.amp = 0.0f;
  for (kit::Svf& band : voice.band) {
    band.reset();
    band.set(voice.frequency, kBandQ, sample_rate());
  }
  voice.env.set(param(kAttack), param(kAttack), 1.0f, param(kRelease));  // (idle: it rises from nothing)
  voice.env.gate_on();
  regroup();
}

// Which voices stand at one pitch. A voice's pitch changes only in start(),
// where it is silent, so nothing heard moves when the groups do; a voice that
// has ended adds nothing to the group it is still written under.
inline void ColouredNoise::regroup() {
  for (int v = 0; v < kMaxVoices; ++v) {
    Voice& voice = pool_.voices[v];
    voice.group = v;
    for (int earlier = 0; earlier < v; ++earlier) {
      if (pool_.voices[earlier].frequency == voice.frequency) {
        voice.group = pool_.voices[earlier].group;
        break;
      }
    }
  }
}

// Before the first key after every voice has ended (and at the end of init).
// A sleeping device stands still, and the block it falls asleep in depends on
// the host's block size, so nothing that runs on through a silence may be
// carried into the next key: the noise, the filters and the swells begin
// again from one place, and a control moved in the silence is simply there.
// Nothing is sounding at this point: the last voice ended 100 dB down.
inline void ColouredNoise::restart() {
  for (int c = 0; c < 2; ++c) {
    rng_[c].seed(kNoiseSeed + static_cast<uint64_t>(c));
    colour_[c].reset();
    dark_[c].reset();
    for (int section = 0; section < 2; ++section) {
      low_cut_[c][section].reset();
      high_cut_[c][section].reset();
    }
  }
  kit::Smoother* const smoothers[] = {&tint_, &drift_, &width_, &volume_, &colour_knob_, &low_octave_, &high_octave_};
  for (kit::Smoother* smoother : smoothers) smoother->snap(smoother->target);
  low_glide_.snap(low_octave_.target);
  high_glide_.snap(high_octave_.target);
  // The control clock ticks on its first sample, so Colour and the cuts are
  // set to where the knobs are before anything sounds.
  colour_set_ = low_set_ = high_set_ = -1.0f;
  clock_.reset(control_period_);
  swell_.reset();  // a crest
  swell_rng_.seed(kDriftSeed);
  next_swell();
}

// Every control period: Colour, the cuts and the envelope times.
inline void ColouredNoise::control() {
  using namespace coloured_noise;
  const float colour = colour_knob_.next();
  if (colour != colour_set_) {
    colour_set_ = colour;
    colour_[0].set_colour(colour);
    colour_[1].set_colour(colour);
  }
  low_glide_.set_target(low_octave_.next());
  const float low = low_glide_.next();
  if (low != low_set_) {
    low_set_ = low;
    set_cuts(true, low);
  }
  high_glide_.set_target(high_octave_.next());
  const float high = high_glide_.next();
  if (high != high_set_) {
    high_set_ = high;
    set_cuts(false, high);
  }
  const float attack = param(kAttack), release = param(kRelease);
  for (int v = 0; v < kMaxVoices; ++v) {
    Voice& voice = pool_.voices[v];
    if (voice.env.active()) voice.env.set(attack, attack, 1.0f, release);
  }
}

// The swell that begins now: how long and how deep.
inline void ColouredNoise::next_swell() {
  swell_length_ = kSwellShortest + swell_rng_.uniform();
  swell_depth_ = kSwellShallowest + (1.0f - kSwellShallowest) * swell_rng_.uniform();
  set_drift_step();
}

inline void ColouredNoise::set_drift_step() {
  const double seconds = static_cast<double>(param(coloured_noise::kDriftTime)) * swell_length_;
  swell_step_ = kit::SlowClock::increment(1.0 / seconds, sample_rate());
}

// A cut is never mixed in: noise through a steep filter is out of step with
// the plain noise, and a part-way mix of the two has a notch at the cut (the
// level came back up by 2 dB in the lowest octave as Low cut rose from 25 to
// 28 Hz). Near the open end of its range the cut is moved out of the bed's
// band instead: over the last half octave it goes evenly, in octaves, from
// where its knob is to its open place.
inline void ColouredNoise::set_cuts(bool low, float octave) {
  using namespace coloured_noise;
  const float highest = std::log2(kCutHighest * sample_rate());
  const float end = std::log2(low ? kParamMin[kLowCut] : kParamMax[kHighCut]);
  const float from_end = low ? octave - end : end - octave;
  if (from_end < kCutRunOctaves) {
    const float inner = low ? end + kCutRunOctaves : end - kCutRunOctaves;
    const float open = low ? end - kCutOpenOctaves : kit::min(end + kCutOpenOctaves, highest);
    octave = inner + (open - inner) * (kCutRunOctaves - from_end) / kCutRunOctaves;
  }
  const float hz = std::exp2(kit::min(octave, highest));
  for (int c = 0; c < 2; ++c) {
    for (int section = 0; section < 2; ++section) {
      (low ? low_cut_ : high_cut_)[c][section].set(hz, kCutQ[section], sample_rate());
    }
  }
}

inline void ColouredNoise::apply(int id) {
  using namespace coloured_noise;
  const float value = param(id);
  switch (id) {
    case kColour:
      colour_knob_.set(value, primed());
      break;
    case kLowCut:
      low_octave_.set(std::log2(value), primed());
      break;
    case kHighCut:
      high_octave_.set(std::log2(value), primed());
      break;
    case kTint:
      tint_.set(value, primed());
      break;
    case kDrift:
      drift_.set(value, primed());
      break;
    case kDriftTime:
      set_drift_step();  // the swell goes on from where it is, at the new pace
      break;
    case kWidth:
      width_.set(value, primed());
      break;
    case kVolume:
      volume_.set(kit::db_to_gain(value), primed());
      break;
    default:
      break;  // attack and release are read on the control clock
  }
}

}  // namespace livemix
