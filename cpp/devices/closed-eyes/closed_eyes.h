#pragma once

// Closed Eyes: a note tires as it is looked at, and when you look away its
// opposite appears.
//
//   per key (up to 16):
//
//     source ──► 32 partials ──► (1 - Depth x tired)² ─► lids ──┐
//       │              │                                        ├─► left
//       └► air         └─► tired, charge (per partial)          ├─► right
//                               │                               │
//                               └─► opposite: 16 partials, or ──┘
//                                   bands, or breath; seen only
//                                   as far as the note is not
//
//   all keys ─► volume ─► soft clip ─► out
//
// - Every partial of a note has two slow numbers. `tired` follows how strongly
//   the partial has been heard: it rises over Tire while the note sounds and
//   falls over Recover when it does not, and what it has reached is taken off
//   the partial (Depth). Strong partials reach more than faint ones, so a held
//   note does not only sink, it pales. `charge` rises the same way and is
//   spent over After Length, but only while the eyes are off the note.
// - The opposite is driven by the charge, and is seen as far as the note is
//   not there: after its key is let go, where a struck note has died away
//   under the finger, in every blink, and a little of it always (Seep). It is
//   never the note again: images.h puts each of the six in another register
//   or another family of sound.
// - How tired a pitch is belongs to the pitch. When its voice ends the state
//   is written down with the time, in samples counted since init, sleep and
//   all; a key that comes back takes up what Recover has left of it. Memory
//   says what shares a page: the key, the key in all octaves, or everything.
//   With the last two the keys that are held together also tire faster.
// - One pitch has one voice. Struck again, it takes the voice that sounds.
// - A stolen voice fades over 4 ms and the new note waits in it.
// - Safe moves an opposite that lingers: it fades, is made again on the
//   nearest tone that is held, and comes back. A change of Opposite does the
//   same, quickly.
//
// The control work runs every 32 samples; levels are straight lines between.
// The instrument sleeps when no key sounds.

#include "images.h"
#include "lanes.h"
#include "params.gen.h"

namespace livemix {

class ClosedEyes : public kit::DeviceBase<closed_eyes::kNumParams> {
 public:
  static constexpr int kMaxVoices = 16;

  void init(float sample_rate) {
    using namespace closed_eyes;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    tick_ = static_cast<float>(kChunk) / sr;
    for (int id = 0; id < kNumParams; ++id) knob_[id].set_time(kKnobSeconds, 1.0f / tick_);
    volume_.set_time(kSmoothingSeconds, sr);
    room_.snap(1.0f);
    room_fast_ = kit::time_to_coeff(0.008f, sr);
    room_slow_ = kit::time_to_coeff(0.4f, sr);
    guard_.snap(1.0f);
    guard_fast_ = kit::time_to_coeff(0.0008f, sr);
    guard_fall_ = std::exp(-tick_ / 0.6f);
    guard_top_ = chunk_top_ = 0.0f;
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) {
      pool_.voices[v] = Voice();
      pool_.voices[v].note.clear();
      pool_.voices[v].image.clear();
      pool_.voices[v].air.clear(1u);
      pool_.voices[v].breath.clear(2u);
    }
    for (Page& page : pages_) page = Page();
    clock_ = 0.0;
    order_ = 0;
    ticks_ = 0;
    chunk_left_ = 0;
    blink_phase_ = 0.0f;
    chord_serial_ = chord_seen_ = 0;
    chord_wait_ = 0.0f;
    fatigue_meter_ = image_meter_ = lids_ = 0.0f;
    idle_.reset(sr, 0.1f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, kMinHz, kit::min(kMaxHz, 0.4f * sample_rate()));
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    if (pool_.count_active() == 0) restart();
    ++chord_serial_;

