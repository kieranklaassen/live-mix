#pragma once

// Twin Bars: every key strikes two bars a few hertz apart.
//
//   key down ──► stroke ───────────────► first bar  (f·r - Beat/2 on every mode) ──┐
//            └─► stroke, Scatter later ► second bar (f·r + Beat/2 on every mode) ──┤
//                                                                                  ▼
//                     room for a full pool ─► the Ears law ─► Volume ─► soft clip ─► out
//
// - A bar is up to four modes at the ratios `r` of its material (Bar). Each
//   mode is one complex number turned and shrunk a little every sample, as in
//   Mallets (mallets.h): the sound is its imaginary side, its length is its
//   amplitude, and its pitch and decay can change under a ringing note.
// - The second bar's every mode is the first's plus Beat hertz and the two
//   fundamentals lie Beat/2 either side of the key, so the pair's mean is the
//   key and it beats at Beat on every key and every overtone. The turn of
//   each mode is worked out in double from f·r ± Beat/2; Beat is smoothed on
//   the control clock and ringing bars follow it.
// - The second bar is the higher one, and the left ear is the higher one on
//   every device of the family: kit::to_ears (cpp/kit/beat.h) splits the two
//   bars between the ears. At Ears 0 both sides are the same to the sample.
// - Decay is the time the fundamental of a held key takes to fall 60 dB, on
//   any key and any material. Mode k dies faster by 1 + d·(r - 1), with d
//   large for wood. A key let go rings Decay^(1 - Damp) · 0.07^Damp seconds.
// - The stroke is a raised-cosine push whose length is the mallet's contact
//   time, divided by its own spectrum at the bar's fundamental: the mallet
//   changes the knock and not the level of the note. Tone tilts the modes
//   against the fundamental as they are heard.
// - A stroke on a bar that still rings does not add blindly. It waits (at
//   most half a swing of that bar) for the bar to be at the top or the bottom
//   of its swing, pushes the way the bar is going, and tops each mode up to
//   what a fresh stroke would leave. A key struck again strikes the same two
//   bars, each where it is in its own swing, so the beat carries on.
// - Room for a full pool: the power of the two low tones of every key that
//   rings is counted against a full stroke's, so one key at full strength
//   counts one, and past one key's worth (kRoom) the sum of the bars is
//   turned down by the root of the count: n keys at full strength add up as
//   the root of n and one key is never turned down. Overtones are not
//   counted, so Mallet and Tone mean the same on one key as in a chord.
//   Sixteen keys at full strength struck on one sample, at the default
//   Mallet and Tone, stay under the soft clip's knee, where the clip would
//   make tones of its own in each ear; with the hardest mallet and the
//   brightest Tone they reach it (0.75 of full scale for metal, 0.94 for wood).
//
// Bar, Mallet and Scatter are read when a key is struck; the rest are live.
// The first key after every bar has rung out restarts the control clock and
// lands every smoothed control, so what it plays does not depend on when, or
// whether, the device fell asleep. The instrument sleeps when every bar has
// rung out below -120 dB.

#include "../../kit/kit.h"
#include "../../kit/beat.h"
#include "params.gen.h"

namespace livemix {

class TwinBars : public kit::DeviceBase<twin_bars::kNumParams> {
 public:
  static constexpr int kMaxVoices = 16;
  static constexpr int kModes = 4;
  enum Material : int { kMetal = 0, kWood, kGlass, kNumMaterials };
  // The two bars of a key. The second is the higher and goes to the left ear.
  enum Which : int { kFirst = 0, kSecond = 1 };

  void init(float sample_rate) {
    using namespace twin_bars;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) pool_.voices[v] = Voice();
    decay_serial_ = 1;
    chunk_left_ = 0;
    steal_step_ = 1.0f / (kStealSeconds * sr);
    const float control_rate = sr / static_cast<float>(kChunk);
    beat_.set_time(kSmoothingSeconds, control_rate);
    beat_.snap(param(kBeat));
    tone_.set_time(kSmoothingSeconds, control_rate);
    tone_.snap(param(kTone));
    ears_.set_time(kSmoothingSeconds, sr);
    ears_.snap(param(kEars));
    volume_.set_time(kSmoothingSeconds, sr);
    volume_.snap(kit::db_to_gain(param(kVolume)));
    idle_.reset(sr, 0.1f);
  }

