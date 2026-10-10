#pragma once

// Rewind: notes played backwards, as an instrument.
//
//   key down ─► partials (up to 12 per key) ─► stereo gains ─┐
//                 each grows toward the strike               ├─► volume ─► soft clip ─► out
//               hammer noise, rising into the strike ────────┘
//
// - No tape and no buffer. A struck sound is a set of partials, each with a
//   frequency, a level and a decay time, so its mirror image is known in
//   closed form: partial k is A_k·exp(-D_k·(1 - u)) until the strike, where u
//   runs from 0 at the key to 1 at the strike. D_k is the partial's decay rate
//   stretched over the whole swell (Rise sets how deep the slowest one
//   starts), so the partials that die first forwards arrive last backwards
//   and the note brightens into its strike.
// - A partial is one unit phasor turned every sample (z' = e^jw·z). All of its
//   loudness is in four gains (left and right, on the phasor's two sides)
//   that move in straight lines between control ticks 32 samples apart. Being
//   complex, one gain pair carries three things at no cost per sample:
//     the note      a real gain, the closed-form envelope;
//     Shimmer       a second copy a few cents apart: the same phasor times a
//                   slowly turning number, placed on the other side;
//     Ghost         a narrow band of noise on the partial: the phasor times a
//                   number of fixed length whose phase wanders (a fixed part
//                   plus a slow random walk), different left and right, which
//                   is what a room does to a steady tone. It rises earlier
//                   than the note, softer, as loud on every key, and has
//                   gathered into the note by the strike.
// - Where every phasor stands at the strike is set, not drawn, and wound back
//   from there to the key, so a strike is the same every time and the two
//   copies and the halves of a beating pair meet on it. (The pattern spreads
//   the partials over the cycle to keep the strike low. A ringing bell on
//   its lowest keys drifts into line some tens of milliseconds later, and
//   its tallest sample falls there: the gains still top on the strike.)
// - The strike falls on a control tick. Snap adds a last quick surge of every
//   partial (12 ms either side of the strike) and a backwards hammer: a band
//   of noise around the fourth harmonic that rises over the last 50 ms.
// - After the strike each partial decays forwards, the phasor itself
//   shrinking every sample. Tail scales the source's own decay times; at 0
//   everything stops with a time constant of 2 ms (up to 6 ms for low notes).
// - Strike "After swell" lands the note Swell after the key, whatever the key
//   does. "On release" follows the same curve most of the way, then slows
//   and hovers while the key is held, 0.15 of the swell short of the strike
//   or further (so that the hover is 6 dB or more under the strike however
//   shallow Rise makes the climb); letting go runs the rest in 60 ms, and in
//   that time the beats inside the note are brought round to meet on the
//   strike (see meet), which was not known when the note began. Source,
//   Strike, Swell and Rise are read when a note starts.
// - Wobble turns every partial of every note a little faster and slower
//   together, as a tape that runs unevenly does.
// - Level. Every sound the knobs can make is as loud: a note's gain is set
//   from the energy of its loudest 400 ms, in closed form (see note_gain), with a
//   ceiling on the strike. Notes that strike together share the peak (see
//   gather): a chord of eight lands 4.5 dB over one note, not 9.
//
// Sources: piano (a stiff struck string), bell (the minor-third partials of a
// cast bell with its hum an octave down), pluck (a harmonic string whose
// highs die at once) and bowl (six rim modes, each a pair that beats). For
// low strings the twelve partials are the first six harmonics and six more
// spread up to about 7 kHz, each standing for the band around it.
//
// The instrument sleeps when every note has rung out below -120 dB. A note
// struck when nothing sounds starts everything again (voices, noise, wow), so
// the first note after a silence is the first note after init().

