#pragma once

// Magnet Piano: piano strings sung by electromagnets instead of struck.
//
//   key down ─► three strings ─► twelve partials each ─┬─► soundboard ─► pan by string ─┐
//   (up to 12 keys)                                    │   (a gain per partial)         ├─► volume ─► soft clip ─► out
//        magnets: a bell over the partials ────────────┤                                │
//        hammer: a felt strike that dies away ─────────┤        other keys' partials ───┘
//        sympathy: what the other keys sound nearby ───┘        (the sympathy bus)
//
// - A string is a bank of sine partials at piano frequencies: partial n at
//   n·f·sqrt((1 + B·n²) / (1 + B)), so the fundamental is the played note
//   and the upper partials are stretched sharp. B rises from 1e-4 at the
//   bottom A to 2e-3 at the top C. Partials above 16 kHz do not exist.
// - A note is three strings: one in tune, one flat and one sharp by unequal
//   amounts (Shimmer), so they beat at three rates and never quite repeat.
//   Three sines a few cents apart are one sine whose size and phase turn
//   slowly, so each partial is ONE oscillator (a pair x, y that turns by its
//   frequency every sample and keeps its size exactly) read through four
//   weights, two for each side, that are set every control tick from where
//   the three strings stand and ramped per sample in between. The flat
//   string sits to the left and the sharp one to the right (Width). The one
//   in tune is the strong one and the outer two are 12 dB under it: three
//   equal strings cancel each other every few beats and a held note all but
//   vanishes, so the beating is kept to a rise and fall of a few decibels.
//   Width lifts what differs between the sides, not what they share, so a
//   wide note moves between left and right while its sum stays as steady.
// - The magnets feed a raised-cosine bell of partials centred on Harmonic
//   and as wide as Bright says; between two partials they feed both. The
//   bell is held at constant power, so the two knobs change colour and not
//   loudness. Sweep moves the centre along a slow path of the key's own,
//   turning back at the first partial and at the last the magnets reach.
// - Each partial swells toward what the magnets give it at its own pace:
//   Bloom is the time the fed partial takes to come within 3 dB, the ones
//   below it take longer and the ones above it less, as a driven resonance
//   does. Letting the key go drops the damper: everything falls 60 dB in
//   the Damper time.
// - Hammer is a felt strike: every partial jumps (over the few milliseconds
//   the felt touches the string) to a level that rolls off like a softly
//   struck piano string, then dies at its own rate, high partials first.
//   Strings that still ring from an earlier strike lose half of it to the
//   felt and the new blow joins the rest as energies do, so a key struck
//   again and again stays about one strike loud.
// - One pitch is one set of strings. A key pressed again carries on from
//   what its strings hold (same voice), and a new note at the pitch of a
//   let-go one that still rings takes its strings over and ends that voice.
// - Sympathy: every tick each sounding partial writes its size on a bus
//   laid out in pitch (bins a quarter of a semitone wide), and every partial
//   listens there for what the OTHER keys put near its own frequency and
//   rings along, rising in a fraction of a second and dying over seconds.
//   What rings in sympathy is not written back, so it cannot feed itself.
// - The soundboard is a gain per partial, which is all a filter can do to a
//   sine: a fixed gentle loss of the top, and with Body three broad wooden
//   resonances and a duller top.
//
// A partial too faint to hear (under -96 dBFS at the loudest Volume) is not
// rendered: most of what a strike or the other keys set ringing is, most of
// the time, and they are most of the cost.
//
// Nothing outlives the keys: the instrument sleeps when the last one has
// rung out below -120 dB.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class MagnetPiano : public kit::DeviceBase<magnet_piano::kNumParams> {
 public:
  static constexpr int kMaxVoices = 12;
  static constexpr int kPartials = 12;

  // Stiffness of the string of a note, and the partial frequencies it gives.
  static float stiffness(float hz) { return kStiffLow * std::pow(hz / kLowestHz, kStiffSlope); }
  static float partial_hz(float hz, int n) {
    const float b = stiffness(hz);
    const float number = static_cast<float>(n);
    return number * hz * std::sqrt((1.0f + b * number * number) / (1.0f + b));
  }

  void init(float sample_rate) {
    using namespace magnet_piano;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    pool_.reset();
    for (Voice& voice : pool_.voices) voice = Voice();
    paths_.seed(0x51ED270Bu);
    for (int n = 0; n < kPartials; ++n) root_[n] = std::sqrt(static_cast<float>(n + 1));
    for (float& bin : bus_) bin = 0.0f;

    period_ = static_cast<int>(sr * kControlSeconds + 0.5f);
    if (period_ < 16) period_ = 16;
    countdown_ = 0;
    tick_seconds_ = static_cast<float>(period_) / sr;
    const float tick_rate = 1.0f / tick_seconds_;
    steal_ticks_ = static_cast<int>(kStealSeconds * tick_rate + 0.5f);
    if (steal_ticks_ < 2) steal_ticks_ = 2;
    ring_rise_ = 1.0f - std::exp(-tick_seconds_ / kRingRiseSeconds);
    ring_fall_ = 1.0f - std::exp(-tick_seconds_ / kRingFallSeconds);

    harmonic_.set_time(kKnobSeconds, tick_rate);
    reach_.set_time(kKnobSeconds, tick_rate);
    sweep_.set_time(kKnobSeconds, tick_rate);
    body_.set_time(kKnobSeconds, tick_rate);
    width_.set_time(kKnobSeconds, tick_rate);
    volume_.set_time(kSmoothingSeconds, sr);
    serial_ = 1;
    idle_.reset(sr, 0.05f);
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
    // Out of silence every knob has arrived and the control clock restarts,
    // however long the silence was and whether or not the device slept.
    if (pool_.count_active() == 0) arrive();

    const int held = pool_.find_held(note_id);
    if (held >= 0) {
      Voice& again = pool_.voices[held];
      if (again.pending) {
        // Struck again before it could start: the waiting note is this one.
        again.pending_frequency = frequency;
        again.pending_gain = gain;
        again.loudness = level_for(gain);
        return;
      }
      if (again.frequency == frequency) {
        restrike(again, gain);
        return;
      }
      again.released = true;  // the key now plays another pitch
    } else {
      // The same key while its strings still ring: the same strings again.
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        if (voice.sounding && !voice.stealing && voice.handover == 0 && pool_.note_id_of(v) == note_id &&
            voice.frequency == frequency) {
          restrike(voice, gain);
          return;
        }
      }
    }

    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    if (stolen) {
      // The old note fades over a few milliseconds, then this one starts
      // (see begin). It counts as the new note from now on.
      voice.stealing = true;
      voice.pending = true;
      voice.released = false;
      voice.steal = steal_ticks_;
      voice.pending_frequency = frequency;
      voice.pending_gain = gain;
      voice.loudness = level_for(gain);
    } else {
      start(voice, frequency, gain);
    }
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held < 0) return;
    Voice& voice = pool_.voices[held];
    voice.pending = false;  // let go before its stolen start: it never sounds
    voice.released = true;
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
      if (countdown_ == 0) {
        control();
        countdown_ = period_;
      }
      const int count = frames - done < countdown_ ? frames - done : countdown_;
      render(done, count);
      countdown_ -= count;
      done += count;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr float kMinHz = 16.0f;
  static constexpr float kMaxHz = 12000.0f;
  static constexpr float kLowestHz = 27.5f;          // the bottom A, where the stiffness is kStiffLow
  static constexpr float kStiffLow = 1.0e-4f;
  static constexpr float kStiffSlope = 0.596f;       // 2e-3 at the top C, 7.25 octaves up
  static constexpr float kTopHz = 16000.0f;          // no partial above this, at any sample rate
  static constexpr float kFedTopHz = 10000.0f;       // the magnets feed nothing above this: a whistle there is past hearing
  static constexpr float kTopOfBand = 0.45f;         // ... or above this share of the sample rate
  static constexpr float kAirHz = 6000.0f;           // where the bare string starts to lose its top
  static constexpr float kControlSeconds = 1.0f / 750.0f;
  static constexpr float kKnobSeconds = 0.04f;       // Harmonic, Bright, Sweep, Body and Width glide
  static constexpr float kSixtyDb = 6.907755279f;
  static constexpr float kToHalfPower = 1.231f;      // time constants in the time to come within 3 dB
  static constexpr int kFedPartials = 8;             // the magnets reach the first eight
  static constexpr float kBrightSpan = 6.0f;         // half-width of the bell at Bright 1, less the 1 at Bright 0
  static constexpr float kSweepSpan = 3.5f;          // partials either way at Sweep 1
  static constexpr float kShimmerCents = 6.0f;       // at Shimmer 1, times the two shares below
  static constexpr float kFlat = 1.1f;               // the flat string's share
  static constexpr float kSharp = 0.9f;              // the sharp string's
  static constexpr float kBeatCapHz = 2.5f;          // the most the flat string's fundamental is off by
  static constexpr float kOuterString = 0.25f;       // the flat and the sharp string against the one in tune
  static constexpr float kSideLift = 2.0f;           // what tells left from right in the outer strings, against the pan law
  static constexpr float kStringGain = 0.53f;        // so a note is as loud, over time, as three equal strings at a third each
  static constexpr float kHammerGain = 0.55f;        // the struck fundamental against the swollen one, hardest strike
  static constexpr float kFeltKeeps = 0.5f;          // what the felt leaves of a ringing string it strikes again
  static constexpr float kFeltSoftHz = 700.0f;       // where a soft strike on A3 starts to roll off
  static constexpr float kFeltSpanHz = 2300.0f;      // ... and how much higher a hard one does
  static constexpr float kStruckSeconds = 7.0f;      // ring of a struck A3's fundamental with the key held
  static constexpr float kRingShare = 0.35f;         // how much of a matching partial a string takes up, Sympathy 1
  static constexpr float kRingRiseSeconds = 0.15f;
  static constexpr float kRingFallSeconds = 1.5f;
  static constexpr float kBinsPerOctave = 48.0f;     // sympathy bus: a quarter of a semitone
  static constexpr float kBusCentre = 232.0f;        // the bin of A 440 (a whole number, so equal-tempered notes sit on bins)
  static constexpr int kBins = 488;                  // 16 Hz to 16 kHz
  static constexpr float kStealSeconds = 0.005f;
  static constexpr float kSilence = 1.0e-6f;
  static constexpr float kFaint = 3.0e-5f;           // a partial smaller than this is not played: under -96 dBFS at any volume
  static constexpr float kVoiceGain = 0.48f;         // one note at gain 0.7 peaks near -17 dBFS at the default volume

  struct Voice {
    // The oscillator of each partial: x = cos(phase), y = sin(phase + w/2).
    float x[kPartials] = {}, y[kPartials] = {};
    float turn[kPartials] = {};                        // 2·sin(w/2)
    float skew[kPartials] = {}, lift[kPartials] = {};  // tan(w/2) and 1/cos(w/2): sin(phase) from x and y
    // What each side hears of it: weights on x and y, left then right.
    float weight[4][kPartials] = {}, aim[4][kPartials] = {}, step[4][kPartials] = {};
    // Where the flat and the sharp string stand against the one in tune,
    // and how far they turn every tick.
    float flat_re[kPartials] = {}, flat_im[kPartials] = {}, sharp_re[kPartials] = {}, sharp_im[kPartials] = {};
    float flat_turn_re[kPartials] = {}, flat_turn_im[kPartials] = {};
    float sharp_turn_re[kPartials] = {}, sharp_turn_im[kPartials] = {};
    float hz[kPartials] = {};
    float air[kPartials] = {}, wood[kPartials] = {};   // soundboard gains: bare string, and all wood
    float swell[kPartials] = {};                       // how far the magnets have brought it, 0..1
    float struck[kPartials] = {};                      // what the hammer left
    float blow[kPartials] = {};                        // what this strike gives a string at rest
    float strike[kPartials] = {};                      // where it brings the partial while the felt touches
    float strike_decay[kPartials] = {};
    float ring[kPartials] = {};                        // what it took up in sympathy
    float moving[kPartials] = {};                      // its size this tick, as put on the bus
    float near[kPartials] = {}, far[kPartials] = {};   // its share of its two bus bins
    int bin[kPartials] = {};
    kit::Drift path;                                   // where Sweep takes the magnets
    float frequency = 440.0f;
    float velocity = 0.0f;
    float damp = 1.0f;                                 // 1 while the key is down
    float loudness = 0.0f;
    float top = 1.0f;                                  // the highest partial the magnets can feed
    float pending_frequency = 440.0f, pending_gain = 0.0f;
    uint32_t tuned = 0;                                // the serial the strings were last spread from
    int count = 0;                                     // partials that exist
    int low = 0, high = 0;                             // the ones that sound lie in [low, high)
    uint32_t live = 0;                                 // ... and are these (bit n for partial n)
    int contact = 0;                                   // ticks the hammer still touches
    int steal = 0;                                     // ticks left of a stolen voice's fade
    int handover = 0;                                  // 1: a new note took these strings over, fade this tick; 2: end
    bool sounding = false, released = false, stealing = false, pending = false;
    bool fresh = false;                                // started since the last tick

    bool active() const { return sounding; }
    bool releasing() const { return released; }
    float level() const { return loudness; }
  };

  static float level_for(float gain) { return 0.25f + 0.75f * gain; }

  // The soundboard at Body 1: three broad resonances and a duller top.
  static float wood_gain(float hz) {
    const float octave = std::log2(hz);
    static constexpr float kCentre[3] = {6.78f, 8.18f, 9.68f};  // log2 of 110, 290 and 820 Hz
    static constexpr float kOctaves[3] = {0.9f, 0.6f, 0.5f};
    static constexpr float kDb[3] = {5.0f, 4.0f, 3.0f};
    float db = -2.0f;
    for (int k = 0; k < 3; ++k) {
      const float away = (octave - kCentre[k]) / kOctaves[k];
      db += kDb[k] * std::exp(-0.5f * away * away);
    }
    return kit::db_to_gain(db) / std::sqrt(1.0f + (hz / 1400.0f) * (hz / 1400.0f));
  }

  // A new note on a free (or just faded) voice.
  void start(Voice& voice, float frequency, float gain) {
    const float sr = sample_rate();
    voice.frequency = frequency;
    voice.velocity = level_for(gain);
    voice.loudness = voice.velocity;
    voice.damp = 1.0f;
    voice.sounding = true;
    voice.released = voice.stealing = voice.pending = false;
    voice.steal = 0;
    voice.handover = 0;
    voice.low = voice.high = 0;
    voice.live = 0;
    voice.tuned = 0;
    voice.fresh = true;
    // The path draws its three phases from the three numbers that follow
    // its seed: step past them, or the next note's path shares two of them.
    voice.path.seed(paths_.next_u32());
    for (int skip = 0; skip < 3; ++skip) paths_.next_u32();

    const float top = kit::min(kTopHz, kTopOfBand * sr);
    // A struck string rings longer in the bass, and its upper partials less.
    const float ring_seconds = kit::clamp(kStruckSeconds * std::sqrt(220.0f / frequency), 1.0f, 14.0f);
    voice.count = 0;
    int fed = 1;
    for (int n = 0; n < kPartials; ++n) {
      const float hz = partial_hz(frequency, n + 1);
      const bool exists = hz < top;
      if (exists) voice.count = n + 1;
      if (exists && hz < kFedTopHz && n < kFedPartials) fed = n + 1;
      const double half = 0.5 * 6.283185307179586 * static_cast<double>(hz) / static_cast<double>(sr);
      voice.hz[n] = hz;
      voice.turn[n] = exists ? static_cast<float>(2.0 * std::sin(half)) : 0.0f;
      voice.skew[n] = exists ? static_cast<float>(std::tan(half)) : 0.0f;
      voice.lift[n] = exists ? static_cast<float>(1.0 / std::cos(half)) : 0.0f;
      voice.x[n] = 1.0f;
      voice.y[n] = static_cast<float>(std::sin(half));
      voice.flat_re[n] = voice.sharp_re[n] = 1.0f;
      voice.flat_im[n] = voice.sharp_im[n] = 0.0f;
      voice.air[n] = 1.0f / std::sqrt(1.0f + (hz / kAirHz) * (hz / kAirHz));
      voice.wood[n] = wood_gain(hz);
      voice.swell[n] = voice.struck[n] = voice.ring[n] = voice.moving[n] = 0.0f;
      voice.strike_decay[n] =
          std::exp(-kSixtyDb * tick_seconds_ / (ring_seconds * std::pow(static_cast<float>(n + 1), -0.8f)));
      for (int c = 0; c < 4; ++c) voice.weight[c][n] = voice.aim[c][n] = voice.step[c][n] = 0.0f;
      // Where it listens on the bus.
      const float place = kit::clamp(kBusCentre + kBinsPerOctave * std::log2(hz / 440.0f), 0.0f, kBins - 2.0f);
      voice.bin[n] = static_cast<int>(place);
      voice.far[n] = place - static_cast<float>(voice.bin[n]);
      voice.near[n] = 1.0f - voice.far[n];
    }
    voice.top = static_cast<float>(fed);
    hit(voice, gain);
  }

  // The same key again while its strings still sound: they carry on from
  // where they are, under a new strike.
  void restrike(Voice& voice, float gain) {
    const float velocity = level_for(gain);
    const float carried = voice.damp * voice.velocity / velocity;
    for (int n = 0; n < voice.count; ++n) {
      voice.swell[n] *= carried;
      voice.struck[n] *= voice.damp;
      voice.ring[n] *= voice.damp;
    }
    voice.velocity = velocity;
    voice.loudness = velocity;
    voice.damp = 1.0f;
    voice.released = false;
    hit(voice, gain);
  }

  // The felt meets the strings: what each partial gets, over how long. On
  // strings that already ring from an earlier strike the felt takes half of
  // that away and the new blow joins the rest as energies do, so a key
  // struck again and again stays one note's loudness instead of piling up.
  void hit(Voice& voice, float gain) {
    const float hammer = param(magnet_piano::kHammer);
    if (hammer <= 0.0f) {
      voice.contact = 0;
      return;
    }
    const float seconds = kit::clamp(0.0035f * std::pow(220.0f / voice.frequency, 0.3f), 0.0015f, 0.008f);
    voice.contact = static_cast<int>(seconds / tick_seconds_ + 0.5f);
    if (voice.contact < 1) voice.contact = 1;
    // A harder strike is louder and keeps more of its top; the felt gives
    // way higher up on a shorter string.
    const float strength = kHammerGain * hammer * gain * (0.3f + 0.7f * gain);
    const float corner = (kFeltSoftHz + kFeltSpanHz * gain) * std::sqrt(voice.frequency / 220.0f);
    for (int n = 0; n < kPartials; ++n) {
      const float over = voice.hz[n] / corner;
      voice.blow[n] = n < voice.count ? strength / (root_[n] * (1.0f + over * over)) : 0.0f;
    }
    aim_strike(voice);
  }

  // Where the blow brings each partial, from what the strings hold now.
  void aim_strike(Voice& voice) {
    for (int n = 0; n < kPartials; ++n) {
      const float kept = kFeltKeeps * voice.struck[n];
      voice.strike[n] = std::sqrt(voice.blow[n] * voice.blow[n] + kept * kept);
    }
  }

  // How far the flat and the sharp string turn against the middle one per
  // tick, from Shimmer as it stands.
  void spread(Voice& voice) {
    const float apart = kit::cents_to_ratio(kShimmerCents * param(magnet_piano::kShimmer)) - 1.0f;
    // High notes would flutter: hold the flat string's fundamental within a few hertz.
    const float share = kit::min(apart, kBeatCapHz / (kFlat * voice.frequency));
    for (int n = 0; n < voice.count; ++n) {
      const double angle = 6.283185307179586 * static_cast<double>(voice.hz[n] * share * tick_seconds_);
      voice.flat_turn_re[n] = static_cast<float>(std::cos(kFlat * angle));
      voice.flat_turn_im[n] = static_cast<float>(-std::sin(kFlat * angle));
      voice.sharp_turn_re[n] = static_cast<float>(std::cos(kSharp * angle));
      voice.sharp_turn_im[n] = static_cast<float>(std::sin(kSharp * angle));
    }
    voice.tuned = serial_;
  }

  // One turn of a slow phasor, pulled back to unit size.
  static void turn_string(float* re, float* im, float turn_re, float turn_im) {
    const float a = *re * turn_re - *im * turn_im;
    const float b = *re * turn_im + *im * turn_re;
    const float keep = 1.5f - 0.5f * (a * a + b * b);
    *re = a * keep;
    *im = b * keep;
  }

  // Every tick, before anything moves: a stolen voice fades and then starts
  // its waiting note, the damper falls, a note that has rung out ends, and a
  // new note joins strings that already sound its pitch.
  void begin(Voice& voice) {
    if (voice.handover == 2 && !(voice.stealing && voice.pending)) {
      voice.sounding = false;
      return;
    }
    if (voice.stealing) {
      if (voice.steal > 0) {
        --voice.steal;
      } else if (voice.pending) {
        start(voice, voice.pending_frequency, voice.pending_gain);
      } else {
        voice.sounding = false;
        return;
      }
    }
    if (voice.released) {
      voice.damp *= damper_coeff_;
      voice.loudness = voice.handover != 0 ? 0.0f : voice.velocity * voice.damp;
      if (voice.damp < kSilence) voice.sounding = false;
    }
    if (!voice.fresh) return;
    voice.fresh = false;
    // The key's last note may still ring on another voice. Those are the
    // same strings, so this note starts where they stand: in phase beside a
    // note still held under another id, and in place of one that was let
    // go. It takes over what that one left in the strings and that voice
    // ends, fading over this period as this one comes in, so nothing jumps
    // and one pitch played again and again never piles up tail upon tail.
    bool placed = false;
    for (Voice& other : pool_.voices) {
      if (&other == &voice || !other.sounding || other.fresh || other.handover != 0 ||
          other.frequency != voice.frequency) {
        continue;
      }
      if (!placed) {
        for (int n = 0; n < voice.count; ++n) {
          voice.x[n] = other.x[n];
          voice.y[n] = other.y[n];
          voice.flat_re[n] = other.flat_re[n];
          voice.flat_im[n] = other.flat_im[n];
          voice.sharp_re[n] = other.sharp_re[n];
          voice.sharp_im[n] = other.sharp_im[n];
        }
        placed = true;
      }
      if (!other.released || other.stealing) continue;
      voice.path = other.path;  // the magnets carry on from where Sweep had them
      const float carried = other.damp * other.velocity / voice.velocity;
      for (int n = 0; n < voice.count; ++n) {
        voice.swell[n] += other.swell[n] * carried;
        voice.struck[n] += other.damp * other.struck[n];
        voice.ring[n] += other.damp * other.ring[n];
      }
      other.handover = 1;
      other.loudness = 0.0f;
    }
    if (voice.contact > 0) aim_strike(voice);
  }

  // Every tick, first half: move one key's strings, magnets and hammer on,
  // and write what its partials are doing on the sympathy bus.
  void drive(Voice& voice, float harmonic, float reach, float sweep, float sweep_hz) {
    if (voice.tuned != serial_) spread(voice);

    // Where the magnets are, and what they give each partial.
    voice.path.set_rate(sweep_hz, sample_rate());
    // The magnets cannot leave the string: where their path would take them
    // past either end of their reach they turn back, so Sweep moves them at
    // every Harmonic (held at the end, a note on Harmonic 1 would stand
    // still for as long as its path pointed down).
    const float home = kit::clamp(harmonic, 1.0f, voice.top);
    float centre = home + sweep * voice.path.next(period_);
    if (centre < 1.0f) centre = 2.0f - centre;
    if (centre > voice.top) centre = 2.0f * voice.top - centre;
    centre = kit::clamp(centre, 1.0f, voice.top);
    const float quarter = 0.25f / reach;
    float fed[kPartials];
    float power = 0.0f;
    for (int n = 0; n < voice.count; ++n) {
      const float away = std::fabs(static_cast<float>(n + 1) - centre);
      const float bell = away < reach ? kit::SineTable::cos_lookup(away * quarter) : 0.0f;
      fed[n] = bell * bell;
      power += fed[n] * fed[n];
    }
    const float magnets = voice.velocity / std::sqrt(power);  // the nearest partial is always inside the bell

    // The fed partial comes within 3 dB in Bloom; lower ones later, higher ones sooner.
    const float pace = voice.released ? 0.0f : bloom_rate_ / std::sqrt(centre);
    const float touch = voice.contact > 0 ? 1.0f / static_cast<float>(voice.contact) : 0.0f;
    for (int n = 0; n < voice.count; ++n) {
      turn_string(&voice.flat_re[n], &voice.flat_im[n], voice.flat_turn_re[n], voice.flat_turn_im[n]);
      turn_string(&voice.sharp_re[n], &voice.sharp_im[n], voice.sharp_turn_re[n], voice.sharp_turn_im[n]);
      const float gone = pace * root_[n];
      voice.swell[n] += (1.0f - voice.swell[n]) * gone / (1.0f + 0.5f * gone);
      float struck = voice.struck[n] * voice.strike_decay[n];
      struck += (voice.strike[n] - struck) * touch;  // lands on it with the felt's last tick
      voice.struck[n] = struck < kSilence ? 0.0f : struck;
      voice.moving[n] = voice.damp * (magnets * fed[n] * voice.swell[n] + voice.struck[n]);
      if (voice.handover != 0) continue;  // its strings are another voice's now
      bus_[voice.bin[n]] += voice.moving[n] * voice.near[n];
      bus_[voice.bin[n] + 1] += voice.moving[n] * voice.far[n];
    }
    if (voice.contact > 0) --voice.contact;
  }

  // Every tick, second half: what each partial takes up from the other
  // keys, and the four weights it is heard through for the next period.
  void voice_weights(Voice& voice, float sympathy, float body, float outer, float inner) {
    const float per_sample = 1.0f / static_cast<float>(period_);
    const float fade = voice.handover != 0
                           ? 0.0f
                           : voice.stealing ? static_cast<float>(voice.steal) / static_cast<float>(steal_ticks_) : 1.0f;
    int low = kPartials, high = 0;
    uint32_t live = 0;
    for (int n = 0; n < voice.count; ++n) {
      const float heard = bus_[voice.bin[n]] * voice.near[n] + bus_[voice.bin[n] + 1] * voice.far[n];
      const float own = voice.moving[n] * voice.near[n] * voice.near[n] + voice.moving[n] * voice.far[n] * voice.far[n];
      const float others = heard - own > kSilence ? heard - own : 0.0f;
      const float wanted = sympathy * others;
      float ring = voice.ring[n];
      ring += (wanted - ring) * (wanted > ring ? ring_rise_ : ring_fall_);
      voice.ring[n] = ring < kSilence ? 0.0f : ring;

      const float board = voice.air[n] * (1.0f + body * (voice.wood[n] - 1.0f));
      // Too faint to hear, it is left out (it fades over this period and
      // costs nothing after): most of what a strike or the other keys set
      // ringing is, for most of the time a note is held.
      const float heard_size = fade * board * (voice.moving[n] + voice.damp * voice.ring[n]);
      const float size = heard_size < kFaint ? 0.0f : heard_size;
      // The three strings as one turning size for each side: the flat one
      // to the left, the sharp one to the right, the one in tune between.
      const float left_re = kStringGain * (outer * voice.flat_re[n] + kit::kSqrtHalf + inner * voice.sharp_re[n]);
      const float left_im = kStringGain * (outer * voice.flat_im[n] + inner * voice.sharp_im[n]);
      const float right_re = kStringGain * (inner * voice.flat_re[n] + kit::kSqrtHalf + outer * voice.sharp_re[n]);
      const float right_im = kStringGain * (inner * voice.flat_im[n] + outer * voice.sharp_im[n]);
      // sin(phase + a) = cos(phase)·sin(a) + sin(phase)·cos(a), with sin(phase) made from x and y.
      const float aim[4] = {size * (left_im - left_re * voice.skew[n]), size * left_re * voice.lift[n],
                            size * (right_im - right_re * voice.skew[n]), size * right_re * voice.lift[n]};
      bool sounds = size != 0.0f;
      for (int c = 0; c < 4; ++c) {
        voice.weight[c][n] = voice.aim[c][n];  // land exactly before leaving again
        voice.aim[c][n] = aim[c];
        voice.step[c][n] = (aim[c] - voice.weight[c][n]) * per_sample;
        sounds = sounds || voice.weight[c][n] != 0.0f;
      }
      if (sounds) {
        if (n < low) low = n;
        high = n + 1;
        live |= 1u << n;
      }
    }
    voice.low = low < high ? low : 0;
    voice.high = high;
    voice.live = live;
    if (voice.handover == 1) voice.handover = 2;
  }

  // Every period_ samples.
  void control() {
    using namespace magnet_piano;
    const float harmonic = harmonic_.next();
    const float reach = reach_.next();
    const float sweep = sweep_.next();
    const float body = body_.next();
    float outer, inner;
    kit::pan_gains(-width_.next(), &outer, &inner);
    // What the two outer strings give the middle of the picture, and what
    // they give its sides (lifted, so Width opens the note without the sum
    // of left and right moving any more than it does in mono).
    const float middle = 0.5f * kOuterString * (outer + inner);
    const float sides = 0.5f * kOuterString * kSideLift * (outer - inner);
    outer = middle + sides;
    inner = middle - sides;
    const float sympathy = kRingShare * param(kSympathy);
    const float sweep_hz = param(kSweepRate);
    for (float& bin : bus_) bin = 0.0f;
    for (Voice& voice : pool_.voices) {
      if (voice.sounding) begin(voice);
    }
    for (Voice& voice : pool_.voices) {
      if (voice.sounding) drive(voice, harmonic, reach, sweep, sweep_hz);
    }
    for (Voice& voice : pool_.voices) {
      if (voice.sounding) voice_weights(voice, sympathy, body, outer, inner);
    }
  }

  // `count` samples between two control ticks.
  void render(int from, int count) {
    float* left = out_left_ + from;
    float* right = out_right_ + from;
    for (int i = 0; i < count; ++i) left[i] = right[i] = 0.0f;
    for (Voice& voice : pool_.voices) {
      if (!voice.sounding) continue;
      for (int n = voice.low; n < voice.high; ++n) {
        if ((voice.live >> n & 1u) == 0) continue;  // unheard: it waits where it is
        float x = voice.x[n], y = voice.y[n];
        const float turn = voice.turn[n];
        float w0 = voice.weight[0][n], w1 = voice.weight[1][n], w2 = voice.weight[2][n], w3 = voice.weight[3][n];
        const float s0 = voice.step[0][n], s1 = voice.step[1][n], s2 = voice.step[2][n], s3 = voice.step[3][n];
        for (int i = 0; i < count; ++i) {
          w0 += s0;
          w1 += s1;
          w2 += s2;
          w3 += s3;
          left[i] += w0 * x + w1 * y;
          right[i] += w2 * x + w3 * y;
          x -= turn * y;
          y += turn * x;
        }
        voice.x[n] = x;
        voice.y[n] = y;
        voice.weight[0][n] = w0;
        voice.weight[1][n] = w1;
        voice.weight[2][n] = w2;
        voice.weight[3][n] = w3;
      }
    }
    for (int i = 0; i < count; ++i) {
      const float volume = kVoiceGain * volume_.next();
      left[i] = kit::soft_clip(left[i] * volume);
      right[i] = kit::soft_clip(right[i] * volume);
    }
  }

  // Nothing is sounding: whatever was turned in the silence is in place for
  // the next note, and the control clock ticks on its first sample.
  void arrive() {
    harmonic_.snap(harmonic_.target);
    reach_.snap(reach_.target);
    sweep_.snap(sweep_.target);
    body_.snap(body_.target);
    width_.snap(width_.target);
    volume_.snap(volume_.target);
    countdown_ = 0;
  }

  void apply(int id) {
    using namespace magnet_piano;
    const float value = param(id);
    switch (id) {
      case kBloom:
        bloom_rate_ = kToHalfPower * tick_seconds_ / value;
        break;
      case kHarmonic:
        harmonic_.set(value, primed());
        break;
      case kBright:
        reach_.set(1.0f + kBrightSpan * value * std::sqrt(value), primed());
        break;
      case kShimmer:
        ++serial_;  // sounding strings follow on the control clock
        break;
      case kSweep:
        sweep_.set(kSweepSpan * value, primed());
        break;
      case kDamper:
        damper_coeff_ = std::exp(-kSixtyDb * tick_seconds_ / value);
        break;
      case kBody:
        body_.set(value, primed());
        break;
      case kWidth:
        width_.set(value, primed());
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      default:
        break;  // hammer: the next strike; sweep rate and sympathy: read on the control clock
    }
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::Smoother harmonic_, reach_, sweep_, body_, width_;  // advanced on the control clock
  kit::Smoother volume_;
  kit::IdleGate idle_;
  kit::Rng paths_;  // the seed of each note's sweep path
  float bus_[kBins] = {};
  float root_[kPartials] = {};
  float tick_seconds_ = 0.0f;
  float bloom_rate_ = 0.0f, damper_coeff_ = 0.0f;
  float ring_rise_ = 0.0f, ring_fall_ = 0.0f;
  uint32_t serial_ = 1;
  int period_ = 64;
  int countdown_ = 0;
  int steal_ticks_ = 4;
};

}  // namespace livemix