  void set_param(int id, float value) {
    using namespace twin_bars;
    if (!store_param(id, value)) return;
    switch (id) {
      case kBeat:
        beat_.set(param(kBeat), primed());
        break;
      case kEars:
        ears_.set(param(kEars), primed());
        break;
      case kDecay:
      case kDamp:
        ++decay_serial_;
        break;
      case kTone:
        tone_.set(param(kTone), primed());
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(param(kVolume)), primed());
        break;
      default:
        break;  // bar, mallet, scatter: the next stroke
    }
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, kMinHz, kMaxHz);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    if (pool_.count_active() == 0) restart();
    const int material = chosen_material();
    // The same key while a voice it took still fades the old note out: the
    // waiting note is this one. (Taking a second voice would leave one that
    // no key up could end.)
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.sounding || !voice.pending || pool_.note_id_of(v) != note_id) continue;
      voice.pending_frequency = frequency;
      voice.pending_gain = gain;
      voice.follow = stroke_level(material, gain);
      return;
    }
    // The same key while its bars still ring: strike those bars again.
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.sounding || voice.pending || voice.fading || pool_.note_id_of(v) != note_id) continue;
      if (voice.material == material && voice.frequency == frequency) {
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
      voice.follow = stroke_level(material, gain);
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
      // The two bars of every key, summed apart: `second` is the higher.
      float first[kChunk] = {}, second[kChunk] = {}, power[kChunk] = {};
      for (int v = 0; v < kMaxVoices; ++v) {
        if (pool_.voices[v].sounding) render_voice(pool_.voices[v], n, first, second, power);
      }
      for (int i = 0; i < n; ++i) {
        // Room for a full pool: down by the root of the keys' worth that rings, past kRoom.
        const float room = power[i] > kRoom ? std::sqrt(kRoom / power[i]) : 1.0f;
        float left, right;
        kit::to_ears(kit::ear_gains(ears_.next()), second[i] * room, first[i] * room, &left, &right);
        const float volume = volume_.next();
        out_left_[done + i] = kit::soft_clip(left * volume);
        out_right_[done + i] = kit::soft_clip(right * volume);
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
  static constexpr float kTopHz = 16000.0f;   // modes above this do not exist, at any sample rate,
  static constexpr float kTopOfBand = 0.45f;  // nor above this share of a low one
  static constexpr float kMostBeat = 20.0f;   // the top of Beat: a mode exists or not whatever Beat says
  static constexpr float kC4 = 261.6256f;
  static constexpr float kSixtyDb = 6.907755279f;
  static constexpr float kSilence = 1.0e-6f;
  static constexpr float kStealSeconds = 0.002f;
  static constexpr float kShortestRing = 0.005f;  // seconds
  // Mallet contact at middle C, seconds.
  static constexpr float kSoftContact = 0.0025f;
  static constexpr float kHardContact = 0.00025f;
  static constexpr float kLongestContact = 0.008f;
  static constexpr float kMostOfAPeriod = 0.9f;
  // What a key at full strength leaves in each bar's fundamental, before Volume.
  static constexpr float kStrikeLevel = 0.25f;
  // How many keys at full strength may ring before the sum is turned down.
  // A key counts for the power in its two fundamentals against what a stroke
  // at full strength leaves there, so sixteen at full strength add up to four.
  static constexpr float kRoom = 1.0f;
  // A stroke on a moving bar adds at least this share of a fresh stroke to each mode.
  static constexpr float kTouch = 0.1f;
  static constexpr float kFullBar = 1.5f;  // fresh strokes' worth in a mode at which another adds nothing
  // Damp 1 stops a released bar in this long.
  static constexpr float kChokeSeconds = 0.07f;
  // Tone: the tilt in powers of a mode's ratio at the dark end and at the bright end.
  static constexpr float kDarkTilt = -1.5f;
  static constexpr float kBrightTilt = 0.5f;

  // What sets one material apart from the next.
  struct Bars {
    int count;
    float ratio[kModes];
    float level[kModes];  // how strongly a hard stroke lights each mode against the fundamental
    float damping;        // extra decay rate per unit of ratio above the fundamental
    float contact;        // mallet contact time against the metal bar's
    float gain;           // evens out how loud a stroke is across materials
  };

  static const Bars& bars(int material) {
    static const Bars kBars[kNumMaterials] = {
        // Metal: a bar left uncut, 1 : 2.757 : 5.404 : 8.933, whose overtones sing nearly as long as its fundamental.
        {4, {1.0f, 2.757f, 5.404f, 8.933f}, {1.0f, 0.7f, 0.45f, 0.28f}, 0.25f, 1.0f, 1.0f},
        // Wood: a bar cut so its second mode is two octaves up, 1 : 4 : 9.9; a knock, then the hum.
        {3, {1.0f, 4.0f, 9.9f, 0.0f}, {1.0f, 1.2f, 0.9f, 0.0f}, 3.0f, 1.0f, 1.0f},
        // Glass: a thin shell, 1 : 2.32 : 4.25 : 6.63, nearly all fundamental.
        {4, {1.0f, 2.32f, 4.25f, 6.63f}, {1.0f, 0.22f, 0.09f, 0.04f}, 0.6f, 1.3f, 1.4f},
    };
    return kBars[kit::clamp_int(material, 0, kNumMaterials - 1)];
  }

  int chosen_material() const {
    return kit::clamp_int(static_cast<int>(param(twin_bars::kBar) + 0.5f), 0, kNumMaterials - 1);
  }

  // How much of a raised-cosine push `periods` long (in periods of a mode)
  // ends up in that mode: 1 for a tap, 0.5 at one period, nulls at 2, 3, ...
  static float response(float periods) {
    if (periods < 1.0e-3f) return 1.0f;
    const float spare = 1.0f - periods * periods;
    if (std::fabs(spare) < 1.0e-3f) return 0.5f;
    return std::fabs(std::sin(kit::kPi * periods) / (kit::kPi * periods * spare));
  }

  // One bar: per mode its angle per sample, the unit turn, the turn with this
  // tick's radius, the state, and what the stroke in flight puts in.
  struct Bar {
    float omega[kModes] = {};
    float turn_re[kModes] = {}, turn_im[kModes] = {};
    float step_re[kModes] = {}, step_im[kModes] = {};
    float re[kModes] = {}, im[kModes] = {};
    float strike[kModes] = {};
    // The stroke in flight: samples to wait, samples long, samples done.
    int pulse_wait = 0, pulse_length = 0, pulse_done = 0;
    float pulse_gain = 0.0f;

    bool struck() const { return pulse_done < pulse_length; }
  };

  struct Voice {
    Bar bar[2];
    float radius[kModes] = {};  // each mode's shrink a sample, the same for both bars
    // Tone: how loud each mode is heard, on its way to `gain_to` over one control period.
    float gain[kModes] = {}, gain_step[kModes] = {}, gain_to[kModes] = {};
    int count = 0;
    int material = 0;
    float frequency = 440.0f;
    float weight = 0.0f;  // half a key's worth of room for each unit of power in a fundamental
    float follow = 0.0f;
    float steal = 1.0f;
    float pending_frequency = 440.0f, pending_gain = 0.0f;
    float tuned = -1.0f, toned = -1.0f;  // the Beat and the Tone the voice was last set from
    uint32_t decayed = 0;                // the serial its decay was last set from
    bool decayed_released = false;
    bool sounding = false, released = false, pending = false, fading = false;

    bool active() const { return sounding; }
    bool releasing() const { return released; }
    float level() const { return follow; }
    bool struck() const { return bar[kFirst].struck() || bar[kSecond].struck(); }
  };

  void start(Voice& voice, float frequency, float gain) {
    const float sr = sample_rate();
    voice.material = chosen_material();
    const Bars& made = bars(voice.material);
    voice.frequency = frequency;
    voice.count = 0;
    for (int k = 0; k < kModes; ++k) {
      // Out of band at the top of Beat: the mode does not exist, on either bar.
      const float top = frequency * made.ratio[k] + 0.5f * kMostBeat;
      if (k < made.count && top < kit::min(kTopHz, kTopOfBand * sr)) voice.count = k + 1;
    }
    for (int b = 0; b < 2; ++b) voice.bar[b] = Bar();
    voice.weight = 0.5f / (kStrikeLevel * made.gain * kStrikeLevel * made.gain);
    voice.sounding = true;
    voice.released = voice.pending = voice.fading = false;
    voice.steal = 1.0f;
    voice.follow = 0.0f;
    tune(voice);
    ring(voice);
    colour(voice, true);
    play(voice, gain);
  }

  // What a key press at `gain` leaves in the fundamental of a bar at rest.
  static float stroke_level(int material, float gain) {
    return kStrikeLevel * bars(material).gain * gain * (0.3f + 0.7f * gain);
  }

  // A key press: both bars are struck, the second one Scatter later.
  void play(Voice& voice, float gain) {
    const float level = stroke_level(voice.material, gain);
    voice.follow = kit::max(voice.follow, level);  // as loud as it will be, before it has sounded
    const int late = static_cast<int>(param(twin_bars::kScatter) * 0.001f * sample_rate() + 0.5f);
    stroke(voice, kFirst, level, gain, 0);
    stroke(voice, kSecond, level, gain, late);
    if (voice.follow < kSilence) voice.follow = kSilence;  // not free before it sounds
  }

  // One stroke on one bar, `due` samples from now: `level` is what a fresh
  // stroke of this strength leaves in the bar's fundamental, `velocity`
  // shortens the contact.
  void stroke(Voice& voice, int which, float level, float velocity, int due) {
    const Bars& made = bars(voice.material);
    Bar& bar = voice.bar[which];
    const float sr = sample_rate();
    const float period = kit::kTwoPi / bar.omega[0];  // of this bar's own fundamental, in samples
    const float contact = kSoftContact * std::pow(kHardContact / kSoftContact, param(twin_bars::kMallet)) * made.contact *
                          std::sqrt(kC4 / voice.frequency) * (1.4f - 0.6f * velocity);
    int length = static_cast<int>(kit::min(contact * sr, kit::min(kLongestContact * sr, kMostOfAPeriod * period)) + 0.5f);
    if (length < 2) length = 2;
    // The middle of the push lands this many turns of a mode after now.
    const float middle = 0.5f * static_cast<float>(length - 1) + 1.0f;
    // When, and which way: with the bar's fundamental at the top of its swing
    // and the push upward, or at the bottom and downward, whichever comes
    // first, if the bar is moving at all. At most half a swing away.
    const float moving = std::sqrt(bar.re[0] * bar.re[0] + bar.im[0] * bar.im[0]);
    float wait = static_cast<float>(due);
    float way = 1.0f;
    if (moving > kTouch * kTouch * level) {
      const float turns = (std::atan2(bar.im[0], bar.re[0]) + bar.omega[0] * (wait + middle)) * (1.0f / kit::kTwoPi);
      const float past_the_top = turns - std::floor(turns);  // in swings; the bottom is at a half
      float to_go = past_the_top > 0.0f ? 1.0f - past_the_top : 0.0f;
      if (past_the_top > 0.0f && past_the_top <= 0.5f) {
        to_go = 0.5f - past_the_top;
        way = -1.0f;
      }
      wait += std::floor(to_go * period + 0.5f);
    }
    // How much: each mode up to what a fresh stroke would leave in it, and at
    // least a touch more than it has, so every stroke is heard. The touch
    // shrinks to nothing as the mode passes one and a half fresh strokes:
    // without that a fast roll on a bar that rings for a minute would pile up.
    const float base = made.level[0] * response(static_cast<float>(length) / period);
    const double landing = static_cast<double>(wait + middle);
    for (int k = 0; k < voice.count; ++k) {
      const float fresh = way * level * made.level[k] / base;  // before the mallet's own spectrum
      const float heard = fresh * response(bar.omega[k] * static_cast<float>(length) * (1.0f / kit::kTwoPi));
      const float size = std::fabs(heard);
      float share = 1.0f;
      if (size > 1.0e-9f) {
        // The mode as the push will find it, along the way the push goes.
        const double angle = static_cast<double>(bar.omega[k]) * landing;
        const float there = static_cast<float>(bar.re[k] * std::cos(angle) - bar.im[k] * std::sin(angle)) *
                            std::pow(voice.radius[k], static_cast<float>(landing));
        const float has = (heard < 0.0f ? -there : there) / size;  // 1 is a fresh stroke's worth
        const float touch = kTouch * kit::clamp((kFullBar - has) / (kFullBar - 1.0f), 0.0f, 1.0f);
        share = kit::clamp(1.0f - has, touch, 1.0f);
      }
      bar.strike[k] = share * fresh;
    }
    bar.pulse_wait = static_cast<int>(wait);
    bar.pulse_length = length;
    bar.pulse_done = 0;
    bar.pulse_gain = 2.0f / static_cast<float>(length);  // unit area whatever the length
  }
  // Before the first key after every bar has rung out. A sleeping device
  // stands still and the block it falls asleep in depends on the host's block
  // size, so nothing that runs on through a silence may be carried into the
  // next note: the control clock starts again and a control moved in the
  // silence is simply there.
  void restart() {
    chunk_left_ = 0;
    beat_.snap(beat_.target);
    tone_.snap(tone_.target);
    ears_.snap(ears_.target);
    volume_.snap(volume_.target);
  }

  // The turn of every mode with this tick's radius.
  static void steps(Voice& voice) {
    for (int b = 0; b < 2; ++b) {
      Bar& bar = voice.bar[b];
      for (int k = 0; k < voice.count; ++k) {
        bar.step_re[k] = voice.radius[k] * bar.turn_re[k];
        bar.step_im[k] = voice.radius[k] * bar.turn_im[k];
      }
    }
  }

  // The decay of every mode from the knobs as they stand.
  void ring(Voice& voice) {
    using namespace twin_bars;
    const Bars& made = bars(voice.material);
    const float sr = sample_rate();
    const float held = param(kDecay);
    // A key let go rings Decay^(1 - Damp) · choke^Damp: nothing changes at 0, the choke at 1.
    const float let_go = voice.released ? std::pow(kChokeSeconds / held, param(kDamp)) : 1.0f;
    for (int k = 0; k < voice.count; ++k) {
      float seconds = held * let_go / (1.0f + made.damping * (made.ratio[k] - 1.0f));
      seconds = kit::max(seconds, kShortestRing);
      voice.radius[k] = std::exp(-kSixtyDb / (seconds * sr));
    }
    steps(voice);
    voice.decayed = decay_serial_;
    voice.decayed_released = voice.released;
  }

  // Where every mode of the two bars turns: f·r - Beat/2 and f·r + Beat/2,
  // worked out in double so the difference is Beat and the mean is the key.
  void tune(Voice& voice) {
    const Bars& made = bars(voice.material);
    const double sr = static_cast<double>(sample_rate());
    const double half = 0.5 * static_cast<double>(beat_.value);
    for (int b = 0; b < 2; ++b) {
      Bar& bar = voice.bar[b];
      for (int k = 0; k < voice.count; ++k) {
        const double hz = static_cast<double>(voice.frequency) * static_cast<double>(made.ratio[k]) + (b == kSecond ? half : -half);
        const double omega = 2.0 * 3.14159265358979323846 * hz / sr;
        bar.omega[k] = static_cast<float>(omega);
        bar.turn_re[k] = static_cast<float>(std::cos(omega));
        bar.turn_im[k] = static_cast<float>(std::sin(omega));
      }
    }
    steps(voice);
    voice.tuned = beat_.value;
  }

  // Tone as a power of a mode's ratio: 0 in the middle, where the material is heard as it is.
  static float tilt(float tone) {
    return tone < 0.5f ? kDarkTilt * (1.0f - 2.0f * tone) : kBrightTilt * (2.0f * tone - 1.0f);
  }

  // How loud each mode is heard, from Tone as it stands.
  void colour(Voice& voice, bool snap) {
    const Bars& made = bars(voice.material);
    const float power = tilt(tone_.value);
    for (int k = 0; k < voice.count; ++k) {
      voice.gain_to[k] = k == 0 ? 1.0f : std::pow(made.ratio[k], power);
      voice.gain_step[k] = (voice.gain_to[k] - voice.gain[k]) * (1.0f / kChunk);
    }
    if (snap) arrive(voice);
    voice.toned = tone_.value;
  }

  // The end of a move of Tone: exactly on its gains, and still.
  static void arrive(Voice& voice) {
    for (int k = 0; k < kModes; ++k) {
      voice.gain[k] = voice.gain_to[k];
      voice.gain_step[k] = 0.0f;
    }
  }

  // Every kChunk samples: follow the knobs, retire the bars that have rung out.
  void control() {
    beat_.next();
    tone_.next();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.sounding || voice.pending || voice.fading) continue;
      if (voice.decayed != decay_serial_ || voice.decayed_released != voice.released) ring(voice);
      if (voice.tuned != beat_.value) tune(voice);
      arrive(voice);
      if (voice.toned != tone_.value) colour(voice, false);

      float energy = 0.0f;
      for (int b = 0; b < 2; ++b) {
        Bar& bar = voice.bar[b];
        for (int k = 0; k < voice.count; ++k) {
          const float power = bar.re[k] * bar.re[k] + bar.im[k] * bar.im[k];
          if (power < 1.0e-24f) bar.re[k] = bar.im[k] = 0.0f;
          energy += power;
        }
      }
      // A stroke still in flight counts for what it will leave (see play).
      const float ringing = std::sqrt(0.5f * energy);
      voice.follow = voice.struck() ? kit::max(voice.follow, ringing) : ringing;
      if (!voice.struck() && voice.follow < kSilence) retire(voice);
    }
  }

  void retire(Voice& voice) {
    voice.sounding = voice.pending = voice.fading = false;
    voice.follow = 0.0f;
    for (int b = 0; b < 2; ++b) voice.bar[b] = Bar();
  }

  void render_voice(Voice& voice, int n, float* first, float* second, float* power) {
    const bool leaving = voice.pending || voice.fading;
    float own[2][kChunk], own_power[kChunk];
    float* out[2] = {first, second};
    float* rings = power;
    if (leaving) {
      for (int i = 0; i < n; ++i) own[0][i] = own[1][i] = own_power[i] = 0.0f;
      out[0] = own[0];
      out[1] = own[1];
      rings = own_power;
    }
    // The stroke in flight on each bar.
    float pulse[2][kChunk];
    bool struck[2];
    for (int b = 0; b < 2; ++b) {
      Bar& bar = voice.bar[b];
      struck[b] = !leaving && bar.struck();
      if (!struck[b]) continue;
      for (int i = 0; i < n; ++i) {
        pulse[b][i] = 0.0f;
        if (bar.pulse_wait > 0) {
          --bar.pulse_wait;
        } else if (bar.pulse_done < bar.pulse_length) {
          const float phase = (static_cast<float>(bar.pulse_done) + 0.5f) / static_cast<float>(bar.pulse_length);
          pulse[b][i] = bar.pulse_gain * (0.5f - 0.5f * kit::SineTable::cos_lookup(phase));
          ++bar.pulse_done;
        }
      }
    }
    // The push goes in on the real side and the sound is the imaginary
    // side, so a mode answers a pulse from zero, as a displacement does.
    for (int k = 0; k < voice.count; ++k) {
      float heard[kChunk];
      float gain = voice.gain[k];
      const float gain_step = leaving ? 0.0f : voice.gain_step[k];
      for (int i = 0; i < n; ++i) {
        heard[i] = gain;
        gain += gain_step;
      }
      voice.gain[k] = gain;
      for (int b = 0; b < 2; ++b) {
        Bar& bar = voice.bar[b];
        float re = bar.re[k], im = bar.im[k];
        const float in = struck[b] ? bar.strike[k] : 0.0f;
        if (re == 0.0f && im == 0.0f && in == 0.0f) continue;
        const float step_re = bar.step_re[k], step_im = bar.step_im[k];
        float* to = out[b];
        if (k == 0) {
          // The fundamental counts towards the room: half a key for each bar.
          const float weight = voice.weight;
          for (int i = 0; i < n; ++i) {
            const float turned = step_re * re - step_im * im + (struck[b] ? in * pulse[b][i] : 0.0f);
            im = step_re * im + step_im * re;
            re = turned;
            to[i] += heard[i] * im;
            rings[i] += weight * (re * re + im * im);
          }
        } else if (struck[b]) {
          for (int i = 0; i < n; ++i) {
            const float turned = step_re * re - step_im * im + in * pulse[b][i];
            im = step_re * im + step_im * re;
            re = turned;
            to[i] += heard[i] * im;
          }
        } else {
          for (int i = 0; i < n; ++i) {
            const float turned = step_re * re - step_im * im;
            im = step_re * im + step_im * re;
            re = turned;
            to[i] += heard[i] * im;
          }
        }
        bar.re[k] = re;
        bar.im[k] = im;
      }
    }
    if (!leaving) return;
    // A stolen or cancelled voice: out over 2 ms, then the new note or nothing.
    for (int i = 0; i < n; ++i) {
      voice.steal = kit::max(voice.steal - steal_step_, 0.0f);
      first[i] += own[0][i] * voice.steal;
      second[i] += own[1][i] * voice.steal;
      power[i] += own_power[i] * voice.steal * voice.steal;
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
  kit::Smoother beat_, tone_;     // on the control clock
  kit::Smoother ears_, volume_;   // every sample
  kit::IdleGate idle_;
  uint32_t decay_serial_ = 1;
  int chunk_left_ = 0;
  float steal_step_ = 0.0f;
};

}  // namespace livemix