#include <initializer_list>

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Rewind : public kit::DeviceBase<rewind::kNumParams> {
 public:
  static constexpr int kMaxVoices = 12;
  static constexpr int kPartials = 12;
  enum Source : int { kPiano = 0, kBell, kPluck, kBowl, kNumSources };

  void init(float sample_rate) {
    using namespace rewind;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    tick_rate_ = sr / kChunk;
    for (int v = 0; v < kMaxVoices; ++v) pool_.voices[v] = Voice();
    steal_step_ = 1.0f / (kStealSeconds * sr);
    noise_scale_ = std::sqrt(sr / 48000.0f);
    near_ = 1.0f / (kTogether * tick_rate_);
    share_rate_ = 1.0f - std::exp(-1.0f / (kShareSeconds * tick_rate_));
    surge_ticks_ = kit::clamp_int(static_cast<int>(kSurgeSeconds * tick_rate_ + 0.5f), 2, 1 << 20);
    prompt_rate_ = 1.0f / (kPromptSeconds * tick_rate_);
    prompt_fall_ = std::exp(-prompt_rate_);
    burst_rate_ = 1.0f / (kBurstRise * tick_rate_);
    burst_fall_ = std::exp(-1.0f / (kBurstFall * tick_rate_));
    burst_ticks_ = static_cast<int>(7.0f * kBurstRise * tick_rate_);
    prompt_ticks_ = static_cast<int>(7.0f * kPromptSeconds * tick_rate_);
    // The ghost's random walk: white noise through two equal one-poles at
    // kWashHz, scaled to unit variance whatever the tick rate.
    walk_pole_ = std::exp(-kit::kTwoPi * kWashHz / tick_rate_);
    const float a2 = walk_pole_ * walk_pole_;
    walk_gain_ = std::sqrt(3.0f * (1.0f - a2) * (1.0f - a2) * (1.0f - a2) / (1.0f + a2));
    for (kit::Smoother* knob : {&tail_, &snap_, &tone_, &ghost_, &wobble_, &shimmer_, &width_}) {
      knob->set_time(kKnobSeconds, tick_rate_);
    }
    volume_.set_time(kSmoothingSeconds, sr);
    idle_.reset(sr, 0.05f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    restart();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, kMinHz, kMaxHz);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    // Nothing sounds: whatever ran on through the silence starts again, so
    // the render does not depend on when the device fell asleep.
    if (pool_.count_active() == 0) restart();
    const int held = pool_.find_held(note_id);
    if (held >= 0) {
      Voice& again = pool_.voices[held];
      if (again.pending) {
        // Struck again before it could start: the waiting note is this one.
        again.next_frequency = frequency;
        again.next_gain = gain;
        return;
      }
      release(again);  // a key struck again while held lets its first note go
    }
    bool stolen = false;
    const int index = pool_.note_on(note_id, &stolen);
    Voice& voice = pool_.voices[index];
    if (stolen) {
      // Fade what it was playing over 2 ms, then start (see render_voice).
      voice.pending = true;
      voice.next_let_go = false;
      voice.next_frequency = frequency;
      voice.next_gain = gain;
    } else {
      start(index, frequency, gain);
    }
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held < 0) return;
    Voice& voice = pool_.voices[held];
    if (voice.pending) {
      // Let go before its stolen start: it starts let go. A note lands
      // however short the key was.
      voice.next_let_go = true;
      return;
    }
    release(voice);
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
      float left[kChunk] = {}, right[kChunk] = {};
      for (int v = 0; v < kMaxVoices; ++v) {
        if (pool_.voices[v].sounding) render_voice(pool_.voices[v], n, left, right);
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
  static constexpr float kTopHz = 18000.0f;       // partials above this (or 0.45 of the rate) are left out
  static constexpr float kLowestHz = 16.0f;
  static constexpr float kSixtyDb = 6.907755279f;
  static constexpr float kFloor = 1.0e-6f;        // a gain under this is silence
  static constexpr float kDormant = 16.0f;        // nepers under its strike level at which a partial starts
  static constexpr float kDeepest = 120.0f;       // nepers: no partial starts further down than this
  static constexpr float kShallowRise = 1.8f;     // depth of the slowest partial in nepers, Rise 0
  static constexpr float kDeepRise = 12.0f;       // ... and Rise 1
  static constexpr float kFadeIn = 0.12f;         // share of the swell over which a note comes out of nothing
  static constexpr float kHoverSpan = 0.15f;      // on release: the curve slows over this much of the swell
  static constexpr float kHoverShort = 0.15f;     // ... and comes to rest this far short of the strike,
  static constexpr float kHoverUnder = 0.7f;      // ... or where the slowest partial is this many nepers under it
  static constexpr float kSurgeSeconds = 0.06f;   // on release: key up to strike
  static constexpr float kPromptSeconds = 0.012f; // the strike's own surge, either side
  static constexpr float kPromptMost = 1.5f;      // its height over the note at Snap 1
  static constexpr float kBurstRise = 0.007f;     // hammer noise: time constant into the strike
  static constexpr float kBurstFall = 0.0015f;    // ... and out of it
  static constexpr float kBurstGain = 1.6f;
  static constexpr float kStopSeconds = 0.002f;   // Tail 0: every partial's time constant after the strike,
  static constexpr float kStopPeriods = 0.5f;     // ... or this share of the note's period if that is longer,
  static constexpr float kSlowestStop = 0.006f;   // ... up to this (a low note cut faster than it turns is a click)
  static constexpr float kStealSeconds = 0.002f;
  static constexpr float kKnobSeconds = 0.015f;
  static constexpr float kWashHz = 6.0f;          // half width of the ghost's band on each partial
  static constexpr float kGhostGain = 0.5f;
  static constexpr float kMaxDetune = 0.008f;     // Shimmer 1: the two copies are 14 cents apart
  static constexpr float kMaxWow = 0.0104f;       // Wobble 1: 18 cents either way
  static constexpr double kWowSlowHz = 0.55;      // the wow is two sines, most of it the slow one
  static constexpr double kWowFastHz = 2.3;
  static constexpr double kWowSlowShare = 0.75;
  static constexpr float kLoudest = 0.4f;         // seconds: the stretch of a note its loudness is taken over
  static constexpr float kLoudness = 0.141f;      // how loud that stretch is, for every sound the knobs can make,
  static constexpr float kTallest = 1.41f;           // ... unless the strike would stand taller than this
  static constexpr float kHammerTall = 0.5f;      // what the hammer noise adds to a strike at Snap 1, in strikes
  static constexpr float kKeyTilt = -0.08f;       // low notes strike softer for the same levels: this evens the keys
  static constexpr float kTiltTop = 1000.0f;      // ... up to here
  static constexpr float kTogether = 0.04f;       // seconds: strikes nearer than this share their peak
  static constexpr float kShareSeconds = 0.015f;  // how fast a note gives way to one that will strike with it,
  static constexpr float kHoverShare = 0.5f;      // ... and to one that joins it under held keys, in swells

  // What a source gives for one partial: its frequency as a ratio to the
  // played note (plus a few hertz for one half of a beating pair), its level
  // at the strike, and its decay rate as a multiple of the slowest one's.
  struct Shape {
    float ratio, offset_hz, level, rate;
    bool paired;  // the upper half of a beating pair with the partial before it
  };

  // Harmonic numbers for a string: 1 to 6, then six more spread evenly in
  // pitch up to `reach_hz`. A string high enough gets 1 to 12.
  static void harmonics(float hz, float reach_hz, float most, int* number, float* band) {
    const float top = kit::clamp(reach_hz / hz, 12.0f, most);
    const float growth = std::pow(top / 6.0f, 1.0f / 6.0f);
    float x = 6.0f;
    for (int k = 0; k < kPartials; ++k) {
      if (k < 6) {
        number[k] = k + 1;
      } else {
        x *= growth;
        number[k] = kit::clamp_int(static_cast<int>(x + 0.5f), number[k - 1] + 1, 1 << 10);
      }
    }
    // A partial stands for the harmonics nearer to it than to its neighbours.
    for (int k = 0; k < kPartials; ++k) {
      const int below = k > 0 ? number[k - 1] : 0;
      const int above = k + 1 < kPartials ? number[k + 1] : 2 * number[k] - below;
      band[k] = std::sqrt(0.5f * static_cast<float>(above - below));
    }
  }

  // The source's partials at `hz` and the ring time (to -60 dB) of the
  // slowest of them. Returns how many there are.
  static int build(int source, float hz, Shape* shape, float* ring) {
    int number[kPartials];
    float band[kPartials];
    switch (source) {
      case kBell: {
        // Hum, prime, tierce, quint, nominal and the upper partials.
        static constexpr float kRatio[kPartials] = {0.5f, 1.0f, 1.2f, 1.5f, 2.0f, 2.5f,
                                                    3.0f, 4.0f, 5.33f, 6.67f, 8.0f, 9.5f};
        static constexpr float kLevel[kPartials] = {0.45f, 1.0f, 0.8f, 0.4f, 0.9f, 0.45f,
                                                    0.5f, 0.45f, 0.3f, 0.2f, 0.14f, 0.1f};
        for (int k = 0; k < kPartials; ++k) {
          shape[k] = {kRatio[k], 0.0f, kLevel[k], std::pow(kRatio[k] * 2.0f, 0.7f), false};
        }
        *ring = kit::clamp(16.0f * std::pow(hz / 220.0f, -0.4f), 2.0f, 30.0f);
        return kPartials;
      }
      case kPluck: {
        harmonics(hz, 6000.0f, 40.0f, number, band);
        for (int k = 0; k < kPartials; ++k) {
          const float n = static_cast<float>(number[k]);
          // The comb of a string plucked a fifth of the way along.
          const float comb = 0.35f + 0.65f * std::fabs(std::sin(kit::kPi * n * 0.21f));
          shape[k] = {n * std::sqrt((1.0f + 2.0e-5f * n * n) / (1.0f + 2.0e-5f)), 0.0f,
                      std::pow(n, -1.5f) * comb * band[k], n, false};
        }
        *ring = kit::clamp(4.5f * std::pow(hz / 110.0f, -0.45f), 0.6f, 9.0f);
        return kPartials;
      }
      case kBowl: {
        // Six rim modes, each a pair a little apart whose centre is the mode.
        static constexpr float kRatio[6] = {1.0f, 2.77f, 5.17f, 8.14f, 11.64f, 15.6f};
        static constexpr float kLevel[6] = {1.0f, 0.6f, 0.34f, 0.2f, 0.11f, 0.06f};
        for (int pair = 0; pair < 6; ++pair) {
          // The halves stay within a few cents of the mode down the keyboard.
          const float apart = (0.6f + 0.36f * static_cast<float>(pair)) * kit::clamp(hz / 220.0f, 0.12f, 2.0f);
          const float rate = std::pow(kRatio[pair], 0.55f);
          shape[2 * pair] = {kRatio[pair], -0.4f * apart, 0.6f * kLevel[pair], rate, false};
          shape[2 * pair + 1] = {kRatio[pair], 0.6f * apart, 0.4f * kLevel[pair], rate, true};
        }
        *ring = kit::clamp(20.0f * std::pow(hz / 220.0f, -0.3f), 3.0f, 30.0f);
        return kPartials;
      }
      case kPiano:
      default: {
        harmonics(hz, 7000.0f, 48.0f, number, band);
        // Stiffness sharpens the upper partials, more so up the keyboard.
        const float stiff = kit::min(0.012f, 2.0e-4f * (1.0f + (hz / 350.0f) * (hz / 350.0f)));
        for (int k = 0; k < kPartials; ++k) {
          const float n = static_cast<float>(number[k]);
          // The comb of a hammer an eighth of the way along, softened.
          const float comb = 0.55f + 0.45f * std::fabs(std::sin(kit::kPi * n * 0.118f));
          shape[k] = {n * std::sqrt((1.0f + stiff * n * n) / (1.0f + stiff)), 0.0f,
                      std::pow(n, -1.15f) * comb * band[k], std::pow(n, 0.65f), false};
        }
        *ring = kit::clamp(11.0f * std::pow(hz / 110.0f, -0.55f), 1.2f, 22.0f);
        return kPartials;
      }
    }
  }

  struct Voice {
    // Per partial: the phasor, its turn per sample at pitch and with this
    // tick's wobble, and the four gains with their ramps (left and right, on
    // the phasor's imaginary and real sides).
    float re[kPartials] = {}, im[kPartials] = {};
    float turn_re[kPartials] = {}, turn_im[kPartials] = {};
    float step_re[kPartials] = {}, step_im[kPartials] = {};
    float gain[4][kPartials] = {}, ramp[4][kPartials] = {};
    float angle[kPartials] = {};      // radians per sample
    float phase[kPartials] = {};      // cycles, where the phasor stood when the note began
    float body[kPartials] = {};       // the envelope: 0 dormant, 1 at the strike
    float depth[kPartials] = {};      // nepers under the strike level at the key
    float wake[kPartials] = {};       // the place in the swell where the partial starts
    float rate[kPartials] = {};       // growth per tick, nepers
    float ratio[kPartials] = {};      // ... and as a factor
    float natural[kPartials] = {};    // forward time constant at Tail 1, seconds
    float fall[kPartials] = {};       // decay per tick after the strike
    float fade[kPartials] = {};       // ... and per sample: the phasor's radius once it has struck
    float weight[3][kPartials] = {};  // level at the strike: Tone 0, 0.5 and 1
    float wash[kPartials] = {};       // the ghost's level
    float beat_re[kPartials] = {}, beat_im[kPartials] = {};  // Shimmer: half the angle between the copies
    float walk[8][kPartials] = {};    // Ghost: four random walks of two stages
    float still[4][kPartials] = {};   // ... and the steady half of the wash they move about
    float steer[kPartials] = {};      // the last stretch before the strike: extra turn per sample
    float nudge[kPartials] = {};      // ... and extra turn of the Shimmer beat per tick (see meet)
    bool live[kPartials] = {};
    bool mate[kPartials] = {};        // the upper half of a beating pair with the partial before it
    bool steered = false;
    int count = 0;
    float amp = 0.0f;            // from the key's velocity
    float place = 0.0f;          // u: 0 at the key, 1 at the strike
    float pace = 0.0f;           // u per tick
    float hover = 1.0f;          // on release: the share of `pace` still left
    float hover_decay = 1.0f;
    float hover_at = 0.7f;       // on release: the curve slows from here
    float ghost_depth = 0.0f;
    int ticks_left = -1;         // to the strike; -1 while a held key has not set it
    int age = 0;                 // ticks since the note began
    double warp = 0.0;           // samples the tape has gained on the clock since then
    bool on_release = false;
    bool key_up = false;
    bool landed = false;
    float prompt = 0.0f;         // the strike's surge, 1 at the strike
    float tail_seen = -1.0f;     // the Tail value `fall` was made from
    float stop = 0.0f;           // time constant of a note that stops dead, seconds
    float follow = 0.0f;         // loudness, for stealing
    float share = 1.0f;          // its part of a strike that several notes make together
    float share_goal = 1.0f;
    float hover_share = 0.0f;    // how fast it moves there while it hovers, per tick
    long long strike_tick = 0;   // the control tick it strikes on, once that is known
    // The hammer.
    kit::Svf hammer;
    float burst = 0.0f, burst_ramp = 0.0f, burst_shape = 0.0f, burst_trim = 0.0f;
    bool burst_on = false;
    // Being stolen.
    float steal = 1.0f;
    float next_frequency = 440.0f, next_gain = 0.0f;
    bool next_let_go = false;  // the waiting note's key is already up
    bool sounding = false, pending = false;
    kit::Rng rng;

    bool active() const { return sounding; }
    // "Held" is a key that is down and has not struck: what note_off looks for.
    bool releasing() const { return pending ? next_let_go : (landed || key_up); }
    // A note on its way to a strike counts as the strike; a tail as what is left.
    float level() const { return pending ? next_gain : (landed ? follow : amp); }
  };

  // What the knobs say at a control tick, already smoothed.
  struct Tick {
    float tail, tone;
    float prompt;       // height of the strike's surge
    float burst;        // hammer noise level
    float ghost;        // wash level
    float side;         // how far the wash differs left and right
    float beat;         // Shimmer: half the copies' detune, as an angle per tick over a partial's angle per sample
    float wow;          // this tick's speed error
  };

  void start(int index, float frequency, float gain) {
    using namespace rewind;
    Voice& voice = pool_.voices[index];
    const float sr = sample_rate();
    const kit::Rng rng = voice.rng;
    voice = Voice();
    voice.rng = rng;
    voice.sounding = true;
    const int source = kit::clamp_int(static_cast<int>(param(kSource) + 0.5f), 0, kNumSources - 1);
    voice.on_release = param(kStrike) > 0.5f;
    voice.stop = kit::clamp(kStopPeriods / frequency, kStopSeconds, kSlowestStop);

    Shape shape[kPartials];
    float ring = 1.0f;
    const int found = build(source, frequency, shape, &ring);
    const float top = kit::min(kTopHz, 0.45f * sr);
    const float slowest = kit::lerp(std::log(kShallowRise), std::log(kDeepRise), param(kRise));
    const float deep = std::exp(slowest);
    const int ticks = kit::clamp_int(static_cast<int>(param(kSwell) * tick_rate_ + 0.5f), 8, 1 << 24);
    float sum[3] = {0.0f, 0.0f, 0.0f}, power[3] = {0.0f, 0.0f, 0.0f};
    double cycles[kPartials];  // per sample
    int order[kPartials];      // place in the phase pattern: the halves of a pair share one
    int places = 0;
    int count = 0;
    for (int k = 0; k < found; ++k) {
      const double hz = static_cast<double>(frequency) * shape[k].ratio + shape[k].offset_hz;
      if (hz > top || hz < kLowestHz) continue;
      const double w = 2.0 * 3.14159265358979323846 * hz / sr;
      cycles[count] = hz / sr;
      voice.mate[count] = shape[k].paired && count > 0;
      order[count] = voice.mate[count] ? order[count - 1] : places++;
      voice.turn_re[count] = static_cast<float>(std::cos(w));
      voice.turn_im[count] = static_cast<float>(std::sin(w));
      voice.angle[count] = static_cast<float>(w);
      voice.depth[count] = kit::min(deep * shape[k].rate, kDeepest);
      voice.wake[count] = 1.0f - kDormant / voice.depth[count];
      voice.natural[count] = ring / (kSixtyDb * shape[k].rate);
      // Tone tilts the levels about the played note.
      const float dark = shape[k].level * std::pow(shape[k].ratio, -1.2f);
      const float bright = shape[k].level * std::pow(shape[k].ratio, 0.9f);
      voice.weight[0][count] = dark;
      voice.weight[1][count] = shape[k].level;
      voice.weight[2][count] = bright;
      sum[0] += dark;
      sum[1] += shape[k].level;
      sum[2] += bright;
      power[0] += dark * dark;
      power[1] += shape[k].level * shape[k].level;
      power[2] += bright * bright;
      if (voice.mate[count]) {
        // The halves of a pair meet on the strike: there they are one partial.
        for (int set = 0; set < 3; ++set) power[set] += 2.0f * voice.weight[set][count] * voice.weight[set][count - 1];
      }
      // A room keeps less of the top.
      voice.wash[count] = shape[k].level * kit::min(1.0f, std::pow(shape[k].ratio, -0.3f));
      if (voice.mate[count]) {
        // A pair has one wash, on its lower half: two would beat with each other.
        voice.wash[count - 1] += voice.wash[count];
        voice.wash[count] = 0.0f;
      }
      // The steady half of the wash, as strong as the moving half: in the
      // middle the partial a quarter turn from the note (so the two add in
      // power whatever the key, and the wash is as loud on every one), on the
      // side at a phase of its own.
      const float turn = voice.rng.uniform();
      voice.still[0][count] = 0.0f;
      voice.still[1][count] = 1.41421356f;
      voice.still[2][count] = 1.41421356f * kit::SineTable::lookup(turn);
      voice.still[3][count] = 1.41421356f * kit::SineTable::cos_lookup(turn);
      ++count;
    }
    voice.count = count;
    // Where each phasor stands at the strike is set, not drawn: partial m at
    // m(m + 1)/2M of a turn, the pattern that spreads a set of partials most
    // evenly over the cycle, so the strike is as loud as its partials and not
    // as tall as their sum, and is the same every time. Each voice turns the
    // whole pattern by its own amount, so a chord's strikes do not pile up.
    // From there the phases are wound back to the key: by the swell's length
    // and by what the tape's wow will add to it. (Under a held key the strike
    // is not known, and the pattern is where the note begins.)
    const double own = index * 0.6180339887498949;
    const double span =
        voice.on_release ? 0.0 : static_cast<double>(ticks) * kChunk * (1.0 + wow_ahead(ticks));
    for (int k = 0; k < count; ++k) {
      const double at_strike = own + 0.5 * order[k] * (order[k] + 1) / static_cast<double>(places);
      const double at_key = at_strike - cycles[k] * span;
      voice.phase[k] = static_cast<float>(at_key - std::floor(at_key));
    }
    // Levelled half by what the partials add up to (the most a strike can
    // peak at) and half by their power (how loud it is), so neither a dark
    // nor a bright setting, nor a source with few partials, jumps out.
    float norm[3];
    for (int set = 0; set < 3; ++set) norm[set] = 1.0f / std::sqrt(sum[set] * std::sqrt(power[set]));
    for (int k = 0; k < count; ++k) {
      for (int set = 0; set < 3; ++set) voice.weight[set][k] *= norm[set];
      voice.wash[k] *= norm[1];
    }
    voice.ghost_depth = 0.5f * deep + 0.6f;
    // Under a held key the note comes to rest short of its strike: far
    // enough that the strike is a strike however shallow Rise makes the climb.
    const float short_of = kit::clamp(kHoverUnder / deep, kHoverShort, 0.5f);
    voice.hover_at = 1.0f - short_of - kHoverSpan;
    voice.amp = std::pow(kit::min(frequency, kTiltTop) / 220.0f, kKeyTilt) * gain * (0.4f + 0.6f * gain) *
                note_gain(voice, static_cast<float>(ticks) / tick_rate_, short_of);
    voice.follow = voice.amp;

    voice.ticks_left = voice.on_release ? -1 : ticks;
    voice.strike_tick = clock_ + ticks;
    gather();
    voice.share = voice.share_goal;  // nothing of it sounds yet
    voice.hover_decay = 1.0f - 1.0f / (kHoverSpan * static_cast<float>(ticks));
    voice.hover_share = 1.0f / (kHoverShare * static_cast<float>(ticks));
    set_pace(voice, 1.0f / static_cast<float>(ticks));

    // The hammer sits around the fourth harmonic and is as loud on every key.
    const float centre = kit::clamp(4.0f * frequency, 400.0f, 5000.0f);
    voice.hammer.set(centre, 0.9f, sr);
    voice.burst_trim = std::sqrt(1000.0f / centre) * noise_scale_;
  }

  // The gain of a note, so that every sound the knobs can make is as loud.
  // What is levelled is the note's loudest 400 ms, the stretch around its
  // strike, whose energy is known in closed form: partial k climbs to the
  // strike as exp(-c_k t), falls from it as exp(-d_k t), and Snap's surge
  // stands on both sides. A short note that stops dead has little in it and
  // would have to strike very hard to be as loud as one that rings, so the
  // strike is held under a ceiling and such a note is softer than the rest.
  // Read when the note starts, from where Tail and Snap are going.
  float note_gain(const Voice& voice, float swell, float short_of) const {
    const float tail = tail_.target * tail_.target;
    const float surge = kPromptMost * snap_.target;
    // Under a held key the last climb is the surge after the key is let go,
    // from where the note hovered; before that it stands at the hover.
    const float climb = voice.on_release ? kSurgeSeconds / short_of : swell;
    const float reach = voice.on_release ? kSurgeSeconds : kit::min(swell, kLoudest);
    float most = 0.0f;
    for (int step = 0; step <= 4; ++step) {
      const float before = kLoudest * 0.25f * static_cast<float>(step);
      const float after = kLoudest - before;
      const float rising = kit::min(before, reach);
      float energy = 0.0f;
      float half = 0.0f;  // the lower half of a pair: the two are in step around the strike
      for (int k = 0; k < voice.count; ++k) {
        float weight = voice.weight[1][k];  // as at Tone 0.5: Tone itself trades body for edge
        if (k + 1 < voice.count && voice.mate[k + 1]) {
          half = weight;
          continue;
        }
        if (voice.mate[k]) weight += half;
        const float c = 2.0f * voice.depth[k] / climb;
        const float d = 2.0f / (voice.stop + tail * voice.natural[k]);
        float part = (1.0f - std::exp(-c * rising)) / c + (1.0f - std::exp(-d * after)) / d;
        if (voice.on_release && before > reach) part += std::exp(-2.0f * voice.depth[k] * short_of) * (before - reach);
        const float fast = 1.0f / kPromptSeconds;
        part += surge * (2.0f / (fast + c) + 2.0f / (fast + d)) +
                surge * surge * (1.0f / (2.0f * fast + c) + 1.0f / (2.0f * fast + d));
        energy += weight * weight * part;
      }
      most = kit::max(most, energy);
    }
    const float loud = std::sqrt(0.5f * most / kLoudest);  // RMS of the loudest stretch, for a gain of one
    return kit::min(kLoudness / kit::max(loud, 1.0e-6f), kTallest / (1.0f + surge + kHammerTall * snap_.target));
  }

  // The swell moves `pace` of its way every tick from here on.
  void set_pace(Voice& voice, float pace) {
    voice.pace = pace;
    for (int k = 0; k < voice.count; ++k) {
      voice.rate[k] = voice.depth[k] * pace;
      voice.ratio[k] = std::exp(voice.rate[k]);
    }
  }

  // The mean speed error of the tape over the next `ticks` control ticks, if
  // Wobble stays where it is: the sum of each of its two sines in closed form.
  double wow_ahead(int ticks) const {
    const double depth = wow_depth(wobble_.target);
    if (depth == 0.0) return 0.0;
    auto mean = [ticks](double phase, double step) {
      const double pi = 3.14159265358979323846;
      return std::sin(pi * ticks * step) * std::sin(2.0 * pi * phase + pi * (ticks - 1) * step) /
             (std::sin(pi * step) * ticks);
    };
    return depth * (kWowSlowShare * mean(wow_slow_, kWowSlowHz / tick_rate_) +
                    (1.0 - kWowSlowShare) * mean(wow_fast_, kWowFastHz / tick_rate_));
  }

  static float wow_depth(float wobble) { return kMaxWow * wobble * std::sqrt(wobble); }

  // The strike is one surge away. Whatever beats inside the note is brought
  // round to meet on it: the two copies of Shimmer in step, the halves of a
  // beating pair together. Each side gives way by half, so the pitch between
  // them stays where it is and only the beat hurries or waits. After swell
  // this corrects next to nothing (the note was wound back from its strike)
  // unless Shimmer was turned on the way; under a held key, where the strike
  // was not known, it is what makes every strike as strong as the last.
  void meet(Voice& voice, const Tick& tick) {
    const int ticks = voice.ticks_left + 1;  // control ticks to the strike, this one included
    const float per_tick = 1.0f / static_cast<float>(ticks);
    const float per_sample = per_tick * (1.0f / kChunk);
    float odd = 0.0f;  // whether the partial before this one meets half a turn round
    for (int k = 0; k < voice.count; ++k) {
      if (!voice.live[k]) continue;  // a partial that starts later is placed to meet (see advance)
      if (tick.beat > 0.0f) {
        // The copies are in step at every half turn of the beat (at the odd
        // ones the partial is upside down, so the halves of a pair take the
        // same one).
        const float ahead = (std::atan2(voice.beat_im[k], voice.beat_re[k]) +
                             voice.angle[k] * tick.beat * static_cast<float>(ticks)) * (1.0f / kit::kPi);
        const bool paired = voice.mate[k] && voice.live[k - 1];
        const float turns = paired ? 2.0f * std::floor((ahead - odd) * 0.5f + 0.5f) + odd : std::floor(ahead + 0.5f);
        odd = turns - 2.0f * std::floor(turns * 0.5f);
        voice.nudge[k] = (turns - ahead) * kit::kPi * per_tick;
      }
      if (voice.mate[k] && voice.live[k - 1]) {
        const float cross = voice.im[k] * voice.re[k - 1] - voice.re[k] * voice.im[k - 1];
        const float dot = voice.re[k] * voice.re[k - 1] + voice.im[k] * voice.im[k - 1];
        const float ahead = std::atan2(cross, dot) +
                            (voice.angle[k] - voice.angle[k - 1]) * static_cast<float>(ticks * kChunk);
        const float off = ahead - kit::kTwoPi * std::floor(ahead * (1.0f / kit::kTwoPi) + 0.5f);
        voice.steer[k] = -0.5f * off * per_sample;
        voice.steer[k - 1] = 0.5f * off * per_sample;
      }
    }
    voice.steered = true;
  }

  // The key is let go. On release, that sets the strike.
  void release(Voice& voice) {
    if (voice.key_up) return;
    voice.key_up = true;
    if (!voice.on_release || voice.landed) return;
    voice.ticks_left = surge_ticks_;
    voice.strike_tick = clock_ + surge_ticks_;
    set_pace(voice, (1.0f - voice.place) / static_cast<float>(surge_ticks_));
    gather();
  }

  // Notes that strike together share the peak: each is turned down by the
  // fourth root of how many there are, so a chord of eight lands 4.5 dB over
  // one note and not 9, and a full chord at full velocity stays clear of the
  // clip. Strikes count as together when they are under 40 ms apart, less
  // the further apart; notes hovering under held keys count as one group,
  // since nobody knows yet when they will be let go. Worked out when a note
  // starts or is let go; a note moves to its share in a few milliseconds if
  // its strike is known (it is silent or surging then), and if it hovers no
  // faster than the keys that join it come up, so a held note does not duck.
  void gather() {
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.sounding || voice.pending || voice.landed) continue;
      float together = 0.0f;
      for (int other = 0; other < kMaxVoices; ++other) {
        const Voice& with = pool_.voices[other];
        if (!with.sounding || with.pending || with.landed) continue;
        const bool known = voice.ticks_left >= 0, also = with.ticks_left >= 0;
        if (known && also) {
          const long long apart = voice.strike_tick - with.strike_tick;
          together += kit::max(0.0f, 1.0f - static_cast<float>(apart < 0 ? -apart : apart) * near_);
        } else if (!known && !also) {
          together += 1.0f;
        }
      }
      voice.share_goal = 1.0f / std::sqrt(std::sqrt(kit::max(together, 1.0f)));
    }
  }

  // Everything that runs on through a silence, put where a fresh start has
  // it: the first note after a silence is the first note after init().
  void restart() {
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) {
      pool_.voices[v].rng.seed(0x5EED0001u + 7919u * static_cast<uint32_t>(v));
    }
    chunk_left_ = 0;
    clock_ = 0;
    wow_slow_ = 0.0;
    wow_fast_ = 0.0;
    for (kit::Smoother* knob : {&tail_, &snap_, &tone_, &ghost_, &wobble_, &shimmer_, &width_, &volume_}) {
      knob->snap(knob->target);
    }
    placed_width_ = -1.0f;  // the pan tables are made again at the next tick
  }

  // Every kChunk samples: the knobs, the tape's speed, and where each note
  // will be one tick from now.
  void control() {
    Tick tick;
    tick.tail = tail_.next();
    tick.tone = tone_.next();
    const float snap = snap_.next();
    tick.prompt = kPromptMost * snap;
    tick.burst = kBurstGain * snap;
    const float width = width_.next();
    const float shimmer = shimmer_.next();
    tick.ghost = kGhostGain * ghost_.next() / std::sqrt(2.0f * (1.0f + width * width));
    tick.side = width;
    tick.beat = 0.5f * kMaxDetune * shimmer * static_cast<float>(kChunk);
    if (width != placed_width_ || shimmer != placed_shimmer_) place(width, shimmer);

    // Wow: two slow sines that never line up the same way twice in a phrase.
    tick.wow = static_cast<float>(
        wow_depth(wobble_.next()) * (kWowSlowShare * std::sin(6.283185307179586 * wow_slow_) +
                                     (1.0 - kWowSlowShare) * std::sin(6.283185307179586 * wow_fast_)));
    wow_slow_ += kWowSlowHz / tick_rate_;
    wow_slow_ -= std::floor(wow_slow_);
    wow_fast_ += kWowFastHz / tick_rate_;
    wow_fast_ -= std::floor(wow_fast_);

    for (int v = 0; v < kMaxVoices; ++v) {
      if (pool_.voices[v].sounding) advance(pool_.voices[v], tick);
    }
    ++clock_;
  }

  // Where the two copies of each partial sit, and so what the pair adds up
  // to on each side: `sum` on the phasor's own side (the copies in step),
  // `apart` on the other (one copy ahead, one behind).
  void place(float width, float shimmer) {
    static constexpr float kPan[kPartials] = {0.0f, -0.5f, 0.5f, -0.8f, 0.8f, -0.3f,
                                              0.3f, -1.0f, 1.0f, -0.6f, 0.6f, 0.0f};
    // The second copy comes up quickly and reaches the first one's level.
    // The two stand apart about the partial's own place, each as far from it
    // as the other is strong, so a faint second copy does not pull the note
    // to one side; which side it is on alternates up the partials.
    const float second = 0.5f * std::sqrt(shimmer);
    const float first = 1.0f - second;
    const float apart = 1.6f * width * 2.0f * second;
    const float share = second * second / (first * first + second * second);
    for (int k = 0; k < kPartials; ++k) {
      const float centre = 0.5f * width * kPan[k];
      const float side = (k & 1) != 0 ? -apart : apart;
      float left_a, right_a, left_b, right_b;
      kit::pan_gains(centre - side * share, &left_a, &right_a);
      kit::pan_gains(centre + side * (1.0f - share), &left_b, &right_b);
      sum_left_[k] = left_a * first + left_b * second;
      sum_right_[k] = right_a * first + right_b * second;
      apart_left_[k] = left_b * second - left_a * first;
      apart_right_[k] = right_b * second - right_a * first;
    }
    placed_width_ = width;
    placed_shimmer_ = shimmer;
  }

  void advance(Voice& voice, const Tick& tick) {
    // The place in the swell one tick from now.
    enum Regime : int { kSteady, kSlowing, kAfter };
    int regime = kAfter;
    bool strikes = false;
    if (!voice.landed) {
      regime = kSteady;
      if (voice.ticks_left > 0) {
        voice.place += voice.pace;
        if (--voice.ticks_left == 0) strikes = true;
      } else if (voice.place < voice.hover_at) {
        voice.place += voice.pace;
      } else {
        // A held key: each tick goes a little less far, and the note comes to rest.
        regime = kSlowing;
        voice.hover *= voice.hover_decay;
        if (voice.hover < 1.0e-4f) voice.hover = 0.0f;
        voice.place += voice.pace * voice.hover;
      }
      if (strikes || voice.place > 1.0f) voice.place = 1.0f;
      if (voice.ticks_left + 1 == surge_ticks_) meet(voice, tick);
    } else {
      if (voice.steered) {
        for (int k = 0; k < voice.count; ++k) voice.steer[k] = voice.nudge[k] = 0.0f;
        voice.steered = false;
      }
    }
    if (voice.landed && voice.tail_seen != tick.tail) {
      const float scale = tick.tail * tick.tail;
      for (int k = 0; k < voice.count; ++k) {
        const float per_tick = -1.0f / (tick_rate_ * (voice.stop + scale * voice.natural[k]));
        voice.fall[k] = std::exp(per_tick);
        voice.fade[k] = std::exp(per_tick * (1.0f / kChunk));
      }
      voice.tail_seen = tick.tail;
    }
    const float u = voice.place;
    if (!voice.landed) {
      voice.share += (voice.share_goal - voice.share) * (voice.ticks_left >= 0 ? share_rate_ : voice.hover_share);
    }
    const float amp = voice.amp * voice.share;

    // The strike's own surge and the hammer, both set from the time left.
    float burst = 0.0f;
    if (regime == kAfter) {
      voice.prompt *= prompt_fall_;
      voice.burst_shape *= burst_fall_;
      if (voice.burst_shape < 1.0e-7f) voice.burst_shape = 0.0f;
    } else if (voice.ticks_left >= 0) {
      voice.prompt = voice.ticks_left <= prompt_ticks_
                         ? std::exp(-static_cast<float>(voice.ticks_left) * prompt_rate_)
                         : 0.0f;
      if (voice.ticks_left <= burst_ticks_) {
        if (!voice.burst_on) {
          voice.hammer.reset();
          voice.burst_on = true;
        }
        voice.burst_shape = std::exp(-static_cast<float>(voice.ticks_left) * burst_rate_);
      }
    }
    if (voice.burst_on) {
      burst = amp * tick.burst * voice.burst_trim * voice.burst_shape;
      if (burst < 1.0e-9f) burst = 0.0f;
      voice.burst_ramp = (burst - voice.burst) * (1.0f / kChunk);
      if (burst == 0.0f && std::fabs(voice.burst) < 1.0e-9f) {
        voice.burst = voice.burst_ramp = 0.0f;
        voice.burst_on = false;
      }
    }

    // Out of nothing: the first part of the swell fades in.
    float gate = 1.0f;
    if (regime != kAfter && u < kFadeIn) {
      const float x = u * (1.0f / kFadeIn);
      gate = x * x * (3.0f - 2.0f * x);
    }
    const float shape = amp * gate * (1.0f + tick.prompt * voice.prompt);
    // The ghost comes up earlier than the note and is gone at the strike.
    float ghost = 0.0f;
    if (regime != kAfter && !strikes && tick.ghost > 0.0f) {
      const float u2 = u * u;
      ghost = amp * gate * tick.ghost * std::exp(-voice.ghost_depth * (1.0f - u)) * (1.0f - u2 * u2);
    }
    const int low = tick.tone < 0.5f ? 0 : 1;
    const float blend = tick.tone * 2.0f - static_cast<float>(low);
    const float slowing = voice.hover;

    float total = 0.0f;
    for (int k = 0; k < voice.count; ++k) {
      // The envelope.
      float body = voice.body[k];
      const float was = body;
      if (regime == kAfter) {
        body *= voice.fall[k];
        if (body < 1.0e-9f) body = 0.0f;
      } else if (strikes) {
        body = 1.0f;
      } else if (body == 0.0f) {
        if (u >= voice.wake[k]) body = std::exp(-voice.depth[k] * (1.0f - u));
      } else if (regime == kSteady) {
        body *= voice.ratio[k];
      } else {
        const float x = voice.rate[k] * slowing;
        body *= 1.0f + x * (1.0f + x * (0.5f + x * (1.0f / 6.0f)));
      }
      voice.body[k] = body;
      const float weight =
          voice.weight[low][k] + (voice.weight[low + 1][k] - voice.weight[low][k]) * blend;
      const float level = body * weight;
      total += level;
      // Up to the strike the gain is the envelope and the phasor has unit
      // length; after it the phasor itself shrinks every sample, so a decay
      // of a few milliseconds is exact and not a chain of straight lines.
      const bool rings = regime == kAfter;
      const float heard = level * shape;
      const float note = rings ? weight * shape : heard;
      const float wash = ghost * voice.wash[k];
      const float radius = rings ? voice.fade[k] : 1.0f;
      const float length = rings ? was : 1.0f;  // where the phasor stands now, before this tick's decay

      float* const gain[4] = {&voice.gain[0][k], &voice.gain[1][k], &voice.gain[2][k], &voice.gain[3][k]};
      float* const ramp[4] = {&voice.ramp[0][k], &voice.ramp[1][k], &voice.ramp[2][k], &voice.ramp[3][k]};
      if (heard < kFloor && wash < kFloor) {
        // Nothing to hear: let what there is run out over this tick, then stop.
        if (!voice.live[k]) continue;
        bool gone = true;
        for (int g = 0; g < 4; ++g) gone = gone && std::fabs(*gain[g]) < 1.0e-9f;
        for (int g = 0; g < 4; ++g) {
          if (gone) *gain[g] = 0.0f;
          *ramp[g] = gone ? 0.0f : -*gain[g] * (1.0f / kChunk);
        }
        if (gone) voice.live[k] = false;
        if (!gone) keep_turning(voice, k, tick.wow, radius, length);
        continue;
      }
      if (!voice.live[k]) {
        // The partial starts where it would stand had it turned since the
        // key, and its two copies so far apart that they meet at the strike
        // (or, under a held key, start together). Once a held key is let
        // go the strike is known, and a partial that starts after that
        // stands where it will meet it: on its mate if that already sounds.
        const double cycles = static_cast<double>(voice.angle[k]) * (1.0 / 6.283185307179586);
        const bool known = voice.on_release && voice.ticks_left >= 0 && !voice.landed;
        const double to_strike = static_cast<double>(voice.ticks_left + 1) * kChunk;
        double turned = cycles * (static_cast<double>(voice.age) * kChunk + voice.warp);
        float from = voice.phase[k];
        if (known) {
          turned = -cycles * to_strike;
          if (voice.mate[k] && voice.live[k - 1]) {
            from = std::atan2(voice.im[k - 1], voice.re[k - 1]) * (1.0f / kit::kTwoPi);
            turned += static_cast<double>(voice.angle[k - 1] + voice.steer[k - 1]) * (1.0 / 6.283185307179586) * to_strike;
          }
        }
        const float phase = from + static_cast<float>(turned - std::floor(turned));
        voice.re[k] = kit::SineTable::cos_lookup(phase);
        voice.im[k] = kit::SineTable::lookup(phase);
        const double apart = voice.ticks_left >= 0 && !voice.landed
                                 ? -static_cast<double>(voice.angle[k]) * tick.beat * (voice.ticks_left + 1)
                                 : 0.0;
        voice.beat_re[k] = static_cast<float>(std::cos(apart));
        voice.beat_im[k] = static_cast<float>(std::sin(apart));
        if (known && voice.mate[k] && voice.live[k - 1]) {
          // ... and its copies beat as its mate's do.
          voice.beat_re[k] = voice.beat_re[k - 1];
          voice.beat_im[k] = voice.beat_im[k - 1];
          voice.nudge[k] = voice.nudge[k - 1];
        }
        for (int g = 0; g < 4; ++g) *gain[g] = 0.0f;
        for (int stage = 0; stage < 8; ++stage) voice.walk[stage][k] = 0.0f;
        voice.live[k] = true;
      }
      keep_turning(voice, k, tick.wow, radius, length);

      // Shimmer: the two copies turn against each other by this much a tick.
      const float half = voice.angle[k] * tick.beat + voice.nudge[k];
      const float half2 = half * half;
      const float turn_re = 1.0f - half2 * (0.5f - half2 * (1.0f / 24.0f));
      const float turn_im = half * (1.0f - half2 * ((1.0f / 6.0f) - half2 * (1.0f / 120.0f)));
      float beat_re = voice.beat_re[k] * turn_re - voice.beat_im[k] * turn_im;
      float beat_im = voice.beat_im[k] * turn_re + voice.beat_re[k] * turn_im;
      const float trim = 1.5f - 0.5f * (beat_re * beat_re + beat_im * beat_im);
      beat_re *= trim;
      beat_im *= trim;
      voice.beat_re[k] = beat_re;
      voice.beat_im[k] = beat_im;

      float target[4] = {note * sum_left_[k] * beat_re, note * apart_left_[k] * beat_im,
                         note * sum_right_[k] * beat_re, note * apart_right_[k] * beat_im};
      if (wash >= kFloor) {
        // Four slow random walks about four fixed values: the middle and
        // the side, on both of the phasor's sides.
        float value[4];
        for (int w = 0; w < 4; ++w) {
          float& first = voice.walk[2 * w][k];
          float& second = voice.walk[2 * w + 1][k];
          first = walk_pole_ * first + voice.rng.bipolar();
          second = walk_pole_ * second + first;
          value[w] = voice.still[w][k] + walk_gain_ * second;
        }
        // Each of the two keeps its length and only wanders in phase: the
        // wash moves, and between the speakers, but is as loud all the time.
        const float middle = 2.0f / std::sqrt(kit::max(value[0] * value[0] + value[1] * value[1], 1.0e-6f));
        const float aside = 2.0f / std::sqrt(kit::max(value[2] * value[2] + value[3] * value[3], 1.0e-6f));
        value[0] *= middle;
        value[1] *= middle;
        value[2] *= aside;
        value[3] *= aside;
        const float side_im = tick.side * value[2];
        const float side_re = tick.side * value[3];
        target[0] += wash * (value[0] + side_im);
        target[1] += wash * (value[1] + side_re);
        target[2] += wash * (value[0] - side_im);
        target[3] += wash * (value[1] - side_re);
      }
      for (int g = 0; g < 4; ++g) *ramp[g] = (target[g] - *gain[g]) * (1.0f / kChunk);
    }

    ++voice.age;
    voice.warp += static_cast<double>(tick.wow) * kChunk;
    if (strikes) voice.landed = true;
    if (voice.landed) {
      voice.follow = amp * total;
      // Rung out: the note is over once nothing of it is left to ramp down.
      if (!strikes && voice.follow < kFloor && !voice.burst_on && !voice.pending) {
        bool any = false;
        for (int k = 0; k < voice.count; ++k) any = any || voice.live[k];
        if (!any) retire(voice);
      }
    }
  }

  // Bring the phasor back to the length it should have (rounding walks it
  // off), and set its step for this tick: the turn at this tick's tape speed,
  // shrunk by `radius` a sample.
  static void keep_turning(Voice& voice, int k, float wow, float radius, float length) {
    if (length > 0.0f) {
      float square = voice.re[k] * voice.re[k] + voice.im[k] * voice.im[k];
      if (length != 1.0f) square /= length * length;
      const float trim = 1.5f - 0.5f * kit::clamp(square, 0.5f, 1.5f);
      voice.re[k] *= trim;
      voice.im[k] *= trim;
    }
    const float extra = voice.angle[k] * wow + voice.steer[k];
    const float along = radius * (1.0f - 0.5f * extra * extra);
    const float across = radius * extra;
    voice.step_re[k] = voice.turn_re[k] * along - voice.turn_im[k] * across;
    voice.step_im[k] = voice.turn_im[k] * along + voice.turn_re[k] * across;
  }

  void retire(Voice& voice) {
    voice.sounding = voice.pending = false;
    voice.follow = 0.0f;
  }

  void render_voice(Voice& voice, int n, float* left, float* right) {
    const bool leaving = voice.pending;
    float own_left[kChunk], own_right[kChunk];
    float* out_left = left;
    float* out_right = right;
    if (leaving) {
      for (int i = 0; i < n; ++i) own_left[i] = own_right[i] = 0.0f;
      out_left = own_left;
      out_right = own_right;
    }
    // Two partials at a time: each is a chain of its own from sample to
    // sample, and two chains side by side cost little more than one. Every
    // sample still takes its partials in order, so the sum is the same.
    int sounding[kPartials];
    int some = 0;
    for (int k = 0; k < voice.count; ++k) {
      if (voice.live[k]) sounding[some++] = k;
    }
    int at = 0;
    for (; at + 1 < some; at += 2) {
      const int a = sounding[at], b = sounding[at + 1];
      float re_a = voice.re[a], im_a = voice.im[a], re_b = voice.re[b], im_b = voice.im[b];
      const float step_re_a = voice.step_re[a], step_im_a = voice.step_im[a];
      const float step_re_b = voice.step_re[b], step_im_b = voice.step_im[b];
      float gain_a[4] = {voice.gain[0][a], voice.gain[1][a], voice.gain[2][a], voice.gain[3][a]};
      float gain_b[4] = {voice.gain[0][b], voice.gain[1][b], voice.gain[2][b], voice.gain[3][b]};
      const float ramp_a[4] = {voice.ramp[0][a], voice.ramp[1][a], voice.ramp[2][a], voice.ramp[3][a]};
      const float ramp_b[4] = {voice.ramp[0][b], voice.ramp[1][b], voice.ramp[2][b], voice.ramp[3][b]};
      for (int i = 0; i < n; ++i) {
        const float turned_a = step_re_a * re_a - step_im_a * im_a;
        const float turned_b = step_re_b * re_b - step_im_b * im_b;
        im_a = step_re_a * im_a + step_im_a * re_a;
        im_b = step_re_b * im_b + step_im_b * re_b;
        re_a = turned_a;
        re_b = turned_b;
        for (int g = 0; g < 4; ++g) gain_a[g] += ramp_a[g], gain_b[g] += ramp_b[g];
        float l = out_left[i], r = out_right[i];
        l += gain_a[0] * im_a + gain_a[1] * re_a;
        r += gain_a[2] * im_a + gain_a[3] * re_a;
        l += gain_b[0] * im_b + gain_b[1] * re_b;
        r += gain_b[2] * im_b + gain_b[3] * re_b;
        out_left[i] = l;
        out_right[i] = r;
      }
      voice.re[a] = re_a, voice.im[a] = im_a, voice.re[b] = re_b, voice.im[b] = im_b;
      for (int g = 0; g < 4; ++g) voice.gain[g][a] = gain_a[g], voice.gain[g][b] = gain_b[g];
    }
    for (; at < some; ++at) {
      const int k = sounding[at];
      float re = voice.re[k], im = voice.im[k];
      const float step_re = voice.step_re[k], step_im = voice.step_im[k];
      float left_im = voice.gain[0][k], left_re = voice.gain[1][k];
      float right_im = voice.gain[2][k], right_re = voice.gain[3][k];
      const float ramp0 = voice.ramp[0][k], ramp1 = voice.ramp[1][k];
      const float ramp2 = voice.ramp[2][k], ramp3 = voice.ramp[3][k];
      for (int i = 0; i < n; ++i) {
        const float turned = step_re * re - step_im * im;
        im = step_re * im + step_im * re;
        re = turned;
        left_im += ramp0;
        left_re += ramp1;
        right_im += ramp2;
        right_re += ramp3;
        out_left[i] += left_im * im + left_re * re;
        out_right[i] += right_im * im + right_re * re;
      }
      voice.re[k] = re;
      voice.im[k] = im;
      voice.gain[0][k] = left_im;
      voice.gain[1][k] = left_re;
      voice.gain[2][k] = right_im;
      voice.gain[3][k] = right_re;
    }
    if (voice.burst_on) {
      float level = voice.burst;
      for (int i = 0; i < n; ++i) {
        level += voice.burst_ramp;
        const float noise = voice.hammer.bandpass(voice.rng.bipolar()) * level;
        out_left[i] += noise;
        out_right[i] += noise;
      }
      voice.burst = level;
    }
    if (!leaving) return;
    // A stolen voice: out over 2 ms, then the note that waits for it.
    for (int i = 0; i < n; ++i) {
      voice.steal = kit::max(voice.steal - steal_step_, 0.0f);
      left[i] += own_left[i] * voice.steal;
      right[i] += own_right[i] * voice.steal;
    }
    if (voice.steal <= 0.0f) {
      const bool let_go = voice.next_let_go;
      start(static_cast<int>(&voice - pool_.voices), voice.next_frequency, voice.next_gain);
      if (let_go) release(voice);
    }
  }

  void apply(int id) {
    using namespace rewind;
    const float value = param(id);
    const bool glide = primed();
    switch (id) {
      case kTail:
        tail_.set(value, glide);
        break;
      case kSnap:
        snap_.set(value, glide);
        break;
      case kTone:
        tone_.set(value, glide);
        break;
      case kGhost:
        ghost_.set(value, glide);
        break;
      case kWobble:
        wobble_.set(value, glide);
        break;
      case kShimmer:
        shimmer_.set(value, glide);
        break;
      case kWidth:
        width_.set(value, glide);
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(value), glide);
        break;
      default:
        break;  // source, strike, swell, rise: read when a note starts
    }
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::Smoother tail_, snap_, tone_, ghost_, wobble_, shimmer_, width_;  // per control tick
  kit::Smoother volume_;                                                // per sample
  kit::IdleGate idle_;
  float sum_left_[kPartials] = {}, sum_right_[kPartials] = {};
  float apart_left_[kPartials] = {}, apart_right_[kPartials] = {};
  float placed_width_ = -1.0f, placed_shimmer_ = -1.0f;
  float tick_rate_ = 1500.0f;
  float steal_step_ = 0.0f;
  float noise_scale_ = 1.0f;
  float prompt_rate_ = 0.0f, prompt_fall_ = 0.0f;
  float burst_rate_ = 0.0f, burst_fall_ = 0.0f;
  float walk_pole_ = 0.0f, walk_gain_ = 0.0f;
  float near_ = 0.0f, share_rate_ = 0.0f;
  long long clock_ = 0;  // control ticks since the last silence
  double wow_slow_ = 0.0, wow_fast_ = 0.0;  // cycles
  int surge_ticks_ = 1, burst_ticks_ = 1, prompt_ticks_ = 1;
  int chunk_left_ = 0;
};

}  // namespace livemix
