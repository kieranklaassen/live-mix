#pragma once

// Prepared Piano: a piano with things between its strings.
//
//   key down ─► hammer ─┬─► free string (24 partials) ─────────┬─► pan ─┐
//                       └─► prepared string (16 + 2 clang) ────┤        │
//                             ▲                │               │        ├─► tone ─► volume ─► soft clip
//                             └── buzz ◄── how far it swings ──┴─► pan ─┤
//               └─► thud (the knock of key and frame) ─────────────► pan ┘
//
// - A note is two strings. Each is a bank of partials at the stretched
//   series of a stiff string, n·f·sqrt((1 + B·n²) / (1 + B)), B by key. A
//   partial is one complex number turned and shrunk a little every sample,
//   as in Bells (modal_bells.h). The hammer sets every partial going at
//   once: 1/sqrt(n), the comb of a strike an eighth of the way along, and a
//   low-pass whose corner rises with the hammer's hardness, the key and the
//   velocity; the whole strike is then brought to one power, so a harder
//   hammer is brighter, not louder, and each partial sets off up or down by
//   a draw from the key, so the peaks of a chord do not stack. The two
//   strings sit Detune apart, so a plain note beats slowly.
// - An object lies on the strings at Position, a share of their length. A
//   partial feels it by how much it moves there: sin²(n·π·position).
//     Bolts   a mass on the prepared string only. Each of its partials falls
//             by 1/sqrt(1 + load·moves), and the string is tuned back so its
//             fundamental stays on the key: the overtones leave the series
//             (a small gong) over the free string, which is the piano still
//             underneath. Two short modes under the note are the clang.
//     Rubber  damps both strings: a partial that moves at the rubber dies in
//             a tenth of a second, one that is still there in four tenths.
//     Felt    the same, gentler, and the hammer meets felt first: a longer
//             contact, so fewer highs and a softer start.
//     Paper   hardly damps. It buzzes.
//   Amount runs from no object (a plain piano) to all of it. In Mixed a
//   fixed table gives every key its own object, its own share of Amount and
//   its own place near Position.
// - The buzz is what a loose object does: nothing until the string swings
//   further than the gap to it, then a burst as large as the swing goes
//   past the gap. The swing is the first four partials of each string. Part
//   of each burst is a tick and part is rustle (noise), it is heard above
//   2.5 kHz, and a little of it goes back into the partials above the
//   fourth one control period later: never into the swing itself, so the
//   buzz cannot feed the buzz. A soft key never reaches the gap; a ringing
//   note falls back under it, so the buzz ends before the note does. Rattle
//   closes the gap and raises the level.
// - The thud is a 12 ms burst of noise kept between 110 and 430 Hz, the same
//   knock on every key and at every sample rate.
// - Like a piano with the pedal half down: a held key rings its full time,
//   a released one is damped to under a second (longer with Decay), and a
//   key struck again damps its old note quickly and starts a new one,
//   whatever id the two notes carry: one key is one pair of strings, so a
//   key played over and over never piles up.
//
// Preparation, Amount, Position, Hammer and Thud are read when a key is
// struck (the object is laid on the strings before the hammer falls);
// Rattle, Decay, Detune, Tone, Width and Volume are live. Every random
// source is seeded from the key at the strike, so one key is one sound.
// The instrument sleeps when every string has rung out below -120 dB.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class PreparedPiano : public kit::DeviceBase<prepared_piano::kNumParams> {
 public:
  static constexpr int kMaxVoices = 12;
  static constexpr int kFree = 24;    // partials of the free string
  static constexpr int kLoaded = 16;  // partials of the prepared string
  static constexpr int kClang = 2;    // the bolt's own two modes
  static constexpr int kSlots = kFree + kLoaded + kClang;
  static constexpr int kSide = 4;  // partials turned side by side (a string's count is a multiple of it), and the partials that are a string's swing
  enum Preparation : int { kMixed = 0, kBolts, kRubber, kFelt, kPaper, kNumPreparations };
  static constexpr int kMixedKeys = 19;

  // What an object does to the strings at Amount 1.
  struct Object {
    float load;     // mass on the prepared string, as a share of the string's own
    float moving;   // seconds a partial rings that moves where the object sits
    float still;    // seconds one rings that is still there
    float reach;    // how much of that damping the free string gets
    float under;    // level of the free string under the prepared one
    float soften;   // how many times longer the hammer's contact gets
    float buzz;     // buzz from Amount alone
    float rattle;   // buzz the Rattle knob adds
    float rustle;   // share of the buzz that is noise instead of tick
    float clang;    // level of the two clang modes
  };

  // Mixed: the object on a key, its share of Amount and its place from Position.
  struct Placed {
    int preparation;
    float amount;
    float offset;
  };

  static const Object& object(int preparation) {
    static const Object kObjects[kNumPreparations] = {
        {0.0f, 4.0f, 4.0f, 0.0f, 1.0f, 0.0f, 0.0f, 0.0f, 0.0f, 0.0f},    // Mixed: never used as an object
        {0.6f, 10.0f, 20.0f, 0.0f, 0.3f, 0.0f, 0.0f, 1.0f, 0.6f, 0.3f},  // Bolts
        {0.04f, 0.1f, 0.4f, 1.0f, 1.0f, 0.3f, 0.0f, 0.15f, 0.5f, 0.0f},  // Rubber
        {0.0f, 0.9f, 2.2f, 1.0f, 1.0f, 3.0f, 0.0f, 0.12f, 0.7f, 0.0f},   // Felt
        {0.0f, 3.0f, 9.0f, 1.0f, 1.0f, 0.0f, 0.6f, 0.4f, 0.8f, 0.0f},    // Paper
    };
    return kObjects[kit::clamp_int(preparation, kBolts, kPaper)];
  }

  // The table repeats every 19 keys, so octaves do not share an object.
  // Middle C (key 60, row 3) is a bolt and the D above it (row 5) is rubber.
  static const Placed& mixed(int key) {
    static const Placed kTable[kMixedKeys] = {
        {kBolts, 1.0f, 0.0f},    {kRubber, 0.9f, 0.06f},  {kPaper, 0.8f, -0.04f}, {kBolts, 0.6f, 0.1f},
        {kFelt, 0.9f, 0.0f},     {kRubber, 1.0f, -0.06f}, {kBolts, 0.85f, -0.08f}, {kPaper, 1.0f, 0.05f},
        {kFelt, 1.0f, 0.12f},    {kBolts, 0.45f, 0.04f},  {kRubber, 0.7f, 0.14f}, {kBolts, 1.0f, 0.13f},
        {kPaper, 0.6f, 0.1f},    {kFelt, 1.0f, -0.05f},   {kBolts, 0.75f, -0.12f}, {kRubber, 0.85f, 0.0f},
        {kBolts, 0.55f, 0.08f},  {kFelt, 0.9f, 0.06f},    {kRubber, 0.6f, -0.1f},
    };
    return kTable[((key % kMixedKeys) + kMixedKeys) % kMixedKeys];
  }

  // The key a frequency belongs to, 0 to 127.
  static int key_of(float frequency) {
    return kit::clamp_int(static_cast<int>(std::floor(kit::hz_to_midi(frequency) + 0.5f)), 0, 127);
  }

  // Inharmonicity of the string on a key: nearly flat through the bass, then
  // rising with every key above middle C.
  static float stiffness(int key) {
    if (key >= 60) return 3.1e-4f * std::exp(0.075f * static_cast<float>(key - 60));
    return kit::max(2.0e-4f, 2.6e-4f + 0.5e-4f * static_cast<float>(key - 21) / 39.0f);
  }

  // Partial n of the plain string on a key, as a multiple of the fundamental.
  static float stretched(int n, float b) {
    const float nf = static_cast<float>(n);
    return nf * std::sqrt((1.0f + b * nf * nf) / (1.0f + b));
  }

  // How much partial n moves at `position`: 1 at an antinode, 0 at a node.
  static float moves(int n, float position) {
    const float s = std::sin(kit::kPi * static_cast<float>(n) * position);
    return s * s;
  }

  // Where the bolt puts partial n of the prepared string, as a multiple of
  // where the plain string has it (the fundamental stays: 1).
  static float loaded_ratio(int n, float load, float position) {
    return std::sqrt((1.0f + load * moves(1, position)) / (1.0f + load * moves(n, position)));
  }

  // The two clang modes, as multiples of the fundamental.
  static float clang_ratio(int which, float position) {
    const float low = kClangLow + kClangByPosition * position;
    return which == 0 ? low : low * kClangSpread;
  }

  void init(float sample_rate) {
    using namespace prepared_piano;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) pool_.voices[v] = Voice();
    decay_serial_ = detune_serial_ = 1;
    steal_step_ = 1.0f / (kStealSeconds * sr);
    // White noise spreads over a wider band at a higher rate: hold its level per hertz.
    noise_scale_ = std::sqrt(sr / kVoicedRate);
    buzz_high_ = std::exp(-kit::kTwoPi * kBuzzHighHz / sr);
    buzz_edge_ = 0.5f * (1.0f + buzz_high_);
    buzz_low_ = std::exp(-kit::kTwoPi * kit::min(kBuzzLowHz, 0.45f * sr) / sr);
    // What goes back into the strings is added every sample: the same push per second at any rate.
    buzz_feed_ = kBuzzFeed * kVoicedRate / sr;
    thud_clock_ = kVoicedRate / sr;
    const float control_rate = sr / static_cast<float>(kChunk);
    rattle_.set_time(kControlSeconds, control_rate);
    tone_.set_time(kControlSeconds, control_rate);
    width_.set_time(kControlSeconds, control_rate);
    volume_.set_time(kSmoothingSeconds, sr);
    rattle_.snap(param(kRattle));
    tone_.snap(param(kTone));
    width_.snap(param(kWidth));
    volume_.snap(kit::db_to_gain(param(kVolume)));
    restart();
    idle_.reset(sr, 0.1f);
  }

  void set_param(int id, float value) {
    using namespace prepared_piano;
    if (!store_param(id, value)) return;
    switch (id) {
      case kDecay:
        ++decay_serial_;
        break;
      case kDetune:
        ++detune_serial_;
        break;
      case kRattle:
        rattle_.set(param(kRattle), primed());
        break;
      case kTone:
        tone_.set(param(kTone), primed());
        break;
      case kWidth:
        width_.set(param(kWidth), primed());
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(param(kVolume)), primed());
        break;
      default:
        break;  // preparation, amount, position, hammer, thud: the next strike
    }
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, kMinHz, kMaxHz);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    // Nothing sounds: whatever moved in the silence has arrived, and the
    // control clock starts with this note at any block size.
    if (pool_.count_active() == 0) restart();
    const int held = pool_.find_held(note_id);
    if (held >= 0) {
      Voice& again = pool_.voices[held];
      if (again.pending) {
        // Struck again before it could start: the waiting note is this one.
        again.pending_frequency = frequency;
        again.pending_gain = gain;
        again.follow = unit(frequency) * strength(gain);
        return;
      }
      // The same key while its note rings: the hammer stops the old note.
      again.released = true;
      again.choked = true;
    }
    // One key is one pair of strings, whatever its note is called: a key
    // struck again under another id stops its old note too (or the notes of
    // one key played over and over pile up), and a note of this key still
    // waiting for a stolen voice never starts.
    const int key = key_of(frequency);
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& old = pool_.voices[v];
      if (!old.sounding || old.fading) continue;
      if (old.pending) {
        if (key_of(old.pending_frequency) != key) continue;
        old.pending = false;
        old.fading = true;
        old.released = true;
        old.follow = 0.0f;  // the first voice the pool hands out again
      } else if (old.key == key) {
        old.released = true;
        old.choked = true;
      }
    }
    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    if (stolen) {
      // Fade the old note over 2 ms, then start at the next control tick. It
      // counts as the new note from now, so the next key does not take it too.
      voice.pending = true;
      voice.fading = false;
      voice.gone = false;
      voice.released = false;
      voice.choked = false;
      voice.pending_frequency = frequency;
      voice.pending_gain = gain;
      voice.follow = unit(frequency) * strength(gain);
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
      const int offset = kChunk - chunk_left_;
      float left[kChunk] = {}, right[kChunk] = {};
      for (int v = 0; v < kMaxVoices; ++v) {
        if (pool_.voices[v].sounding) render_voice(pool_.voices[v], offset, n, left, right);
      }
      for (int i = 0; i < n; ++i) {
        const float volume = volume_.next();
        out_left_[done + i] = kit::soft_clip(tone_left_.lowpass(left[i]) * volume);
        out_right_[done + i] = kit::soft_clip(tone_right_.lowpass(right[i]) * volume);
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
  static constexpr float kTopHz = 16000.0f;   // partials above this do not exist, at any sample rate,
  static constexpr float kTopOfBand = 0.45f;  // nor above this share of a low one
  static constexpr float kC4 = 261.6256f;
  static constexpr float kSixtyDb = 6.907755279f;
  static constexpr float kVoicedRate = 48000.0f;  // the rate the noise levels were set at
  static constexpr float kSilence = 1.0e-6f;      // a note under this is over
  static constexpr float kCull = 1.0e-12f;        // a partial whose power is under this (-120 dB) is switched off
  static constexpr float kStealSeconds = 0.002f;
  static constexpr float kControlSeconds = 0.01f;  // how fast Rattle, Tone and Width follow their knobs

  // The plain string. The fundamental of middle C rings 7 s at Decay 1,
  // 4.5 % less with every key up, between half a second and sixteen; partial
  // n dies n^0.9 times sooner.
  static constexpr float kRingAtC4 = 7.0f;
  static constexpr float kRingPerKey = 0.045f;
  static constexpr float kShortestRing = 0.5f;
  static constexpr float kLongestRing = 16.0f;
  static constexpr float kPartialDamping = 0.9f;
  static constexpr float kReleaseSeconds = 0.7f;  // a released key, at Decay 1 (the pedal half down)
  static constexpr float kReleasePower = 1.5f;    // ... times Decay to this power
  static constexpr float kChokeSeconds = 0.1f;    // the old note of a key struck again
  static constexpr float kMaxDetuneCents = 14.0f;

  // The hammer: partial levels fall as n^-tilt, through the comb of a strike
  // at kHammerPoint (softened: a hammer has width), then 12 dB an octave
  // above a corner. The corner is kCorner times the geometric mean of the
  // note and middle C for a medium hammer at velocity 0.5, and spans
  // kHardSpan between the softest and the hardest.
  static constexpr float kTilt = 0.5f;
  static constexpr float kHammerPoint = 0.125f;
  static constexpr float kCombFloor = 0.35f;
  static constexpr float kCorner = 2.2f;
  static constexpr float kHardSpan = 12.0f;
  static constexpr float kStrikeLevel = 0.27f;  // a full-velocity strike (all partials, root of their power) at middle C
  static constexpr float kLoadedLevel = 0.7f;   // the prepared string against the free one
  // A strike has the same power on every key but for this: high notes are
  // over sooner, and get a little more.
  static constexpr float kTrimSlope = 0.1f;
  static constexpr float kTrimLow = 0.75f;
  static constexpr float kTrimHigh = 1.3f;

  // The clang: two modes under the note, further apart than any two partials.
  static constexpr float kClangLow = 0.52f;
  static constexpr float kClangByPosition = 0.3f;
  static constexpr float kClangSpread = 1.52f;
  static constexpr float kClangSeconds[kClang] = {0.45f, 0.3f};

  // The buzz. The gap is this share of a full strike's fundamental with the
  // object barely loose, and kGapClose of it less with the object fully loose.
  static constexpr float kGap = 0.35f;
  static constexpr float kGapClose = 0.8f;
  static constexpr float kBurstCap = 1.5f;     // a burst never exceeds this many full strikes
  static constexpr float kBuzzHighHz = 2500.0f;
  static constexpr float kBuzzLowHz = 9000.0f;
  static constexpr float kRustleGain = 2.5f;   // brings the band-limited noise to about unit level
  static constexpr float kBuzzLevel = 1.6f;
  static constexpr float kBuzzFeed = 0.001f;   // of the buzz, back into every partial (at 48 kHz)

  // The thud.
  static constexpr float kThumpHz = 110.0f;
  static constexpr float kThumpQ = 1.1f;
  static constexpr float kTockHz = 430.0f;
  static constexpr float kTockQ = 1.6f;
  static constexpr float kThudDecay = 0.99826541f;  // the noise burst falls by e in 12 ms of its 48 kHz clock
  static constexpr float kThudLength = 0.25f;    // seconds after which it is over
  static constexpr float kThudLevel = 0.63f;
  static constexpr uint32_t kThudSeed = 0x7D0D5EEDu;

  // The stage: middle C in the middle, three octaves to either edge; the two
  // strings of a note a little apart.
  static constexpr float kStageCentre = 60.0f;
  static constexpr float kStageSpan = 36.0f;
  static constexpr float kStageEdge = 0.55f;  // (at the default Width the lowest and highest keys lean under 6 dB)
  static constexpr float kStringSpread = 0.15f;

  struct Voice {
    // Per partial: the unit turn per sample, the turn with its decay, the
    // state, and the decay per sample of the bare string (at Decay 1) and of
    // the object on it. Slots: the free string, the prepared string, the clang.
    float hz[kFree + kLoaded] = {};  // where each partial of a string sits before Detune (0: it does not exist)
    float turn_re[kSlots] = {}, turn_im[kSlots] = {};
    float step_re[kSlots] = {}, step_im[kSlots] = {};
    float re[kSlots] = {}, im[kSlots] = {};
    float plain[kSlots] = {}, object[kSlots] = {};
    // The buzz: what the Amount gives and what Rattle adds, the depth now and
    // where it is going, the gap at depth 0, the rustle share, the filters,
    // and the bursts of this control period and the last.
    float buzz_fixed = 0.0f, buzz_knob = 0.0f;
    float depth = 0.0f, depth_step = 0.0f, depth_to = 0.0f;
    float gap = 1.0f, rustle = 0.0f;
    float hiss = 0.0f, high[4] = {};
    float fed[kChunk] = {}, feed[kChunk] = {};
    bool feeding = false, buzzing = false;
    bool strings_only = false;  // decided once a control period, so the block size has no say
    // The thud.
    kit::Svf thump, tock;
    float thud_env = 0.0f, thud_gain = 0.0f, thud_phase = 0.0f;
    int thud_left = 0;
    // Output gains (free string, prepared string, thud and buzz; left then
    // right), where they are going and the step there.
    float gain[6] = {}, gain_step[6] = {}, gain_to[6] = {};
    float place = 0.0f;
    float follow = 0.0f;
    float steal = 1.0f;
    float pending_frequency = 440.0f, pending_gain = 0.0f;
    int key = -1;        // the key these strings belong to
    uint32_t rung = 0;   // the serial the decays were last set from
    uint32_t tuned = 0;  // the serial the strings were last tuned apart from
    bool rung_released = false, rung_choked = false;
    bool sounding = false, released = false, choked = false;
    bool pending = false, fading = false, gone = false;
    kit::Rng rng, thud_rng;

    bool active() const { return sounding; }
    bool releasing() const { return released; }
    float level() const { return follow; }
  };

  static float strength(float gain) { return gain * (0.3f + 0.7f * gain); }

  // The level of a full-velocity strike on this note.
  static float unit(float frequency) {
    return kStrikeLevel * kit::clamp(std::pow(frequency / kC4, kTrimSlope), kTrimLow, kTrimHigh);
  }

  // Everything that runs on through a silence, put where it would be on a
  // device set this way from the start.
  void restart() {
    chunk_left_ = 0;
    width_set_ = width_.target;
    rattle_.snap(rattle_.target);
    tone_.snap(tone_.target);
    width_.snap(width_.target);
    volume_.snap(volume_.target);
    tone_left_.reset();
    tone_right_.reset();
    set_tone(tone_.value);
  }

  void set_tone(float tone) {
    const float hz = kToneLowHz * std::pow(kToneHighHz / kToneLowHz, tone);
    tone_left_.set(hz, kit::kSqrtHalf, sample_rate());
    tone_right_.set(hz, kit::kSqrtHalf, sample_rate());
    tone_set_ = tone;
  }
  static constexpr float kToneLowHz = 500.0f;
  static constexpr float kToneHighHz = 18000.0f;

  // A key press on a free voice: the object on this key, the partials of
  // both strings, and the hammer.
  void start(Voice& voice, float frequency, float gain) {
    using namespace prepared_piano;
    const float sr = sample_rate();
    const int key = key_of(frequency);

    // What lies on the strings of this key.
    int preparation = kit::clamp_int(static_cast<int>(param(kPreparation) + 0.5f), 0, kNumPreparations - 1);
    float amount = param(kAmount);
    float position = param(kPosition);
    if (preparation == kMixed) {
      const Placed& placed = mixed(key);
      preparation = placed.preparation;
      amount *= placed.amount;
      position = kit::clamp(position + placed.offset, 0.04f, 0.5f);
    }
    const Object& thing = object(preparation);
    const float bite = amount * amount;

    for (int k = 0; k < kSlots; ++k) {
      voice.turn_re[k] = voice.turn_im[k] = voice.step_re[k] = voice.step_im[k] = 0.0f;
      voice.re[k] = voice.im[k] = voice.plain[k] = voice.object[k] = 0.0f;
    }
    voice.sounding = true;
    voice.released = voice.choked = voice.pending = voice.fading = voice.gone = false;
    voice.steal = 1.0f;
    voice.key = key;
    // One key, one sound: the rustle is drawn from the key, the thud from a constant.
    voice.rng.seed(0x9E3779B1u * static_cast<uint32_t>(key + 1) + 0x5EEDu);
    voice.thud_rng.seed(kThudSeed);

    // The strings.
    const float b = stiffness(key);
    const float load = thing.load * bite;
    const float top = kit::min(kTopHz, kTopOfBand * sr);
    const float ring = kit::clamp(kRingAtC4 * std::exp(-kRingPerKey * static_cast<float>(key - 60)), kShortestRing, kLongestRing);
    const float plain = kSixtyDb / (ring * sr);
    const float corner = kCorner * std::sqrt(frequency * kC4) * std::pow(kHardSpan, param(kHammer) - 0.5f) * (0.5f + gain) /
                         (1.0f + thing.soften * amount);
    const float full = unit(frequency) * strength(gain);
    const float free_level = kit::lerp(1.0f, thing.under, amount);
    const float level[2] = {full * free_level / (free_level + kLoadedLevel), full * kLoadedLevel / (free_level + kLoadedLevel)};
    // The hammer's share for each partial of the free string, and their power:
    // a harder hammer moves energy up the partials, not the level of the note.
    float lit[kFree];
    float power = 0.0f;
    for (int n = 1; n <= kFree; ++n) {
      const float hz = frequency * stretched(n, b);
      lit[n - 1] = hz < top ? hammer(n, hz, corner) : 0.0f;
      power += lit[n - 1] * lit[n - 1];
      // Which way each partial sets off, drawn from the key: a strike is not
      // every partial rising at once, and a chord's peaks do not stack.
      if (n > 1 && voice.rng.uniform() < 0.5f) lit[n - 1] = -lit[n - 1];
    }
    const float even = 1.0f / std::sqrt(power);
    for (int k = 0; k < kFree + kLoaded; ++k) {
      const int string = k < kFree ? 0 : 1;
      const int n = string == 0 ? k + 1 : k - kFree + 1;
      float ratio = stretched(n, b);
      if (string == 1) ratio *= loaded_ratio(n, load, position);
      const float hz = frequency * ratio;
      voice.hz[k] = 0.0f;
      if (hz >= top) continue;  // out of band: the partial does not exist
      voice.hz[k] = hz;
      voice.plain[k] = plain * std::pow(static_cast<float>(n), kPartialDamping);
      const float seconds = kit::lerp(thing.still, thing.moving, moves(n, position));
      voice.object[k] = (string == 0 ? thing.reach : 1.0f) * bite * kSixtyDb / (seconds * sr);
      // The hammer sets the partial going: the push goes in on the real side
      // and the sound is the imaginary side, so every partial starts from zero.
      voice.re[k] = level[string] * lit[n - 1] * even;
    }
    if (thing.clang > 0.0f && amount > 0.0f) {
      for (int c = 0; c < kClang; ++c) {
        const int k = kFree + kLoaded + c;
        const float hz = frequency * clang_ratio(c, position);
        if (hz >= top || hz < 5.0f) continue;
        const double w = 2.0 * 3.14159265358979323846 * static_cast<double>(hz) / static_cast<double>(sr);
        voice.turn_re[k] = static_cast<float>(std::cos(w));
        voice.turn_im[k] = static_cast<float>(std::sin(w));
        voice.object[k] = kSixtyDb / (kClangSeconds[c] * sr);
        voice.re[k] = full * thing.clang * amount;
      }
    }
    tune(voice);
    ring_out(voice);

    // The buzz.
    const float loose = std::sqrt(amount);
    voice.buzz_fixed = loose * thing.buzz;
    voice.buzz_knob = loose * thing.rattle;
    voice.depth = voice.depth_to = kit::clamp(voice.buzz_fixed + voice.buzz_knob * rattle_.value, 0.0f, 1.0f);
    voice.depth_step = 0.0f;
    voice.gap = kGap * unit(frequency);
    voice.rustle = thing.rustle;
    voice.hiss = 0.0f;
    for (float& state : voice.high) state = 0.0f;
    for (int i = 0; i < kChunk; ++i) voice.fed[i] = voice.feed[i] = 0.0f;
    voice.feeding = false;
    voice.buzzing = voice.depth > 0.0f;
    voice.strings_only = false;

    // The thud.
    const float thud = param(kThud);
    voice.thump.reset();
    voice.tock.reset();
    voice.thump.set(kThumpHz, kThumpQ, sr);
    voice.tock.set(kTockHz, kTockQ, sr);
    voice.thud_gain = kThudLevel * thud * strength(gain) / thud_clock_;
    voice.thud_env = 1.0f;
    voice.thud_phase = 0.0f;
    voice.thud_left = voice.thud_gain > 0.0f ? static_cast<int>(kThudLength * sr) : 0;

    voice.place = kit::clamp((kit::hz_to_midi(frequency) - kStageCentre) / kStageSpan, -1.0f, 1.0f);
    stage(voice, width_.value);
    for (int g = 0; g < 6; ++g) {
      voice.gain[g] = voice.gain_to[g];
      voice.gain_step[g] = 0.0f;
    }
    // As loud as it will be, before it has sounded (the pool steals by level).
    voice.follow = kit::max(full, kSilence);
  }

  // How strongly the hammer lights partial n at `hz`.
  static float hammer(int n, float hz, float corner) {
    const float nf = static_cast<float>(n);
    const float comb = kCombFloor + (1.0f - kCombFloor) * std::fabs(std::sin(kit::kPi * nf * kHammerPoint));
    const float over = hz / corner;
    return std::pow(nf, -kTilt) * comb / (1.0f + over * over);
  }

  // The two strings of a note, Detune apart: the turn per sample of every
  // partial they have. A partial keeps its place in its turn when the knob
  // moves under a sounding note, so the pitch slides and nothing jumps.
  // (ring_out follows, to put the decays on the new turns.)
  void tune(Voice& voice) {
    using namespace prepared_piano;
    const double sr = static_cast<double>(sample_rate());
    const float cents = kMaxDetuneCents * param(kDetune) * param(kDetune);
    const float apart[2] = {kit::cents_to_ratio(-0.5f * cents), kit::cents_to_ratio(0.5f * cents)};
    for (int k = 0; k < kFree + kLoaded; ++k) {
      if (voice.hz[k] <= 0.0f) continue;
      const double w = 2.0 * 3.14159265358979323846 * static_cast<double>(voice.hz[k] * apart[k < kFree ? 0 : 1]) / sr;
      voice.turn_re[k] = static_cast<float>(std::cos(w));
      voice.turn_im[k] = static_cast<float>(std::sin(w));
    }
    voice.tuned = detune_serial_;
  }

  // The decay of every partial from Decay and the key's state: held, let go
  // (the damper half down) or struck again (the hammer stops the old note).
  void ring_out(Voice& voice) {
    using namespace prepared_piano;
    const float sr = sample_rate();
    const float decay = param(kDecay);
    float least = 0.0f;  // no partial dies slower than this
    if (voice.choked) {
      least = kSixtyDb / (kChokeSeconds * sr);
    } else if (voice.released) {
      least = kSixtyDb / (kReleaseSeconds * std::pow(decay, kReleasePower) * sr);
    }
    for (int k = 0; k < kSlots; ++k) {
      if (voice.turn_im[k] == 0.0f) continue;
      const float radius = std::exp(-kit::max(voice.plain[k] / decay + voice.object[k], least));
      voice.step_re[k] = radius * voice.turn_re[k];
      voice.step_im[k] = radius * voice.turn_im[k];
    }
    voice.rung = decay_serial_;
    voice.rung_released = voice.released;
    voice.rung_choked = voice.choked;
  }

  // Where the note stands: low keys to the left, the free string a little
  // left of the prepared one, the thud and the buzz between them.
  static void stage(Voice& voice, float width) {
    const float centre = voice.place * kStageEdge * width;
    const float spread = kStringSpread * width;
    kit::pan_gains(centre - spread, &voice.gain_to[0], &voice.gain_to[1]);
    kit::pan_gains(centre + spread, &voice.gain_to[2], &voice.gain_to[3]);
    kit::pan_gains(centre, &voice.gain_to[4], &voice.gain_to[5]);
  }

  // Every kChunk samples: follow the knobs, start the notes that waited for
  // a fade, retire the notes that have rung out.
  void control() {
    using namespace prepared_piano;
    const float rattle = rattle_.next();
    const float width = width_.next();
    const float tone = tone_.next();
    if (tone != tone_set_) set_tone(tone);
    const bool moved = width != width_set_;
    width_set_ = width;
    int refresh = 2;  // a Decay or Detune move reaches two notes a tick: 42 exponentials each, 40 turns for Detune
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.sounding) continue;
      if (voice.gone) {
        // The 2 ms fade is over: the note that waited starts, or nothing does.
        if (voice.pending) {
          start(voice, voice.pending_frequency, voice.pending_gain);
        } else {
          retire(voice);
        }
        continue;
      }
      if (voice.pending || voice.fading) {
        // On its way out: its ramps stop where they are and nothing is fed back.
        voice.depth_to = voice.depth;
        voice.depth_step = 0.0f;
        for (int g = 0; g < 6; ++g) {
          voice.gain_to[g] = voice.gain[g];
          voice.gain_step[g] = 0.0f;
        }
        voice.feeding = false;
        continue;
      }
      if (voice.rung_released != voice.released || voice.rung_choked != voice.choked) {
        ring_out(voice);
      } else if ((voice.rung != decay_serial_ || voice.tuned != detune_serial_) && refresh > 0) {
        if (voice.tuned != detune_serial_) tune(voice);
        ring_out(voice);
        --refresh;
      }
      // Last tick's ramps have landed; set the next.
      voice.depth = voice.depth_to;
      voice.depth_to = kit::clamp(voice.buzz_fixed + voice.buzz_knob * rattle, 0.0f, 1.0f);
      voice.depth_step = (voice.depth_to - voice.depth) * (1.0f / kChunk);
      for (int g = 0; g < 6; ++g) voice.gain[g] = voice.gain_to[g];
      if (moved) stage(voice, width);
      for (int g = 0; g < 6; ++g) voice.gain_step[g] = (voice.gain_to[g] - voice.gain[g]) * (1.0f / kChunk);
      // The bursts of the last period go back into the strings in this one.
      bool feeding = false;
      for (int i = 0; i < kChunk; ++i) {
        voice.fed[i] = voice.feed[i];
        voice.feed[i] = 0.0f;
        feeding = feeding || voice.fed[i] != 0.0f;
      }
      voice.feeding = feeding;

      float energy = 0.0f;
      for (int k = 0; k < kSlots; ++k) {
        const float power = voice.re[k] * voice.re[k] + voice.im[k] * voice.im[k];
        if (power < kCull && !feeding) voice.re[k] = voice.im[k] = 0.0f;  // (a partial being fed is on its way up)
        energy += power;
      }
      voice.follow = std::sqrt(energy);
      // The buzz has work to do while the swing can still reach the gap (it
      // can be no larger than its partials laid end to end) or a burst is
      // still ringing in its filters.
      float reach = 0.0f;
      for (int k = 0; k < kSide; ++k) {
        reach += std::sqrt(voice.re[k] * voice.re[k] + voice.im[k] * voice.im[k]);
        reach += std::sqrt(voice.re[kFree + k] * voice.re[kFree + k] + voice.im[kFree + k] * voice.im[kFree + k]);
      }
      const float open = kit::max(voice.depth, voice.depth_to);
      const bool ringing = voice.high[0] != 0.0f || voice.high[1] != 0.0f || voice.high[2] != 0.0f || voice.high[3] != 0.0f;
      voice.buzzing = open > 0.0f && (ringing || reach > voice.gap * (1.0f - kGapClose * open));
      bool moving = false;
      for (int g = 0; g < 6; ++g) moving = moving || voice.gain_step[g] != 0.0f;
      voice.strings_only = !moving && !voice.buzzing && voice.thud_left == 0;
      if (voice.follow < kSilence && voice.thud_left == 0 && !feeding) retire(voice);
    }
  }

  void retire(Voice& voice) {
    voice.sounding = voice.pending = voice.fading = voice.gone = false;
    voice.follow = 0.0f;
    voice.thud_left = 0;
    for (int k = 0; k < kSlots; ++k) voice.re[k] = voice.im[k] = 0.0f;
  }

  // `n` samples of one note, starting `offset` samples into the control period.
  void render_voice(Voice& voice, int offset, int n, float* left, float* right) {
    // The partials, four at a time: each is a chain from one sample to the
    // next, and four chains side by side cost little more than one. The
    // first four of each string are its swing, which the buzz reads and
    // never feeds; the bursts go back into the partials above them only, so
    // nothing the buzz does can come round and raise the buzz.
    float string[2][kChunk] = {};
    float swing[kChunk] = {};
    float low[kChunk];
    const float* fed = voice.fed + offset;
    for (int first = 0; first < kSlots; first += kSide) {
      const int count = kSlots - first < kSide ? kSlots - first : kSide;
      const bool swings = first == 0 || first == kFree;
      const bool pushed = voice.feeding && !swings && first < kFree + kLoaded;
      float re[kSide] = {}, im[kSide] = {}, step_re[kSide] = {}, step_im[kSide] = {};
      bool still = !pushed;
      for (int j = 0; j < count; ++j) {
        re[j] = voice.re[first + j];
        im[j] = voice.im[first + j];
        step_re[j] = voice.step_re[first + j];
        step_im[j] = voice.step_im[first + j];
        still = still && re[j] == 0.0f && im[j] == 0.0f;
      }
      if (still) continue;
      float* whole = string[first < kFree ? 0 : 1];
      float* out = swings ? low : whole;
      if (swings) {
        for (int i = 0; i < n; ++i) low[i] = 0.0f;
      }
      for (int i = 0; i < n; ++i) {
        const float push = pushed ? fed[i] : 0.0f;
        float sum = 0.0f;
        for (int j = 0; j < kSide; ++j) {
          const float turned = step_re[j] * re[j] - step_im[j] * im[j] + push;
          im[j] = step_re[j] * im[j] + step_im[j] * re[j];
          re[j] = turned;
          sum += im[j];
        }
        out[i] += sum;
      }
      for (int j = 0; j < count; ++j) {
        const bool there = step_im[j] != 0.0f;  // a slot with no partial in it holds nothing
        voice.re[first + j] = there ? re[j] : 0.0f;
        voice.im[first + j] = there ? im[j] : 0.0f;
      }
      if (swings) {
        for (int i = 0; i < n; ++i) {
          swing[i] += low[i];
          whole[i] += low[i];
        }
      }
    }

    // The buzz and the thud, which sit between the strings.
    float extra[kChunk] = {};
    if (voice.buzzing) {
      const float cap = kBurstCap * voice.gap / kGap;
      float depth = voice.depth;
      for (int i = 0; i < n; ++i) {
        depth += voice.depth_step;
        // Nothing until the string swings past the gap, then as much as it
        // goes past it.
        const float past = swing[i] - voice.gap * (1.0f - kGapClose * depth);
        const float burst = kit::clamp(past, 0.0f, cap);
        // Part tick, part rustle: noise held to a band that is the same at every rate.
        const float white = voice.rng.bipolar() * noise_scale_;
        voice.hiss = white + (voice.hiss - white) * buzz_low_;
        const float raw = burst * (1.0f - voice.rustle + voice.rustle * kRustleGain * voice.hiss);
        // Heard above 2.5 kHz only: what is under it is the note itself.
        // Two first-order high-passes, each unity at the top of the band.
        const float once = flush_denormal(buzz_edge_ * (raw - voice.high[0]) + buzz_high_ * voice.high[1]);
        voice.high[0] = raw;
        voice.high[1] = once;
        const float twice = flush_denormal(buzz_edge_ * (once - voice.high[2]) + buzz_high_ * voice.high[3]);
        voice.high[2] = once;
        voice.high[3] = twice;
        const float buzz = depth * (2.0f - depth) * twice;
        extra[i] = kBuzzLevel * buzz;
        voice.feed[offset + i] = buzz_feed_ * buzz;
      }
      voice.depth = depth;
    }
    if (voice.thud_left > 0) {
      for (int i = 0; i < n && voice.thud_left > 0; ++i) {
        // The noise is drawn 48000 times a second whatever the rate, so the
        // knock is the same knock everywhere; the filters keep only its lows.
        float burst = 0.0f;
        for (voice.thud_phase += thud_clock_; voice.thud_phase >= 1.0f; voice.thud_phase -= 1.0f) {
          burst += voice.thud_env * voice.thud_rng.bipolar();
          voice.thud_env *= kThudDecay;
        }
        extra[i] += voice.thud_gain * voice.thump.highpass(voice.tock.lowpass(burst));
        --voice.thud_left;
      }
    }

    float* gain = voice.gain;
    const float* step = voice.gain_step;
    if (!(voice.pending || voice.fading)) {
      if (voice.strings_only) {
        // Nothing moves on the stage and there is no buzz or thud this
        // control period: the two strings alone.
        for (int i = 0; i < n; ++i) {
          left[i] += gain[0] * string[0][i] + gain[2] * string[1][i];
          right[i] += gain[1] * string[0][i] + gain[3] * string[1][i];
        }
        return;
      }
      for (int i = 0; i < n; ++i) {
        for (int g = 0; g < 6; ++g) gain[g] += step[g];
        left[i] += gain[0] * string[0][i] + gain[2] * string[1][i] + gain[4] * extra[i];
        right[i] += gain[1] * string[0][i] + gain[3] * string[1][i] + gain[5] * extra[i];
      }
      return;
    }
    // A stolen or cancelled note: out over 2 ms. What follows waits for the
    // next control tick, which falls on the same sample at any block size.
    for (int i = 0; i < n; ++i) {
      voice.steal = kit::max(voice.steal - steal_step_, 0.0f);
      left[i] += voice.steal * (gain[0] * string[0][i] + gain[2] * string[1][i] + gain[4] * extra[i]);
      right[i] += voice.steal * (gain[1] * string[0][i] + gain[3] * string[1][i] + gain[5] * extra[i]);
    }
    if (voice.steal <= 0.0f) voice.gone = true;
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::Smoother rattle_, tone_, width_;  // stepped once a control period
  kit::Smoother volume_;                 // stepped every sample
  kit::Svf tone_left_, tone_right_;
  kit::IdleGate idle_;
  uint32_t decay_serial_ = 1, detune_serial_ = 1;
  int chunk_left_ = 0;
  float tone_set_ = -1.0f, width_set_ = -1.0f;
  float steal_step_ = 0.0f;
  float noise_scale_ = 1.0f;
  float buzz_high_ = 0.0f, buzz_edge_ = 0.0f, buzz_low_ = 0.0f, buzz_feed_ = 0.0f;
  float thud_clock_ = 1.0f;
};

}  // namespace livemix
