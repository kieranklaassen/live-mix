#pragma once

// Overtone: a drone voice whose mouth picks single harmonics out of its own
// tone, so a whistled melody floats over one held note.
//
//   per note (up to 6):
//
//   phase ─► pulse train: every harmonic of the note, equally loud (pulse_train.h)
//              │
//              ├─► odd/even weight ─► × growl ─► tilt ─► + air ─► thin ─► formant ─► dark ─► drone ───┐
//              │   (the body of the Voice)                 ▲                                         ├─► × envelope ─► pan ─┐
//              └─► + air ─► tilt ─► resonator ─► resonator ┼─► whistle, on harmonic k of the note ───┘                     │
//                    ▲                                     │                                                               ▼
//   noise × Breath ──┴─────────────────────────────────────┘                          out ◄─ soft clip ◄─ volume ◄─ sum
//
//   Overtone knob ─► home harmonic ─┐
//   Wander, Pace ─► seeded walk ────┴─► k, the same for every held note ─► glide ─► the two resonators
//
// - The source is a band-limited impulse train: harmonics 1 to n of the note,
//   all at one level, in closed form, where n is fixed when the note starts
//   so that nothing reaches past 16 kHz (or 0.42 of the sample rate). There
//   is nothing above it to fold back, at any note or rate.
// - The drone is that train through the fixed body the Voice names: Throat
//   tilts it like a pressed voice and adds a low nasal formant; Pipe weights
//   the odd harmonics, as a tube closed at the lips does, and is dark; Reed
//   keeps it bright, leans out the bottom and gives it a hollow mouth.
// - The whistle is the same train through two resonators in series, both on
//   harmonic k of the note. Their bandwidth is a share of the note's own
//   frequency, so a harmonic stands as far above its neighbours on a low
//   note as on a high one, and on harmonic 3 as on harmonic 16. Focus
//   narrows them (from four harmonics wide, a vowel, to a little over half
//   of one, a whistle) and raises the whistle against the drone.
// - k glides (about 80 ms). With Wander at 0 it is the Overtone knob. With
//   Wander up, a seeded walk steps every 1/Pace seconds along the ladder of
//   harmonics that land on a key (3 4 5 6 8 9 10 12 16), at most three
//   rungs from the rung nearest the knob. The walk belongs to the
//   instrument, not to a note, so a chord moves as one. The resonators stay
//   under about 4 kHz: on a high note a rung comes down by octaves, or to
//   the highest rung that fits, and the whistle gives way to the note as
//   fewer harmonics fit, so that a high key still sounds its own pitch.
// - Growl makes every other pulse of the train stronger and the ones between
//   weaker (the false folds of a deep throat, the lips on a pipe). That is
//   the same as adding the odd harmonics of half the note: a rattle an
//   octave below and in every gap between the harmonics. It is never steady.
// - Breath is noise through the body and through the resonators, so the air
//   hisses in the drone and whistles at k.
// - Vibrato waits a fifth of a second and comes in over half a second more;
//   the resonators follow the pitch, so the whistle bends with the note.
//
// A stolen voice fades out over 4 ms before the new note starts in it. The
// instrument sleeps when no note sounds; the first note after a silence
// finds every knob where it was left and the walk at home.

#include "../../kit/kit.h"
#include "params.gen.h"
#include "pulse_train.h"

namespace livemix {

class Overtone : public kit::DeviceBase<overtone::kNumParams> {
 public:
  static constexpr int kMaxVoices = 6;
  static constexpr int kControlPeriod = 32;
  static constexpr int kVoiceChoices = 3;

  // Notes are played from 16 Hz to 8 kHz; the keyboard asks for 28 Hz to
  // 4.2 kHz.
  static constexpr float kMinHz = 16.0f;
  static constexpr float kMaxHz = 8000.0f;
  // The train stops under this, whatever the sample rate allows, so the
  // instrument is the same at 44.1, 48 and 96 kHz. The margin keeps the top
  // harmonic there when vibrato and drift raise the note.
  static constexpr float kTopHz = 16000.0f;
  static constexpr float kTopOfRate = 0.42f;
  static constexpr float kPitchMargin = 1.05f;

