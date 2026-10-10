#pragma once

// Afterglow: a soft strike that leaves light behind.
//
//   per key (up to 16), per partial (up to 8):
//
//                    ┌─► strike: rise, then its own decay ──────────┐
//     one turning    │                                              ├─► left
//     sine/cosine ───┼─► glow: a pair a little apart (Drift), under ┤
//     pair at the    │   the note's bloom / hold / fade, with its   ├─► right
//     partial's      │   own slow rise and fall (Evolve) and Tone   │
//     frequency      └─► halo: the same pair an octave up ──────────┘
//
//   all keys ─► volume ─► soft clip ─► out
//
// - A partial is one complex number of length 1 turned by a fixed angle every
//   sample: its imaginary part is the sine, its real part the cosine. The
//   strike is the sine under a decaying level. Nothing else is made: there
//   is no filter, no noise and no delay in the instrument.
// - The glow is that same partial, held. Two sines Drift apart, sin(p + b)
//   and sin(p - b), are the sine and the cosine each times a slow number
//   (cos b and sin b), so the pair costs no second oscillator and sits
//   exactly at the strike's frequency, one half above it and one below. The
//   halves lean to opposite sides (Width), so in the middle they beat and at
//   the sides they turn.
// - The glow's weights are the strike's as they stand a moment after the hit
//   (each partial's weight times its own decay over kMoment), brought to unit
//   power; Tone tilts them and Evolve moves each by its own slow sine, all
//   but the played note's own partial, and brings the moved ones back to the
//   power they had: Evolve changes colour, not level and not pitch. A strike
//   or a glow spread over many partials peaks higher than a plain one at the
//   same power, so both are levelled halfway between unit power and unit
//   sum: one key peaks within 2 dB of another from 28 Hz to 4.2 kHz.
// - Halo is the pair an octave up, beating twice as fast, on the lowest four
//   partials. Where the source has a partial an octave above (a string's
//   second over its first, a bell's prime over its hum) the halo is more of
//   that partial, a quarter turn from its own glow, because a stiff string's
//   octaves are a little wide and a sine at exactly twice would beat against
//   them even with Drift at 0. Where it has none (a glass) the lowest such
//   partial makes its octave from the double-angle formulas of its own
//   turning number.
// - A note's glow rises over Bloom, holds while the key is down and falls by
//   60 dB per Fade. A key let go before the glow is up still blooms, to the
//   share it earned: in power the part of Bloom it was held for, over what
//   the shortest touch gets (kTouch). A legato line then leaves about one
//   note's glow at any speed, and a run of short notes under a long Bloom
//   does not come back seconds later louder than the playing. The strike
//   rings for Decay whatever the key does.
// - One pitch has one voice. A key struck again while it still sounds is the
//   same string struck again (restrike()): the new strike pushes the way
//   each partial is already going, the old strike gives way to it over the
//   attack, and the glow blooms again from where it stands. Under a long
//   Fade a repeated key neither stacks glow on glow nor uses up the voices.
// - Every partial starts at zero, as a struck thing does, with a sign of its
//   own (kSign) that turns over from one note to the next: ten keys struck
//   at once then push in ten directions instead of one.
// - A stolen voice fades over 3 ms and the new note waits in it (pending);
//   a voice counts as loud as its note will be until that note has arrived.
// - Sources: Felt and Pluck are stiff strings (harmonics stretched a little),
//   Bell is hum, prime, nominal and the upper partials of a cast bell without
//   its third and fifth (a held minor third under every key would fight a
//   chord), Glass is the rim modes of a wineglass.
//
// Everything but the turning itself runs on a control tick of 32 samples;
// every level is a straight line between two ticks. The instrument sleeps
// when no key sounds.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Afterglow : public kit::DeviceBase<afterglow::kNumParams> {
 public:
  static constexpr int kMaxVoices = 16;
  static constexpr int kPartials = 8;
  static constexpr int kHaloPartials = 4;  // the partials that get a halo
  enum Source : int { kFelt = 0, kBell, kPluck, kGlass, kNumSources };

  // What a source is: where its partials sit, how strong each is at the hit,
  // and how it rings.
  struct SourceTable {
    float ratio[kPartials];   // to the played note, ascending
    float weight[kPartials];
    float stiffness;          // stretches the ratios as a stiff string does
    float damping;            // extra decay rate per unit of ratio above the lowest partial
    float attack;             // seconds the strike takes to arrive
  };

  static const SourceTable& source_table(int source) {
    static const SourceTable kTables[kNumSources] = {
        // Felt: a piano string under a soft hammer.
        {{1.0f, 2.0f, 3.0f, 4.0f, 5.0f, 6.0f, 7.0f, 8.0f},
         {1.0f, 0.5f, 0.28f, 0.17f, 0.11f, 0.07f, 0.045f, 0.03f},
         4.0e-4f, 0.5f, 0.005f},
        // Bell: hum, prime, nominal, then the upper partials of a cast bell.
        {{0.5f, 1.0f, 2.0f, 3.01f, 4.17f, 5.43f, 6.8f, 8.21f},
         {0.3f, 0.8f, 1.0f, 0.55f, 0.45f, 0.3f, 0.2f, 0.12f},
         0.0f, 0.06f, 0.001f},
        // Pluck: a string pulled a little under a quarter of the way along.
        {{1.0f, 2.0f, 3.0f, 4.0f, 5.0f, 6.0f, 7.0f, 8.0f},
         {1.0f, 0.75f, 0.42f, 0.094f, 0.14f, 0.23f, 0.2f, 0.09f},
         6.0e-5f, 0.3f, 0.0008f},
        // Glass: the rim modes of a wineglass.
        {{1.0f, 2.32f, 4.25f, 6.63f, 9.38f, 12.5f, 15.95f, 19.75f},
         {1.0f, 0.35f, 0.16f, 0.08f, 0.04f, 0.02f, 0.012f, 0.006f},
         0.0f, 0.12f, 0.003f},
    };
    return kTables[kit::clamp_int(source, 0, kNumSources - 1)];
  }

  // A partial's ratio to the played note: the table's, stretched, with the
  // partial at 1 left exactly on the note.
  static float partial_ratio(const SourceTable& table, int k) {
    const float base = table.ratio[k];
    return base * std::sqrt((1.0f + table.stiffness * base * base) / (1.0f + table.stiffness));
  }

  void init(float sample_rate) {
    using namespace afterglow;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) pool_.voices[v] = Voice();
    start_.seed(0x51A7E61Du);
    flip_ = false;
    order_ = 0;
    tick_seconds_ = static_cast<float>(kChunk) / sr;
    const float tick_rate = sr / static_cast<float>(kChunk);
    yield_turn_ = std::exp(-kSixtyDb * tick_seconds_ / kYieldSeconds);
    shade_rate_ = 1.0f - std::exp(-tick_seconds_ / kKnobSeconds);
    strike_.set_time(kKnobSeconds, tick_rate);
    glow_.set_time(kKnobSeconds, tick_rate);
    halo_.set_time(kKnobSeconds, tick_rate);
    tone_.set_time(kKnobSeconds, tick_rate);
    evolve_.set_time(kKnobSeconds, tick_rate);
    width_.set_time(kKnobSeconds, tick_rate);
    share_.set_time(kKnobSeconds, tick_rate);
    volume_.set_time(kSmoothingSeconds, sr);
    decay_serial_ = drift_serial_ = 1;
    chunk_left_ = 0;
    fade_seen_ = -1.0f;
    width_seen_ = -1.0f;
    share_seen_ = -1.0f;
    // Nothing outlives the notes: there is no delay or filter to empty.
    idle_.reset(sr, 0.1f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    // The played note itself always fits under the top of the band.
    frequency = kit::clamp(frequency, kMinHz, kit::min(kMaxHz, 0.4f * sample_rate()));
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    // Nothing sounds: whatever was moved in the silence has arrived, and the
    // control tick starts with the note (the same sample at any block size).
    if (pool_.count_active() == 0) restart();

    const int held = find_key(note_id);
    if (held >= 0) {
      Voice& again = pool_.voices[held];
      if (again.pending) {
        // Struck again before it could start: the waiting note is this one.
        again.pending_frequency = frequency;
        again.pending_gain = gain;
        again.loud = again.promise = promise(gain);
        return;
      }
      again.held = false;  // the same key again: the old note goes on to its fade
    }
    // The same pitch struck again is one string struck again, and a string
    // has one voice: the note that still sounds takes the new strike (see
    // restrike()), so a key played over and over under a long Fade neither
    // piles glow on glow nor uses up the voices.
    const int source = kit::clamp_int(static_cast<int>(param(afterglow::kSource) + 0.5f), 0, kNumSources - 1);
    int same = -1;
    float carried = 0.0f;
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& old = pool_.voices[v];
      if (!old.sounding) continue;
      const float other = old.pending ? old.pending_frequency : old.frequency;
      if (other > frequency * kSamePitch || frequency > other * kSamePitch) continue;
      if (old.pending) {
        // A note of this pitch is waiting for a stolen voice: it becomes this one.
        old.pending_gain = gain;
        old.loud = old.promise = promise(gain);
        take(old, note_id);
        return;
      }
      if (old.source == source && same < 0) {
        same = v;
      } else {
        // Struck as something else since (or a second voice of this pitch):
        // it makes way while the new note blooms, see control().
        carried = kit::max(carried, old.env * handover(old.yield) * old.amp);
        old.held = false;
        old.yielding = true;
      }
    }
    if (same >= 0) {
      restrike(pool_.voices[same], gain);
      take(pool_.voices[same], note_id);
      return;
    }
    carried = kit::min(carried / (kVoiceGain * (0.25f + 0.75f * gain)), 1.0f);
    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    take(voice, note_id);
    if (stolen) {
      // The old note fades over 3 ms, then this one starts (see control()).
      voice.pending = true;
      voice.pending_frequency = frequency;
      voice.pending_gain = gain;
      voice.pending_carry = carried;
      voice.loud = voice.promise = promise(gain);
    } else {
      start(voice, frequency, gain, carried);
    }
  }

  void note_off(int note_id) {
    const int held = find_key(note_id);
    // A note still waiting for its stolen voice starts all the same, let go.
    if (held >= 0) pool_.voices[held].held = false;
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
        if (pool_.voices[v].sounding) render(pool_.voices[v], n, left, right);
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
  static constexpr float kMinHz = 16.0f;
  static constexpr float kMaxHz = 12000.0f;
  static constexpr float kMiddleC = 261.6256f;
  static constexpr float kSixtyDb = 6.907755279f;
  static constexpr float kTopOfBand = 0.45f;       // partials above this share of the sample rate are left out
  static constexpr float kKnobSeconds = 0.015f;    // how fast a level knob arrives
  static constexpr float kStealSeconds = 0.003f;   // a stolen note's way out
  static constexpr float kFloor = 1.0e-4f;         // a strike or a fade this far down is over
  // One key at velocity 0.7 peaks near -22 dBFS at the default volume, and
  // ten held keys stay under the clip's knee.
  static constexpr float kVoiceGain = 0.42f;
  static constexpr float kVelocityTilt = 0.6f;     // a harder strike is brighter: power of the ratio per unit of gain
  static constexpr float kKeyTilt = 0.5f;          // low notes are brighter, high ones rounder: power per octave
  static constexpr float kKeyDecay = 0.3f;         // and ring longer: power per octave
  static constexpr float kMoment = 0.3f;           // the glow is the strike this long after the hit ...
  static constexpr float kMomentDecay = 3.0f;      // ... of a strike that rings this long
  static constexpr float kToneTilt = 1.5f;         // Tone: up to this power of the ratio either way
  static constexpr float kMaxBeat = 3.0f;          // Hz between the halves of the lowest partial, Drift at 1
  static constexpr float kEvolveDepth = 0.8f;      // Evolve at 1: a partial moves between 0.2 and 1.8 of its weight
  static constexpr float kTouch = 0.3f;            // the share of its glow the shortest touch of a key earns
  static constexpr float kYieldSeconds = 0.25f;    // a strike rings out this fast once its key is struck again
  static constexpr float kSamePitch = 1.003f;      // two notes this near (5 cents) are one key
  // The two halves of a pair have unit power together and are unequal: the
  // weaker one's share of the power grows with Drift, to a third at 1. A
  // little Drift is then a slow and shallow beat (6 dB in mono at 0.3) and
  // a lot of it a fast and deep one (15 dB), and none of it is one sine.
  static constexpr float kFarShare = 0.33f;
  static constexpr float kPairPan = 0.6f;          // how far the halves lean, Width at 1
  static constexpr float kStrikePan = 0.2f;
  static constexpr float kHaloPan = 0.7f;
  static constexpr float kSign[kPartials] = {1.0f, 1.0f, 1.0f, -1.0f, -1.0f, -1.0f, 1.0f, 1.0f};

  enum Stage : int { kBloomStage = 0, kHoldStage, kFadeStage, kDoneStage };
  // The lines a partial is drawn with: sine and cosine to the left and the
  // right, and the sine and cosine of the octave above for the halo.
  enum Line : int { kSinLeft = 0, kSinRight, kCosLeft, kCosRight, kLines };

  struct Voice {
    // Per partial: the turn per sample and the number it turns.
    float turn_re[kPartials] = {}, turn_im[kPartials] = {};
    float re[kPartials] = {}, im[kPartials] = {};
    float ratio[kPartials] = {};
    float damp[kPartials] = {};        // decay rate against the lowest partial's
    float strike[kPartials] = {};      // weight in the strike
    float ring[kPartials] = {};        // the strike's level, 1 at the hit
    float ring_turn[kPartials] = {};   // and its decay per tick
    float glow[kPartials] = {};        // weight in the glow, unit power
    float toned[kPartials] = {};       // ... with Tone, unit power
    float pace[kPartials] = {};        // this partial's share of the beat rate
    float beat_re[kPartials] = {}, beat_im[kPartials] = {};        // cos b, sin b
    float beat_turn_re[kPartials] = {}, beat_turn_im[kPartials] = {};
    float wander_re[kPartials] = {}, wander_im[kPartials] = {};    // Evolve's slow sine
    float wander_turn_re[kPartials] = {}, wander_turn_im[kPartials] = {};
    float side[kPartials] = {};        // +1 or -1: which way the upper half leans
    float aim_sin[kPartials] = {}, aim_cos[kPartials] = {};          // the strike's place on the turn: 1, 0 for a new note
    float residue_sin[kPartials] = {}, residue_cos[kPartials] = {};  // what rang of the last strike when the key was struck again
    float toned_to[kPartials] = {};    // where toned is heading
    int onto[kPartials] = {};          // the partial an octave above this one, where its halo goes, or -1
    float now[kLines][kPartials] = {}, to[kLines][kPartials] = {}, step[kLines][kPartials] = {};
    bool audible[kPartials] = {};
    int count = 0;
    int made = -1;             // the partial whose halo is made from its own turning number, or -1
    float above_now[kLines] = {}, above_to[kLines] = {}, above_step[kLines] = {};  // that halo's lines
    bool above_lit = false;
    int source = 0;            // what it was struck as
    int played = -1;           // the partial that is the played note itself, or -1
    int key = -1;              // the host's note id
    uint32_t order = 0;        // when the key was last struck
    int stage = kDoneStage;
    float amp = 0.0f;          // velocity
    float key_decay = 1.0f;    // Decay's multiple for this register
    float trim = 1.0f, trim_to = 1.0f;  // the glow's level for its spread of partials
    float rise = 0.0f, rise_rate = 1.0f;  // the strike arriving
    float bloom = 0.0f;        // 0..1 of the way through Bloom
    float env = 0.0f;          // the glow's envelope
    float earn = 1.0f;         // where the bloom is heading: 1 for a held key, less for one let go early
    float carry = 0.0f;        // the glow this key already had when it was struck again
    float from = 0.0f, from_bloom = 0.0f;  // the envelope and the bloom's curve when the key was let go
    float yield = 0.0f;        // 0..1 of the way out, once the same key has been struck again
    float frequency = 0.0f;    // the played note
    float steal = 1.0f;
    float loud = 0.0f, promise = 0.0f;
    float pending_frequency = 440.0f, pending_gain = 0.0f, pending_carry = 0.0f;
    float tone_seen = -1.0f;
    uint32_t decay_seen = 0, drift_seen = 0;
    bool sounding = false, held = false, pending = false, ringing = false;
    bool let_go = false, yielding = false, fresh = false;

    bool active() const { return sounding; }
    bool releasing() const { return !held; }
    float level() const { return loud; }
  };

  // The voice whose key this is from now on.
  void take(Voice& voice, int note_id) {
    voice.key = note_id;
    voice.order = ++order_;
    voice.held = true;
  }

  // The newest voice held under this note id, or -1. (The pool keeps note
  // ids of its own, but a voice that is struck again changes hands without
  // the pool.)
  int find_key(int note_id) const {
    int choice = -1;
    for (int v = 0; v < kMaxVoices; ++v) {
      const Voice& voice = pool_.voices[v];
      if (voice.key != note_id || !voice.sounding || !voice.held) continue;
      if (choice < 0 || voice.order > pool_.voices[choice].order) choice = v;
    }
    return choice;
  }

  // As loud as a note of this velocity will get, before it has sounded.
  float promise(float gain) const {
    return kVoiceGain * (0.25f + 0.75f * gain) * kit::max(kit::max(strike_.target, glow_.target), 1.0e-3f);
  }

  // Nothing is sounding: knobs land where they point and the tick restarts.
  void restart() {
    strike_.snap(strike_.target);
    glow_.snap(glow_.target);
    halo_.snap(halo_.target);
    tone_.snap(tone_.target);
    evolve_.snap(evolve_.target);
    width_.snap(width_.target);
    share_.snap(share_.target);
    volume_.snap(volume_.target);
    width_seen_ = -1.0f;
    chunk_left_ = 0;
  }

  // A glow that is making way: equal power with the bloom that replaces it.
  static float handover(float yield) {
    const float risen = yield * yield * (3.0f - 2.0f * yield);
    return std::sqrt(kit::max(1.0f - risen * risen, 0.0f));
  }

  // A voice's weights for a strike of this hardness: the strike's partials,
  // and the glow's, which are the strike's a moment later (so a soft key
  // glows darker).
  void weigh(Voice& voice, float gain) {
    const SourceTable& table = source_table(voice.source);
    const float octaves = std::log2(kMiddleC / voice.frequency);  // below middle C
    const float key_tilt = kit::clamp(kKeyTilt * octaves, -0.5f, 0.8f);
    const float velocity_tilt = kVelocityTilt * (gain - 0.7f);
    float strike_sum = 0.0f, strike_power = 0.0f, glow_power = 0.0f;
    for (int k = 0; k < voice.count; ++k) {
      const float weight = table.weight[k] * std::pow(voice.ratio[k], key_tilt);
      voice.strike[k] = weight * std::pow(voice.ratio[k], velocity_tilt);
      voice.glow[k] = voice.strike[k] * std::pow(10.0f, -3.0f * kMoment * voice.damp[k] / kMomentDecay);
      strike_sum += weight;
      strike_power += weight * weight;
      glow_power += voice.glow[k] * voice.glow[k];
    }
    // Halfway between unit power and unit sum: a note of many partials is
    // neither much louder nor much peakier than one that is almost a sine.
    const float strike_scale = 1.0f / std::sqrt(strike_sum * std::sqrt(strike_power));
    const float glow_scale = 1.0f / std::sqrt(glow_power);
    for (int k = 0; k < voice.count; ++k) {
      voice.strike[k] *= strike_scale;
      voice.glow[k] *= glow_scale;
    }
    voice.amp = kVoiceGain * (0.25f + 0.75f * gain);
    voice.tone_seen = -1.0f;  // the next tick tilts the new weights
  }

  void start(Voice& voice, float frequency, float gain, float carried) {
    using namespace afterglow;
    const float sr = sample_rate();
    voice.source = kit::clamp_int(static_cast<int>(param(kSource) + 0.5f), 0, kNumSources - 1);
    const SourceTable& table = source_table(voice.source);
    const float octaves = std::log2(kMiddleC / frequency);  // below middle C
    voice.key_decay = kit::clamp(std::exp2(kKeyDecay * octaves), 0.45f, 1.6f);
    const float lowest = partial_ratio(table, 0);
    // Successive notes lean their partials the other way round and strike
    // with the other sign.
    flip_ = !flip_;
    const float lean = flip_ ? 1.0f : -1.0f;
    int count = 0;
    voice.made = -1;
    voice.above_lit = false;
    for (int line = 0; line < kLines; ++line) voice.above_now[line] = voice.above_to[line] = voice.above_step[line] = 0.0f;
    voice.played = -1;
    for (int k = 0; k < kPartials; ++k) {
      // Drawn for every partial, in band or not, so a note always takes the
      // same number of values from the generator.
      const float wander_start = start_.uniform();
      const float wander_period = 6.0f + 13.0f * start_.uniform();
      const float pace = 0.7f + 0.9f * start_.uniform();
      const float ratio = partial_ratio(table, k);
      const float hz = frequency * ratio;
      const bool in_band = hz < kTopOfBand * sr && count == k;
      for (int line = 0; line < kLines; ++line) {
        voice.now[line][k] = voice.to[line][k] = voice.step[line][k] = 0.0f;
      }
      voice.audible[k] = false;
      voice.ring[k] = 0.0f;
      voice.residue_sin[k] = voice.residue_cos[k] = 0.0f;
      voice.aim_sin[k] = 1.0f;
      voice.aim_cos[k] = 0.0f;
      voice.onto[k] = -1;
      if (!in_band) continue;
      ++count;
      if (k < kHaloPartials) {
        // Where the source has a partial an octave above this one (a string's
        // second above its first, a bell's prime above its hum), the halo is
        // that partial's own sine: a stiff string's octaves are a little
        // wide, and a second sine at exactly twice would beat against them.
        for (int j = k + 1; j < kPartials; ++j) {
          const float octave = partial_ratio(table, j) / (2.0f * ratio);
          if (octave > 0.98f && octave < 1.02f && frequency * partial_ratio(table, j) < kTopOfBand * sr) {
            voice.onto[k] = j;
          }
        }
        // Where it has none (a glass, a bell above its prime), the octave is
        // made from this partial's own turning number, for the lowest such.
        if (voice.onto[k] < 0 && voice.made < 0 && 2.0f * hz < kTopOfBand * sr) voice.made = k;
      }
      if (table.ratio[k] == 1.0f) voice.played = k;
      const double w = 2.0 * 3.14159265358979323846 * static_cast<double>(hz) / static_cast<double>(sr);
      voice.turn_re[k] = static_cast<float>(std::cos(w));
      voice.turn_im[k] = static_cast<float>(std::sin(w));
      // The sine starts at zero, as a struck thing does, and with a sign of
      // its own: where partials of two keys an octave apart fall together
      // they then meet as often against each other as with each other, and
      // the keys of a chord do not all push the same way at once.
      voice.re[k] = lean * kSign[k];
      voice.im[k] = 0.0f;
      voice.ratio[k] = ratio;
      voice.damp[k] = 1.0f + table.damping * (ratio / lowest - 1.0f);
      voice.ring[k] = 1.0f;
      // Every partial of every note beats at a pace of its own, the lowest
      // one too: the keys of a chord must not swell and sink together.
      voice.pace[k] = pace * std::pow(ratio / lowest, 0.25f);
      // The pair starts a quarter turn apart and closing: the two halves
      // come together as the glow arrives, not apart.
      voice.beat_re[k] = kit::kSqrtHalf;
      voice.beat_im[k] = -kit::kSqrtHalf;
      const float turn = kit::kTwoPi * tick_seconds_ / wander_period;
      voice.wander_turn_re[k] = std::cos(turn);
      voice.wander_turn_im[k] = std::sin(turn);
      voice.wander_re[k] = kit::SineTable::cos_lookup(wander_start);
      voice.wander_im[k] = kit::SineTable::lookup(wander_start);
      voice.side[k] = (k & 1) ? -lean : lean;
    }
    voice.count = count;
    voice.frequency = frequency;
    weigh(voice, gain);
    voice.fresh = true;  // the tilted weights land at once, with nothing to glide from
    voice.stage = kBloomStage;
    voice.bloom = 0.0f;
    voice.env = 0.0f;
    voice.earn = 1.0f;
    voice.carry = carried;
    voice.from = voice.from_bloom = 0.0f;
    voice.yield = 0.0f;
    voice.let_go = voice.yielding = false;
    voice.rise = 0.0f;
    voice.rise_rate = 1.0f - std::exp(-tick_seconds_ / table.attack);
    voice.steal = 1.0f;
    voice.loud = voice.promise = promise(gain);
    voice.decay_seen = voice.drift_seen = 0;  // the next tick sets Decay and Drift
    voice.sounding = true;
    voice.pending = false;
    voice.ringing = true;
  }

  // The key of a voice that still sounds is struck again: the same string,
  // so the same turning numbers. What rings of the old strike gives way to
  // the new one over the attack, and the glow blooms again from where it
  // stands, so nothing is stacked and nothing is taken away.
  void restrike(Voice& voice, float gain) {
    if (voice.yielding) {
      // It was making way for a strike of another kind; it stays after all.
      voice.env *= handover(voice.yield);
      voice.yield = 0.0f;
      voice.yielding = false;
    }
    const float was = voice.amp;
    for (int k = 0; k < voice.count; ++k) {
      const float rang = was * voice.rise * voice.strike[k] * voice.ring[k];
      voice.residue_sin[k] = voice.residue_sin[k] * (1.0f - voice.rise) + rang * voice.aim_sin[k];
      voice.residue_cos[k] = voice.residue_cos[k] * (1.0f - voice.rise) + rang * voice.aim_cos[k];
      voice.ring[k] = 1.0f;
      // The new strike pushes the way the partial is already going (its old
      // strike and its glow together, as they stand in the middle): a string
      // struck again gets louder, and never cancels what it was sounding.
      const float goes_sin = voice.now[kSinLeft][k] + voice.now[kSinRight][k];
      const float goes_cos = voice.now[kCosLeft][k] + voice.now[kCosRight][k];
      const float length = std::sqrt(goes_sin * goes_sin + goes_cos * goes_cos);
      if (length > 1.0e-9f) {
        voice.aim_sin[k] = goes_sin / length;
        voice.aim_cos[k] = goes_cos / length;
      }
    }
    weigh(voice, gain);
    voice.rise = 0.0f;
    voice.ringing = true;
    // The glow keeps its level through the change of hardness and goes on
    // from there to this strike's.
    voice.from = voice.env * was / voice.amp;
    voice.env = voice.from;
    voice.carry = kit::min(voice.from, 1.0f);
    voice.from_bloom = 0.0f;
    voice.bloom = 0.0f;
    voice.earn = 1.0f;
    voice.let_go = false;
    voice.stage = kBloomStage;
    voice.promise = promise(gain);
    voice.loud = kit::max(voice.loud, voice.promise);
  }

  void retire(Voice& voice) {
    voice.sounding = voice.pending = voice.ringing = false;
    voice.loud = 0.0f;
  }

  // Each partial's decay per tick: Decay is the lowest one's ring time at
  // middle C.
  void tune_decay(Voice& voice) {
    const float seconds = param(afterglow::kDecay) * voice.key_decay;
    for (int k = 0; k < voice.count; ++k) {
      voice.ring_turn[k] = std::exp(-kSixtyDb * tick_seconds_ * voice.damp[k] / seconds);
    }
    voice.decay_seen = decay_serial_;
  }

  // The halves of a pair sit b either side of the partial; they are 2b apart
  // and beat at that rate.
  void tune_drift(Voice& voice) {
    const float drift = param(afterglow::kDrift);
    const float beat_hz = kMaxBeat * drift * drift;
    for (int k = 0; k < voice.count; ++k) {
      const float turn = kit::kPi * beat_hz * voice.pace[k] * tick_seconds_;
      voice.beat_turn_re[k] = std::cos(turn);
      voice.beat_turn_im[k] = std::sin(turn);
    }
    voice.drift_seen = drift_serial_;
  }

  // Tone tilts the glow's weights about the played note, at unit power. A
  // glow of many even partials peaks far over one that is almost a sine at
  // the same power, so its level is trimmed halfway back, as the strike's is.
  // These are where the weights are heading: control() glides to them, so a
  // key struck again harder or softer changes colour without a step.
  void retone(Voice& voice, float tone) {
    const float tilt = kToneTilt * (2.0f * tone - 1.0f);
    float sum = 0.0f, power = 0.0f;
    for (int k = 0; k < voice.count; ++k) {
      voice.toned_to[k] = voice.glow[k] * std::pow(voice.ratio[k], tilt);
      sum += voice.toned_to[k];
      power += voice.toned_to[k] * voice.toned_to[k];
    }
    const float scale = 1.0f / std::sqrt(power);
    for (int k = 0; k < voice.count; ++k) voice.toned_to[k] *= scale;
    voice.trim_to = 1.0f / std::sqrt(sum * scale);
    voice.tone_seen = tone;
  }

  static void turn(float* re, float* im, float turn_re, float turn_im) {
    const float turned = turn_re * *re - turn_im * *im;
    *im = turn_re * *im + turn_im * *re;
    *re = turned;
    // Hold the length at 1: rounding would walk it off over minutes.
    const float trim = 1.5f - 0.5f * (*re * *re + *im * *im);
    *re *= trim;
    *im *= trim;
  }

  // Every kChunk samples: knobs, envelopes, the slow numbers, and the level
  // every line of every partial is to reach by the next tick.
  void control() {
    using namespace afterglow;
    const float strike = strike_.next();
    const float glow = glow_.next();
    const float halo = halo_.next();
    const float tone = tone_.next();
    const float depth = kEvolveDepth * evolve_.next();
    const float width = width_.next();
    const float far_share = share_.next();
    if (width != width_seen_ || far_share != share_seen_) {
      near_half_ = std::sqrt(1.0f - far_share);
      far_half_ = std::sqrt(far_share);
      share_seen_ = far_share;
      // Equal-power places for the two halves of a pair, 1 in the middle.
      // At Width 0 both are exactly 1, so left and right are the same samples.
      const float pair = (1.0f + kPairPan * width) * (kit::kHalfPi * 0.5f);
      const float near = width > 0.0f ? 1.41421356f * std::cos(pair) : 1.0f;
      const float far = width > 0.0f ? 1.41421356f * std::sin(pair) : 1.0f;
      sum_near_ = near_half_ * near + far_half_ * far;
      dif_near_ = near_half_ * near - far_half_ * far;
      sum_far_ = near_half_ * far + far_half_ * near;
      dif_far_ = near_half_ * far - far_half_ * near;
      const float place = (1.0f + kHaloPan * width) * (kit::kHalfPi * 0.5f);
      halo_near_ = width > 0.0f ? 1.41421356f * std::cos(place) : 1.0f;
      halo_far_ = width > 0.0f ? 1.41421356f * std::sin(place) : 1.0f;
      width_seen_ = width;
    }
    const float strike_lean = kStrikePan * width;
    const float fade = param(kFade);
    if (fade != fade_seen_) {
      fade_turn_ = std::exp(-kSixtyDb * tick_seconds_ / fade);
      fade_seen_ = fade;
    }
    const float bloom_step = tick_seconds_ / param(kBloom);
    const float steal_step = tick_seconds_ / kStealSeconds;

    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.sounding) continue;
      // The lines have arrived where the last tick sent them.
      bool silent = true;
      for (int line = 0; line < kLines; ++line) {
        voice.above_now[line] = voice.above_to[line];
        if (voice.above_now[line] != 0.0f) silent = false;
        for (int k = 0; k < voice.count; ++k) {
          voice.now[line][k] = voice.to[line][k];
          if (voice.now[line][k] != 0.0f) silent = false;
        }
      }
      if (voice.pending) {
        if (voice.steal <= 0.0f && silent) {
          start(voice, voice.pending_frequency, voice.pending_gain, voice.pending_carry);
        } else {
          voice.steal = kit::max(voice.steal - steal_step, 0.0f);
        }
      } else if (voice.stage == kDoneStage && !voice.ringing && silent) {
        retire(voice);
        continue;
      }
      if (voice.decay_seen != decay_serial_) tune_decay(voice);
      if (voice.drift_seen != drift_serial_) tune_drift(voice);
      if (voice.tone_seen != tone) retone(voice, tone);
      const float glide = voice.fresh ? 1.0f : shade_rate_;
      voice.fresh = false;
      voice.trim += (voice.trim_to - voice.trim) * glide;

      // The glow's envelope: all the way up, held with the key, then down.
      switch (voice.stage) {
        case kBloomStage: {
          // From where the envelope stood (0 for a new note, the old glow for
          // a key struck again) to what the note earns: all of it while the
          // key is down.
          if (!voice.held && !voice.let_go) {
            // Let go before the glow was up: it goes on rising, to the share
            // the key earned. In power that is the share of Bloom it was held
            // for, over what the shortest touch gets, so a line played legato
            // leaves about one note's glow at any speed, and a run of short
            // notes does not come back later as a wall. A key that was
            // glowing already keeps at least the glow it had.
            voice.let_go = true;
            voice.from = voice.env;
            voice.from_bloom = voice.bloom * voice.bloom * (3.0f - 2.0f * voice.bloom);
            const float earned = std::sqrt(kTouch * kTouch + (1.0f - kTouch * kTouch) * voice.bloom);
            voice.earn = kit::max(earned, voice.carry);
            voice.promise *= voice.earn;
          }
          voice.bloom += bloom_step;
          if (voice.bloom >= 1.0f) {
            voice.env = voice.earn;
            voice.stage = voice.held ? kHoldStage : kFadeStage;
          } else {
            const float risen = voice.bloom * voice.bloom * (3.0f - 2.0f * voice.bloom);
            voice.env = voice.from + (voice.earn - voice.from) * (risen - voice.from_bloom) /
                                         kit::max(1.0f - voice.from_bloom, 1.0e-6f);
          }
          break;
        }
        case kHoldStage:
          if (!voice.held) voice.stage = kFadeStage;
          break;
        case kFadeStage:
          voice.env *= fade_turn_;
          if (voice.env < kFloor) {
            voice.env = 0.0f;
            voice.stage = kDoneStage;
          }
          break;
        default:
          break;
      }
      // The same key has been struck again: this glow makes way as the new
      // one blooms, and this strike rings out fast.
      float making_way = 1.0f, damper = 1.0f;
      if (voice.yielding) {
        voice.yield = kit::min(voice.yield + bloom_step, 1.0f);
        making_way = handover(voice.yield);
        damper = yield_turn_;
        if (voice.yield >= 1.0f) {
          voice.env = 0.0f;
          voice.stage = kDoneStage;
        }
      }
      voice.rise += (1.0f - voice.rise) * voice.rise_rate;
      if (voice.rise > 1.0f - kFloor) voice.rise = 1.0f;  // arrived, and the last strike's residue is gone

      // Evolve: each partial's weight moves by its own slow sine, between
      // kEvolveDepth under and over, and the moved ones are brought back to
      // the power they had together. The played note's own partial is not
      // one of them: the colour moves, the pitch stays where it is.
      float moved[kPartials];
      float power = 0.0f, share = 0.0f;
      for (int k = 0; k < voice.count; ++k) {
        turn(&voice.wander_re[k], &voice.wander_im[k], voice.wander_turn_re[k], voice.wander_turn_im[k]);
        voice.toned[k] += (voice.toned_to[k] - voice.toned[k]) * glide;
        if (k == voice.played) continue;
        moved[k] = voice.toned[k] * (1.0f + depth * voice.wander_im[k]);
        power += moved[k] * moved[k];
        share += voice.toned[k] * voice.toned[k];
      }
      const float even = power > 0.0f ? std::sqrt(share / power) : 1.0f;
      for (int k = 0; k < voice.count; ++k) moved[k] = k == voice.played ? voice.toned[k] : moved[k] * even;
      const float glow_level = glow * voice.env * making_way * voice.amp * voice.trim * voice.steal;
      const float strike_level = strike * voice.rise * voice.amp * voice.steal;
      const float residue_level = strike * (1.0f - voice.rise) * voice.steal;

      bool ringing = false;
      float loud = 0.0f;
      float lent[kLines][kPartials] = {};  // the halo a lower partial puts on this one
      for (int line = 0; line < kLines; ++line) voice.above_to[line] = 0.0f;
      for (int k = 0; k < voice.count; ++k) {
        voice.ring[k] *= voice.ring_turn[k] * damper;
        if (voice.ring[k] < kFloor) {
          voice.ring[k] = 0.0f;
        } else {
          ringing = true;
        }
        turn(&voice.beat_re[k], &voice.beat_im[k], voice.beat_turn_re[k], voice.beat_turn_im[k]);
        const float c = voice.beat_re[k], s = voice.beat_im[k];
        const float ring = strike_level * voice.strike[k] * voice.ring[k];
        const float struck_sin = ring * voice.aim_sin[k] + residue_level * voice.residue_sin[k];
        const float struck_cos = ring * voice.aim_cos[k] + residue_level * voice.residue_cos[k];
        const float held = glow_level * moved[k];
        const bool leans_left = voice.side[k] > 0.0f;
        const float strike_left = 1.0f + strike_lean * voice.side[k], strike_right = 1.0f - strike_lean * voice.side[k];
        voice.to[kSinLeft][k] = struck_sin * strike_left + held * c * (leans_left ? sum_near_ : sum_far_);
        voice.to[kSinRight][k] = struck_sin * strike_right + held * c * (leans_left ? sum_far_ : sum_near_);
        voice.to[kCosLeft][k] = struck_cos * strike_left + held * s * (leans_left ? dif_near_ : dif_far_);
        voice.to[kCosRight][k] = struck_cos * strike_right + held * s * (leans_left ? dif_far_ : dif_near_);
        for (int line = 0; line < kLines; ++line) voice.to[line][k] += lent[line][k];
        if (k < kHaloPartials) {
          // The octave of each half, sin(2p ± (2b + 1/8 turn)): turned on
          // an eighth so that this pair, too, starts a quarter turn apart
          // and closing, and a still halo is as loud as a beating one is on
          // average.
          const float above = halo * held * kit::kSqrtHalf;
          const float c2 = c * c - s * s, s2 = 2.0f * c * s;
          const float sine = above * (c2 - s2) * (near_half_ + far_half_);
          const float cosine = above * (s2 + c2) * (near_half_ - far_half_);
          const int onto = voice.onto[k];
          if (onto >= 0) {
            // On the partial an octave up, a quarter turn from that
            // partial's own glow, so the two add in power and never cancel.
            const float to_left = (k & 1) ? halo_far_ : halo_near_;
            const float to_right = (k & 1) ? halo_near_ : halo_far_;
            lent[kCosLeft][onto] = sine * to_left;
            lent[kCosRight][onto] = sine * to_right;
            lent[kSinLeft][onto] = -cosine * to_left;
            lent[kSinRight][onto] = -cosine * to_right;
          } else if (k == voice.made) {
            const float to_left = (k & 1) ? halo_far_ : halo_near_;
            const float to_right = (k & 1) ? halo_near_ : halo_far_;
            voice.above_to[kSinLeft] = sine * to_left;
            voice.above_to[kSinRight] = sine * to_right;
            voice.above_to[kCosLeft] = cosine * to_left;
            voice.above_to[kCosRight] = cosine * to_right;
          }
        }
        bool audible = false;
        for (int line = 0; line < kLines; ++line) {
          voice.step[line][k] = (voice.to[line][k] - voice.now[line][k]) * (1.0f / kChunk);
          if (voice.now[line][k] != 0.0f || voice.to[line][k] != 0.0f) audible = true;
        }
        voice.audible[k] = audible;
        loud += struck_sin * struck_sin + struck_cos * struck_cos + held * held;
        // The turning number is kept at length 1 here, once a tick.
        const float trim = 1.5f - 0.5f * (voice.re[k] * voice.re[k] + voice.im[k] * voice.im[k]);
        voice.re[k] *= trim;
        voice.im[k] *= trim;
      }
      voice.above_lit = false;
      for (int line = 0; line < kLines; ++line) {
        voice.above_step[line] = (voice.above_to[line] - voice.above_now[line]) * (1.0f / kChunk);
        if (voice.above_now[line] != 0.0f || voice.above_to[line] != 0.0f) voice.above_lit = true;
      }
      if (voice.above_lit) voice.audible[voice.made] = true;
      voice.ringing = ringing;
      loud = std::sqrt(loud);
      // A note that has not arrived yet counts as what it will be, or the
      // next note of the chord takes its voice.
      voice.loud = (voice.pending || voice.stage == kBloomStage) ? kit::max(loud, voice.promise) : loud;
    }
  }

  // One voice for n samples (at most a tick): turn every partial and draw
  // its lines. Partials go two at a time: each is a chain of its own from one
  // sample to the next, and two chains side by side cost little more than one.
  void render(Voice& voice, int n, float* left, float* right) {
    // The partial that makes its own octave goes first, with the first other
    // one that sounds.
    int waiting = -1;
    const bool above = voice.made >= 0 && voice.audible[voice.made] && voice.above_lit;
    if (above) waiting = voice.made;
    for (int k = 0; k < voice.count; ++k) {
      if (!voice.audible[k] || (above && k == voice.made)) continue;
      if (waiting < 0) {
        waiting = k;
      } else if (waiting == voice.made && above) {
        draw<true, true>(voice, waiting, k, n, left, right);
        waiting = -1;
      } else {
        draw<false, true>(voice, waiting, k, n, left, right);
        waiting = -1;
      }
    }
    if (waiting < 0) return;
    if (waiting == voice.made && above) {
      draw<true, false>(voice, waiting, waiting, n, left, right);
    } else {
      draw<false, false>(voice, waiting, waiting, n, left, right);
    }
  }

  // Partial a, with partial b beside it when Two, and with a's octave from
  // the double-angle formulas of its turning number when Above.
  template <bool Above, bool Two>
  static void draw(Voice& voice, int a, int b, int n, float* left, float* right) {
    const float a_turn_re = voice.turn_re[a], a_turn_im = voice.turn_im[a];
    const float b_turn_re = voice.turn_re[b], b_turn_im = voice.turn_im[b];
    float a_re = voice.re[a], a_im = voice.im[a], b_re = voice.re[b], b_im = voice.im[b];
    float a_line[kLines], b_line[kLines], a_step[kLines], b_step[kLines], up[kLines], up_step[kLines];
    for (int line = 0; line < kLines; ++line) {
      a_line[line] = voice.now[line][a];
      a_step[line] = voice.step[line][a];
      b_line[line] = voice.now[line][b];
      b_step[line] = voice.step[line][b];
      up[line] = voice.above_now[line];
      up_step[line] = voice.above_step[line];
    }
    for (int i = 0; i < n; ++i) {
      const float a_turned = a_turn_re * a_re - a_turn_im * a_im;
      a_im = a_turn_re * a_im + a_turn_im * a_re;
      a_re = a_turned;
      float to_left = a_im * a_line[kSinLeft] + a_re * a_line[kCosLeft];
      float to_right = a_im * a_line[kSinRight] + a_re * a_line[kCosRight];
      for (int line = 0; line < kLines; ++line) a_line[line] += a_step[line];
      if (Two) {
        const float b_turned = b_turn_re * b_re - b_turn_im * b_im;
        b_im = b_turn_re * b_im + b_turn_im * b_re;
        b_re = b_turned;
        to_left += b_im * b_line[kSinLeft] + b_re * b_line[kCosLeft];
        to_right += b_im * b_line[kSinRight] + b_re * b_line[kCosRight];
        for (int line = 0; line < kLines; ++line) b_line[line] += b_step[line];
      }
      if (Above) {
        const float sine = 2.0f * a_re * a_im, cosine = a_re * a_re - a_im * a_im;
        to_left += sine * up[kSinLeft] + cosine * up[kCosLeft];
        to_right += sine * up[kSinRight] + cosine * up[kCosRight];
        for (int line = 0; line < kLines; ++line) up[line] += up_step[line];
      }
      left[i] += to_left;
      right[i] += to_right;
    }
    voice.re[a] = a_re;
    voice.im[a] = a_im;
    for (int line = 0; line < kLines; ++line) voice.now[line][a] = a_line[line];
    if (Two) {
      voice.re[b] = b_re;
      voice.im[b] = b_im;
      for (int line = 0; line < kLines; ++line) voice.now[line][b] = b_line[line];
    }
    if (Above) {
      for (int line = 0; line < kLines; ++line) voice.above_now[line] = up[line];
    }
  }

  void apply(int id) {
    using namespace afterglow;
    const float value = param(id);
    switch (id) {
      case kStrike:
        strike_.set(value * value, primed());
        break;
      case kGlow:
        glow_.set(value * value, primed());
        break;
      case kHalo:
        halo_.set(value, primed());
        break;
      case kTone:
        tone_.set(value, primed());
        break;
      case kEvolve:
        evolve_.set(value, primed());
        break;
      case kWidth:
        width_.set(value, primed());
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      case kDecay:
        ++decay_serial_;
        break;
      case kDrift:
        ++drift_serial_;
        share_.set(kFarShare * value, primed());
        break;
      default:
        break;  // source: the next note; bloom and fade: read every tick
    }
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::Smoother strike_, glow_, halo_, tone_, evolve_, width_, share_;  // on the control tick
  kit::Smoother volume_;                                        // per sample
  kit::IdleGate idle_;
  kit::Rng start_;
  bool flip_ = false;
  uint32_t order_ = 0;
  uint32_t decay_serial_ = 1, drift_serial_ = 1;
  int chunk_left_ = 0;
  float tick_seconds_ = 0.0f;
  float near_half_ = 1.0f, far_half_ = 0.0f, share_seen_ = -1.0f;
  float sum_near_ = 1.0f, dif_near_ = 0.0f, sum_far_ = 1.0f, dif_far_ = 0.0f;
  float halo_near_ = 1.0f, halo_far_ = 1.0f;
  float fade_turn_ = 0.0f, fade_seen_ = -1.0f;
  float yield_turn_ = 1.0f;
  float shade_rate_ = 1.0f;
  float width_seen_ = -1.0f;
};

}  // namespace livemix
