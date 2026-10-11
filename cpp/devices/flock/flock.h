#pragma once

// Flock: every key calls a small flock of voices.
//
//   per key (up to 12), one to eight birds:
//
//     pitch = note × octave place × fly-in × roam × scatter
//       │
//       ▼
//     sine ─► odd harmonics (Tone) ─► × arrival, calls (Chirp), leaving ─► place ─┐
//                                                                                 ▼
//                                              out ◄─ soft clip ◄─ volume ◄─ sum L / R
//
// - A bird is one oscillator: a sine to which Tone adds the third, fifth and
//   seventh harmonics (a hollow pipe, then a reed). They are made from the
//   sine itself as a polynomial, and each is faded out before it reaches
//   Nyquist, so a bird that glides upwards never folds.
// - Fly-in. A bird starts between a third of an octave and an octave away,
//   on the side From says, and closes the distance over Gather (the first
//   bird of a key takes all of it, the others a little less), getting louder
//   as it comes. The curve is a cubic in frequency, so the turns it adds are
//   known in advance, and each bird starts at the phase that lets it land on
//   its own place in the cycle: a quarter turn behind the sum of the birds
//   that landed before it. Birds at one pitch therefore add up to the level
//   of as many unrelated voices, and with Stray at 0 a flock is one steady
//   tone of the same loudness whatever Birds is.
// - Roam. Once there, a bird's pitch follows a random walk that is pulled
//   back to the note: a new random aim every so often, through two one-pole
//   stages. Stray is how far it goes (nothing at 0, about a semitone either
//   way at 1) and Flutter how often it turns.
// - Home. Roaming leaves the birds anywhere in the cycle, and birds that
//   stopped there would add up to anything from nothing to several times a
//   flock. So while Stray is at 0 a landed bird is drawn back, by a few
//   cents at most, to the place it landed on: a flock that has roamed is
//   the same clean unison again a moment after Stray comes down.
// - Calls. Chirp turns each bird's level into its own train of rounded
//   calls with silence between them. Flutter paces those too.
// - Octaves seats some of the birds an octave up or down. Each has a place
//   left to right, mirrored from one key to the next, that drifts slowly.
// - Scatter. When the key is let go every bird heads off on its own, up or
//   down by a few semitones, faster the further it has faded (Leave).
// - Birds, Gather, From and Octaves describe the flock a key calls, so they
//   are read when the key is pressed, and Leave when it is let go: moved
//   under a held key they change nothing until the next one. Everything
//   else follows the knobs.
//
// Each key keeps its own clock: its birds are steered every 1/1500 s counted
// from the sample the key arrived on, and their levels, places and waves are
// ramped in between. There is no filter and no delay, so the instrument is
// at exact zero as soon as its last bird has gone.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Flock : public kit::DeviceBase<flock::kNumParams> {
 public:
  static constexpr int kMaxVoices = 12;
  static constexpr int kMaxBirds = 8;

  void init(float sample_rate) {
    using namespace flock;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (int i = 0; i <= kTableSize; ++i) {
      sine_[i] = static_cast<float>(std::sin(2.0 * 3.14159265358979323846 * i / kTableSize));
    }
    // Where each bird of a pitch lands in the cycle: a quarter turn behind
    // the sum of those before it, so that n of them have the power of n.
    {
      double re = 1.0, im = 0.0;
      landing_[0] = 0.0;
      for (int k = 1; k < kMaxBirds; ++k) {
        const double size = std::sqrt(re * re + im * im);
        const double step_re = im / size, step_im = -re / size;
        const double turn = std::atan2(step_im, step_re) / (2.0 * 3.14159265358979323846);
        landing_[k] = turn - std::floor(turn);
        re += step_re;
        im += step_im;
      }
    }
    period_ = static_cast<int>(sr / kTickRate + 0.5f);
    if (period_ < 8) period_ = 8;
    tick_rate_ = sr / static_cast<float>(period_);
    per_sample_ = 1.0f / static_cast<float>(period_);
    attack_step_ = 1.0f / (kAttackSeconds * tick_rate_);
    home_rate_ = 1.0 / (static_cast<double>(kHomeSeconds) * sr);

    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      voice = Voice();
      voice.rng.seed(seed_for(static_cast<uint32_t>(v)));
      voice.stray.set_time(kKnobSeconds, tick_rate_);
      voice.tone.set_time(kKnobSeconds, tick_rate_);
      voice.chirp.set_time(kKnobSeconds, tick_rate_);
      voice.width.set_time(kKnobSeconds, tick_rate_);
    }
    volume_.set_time(kSmoothingSeconds, sr);
    // Nothing outlives the birds.
    idle_.reset(sr, 0.05f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, kLowestHz, kHighestHz);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    // Nothing is sounding, so a Volume moved in the silence has arrived.
    if (pool_.count_active() == 0) volume_.snap(volume_.target);

    const int held = pool_.find_held(note_id);
    if (held >= 0) {
      Voice& again = pool_.voices[held];
      if (again.pending) {
        // Struck again before it could start: the waiting note is this one.
        again.next_frequency = frequency;
        again.next_gain = gain;
        again.loud = level_of(gain);
        return;
      }
      release(again);  // a key struck again while held: its old flock leaves
    }

    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    if (stolen) {
      // The old flock fades out first; the new note waits in the voice and
      // counts as the voice's loudness from now on.
      voice.pending = true;
      voice.next_frequency = frequency;
      voice.next_gain = gain;
      voice.loud = level_of(gain);
      if (voice.fade < 0) voice.fade = kStealTicks;
      return;
    }
    start(voice, frequency, gain);
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held < 0) return;
    Voice& voice = pool_.voices[held];
    if (voice.pending) {
      // Let go before it could start: the voice just finishes its fade.
      voice.pending = false;
      voice.released = true;
      return;
    }
    release(voice);
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(pool_.count_active() > 0)) {
      volume_.snap(volume_.target);
      silence_output(frames);
      return;
    }
    clear_input(frames);  // an instrument ignores its input
    for (int i = 0; i < frames; ++i) {
      out_left_[i] = 0.0f;
      out_right_[i] = 0.0f;
    }
    for (int v = 0; v < kMaxVoices; ++v) {
      if (pool_.voices[v].sounding) render(pool_.voices[v], frames);
    }
    for (int i = 0; i < frames; ++i) {
      const float volume = volume_.next();
      out_left_[i] = kit::soft_clip(out_left_[i] * volume);
      out_right_[i] = kit::soft_clip(out_right_[i] * volume);
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr int kTableBits = 11;
  static constexpr int kTableSize = 1 << kTableBits;
  static constexpr int kPhaseShift = 32 - kTableBits;
  static constexpr uint32_t kPhaseMask = (1u << kPhaseShift) - 1u;
  static constexpr float kPhaseScale = 1.0f / static_cast<float>(1u << kPhaseShift);
  static constexpr double kTurn = 4294967296.0;  // one cycle of a 32-bit phase

  // How often a key steers its birds.
  static constexpr float kTickRate = 1500.0f;
  // The knobs that are followed while a key sounds get there in this long.
  static constexpr float kKnobSeconds = 0.012f;
  static constexpr float kLowestHz = 8.0f;
  static constexpr float kHighestHz = 12000.0f;
  // No bird is asked to go faster than this many cycles per sample; one that
  // strays past it is faded out before Nyquist.
  static constexpr double kTopIncrement = 0.45;
  static constexpr float kLastIncrement = 0.49f;
  // One key at velocity 0.7 peaks near -21 dBFS at the default volume, and
  // ten keys stay under the knee of the soft clip.
  static constexpr float kVoiceGain = 0.23f;

  // Fly-in: how far away a bird starts (octaves), the share of Gather the
  // quickest bird needs, and its level when it sets out.
  static constexpr float kNearOctaves = 1.0f / 3.0f;
  static constexpr float kFarOctaves = 1.0f;
  static constexpr float kQuickest = 0.55f;
  static constexpr float kFarLevel = 0.3f;
  static constexpr float kAttackSeconds = 0.012f;
  // Roam: cents at Stray 1 (the knob is squared), and what brings the walk
  // to a spread of one (two one-poles take a fifth off a held random value).
  static constexpr float kStrayCents = 120.0f;
  static constexpr float kWalkSpread = 0.8f;
  static constexpr float kWalkNorm = 1.0f / kWalkSpread;
  // Home: with Stray at 0 a bird closes the distance to its place in the
  // cycle with this time constant, never more than this far off the note
  // (eight cents) on the way.
  static constexpr float kHomeSeconds = 0.25f;
  static constexpr double kHomeLimit = 0.004632;
  // Each bird drifts this far either side of its place (pan is -1 to 1).
  static constexpr float kPanDrift = 0.15f;
  // Calls: a bird calls every 0.5 to 1.6 s at the middle of Flutter, for
  // this share of the time, and louder than it holds so the flock does not
  // thin out as much as the silences would make it.
  static constexpr float kCallShortest = 0.5f;
  static constexpr float kCallLongest = 1.6f;
  static constexpr float kCallShare = 0.6f;
  static constexpr float kCallGain = 1.6f;
  static constexpr float kFirstCall = 0.09f;
  // Octaves 1 seats three in four of the birds beside the first one off the
  // note; those above it are a little quieter.
  static constexpr float kOctaveShare = 0.75f;
  static constexpr float kUpperLevel = 0.7f;
  static constexpr float kLowestOctaveHz = 30.0f;
  // Scatter: how far a bird has gone when it has faded out (cents), and the
  // share of Leave the quickest one needs.
  static constexpr float kScatterNear = 150.0f;
  static constexpr float kScatterFar = 700.0f;
  static constexpr float kQuickestLeave = 0.6f;
  // Tone 1: the harmonics of a reed, against the fundamental.
  static constexpr float kThird = 0.55f;
  static constexpr float kFifth = 0.33f;
  static constexpr float kSeventh = 0.2f;
  // A harmonic fades out between these two shares of the sample rate.
  static constexpr float kHarmonicTop = 0.45f;
  static constexpr float kHarmonicFade = 0.09f;
  // A stolen voice makes room over this many ticks (2.7 ms).
  static constexpr int kStealTicks = 4;

  struct Bird {
    // What the sample loop reads.
    uint32_t phase = 0;
    uint32_t increment = 0;
    // Where it would be had it flown straight to its place and stayed, and
    // how far that moves in a sample.
    uint32_t home = 0;
    uint32_t home_step = 0;
    float wave[4] = {1.0f, 0.0f, 0.0f, 0.0f};  // of s, s^3, s^5, s^7
    float wave_step[4] = {};
    float left = 0.0f, right = 0.0f;
    float left_step = 0.0f, right_step = 0.0f;
    // Where the ramps are going: they land there exactly on the next tick.
    float wave_aim[4] = {1.0f, 0.0f, 0.0f, 0.0f};
    float left_aim = 0.0f, right_aim = 0.0f;

    double base = 0.0;         // cycles per sample at its octave of the note
    double depart = 0.0;       // how far off it starts, as a share of its frequency
    double arrived = 1.0;      // 0 when it sets out, 1 when it is there
    double arrive_step = 0.0;  // per tick
    float weight = 1.0f;       // level against the birds on the note
    float place = 0.0f;        // -1 left, 1 right, before Width
    float attack = 0.0f;
    float roam_aim = 0.0f, roam1 = 0.0f, roam2 = 0.0f;
    float pan_aim = 0.0f, pan1 = 0.0f, pan2 = 0.0f;
    int roam_hold = 0, pan_hold = 0;
    float call = 0.0f, call_step = 0.0f;
    float gone = 0.0f, gone_step = 0.0f;  // 0 at the note off, 1 when it has left
    float scatter = 0.0f;                 // cents by the time it has left
    bool on = false;
    bool fresh = false;  // its first tick is still to come
    bool last = false;   // it is on its way to exact zero
  };

  struct Voice {
    Bird birds[kMaxBirds];
    kit::Rng rng;
    kit::Smoother stray, tone, chirp, width;  // one step per tick
    int count = 0;
    int countdown = 0;  // samples to the next tick
    int fade = -1;      // ticks left of a steal fade; -1 when there is none
    float gain = 0.0f;   // of each bird on the note
    float touch = 0.0f;  // how hard the key was pressed
    float loud = 0.0f;   // what the pool steals by
    float next_frequency = 0.0f, next_gain = 0.0f;
    bool sounding = false;
    bool released = false;
    bool pending = false;  // a note waits for the fade to finish

    bool active() const { return sounding; }
    bool releasing() const { return released && !pending; }
    float level() const { return loud; }
  };

  // An unrelated seed per voice.
  static uint32_t seed_for(uint32_t stream) {
    uint32_t x = (stream + 1u) * 0x9E3779B9u;
    x ^= x >> 16;
    x *= 0x85EBCA6Bu;
    x ^= x >> 13;
    x *= 0xC2B2AE35u;
    x ^= x >> 16;
    return x;
  }

  static float level_of(float gain) { return 0.3f + 0.7f * gain; }

  // Where bird k of n sits: evenly spread in angle, from the middle outwards,
  // left and right in turn.
  static float place_of(int k, int n) {
    float spot = 0.0f;
    if (n % 2 == 0) {
      spot = static_cast<float>(2 * (k >> 1) + 1) / static_cast<float>(n);
      if (k % 2 == 0) spot = -spot;
    } else if (k > 0) {
      spot = static_cast<float>(2 * ((k + 1) >> 1)) / static_cast<float>(n);
      if (k % 2 == 1) spot = -spot;
    }
    return std::sin(kit::kHalfPi * spot);
  }

  // sin(2π·phase) for a phase in [0, 1).
  float sine(float phase) const {
    const float at = phase * static_cast<float>(kTableSize);
    const int index = static_cast<int>(at);
    return sine_[index] + (sine_[index + 1] - sine_[index]) * (at - static_cast<float>(index));
  }

  // How much of a partial at `speed` cycles per sample is left under Nyquist.
  static float room(float speed) {
    return kit::clamp((kHarmonicTop - speed) * (1.0f / kHarmonicFade), 0.0f, 1.0f);
  }

  float call_step(kit::Rng& rng) const {
    const float seconds = kCallShortest + (kCallLongest - kCallShortest) * rng.uniform();
    return 1.0f / (seconds * tick_rate_);
  }

  // A key calls its flock: everything about where the birds come from and
  // where they will sit is drawn here.
  void start(Voice& voice, float frequency, float gain) {
    using namespace flock;
    const double sr = sample_rate();
    voice.sounding = true;
    voice.released = false;
    voice.pending = false;
    voice.fade = -1;
    voice.countdown = 0;
    voice.touch = level_of(gain);
    voice.loud = voice.touch;
    voice.stray.snap(stray_cents());
    voice.tone.snap(param(kTone));
    voice.chirp.snap(param(kChirp));
    voice.width.snap(param(kWidth));

    const int count = kit::clamp_int(static_cast<int>(param(kBirds) + 0.5f), 1, kMaxBirds);
    voice.count = count;
    const float gather = param(kGather);
    const int from = kit::clamp_int(static_cast<int>(param(kFrom) + 0.5f), 0, 2);
    const int displaced =
        static_cast<int>(param(kOctaves) * static_cast<float>(count - 1) * kOctaveShare + 0.5f);
    const bool up_fits = 2.0 * frequency <= 0.2 * sr;
    const bool down_fits = 0.5f * frequency >= kLowestOctaveHz;
    // Every other flock is the mirror image of this one.
    const bool mirror = ((voice.rng.next_u32() >> 16) & 1u) != 0;

    int landed[3] = {0, 0, 0};  // birds so far on the note, above it, below it
    float power = 0.0f;
    for (int k = 0; k < count; ++k) {
      Bird& bird = voice.birds[k];
      bird = Bird();
      bird.on = true;
      bird.fresh = true;

      // The last birds are the ones Octaves moves: up, down, down, up, ...
      int octave = 0;
      const int turn = count - 1 - k;
      if (turn < displaced) {
        bool up = (((turn + 1) >> 1) & 1) == 0;
        if (up && !up_fits) up = false;
        if (!up && !down_fits) up = true;
        octave = up ? 1 : 2;
      }
      bird.weight = octave == 1 ? kUpperLevel : 1.0f;
      power += bird.weight * bird.weight;
      const double ratio = octave == 1 ? 2.0 : (octave == 2 ? 0.5 : 1.0);
      bird.base = frequency * ratio / sr;
      if (bird.base > kTopIncrement) bird.base = kTopIncrement;

      // The fly-in: from how far, on which side, and for how long.
      const float far = kNearOctaves + (kFarOctaves - kNearOctaves) * voice.rng.uniform();
      const bool below = from == 0 || (from == 2 && ((k & 1) != 0) == mirror);
      bird.depart = std::exp2(static_cast<double>(below ? -far : far)) - 1.0;
      if (bird.base * (1.0 + bird.depart) > kTopIncrement) {
        bird.depart = kTopIncrement / bird.base - 1.0;
      }
      const float share = k == 0 ? 1.0f : kQuickest + (1.0f - kQuickest) * voice.rng.uniform();
      const double samples = static_cast<double>(gather) * share * sr;
      bird.arrived = 0.0;
      bird.arrive_step = static_cast<double>(period_) / samples;
      // The cubic adds (or takes) a quarter of what a straight line at the
      // starting distance would: start that far behind the landing place.
      const double turns = bird.base * bird.depart * samples * 0.25;
      const double place = landing_[landed[octave]++];
      double at = place - turns;
      at -= std::floor(at);
      bird.phase = static_cast<uint32_t>(static_cast<uint64_t>(at * kTurn));
      bird.home = static_cast<uint32_t>(static_cast<uint64_t>(place * kTurn));
      bird.home_step = static_cast<uint32_t>(bird.base * kTurn + 0.5);

      bird.place = place_of(k, count) * (mirror ? -1.0f : 1.0f);
      // The walks begin where a bird that had been there a while would be.
      bird.roam_aim = bird.roam1 = bird.roam2 = kWalkSpread * voice.rng.gaussian();
      bird.pan_aim = bird.pan1 = bird.pan2 = kWalkSpread * voice.rng.gaussian();
      bird.roam_hold = 1 + static_cast<int>(voice.rng.uniform() * roam_hold_);
      bird.pan_hold = 1 + static_cast<int>(voice.rng.uniform() * pan_hold_);
      // The first bird is part of the way into a call, so a key is heard at
      // once whatever Chirp is.
      bird.call = k == 0 ? kFirstCall : voice.rng.uniform();
      bird.call_step = call_step(voice.rng);
    }
    voice.gain = kVoiceGain * voice.touch / std::sqrt(power);
  }

  // The key is let go: every bird gets a way out and a time to take it.
  void release(Voice& voice) {
    if (voice.released) return;
    voice.released = true;
    const float leave = param(flock::kLeave);
    for (int k = 0; k < voice.count; ++k) {
      Bird& bird = voice.birds[k];
      const float share =
          k == 0 ? 1.0f : kQuickestLeave + (1.0f - kQuickestLeave) * voice.rng.uniform();
      const float cents = kScatterNear + (kScatterFar - kScatterNear) * voice.rng.uniform();
      const bool up = ((voice.rng.next_u32() >> 16) & 1u) != 0;
      bird.gone_step = 1.0f / (leave * share * tick_rate_);
      bird.scatter = up ? cents : -cents;
    }
  }

  void render(Voice& voice, int frames) {
    int done = 0;
    while (done < frames) {
      if (voice.countdown == 0) {
        tick(voice);
        if (!voice.sounding) return;
        voice.countdown = period_;
      }
      const int run = frames - done < voice.countdown ? frames - done : voice.countdown;
      for (int k = 0; k < voice.count; ++k) {
        if (voice.birds[k].on) sing(voice.birds[k], out_left_ + done, out_right_ + done, run);
      }
      voice.countdown -= run;
      done += run;
    }
  }

  // One bird for `frames` samples, added to the mix.
  void sing(Bird& bird, float* left, float* right, int frames) const {
    uint32_t phase = bird.phase;
    const uint32_t increment = bird.increment;
    float w1 = bird.wave[0], w3 = bird.wave[1], w5 = bird.wave[2], w7 = bird.wave[3];
    const float d1 = bird.wave_step[0], d3 = bird.wave_step[1];
    const float d5 = bird.wave_step[2], d7 = bird.wave_step[3];
    float gain_left = bird.left, gain_right = bird.right;
    const float step_left = bird.left_step, step_right = bird.right_step;
    for (int i = 0; i < frames; ++i) {
      phase += increment;
      const uint32_t index = phase >> kPhaseShift;
      const float fraction = static_cast<float>(phase & kPhaseMask) * kPhaseScale;
      const float s = sine_[index] + (sine_[index + 1] - sine_[index]) * fraction;
      const float s2 = s * s;
      w1 += d1;
      w3 += d3;
      w5 += d5;
      w7 += d7;
      const float sample = s * (w1 + s2 * (w3 + s2 * (w5 + s2 * w7)));
      gain_left += step_left;
      gain_right += step_right;
      left[i] += sample * gain_left;
      right[i] += sample * gain_right;
    }
    bird.phase = phase;
    bird.wave[0] = w1;
    bird.wave[1] = w3;
    bird.wave[2] = w5;
    bird.wave[3] = w7;
    bird.left = gain_left;
    bird.right = gain_right;
  }

  // Every 1/1500 s of a key: steer its birds for the stretch to come, and
  // start the note that was waiting once the flock it took over has gone.
  void tick(Voice& voice) {
    if (voice.fade == 0) {
      // The steal fade is over and the old flock is at zero.
      if (!voice.pending) {
        voice.fade = -1;
        voice.sounding = false;
        return;
      }
      start(voice, voice.next_frequency, voice.next_gain);
    }
    if (steer(voice)) return;
    // The last bird has gone.
    if (!voice.pending) {
      voice.fade = -1;
      voice.sounding = false;
      return;
    }
    start(voice, voice.next_frequency, voice.next_gain);
    steer(voice);
  }

  // False when no bird is left.
  bool steer(Voice& voice) {
    using namespace flock;
    float fade = 1.0f;
    if (voice.fade > 0) {
      --voice.fade;
      fade = static_cast<float>(voice.fade) / static_cast<float>(kStealTicks);
    }

    voice.stray.set_target(stray_cents());
    voice.tone.set_target(param(kTone));
    voice.chirp.set_target(param(kChirp));
    voice.width.set_target(param(kWidth));
    const float stray = voice.stray.next() * kWalkNorm;
    const bool homing = stray == 0.0f && !voice.released;
    const float tone = voice.tone.next();
    const float chirp = voice.chirp.next();
    const float width = voice.width.next();
    // Tone: the third comes in first, then the fifth, then the seventh.
    const float fifth_in = kit::clamp((tone - 0.2f) * 1.25f, 0.0f, 1.0f);
    const float seventh_in = kit::clamp((tone - 0.45f) * (1.0f / 0.55f), 0.0f, 1.0f);
    const float third = kThird * tone;
    const float fifth = kFifth * fifth_in * fifth_in;
    const float seventh = kSeventh * seventh_in * seventh_in;

    bool any = false;
    float loudest = 0.0f;
    for (int k = 0; k < voice.count; ++k) {
      Bird& bird = voice.birds[k];
      if (!bird.on) continue;
      // Land on what the last stretch was ramping to.
      bird.left = bird.left_aim;
      bird.right = bird.right_aim;
      for (int j = 0; j < 4; ++j) bird.wave[j] = bird.wave_aim[j];
      if (bird.last) {
        bird.on = false;
        continue;
      }
      any = true;

      // Roam and drift: a new aim now and then, followed through two poles.
      if (bird.roam_hold > roam_longest_) bird.roam_hold = roam_longest_;
      if (--bird.roam_hold <= 0) {
        bird.roam_aim = voice.rng.gaussian();
        bird.roam_hold = 1 + static_cast<int>((0.5f + voice.rng.uniform()) * roam_hold_);
      }
      bird.roam1 += (bird.roam_aim - bird.roam1) * roam_coeff_;
      bird.roam2 += (bird.roam1 - bird.roam2) * roam_coeff_;
      if (bird.pan_hold > pan_longest_) bird.pan_hold = pan_longest_;
      if (--bird.pan_hold <= 0) {
        bird.pan_aim = voice.rng.gaussian();
        bird.pan_hold = 1 + static_cast<int>((0.5f + voice.rng.uniform()) * pan_hold_);
      }
      bird.pan1 += (bird.pan_aim - bird.pan1) * pan_coeff_;
      bird.pan2 += (bird.pan1 - bird.pan2) * pan_coeff_;

      // Scatter: slowly at first, so the note is still the note while it is loud.
      float cents = stray * bird.roam2;
      float staying = 1.0f;
      if (voice.released) {
        bird.gone += bird.gone_step;
        if (bird.gone >= 1.0f) {
          bird.gone = 1.0f;
          bird.last = true;
        }
        cents += bird.scatter * bird.gone * std::sqrt(bird.gone);
        staying = (1.0f - bird.gone) * (1.0f - bird.gone);
      }
      // 2^(cents / 1200) by its series: exact at 0, a hundredth of a cent off at an octave.
      const double y = static_cast<double>(cents) * (0.69314718055994531 / 1200.0);
      const double tail = (1.0 / 24.0) + y * ((1.0 / 120.0) + y * (1.0 / 720.0));
      const double bend = 1.0 + y * (1.0 + y * (0.5 + y * ((1.0 / 6.0) + y * tail)));

      // Fly-in: the mean over this stretch of (1 - arrived)^3, so the turns
      // the whole flight adds come out as start() counted them.
      double away = 0.0;
      const bool landed = bird.arrived >= 1.0;
      if (bird.arrived < 1.0) {
        const double before = 1.0 - bird.arrived;
        const double next = bird.arrived + bird.arrive_step;
        const double after = next < 1.0 ? 1.0 - next : 0.0;
        away = ((before * before) * (before * before) - (after * after) * (after * after)) /
               (4.0 * bird.arrive_step);
        bird.arrived = next < 1.0 ? next : 1.0;
      }
      double increment = bird.base * bend * (1.0 + bird.depart * away);
      // Home: with Stray at 0, back to its place in the cycle.
      if (homing && landed) {
        const double behind = static_cast<double>(static_cast<int32_t>(bird.home - bird.phase)) * (1.0 / kTurn);
        const double most = bird.base * kHomeLimit;
        double pull = behind * home_rate_;
        if (pull > most) pull = most;
        if (pull < -most) pull = -most;
        increment += pull;
      }
      bird.home += bird.home_step * static_cast<uint32_t>(period_);
      if (increment > kLastIncrement) increment = kLastIncrement;
      bird.increment = static_cast<uint32_t>(increment * kTurn + 0.5);
      const float speed = static_cast<float>(increment);

      // Level: a quick start, louder as it arrives, its calls, its leaving.
      if (bird.attack < 1.0f) bird.attack = kit::min(1.0f, bird.attack + attack_step_);
      const float in = bird.attack * bird.attack * (3.0f - 2.0f * bird.attack);
      const float short_of = static_cast<float>(1.0 - bird.arrived);
      const float near = kFarLevel + (1.0f - kFarLevel) * (1.0f - short_of * short_of);
      bird.call += bird.call_step * call_speed_;
      if (bird.call >= 1.0f) {
        bird.call -= 1.0f;
        bird.call_step = call_step(voice.rng);
      }
      float calling = 0.0f;
      if (bird.call < kCallShare) {
        float turn = bird.call * (1.0f / kCallShare) + 0.25f;
        if (turn >= 1.0f) turn -= 1.0f;
        calling = 0.5f - 0.5f * sine(turn);
      }
      const float level = 1.0f + chirp * (kCallGain * calling - 1.0f);
      const float headroom = kit::clamp((kLastIncrement - speed) * 25.0f, 0.0f, 1.0f);
      const float amp = voice.gain * bird.weight * in * near * level * staying * fade * headroom;
      if (staying > loudest) loudest = staying;

      const float pan =
          width * kit::clamp(bird.place + kPanDrift * kWalkNorm * bird.pan2, -1.0f, 1.0f);
      bird.left_aim = amp * std::sqrt(0.5f * (1.0f - pan));
      bird.right_aim = amp * std::sqrt(0.5f * (1.0f + pan));

      // The wave: each harmonic as long as there is room for it under Nyquist,
      // the whole at the power of the sine alone.
      const float h3 = third * room(3.0f * speed);
      const float h5 = fifth * room(5.0f * speed);
      const float h7 = seventh * room(7.0f * speed);
      const float even = 1.0f / std::sqrt(1.0f + h3 * h3 + h5 * h5 + h7 * h7);
      // sin 3x, sin 5x and sin 7x as polynomials in sin x.
      bird.wave_aim[0] = even * (1.0f + 3.0f * h3 + 5.0f * h5 + 7.0f * h7);
      bird.wave_aim[1] = even * (-4.0f * h3 - 20.0f * h5 - 56.0f * h7);
      bird.wave_aim[2] = even * (16.0f * h5 + 112.0f * h7);
      bird.wave_aim[3] = even * (-64.0f * h7);

      if (bird.fresh) {
        bird.fresh = false;
        for (int j = 0; j < 4; ++j) bird.wave[j] = bird.wave_aim[j];
      }
      bird.left_step = (bird.left_aim - bird.left) * per_sample_;
      bird.right_step = (bird.right_aim - bird.right) * per_sample_;
      for (int j = 0; j < 4; ++j) {
        bird.wave_step[j] = (bird.wave_aim[j] - bird.wave[j]) * per_sample_;
      }
    }
    // What the pool steals by: a held key counts in full, a leaving one by
    // how much of its loudest bird is left.
    if (voice.released && !voice.pending) voice.loud = voice.touch * loudest;
    return any;
  }

  float stray_cents() const {
    const float stray = param(flock::kStray);
    return kStrayCents * stray * stray;
  }

  void apply(int id) {
    using namespace flock;
    const float value = param(id);
    switch (id) {
      case kFlutter: {
        // A new aim every 0.5 to 1.5 turns of Flutter, each pole a quarter of one.
        roam_coeff_ = 1.0f - std::exp(-4.0f * value / tick_rate_);
        roam_hold_ = tick_rate_ / value;
        roam_longest_ = 2 + static_cast<int>(1.5f * roam_hold_);
        // The places drift more slowly, and less so as Flutter rises.
        const float pan_hz = 0.25f * std::sqrt(value);
        pan_coeff_ = 1.0f - std::exp(-4.0f * pan_hz / tick_rate_);
        pan_hold_ = tick_rate_ / pan_hz;
        pan_longest_ = 2 + static_cast<int>(1.5f * pan_hold_);
        call_speed_ = kit::clamp(std::sqrt(value * 2.0f), 0.5f, 2.5f);
        break;
      }
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      default:
        break;  // read when a key is pressed, or on its ticks
    }
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::Smoother volume_;
  kit::IdleGate idle_;
  int period_ = 32;
  float tick_rate_ = 1500.0f;
  float per_sample_ = 1.0f / 32.0f;
  float attack_step_ = 0.0f;
  float roam_coeff_ = 0.0f, roam_hold_ = 0.0f;
  float pan_coeff_ = 0.0f, pan_hold_ = 0.0f;
  int roam_longest_ = 0, pan_longest_ = 0;
  float call_speed_ = 1.0f;
  double home_rate_ = 0.0;  // of the distance to its place, per sample
  double landing_[kMaxBirds] = {};
  float sine_[kTableSize + 1] = {};
};

}  // namespace livemix