    const int held = find_key(note_id);
    if (held >= 0) {
      Voice& again = pool_.voices[held];
      if (again.pending) {
        // Struck again before it could start: the waiting note is this one.
        again.pending_frequency = frequency;
        again.pending_gain = gain;
        again.promise = promise(gain);
        return;
      }
      again.held = false;
    }
    const int source = choice(closed_eyes::kSource, closed_eyes::kNumSources);
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& old = pool_.voices[v];
      if (!old.sounding || old.quit) continue;
      const float other = old.pending ? old.pending_frequency : old.frequency;
      if (other > frequency * kSamePitch || frequency > other * kSamePitch) continue;
      if (old.pending) {
        old.pending_gain = gain;
        old.promise = promise(gain);
        take(old, note_id);
        return;
      }
      if (old.source == source) {
        restrike(old, gain);
        take(old, note_id);
        return;
      }
      old.held = false;  // another source looks from this pitch now
      old.quit = true;
    }
    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    take(voice, note_id);
    if (stolen) {
      voice.pending = true;
      voice.pending_frequency = frequency;
      voice.pending_gain = gain;
      voice.promise = promise(gain);
    } else {
      start(voice, frequency, gain);
    }
  }

  void note_off(int note_id) {
    const int held = find_key(note_id);
    if (held < 0) return;
    pool_.voices[held].held = false;
    ++chord_serial_;
  }

  void process(int frames) {
    using closed_eyes::V4;
    frames = begin_block(frames);
    if (!idle_.wake(pool_.count_active() > 0)) {
      silence_output(frames);
      clock_ += static_cast<double>(frames);
      fatigue_meter_ = image_meter_ = lids_ = 0.0f;
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
      V4 left[kChunk], right[kChunk];
      for (int i = 0; i < n; ++i) left[i] = right[i] = closed_eyes::splat(0.0f);
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        if (!voice.sounding) continue;
        voice.note.render(n, left, right);
        voice.image.render(n, left, right);
        voice.air.render(n, left, right, blend_);
        voice.breath.render(n, left, right, blend_ + (1.0f - blend_) * voice.shape.centre);
      }
      for (int i = 0; i < n; ++i) {
        const float volume = volume_.next() * room_.next();
        const float l = closed_eyes::total(left[i]) * volume, r = closed_eyes::total(right[i]) * volume;
        const float top = kit::max(std::fabs(l), std::fabs(r));
        chunk_top_ = kit::max(chunk_top_, top);
        // The first tip of a swell that outruns the guard takes it down with it.
        if (guard_.next() * top > kCeiling) guard_.value = kCeiling / top;
        out_left_[done + i] = kit::soft_clip(l * guard_.value);
        out_right_[done + i] = kit::soft_clip(r * guard_.value);
      }
      chunk_left_ -= n;
      done += n;
      clock_ += static_cast<double>(n);
    }
    idle_.settle(output_peak(frames), frames);
  }

  // Readings for the display: how tired the tiredest key is, how much of an
  // opposite is in sight, how far the lids are closed.
  float meter(int index) const {
    if (index == 0) return fatigue_meter_;
    if (index == 1) return image_meter_;
    return index == 2 ? lids_ : 0.0f;
  }

 private:
  static constexpr int kChunk = closed_eyes::kChunk;
  static constexpr int kGroups = closed_eyes::kPartials / closed_eyes::kLanes;
  static constexpr int kImageGroups = closed_eyes::kImages / closed_eyes::kLanes;
  static constexpr int kKeys = 128, kClasses = 12, kPages = kKeys + kClasses + 1;
  static constexpr float kMinHz = 16.0f;
  static constexpr float kMaxHz = 10000.0f;
  static constexpr float kSixtyDb = 6.907755279f;
  static constexpr float kTopOfBand = 0.42f;
  static constexpr float kKnobSeconds = 0.02f;
  static constexpr float kStealSeconds = 0.004f;
  static constexpr float kQuitSeconds = 0.06f;
  static constexpr float kFloor = 1.0e-4f;
  static constexpr float kSamePitch = 1.003f;
  static constexpr float kVoiceGain = 0.18f;
  static constexpr float kRoom = 2.45f;       // this many hard keys need no room made
  static constexpr float kFaint = 0.16f;      // a partial this strong against the strongest tires half as far
  static constexpr float kEnsemble = 1.0f;    // each other key in the same memory tires a key this much faster
  static constexpr float kMostCents = 11.0f;   // Drift at 1
  static constexpr float kGuard = 0.37f;      // a sum over this is turned down, well before the clip
  static constexpr float kCeiling = 0.47f;    // and nothing gets past this
  static constexpr float kAirGain = 0.5f;
  static constexpr float kStruckSinks = 4.0f;  // a note that dies by itself has less time to tire
  static constexpr float kDissolve = 0.7f;     // how far Seep lets a tired note go
  static constexpr float kPaler = 0.5f;        // how much quieter a wholly tired key comes back
  static constexpr float kHaunt = 1.0f;        // how far a tired key brings its opposite back with it
  static constexpr float kAccentAttack = 0.3f;   // a note that blooms sooner than this speaks with an accent
  static constexpr float kAccentSeconds = 0.08f;

  typedef closed_eyes::V4 V4;
  static V4 splat(float x) { return closed_eyes::splat(x); }

  // How tired a pitch was when it was last heard.
  struct Page {
    float tired[closed_eyes::kPartials] = {};
    double when = 0.0;
    bool written = false;
  };

  struct Voice {
    closed_eyes::Bank<kGroups> note;
    closed_eyes::Bank<kImageGroups> image;
    closed_eyes::Noise air, breath;
    closed_eyes::Spectrum spectrum;
    closed_eyes::Air air_shape;
    float count_hz = 0.0f;
    V4 weight[kGroups], weight_to[kGroups];   // of the note's partials
    V4 reach[kGroups];                        // how tired each can get, 0 to 1
    V4 tired[kGroups], charge[kGroups];
    V4 ring[kGroups], ring_to[kGroups], ring_turn[kGroups];  // a struck note's own dying
    V4 pace[kGroups];                         // how soon each tires against the first
    V4 late[kGroups];                         // how much later each blooms
    V4 side[kGroups];
    V4 sway_re[kGroups], sway_im[kGroups], sway_turn_re[kGroups], sway_turn_im[kGroups];
    V4 image_weight[kImageGroups], image_to[kImageGroups], image_side[kImageGroups], image_cents[kImageGroups];
    V4 image_life[kImageGroups], image_charge[kImageGroups];
    V4 float_re[kImageGroups], float_im[kImageGroups], float_turn_re[kImageGroups], float_turn_im[kImageGroups];
    int from[closed_eyes::kImages] = {};
    closed_eyes::Image shape;
    int opponent = 0;
    float image_hz = 440.0f, image_hz_to = 440.0f;
    float swap = 1.0f;         // the opposite's own level through a remaking
    bool swapping = false, moving = false;
    kit::Rng rng;
    int source = 0, key = -1;
    uint32_t order = 0;
    float frequency = 440.0f, gain = 0.0f;
    float amp = 0.0f, amp_to = 0.0f;
    float phase = 0.0f;        // of the attack, 0 to 1
    float env = 0.0f;          // the note's envelope
    float burst = 0.0f;        // the onset's air
    float accent = 0.0f;       // a quick note's bright beginning
    float haunt = 0.0f;        // how tired the note came back: so much of its opposite comes with it
    float mean_tired = 0.0f;
    bool haunt_due = false;
    float vib_at = 0.0f, pulse_at = 0.0f, aside_at = 0.0f, throb_at = 0.0f;  // turns of what moves the whole note
    float age = 0.0f;          // seconds since it was struck
    float refresh = 0.0f;      // seconds of looking afresh left
    float shown_a = 0.0f, shown = 0.0f;  // how much of the opposite is in sight
    float strongest = 1.0f, brightness = 1.0f;
    float steal = 1.0f, quit_level = 1.0f;
    float loud = 0.0f, promise = 0.0f;
    float pending_frequency = 440.0f, pending_gain = 0.0f;
    float colour_seen = -1.0f, form_seen = -1.0f, edge_seen = -1.0f;
    bool sounding = false, held = false, pending = false, quit = false, fresh = false;

    bool active() const { return sounding; }
    bool releasing() const { return !held; }
    float level() const { return loud > promise ? loud : promise; }
  };

  static float smooth(float t) { return t * t * (3.0f - 2.0f * t); }
  // The other way: where on the curve a level is (four halvings of Newton's).
  static float unsmooth(float level) {
    float t = kit::clamp(level, 0.0f, 1.0f);
    for (int i = 0; i < 5; ++i) {
      const float slope = kit::max(6.0f * t * (1.0f - t), 0.15f);
      t = kit::clamp(t - (smooth(t) - level) / slope, 0.0f, 1.0f);
    }
    return t;
  }

  int choice(int id, int count) const {
    return kit::clamp_int(static_cast<int>(param(id) + 0.5f), 0, count - 1);
  }
  float top_hz() const { return kTopOfBand * sample_rate(); }
  static float touch(float gain) { return 0.28f + 0.72f * gain; }
  static float promise(float gain) { return kVoiceGain * touch(gain); }

  void apply(int id) {
    if (id == closed_eyes::kVolume) {
      volume_.set(kit::db_to_gain(param(id)), primed());
    } else {
      knob_[id].set(param(id), primed());
    }
  }

  // Nothing is sounding: knobs land where they point, the tick and the lids
  // start with the note.
  void restart() {
    for (kit::Smoother& knob : knob_) knob.snap(knob.target);
    volume_.snap(volume_.target);
    chunk_left_ = 0;
    blink_phase_ = 0.0f;
    chord_wait_ = 0.0f;
    ticks_ = 0;
    guard_.snap(1.0f);
    guard_top_ = chunk_top_ = 0.0f;
  }

  void take(Voice& voice, int note_id) {
    voice.key = note_id;
    voice.order = ++order_;
    voice.held = true;
  }

  int find_key(int note_id) const {
    int found = -1;
    for (int v = 0; v < kMaxVoices; ++v) {
      const Voice& voice = pool_.voices[v];
      if (voice.key != note_id || !voice.sounding || !voice.held) continue;
      if (found < 0 || voice.order > pool_.voices[found].order) found = v;
    }
    return found;
  }

  // --- how tired a pitch is -------------------------------------------------

  static int key_of(float hz) {
    return kit::clamp_int(static_cast<int>(std::floor(kit::hz_to_midi(hz) + 0.5f)), 0, kKeys - 1);
  }
  // Which page a pitch is written on under a memory, 0 note, 1 octave, 2 all.
  static int page_of(float hz, int memory) {
    const int key = key_of(hz);
    if (memory == 0) return key;
    return memory == 1 ? kKeys + key % 12 : kKeys + kClasses;
  }
  float since(const Page& page) const {
    const double seconds = (clock_ - page.when) / static_cast<double>(sample_rate());
    return std::exp(-static_cast<float>(seconds) / param(closed_eyes::kRecover));
  }
  void remember(float hz, float* tired) const {
    const int memory = choice(closed_eyes::kMemory, 3);
    const int wanted = page_of(hz, memory);
    const Page& page = pages_[wanted];
    const float left = page.written ? since(page) : 0.0f;
    for (int k = 0; k < closed_eyes::kPartials; ++k) tired[k] = left * page.tired[k];
    for (const Voice& other : pool_.voices) {
      if (!other.sounding || other.pending || page_of(other.frequency, memory) != wanted) continue;
      for (int k = 0; k < closed_eyes::kPartials; ++k) tired[k] = kit::max(tired[k], other.tired[k / 4][k & 3]);
    }
    for (int k = 0; k < closed_eyes::kPartials; ++k) {
      if (tired[k] < 1.0e-5f) tired[k] = 0.0f;
    }
  }
  void write_down(const Voice& voice) {
    for (int memory = 0; memory < 3; ++memory) {
      Page& page = pages_[page_of(voice.frequency, memory)];
      const float left = page.written ? since(page) : 0.0f;
      for (int k = 0; k < closed_eyes::kPartials; ++k) {
        page.tired[k] = kit::max(left * page.tired[k], voice.tired[k / 4][k & 3]);
      }
      page.when = clock_;
      page.written = true;
    }
  }

  // --- making a voice -------------------------------------------------------

  template <int Groups>
  void place(closed_eyes::Bank<Groups>& bank, int k, float hz) {
    const double w = hz < top_hz() ? 2.0 * 3.14159265358979323846 * static_cast<double>(hz) /
                                         static_cast<double>(sample_rate())
                                   : 0.0;
    bank.omega[k / 4][k & 3] = static_cast<float>(w);
    bank.turn_re[k / 4][k & 3] = static_cast<float>(std::cos(w));
    bank.turn_im[k / 4][k & 3] = static_cast<float>(std::sin(w));
  }

  void reweigh(Voice& voice, float form, float colour) {
    float weight[closed_eyes::kPartials];
    closed_eyes::weigh_source(voice.source, voice.spectrum, voice.frequency, form, colour, voice.gain, weight,
                               &voice.brightness);
    float strongest = 1.0e-6f;
    for (float w : weight) strongest = kit::max(strongest, w);
    const float hard = 0.75f + 0.25f * voice.gain;  // what is played hard tires further
    for (int k = 0; k < closed_eyes::kPartials; ++k) {
      const float u = weight[k] / strongest;
      voice.weight_to[k / 4][k & 3] = weight[k];
      voice.reach[k / 4][k & 3] = hard * u * (1.0f + kFaint) / (u + kFaint);
    }
    voice.strongest = strongest;
    voice.form_seen = form;
    voice.edge_seen = -1.0f;  // and the opposite is as dark as the note is bright
    voice.colour_seen = colour;
    voice.air_shape = closed_eyes::air_of(voice.source, voice.frequency, form, colour);
    voice.air.tune(voice.air_shape.low_hz, voice.air_shape.low_q, voice.air_shape.high_hz, voice.air_shape.high_q,
                   sample_rate());
  }

  // The opposite's levels under Edge; its places stay.
  void reshape(Voice& voice, float edge) {
    closed_eyes::make_image(voice.opponent, voice.image_hz, edge, voice.source, voice.form_seen, voice.brightness,
                           top_hz(), &voice.shape);
    for (int k = 0; k < closed_eyes::kImages; ++k) voice.image_to[k / 4][k & 3] = voice.shape.weight[k];
    voice.edge_seen = edge;
    if (voice.shape.breath > 0.0f) {
      voice.breath.tune(voice.shape.low_hz, voice.shape.low_q, voice.shape.high_hz, voice.shape.high_q, sample_rate());
    }
  }

  void make_opposite(Voice& voice) {
    voice.opponent = choice(closed_eyes::kOpposite, closed_eyes::kNumOpponents);
    voice.image_hz = voice.image_hz_to;
    reshape(voice, knob_[closed_eyes::kEdge].value);
    for (int k = 0; k < closed_eyes::kImages; ++k) {
      const int g = k / 4, j = k & 3;
      place(voice.image, k, voice.image_hz * voice.shape.ratio[k]);
      // The two of a pair begin a quarter turn apart: neither together nor against.
      const float at = 0.137f * static_cast<float>(k / 2) + 0.25f * static_cast<float>(k & 1);
      voice.image.re[g][j] = kit::SineTable::cos_lookup(at);
      voice.image.im[g][j] = kit::SineTable::lookup(at);
      voice.image_side[g][j] = voice.shape.side[k];
      voice.image_cents[g][j] = voice.shape.cents[k];
      voice.image_life[g][j] = voice.shape.life[k];
      voice.from[k] = voice.shape.from[k];
      voice.image_weight[g][j] = voice.image_to[g][j];
      voice.image_charge[g][j] = 1.0f;
    }
    voice.swapping = voice.moving = false;
  }

  // Lane j of a slow circle: where it begins, and how long it takes to go round.
  void sway(V4& re, V4& im, V4& turn_re, V4& turn_im, int j, float start, float seconds) {
    const float turn = kit::kTwoPi * tick_ / seconds;
    turn_re[j] = std::cos(turn);
    turn_im[j] = std::sin(turn);
    re[j] = kit::SineTable::cos_lookup(start);
    im[j] = kit::SineTable::lookup(start);
  }

  void start(Voice& voice, float frequency, float gain) {
    using namespace closed_eyes;
    const float form = knob_[kForm].value, colour = knob_[kColour].value;
    voice.source = choice(kSource, kNumSources);
    voice.frequency = frequency;
    voice.gain = gain;
    voice.rng.seed(0x51ED270Bu + 0x9E3779B9u * voice.order);
    tune_source(voice.source, frequency, form, colour, top_hz(), &voice.spectrum);
    const bool struck = percussive(voice.source);
    float tired[kPartials];
    voice.sounding = false;  // not among those it is remembered from
    remember(frequency, tired);
    for (int k = 0; k < kPartials; ++k) {
      const int g = k / 4, j = k & 3;
      // Drawn for every partial, so a note always takes as many numbers.
      const float at = voice.rng.uniform(), where = voice.rng.uniform(), period = 3.5f + 7.0f * voice.rng.uniform();
      const float n = static_cast<float>(k + 1);
      place(voice.note, k, frequency * voice.spectrum.ratio[k]);
      // Held sources begin anywhere, struck ones at zero, now up, now down.
      voice.note.re[g][j] = struck ? ((((k >> 1) * 3 + static_cast<int>(voice.order)) & 2) ? -1.0f : 1.0f)
                                   : kit::SineTable::cos_lookup(at);
      voice.note.im[g][j] = struck ? 0.0f : kit::SineTable::lookup(at);
      voice.side[g][j] = voice.spectrum.side[k] * ((voice.order & 1) ? 1.0f : -1.0f);
      voice.tired[g][j] = tired[k];
      voice.charge[g][j] = 0.8f * tired[k];
      voice.ring[g][j] = struck ? 0.0f : 1.0f;
      voice.ring_to[g][j] = 1.0f;
      voice.ring_turn[g][j] = voice.spectrum.ring[k] > 0.0f ? std::exp(-kSixtyDb * tick_ / voice.spectrum.ring[k]) : 1.0f;
      voice.pace[g][j] = 1.0f + 0.07f * static_cast<float>(k);
      voice.late[g][j] = kit::min(1.0f, 0.3f * std::log2(n));
      sway(voice.sway_re[g], voice.sway_im[g], voice.sway_turn_re[g], voice.sway_turn_im[g], j, where, period);
    }
    for (int k = 0; k < kImages; ++k) {
      const int g = k / 4, j = k & 3;
      const float at = voice.rng.uniform(), period = 2.6f + 6.0f * voice.rng.uniform();
      sway(voice.float_re[g], voice.float_im[g], voice.float_turn_re[g], voice.float_turn_im[g], j, at, period);
    }
    voice.air.clear(voice.rng.next_u32());
    voice.breath.clear(voice.rng.next_u32());
    reweigh(voice, form, colour);
    for (int g = 0; g < kGroups; ++g) voice.weight[g] = voice.weight_to[g];
    voice.note.arrive();
    voice.image_hz_to = frequency;
    make_opposite(voice);
    voice.swap = 1.0f;
    voice.amp = voice.amp_to = promise(gain) * source_trim(voice.source);
    voice.promise = promise(gain);
    voice.loud = 0.0f;
    voice.phase = voice.env = 0.0f;
    voice.burst = voice.accent = 1.0f;
    voice.haunt = voice.mean_tired = 0.0f;
    voice.haunt_due = true;
    voice.pulse_at = 0.0f;
    voice.throb_at = 0.75f;  // from its faintest
    voice.vib_at = 0.13f * static_cast<float>(voice.order % 7u);
    voice.aside_at = 0.31f * static_cast<float>(voice.order % 5u);
    voice.age = voice.refresh = 0.0f;
    voice.shown_a = voice.shown = 0.0f;
    voice.steal = voice.quit_level = 1.0f;
    voice.pending = voice.quit = false;
    voice.fresh = true;
    voice.sounding = true;
  }

  // A pitch that still sounds is struck again: it keeps its turning partials
  // and how tired they are, blooms again from where it stands, and is looked
  // at afresh if it had not been let go.
  void restrike(Voice& voice, float gain) {
    if (voice.held) voice.refresh = kRefreshSeconds;
    else voice.haunt_due = true;
    voice.accent = 1.0f;
    voice.gain = gain;
    voice.amp_to = promise(gain) * closed_eyes::source_trim(voice.source);
    voice.promise = promise(gain);
    voice.phase = unsmooth(voice.env);
    voice.age = 0.0f;
    voice.burst = 1.0f;
    for (int g = 0; g < kGroups; ++g) voice.ring_to[g] = splat(1.0f);
    voice.form_seen = -1.0f;  // the next tick weighs it for the new touch
    if (voice.image_hz_to != voice.frequency) {
      voice.image_hz_to = voice.frequency;
      voice.swapping = true;
      voice.moving = false;
    }
  }
  static constexpr float kRefreshSeconds = 0.05f;

  void retire(Voice& voice) {
    write_down(voice);
    voice.sounding = voice.pending = voice.quit = false;
    voice.loud = voice.promise = 0.0f;
  }

  // An opposite that lingers goes to the nearest tone of the keys held now.
  void move_opposites() {
    using namespace closed_eyes;
    if (choice(kSafe, 2) == 0) return;
    float held[kMaxVoices];
    int count = 0;
    for (const Voice& voice : pool_.voices) {
      if (voice.sounding && voice.held) held[count++] = voice.pending ? voice.pending_frequency : voice.frequency;
    }
    if (count == 0) return;
    for (Voice& voice : pool_.voices) {
      if (!voice.sounding || voice.held || voice.pending || voice.quit) continue;
      float nearest = 0.0f, away = 9.0f;
      for (int i = 0; i < count; ++i) {
        float octaves = std::log2(held[i] / voice.image_hz_to);
        octaves -= std::floor(octaves + 0.5f);
        if (std::fabs(octaves) < std::fabs(away)) {
          away = octaves;
          nearest = voice.image_hz_to * std::exp2(octaves);
        }
      }
      if (std::fabs(away) < 0.008f || std::fabs(away) > 0.51f) continue;
      voice.image_hz_to = nearest;
      voice.swapping = voice.moving = true;
    }
  }

  // --- every 32 samples -------------------------------------------------------

  // How far the lids are closed at this place of a blink.
  static float lids(float phase) {
    const float x = (phase - 0.66f) / 0.3f;
    if (x <= -1.0f || x >= 1.0f) return 0.0f;
    const float risen = kit::min(1.0f, 1.5f * (0.5f + 0.5f * kit::SineTable::cos_lookup(0.5f * x)));
    return smooth(risen);
  }

  static void turn(V4& re, V4& im, V4 turn_re, V4 turn_im) {
    const V4 turned = re * turn_re - im * turn_im;
    const V4 other = re * turn_im + im * turn_re;
    const V4 trim = splat(1.5f) - splat(0.5f) * (turned * turned + other * other);
    re = turned * trim;
    im = other * trim;
  }

  struct Knobs {
    float form, colour, air, depth, after, edge, seep, drift, blink, width;
    float down, rise, fall, attack_step, strike_rate, strike_seconds, accent, accent_fall, glide;
  };

  void control() {
    using namespace closed_eyes;
    Knobs k;
    k.form = knob_[kForm].next();
    k.colour = knob_[kColour].next();
    k.air = knob_[kAir].next();
    k.depth = 0.9f * knob_[kDepth].next();
    k.after = 1.6f * std::pow(knob_[kAfter].next(), 1.6f);
    k.edge = knob_[kEdge].next();
    k.seep = knob_[kSeep].next();
    k.drift = knob_[kDrift].next();
    k.blink = knob_[kBlink].next();
    k.width = knob_[kWidth].next();
    k.down = 1.0f - std::exp(-tick_ / param(kRecover));
    // Two poles one after the other reach 80 % in three of their times.
    k.rise = 1.0f - std::exp(-tick_ / (0.34f * param(kRise)));
    k.fall = 1.0f - std::exp(-tick_ / kit::min(0.34f * param(kRise), 0.08f));
    k.attack_step = tick_ / param(kAttack);
    k.strike_seconds = 0.0006f + 0.012f * param(kAttack);
    k.strike_rate = 1.0f - std::exp(-tick_ / k.strike_seconds);
    k.accent = 2.4f * kit::max(0.0f, 1.0f - param(kAttack) / kAccentAttack);
    k.accent_fall = std::exp(-tick_ / kAccentSeconds);
    blend_ = 1.0f - k.width;
    k.glide = 1.0f - std::exp(-tick_ / 0.015f);

    lids_ = lids(blink_phase_) * std::pow(k.blink, 0.75f);
    blink_phase_ += param(kBlinkRate) * tick_;
    blink_phase_ -= std::floor(blink_phase_);

    if (chord_serial_ != chord_seen_) {
      chord_seen_ = chord_serial_;
      chord_wait_ = 0.03f;
    } else if (chord_wait_ > 0.0f) {
      chord_wait_ -= tick_;
      if (chord_wait_ <= 0.0f) move_opposites();
    }
    ++ticks_;
    float most_tired = 0.0f, most_seen = 0.0f;
    const int memory = choice(kMemory, 3);
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.sounding) continue;
      const bool speaks = voice.note.arrive();
      const bool seen = voice.image.arrive();
      const bool breathes = voice.air.arrive();
      const bool seen_breath = voice.breath.arrive();
      const bool silent = !speaks && !seen && !breathes && !seen_breath;
      if (voice.pending) {
        voice.steal -= tick_ / kStealSeconds;
        if (voice.steal <= 0.0f && silent) {
          write_down(voice);
          start(voice, voice.pending_frequency, voice.pending_gain);
        }
      } else if (silent && !voice.held && !voice.fresh && over(voice, k)) {
        retire(voice);
        continue;
      }
      int others = 0;
      if (memory > 0) {
        const int page = page_of(voice.frequency, memory);
        for (const Voice& other : pool_.voices) {
          if (&other != &voice && other.sounding && other.held && !other.pending &&
              page_of(other.frequency, memory) == page) ++others;
        }
      }
      const float speed = kit::min(1.0f + kEnsemble * static_cast<float>(others), 6.0f);
      advance(voice, v, k, speed, !seen && !seen_breath);
      if (voice.held) most_tired = kit::max(most_tired, closed_eyes::top(voice.tired[0]));
      most_seen = kit::max(most_seen, image_level(voice));
    }
    // Many keys make room for each other, as players do: the more of them
    // sound, the less each is worth, so a full hand stays under the clip. What
    // noise and swells add to that is watched for.
    guard_top_ = kit::max(chunk_top_, guard_top_ * guard_fall_);
    chunk_top_ = 0.0f;
    const float guard = guard_top_ > kGuard ? kGuard / guard_top_ : 1.0f;
    guard_.coeff = guard < guard_.value ? guard_fast_ : room_slow_;
    guard_.set_target(guard);
    float crowd = 0.0f;
    for (const Voice& voice : pool_.voices) {
      if (voice.sounding) crowd += voice.level() / kVoiceGain;
    }
    const float room = crowd > kRoom ? std::sqrt(kRoom / crowd) : 1.0f;
    if (ticks_ == 1u) {
      room_.snap(room);
    } else {
      room_.coeff = room < room_.value ? room_fast_ : room_slow_;
      room_.set_target(room);
    }
    fatigue_meter_ = most_tired;
    image_meter_ = most_seen;
  }

  static float image_level(const Voice& voice) {
    return kit::max(voice.shown, 0.0f) * closed_eyes::top(voice.charge[0]);
  }

  // Nothing is left of a voice that would be heard.
  bool over(const Voice& voice, const Knobs& k) const {
    if (voice.quit_level <= 0.0f) return true;
    if (voice.env * voice.amp > 1.0e-5f) return false;
    float most = 0.0f;
    for (int g = 0; g < kGroups; ++g) most = kit::max(most, closed_eyes::top(voice.charge[g]));
    return most * k.after * voice.amp < 1.5e-5f;
  }

  void advance(Voice& voice, int index, const Knobs& k, float speed, bool image_dark) {
    using namespace closed_eyes;
    const bool struck = percussive(voice.source);
    voice.age += tick_;
    if (voice.quit) voice.quit_level = kit::max(voice.quit_level - tick_ / kQuitSeconds, 0.0f);
    const float way = kit::clamp(voice.steal, 0.0f, 1.0f) * voice.quit_level * voice.quit_level;
    voice.amp += (voice.amp_to - voice.amp) * k.glide * (struck ? 4.0f : 1.0f) * 0.25f;

    if (voice.form_seen != k.form || voice.colour_seen != k.colour) {
      if (voice.form_seen < 0.0f || ((ticks_ + static_cast<uint32_t>(index)) & 7u) == 0u) reweigh(voice, k.form, k.colour);
    }
    if (voice.edge_seen != k.edge && ((ticks_ + static_cast<uint32_t>(index)) & 7u) == 0u) reshape(voice, k.edge);

    // The note's own envelope.
    if (!voice.held) {
      voice.env *= std::exp(-kSixtyDb * tick_ / (param(kRelease) * release_scale(voice.source)));
      if (voice.env < 1.0e-6f) voice.env = 0.0f;
    } else if (struck) {
      voice.env += (1.0f - voice.env) * k.glide * 4.0f * 0.25f;
      if (voice.fresh) voice.env = 1.0f;
    } else {
      voice.phase = kit::min(voice.phase + k.attack_step / attack_scale(voice.source), 1.0f);
      voice.env = smooth(voice.phase);
    }
    if (!voice.held || voice.phase >= 1.0f || struck) voice.promise *= voice.age > 0.05f ? 0.9f : 1.0f;
    if (voice.promise < 1.0e-9f) voice.promise = 0.0f;
    voice.accent *= k.accent_fall;
    if (voice.accent < 1.0e-5f) voice.accent = 0.0f;
    voice.fresh = false;
    const float gate = 1.0f - lids_;
    const float onset = kit::min(1.0f, voice.age / kit::max(0.012f, 0.4f * param(kAttack)));
    voice.burst *= std::exp(-tick_ / voice.air_shape.burst_seconds);
    if (voice.burst < 1.0e-5f) voice.burst = 0.0f;

    // Tiring, and what it leaves.
    const float up = 1.0f - std::exp(-tick_ * speed / param(kTire));
    const float spend_all =
        1.0f - std::exp(-kSixtyDb * tick_ / (param(kLength) * length_scale(voice.source) * voice.shape.length));
    const float soak = struck ? 3.5f : 1.4f;  // a struck note has little time to be looked at
    const V4 open_gate = splat(voice.env * gate);
    const V4 refresh = splat(voice.refresh > 0.0f ? 1.0f - 0.7f * tick_ / kRefreshSeconds : 1.0f);
    voice.refresh -= tick_;
    V4 sum_weight = splat(1.0e-9f), sum_ring = splat(0.0f), sum_charge = splat(0.0f), sum_tired = splat(0.0f);
    const V4 one = splat(1.0f), zero = splat(0.0f);
    const float vib = bend_cents(voice, k) * 5.7762265e-4f;
    step_turn(voice.pulse_at, pulse_hz(voice.source) * (0.9f + 0.04f * static_cast<float>(voice.order % 6u)));
    const float pulse = 1.0f + pulse_depth(voice.source, k.form) * kit::SineTable::lookup(voice.pulse_at);
    // A key that comes back tired comes back paler, and what seeps through
    // takes the place of what it seeps through.
    const float level = voice.amp * gate * way * pulse * (1.0f - kPaler * voice.haunt) * (1.0f - kDissolve * k.seep * voice.mean_tired);
    const V4 per_level = splat(level), env = splat(voice.env);
    const float sway_depth = 0.03f + 0.65f * k.drift;
    const float accent = k.accent * voice.accent * (0.3f + 0.7f * voice.gain);
    for (int g = 0; g < kGroups; ++g) {
      V4& ring = voice.ring[g];
      if (struck) {
        voice.ring_to[g] = let_go(voice.ring_to[g] * voice.ring_turn[g]);
        ring = let_go(ring + (voice.ring_to[g] - ring) * splat(k.strike_rate));
      }
      const V4 heard = ring * open_gate;
      const V4 goal = voice.reach[g] * heard;
      const V4 pace = least(splat(up) * voice.pace[g], one);
      const V4 sink = struck ? least(pace * splat(kStruckSinks), one) : pace;
      V4 tired = voice.tired[g];
      tired += most(goal - tired, zero) * sink;
      tired -= tired * splat(k.down);  // it rests all the while: with a short Recover it never tires far
      tired = let_go(tired * refresh);
      voice.tired[g] = tired;
      V4 charge = voice.charge[g];
      charge += most(goal - charge, zero) * least(pace * splat(soak), one);
      charge = let_go(charge * (one - splat(spend_all) * (one - least(heard, one))));
      voice.charge[g] = charge;
      voice.weight[g] += (voice.weight_to[g] - voice.weight[g]) * splat(k.glide);
      const V4 w = voice.weight[g];
      sum_weight += w;
      sum_ring += w * ring;
      sum_charge += w * charge;
      sum_tired += w * tired;
      turn(voice.sway_re[g], voice.sway_im[g], voice.sway_turn_re[g], voice.sway_turn_im[g]);
      const V4 bloom = struck ? env : (env + (env * env - env) * voice.late[g]) * (one + splat(accent) * (splat(0.15f) + voice.late[g]));
      const V4 awake = one - splat(k.depth) * tired;
      V4 amount = w * per_level * bloom * ring * awake * awake;
      amount *= one + splat(sway_depth) * voice.sway_im[g];
      const V4 lean = splat(k.width) * voice.side[g];
      voice.note.aim(g, amount * (one + lean), amount * (one - lean), voice.note.omega[g] * splat(vib),
                     1.0f / static_cast<float>(kChunk));
    }
    const float scale = 1.0f / total(sum_weight);
    const float mean_charge = total(sum_charge) * scale, mean_tired = total(sum_tired) * scale;
    voice.mean_tired = kit::min(mean_tired, 1.0f);
    const float there = kit::min(voice.env * total(sum_ring) * scale, 1.0f);

    // The air round it.
    {
      const Air& shape = voice.air_shape;
      const float steady = shape.steady * (struck ? there : voice.env) * (1.0f - 0.7f * k.depth * mean_tired);
      // A slow strike is a soft one.
      const float soft = struck ? 0.006f / (0.006f + k.strike_seconds) : onset;
      const float burst = shape.burst * voice.burst * soft * (0.35f + 0.65f * voice.gain);
      const float amount = kAirGain * k.air * level * (steady + burst * (voice.held || struck ? 1.0f : voice.env));
      voice.air.aim(V4{shape.low, shape.low, shape.high, shape.high} * splat(amount), 1.0f / static_cast<float>(kChunk));
    }

    // The opposite: made again when it is to be another or elsewhere.
    if (voice.opponent != choice(kOpposite, kNumOpponents)) voice.swapping = true;
    if (voice.swapping) {
      voice.swap = kit::max(voice.swap - tick_ / (voice.moving ? 0.35f : 0.03f), 0.0f);
      if (image_dark && (voice.swap <= 0.0f || voice.shown * mean_charge < 1.0e-5f)) {
        make_opposite(voice);
        voice.swap = 0.0f;
      }
    } else {
      voice.swap = kit::min(voice.swap + tick_ / (voice.age > 0.2f && !voice.held ? 0.4f : 0.05f), 1.0f);
    }
    if (voice.haunt_due) {
      voice.haunt = voice.mean_tired;
      voice.haunt_due = false;
    }
    voice.haunt -= voice.haunt * k.down;
    if (voice.haunt < 1.0e-5f) voice.haunt = 0.0f;
    const float through = kit::max(k.seep, kHaunt * voice.haunt);
    const float open = through + (1.0f - through) * (1.0f - there);
    const float follow = open > voice.shown_a ? k.rise / rise_scale(voice.source) : k.fall;
    voice.shown_a += (open - voice.shown_a) * follow;
    voice.shown += (voice.shown_a - voice.shown) * follow;
    if (voice.shown_a < 1.0e-7f) voice.shown_a = 0.0f;
    if (voice.shown < 1.0e-7f) voice.shown = 0.0f;
    const float seen = kit::max(voice.shown, lids_);
    const float gust = 1.0f + voice.shape.gust * voice.float_im[0][0] * voice.float_re[1][1];
    step_turn(voice.throb_at, voice.shape.throb_hz);
    const float throb = 1.0f + voice.shape.throb * kit::SineTable::lookup(voice.throb_at);
    const float light = throb * after_trim(voice.source) * gust * pulse * voice.amp * k.after * seen * smooth(voice.swap) * way;
    const float spend = spend_all * (1.0f - there * gate);
    // Some of them swing from side to side as a whole.
    const float swing = voice.shape.sway;
    step_turn(voice.aside_at, voice.shape.sway_hz);
    const float aside = swing * kit::SineTable::lookup(voice.aside_at);
    const bool bands = voice.shape.line > 0.0f;
    const float narrow = kit::clamp(voice.image_hz / 320.0f, 0.3f, 1.2f);
    const float line = narrow * (voice.opponent == kRough ? kit::lerp(18.0f, 90.0f, k.edge) : voice.shape.line);
    const float torn = std::sqrt(kit::kTwoPi * line * tick_) / static_cast<float>(kChunk);
    const float float_depth = 0.08f + 0.8f * k.drift;
    const float cents = kMostCents * k.drift * std::sqrt(k.drift) * 5.7762265e-4f;
    for (int g = 0; g < kImageGroups; ++g) {
      V4 from;
      for (int j = 0; j < 4; ++j) {
        const int p = voice.from[4 * g + j];
        from[j] = voice.charge[p / 4][p & 3];
      }
      voice.image_weight[g] += (voice.image_to[g] - voice.image_weight[g]) * splat(k.glide);
      V4& burn = voice.image_charge[g];
      burn = let_go(burn * (one - splat(spend) * (voice.image_life[g] - one)));
      burn += (one - burn) * splat(up * there * gate);
      turn(voice.float_re[g], voice.float_im[g], voice.float_turn_re[g], voice.float_turn_im[g]);
      const V4 drive = least(splat(0.5f * mean_charge) + splat(0.5f) * from, one);
      V4 amount = voice.image_weight[g] * drive * (splat(2.0f) - drive) * burn * splat(light);
      amount *= one + splat(float_depth) * voice.float_im[g];
      const V4 lean = most(least(splat(k.width) * (voice.image_side[g] * splat(1.0f - 0.5f * swing) + splat(aside)), one), zero - one);
      V4 bend = voice.image.omega[g] * splat(cents) * voice.image_cents[g] * (one + splat(0.5f) * voice.float_re[g]);
      if (bands) {
        for (int j = 0; j < 4; ++j) bend[j] += torn * voice.rng.gaussian();
      }
      voice.image.aim(g, amount * (one + lean), amount * (one - lean), bend, 1.0f / static_cast<float>(kChunk));
    }
    {
      const float drive = kit::min(mean_charge, 1.0f);
      const float amount = voice.shape.breath * drive * (2.0f - drive) * light * (1.0f + 0.65f * k.drift * voice.float_im[0][0]);
      const float high = voice.shape.high * amount * (1.0f + 0.8f * k.drift * voice.float_im[0][1]);
      voice.breath.aim(V4{amount, amount, high, high}, 1.0f / static_cast<float>(kChunk));
    }
    voice.loud = voice.amp * kit::max(there * (1.0f - k.depth * mean_tired) * (1.0f - k.depth * mean_tired), seen * k.after * mean_charge);
  }

  // A slow phase in turns, for as long as a key is held.
  void step_turn(float& at, float hz) const {
    at += hz * tick_;
    at -= std::floor(at);
  }

  // What moves the whole note's pitch: a voice's vibrato, a reed's first moment.
  float bend_cents(Voice& voice, const Knobs& k) const {
    if (voice.source == closed_eyes::kVowel) {
      const float late = kit::clamp((voice.age - 0.3f) / 1.4f, 0.0f, 1.0f);
      step_turn(voice.vib_at, 4.9f + 0.5f * voice.side[0][1]);
      return late * (4.0f + 10.0f * k.drift) * kit::SineTable::lookup(voice.vib_at);
    }
    if (voice.source == closed_eyes::kReed) return voice.age < 0.6f ? -14.0f * std::exp(-voice.age / 0.06f) : 0.0f;
    return 0.0f;
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  Page pages_[kPages];
  kit::Smoother knob_[closed_eyes::kNumParams];
  kit::Smoother volume_, room_, guard_;
  float guard_fast_ = 0.0f, guard_fall_ = 0.0f, guard_top_ = 0.0f, chunk_top_ = 0.0f;
  float room_fast_ = 0.0f, room_slow_ = 0.0f;
  kit::IdleGate idle_;
  double clock_ = 0.0;
  uint32_t order_ = 0, ticks_ = 0;
  uint32_t chord_serial_ = 0, chord_seen_ = 0;
  float chord_wait_ = 0.0f;
  float tick_ = 0.0007f;
  float blink_phase_ = 0.0f;
  float blend_ = 0.0f;  // how much of each side's noise is heard on the other
  float fatigue_meter_ = 0.0f, image_meter_ = 0.0f, lids_ = 0.0f;
  int chunk_left_ = 0;
};

}  // namespace livemix
