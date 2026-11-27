#pragma once

// Ringing Order: inside each key up to eight overtones take turns like the
// ringers of a tower.
//
//   tower clock ─► row ─► method: who rings when ─► blow ─► ringer (4 partials)
//        │                (Rounds, Hunt, Treble,             gesture · muffle
//        └ Tower: how the  Dodge, Contrary, Long)            place in the room
//          keys share it
//   covering tone (4 partials) ────────────────────────────► sum ─► volume ─► clip
//
// - The clock counts rows, with the gap after each. Each key reads the same clock from a place of its own (Tower), so nothing
//   drifts apart that was together. At each new row a key writes the list of
//   its blows (build_row): a time, a ringer, a weight and a place.
// - A ringer is four phasors turned a little every sample. What a blow does is
//   move their amplitudes, worked out on a control clock (a millisecond) and drawn
//   as straight lines between its ticks: a raised cosine to the blow's level,
//   a hold for the blown voices, then a fall, quick at first and slow after. A ringer rung
//   again while it sounds goes from where it is to where the blow sends it, so
//   a full row fuses and never piles up or clicks.
// - In a blown voice the upper partials come in later than the lower. Breath
//   is the same phasor with its amplitude drawn from slow noise, which makes
//   a band of air around the tone and not a noise beside it.
// - A ringer whose pitch or voice has changed since it last rang (Series,
//   Voice, a new chord under Chord tones) is stopped with the hand for 12 ms
//   and then rung at the new one.
// - Crossing: a blow looks for ringers of other keys near it (a semitone
//   to a fifth, by the knob) that still sound, and those step back.
// - Tilt, Body, Covering tone and Place act on what sounds, the rest on the
//   next blow.
//
// Asleep when every key has gone. Output does not depend on the block size:
// control runs on a clock that starts again, with every knob in its place,
// when a key finds nothing sounding.