  // The body of a Voice. Frequencies in `*_ratio` are multiples of the note.
  struct Colour {
    float even;           // weight of the even harmonics (1 is every harmonic alike)
    float tilt_ratio;     // corner of the 6 dB per octave fall of the source
    float thin;           // how much of the bottom (under kThinRatio) is taken away
    float formant_hz;     // the fixed resonance of the mouth or tube
    float formant_q;
    float formant_gain;   // how far it stands over the rest (0 is none)
    float dark_hz;        // corner of the last low-pass
    float level;          // makes the three equally loud
  };
  static constexpr Colour kColours[kVoiceChoices] = {
      // Throat: a pressed voice, saw-like, with one low nasal formant.
      {1.0f, 1.2f, 0.0f, 560.0f, 3.5f, 1.6f, 2800.0f, 1.0f},
      // Pipe: the odd harmonics of a stopped tube, dark, a broad low hump.
      {0.3f, 0.9f, 0.0f, 380.0f, 2.5f, 1.0f, 1500.0f, 1.25f},
      // Reed: flat and bright, a lean bottom, a hollow mouth around 1.5 kHz.
      // Its note and octave stay within about 15 dB of the whistle: leaner
      // than that and a chord of reeds reads as its whistles, not its keys.
      {1.0f, 2.5f, 0.35f, 1500.0f, 2.0f, 1.2f, 6000.0f, 0.68f},
  };
  static constexpr float kThinRatio = 2.5f;
  // The last low-pass never comes under this many times the note: a high
  // key keeps its own pitch and its first overtones whatever the body.
  static constexpr float kDarkRatio = 2.5f;

  // The harmonics the walk steps on, low to high: the ones that land on a
  // key (within 14 cents), which over the note are its fifth (3 6 12), its
  // octaves (4 8 16), its third (5 10) and its second (9). Harmonics 7, 11,
  // 13 and 14 fall between the keys by 31 to 49 cents and beat fast against
  // other held notes; the knob still reaches them, the walk leaves them out.
  static constexpr int kRungs = 9;
  static constexpr float kLadder[kRungs] = {3.0f, 4.0f, 5.0f, 6.0f, 8.0f, 9.0f, 10.0f, 12.0f, 16.0f};
  // Wander 1 reaches this many rungs either side of home.
  static constexpr int kMaxReach = 3;
  // The whistle's resonators stay under this.
  static constexpr float kWhistleTopHz = 4000.0f;
  // The whistle is whole while this many harmonics fit under kWhistleTopHz
  // (notes up to 500 Hz); above that it gives way with the square of what
  // fits, down to this share (from 913 Hz up), so that on a high key the
  // note stays as loud as the one or two harmonics the mouth can still reach.
  static constexpr float kFullReach = 8.0f;
  static constexpr float kLeastReach = 0.3f;
  // ... and the drone comes up by this much of what the whistle gave away,
  // which keeps a key as loud at the top of the keyboard as in the middle.
  static constexpr float kHighLift = 1.3f;
  // k follows its target through two of these in series: an S-shaped glide
  // that has arrived after about 80 ms.
  static constexpr float kGlideSeconds = 0.018f;
  // The resonators' bandwidth as a share of the note, at Focus 0 and 1.
  static constexpr float kWideBand = 4.0f;
  static constexpr float kSharpBand = 0.6f;
  // The whistle against the train's own level, at Focus 0 and 1, and the
  // drone it stands over, which gives way a little as the whistle sharpens.
  // The mouth is fed the train tilted from the note up, which turns its
  // phase the way the body turns the drone's, so the two add up around k
  // instead of cancelling; the whistle's gain gives harmonic k its level back.
  static constexpr float kMouthTiltRatio = 1.0f;
  static constexpr float kWhistleSoft = 0.3f;
  static constexpr float kWhistleSharp = 1.5f;
  static constexpr float kDroneGiveWay = 0.3f;
  // Growl: how far every other pulse of the train stands over the one
  // between at Growl 1 (which is the level of the rattle against the
  // harmonics), and how far that flutters.
  static constexpr float kGrowlGain = 0.8f;
  // Under this the drone is rolled off: the rattle of a low note is felt as
  // roughness, not as a tone under the keyboard.
  static constexpr float kRumbleHz = 18.0f;
  static constexpr float kGrowlFlutter = 2.2f;
  static constexpr float kFlutterHz = 22.0f;
  // Breath at 1: noise into the body, and into the resonators (at 220 Hz;
  // scaled with the note so the air is as loud against the whistle on any key).
  static constexpr float kBodyAir = 6.0f;
  static constexpr float kWhistleAir = 24.0f;
  // Vibrato: rate, depth at 1, and when it comes in.
  static constexpr float kVibratoHz = 5.2f;
  static constexpr float kVibratoCents = 40.0f;
  static constexpr float kVibratoDelay = 0.2f;
  static constexpr float kVibratoRise = 0.5f;
  // Every voice wanders by this many cents on its own.
  static constexpr float kDriftCents = 1.2f;
  static constexpr float kDriftHz = 0.23f;
  // The whistle drifts across the image at this rate, this far at Width 1;
  // the drones of a chord stand at these places.
  static constexpr float kPanDriftHz = 0.09f;
  static constexpr float kWhistlePan = 0.75f;
  static constexpr float kDronePan[kMaxVoices] = {0.0f, -0.4f, 0.4f, -0.65f, 0.65f, 0.0f};
  // A stolen voice fades over this long, then the new note starts in it.
  static constexpr float kStealSeconds = 0.004f;
  // One note at gain 0.7 peaks near -17 dBFS at the default volume.
  static constexpr float kVoiceGain = 0.055f;

