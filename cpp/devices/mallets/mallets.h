#pragma once

// Mallets: tuned bars over resonator tubes.
//
//   key down ──► stroke ──┬─► upper bar modes (the knock) ───────────────┐
//   key held ──► roll ────┘                                              │
//                         └─► fundamental ──┬─► the bar's own sound ─────┼─► pan ─► out
//                                           └─► tube ─► motor disc ──────┘   by pitch
//
// - A bar is up to five modes at the ratios its maker carved (marimba and
//   vibraphone 1 : 4 : 10, xylophone 1 : 3 : 6) or left alone (glockenspiel
//   and celesta, the free bar 1 : 2.757 : 5.404). Each mode is one complex
//   number turned and shrunk a little every sample, as in Bells
//   (modal_bells.h): its length is the amplitude, which the roll reads, and
//   its decay can change under a ringing note, which the motor needs.
// - The material sets the decay. The bar alone rings base × Decay ×
//   (reference / f)^e seconds: e = 1 for wood, so a marimba's ring halves
//   with every octave, and 0.5 for metal. Mode k dies faster than the
//   fundamental by 1 + d·(ratio - 1), with d large for wood: the knock is
//   gone in a tenth of a second and the hum is what is left.
// - The tube is one more complex one-pole per note, tuned to the fundamental
//   and fed by the fundamental mode alone (a closed tube resonates at 1, 3,
//   5 times its pitch, never at the bar's 4). It fills over Q / (π·f)
//   seconds, which is the bloom after the stroke, and what it radiates the
//   bar loses: while the tube is heard the fundamental decays faster by
//   1 + coupling · Resonator · open.
// - The motor is a disc in the mouth of every tube on one shaft: open =
//   0.5 + 0.5·cos(2π·rate·t), the same for all notes. It scales the tube's
//   output and the extra decay, never the bar: the fundamental throbs, the
//   overtones do not, and a shut tube rings longer.
// - The stroke is a raised-cosine push whose length is the mallet's contact
//   time (soft 2.5 ms, hard 0.25 ms at middle C, longer on low bars and for
//   soft strokes, never more than 0.9 of the note's period), with a little
//   noise on it. Its size is divided by its own spectrum at the fundamental,
//   so the mallet changes the knock and not the level of the note.
// - A stroke on a bar that still rings does not add blindly to what is
//   there. It waits (at most half a period of the note) for the bar to be at
//   the top or the bottom of its swing, pushes the way the bar is about to
//   go, and tops each mode up to what a fresh stroke would leave, adding at
//   least a touch until the mode holds half as much again. A real mallet
//   gets a steady level another way, by damping the bar as it lands; a bank
//   of modes struck at random moments would instead cancel as often as it
//   adds, and a long-ringing one would pile up.
// - Roll strikes a held key again and again: at the knob's rate at C3 and
//   12 % faster per octave above it, each stroke up to 12 % early or late,
//   up to 2 dB louder or softer, the hands taking turns at two places on the
//   bar, aiming 4.5 dB under the stroke that started the note.
//
// Instrument and Mallet are read when a bar is struck; the rest are live.
// The instrument sleeps when every bar has rung out below -120 dB.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Mallets : public kit::DeviceBase<mallets::kNumParams> {
 public:
  static constexpr int kMaxVoices = 16;
  static constexpr int kModes = 5;
  enum Instrument : int { kMarimba = 0, kVibraphone, kXylophone, kGlockenspiel, kCelesta, kNumInstruments };

  void init(float sample_rate) {
    using namespace mallets;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      voice = Voice();
      voice.rng.seed(0x3A11E75u + 7919u * static_cast<uint32_t>(v));
    }
    decay_serial_ = stage_serial_ = 1;
    chunk_left_ = 0;
    motor_phase_ = 0.0f;
    motor_increment_ = param(kMotorRate) / sr;
    steal_step_ = 1.0f / (kStealSeconds * sr);
    resonator_.set_time(kSmoothingSeconds, sr);
    resonator_.snap(param(kResonator));
    motor_.set_time(kSmoothingSeconds, sr);
    motor_.snap(param(kMotor));
    volume_.set_time(kSmoothingSeconds, sr);
    volume_.snap(kit::db_to_gain(param(kVolume)));
    idle_.reset(sr, 0.1f);
  }

  void set_param(int id, float value) {
    using namespace mallets;
    if (!store_param(id, value)) return;
    switch (id) {
      case kDecay:
      case kDamper:
        ++decay_serial_;
        break;
      case kResonator:
        resonator_.set(param(kResonator), primed());
        break;
      case kMotor:
        motor_.set(param(kMotor), primed());
        break;
      case kWidth:
        ++stage_serial_;
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(param(kVolume)), primed());
        break;
      default:
        break;  // instrument, mallet: the next stroke; motor rate, roll: read every control tick
    }
  }

  void note_on(int note_id, float frequency, float gain) {
    using namespace mallets;
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, kMinHz, kMaxHz);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    const int instrument = chosen_instrument();
    // The same key while its bar still rings: strike that bar again.
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.sounding || voice.pending || voice.fading || pool_.note_id_of(v) != note_id) continue;
      if (voice.instrument == instrument && voice.frequency == frequency) {
        voice.released = false;
        play(voice, gain);
        return;
      }
      voice.released = true;
    }
    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    if (stolen) {
      // Fade the old note over 2 ms, then start (see render_voice). It
      // counts as the new note from now, so the next key does not take it too.
      voice.follow = stroke_level(instrument, gain);
      voice.pending = true;
      voice.fading = false;
      voice.released = false;
      voice.pending_frequency = frequency;
      voice.pending_gain = gain;
    } else {
      start(voice, frequency, gain);
    }
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held < 0) return;
    Voice& voice = pool_.voices[held];
    if (voice.pending) {
      // Released before its stolen start: it never sounds.
      voice.pending = false;
      voice.fading = true;
    }
    voice.released = true;
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (idle_.asleep()) chunk_left_ = 0;  // the control clock restarts with the sound
    if (!idle_.wake(pool_.count_active() > 0)) {
      silence_output(frames);
      return;
    }
    clear_input(frames);
    int done = 0;
    while (done < frames) {
      if (chunk_left_ == 0) {
        control();
        chunk_left_ = kChunk;
      }
      const int n = kit::clamp_int(frames - done, 1, chunk_left_);
      // How much of each tube is heard, sample by sample: Resonator, less
      // what the motor's disc covers.
      float tube[kChunk];
      for (int i = 0; i < n; ++i) {
        motor_phase_ += motor_increment_;
        if (motor_phase_ >= 1.0f) motor_phase_ -= 1.0f;
        tube[i] = resonator_.next() * (1.0f - motor_.next() * (1.0f - opening(motor_phase_)));
      }
      float left[kChunk] = {}, right[kChunk] = {};
      for (int v = 0; v < kMaxVoices; ++v) {
        if (pool_.voices[v].sounding) render_voice(pool_.voices[v], n, tube, left, right);
      }
      for (int i = 0; i < n; ++i) {
        const float volume = volume_.next();
        out_left_[done + i] = kit::soft_clip(left[i] * volume);
        out_right_[done + i] = kit::soft_clip(right[i] * volume);
      }
      chunk_left_ -= n;
      done += n;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr int kChunk = 32;  // control period, samples
  static constexpr float kMinHz = 20.0f;
  static constexpr float kMaxHz = 8000.0f;
  static constexpr float kTopHz = 16000.0f;  // modes above this do not exist, at any sample rate,
  static constexpr float kTopOfBand = 0.45f;  // nor above this share of a low one
  static constexpr float kC3 = 130.8128f;
  static constexpr float kC4 = 261.6256f;
  static constexpr float kC6 = 1046.502f;
  static constexpr float kSixtyDb = 6.907755279f;
  static constexpr float kSilence = 1.0e-6f;
  static constexpr float kStealSeconds = 0.002f;
  // The decay law is held between two octaves below its reference and three above.
  static constexpr float kLongestLaw = 4.0f;
  static constexpr float kShortestLaw = 0.125f;
  static constexpr float kShortestRing = 0.005f;  // seconds
  // Mallet contact at middle C, seconds.
  static constexpr float kSoftContact = 0.0025f;
  static constexpr float kHardContact = 0.00025f;
  static constexpr float kLongestContact = 0.008f;
  static constexpr float kMostOfAPeriod = 0.9f;
  static constexpr float kPulseNoise = 0.3f;
  static constexpr float kStrikeLevel = 0.25f;
  // A stroke on a moving bar adds at least this share of a fresh stroke to each mode.
  static constexpr float kTouch = 0.1f;
  static constexpr float kFullBar = 1.5f;  // fresh strokes' worth in a mode at which another adds nothing
  // Damper 1 stops a released bar in this long; near 0 it may ring this many times longer.
  static constexpr float kChokeSeconds = 0.15f;
  static constexpr float kChokeSpan = 200.0f;
  // The roll: off below half a stroke a second, level under the first stroke,
  // rate rising with pitch, timing and level spread.
  static constexpr float kRollOff = 0.5f;
  static constexpr float kRollLevel = 0.6f;
  static constexpr float kRollPerOctave = 0.12f;
  static constexpr float kRollJitter = 0.12f;
  static constexpr float kRollSpreadDb = 2.0f;
  static constexpr float kRollVelocity = 0.6f;  // a roll stroke's contact is that of a softer stroke
  // The stage: F#4 in the middle, two and a half octaves to either edge.
  static constexpr float kStageCentre = 66.0f;
  static constexpr float kStageSpan = 30.0f;
  static constexpr float kStageEdge = 0.75f;
  // Where the two hands land, from the end of the bar (0) to its middle (1).
  static constexpr float kHandPosition[2] = {0.84f, 0.78f};

  // What sets one instrument apart from the next.
  struct Bars {
    int count;
    float ratio[kModes];
    float level[kModes];  // how strongly a hard stroke lights each mode, before its shape at the strike point
    float reference_hz;   // where `seconds` holds
    float seconds;        // the bar alone: the fundamental's ring to -60 dB at the reference, Decay 1
    float exponent;       // ring time goes as (reference / f)^exponent
    float damping;        // extra decay rate per unit of ratio above the fundamental
    float tube;           // the tube's level against the bar's own fundamental at Resonator 1
    float coupling;       // how much the open tube shortens the fundamental: 1 halves its ring
    float tube_q;
    float contact;        // mallet contact time against the marimba's
    float gain;           // evens out how loud a stroke is across instruments
  };

  int chosen_instrument() const {
    return kit::clamp_int(static_cast<int>(param(mallets::kInstrument) + 0.5f), 0, kNumInstruments - 1);
  }

  static const Bars& bars(int instrument) {
    static const Bars kBars[kNumInstruments] = {
        // Marimba: rosewood, cut to 1 : 4 : 9.9, a long strong tube.
        {5, {1.0f, 4.0f, 9.9f, 18.2f, 28.4f}, {1.0f, 1.4f, 1.2f, 0.9f, 0.6f}, kC4, 2.0f, 1.0f, 3.0f, 2.5f, 1.0f, 16.0f, 1.0f, 1.0f},
        // Vibraphone: aluminium, the same cut, a strong tube with the motor's disc in it.
        {5, {1.0f, 4.0f, 10.0f, 18.2f, 28.4f}, {1.0f, 1.0f, 0.7f, 0.45f, 0.3f}, kC4, 10.0f, 0.5f, 0.4f, 2.0f, 0.8f, 16.0f, 1.0f, 1.0f},
        // Xylophone: hard rosewood cut to a twelfth, 1 : 3 : 6, a weaker tube, a dry short ring.
        {4, {1.0f, 3.0f, 6.0f, 10.0f, 0.0f}, {1.0f, 1.6f, 1.4f, 1.0f, 0.0f}, kC4, 1.0f, 1.0f, 2.5f, 1.0f, 0.4f, 12.0f, 0.8f, 1.3f},
        // Glockenspiel: small steel bars left uncut; the tube is what resonator bells have.
        {5, {1.0f, 2.757f, 5.404f, 8.933f, 13.345f}, {1.0f, 1.0f, 0.8f, 0.6f, 0.4f}, kC6, 4.0f, 0.5f, 0.15f, 0.8f, 0.3f, 12.0f, 0.7f, 1.25f},
        // Celesta: steel plates under felt hammers over a short wooden box.
        {5, {1.0f, 2.757f, 5.404f, 8.933f, 13.345f}, {1.0f, 0.5f, 0.25f, 0.12f, 0.06f}, kC6, 2.5f, 0.5f, 0.3f, 1.5f, 0.6f, 6.0f, 1.6f, 1.3f},
    };
    return kBars[kit::clamp_int(instrument, 0, kNumInstruments - 1)];
  }

  // The displacement of mode `k` (0 is the fundamental) where a hand lands:
  // the bending shapes of a free bar without their end corrections, as Bells
  // has them. Symmetric about the middle for the odd-numbered modes.
  static float shape(int k, float position) {
    const float angle = (static_cast<float>(k) + 1.5f) * kit::kPi * (0.5f * position - 0.5f);
    return (k & 1) ? std::sin(angle) : std::cos(angle);
  }

  // How much of a raised-cosine push `periods` long (in periods of a mode)
  // ends up in that mode: 1 for a tap, 0.5 at one period, nulls at 2, 3, ...
  static float response(float periods) {
    if (periods < 1.0e-3f) return 1.0f;
    const float spare = 1.0f - periods * periods;
    if (std::fabs(spare) < 1.0e-3f) return 0.5f;
    return std::fabs(std::sin(kit::kPi * periods) / (kit::kPi * periods * spare));
  }

  // The motor's disc: 1 with the tube open, 0 with it shut; `phase` in turns of the pulse.
  static float opening(float phase) { return 0.5f + 0.5f * kit::SineTable::cos_lookup(phase); }

  struct Voice {
    // Per bar mode: its angle per sample, the unit turn, the turn with this
    // tick's radius, the state, the mode's own decay, and what the stroke in
    // flight puts in.
    float omega[kModes] = {};
    float turn_re[kModes] = {}, turn_im[kModes] = {};
    float step_re[kModes] = {}, step_im[kModes] = {};
    float re[kModes] = {}, im[kModes] = {};
    float radius[kModes] = {};
    float strike[kModes] = {};
    // The fundamental's decay rate per sample for the bar alone; radius[0] has the tube's load in it.
    float rate = 0.0f;
    // The tube: fed by the fundamental, heard through `tube_level`.
    float tube_re = 0.0f, tube_im = 0.0f;
    float tube_step_re = 0.0f, tube_step_im = 0.0f, tube_feed = 0.0f;
    float tube_level = 0.0f, coupling = 0.0f;
    int count = 0;
    int instrument = 0;
    float frequency = 440.0f;
    // The stroke in flight: samples to wait, samples long, samples done.
    int pulse_wait = 0, pulse_length = 0, pulse_done = 0;
    float pulse_gain = 0.0f;
    // The roll: what the first stroke left in the fundamental, how hard the
    // key was played, samples until the next stroke is due, whose turn it is.
    float struck_level = 0.0f, velocity = 0.0f, roll_due = 0.0f;
    int hand = 0;
    bool rolling = false;
    float left = 0.0f, right = 0.0f, left_step = 0.0f, right_step = 0.0f, left_to = 0.0f, right_to = 0.0f;
    bool ramping = false;
    float follow = 0.0f;
    float steal = 1.0f;
    float pending_frequency = 440.0f, pending_gain = 0.0f;
    uint32_t decayed = 0, staged = 0;  // the serials decay and stage were last set from
    bool decayed_released = false;
    bool sounding = false, released = false, pending = false, fading = false;
    kit::Rng rng;

    bool active() const { return sounding; }
    bool releasing() const { return released; }
    float level() const { return follow; }
    bool struck() const { return pulse_done < pulse_length; }
  };

  void start(Voice& voice, float frequency, float gain) {
    using namespace mallets;
    const float sr = sample_rate();
    voice.instrument = chosen_instrument();
    const Bars& bar = bars(voice.instrument);
    voice.frequency = frequency;
    voice.count = 0;
    for (int k = 0; k < kModes; ++k) {
      voice.re[k] = voice.im[k] = 0.0f;
      voice.strike[k] = 0.0f;
      const float hz = frequency * bar.ratio[k];
      if (k >= bar.count || hz >= kit::min(kTopHz, kTopOfBand * sr)) {
        // Out of band: the mode does not exist.
        voice.omega[k] = voice.turn_re[k] = voice.turn_im[k] = voice.radius[k] = 0.0f;
        voice.step_re[k] = voice.step_im[k] = 0.0f;
        continue;
      }
      voice.omega[k] = kit::kTwoPi * hz / sr;
      voice.turn_re[k] = std::cos(voice.omega[k]);
      voice.turn_im[k] = std::sin(voice.omega[k]);
      voice.count = k + 1;
    }
    // The tube: tuned to the fundamental, ringing Q / (π·f) seconds on its own.
    const float tube_radius = std::exp(-voice.omega[0] / (2.0f * bar.tube_q));
    voice.tube_re = voice.tube_im = 0.0f;
    voice.tube_step_re = tube_radius * voice.turn_re[0];
    voice.tube_step_im = tube_radius * voice.turn_im[0];
    voice.tube_feed = 1.0f - tube_radius;
    voice.tube_level = bar.tube;
    voice.coupling = bar.coupling;
    voice.pulse_wait = voice.pulse_length = voice.pulse_done = 0;
    voice.sounding = true;
    voice.released = voice.pending = voice.fading = false;
    voice.steal = 1.0f;
    voice.follow = 0.0f;
    ring(voice);
    load(voice, tube_open());
    stage(voice, true);
    play(voice, gain);
  }

  // What a key press at `gain` leaves in the fundamental of a bar at rest.
  static float stroke_level(int instrument, float gain) {
    return kStrikeLevel * bars(instrument).gain * gain * (0.3f + 0.7f * gain);
  }

  // A key press: the first stroke of a note, or one more on a bar that rings.
  void play(Voice& voice, float gain) {
    using namespace mallets;
    voice.velocity = gain;
    voice.struck_level = stroke_level(voice.instrument, gain);
    voice.follow = kit::max(voice.follow, voice.struck_level);  // as loud as it will be, before it has sounded
    voice.hand = 0;
    stroke(voice, voice.struck_level, gain, 0);
    voice.rolling = false;  // the roll takes its time from this stroke (see control)
  }

  // One stroke, `due` samples from now: `level` is what a fresh stroke of this
  // strength leaves in the fundamental, `velocity` shortens the contact.
  void stroke(Voice& voice, float level, float velocity, int due) {
    using namespace mallets;
    const Bars& bar = bars(voice.instrument);
    const float sr = sample_rate();
    const float period = sr / voice.frequency;
    const float contact = kSoftContact * std::pow(kHardContact / kSoftContact, param(kMallet)) * bar.contact *
                          std::sqrt(kC4 / voice.frequency) * (1.4f - 0.6f * velocity);
    int length = static_cast<int>(kit::min(contact * sr, kit::min(kLongestContact * sr, kMostOfAPeriod * period)) + 0.5f);
    if (length < 2) length = 2;
    // The middle of the push lands this many turns of a mode after now.
    const float middle = 0.5f * static_cast<float>(length - 1) + 1.0f;
    // When, and which way: with the fundamental at the top of its swing and
    // the push upward, or at the bottom and downward, whichever comes first,
    // if the bar is moving at all. At most half a period away.
    const float moving = std::sqrt(voice.re[0] * voice.re[0] + voice.im[0] * voice.im[0]);
    float wait = static_cast<float>(due);
    float way = 1.0f;
    if (moving > kTouch * kTouch * level) {
      const float turns = (std::atan2(voice.im[0], voice.re[0]) + voice.omega[0] * (wait + middle)) * (1.0f / kit::kTwoPi);
      const float past_the_top = turns - std::floor(turns);  // in periods; the bottom is at a half
      float to_go = past_the_top > 0.0f ? 1.0f - past_the_top : 0.0f;
      if (past_the_top > 0.0f && past_the_top <= 0.5f) {
        to_go = 0.5f - past_the_top;
        way = -1.0f;
      }
      wait += std::floor(to_go * period + 0.5f);
    }
    // How much: each mode up to what a fresh stroke would leave in it, and
    // at least a touch more than it has, so every stroke is heard. The touch
    // shrinks to nothing as the mode passes one and a half fresh strokes:
    // without that a fast roll on a bar that rings for a minute would pile up.
    const float position = kHandPosition[voice.hand & 1];
    const float base = bar.level[0] * shape(0, position) * response(static_cast<float>(length) / period);
    const double landing = static_cast<double>(wait + middle);
    for (int k = 0; k < voice.count; ++k) {
      const float fresh = way * level * bar.level[k] * shape(k, position) / base;  // before the mallet's own spectrum
      const float heard = fresh * response(bar.ratio[k] * static_cast<float>(length) / period);
      const float size = std::fabs(heard);
      float share = 1.0f;
      if (size > 1.0e-9f) {
        // The mode as the push will find it, along the way the push goes.
        const double angle = static_cast<double>(voice.omega[k]) * landing;
        const float there = static_cast<float>(voice.re[k] * std::cos(angle) - voice.im[k] * std::sin(angle)) *
                            std::pow(voice.radius[k], static_cast<float>(landing));
        const float has = (heard < 0.0f ? -there : there) / size;  // 1 is a fresh stroke's worth
        const float touch = kTouch * kit::clamp((kFullBar - has) / (kFullBar - 1.0f), 0.0f, 1.0f);
        share = kit::clamp(1.0f - has, touch, 1.0f);
      }
      voice.strike[k] = share * fresh;
    }
    voice.pulse_wait = static_cast<int>(wait);
    voice.pulse_length = length;
    voice.pulse_done = 0;
    voice.pulse_gain = 2.0f / static_cast<float>(length);  // unit area whatever the length
    voice.hand ^= 1;
    if (voice.follow < kSilence) voice.follow = kSilence;  // not free before it sounds
  }

  // The decay of every mode from the knobs as they stand.
  void ring(Voice& voice) {
    using namespace mallets;
    const Bars& bar = bars(voice.instrument);
    const float sr = sample_rate();
    const float law = kit::clamp(std::pow(bar.reference_hz / voice.frequency, bar.exponent), kShortestLaw, kLongestLaw);
    const float alone = bar.seconds * param(kDecay) * law;
    // A released key damps every mode to the damper's time at most; 0 leaves it ringing.
    const float damper = param(kDamper);
    const float limit = voice.released && damper > 0.001f ? kChokeSeconds * std::pow(kChokeSpan, 1.0f - damper) : 0.0f;
    for (int k = 0; k < voice.count; ++k) {
      float seconds = alone / (1.0f + bar.damping * (bar.ratio[k] - 1.0f));
      if (limit > 0.0f) seconds = kit::min(seconds, limit);
      seconds = kit::max(seconds, kShortestRing);
      const float rate = kSixtyDb / (seconds * sr);
      if (k == 0) {
        voice.rate = rate;  // its radius waits for the tube's load (see load)
        continue;
      }
      voice.radius[k] = std::exp(-rate);
      voice.step_re[k] = voice.radius[k] * voice.turn_re[k];
      voice.step_im[k] = voice.radius[k] * voice.turn_im[k];
    }
    voice.decayed = decay_serial_;
    voice.decayed_released = voice.released;
  }

  // How open the tubes are at this control tick: 1 unless the motor's disc is in the way.
  float tube_open() const { return 1.0f - param(mallets::kMotor) * (1.0f - opening(motor_phase_)); }

  // The fundamental loses to the tube what the tube radiates.
  void load(Voice& voice, float open) {
    voice.radius[0] = std::exp(-voice.rate * (1.0f + voice.coupling * param(mallets::kResonator) * open));
    voice.step_re[0] = voice.radius[0] * voice.turn_re[0];
    voice.step_im[0] = voice.radius[0] * voice.turn_im[0];
  }

  // Where the bar stands: low notes to the left, high to the right.
  void stage(Voice& voice, bool snap) {
    const float place = kit::clamp((kit::hz_to_midi(voice.frequency) - kStageCentre) / kStageSpan, -1.0f, 1.0f);
    kit::pan_gains(place * kStageEdge * param(mallets::kWidth), &voice.left_to, &voice.right_to);
    if (snap) {
      arrive(voice);
    } else {
      voice.left_step = (voice.left_to - voice.left) * (1.0f / kChunk);
      voice.right_step = (voice.right_to - voice.right) * (1.0f / kChunk);
      voice.ramping = true;
    }
    voice.staged = stage_serial_;
  }

  // The end of a move across the stage: exactly on its place, and still.
  static void arrive(Voice& voice) {
    voice.left = voice.left_to;
    voice.right = voice.right_to;
    voice.left_step = voice.right_step = 0.0f;
    voice.ramping = false;
  }

  // Samples between two strokes of a roll on this bar.
  float roll_interval(const Voice& voice, float strokes_per_second) const {
    const float pitch = kit::clamp(1.0f + kRollPerOctave * std::log2(voice.frequency / kC3), 0.8f, 1.5f);
    return sample_rate() / (strokes_per_second * pitch);
  }

  // Every kChunk samples: follow the knobs, load the fundamentals, roll the
  // held keys, retire the bars that have rung out.
  void control() {
    using namespace mallets;
    motor_increment_ = param(kMotorRate) / sample_rate();
    const float open = tube_open();
    const float roll = param(kRoll);
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.sounding || voice.pending || voice.fading) continue;
      if (voice.decayed != decay_serial_ || voice.decayed_released != voice.released) ring(voice);
      load(voice, open);
      if (voice.ramping) arrive(voice);
      if (voice.staged != stage_serial_) stage(voice, false);

      const bool rolling = roll >= kRollOff && !voice.released;
      if (rolling) {
        const float interval = roll_interval(voice, roll);
        if (!voice.rolling) voice.roll_due = interval * (1.0f + kRollJitter * voice.rng.bipolar());
        if (voice.roll_due < static_cast<float>(kChunk)) {
          const float level = kRollLevel * voice.struck_level * kit::db_to_gain(kRollSpreadDb * voice.rng.bipolar());
          stroke(voice, level, kRollVelocity * voice.velocity, static_cast<int>(kit::max(voice.roll_due, 0.0f)));
          voice.roll_due += interval * (1.0f + kRollJitter * voice.rng.bipolar());
        }
        voice.roll_due -= static_cast<float>(kChunk);
      }
      voice.rolling = rolling;

      float energy = voice.tube_re * voice.tube_re + voice.tube_im * voice.tube_im;
      if (energy < 1.0e-24f) voice.tube_re = voice.tube_im = 0.0f;
      for (int k = 0; k < voice.count; ++k) {
        const float power = voice.re[k] * voice.re[k] + voice.im[k] * voice.im[k];
        if (power < 1.0e-24f) voice.re[k] = voice.im[k] = 0.0f;
        energy += power;
      }
      // A stroke still in flight counts for what it will leave (see play).
      const float ringing = std::sqrt(energy);
      voice.follow = voice.struck() ? kit::max(voice.follow, ringing) : ringing;
      if (!rolling && !voice.struck() && voice.follow < kSilence) retire(voice);
    }
  }

  void retire(Voice& voice) {
    voice.sounding = voice.pending = voice.fading = voice.rolling = false;
    voice.follow = 0.0f;
    voice.tube_re = voice.tube_im = 0.0f;
    voice.pulse_wait = voice.pulse_length = voice.pulse_done = 0;
    for (int k = 0; k < kModes; ++k) voice.re[k] = voice.im[k] = 0.0f;
  }

  void render_voice(Voice& voice, int n, const float* tube, float* left, float* right) {
    const bool leaving = voice.pending || voice.fading;
    float pulse[kChunk];
    const bool struck = !leaving && voice.struck();
    if (struck) {
      for (int i = 0; i < n; ++i) {
        pulse[i] = 0.0f;
        if (voice.pulse_wait > 0) {
          --voice.pulse_wait;
        } else if (voice.pulse_done < voice.pulse_length) {
          const float phase = (static_cast<float>(voice.pulse_done) + 0.5f) / static_cast<float>(voice.pulse_length);
          const float window = 0.5f - 0.5f * kit::SineTable::cos_lookup(phase);
          pulse[i] = voice.pulse_gain * window * (1.0f + kPulseNoise * voice.rng.bipolar());
          ++voice.pulse_done;
        }
      }
    }
    float mono[kChunk] = {};
    // The push goes in on the real side and the sound is the imaginary
    // side, so a mode answers a pulse from zero, as a displacement does.
    for (int k = 1; k < voice.count; ++k) {
      float re = voice.re[k], im = voice.im[k];
      const float in = struck ? voice.strike[k] : 0.0f;
      if (re == 0.0f && im == 0.0f && in == 0.0f) continue;
      const float step_re = voice.step_re[k], step_im = voice.step_im[k];
      if (struck) {
        for (int i = 0; i < n; ++i) {
          const float turned = step_re * re - step_im * im + in * pulse[i];
          im = step_re * im + step_im * re;
          re = turned;
          mono[i] += im;
        }
      } else {
        for (int i = 0; i < n; ++i) {
          const float turned = step_re * re - step_im * im;
          im = step_re * im + step_im * re;
          re = turned;
          mono[i] += im;
        }
      }
      voice.re[k] = re;
      voice.im[k] = im;
    }
    // The fundamental, and the tube it fills.
    {
      float re = voice.re[0], im = voice.im[0];
      float tube_re = voice.tube_re, tube_im = voice.tube_im;
      const float in = struck ? voice.strike[0] : 0.0f;
      if (re != 0.0f || im != 0.0f || in != 0.0f || tube_re != 0.0f || tube_im != 0.0f) {
        const float step_re = voice.step_re[0], step_im = voice.step_im[0];
        const float tube_step_re = voice.tube_step_re, tube_step_im = voice.tube_step_im;
        const float feed = voice.tube_feed, level = voice.tube_level;
        for (int i = 0; i < n; ++i) {
          const float turned = step_re * re - step_im * im + (struck ? in * pulse[i] : 0.0f);
          im = step_re * im + step_im * re;
          re = turned;
          const float filled = tube_step_re * tube_re - tube_step_im * tube_im + feed * re;
          tube_im = tube_step_re * tube_im + tube_step_im * tube_re + feed * im;
          tube_re = filled;
          mono[i] += im + level * tube[i] * tube_im;
        }
        voice.re[0] = re;
        voice.im[0] = im;
        voice.tube_re = tube_re;
        voice.tube_im = tube_im;
      }
    }
    float gain_left = voice.left, gain_right = voice.right;
    if (!leaving) {
      for (int i = 0; i < n; ++i) {
        left[i] += mono[i] * gain_left;
        right[i] += mono[i] * gain_right;
        gain_left += voice.left_step;
        gain_right += voice.right_step;
      }
      voice.left = gain_left;
      voice.right = gain_right;
      return;
    }
    // A stolen or cancelled voice: out over 2 ms, then the new note or nothing.
    for (int i = 0; i < n; ++i) {
      voice.steal = kit::max(voice.steal - steal_step_, 0.0f);
      left[i] += mono[i] * gain_left * voice.steal;
      right[i] += mono[i] * gain_right * voice.steal;
    }
    if (voice.steal <= 0.0f) {
      if (voice.pending) {
        start(voice, voice.pending_frequency, voice.pending_gain);
      } else {
        retire(voice);
      }
    }
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::Smoother resonator_, motor_, volume_;
  kit::IdleGate idle_;
  uint32_t decay_serial_ = 1, stage_serial_ = 1;
  int chunk_left_ = 0;
  float motor_phase_ = 0.0f, motor_increment_ = 0.0f;
  float steal_step_ = 0.0f;
};

}  // namespace livemix