#include <initializer_list>

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class RingingOrder : public kit::DeviceBase<ringing_order::kNumParams> {
 public:
  static constexpr int kMaxVoices = 12;
  static constexpr int kRingerCount = 8;
  static constexpr int kPartials = 8;                   // of a ringer: two groups of four
  static constexpr int kGroups = 2 * kRingerCount + 1;  // the last is the covering tone
  static constexpr int kMaxBlows = 16;
  enum Method : int { kRounds, kHunt, kTreble, kDodge, kContrary, kLong, kNumMethods };
  enum Kind : int { kBell, kReed, kGlass, kPluck, kBreath, kHum, kNumKinds };
  enum Series : int { kLow, kOdd, kFifths, kHigh, kChord, kNumSeries };
  enum Tower : int { kTogether, kCanon, kOpposed, kInTurn, kNumTowers };

  void init(float sample_rate) {
    using namespace ringing_order;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    chunk_ = kit::clamp_int(static_cast<int>(sr / 1000.0f + 0.5f), 8, kMaxChunk);
    tick_ = static_cast<float>(chunk_) / sr;
    for (Voice& voice : voices_) voice = Voice();
    noise_scale_ = std::sqrt(sr * (1.0f / 48000.0f));
    const float tick_rate = 1.0f / tick_;
    for (kit::Smoother* knob : {&body_, &tilt_, &cover_, &place_, &crossing_, &beat_}) knob->set_time(0.03f, tick_rate);
    live_coeff_ = 1.0f - std::exp(-tick_ / 0.02f);
    duck_coeff_ = 1.0f - std::exp(-tick_ / 0.09f);
    front_coeff_ = 1.0f - std::exp(-tick_ / 0.25f);
    pan_coeff_ = 1.0f - std::exp(-tick_ / 0.06f);
    volume_.set_time(0.02f, sr);
    stamp_ = 0;
    restart();
    idle_.reset(sr, 0.1f);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) set_knobs(primed());
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, kMinHz, kMaxHz);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    if (gain <= 0.0f) {
      note_off(note_id);
      return;
    }
    if (count_sounding() == 0) restart();

    // A key of this pitch that the id has, or one of this pitch that is let
    // go, is rung again. Any other key the id held is let go.
    Voice* same = nullptr;
    for (Voice& voice : voices_) {
      if (!voice.sounding || voice.pending) continue;
      if (voice.hz == frequency && (voice.id == note_id || !voice.held)) {
        if (!same || voice.held || (!same->held && voice.stamp > same->stamp)) same = &voice;
      }
    }
    for (Voice& voice : voices_) {
      if (!voice.sounding || &voice == same) continue;
      if (voice.pending ? voice.pending_id == note_id && voice.pending_held : voice.id == note_id && voice.held) {
        (voice.pending ? voice.pending_held : voice.held) = false;
      }
    }
    if (same) {
      same->id = note_id;
      same->held = true;
      same->stamp = ++stamp_;
      same->strength = gain;
      same->level = strength_level(gain);
      same->tuned = 0;  // the touch opens its sound as well
      enter(*same);
      return;
    }
    Voice& voice = voices_[pick()];
    voice.stamp = ++stamp_;
    if (voice.sounding) {
      voice.pending = true;
      voice.pending_held = true;
      voice.pending_id = note_id;
      voice.pending_hz = frequency;
      voice.pending_gain = gain;
    } else {
      start(voice, note_id, frequency, gain, true);
    }
  }

  void note_off(int note_id) {
    for (Voice& voice : voices_) {
      if (!voice.sounding) continue;
      if (voice.pending) {
        if (voice.pending_id == note_id) voice.pending_held = false;
      } else if (voice.id == note_id) {
        voice.held = false;
      }
    }
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(count_sounding() > 0)) {
      silence_output(frames);
      return;
    }
    clear_input(frames);
    int done = 0;
    while (done < frames) {
      if (chunk_left_ == 0) {
        control();
        chunk_left_ = chunk_;
      }
      const int n = kit::clamp_int(frames - done, 1, chunk_left_);
      Four left[kMaxChunk], right[kMaxChunk];
      for (int i = 0; i < n; ++i) left[i] = right[i] = Four{0.0f, 0.0f, 0.0f, 0.0f};
      for (Voice& voice : voices_) {
        if (voice.sounding) render_voice(voice, n, left, right);
      }
      for (int i = 0; i < n; ++i) {
        const float volume = volume_.next();
        out_left_[done + i] = kit::soft_clip(sum(left[i]) * volume);
        out_right_[done + i] = kit::soft_clip(sum(right[i]) * volume);
      }
      chunk_left_ -= n;
      done += n;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  typedef float Four __attribute__((vector_size(16)));
  static constexpr int kMaxChunk = 192;
  static constexpr int kLanes = 4;
  static constexpr float kMinHz = 20.0f;
  static constexpr float kMaxHz = 8000.0f;
  static constexpr float kSixtyDb = 6.907755279f;
  static constexpr float kEdgeHz = 8500.0f;  // a partial fades out between these, at every sample rate
  static constexpr float kTopHz = 14000.0f;
  static constexpr float kTopRinger = 4800.0f;  // where the highest ringers fold down an octave
  static constexpr float kLevel = 0.34f;       // a full blow of a lone ringer
  static constexpr float kCoverLevel = 0.17f;
  static constexpr float kNoiseLevel = 6.0f;
  static constexpr float kBack = 0.22f;        // how loud a key is while it is not its turn
  static constexpr float kFade = -0.5f;       // of a ringer's height over its key: high ones are shorter
  static constexpr float kLongest = 14.0f;     // rows, at all of Overlap
  static constexpr float kStealSeconds = 0.004f;
  static constexpr float kDampSeconds = 0.012f;
  static constexpr float kSilence = 1.0e-6f;
  static constexpr float kNear = 1.0595f;      // ringers within a semitone are one place; Crossing widens it to a fifth

  // `ratio` and `level` of a ringer's partials over its own pitch, `keep` how
  // long each rings as a share of the first, the rest its gesture.
  struct KindTable {
    float ratio[kPartials], level[kPartials], keep[kPartials];
    float cover[kLanes];  // the covering tone in this voice: harmonics 1 to 4
    float gain;
    float length;        // of Overlap's length
    float hold;          // share of the length it is held level
    float attack;        // times Attack
    float attack_least;  // seconds
    float bloom;         // how much later the upper partials come
    float air;           // how much of it is noise
    float cut;           // Hz: a mouth or a tube that closes the top
    float tick;          // level of its touch
    float tick_seconds, tick_rise;
    float tick_ratio;    // of the ringer's pitch
    float vibrato, vibrato_hz;  // cents
    float lean;                 // dB an octave over Tilt
    float hiss;                 // the air or the rub that goes on while it sounds
    float spread;               // of Place
    float grip;                 // how far Bite and Attack reach into its upper partials
  };
  static const KindTable& kind_table(int kind) {
    static const KindTable kTables[kNumKinds] = {
        // Bell
        {{1.0f, 2.0f, 2.51f, 3.01f, 4.17f, 5.43f, 6.8f, 8.21f},
         {1.0f, 0.5f, 0.2f, 0.42f, 0.36f, 0.36f, 0.32f, 0.28f},
         {1.0f, 0.7f, 0.45f, 0.5f, 0.3f, 0.2f, 0.14f, 0.1f},
         {1.0f, 0.34f, 0.12f, 0.06f},
         1.0f, 1.0f, 0.0f, 1.0f, 0.003f, 0.0f, 0.0f, 13000.0f, 0.5f, 0.03f, 0.0f, 2.8f, 0.0f, 5.0f, 0.0f, 0.0f, 1.0f, 1.0f},
        // Reed
        {{1.0f, 2.0f, 3.0f, 4.0f, 5.0f, 6.0f, 7.0f, 9.0f},
         {0.5f, 0.16f, 0.6f, 0.16f, 0.5f, 0.2f, 0.4f, 0.3f},
         {1.0f, 0.9f, 0.8f, 0.8f, 0.7f, 0.7f, 0.6f, 0.6f},
         {0.7f, 0.08f, 0.5f, 0.06f},
         1.2f, 0.5f, 0.9f, 5.0f, 0.01f, 0.9f, 0.03f, 750.0f, 0.2f, 0.1f, 0.015f, 3.0f, 4.0f, 5.1f, 0.0f, 0.0015f, 0.6f, 0.4f},
        // Glass: rubbed, an octave above, every partial a close pair
        {{1.998f, 2.002f, 4.63f, 4.64f, 8.48f, 8.52f, 13.2f, 18.7f},
         {0.62f, 0.5f, 0.07f, 0.06f, 0.03f, 0.02f, 0.01f, 0.01f},
         {1.0f, 1.0f, 0.7f, 0.7f, 0.5f, 0.5f, 0.4f, 0.3f},
         {1.0f, 0.03f, 0.02f, 0.0f},
         0.9f, 0.9f, 0.3f, 4.5f, 0.02f, 0.3f, 0.0f, 15000.0f, 0.35f, 0.16f, 0.03f, 6.0f, 0.0f, 5.0f, -3.0f, 0.004f, 1.0f, 0.5f},
        // Plucked
        {{1.0f, 2.0f, 3.0f, 4.0f, 5.0f, 6.0f, 7.0f, 8.0f},
         {0.9f, 0.75f, 0.6f, 0.42f, 0.36f, 0.3f, 0.22f, 0.2f},
         {1.0f, 0.5f, 0.33f, 0.25f, 0.2f, 0.16f, 0.13f, 0.11f},
         {0.32f, 0.16f, 0.04f, 0.03f},
         1.0f, 0.45f, 0.0f, 0.3f, 0.002f, 0.0f, 0.0f, 3800.0f, 1.0f, 0.025f, 0.0f, 3.5f, 0.0f, 5.0f, -2.5f, 0.0f, 0.9f, 1.0f},
        // Breath: bands of air, the upper ones spread like a mouth's
        {{1.0f, 1.5f, 2.0f, 3.0f, 4.3f, 5.9f, 7.6f, 10.0f},
         {0.5f, 0.35f, 0.5f, 0.55f, 0.55f, 0.5f, 0.45f, 0.4f},
         {1.0f, 0.8f, 0.8f, 0.8f, 0.7f, 0.7f, 0.7f, 0.7f},
         {0.3f, 0.1f, 0.05f, 0.05f},
         0.8f, 0.5f, 0.35f, 3.0f, 0.02f, 0.5f, 0.9f, 6000.0f, 0.5f, 0.35f, 0.05f, 2.2f, 0.0f, 5.0f, 0.6f, 0.012f, 1.0f, 0.5f},
        // Hum: a closed mouth, an octave below
        {{0.5f, 1.0f, 1.5f, 2.0f, 2.5f, 3.0f, 3.5f, 4.0f},
         {0.75f, 1.0f, 0.4f, 0.45f, 0.2f, 0.24f, 0.12f, 0.14f},
         {1.0f, 1.0f, 0.8f, 0.8f, 0.7f, 0.7f, 0.6f, 0.6f},
         {1.0f, 0.12f, 0.02f, 0.0f},
         1.05f, 0.6f, 0.5f, 4.0f, 0.03f, 1.0f, 0.06f, 620.0f, 0.22f, 0.25f, 0.06f, 1.0f, 7.0f, 4.6f, 0.0f, 0.004f, 0.6f, 0.6f},
    };
    return kTables[kit::clamp_int(kind, 0, kNumKinds - 1)];
  }

  static float series_ratio(int series, int ringer) {
    static const float kRatios[kNumSeries][kRingerCount] = {
        {1.0f, 2.0f, 3.0f, 4.0f, 5.0f, 6.0f, 8.0f, 12.0f},
        {3.0f, 5.0f, 7.0f, 9.0f, 11.0f, 13.0f, 15.0f, 17.0f},
        {0.5f, 1.5f, 4.5f, 6.0f, 9.0f, 12.0f, 18.0f, 27.0f},
        {12.0f, 15.0f, 16.0f, 18.0f, 20.0f, 24.0f, 30.0f, 32.0f},
        {1.0f, 1.5f, 2.0f, 3.0f, 4.0f, 5.0f, 6.0f, 8.0f},
    };
    return kRatios[kit::clamp_int(series, 0, kNumSeries - 1)][kit::clamp_int(ringer, 0, kRingerCount - 1)];
  }

  // What a series adds to Tilt, dB an octave: stacked fifths stand open.
  float series_lean() const { return choice(ringing_order::kSeries, kNumSeries) == kFifths ? 3.0f : 0.0f; }

  // Four partials turning together: the phasors, their turn a sample, and
  // their gains to either side with the steps that draw them over a tick.
  struct Group {
    alignas(16) float re[kLanes] = {}, im[kLanes] = {}, turn_re[kLanes] = {}, turn_im[kLanes] = {};
    alignas(16) float left[kLanes] = {}, right[kLanes] = {}, left_step[kLanes] = {}, right_step[kLanes] = {};
    bool on = false;
  };

  struct Ringer {
    float hz = 0.0f, over = 1.0f;  // its pitch, and that over the key's
    int kind = 0;
    float amp[kPartials] = {}, from[kPartials] = {}, to[kPartials] = {};
    float fall[kPartials] = {}, knee[kPartials] = {}, late[kPartials] = {};  // quick first, then slowly
    float edge[kPartials] = {};                     // 0 where a partial is out of reach
    float turn[kPartials] = {};                     // radians a sample
    float base_re[kPartials] = {}, base_im[kPartials] = {};
    float live[kPartials] = {}, live_to[kPartials] = {};
    int rise = 0, rise_length = 1, hold = 0;
    bool rising = false;
    bool upper = true;                           // its second four are in reach
    float duck = 1.0f;
    bool behind = false;                         // another key has its place
    float pan = 0.0f, pan_to = 0.0f;
    float noise_a[kPartials] = {}, noise_b[kPartials] = {};
    float air_pole = 0.0f, air_drive = 0.0f, air_gain = 0.0f;
    float waver[kLanes] = {}, waver_rate[kLanes] = {};  // partials p and p + 4 share one
    float vibrato = 0.0f, vibrato_rate = 1.0f;
    int damp = 0;                                // ticks left of a hand on it
    float next_gain = 0.0f, next_pan = 0.0f;     // the blow that waits for it
    bool next_back = false, next_entry = false;
    float loudest() const {
      float most = 0.0f;
      for (float a : amp) most = kit::max(most, a);
      return most;
    }
    bool sounds() const { return rising || damp > 0 || loudest() > 0.0f; }
  };

  struct Blow {
    float at = 0.0f;
    int ringer = 0;
    float gain = 1.0f, pan = 0.0f;
  };

  struct Voice {
    Group groups[kGroups];
    Ringer ringers[kRingerCount];
    Blow blows[kMaxBlows];
    int blow_count = 0, next_blow = 0;
    long row = -1;       // the row that is going on, -1 before the first
    long count = 0;      // and where its own clock is
    double at = 0.0;
    float pace = 1.0f;
    int tower = -1;
    float hz = 220.0f;
    int id = -1;
    bool sounding = false, held = false;
    bool pending = false, pending_held = false;
    int pending_id = -1;
    float pending_hz = 220.0f, pending_gain = 0.0f;
    float strength = 0.0f, level = 0.0f, level_now = 0.0f;
    float front = 1.0f, front_to = 1.0f;  // how far forward its ringers stand, by whose turn it is
    float env = 1.0f, trim = 1.0f, norm = 1.0f;
    float cover_env = 0.0f, accent = 0.0f, accent_now = 0.0f;
    float cover_live[kLanes] = {}, cover_edge[kLanes] = {};
    float drift = 0.0f, drift_rate = 0.1f;
    int slot = 0;
    float side = 1.0f;
    uint32_t stamp = 0;
    uint32_t tuned = 0;  // the live gains' serial this voice has
    kit::Rng rng;
    kit::Svf tick_band;
    kit::OnePole tick_top;  // keeps the skirt of the band from growing with the sample rate
    float burst = 0.0f, burst_fall = 0.9f, burst_rise = 1.0f, burst_now = 0.0f;
    float tick_hz = 800.0f, tick_hz_now = 800.0f;
    float tick_left = 0.0f, tick_right = 0.0f, tick_left_step = 0.0f, tick_right_step = 0.0f;
    float tick_pan = 0.0f;
    bool ticking = false;
  };

  // --- knobs -----------------------------------------------------------------

  int choice(int id, int count) const { return kit::clamp_int(static_cast<int>(param(id) + 0.5f), 0, count - 1); }
  int ringer_count() const {
    return kit::clamp_int(static_cast<int>(param(ringing_order::kRingers) + 0.5f), 3, kRingerCount);
  }
  static float strength_level(float gain) { return std::pow(gain, 1.15f); }

  void set_knobs(bool glide) {
    using namespace ringing_order;
    body_.set(param(kBody), glide);
    tilt_.set(param(kTilt), glide);
    const float cover = param(kCover);
    cover_.set(cover * (0.35f + 0.65f * cover) * 1.25f, glide);
    place_.set(param(kPlace), glide);
    crossing_.set(param(kCrossing), glide);
    beat_.set(param(kBeat), glide);
    volume_.set(kit::db_to_gain(param(kVolume)), glide);
    ++serial_;
  }

  // A key that finds nothing sounding: the clock starts with it, and every
  // knob is where it points.
  void restart() {
    set_knobs(false);
    chunk_left_ = 0;
    clock_row_ = 1680;
    clock_rows_ = 0.0;
    count_ = 0;
  }

  int count_sounding() const {
    int count = 0;
    for (const Voice& voice : voices_) count += voice.sounding ? 1 : 0;
    return count;
  }

  float voice_level(const Voice& voice) const {
    if (voice.pending) return 1.0e3f + strength_level(voice.pending_gain);
    return (voice.held ? kit::max(voice.env, 0.5f) : voice.env) * voice.level;
  }

  // The voice a new key takes: an idle one, else the quietest let go, else
  // the quietest held, the oldest on a tie. One a key already waits in last.
  int pick() const {
    int choice = -1;
    for (int pass = 0; pass < 3 && choice < 0; ++pass) {
      float lowest = 1.0e9f;
      for (int v = 0; v < kMaxVoices; ++v) {
        const Voice& voice = voices_[v];
        if (pass == 0) {
          if (!voice.sounding && (choice < 0 || voice.stamp < voices_[choice].stamp)) choice = v;
          continue;
        }
        if (pass == 1 && (voice.held || voice.pending)) continue;
        const float level = voice_level(voice);
        if (choice < 0 || level < lowest || (level == lowest && voice.stamp < voices_[choice].stamp)) {
          choice = v;
          lowest = level;
        }
      }
    }
    return choice;
  }

  // --- a key -----------------------------------------------------------------

  static uint32_t seed_for(uint32_t stream) {
    uint32_t x = (stream + 1u) * 0x9E3779B9u;
    x ^= x >> 16;
    x *= 0x85EBCA6Bu;
    x ^= x >> 13;
    x *= 0xC2B2AE35u;
    x ^= x >> 16;
    return x;
  }

  void start(Voice& voice, int id, float hz, float gain, bool held) {
    const uint32_t stamp = voice.stamp;
    voice = Voice();
    voice.stamp = stamp;
    voice.sounding = true;
    voice.held = held;
    voice.id = id;
    voice.hz = hz;
    voice.strength = gain;
    voice.level = voice.level_now = strength_level(gain);
    voice.slot = free_slot(voice);
    voice.side = (voice.slot & 1) ? -1.0f : 1.0f;
    voice.rng.seed(seed_for(count_++));
    // Low keys carry more partials in reach, high ones fewer and the ear is
    // keener there: level by register, even from C2 to C6.
    voice.trim = kit::clamp(std::pow(hz * (1.0f / 220.0f), -0.10f), 0.6f, 1.35f);
    voice.drift = voice.rng.uniform();
    voice.drift_rate = (0.07f + 0.06f * voice.rng.uniform()) * tick_;
    for (Group& group : voice.groups) {
      for (int p = 0; p < kLanes; ++p) {
        const float phase = voice.rng.uniform();
        group.re[p] = kit::SineTable::cos_lookup(phase);
        group.im[p] = kit::SineTable::lookup(phase);
      }
    }
    Group& cover = voice.groups[kGroups - 1];
    for (int p = 0; p < kLanes; ++p) {
      const float f = hz * static_cast<float>(p + 1);
      set_turn(f, &cover.turn_re[p], &cover.turn_im[p]);
      voice.cover_edge[p] = reach(f);
      voice.cover_live[p] = cover_partial(p);
    }
    for (Ringer& ringer : voice.ringers) {
      ringer.vibrato = voice.rng.uniform();
      ringer.vibrato_rate = (0.9f + 0.2f * voice.rng.uniform()) * tick_;
      for (int p = 0; p < kLanes; ++p) {
        ringer.waver[p] = voice.rng.uniform();
        ringer.waver_rate[p] = 0.75f + 0.5f * voice.rng.uniform();
      }
    }
    voice.tick_band.set(800.0f, 0.9f, sample_rate());
    find_norm(voice);
    enter(voice);
  }

  // The lowest place of the tower no other sounding key stands in.
  int free_slot(const Voice& mine) const {
    for (int slot = 0; slot < kMaxVoices; ++slot) {
      bool taken = false;
      for (const Voice& voice : voices_) taken |= &voice != &mine && voice.sounding && voice.slot == slot;
      if (!taken) return slot;
    }
    return 0;
  }

  // As a key goes down all its ringers are touched, so that it speaks at once
  // and whole; then it takes its place in the row that is going on.
  void enter(Voice& voice) {
    const int n = ringer_count();
    voice.row = -1;
    voice.accent = 1.0f;
    voice.front_to = 1.0f;
    static const float lowest[kNumMethods] = {0.5f, 0.7f, 0.3f, 0.45f, 0.4f, 0.3f};  // it carries the pitch
    static const float entries[kNumMethods] = {0.1f, 0.28f, 0.06f, 0.08f, 0.1f, 0.15f};
    const int method = choice(ringing_order::kMethod, kNumMethods);
    // Where the keys do not ring together, the later ones come in under the first.
    static const float later[kNumTowers] = {1.0f, 0.5f, 0.7f, 0.55f};
    int before = 0;
    held_keys(voice, &before);
    const float one = before > 0 ? later[choice(ringing_order::kTower, kNumTowers)] : 1.0f;
    // A row that fuses is whole from the start: nothing builds up for a minute.
    const float full = smooth(kit::clamp((param(ringing_order::kOverlap) - 0.75f) * 4.0f, 0.0f, 1.0f));
    for (int i = 0; i < n; ++i) {
      const float pan = n > 1 ? 2.0f * static_cast<float>(i) / static_cast<float>(n - 1) - 1.0f : 0.0f;
      const float entry = one * (i == 0 ? lowest[method] : entries[method]);
      ring(voice, i, entry + full * ((i == 0 ? 0.9f : 0.65f) - entry), -pan, false, true);
    }
  }

  static float reach(float hz) { return kit::clamp((kTopHz - hz) / (kTopHz - kEdgeHz), 0.0f, 1.0f); }

  void set_turn(float hz, float* re, float* im) const {
    const double w = 6.283185307179586 * kit::min(hz, sample_rate() * 0.45f) / sample_rate();
    *re = static_cast<float>(std::cos(w));
    *im = static_cast<float>(std::sin(w));
  }

  // --- a ringer --------------------------------------------------------------

  // The pitch ringer i stands on, over the key's own.
  float pitch_over(const Voice& voice, int i, int n) const {
    const int series = choice(ringing_order::kSeries, kNumSeries);
    if (series != kChord) {
      float over = series_ratio(series, i);
      const float first = kit::max(1.0f, kind_table(choice(ringing_order::kVoice, kNumKinds)).ratio[0]);
      while (over > 1.5f && over * voice.hz * first > kTopRinger) over *= 0.5f;  // high keys fold their top down
      return over;
    }
    // Every held key's tone in each octave from the one below this key to one above.
    float tones[kMaxVoices * 5];
    int count = 0;
    int keys = 0;
    for (const Voice& other : voices_) {
      if (!other.sounding || !other.held || other.pending) continue;
      ++keys;
      add_tones(tones, &count, other.hz / voice.hz);
    }
    if (keys == 0) add_tones(tones, &count, 1.0f);
    if (count <= 3) add_tones(tones, &count, 1.5f);  // a lone key rings its fifths too
    for (int a = 1; a < count; ++a) {
      for (int b = a; b > 0 && tones[b] < tones[b - 1]; --b) {
        const float t = tones[b];
        tones[b] = tones[b - 1];
        tones[b - 1] = t;
      }
    }
    const int at = static_cast<int>(static_cast<float>(i) * static_cast<float>(count - 1) / static_cast<float>(n - 1) + 0.5f);
    return tones[kit::clamp_int(at, 0, count - 1)];
  }

  static void add_tones(float* tones, int* count, float ratio) {
    while (ratio >= 0.995f) ratio *= 0.5f;
    while (ratio < 0.497f) ratio *= 2.0f;
    for (; ratio < 2.05f && *count < kMaxVoices * 5; ratio *= 2.0f) {
      bool there = false;
      for (int i = 0; i < *count; ++i) there |= std::fabs(tones[i] / ratio - 1.0f) < 0.006f;
      if (!there) tones[(*count)++] = ratio;
    }
  }

  void tune(Voice& voice, int i, float over, int kind) {
    Ringer& ringer = voice.ringers[i];
    const KindTable& table = kind_table(kind);
    ringer.over = over;
    ringer.hz = voice.hz * over;
    ringer.kind = kind;
    for (int p = 0; p < kPartials; ++p) {
      Group& group = voice.groups[2 * i + p / kLanes];
      const float f = ringer.hz * table.ratio[p];
      set_turn(f, &ringer.base_re[p], &ringer.base_im[p]);
      group.turn_re[p % kLanes] = ringer.base_re[p];
      group.turn_im[p % kLanes] = ringer.base_im[p];
      ringer.turn[p] = kit::kTwoPi * f / sample_rate();
      ringer.edge[p] = reach(f);
      ringer.amp[p] = 0.0f;
    }
    ringer.upper = ringer.edge[4] + ringer.edge[5] + ringer.edge[6] + ringer.edge[7] > 0.0f;
    // A band of air as wide as a share of the tone, from noise through two poles.
    const float width = kit::clamp(ringer.hz * 0.08f, 16.0f, 200.0f);
    const float c = std::exp(-kit::kTwoPi * width * tick_);
    ringer.air_pole = c;
    ringer.air_drive = std::sqrt(1.0f - c * c);
    ringer.air_gain = (1.0f - c * c) / std::sqrt(1.0f + c * c);
    find_live(voice, i);
    for (int p = 0; p < kPartials; ++p) ringer.live[p] = ringer.live_to[p];
  }

  // Part of what Tilt and the number of ringers change in a key's level.
  void find_norm(Voice& voice) const {
    float power = 0.0f;
    const int n = ringer_count();
    const KindTable& table = kind_table(choice(ringing_order::kVoice, kNumKinds));
    for (int i = 0; i < n; ++i) {
      const float over = voice.ringers[i].hz > 0.0f ? voice.ringers[i].over : pitch_over(voice, i, n);
      const float through = mouth(table, voice.hz * over, 0, voice.strength);
      power += through * through * kit::db_to_gain(2.0f * (tilt_.value + table.lean + series_lean()) * std::log2(kit::max(over, 0.5f) * 0.4f));
    }
    // A full body is brighter and not louder.
    float plain = 0.0f, bodied = 0.0f;
    for (int p = 0; p < kPartials; ++p) {
      plain += table.level[p];
      bodied += table.level[p] * body_gain(p, 0.65f);
    }
    voice.norm = std::pow(kit::max(power, 1.0e-4f), -0.45f) * kit::min(1.25f, std::pow(bodied / (0.85f * plain), -0.45f));
  }

  // What Tilt, Body and the mouth of the voice leave of each partial.
  void find_live(Voice& voice, int i) const {
    Ringer& ringer = voice.ringers[i];
    const KindTable& table = kind_table(ringer.kind);
    const float tilt = kit::db_to_gain((tilt_.value + table.lean + series_lean() + 3.0f * (voice.strength - 0.65f)) * std::log2(kit::max(ringer.over, 0.5f) * 0.4f));
    for (int p = 0; p < kPartials; ++p) {
      ringer.live_to[p] = voice.norm * tilt * mouth(table, ringer.hz, p, voice.strength) * body_gain(p, voice.strength) * ringer.edge[p];
    }
  }

  float open_body(float strength) const { return kit::clamp(body_.value * (0.3f + 1.05f * strength), 0.0f, 1.2f); }

  // What closes the top: a mouth or a tube, never under the ringer's own
  // pitch, and opened by Body.
  float mouth(const KindTable& table, float hz, int p, float strength) const {
    const float f = hz * table.ratio[p] / (kit::max(table.cut, 0.55f * hz) * (0.55f + open_body(strength)));
    return 1.0f / std::sqrt(1.0f + f * f * (1.0f + f * f));
  }

  float body_gain(int p, float strength) const {
    const float body = open_body(strength);
    if (p == 0) return 1.0f - 0.45f * kit::max(0.0f, body - 0.5f);
    const float open = body < 0.5f ? 2.0f * body : 1.0f + 2.2f * (body - 0.5f);
    return std::pow(open, 0.8f + 0.2f * static_cast<float>(p));
  }

  float cover_partial(int p) const {
    const KindTable& table = kind_table(choice(ringing_order::kVoice, kNumKinds));
    return table.cover[p] * (p == 0 ? 1.0f : 0.4f + 1.2f * body_.value);
  }

  // A blow for ringer i. One that still sounds at another pitch or in another
  // voice is stopped first.
  void ring(Voice& voice, int i, float gain, float pan, bool back, bool entry) {
    Ringer& ringer = voice.ringers[i];
    const int kind = choice(ringing_order::kVoice, kNumKinds);
    const float over = pitch_over(voice, i, ringer_count());
    const bool moved = ringer.hz <= 0.0f || kind != ringer.kind || std::fabs(over / ringer.over - 1.0f) > 1.0e-4f;
    if (moved && ringer.hz > 0.0f && ringer.sounds()) {
      if (ringer.damp == 0) {
        ringer.damp = kit::clamp_int(static_cast<int>(kDampSeconds / tick_ + 0.5f), 2, 1000);
        ringer.rising = false;
      }
      ringer.next_gain = gain;
      ringer.next_pan = pan;
      ringer.next_back = back;
      ringer.next_entry = entry;
      return;
    }
    if (moved) tune(voice, i, over, kind);
    blow(voice, i, gain, pan, back, entry);
  }

  void blow(Voice& voice, int i, float gain, float pan, bool back, bool entry) {
    using namespace ringing_order;
    Ringer& ringer = voice.ringers[i];
    const KindTable& table = kind_table(ringer.kind);
    const float row = param(kRow) / voice.pace;
    const float overlap = param(kOverlap);
    const int n = ringer_count();
    // Leather: the first half of Muffle on the back strokes, the second on
    // both. The lowest ringer wears least of it.
    const float knob = param(kMuffle);
    const float worn = back ? kit::min(1.0f, 2.0f * knob) : kit::max(0.0f, 2.0f * knob - 1.0f);
    const float high = n > 1 ? static_cast<float>(i) / static_cast<float>(n - 1) : 0.0f;
    const float leather = worn * (0.75f + 0.25f * high);
    // How long it sounds: from a seventh of a row to all of several.
    const float fused = smooth(kit::clamp((overlap - 0.8f) * 5.0f, 0.0f, 1.0f));
    float whole = row * table.length * (1.0f - 0.75f * leather) * std::pow(kit::max(ringer.over, 0.5f), kFade);
    static const float lengths[kNumMethods] = {0.45f, 1.0f, 0.5f, 0.6f, 0.4f, 2.2f};
    const int method = choice(kMethod, kNumMethods);
    whole *= lengths[method];
    const float lasting = method == kHunt || method == kLong ? 1.5f : 0.2f;  // where every ringer sings on
    const float shortest = kit::max(0.07f, 0.16f * whole);
    const float longest = kit::clamp(kLongest * whole, 6.0f * shortest, 40.0f);
    const float length = shortest * std::pow(longest / shortest, overlap);
    const float gesture = table.attack_least + param(kAttack) * table.attack;
    float attack = gesture + fused * 0.22f * row + 0.02f * leather;
    attack = kit::min(attack, 0.8f * row);
    if (entry) attack = kit::min(attack, gesture);
    ringer.rise_length = kit::clamp_int(static_cast<int>(attack / tick_ + 0.5f), 1, 100000);
    // As a key goes down its ringers come in as a quick roll from the lowest.
    ringer.rise = entry ? -static_cast<int>(0.005f * static_cast<float>(i) / tick_) : 0;
    ringer.rising = true;
    ringer.hold = static_cast<int>(kit::min(length * table.hold, 0.8f * row) / tick_);
    // A quick attack wakes more of the top.
    const float edge = std::pow(0.03f / kit::max(attack, 0.002f), 0.15f);
    const float keen = 0.5f + 1.2f * param(kBite) * (0.4f + 0.6f * voice.strength);
    const float lift = 1.0f + 0.6f * (1.0f - overlap) * (1.0f - overlap);  // short strikes are small
    float plain = 0.0f, woken = 0.0f;
    for (int p = 0; p < kPartials; ++p) {
      const float up = static_cast<float>(p);
      ringer.from[p] = ringer.amp[p];
      ringer.to[p] = table.level[p];
      plain += ringer.to[p];
      if (p > 0) ringer.to[p] *= std::pow(1.0f - 0.9f * leather, 0.6f * up) * std::pow(edge * keen, std::sqrt(up) * table.grip);
      woken += ringer.to[p];
    }
    // What the touch adds at the top it takes from the whole.
    const float level = gain * lift * table.gain * (1.0f - 0.8f * leather * (0.25f + 0.75f * high)) *
                        (woken > plain ? std::pow(plain / woken, 0.7f) : 1.0f);
    for (int p = 0; p < kPartials; ++p) {
      ringer.to[p] *= level;
      ringer.fall[p] = std::exp(-kSixtyDb * tick_ / (length * table.keep[p]));
      ringer.knee[p] = 0.5f * ringer.to[p];
      ringer.late[p] = std::exp(-kSixtyDb * tick_ / (length * table.keep[p] * (1.0f + lasting * overlap)));
    }
    ringer.pan_to = pan * voice.side;
    if (ringer.loudest() < 1.0e-4f) ringer.pan = ringer.pan_to;
    take_place(voice, ringer);
    // Its touch. A leather clapper thuds, a hard hand bites.
    const float bite = param(kBite) * (0.35f + 0.65f * voice.strength);
    const float burst = std::pow(bite, 1.5f) * table.tick * gain * (entry ? 0.5f : 1.0f);
    if (burst > 1.0e-4f && !(entry && i != 0)) {
      voice.burst = kit::max(voice.burst, burst);
      voice.burst_fall = std::exp(-kSixtyDb * tick_ / (table.tick_seconds * kit::clamp(440.0f / ringer.hz, 0.5f, 2.0f)));
      voice.burst_rise = table.tick_rise > 0.0f ? 1.0f - std::exp(-tick_ / table.tick_rise) : 1.0f;
      voice.tick_hz = kit::clamp(ringer.hz * table.tick_ratio * (1.0f - 0.65f * worn), 160.0f, 4500.0f);
      voice.tick_pan = ringer.pan_to;
    }
  }

  // Crossing: the one rung last has the place. Ringers of other keys near it
  // step behind, and come forward again when they are rung.
  void take_place(Voice& voice, Ringer& ringer) {
    ringer.behind = false;
    const float near_by = kNear * std::exp2(0.5f * param(ringing_order::kCrossing));
    for (Voice& other : voices_) {
      if (&other == &voice || !other.sounding) continue;
      for (Ringer& near : other.ringers) {
        if (near.hz <= 0.0f || !near.sounds()) continue;
        if (near.hz < ringer.hz * near_by && ringer.hz < near.hz * near_by) near.behind = true;
      }
    }
  }

  // A step towards `to` that lands: what only closes in on a value ends in
  // numbers too small to work with.
  static float near_to(float from, float to, float share) {
    const float gap = to - from;
    return gap < 1.0e-7f && gap > -1.0e-7f ? to : from + gap * share;
  }

  // Draws a lane's gains to where they go by the next tick.
  static void draw(Group& group, int lane, float left, float right, float step) {
    if (left == 0.0f && std::fabs(group.left[lane]) < 1.0e-8f) group.left[lane] = 0.0f;
    if (right == 0.0f && std::fabs(group.right[lane]) < 1.0e-8f) group.right[lane] = 0.0f;
    group.left_step[lane] = (left - group.left[lane]) * step;
    group.right_step[lane] = (right - group.right[lane]) * step;
  }

  static float smooth(float t) { return t * t * (3.0f - 2.0f * t); }

  // One ringer over one tick: its amplitudes, its place and its waver, as
  // gains for the group to reach by the next tick.
  void step_ringer(Voice& voice, int i, float env) {
    Ringer& ringer = voice.ringers[i];
    Group* groups = &voice.groups[2 * i];
    if (!ringer.sounds()) {
      if (groups[0].on) settle(groups[0]);
      if (groups[1].on) settle(groups[1]);
      return;
    }
    const KindTable& table = kind_table(ringer.kind);
    if (ringer.damp > 0) {
      const float keep = static_cast<float>(ringer.damp - 1) / static_cast<float>(ringer.damp);
      for (float& amp : ringer.amp) amp *= keep;
      if (--ringer.damp == 0) {
        const int kind = choice(ringing_order::kVoice, kNumKinds);
        tune(voice, i, pitch_over(voice, i, ringer_count()), kind);
        // The phasors turn at the new pitch from the next tick, with nothing to hear yet.
        blow(voice, i, ringer.next_gain, ringer.next_pan, ringer.next_back, ringer.next_entry);
      }
    } else if (ringer.rising) {
      ++ringer.rise;
      const float t = kit::max(0.0f, static_cast<float>(ringer.rise) / static_cast<float>(ringer.rise_length));
      const float w = t * t * (3.0f - 2.0f * t);
      const float late = 1.0f + table.bloom * (w - 1.0f);  // upper partials follow w·late, w·late², …
      float weight = w;
      for (int p = 0; p < kPartials; ++p) {
        ringer.amp[p] = ringer.from[p] + (ringer.to[p] - ringer.from[p]) * kit::max(weight, 0.0f);
        weight *= kit::max(late, 0.0f);
      }
      if (ringer.rise >= ringer.rise_length) ringer.rising = false;
    } else if (ringer.hold > 0) {
      --ringer.hold;
    } else {
      for (int p = 0; p < kPartials; ++p) {
        ringer.amp[p] *= ringer.amp[p] > ringer.knee[p] ? ringer.fall[p] : ringer.late[p];
        if (ringer.amp[p] < kSilence) ringer.amp[p] = 0.0f;
      }
    }
    ringer.pan = near_to(ringer.pan, ringer.pan_to, pan_coeff_);
    ringer.duck += ((ringer.behind ? 1.0f - 0.9f * crossing_.value : 1.0f + 0.3f * crossing_.value) - ringer.duck) * duck_coeff_;
    // Low ringers stand nearer the middle.
    const float wide = place_.value * table.spread * kit::clamp((ringer.hz - 60.0f) * (1.0f / 180.0f), 0.15f, 1.0f);
    const float angle = (1.0f + kit::clamp(ringer.pan * wide, -1.0f, 1.0f)) * 0.125f;
    const float gain = env * voice.level_now * voice.front * voice.trim * kLevel * ringer.duck * beat_gain_;
    const float left = gain * kit::SineTable::cos_lookup(angle);
    const float right = gain * kit::SineTable::lookup(angle);
    const float beat = beat_.value;
    const float depth = beat_depth_;
    if (table.vibrato > 0.0f) {
      ringer.vibrato += ringer.vibrato_rate * table.vibrato_hz;
      ringer.vibrato -= std::floor(ringer.vibrato);
      const float bend = kit::SineTable::lookup(ringer.vibrato) * table.vibrato * 5.7762e-4f;
      for (int p = 0; p < kPartials; ++p) {
        const float d = bend * ringer.turn[p];
        Group& group = groups[p / kLanes];
        group.turn_re[p % kLanes] = ringer.base_re[p] - ringer.base_im[p] * d;
        group.turn_im[p % kLanes] = ringer.base_im[p] + ringer.base_re[p] * d;
      }
    }
    const float step = 1.0f / static_cast<float>(chunk_);
    // The waver stands a quarter turn apart on the two sides, so it turns in the room.
    float wave_left[kLanes], wave_right[kLanes];
    for (int p = 0; p < kLanes; ++p) {
      ringer.waver[p] += beat * ringer.waver_rate[p] * tick_;
      if (ringer.waver[p] >= 1.0f) ringer.waver[p] -= 1.0f;
      wave_left[p] = left * (1.0f - depth * (0.5f + 0.5f * kit::SineTable::lookup(ringer.waver[p])));
      wave_right[p] = right * (1.0f - depth * (0.5f + 0.5f * kit::SineTable::cos_lookup(ringer.waver[p])));
    }
    // The upper four die first; under -88 dB they are left out.
    bool upper = ringer.upper && ringer.rising;
    for (int p = kLanes; p < kPartials && ringer.upper && !upper; ++p) upper = ringer.amp[p] * ringer.live[p] > 4.0e-5f;
    const int partials = upper ? kPartials : kLanes;
    if (!upper) {
      for (int p = kLanes; p < kPartials; ++p) ringer.live[p] = ringer.live_to[p];
    }
    for (int p = 0; p < partials; ++p) {
      ringer.live[p] = near_to(ringer.live[p], ringer.live_to[p], live_coeff_);
      float a = ringer.amp[p] * ringer.live[p];
      if (table.air > 0.0f) {
        ringer.noise_a[p] = ringer.noise_a[p] * ringer.air_pole + ringer.air_drive * 1.7320508f * voice.rng.bipolar();
        ringer.noise_b[p] = ringer.noise_b[p] * ringer.air_pole + ringer.air_gain * ringer.noise_a[p];
        a *= 1.0f - table.air + table.air * 1.2f * ringer.noise_b[p];
      }
      const int lane = p & 3;
      draw(groups[p >> 2], lane, a * wave_left[lane], a * wave_right[lane], step);
    }
    groups[0].on = true;
    renew(groups[0]);
    if (upper) {
      groups[1].on = true;
      renew(groups[1]);
    } else if (groups[1].on) {
      settle(groups[1]);
    }
  }

  // Brings a phasor back to length one; what a tick rounds away is far under that.
  static void renew(Group& group) {
    for (int p = 0; p < kLanes; ++p) {
      const float gain = 1.5f - 0.5f * (group.re[p] * group.re[p] + group.im[p] * group.im[p]);
      group.re[p] *= gain;
      group.im[p] *= gain;
    }
  }

  // A group whose ringer has gone: one tick down to nothing, then off.
  void settle(Group& group) const {
    const float step = 1.0f / static_cast<float>(chunk_);
    bool any = false;
    for (int p = 0; p < kLanes; ++p) {
      any |= group.left[p] != 0.0f || group.right[p] != 0.0f;
      group.left_step[p] = -group.left[p] * step;
      group.right_step[p] = -group.right[p] * step;
      if (std::fabs(group.left[p]) < 1.0e-9f) group.left[p] = group.left_step[p] = 0.0f;
      if (std::fabs(group.right[p]) < 1.0e-9f) group.right[p] = group.right_step[p] = 0.0f;
    }
    if (!any) group.on = false;
  }

  // --- the tower -------------------------------------------------------------

  // The order after `changes` changes from lowest first: neighbours
  // swap in pairs, from the front and from one place behind it in turn, so
  // that every ringer walks from the front to the back and home.
  static void hunt(int* order, int n, long changes) {
    for (int p = 0; p < n; ++p) order[p] = p;
    const int steps = static_cast<int>(((changes % (2 * n)) + 2 * n) % (2 * n));
    for (int c = 0; c < steps; ++c) {
      for (int p = c & 1; p + 1 < n; p += 2) {
        const int t = order[p];
        order[p] = order[p + 1];
        order[p + 1] = t;
      }
    }
  }

  void add_blow(Voice& voice, float at, int ringer, float gain, float pan) const {
    if (voice.blow_count >= kMaxBlows) return;
    Blow& blow = voice.blows[voice.blow_count++];
    blow.at = kit::clamp(at, 0.0f, 0.9999f);
    blow.ringer = ringer;
    blow.gain = gain;
    blow.pan = pan;
  }

  // The keys that are held, this one with them, and where it stands among them.
  int held_keys(const Voice& voice, int* rank) const {
    int keys = 0;
    for (const Voice& other : voices_) {
      if (!other.sounding || !(other.held || &other == &voice)) continue;
      ++keys;
      if (other.slot < voice.slot) ++*rank;
    }
    return keys;
  }

  // Who rings in this row of this key, when, how heavily and from where.
  void build_row(Voice& voice, long row) {
    using namespace ringing_order;
    voice.blow_count = voice.next_blow = 0;
    voice.front_to = 1.0f;
    const int n = ringer_count();
    const int method = choice(kMethod, kNumMethods);
    const int tower = choice(kTower, kNumTowers);
    long turn = row;
    float side = 1.0f, part = 1.0f;
    if (tower == kOpposed) {
      int rank = 0;
      if (held_keys(voice, &rank) > 1) {
        if (((row + voice.slot) & 1) != 0) {
          voice.front_to = kBack;
          return;
        }
        turn = row >> 1;
        part = 1.3f;  // half the rows, each the fuller
      } else {  // a lone key answers itself from the other side
        side = (row & 1) != 0 ? -1.0f : 1.0f;
      }
    } else if (tower == kInTurn) {
      int rank = 0;
      const int keys = held_keys(voice, &rank);
      if (row % keys != rank) {
        voice.front_to = kBack;
        return;
      }
      turn = row / keys;
      part = keys > 1 ? 1.4f : 1.0f;
    } else if (tower == kCanon && (row & 1) != 0) {
      voice.front_to = kBack;  // one row in front, one under the others
    }
    const float swing = 0.9f * param(kSwing);
    int order[kRingerCount];
    const float last = static_cast<float>(n - 1);
    // The treble stands out of the others whatever Tilt leaves of it.
    const float lead = kit::clamp(kit::db_to_gain(-1.0f * tilt_.value), 1.0f, 2.4f);
    switch (method) {
      case kRounds:  // a roll from the top that is over in a third of the row, then left to ring
        for (int p = 0; p < n; ++p) {
          add_blow(voice, 0.3f * spaced(p, n, swing), n - 1 - p, 0.14f + 1.2f * at_place(p, last), across(p, last));
        }
        break;
      case kHunt:
        hunt(order, n, turn);
        for (int p = 0; p < n; ++p) add_blow(voice, spaced(p, n, swing), order[p], 1.0f, across(p, last));
        break;
      case kTreble: {  // the highest leads alone; the lowest answer it together in the second half
        const int low = kit::clamp_int(n / 2, 2, n - 1);
        hunt(order, low, turn);
        add_blow(voice, 0.0f, n - 1, lead, -1.0f);
        for (int p = 0; p < low; ++p) {
          add_blow(voice, 0.5f + 0.12f * spaced(p, low, swing), order[p], 0.6f, 0.4f + 0.6f * across(p, static_cast<float>(low - 1)));
        }
        break;
      }
      case kDodge: {  // two neighbours change places all through the row, the next pair in the next
        const int low = n - 2 - static_cast<int>(((turn * 2 + 1) % (n - 1) + (n - 1)) % (n - 1));
        for (int p = 0; p < kMaxBlows; ++p) {
          add_blow(voice, spaced(p, kMaxBlows, swing), low + ((p + 1) & 1), p == 0 ? 1.4f : 1.1f, (p & 1) ? 0.8f : -0.8f);
        }
        break;
      }
      case kContrary:  // one line climbs as the other falls, and they cross in the middle
        for (int p = 0; p < n; ++p) {
          const float at = spaced(p, n, swing);
          const float middle = 1.0f - std::fabs(across(p, last));
          const float gain = 0.1f + 2.0f * middle * middle;
          add_blow(voice, at, p, gain, across(p, last));
          if (n - 1 - p != p) add_blow(voice, at, n - 1 - p, gain, -across(p, last));
        }
        break;
      case kLong:
      default: {  // one to half a row, and far apart: a cycle of many rows
        const int stride = n == 3 || n == 6 ? (n == 3 ? 2 : 5) : 3;
        for (int h = 0; h < 2; ++h) {
          const int i = static_cast<int>((((2 * turn + h) * stride + n - 1) % n + n) % n);
          add_blow(voice, 0.5f * static_cast<float>(h), i, i == 0 ? 1.1f : 1.6f, across(i, last));
        }
        break;
      }
    }
    // Weight: up to 22 dB from the heavy end to the light one, the row's power kept.
    const float weight = param(kWeight);
    float power = 0.0f;
    const int half = (voice.blow_count + 1) / 2;
    for (int b = 0; b < voice.blow_count; ++b) {
      Blow& blow = voice.blows[b];
      const float place = voice.blow_count > 1 ? static_cast<float>(b) / static_cast<float>(voice.blow_count - 1) : 0.0f;
      const float q = weight > 0.0f ? place : 1.0f - place;
      float gain = kit::db_to_gain(-22.0f * std::fabs(weight) * q);
      if (method != kLong) gain *= (b == 0 || b == half) ? 1.0f + 0.5f * swing : 1.0f - 0.5f * swing;
      blow.gain *= gain;
      power += gain * gain;
      if (tower == kOpposed) blow.pan = side * (0.6f + 0.4f * blow.pan);
      if (tower == kCanon) blow.pan = 0.2f * blow.pan + 0.8f * canon_side(voice.slot);
      if (tower == kCanon) blow.ringer = (blow.ringer + 2 * (voice.slot >> 1)) % n;
      // Two sides, and the voices of a canon, are each other's mirror.
      if ((tower == kOpposed || tower == kCanon) && (voice.slot & 1)) {
        blow.ringer = n - 1 - blow.ringer;
        if (method == kTreble && b == 0) blow.gain *= 1.2f / lead;  // a low leader needs no help
      }
    }
    // The orders differ in how many ringers sound at a time: one level over all of them.
    static const float even[kNumMethods] = {0.8f, 1.0f, 1.6f, 1.35f, 1.6f, 0.9f};
    if (voice.blow_count > 0) {
      const float make_up = kit::min(1.4f, std::pow(power / static_cast<float>(voice.blow_count), -0.4f));
      for (int b = 0; b < voice.blow_count; ++b) voice.blows[b].gain *= make_up * part * even[method];
    }
  }

  // The time of place p: even, or each half row drawn towards its first blow.
  static float spaced(int p, int n, float swing) {
    const int half = p * 2 < n ? 0 : (n + 1) / 2;
    return (static_cast<float>(half) + static_cast<float>(p - half) * (1.0f - swing)) / static_cast<float>(n);
  }
  static float at_place(int p, float last) { return static_cast<float>(p) / kit::max(last, 1.0f); }
  static float across(int p, float last) { return 2.0f * static_cast<float>(p) / kit::max(last, 1.0f) - 1.0f; }

  // Where a key of a canon stands, over its own side.
  static float canon_side(int slot) { return 1.0f - 0.25f * static_cast<float>((slot >> 1) & 3); }

  // In a canon the later keys ring the same rows in other times.
  static float canon_pace(int slot) {
    static const float kPaces[4] = {1.0f, 0.5f, 1.5f, 0.33333f};
    return kPaces[slot & 3];
  }

  double row_step() const { return static_cast<double>(tick_) / static_cast<double>(param(ringing_order::kRow)); }

  // Where this key is in the tower's time.
  void keep_time(Voice& voice) {
    const double whole = 1.0 + static_cast<double>(param(ringing_order::kGap));
    const int tower = choice(ringing_order::kTower, kNumTowers);
    if (tower != voice.tower) {  // came in, or the tower has changed: from the clock all keys share
      voice.tower = tower;
      voice.row = -1;
      voice.count = clock_row_;
      voice.at = clock_rows_;
      voice.pace = tower == kCanon ? canon_pace(voice.slot) : 1.0f;
      // A hand rolling over the keys; or each key a row and more behind the last,
      // every second one upside down.
      if (tower == kTogether) voice.at -= 0.06 * static_cast<double>(voice.slot);
      if (tower == kOpposed) voice.at -= 0.03 * static_cast<double>(voice.slot >> 1);
      if (tower == kCanon) voice.at -= 1.4 * static_cast<double>(voice.slot);
      while (voice.at < 0.0) {
        voice.at += whole;
        --voice.count;
      }
    } else {
      voice.at += row_step() * static_cast<double>(voice.pace);
      while (voice.at >= whole) {
        voice.at -= whole;
        ++voice.count;
      }
    }
    const long row = voice.count;
    const float into = static_cast<float>(voice.at);
    if (row != voice.row) {
      const bool next = voice.row >= 0 && row > voice.row;
      build_row(voice, row);
      if (!next) {  // came in, or was moved, in the middle of a row
        while (voice.next_blow < voice.blow_count && voice.blows[voice.next_blow].at + 1.0e-3f < into) ++voice.next_blow;
      } else {
        voice.accent = 1.0f;
      }
      voice.row = row;
    }
    const bool every_row = tower == kTogether || tower == kCanon;
    const bool back = ((every_row ? row : row >> 1) & 1) != 0;
    while (voice.next_blow < voice.blow_count && voice.blows[voice.next_blow].at <= into) {
      const Blow blow = voice.blows[voice.next_blow++];
      if (blow.ringer < ringer_count()) ring(voice, blow.ringer, blow.gain, blow.pan, back, false);
    }
  }

  // --- the control clock -----------------------------------------------------

  void control() {
    const bool turning = !body_.settled() || !tilt_.settled();
    body_.next();
    tilt_.next();
    cover_.next();
    place_.next();
    crossing_.next();
    beat_.next();
    if (turning) ++serial_;
    // The waver's depth, and what keeps a wavering sound as loud as a still one.
    beat_depth_ = 1.0f - std::exp(-0.9f * beat_.value);
    const float middle = 1.0f - 0.5f * beat_depth_;
    beat_gain_ = 1.0f / std::sqrt(middle * middle + 0.125f * beat_depth_ * beat_depth_);
    clock_rows_ += row_step();
    const double whole = 1.0 + static_cast<double>(param(ringing_order::kGap));
    while (clock_rows_ >= whole) {
      clock_rows_ -= whole;
      ++clock_row_;
    }
    for (Voice& voice : voices_) {
      if (voice.sounding) step_voice(voice);
    }
  }

  void step_voice(Voice& voice) {
    if (voice.pending) {
      // Down to nothing over a few ticks, the last of them drawn to zero, and
      // only then the new key.
      if (voice.env <= 0.0f) {
        start(voice, voice.pending_id, voice.pending_hz, voice.pending_gain, voice.pending_held);
      } else {
        voice.env = kit::max(0.0f, voice.env - tick_ / kStealSeconds);
      }
    } else if (voice.held) {
      voice.env += (1.0f - voice.env) * 0.06f;
    } else {
      voice.env *= std::exp(-kSixtyDb * tick_ / param(ringing_order::kRelease));
      if (voice.env < 1.0e-5f) {
        voice.env = 0.0f;
        stop(voice);
        return;
      }
    }
    if (voice.tuned != serial_) {
      voice.tuned = serial_;
      find_norm(voice);
      for (int i = 0; i < kRingerCount; ++i) {
        if (voice.ringers[i].hz > 0.0f) find_live(voice, i);
      }
    }
    voice.front = near_to(voice.front, voice.front_to, front_coeff_);
    voice.level_now = near_to(voice.level_now, voice.level, 0.15f);
    if (!voice.pending) keep_time(voice);
    const float env = kit::max(voice.env, 0.0f);
    for (int i = 0; i < kRingerCount; ++i) step_ringer(voice, i, env);
    step_cover(voice, env);
    step_touch(voice, env);
  }

  // The last of a key: its groups are under -100 dB and are put out at once.
  void stop(Voice& voice) {
    voice.sounding = false;
    for (Group& group : voice.groups) group.on = false;
    voice.ticking = false;
  }

  void step_cover(Voice& voice, float env) {
    Group& group = voice.groups[kGroups - 1];
    const float attack = kit::max(0.02f, param(ringing_order::kAttack) * 1.5f);
    voice.cover_env = near_to(voice.cover_env, 1.0f, 1.0f - std::exp(-2.2f * tick_ / attack));
    voice.accent *= std::exp(-tick_ / kit::clamp(0.45f * param(ringing_order::kRow), 0.05f, 4.0f));
    if (voice.accent < 1.0e-6f) voice.accent = 0.0f;
    voice.accent_now = near_to(voice.accent_now, voice.accent, 1.0f - std::exp(-tick_ / kit::max(0.05f, attack)));
    voice.drift += voice.drift_rate;
    if (voice.drift >= 1.0f) voice.drift -= 1.0f;
    const float step = 1.0f / static_cast<float>(chunk_);
    const float base = env * voice.cover_env * voice.level_now * voice.trim * kCoverLevel * cover_.value * 0.7071f *
                       (0.8f + 0.5f * voice.accent_now);
    for (int p = 0; p < kLanes; ++p) {
      voice.cover_live[p] = near_to(voice.cover_live[p], cover_partial(p), live_coeff_);
      const float sway = 1.0f + 0.22f * kit::SineTable::lookup(voice.drift * 1.0f + 0.27f * static_cast<float>(p));
      const float gain = base * voice.cover_live[p] * voice.cover_edge[p] * sway;
      draw(group, p, gain, gain, step);
    }
    group.on = true;
    renew(group);
  }

  void step_touch(Voice& voice, float env) {
    const KindTable& table = kind_table(voice.ringers[0].kind);
    float hiss = 0.0f;
    if (table.hiss > 0.0f) {
      for (const Ringer& ringer : voice.ringers) hiss = kit::max(hiss, ringer.amp[0]);
      hiss *= table.hiss * (0.4f + 2.4f * param(ringing_order::kBite));
    }
    voice.burst = kit::max(hiss, voice.burst * voice.burst_fall);
    if (voice.burst < 1.0e-6f) voice.burst = 0.0f;
    voice.burst_now += (voice.burst - voice.burst_now) * voice.burst_rise;
    if (voice.burst == 0.0f && voice.burst_now < 1.0e-6f) voice.burst_now = 0.0f;
    if (voice.burst_now == 0.0f && voice.tick_left == 0.0f && voice.tick_right == 0.0f) {
      voice.ticking = false;
      return;
    }
    const float was = voice.tick_hz_now;
    voice.tick_hz_now += (voice.tick_hz - voice.tick_hz_now) * (voice.ticking ? 0.3f : 1.0f);
    if (was != voice.tick_hz_now || !voice.ticking) {
      voice.tick_band.set(voice.tick_hz_now, 0.9f, sample_rate());
      voice.tick_top.set_cutoff(voice.tick_hz_now * 2.0f, sample_rate());
    }
    const float angle = (1.0f + 0.8f * place_.value * kit::clamp(voice.tick_pan, -1.0f, 1.0f)) * 0.125f;
    const float gain = env * voice.level_now * voice.burst_now * kNoiseLevel * noise_scale_;
    const float left = gain * kit::SineTable::cos_lookup(angle), right = gain * kit::SineTable::lookup(angle);
    const float step = 1.0f / static_cast<float>(chunk_);
    voice.tick_left_step = (left - voice.tick_left) * step;
    voice.tick_right_step = (right - voice.tick_right) * step;
    if (gain == 0.0f && std::fabs(voice.tick_left) < 1.0e-9f) voice.tick_left = voice.tick_left_step = 0.0f;
    if (gain == 0.0f && std::fabs(voice.tick_right) < 1.0e-9f) voice.tick_right = voice.tick_right_step = 0.0f;
    voice.ticking = true;
  }

  // --- sound -----------------------------------------------------------------

  static Four load(const float* from) { return Four{from[0], from[1], from[2], from[3]}; }
  static float sum(Four v) { return (v[0] + v[1]) + (v[2] + v[3]); }
  static void store(float* to, Four v) {
    for (int p = 0; p < kLanes; ++p) to[p] = v[p];
  }

  // Two groups side by side: a phasor waits on its own last sample, so one
  // alone leaves the machine idle. An odd one out goes with a silent spare.
  void render_voice(Voice& voice, int n, Four* left, Four* right) {
    Group* on[kGroups + 1];
    int count = 0;
    for (Group& group : voice.groups) {
      if (group.on) on[count++] = &group;
    }
    Group spare;
    if (count & 1) on[count] = &spare;
    for (int g = 0; g < count; g += 2) {
      Group& a = *on[g];
      Group& b = *on[g + 1];
      Four a_re = load(a.re), a_im = load(a.im), b_re = load(b.re), b_im = load(b.im);
      Four a_left = load(a.left), a_right = load(a.right), b_left = load(b.left), b_right = load(b.right);
      const Four a_cos = load(a.turn_re), a_sin = load(a.turn_im), b_cos = load(b.turn_re), b_sin = load(b.turn_im);
      const Four a_ls = load(a.left_step), a_rs = load(a.right_step);
      const Four b_ls = load(b.left_step), b_rs = load(b.right_step);
      for (int i = 0; i < n; ++i) {
        const Four a_next = a_re * a_cos - a_im * a_sin;
        const Four b_next = b_re * b_cos - b_im * b_sin;
        a_im = a_re * a_sin + a_im * a_cos;
        b_im = b_re * b_sin + b_im * b_cos;
        a_re = a_next;
        b_re = b_next;
        a_left += a_ls;
        a_right += a_rs;
        b_left += b_ls;
        b_right += b_rs;
        left[i] += a_re * a_left + b_re * b_left;
        right[i] += a_re * a_right + b_re * b_right;
      }
      store(a.re, a_re);
      store(a.im, a_im);
      store(a.left, a_left);
      store(a.right, a_right);
      store(b.re, b_re);
      store(b.im, b_im);
      store(b.left, b_left);
      store(b.right, b_right);
    }
    if (!voice.ticking) return;
    float l = voice.tick_left, r = voice.tick_right;
    for (int i = 0; i < n; ++i) {
      const float noise = voice.tick_top.lowpass(voice.tick_band.bandpass(voice.rng.bipolar()));
      l += voice.tick_left_step;
      r += voice.tick_right_step;
      left[i] += Four{noise * l, 0.0f, 0.0f, 0.0f};
      right[i] += Four{noise * r, 0.0f, 0.0f, 0.0f};
    }
    voice.tick_left = l;
    voice.tick_right = r;
  }

  Voice voices_[kMaxVoices];
  kit::Smoother body_, tilt_, cover_, place_, crossing_, beat_, volume_;
  kit::IdleGate idle_;
  double clock_rows_ = 0.0;
  long clock_row_ = 1680;
  int chunk_ = 48, chunk_left_ = 0;
  float tick_ = 1.0f / 1000.0f;
  float beat_depth_ = 0.0f, beat_gain_ = 1.0f;
  float live_coeff_ = 0.03f, duck_coeff_ = 0.01f, pan_coeff_ = 0.01f, front_coeff_ = 0.004f, noise_scale_ = 1.0f;
  uint32_t stamp_ = 0, count_ = 0, serial_ = 1;
};

}  // namespace livemix