  void init(float sample_rate) {
    using namespace overtone;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    control_rate_ = sr / static_cast<float>(kControlPeriod);
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      voice = Voice();
      voice.env.set_sample_rate(sr);
      const uint32_t seed = 0x9E3779B9u * static_cast<uint32_t>(v + 1);
      voice.drift.seed(seed ^ 0x51ED270Bu);
      voice.drift.set_rate(kDriftHz, sr);
      voice.pan_drift.seed(seed ^ 0x2468ACE1u);
      voice.pan_drift.set_rate(kPanDriftHz, sr);
      voice.air.seed(seed ^ 0x0BADC0DEu);
      voice.rattle.seed(seed ^ 0x7F4A7C15u);
    }
    walk_.seed(0xC0FFEE11u);
    start_.seed(0xA5A5F00Du);
    volume_.set_time(kSmoothingSeconds, sr);
    // White noise spreads over a wider band at a higher rate.
    noise_scale_ = std::sqrt(sr / 48000.0f);
    glide_coeff_ = 1.0f - kit::time_to_coeff(kGlideSeconds, control_rate_);
    colour_coeff_ = 1.0f - kit::time_to_coeff(0.012f, control_rate_);
    flutter_coeff_ = 1.0f - std::exp(-kit::kTwoPi * kFlutterHz / control_rate_);
    gain_coeff_ = 1.0f - kit::time_to_coeff(kSmoothingSeconds, control_rate_);
    steal_samples_ = static_cast<int>(kStealSeconds * sr);
    if (steal_samples_ < 1) steal_samples_ = 1;
    colour_ = kColours[0];
    restart();
    // Nothing outlives the envelopes.
    idle_.reset(sr, 0.05f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    colour_moving_ = false;
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, kMinHz, kMaxHz);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    // Nothing sounds: whatever ran on or was moved in the silence starts
    // from a known place, at a moment that is exact to the sample.
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
      again.env.fast_release(0.02f);  // a key struck again while held
    }

    bool stolen = false;
    const int index = pool_.note_on(note_id, &stolen);
    Voice& voice = pool_.voices[index];
    if (stolen) {
      // Fade what sounds, then start (in process). A fade already under way
      // carries on from where it is.
      voice.next_hz = frequency;
      voice.next_gain = gain;
      voice.pending = true;
      if (voice.fade_left == 0) voice.fade_left = steal_samples_;
      return;
    }
    start(voice, index, frequency, gain);
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held < 0) return;
    Voice& voice = pool_.voices[held];
    if (voice.pending) {
      voice.pending = false;  // let go before it began: only the fade is left
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
    // In stretches that end where the control clock next fires, so the
    // clock lands on the same samples whatever the host's block size.
    int done = 0;
    while (done < frames) {
      if (clock_.counter == 0) control();
      const int count = kit::clamp_int(clock_.period - clock_.counter, 1, frames - done);
      for (int i = done; i < done + count; ++i) {
        out_left_[i] = 0.0f;
        out_right_[i] = 0.0f;
      }
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        if (!voice.active()) continue;
        int at = done, left = count;
        if (voice.fade_left > 0) {
          // A stolen voice: the rest of its fade, then the waiting note.
          const int fading = left < voice.fade_left ? left : voice.fade_left;
          render(voice, at, fading, clock_.counter);
          at += fading;
          left -= fading;
          if (voice.fade_left > 0) continue;
          if (!voice.pending) {
            voice.env.reset();
            continue;
          }
          start(voice, v, voice.next_hz, voice.next_gain);
        }
        if (left > 0) render(voice, at, left, clock_.counter + (at - done));
      }
      for (int i = done; i < done + count; ++i) {
        const float volume = volume_.next();
        out_left_[i] = kit::soft_clip(out_left_[i] * volume);
        out_right_[i] = kit::soft_clip(out_right_[i] * volume);
      }
      clock_.counter += count;
      if (clock_.counter >= clock_.period) clock_.counter = 0;
      done += count;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  struct Voice {
    kit::Adsr env;
    kit::Drift drift, pan_drift;
    kit::Rng air, rattle;
    kit::OnePole tilt, thin, dark, mouth_tilt, rumble;
    kit::Svf formant, mouth[2];
    // Half the note's phase, in cycles: the growl's own, and twice it is the
    // note's. Double, so the trains stay exact for as long as a note is held.
    double half_phase = 0.0;
    double half_increment = 0.0;
    float hz = 220.0f;        // the note
    float amp = 0.0f;         // velocity
    float age = 0.0f;         // seconds since the note started
    float harmonic = 8.0f;    // k, and the stage before it of the glide
    float harmonic_lag = 8.0f;
    float top_harmonic = 1.0f;  // the highest k whose resonator stays under kWhistleTopHz
    float reach = 1.0f;         // the whistle's share on a note too high for most harmonics
    float flutter = 0.0f;
    float air_trim = 1.0f;    // keeps the air as loud against the whistle on any key
    int terms = 1;            // harmonics in the train
    int odd_terms = 1;        // ... of them odd
    // What the control clock sets, smoothed and ramped per sample: the drone
    // and the whistle left and right, the growl and the breath.
    float gain[6] = {0.0f, 0.0f, 0.0f, 0.0f, 0.0f, 0.0f};
    float aim[6] = {0.0f, 0.0f, 0.0f, 0.0f, 0.0f, 0.0f};
    float step[6] = {0.0f, 0.0f, 0.0f, 0.0f, 0.0f, 0.0f};
    // A steal: fade out over fade_left samples, then start the waiting note.
    int fade_left = 0;
    bool pending = false;
    float next_hz = 0.0f, next_gain = 0.0f;

    bool active() const { return env.active() || pending; }
    // A voice that is only fading (its waiting note was let go) is the first
    // to be taken again.
    bool releasing() const { return !pending && (env.releasing() || fade_left > 0); }
    // True from the moment the voice is taken: a note still rising counts as
    // arrived, and a waiting note as the note it will be.
    float level() const {
      if (pending) return 0.3f + 0.7f * next_gain;
      return env.stage() == kit::Adsr::kAttack ? amp : env.level() * amp;
    }
  };
  enum Gain : int { kDroneLeft = 0, kDroneRight, kWhistleLeft, kWhistleRight, kGrowlLevel, kBreathLevel };

  int voice_choice() const {
    return kit::clamp_int(static_cast<int>(param(overtone::kVoice) + 0.5f), 0, kVoiceChoices - 1);
  }

  // `count` samples of one voice, added to the output from `at`. Everything
  // the loop touches is copied into locals first and written back after: a
  // voice's state then lives in registers instead of memory, which more
  // than halves the cost of the instrument.
  void render(Voice& voice, int at, int count, int since_tick) {
    kit::Adsr env = voice.env;
    kit::Rng air_noise = voice.air;
    kit::OnePole tilt = voice.tilt, thin = voice.thin, dark = voice.dark;
    kit::OnePole mouth_tilt = voice.mouth_tilt, rumble = voice.rumble;
    kit::Svf formant = voice.formant, mouth_a = voice.mouth[0], mouth_b = voice.mouth[1];
    double half_phase = voice.half_phase;
    const double half_increment = voice.half_increment;
    float drone_left = voice.gain[kDroneLeft], drone_right = voice.gain[kDroneRight];
    float whistle_left = voice.gain[kWhistleLeft], whistle_right = voice.gain[kWhistleRight];
    float growl = voice.gain[kGrowlLevel], breath = voice.gain[kBreathLevel];
    const float* step = voice.step;
    const float drone_left_step = step[kDroneLeft], drone_right_step = step[kDroneRight];
    const float whistle_left_step = step[kWhistleLeft], whistle_right_step = step[kWhistleRight];
    const float growl_step = step[kGrowlLevel], breath_step = step[kBreathLevel];
    // What the body's glide moves, in straight lines between control ticks.
    const Line even_line = even_, thin_line = thin_, formant_line = formant_;
    const bool odd_in_use = even_line.from < 1.0f || even_line.step != 0.0f;
    const bool thinning = thin_line.from > 0.0f || thin_line.step != 0.0f;
    const bool growling = growl > 0.0f || growl_step != 0.0f;
    // A high key has little but its own pitch: the body takes less of the
    // bottom away there, in step with what the whistle gives up.
    const float amp = voice.amp, air_trim = voice.air_trim, thin_share = voice.reach;
    const int terms = voice.terms, odd_terms = voice.odd_terms;
    // The fade of a stolen voice: down to nothing on its last sample.
    const int fade_left = voice.fade_left;
    const float fade_step = 1.0f / static_cast<float>(steal_samples_);
    float* out_left = out_left_ + at;
    float* out_right = out_right_ + at;

    for (int i = 0; i < count; ++i) {
      // Read from where the sample stands, not summed up along the way: the
      // stretches fall differently for another block size.
      const float since = static_cast<float>(since_tick + i);
      const float even = even_line.at(since), thin_amount = thin_line.at(since);
      const float formant_weight = formant_line.at(since);
      const float fade = fade_left > 0 ? static_cast<float>(fade_left - 1 - i) * fade_step : 1.0f;

      half_phase += half_increment;
      if (half_phase >= 1.0) half_phase -= 1.0;
      double phase = half_phase + half_phase;
      if (phase >= 1.0) phase -= 1.0;

      // The source: every harmonic, or the body's share of odd and even,
      // and the rattle an octave under it.
      const float train = overtone_dsp::all_harmonics(phase, terms);
      float source = train;
      if (odd_in_use) {
        const float odd = overtone_dsp::odd_harmonics(phase, odd_terms);
        source = odd + even * (train - odd);
      }
      if (growling) {
        // Every other pulse stronger, the ones between weaker: the same as
        // adding the odd harmonics of half the note, each `growl` strong.
        source *= 1.0f + growl * overtone_dsp::cos_cycles(static_cast<float>(half_phase));
      }
      const float air = air_noise.bipolar() * breath;

      // The drone: the body of the Voice.
      float drone = rumble.highpass(tilt.lowpass(source)) + air * kBodyAir;
      if (thinning) drone -= thin_amount * thin_share * thin.lowpass(drone);
      formant.process(drone);
      drone = dark.lowpass(drone + formant_weight * formant.band);

      // The whistle: the mouth on harmonic k. The second resonator's band
      // output is taken bare: its 1/Q is in the whistle's gains, which are
      // smoothed, so a change of Focus cannot step.
      mouth_b.process(mouth_a.bandpass(mouth_tilt.lowpass(train + air * air_trim)));
      const float whistle = mouth_b.band;

      const float level = env.next() * amp * fade;
      out_left[i] += level * (drone * drone_left + whistle * whistle_left);
      out_right[i] += level * (drone * drone_right + whistle * whistle_right);

      drone_left += drone_left_step;
      drone_right += drone_right_step;
      whistle_left += whistle_left_step;
      whistle_right += whistle_right_step;
      growl += growl_step;
      breath += breath_step;
    }

    voice.env = env;
    voice.air = air_noise;
    voice.tilt = tilt;
    voice.thin = thin;
    voice.dark = dark;
    voice.mouth_tilt = mouth_tilt;
    voice.rumble = rumble;
    voice.formant = formant;
    voice.mouth[0] = mouth_a;
    voice.mouth[1] = mouth_b;
    voice.half_phase = half_phase;
    voice.gain[kDroneLeft] = drone_left;
    voice.gain[kDroneRight] = drone_right;
    voice.gain[kWhistleLeft] = whistle_left;
    voice.gain[kWhistleRight] = whistle_right;
    voice.gain[kGrowlLevel] = growl;
    voice.gain[kBreathLevel] = breath;
    if (voice.fade_left > 0) voice.fade_left -= count;
  }

  // Start a note in a voice that is silent (idle, or at the end of its fade).
  void start(Voice& voice, int index, float frequency, float gain) {
    using namespace overtone;
    const float sr = sample_rate();
    voice.pending = false;
    voice.fade_left = 0;
    voice.hz = frequency;
    voice.amp = 0.3f + 0.7f * gain;
    voice.age = 0.0f;
    voice.flutter = 0.0f;
    const float top = kit::min(kTopHz, kTopOfRate * sr);
    voice.terms = static_cast<int>(top / (frequency * kPitchMargin));
    if (voice.terms < 1) voice.terms = 1;
    voice.odd_terms = (voice.terms + 1) / 2;
    voice.top_harmonic = std::floor(kWhistleTopHz / frequency);
    if (voice.top_harmonic < 1.0f) voice.top_harmonic = 1.0f;
    const float fit = kWhistleTopHz / (frequency * kFullReach);
    voice.reach = kit::clamp(fit * fit, kLeastReach, 1.0f);
    voice.air_trim = kWhistleAir * kit::clamp(std::sqrt(220.0f / frequency), 0.3f, 2.5f);
    // Notes of a chord start apart in phase so that they do not pile up.
    voice.half_phase = static_cast<double>(start_.uniform());
    voice.tilt.reset();
    voice.thin.reset();
    voice.dark.reset();
    voice.mouth_tilt.reset();
    voice.rumble.reset();
    voice.formant.reset();
    voice.mouth[0].reset();
    voice.mouth[1].reset();
    voice.mouth_tilt.set_cutoff(kMouthTiltRatio * frequency, sr);
    voice.rumble.set_cutoff(kRumbleHz, sr);
    set_body(voice);
    voice.harmonic = voice.harmonic_lag = harmonic_for(voice);
    tune(voice, index, true);
    voice.env.reset();  // a stolen voice's envelope is wherever the old note left it
    voice.env.set(param(kAttack), 0.01f, 1.0f, param(kRelease));
    voice.env.gate_on();
  }

  // The body's filters, from the colour as it is now.
  void set_body(Voice& voice) {
    const float sr = sample_rate();
    voice.tilt.set_cutoff(colour_.tilt_ratio * voice.hz, sr);
    voice.thin.set_cutoff(kThinRatio * voice.hz, sr);
    voice.dark.set_cutoff(kit::max(colour_.dark_hz, kDarkRatio * voice.hz), sr);
    voice.formant.set(colour_.formant_hz, colour_.formant_q, sr);
  }

  // The harmonic this voice's whistle is asked to sit on. A high note cannot
  // reach the upper ones: what is asked for, by the walk or by the knob,
  // then comes down by octaves while it is even (16 to 8, 12 to 6, 10 to 5:
  // the same pitch lower), else to the highest rung of the ladder that fits.
  // Above 1.3 kHz none does: the octave, then the note itself. So a key
  // too high for the knob never whistles on a harmonic between the keys
  // that nobody asked for.
  float harmonic_for(const Voice& voice) const {
    float k = target_harmonic_;
    const float top = voice.top_harmonic;
    if (k <= top) return k;
    while (k > top && k >= 2.0f && std::fmod(k, 2.0f) == 0.0f) k *= 0.5f;
    if (k <= top) return k;
    for (int r = kRungs - 1; r >= 0; --r) {
      if (kLadder[r] <= top) return kLadder[r];
    }
    return top;
  }

  // Every 32 samples for a sounding voice (and once when it starts, with
  // `snap`): its pitch, where its resonators sit, and its six gains.
  void tune(Voice& voice, int index, bool snap) {
    using namespace overtone;
    const float sr = sample_rate();
    const float dt = 1.0f / control_rate_;

    // Pitch: a little drift, and vibrato once the note has settled.
    const float onset = kit::clamp((voice.age - kVibratoDelay) / kVibratoRise, 0.0f, 1.0f);
    const float cents = kDriftCents * voice.drift.next(kControlPeriod) +
                        kVibratoCents * param(kVibrato) * onset * onset * (3.0f - 2.0f * onset) *
                            kit::SineTable::lookup(vibrato_phase_);
    // 2^(cents/1200) to second order: exact to 0.01 cent over ±100 cents.
    const float x = cents * (0.69314718f / 1200.0f);
    const float ratio = 1.0f + x + 0.5f * x * x;
    voice.half_increment = 0.5 * static_cast<double>(voice.hz * ratio) / static_cast<double>(sr);
    voice.age += dt;

    // The mouth: k glides to where it is asked, the resonators follow.
    const float wanted = harmonic_for(voice);
    if (snap) {
      voice.harmonic = voice.harmonic_lag = wanted;
    } else {
      voice.harmonic_lag += (wanted - voice.harmonic_lag) * glide_coeff_;
      voice.harmonic += (voice.harmonic_lag - voice.harmonic) * glide_coeff_;
      if (std::fabs(wanted - voice.harmonic) < 1.0e-4f && std::fabs(wanted - voice.harmonic_lag) < 1.0e-4f) {
        voice.harmonic = voice.harmonic_lag = wanted;
      }
    }
    kit::Svf& first = voice.mouth[0];
    kit::Svf& second = voice.mouth[1];
    first.set(voice.harmonic * voice.hz * ratio, kit::max(voice.harmonic / band_, 0.7f), sr);
    second.g = first.g;
    second.k = first.k;
    second.a1 = first.a1;
    second.a2 = first.a2;
    second.a3 = first.a3;

    // Gains. The whistle is a little louder on a low harmonic than a high
    // one; it drifts across the image while the drone stays at its place.
    const float width = param(kWidth);
    const float focus = focus_;
    const float lift = voice.harmonic / kMouthTiltRatio;
    const float whistle = kit::lerp(kWhistleSoft, kWhistleSharp, focus) * std::sqrt(1.0f + lift * lift) *
                          kit::clamp(std::sqrt(8.0f / voice.harmonic), 0.7f, 1.4f) * voice.reach * first.k;
    const float body = colour_.level * (1.0f - kDroneGiveWay * focus) * (1.0f + kHighLift * (1.0f - voice.reach));
    float pan_left, pan_right;
    pan(kDronePan[index] * width, &pan_left, &pan_right);
    float target[6];
    target[kDroneLeft] = kVoiceGain * body * pan_left;
    target[kDroneRight] = kVoiceGain * body * pan_right;
    pan(kWhistlePan * width * voice.pan_drift.next(kControlPeriod), &pan_left, &pan_right);
    target[kWhistleLeft] = kVoiceGain * whistle * pan_left;
    target[kWhistleRight] = kVoiceGain * whistle * pan_right;
    // The rattle is never steady.
    voice.flutter += (voice.rattle.bipolar() - voice.flutter) * flutter_coeff_;
    target[kGrowlLevel] =
        kGrowlGain * param(kGrowl) * kit::max(0.0f, 1.0f + kGrowlFlutter * voice.flutter);
    const float breath = param(kBreath);
    target[kBreathLevel] = breath * breath * noise_scale_;
    // Each gain follows its target with the kit's 5 ms, in straight lines
    // from one control tick to the next.
    for (int g = 0; g < 6; ++g) {
      if (snap) {
        voice.gain[g] = voice.aim[g] = target[g];
        voice.step[g] = 0.0f;
      } else {
        voice.aim[g] += (target[g] - voice.aim[g]) * gain_coeff_;
        voice.step[g] = (voice.aim[g] - voice.gain[g]) * (1.0f / static_cast<float>(kControlPeriod));
      }
    }
  }

  // Equal-power gains scaled so the middle is 1, for pan in [-1, 1].
  static void pan(float position, float* left, float* right) {
    const float turn = (kit::clamp(position, -1.0f, 1.0f) + 1.0f) * 0.125f;  // cycles: 0 .. 1/4
    *left = kit::SineTable::cos_lookup(turn) * 1.41421356f;
    *right = kit::SineTable::lookup(turn) * 1.41421356f;
  }

  // Every 32 samples: the walk, the body, and each sounding voice.
  void control() {
    using namespace overtone;
    const float dt = 1.0f / control_rate_;
    const bool sounding = pool_.count_active() > 0;

    // The walk stands still while nothing sounds, so a silence of any length
    // leaves it where it was.
    if (sounding) {
      vibrato_phase_ += kVibratoHz * dt;
      vibrato_phase_ -= std::floor(vibrato_phase_);
      walk_phase_ += param(kPace) * dt;
      if (walk_phase_ >= 1.0f) {
        walk_phase_ -= 1.0f;
        step_walk();
      }
    }
    aim();
    focus_ += (param(kFocus) - focus_) * gain_coeff_;
    band_ = kWideBand * std::pow(kSharpBand / kWideBand, focus_);

    // The body glides to the Voice that is chosen; what is read per sample
    // crosses this control period in a straight line.
    even_.arrive();
    thin_.arrive();
    formant_.arrive();
    if (colour_moving_) {
      const Colour& to = kColours[voice_choice()];
      bool there = true;
      there &= approach(&colour_.even, to.even);
      there &= approach(&colour_.tilt_ratio, to.tilt_ratio);
      there &= approach(&colour_.thin, to.thin);
      there &= approach(&colour_.formant_hz, to.formant_hz);
      there &= approach(&colour_.formant_q, to.formant_q);
      there &= approach(&colour_.formant_gain, to.formant_gain);
      there &= approach(&colour_.dark_hz, to.dark_hz);
      there &= approach(&colour_.level, to.level);
      colour_moving_ = !there;
      body_moved_ = true;
      even_.head_for(colour_.even);
      thin_.head_for(colour_.thin);
      formant_.head_for(formant_weight());
    }

    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.env.active()) continue;
      if (body_moved_) set_body(voice);
      tune(voice, v, false);
      voice.env.set(param(kAttack), 0.01f, 1.0f, param(kRelease));
    }
    body_moved_ = false;
  }

  // Move `value` towards `to`; true when it is there.
  bool approach(float* value, float to) const {
    const float distance = to - *value;
    if (std::fabs(distance) <= 1.0e-4f * (std::fabs(to) + 1.0f)) {
      *value = to;
      return true;
    }
    *value += distance * colour_coeff_;
    return false;
  }

  // Svf::band is 1/k at the centre: weigh it so the formant stands
  // `formant_gain` over the rest.
  float formant_weight() const { return colour_.formant_gain / colour_.formant_q; }

  // One step of the walk: mostly to a neighbouring rung, sometimes two,
  // now and then none. It turns back at the end of its reach.
  void step_walk() {
    const int far = reach();
    const float draw = walk_.uniform();
    if (far == 0) {
      walk_offset_ = 0;
      return;
    }
    int move = 0;
    if (draw >= 0.12f) move = draw < 0.47f ? 1 : (draw < 0.82f ? -1 : (draw < 0.91f ? 2 : -2));
    int next = walk_offset_ + move;
    const int home = home_rung();
    if (next > far || next < -far || home + next < 0 || home + next >= kRungs) next = walk_offset_ - move;
    walk_offset_ = kit::clamp_int(next, -far, far);
  }

  int reach() const {
    const float wander = param(overtone::kWander);
    if (wander <= 0.0f) return 0;
    return kit::clamp_int(static_cast<int>(std::ceil(wander * static_cast<float>(kMaxReach))), 1, kMaxReach);
  }

  // The rung of the ladder nearest the Overtone knob.
  int home_rung() const {
    const float knob = param(overtone::kOvertone);
    int best = 0;
    for (int r = 1; r < kRungs; ++r) {
      if (std::fabs(kLadder[r] - knob) < std::fabs(kLadder[best] - knob)) best = r;
    }
    return best;
  }

  // Where the whistle is asked to be: the knob itself with Wander at 0, a
  // rung of the ladder otherwise.
  void aim() {
    const int far = reach();
    if (far == 0) {
      target_harmonic_ = param(overtone::kOvertone);
      return;
    }
    const int offset = kit::clamp_int(walk_offset_, -far, far);
    target_harmonic_ = kLadder[kit::clamp_int(home_rung() + offset, 0, kRungs - 1)];
  }

  // Nothing sounds (init, or a note after a silence): what moved in the
  // silence has arrived, and what runs by itself starts from the beginning.
  void restart() {
    volume_.snap(volume_.target);
    colour_ = kColours[voice_choice()];
    colour_moving_ = false;
    body_moved_ = false;
    even_.snap(colour_.even);
    thin_.snap(colour_.thin);
    formant_.snap(formant_weight());
    walk_phase_ = 0.0f;
    walk_offset_ = 0;
    vibrato_phase_ = 0.0f;
    aim();
    focus_ = param(overtone::kFocus);
    band_ = kWideBand * std::pow(kSharpBand / kWideBand, focus_);
    clock_.reset(kControlPeriod);
  }

  void apply(int id) {
    using namespace overtone;
    switch (id) {
      case kVoice:
        colour_moving_ = true;
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(param(id)), primed());
        break;
      default:
        break;  // read on the control clock
    }
  }

  // A value that crosses one control period in a straight line.
  struct Line {
    float from = 0.0f, to = 0.0f, step = 0.0f;
    float at(float samples) const { return from + step * samples; }
    void snap(float value) {
      from = to = value;
      step = 0.0f;
    }
    // The period is over: the line has reached its end.
    void arrive() { snap(to); }
    void head_for(float value) {
      to = value;
      step = (to - from) * (1.0f / static_cast<float>(kControlPeriod));
    }
  };

  kit::VoicePool<Voice, kMaxVoices> pool_;
  Line even_, thin_, formant_;
  kit::Smoother volume_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  kit::Rng walk_, start_;
  Colour colour_ = kColours[0];
  float control_rate_ = 1500.0f;
  float noise_scale_ = 1.0f;
  float glide_coeff_ = 0.0f, colour_coeff_ = 0.0f, flutter_coeff_ = 0.0f, gain_coeff_ = 0.0f;
  float focus_ = 0.0f;  // the Focus knob, smoothed
  float band_ = 1.0f;   // the resonators' bandwidth as a share of the note
  float target_harmonic_ = 8.0f;
  float walk_phase_ = 0.0f;
  float vibrato_phase_ = 0.0f;
  int walk_offset_ = 0;
  int steal_samples_ = 192;
  bool colour_moving_ = false;
  bool body_moved_ = false;
};

}  // namespace livemix
