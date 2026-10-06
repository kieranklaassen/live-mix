#pragma once

// Zone Sampler: many recordings mapped across the keys.
//
//   note ─► pick zones (key, velocity, round robin) ─► one voice per zone (up to 4)
//   per voice (48): read head ─► loop / crossfade ─► envelope · velocity · zone gain ─┐
//                   (rate = key against the zone's root · Tune · Fine, Hermite)       ├─► tone ─► out
//   stolen voice or a new instrument: last output ─► 8 ms fade-out tail ──────────────┘
//
// - The host hands over sounds and zones through the zone entry points
//   (cpp/common/device_api.h, "zone devices"): zones_begin() forgets the
//   instrument, zone_sample() reserves room in the pool for one sound and
//   zone_add() maps it to keys. A zone plays from the moment it is added.
// - A zone has a sound, a root key with a fine tune, a key range, a velocity
//   range, a gain and a pan, optional start and end frames, an optional loop
//   with a crossfade, and an optional place in a round-robin group.
// - Picking: the zones whose key range holds the key, or, where none does,
//   the ones nearest to it (the nearer root on a tie, then the zone added
//   first): so three recorded notes play the whole keyboard. Among those, the ones whose velocity range
//   holds the velocity, or the nearest. Zones that all match sound together
//   (layers), four at most. Of the zones of one round-robin group the next
//   position plays; each group counts its own notes.
// - The pitch follows the note's frequency exactly (not the rounded key), the
//   zone's root and tune, and the sound's own sample rate.
// - A loop repeats [loop start, loop end). The crossfade blends the last
//   stretch of each pass with the audio that leads into the loop start, with
//   a gain that keeps the power level for the measured correlation of the two
//   (as cpp/devices/sampler does). A loop "while held" is left when the key is
//   released, and the rest of the sound plays out under the release.
// - Nothing guards against aliasing: a key far above its zone's root folds.
//   Zones are meant to sit close to the keys they play.
// - The single-sound entry points (sample_capacity/buffer/commit) still work:
//   the sound becomes the whole instrument, at its own pitch on middle C.
//
// Before anything is loaded the pool holds a built-in instrument: three
// looped tones on C3, C4 and C5, each exactly periodic over its loop.

#include <cstring>

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class ZoneSampler : public kit::DeviceBase<zone_sampler::kNumParams> {
 public:
  static constexpr int kMaxVoices = 48;
  static constexpr int kMaxLayers = 4;
  static constexpr int kZoneFieldCount = 20;
  static constexpr int kMinFrames = 4;

  // The fields of a zone as the host writes them (cpp/common/device_api.h).
  enum Field : int {
    kFieldSample = 0,
    kFieldRoot,
    kFieldTune,
    kFieldLowKey,
    kFieldHighKey,
    kFieldLowVelocity,
    kFieldHighVelocity,
    kFieldGain,
    kFieldPan,
    kFieldStart,
    kFieldEnd,
    kFieldLoopMode,
    kFieldLoopStart,
    kFieldLoopEnd,
    kFieldLoopCrossfade,
    kFieldGroup,
    kFieldPosition,
    kFieldLength,
    kFieldTrack,
    kFieldReserved,
  };

  void init(float sample_rate) {
    using namespace zone_sampler;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) {
      pool_.voices[v] = Voice();
      pool_.voices[v].env.set_sample_rate(sr);
    }
    for (int c = 0; c < 2; ++c) tone_[c].reset();
    tone_hz_.set_time(kSmoothingSeconds, sr);
    pitch_.set_time(kSmoothingSeconds, sr);
    volume_.set_time(kSmoothingSeconds, sr);
    tail_length_ = static_cast<int>(kTailSeconds * sr);
    if (tail_length_ < 1) tail_length_ = 1;
    tail_count_ = tail_length_;
    tail_left_ = tail_right_ = 0.0f;
    last_left_ = last_right_ = 0.0f;
    edge_frames_ = kEdgeFadeSeconds * sr;
    clock_.reset(kControlPeriod);
    idle_.reset(sr, 0.1f);
    forget();
    build_default_instrument();
    for (int id = 0; id < kNumParams; ++id) apply(id);
    arrive();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency) || zone_count_ == 0) return;  // NaN, or nothing to play
    frequency = kit::clamp(frequency, 8.0f, 13000.0f);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    // A key struck again while held: let what it was playing go quickly.
    for (int held = pool_.find_held(note_id); held >= 0; held = pool_.find_held(note_id)) {
      pool_.voices[held].env.fast_release(0.02f);
    }
    const float key = kit::hz_to_midi(frequency);
    int picked[kMaxLayers];
    const int count = pick(kit::clamp_int(nearest(key), 0, 127), kit::clamp_int(nearest(gain * 127.0f), 0, 127), picked);
    for (int n = 0; n < count; ++n) start(zones_[picked[n]], note_id, key, gain);
  }

  void note_off(int note_id) {
    for (int held = pool_.find_held(note_id); held >= 0; held = pool_.find_held(note_id)) {
      Voice& voice = pool_.voices[held];
      voice.env.gate_off();
      voice.leaving = voice.loop_mode == kLoopHeld;
    }
  }

  void process(int frames) {
    frames = begin_block(frames);
    const bool was_asleep = idle_.asleep();
    const bool sounding = pool_.count_active() > 0 || tail_count_ < tail_length_;
    if (!idle_.wake(sounding)) {
      silence_output(frames);
      last_left_ = last_right_ = 0.0f;
      return;
    }
    // Nothing was sounding, so a knob moved in the silence has arrived.
    if (was_asleep) arrive();
    clear_input(frames);  // an instrument ignores its input
    for (int i = 0; i < frames; ++i) {
      if (clock_.tick()) control();
      const float pitch = pitch_.next();
      if (!tone_hz_.settled()) retune(tone_hz_.next());

      float left = 0.0f, right = 0.0f;
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        if (!voice.env.active()) continue;
        const float env = voice.env.next();
        if (!voice.env.active()) {
          voice.out_left = voice.out_right = 0.0f;
          continue;
        }
        play(voice, env, pitch);
        left += voice.out_left;
        right += voice.out_right;
        if (!voice.env.active()) voice.out_left = voice.out_right = 0.0f;  // it reached its end
      }
      left *= kVoiceGain;
      right *= kVoiceGain;
      if (tail_count_ < tail_length_) {
        const float gain = tail_gain();
        left += tail_left_ * gain;
        right += tail_right_ * gain;
        ++tail_count_;
      }
      last_left_ = left;
      last_right_ = right;
      const float volume = volume_.next();
      out_left_[i] = kit::soft_clip(tone_[0].lowpass(left) * volume);
      out_right_[i] = kit::soft_clip(tone_[1].lowpass(right) * volume);
    }
    idle_.settle(output_peak(frames), frames);
  }

  // --- zone entry points ----------------------------------------------------------------

  int zone_capacity() const { return zone_sampler::kZoneCapacity; }
  int zone_pool_capacity() const { return zone_sampler::kZonePoolFloats; }

  // Forget the instrument. What was sounding read sounds that are about to be
  // overwritten: its last value fades out instead.
  void zones_begin() {
    tail_left_ = last_left_;
    tail_right_ = last_right_;
    tail_count_ = 0;
    for (int v = 0; v < kMaxVoices; ++v) {
      pool_.voices[v].env.reset();
      pool_.voices[v].out_left = pool_.voices[v].out_right = 0.0f;
    }
    forget();
  }

  // Room for one sound of `frames` frames: its index, or -1 when it does not
  // fit (too many sounds, or the pool is full).
  int zone_sample(int frames, int channels, float rate) {
    using namespace zone_sampler;
    if (sample_count_ >= kZoneSampleCapacity) return -1;
    if (frames < kMinFrames || frames > kZonePoolFloats) return -1;
    const int planes = channels >= 2 ? 2 : 1;
    if (frames > (kZonePoolFloats - pool_used_) / planes) return -1;
    Sample& sample = samples_[sample_count_];
    sample.offset = pool_used_;
    sample.frames = frames;
    sample.channels = planes;
    sample.rate = rate > 1.0f && rate < 1.0e6f ? rate : 48000.0f;
    sample.checked = false;
    pool_used_ += frames * planes;
    return sample_count_++;
  }

  // Where the host writes it: channel 0, then channel 1 `frames` later.
  float* zone_sample_buffer(int index) {
    if (index < 0 || index >= sample_count_) return nullptr;
    return data_ + samples_[index].offset;
  }

  float* zone_fields() { return fields_; }

  // A zone from the fields: its index, or -1 when it names no sound or there
  // is no room. Whatever else is out of range is clamped.
  int zone_add() {
    using namespace zone_sampler;
    const int index = add_zone();
    for (int f = 0; f < kZoneFieldCount; ++f) fields_[f] = 0.0f;
    return index;
  }

  int zone_count() const { return zone_count_; }
  int sounding() const { return pool_.count_active(); }

  // --- single-sound entry points --------------------------------------------------------

  // The pool itself is the buffer: half of it per channel.
  int sample_capacity() const { return zone_sampler::kZonePoolFloats / 2; }
  float* sample_buffer() { return data_; }

  // One sound as the whole instrument: every key, at its own pitch on middle C.
  void sample_commit(int frames, int channels, float rate) {
    zones_begin();
    const int capacity = sample_capacity();
    frames = kit::clamp_int(frames, 0, capacity);
    if (frames < kMinFrames) return;
    if (channels >= 2) std::memmove(data_ + frames, data_ + capacity, sizeof(float) * static_cast<size_t>(frames));
    const int sample = zone_sample(frames, channels, rate);
    if (sample < 0) return;
    default_fields(sample, 60.0f, 0, 127);
    zone_add();
  }

 private:
  enum LoopMode : int { kLoopOff = 0, kLoopOn = 1, kLoopHeld = 2 };

  // Both are filled in whole when they are made (zone_sample, add_zone); they
  // start as zeros so the tables cost the module nothing.
  struct Sample {
    int offset = 0;  // into the pool, in floats
    int frames = 0;
    int channels = 0;
    float rate = 0.0f;
    bool checked = false;  // its data has been made safe to play
  };

  struct Zone {
    int sample = 0;
    float root = 0.0f;
    float tune = 0.0f;  // semitones
    int low_key = 0, high_key = 0;
    int low_velocity = 0, high_velocity = 0;
    float gain_left = 0.0f, gain_right = 0.0f;
    int start = 0, end = 0;  // [start, end)
    int loop_mode = kLoopOff;
    int loop_start = 0, loop_end = 0, crossfade = 0;
    float correlation = 0.0f;  // of the two stretches the crossfade blends
    int group = 0, position = 0, length = 0;
    float track = 0.0f;
  };

  struct Voice {
    kit::Adsr env;
    const float* left = nullptr;
    const float* right = nullptr;  // the same plane for a mono sound
    int frames = 0;
    double position = 0.0;  // in the sound's frames
    float step = 1.0f;      // frames per output frame before Tune and Fine
    float gain = 0.0f;      // velocity
    float gain_left = 1.0f, gain_right = 1.0f;
    int end = 0;
    int loop_mode = kLoopOff;
    bool looping = false;
    bool leaving = false;  // released: leave the loop once clear of its crossfade
    int loop_start = 0, loop_end = 0, crossfade = 0;
    float correlation = 1.0f;
    float out_left = 0.0f, out_right = 0.0f;  // its last output, for a steal

    bool active() const { return env.active(); }
    bool releasing() const { return env.releasing(); }
    // True from the moment the voice is taken: a note that has just started
    // counts at the level it is heading for.
    float level() const { return (env.stage() == kit::Adsr::kAttack ? 1.0f : env.level()) * gain; }
  };

  // A full-scale sound on one key at gain 0.7 peaks near -14 dBFS at the
  // default volume; the built-in tones sit 6 dB under that.
  static constexpr float kVoiceGain = 0.8f;
  static constexpr int kControlPeriod = 32;
  static constexpr float kTailSeconds = 0.008f;
  static constexpr float kEdgeFadeSeconds = 0.002f;
  static constexpr float kMinStep = 1.0f / 64.0f;
  static constexpr float kMaxStep = 16.0f;
  static constexpr int kGroups = 256;
  static constexpr int kCandidates = 16;

  static int nearest(float value) { return static_cast<int>(value + (value < 0.0f ? -0.5f : 0.5f)); }

  // A field as a whole number; NaN and the absurd become `fallback`.
  static int whole(float value, int fallback) {
    if (!(value == value) || value > 1.0e9f || value < -1.0e9f) return fallback;
    return nearest(value);
  }

  static float number(float value, float fallback, float low, float high) {
    if (!(value == value)) return fallback;
    return kit::clamp(value, low, high);
  }

  void forget() {
    zone_count_ = 0;
    sample_count_ = 0;
    pool_used_ = 0;
    for (int g = 0; g < kGroups; ++g) turns_[g] = 0;
    for (int f = 0; f < kZoneFieldCount; ++f) fields_[f] = 0.0f;
  }

  void default_fields(int sample, float root, int low_key, int high_key) {
    for (int f = 0; f < kZoneFieldCount; ++f) fields_[f] = 0.0f;
    fields_[kFieldSample] = static_cast<float>(sample);
    fields_[kFieldRoot] = root;
    fields_[kFieldLowKey] = static_cast<float>(low_key);
    fields_[kFieldHighKey] = static_cast<float>(high_key);
    fields_[kFieldHighVelocity] = 127.0f;
    fields_[kFieldPosition] = 1.0f;
    fields_[kFieldLength] = 1.0f;
    fields_[kFieldTrack] = 1.0f;
  }

  // NaN and runaway values in a sound would reach the output as they are.
  void make_safe(Sample& sample) {
    if (sample.checked) return;
    float* data = data_ + sample.offset;
    const int count = sample.frames * sample.channels;
    for (int i = 0; i < count; ++i) {
      if (!(data[i] == data[i]) || data[i] > 8.0f || data[i] < -8.0f) data[i] = 0.0f;
    }
    sample.checked = true;
  }

  int add_zone() {
    using namespace zone_sampler;
    if (zone_count_ >= kZoneCapacity) return -1;
    const float* f = fields_;
    const int which = whole(f[kFieldSample], -1);
    if (which < 0 || which >= sample_count_) return -1;
    Sample& sample = samples_[which];
    make_safe(sample);

    Zone zone;
    zone.sample = which;
    zone.root = number(f[kFieldRoot], 60.0f, 0.0f, 127.0f);
    zone.tune = number(f[kFieldTune], 0.0f, -4800.0f, 4800.0f) * 0.01f;
    zone.low_key = kit::clamp_int(whole(f[kFieldLowKey], 0), 0, 127);
    zone.high_key = kit::clamp_int(whole(f[kFieldHighKey], 127), 0, 127);
    if (zone.low_key > zone.high_key) {
      const int swap = zone.low_key;
      zone.low_key = zone.high_key;
      zone.high_key = swap;
    }
    zone.low_velocity = kit::clamp_int(whole(f[kFieldLowVelocity], 0), 0, 127);
    zone.high_velocity = kit::clamp_int(whole(f[kFieldHighVelocity], 127), 0, 127);
    if (zone.low_velocity > zone.high_velocity) {
      const int swap = zone.low_velocity;
      zone.low_velocity = zone.high_velocity;
      zone.high_velocity = swap;
    }
    const float gain = kit::db_to_gain(number(f[kFieldGain], 0.0f, -96.0f, 24.0f));
    // A balance, not a pan law: the centre plays both sides at the zone's gain.
    const float pan = number(f[kFieldPan], 0.0f, -1.0f, 1.0f);
    zone.gain_left = gain * (pan > 0.0f ? 1.0f - pan : 1.0f);
    zone.gain_right = gain * (pan < 0.0f ? 1.0f + pan : 1.0f);

    const int frames = sample.frames;
    zone.start = kit::clamp_int(whole(f[kFieldStart], 0), 0, frames - kMinFrames);
    zone.end = whole(f[kFieldEnd], 0);
    if (zone.end <= 0 || zone.end > frames) zone.end = frames;
    if (zone.end < zone.start + kMinFrames) zone.end = zone.start + kMinFrames;

    zone.loop_mode = kit::clamp_int(whole(f[kFieldLoopMode], 0), 0, 2);
    zone.loop_start = kit::clamp_int(whole(f[kFieldLoopStart], 0), zone.start, zone.end);
    zone.loop_end = whole(f[kFieldLoopEnd], 0);
    if (zone.loop_end <= 0 || zone.loop_end > zone.end) zone.loop_end = zone.end;
    if (zone.loop_end - zone.loop_start < kMinFrames) zone.loop_mode = kLoopOff;
    int fade = zone.loop_mode == kLoopOff ? 0 : whole(f[kFieldLoopCrossfade], 0);
    // It needs that much audio leading into the loop start, and half a loop at most.
    if (fade > zone.loop_start) fade = zone.loop_start;
    if (fade > (zone.loop_end - zone.loop_start) / 2) fade = (zone.loop_end - zone.loop_start) / 2;
    if (fade < 2) fade = 0;
    zone.crossfade = fade;
    zone.correlation = 1.0f;
    if (fade > 0) {
      // 256 points through the two stretches the crossfade blends.
      const float* data = data_ + sample.offset;
      double xy = 0.0, xx = 0.0, yy = 0.0;
      for (int k = 0; k < 256; ++k) {
        const int offset = static_cast<int>(static_cast<int64_t>(k) * fade / 256);
        const double x = data[zone.loop_end - fade + offset], y = data[zone.loop_start - fade + offset];
        xy += x * y;
        xx += x * x;
        yy += y * y;
      }
      if (xx > 0.0 && yy > 0.0) {
        zone.correlation = kit::clamp(static_cast<float>(xy / std::sqrt(xx * yy)), 0.0f, 1.0f);
      }
    }

    zone.group = whole(f[kFieldGroup], 0);
    if (zone.group < 0) zone.group = 0;
    zone.position = kit::clamp_int(whole(f[kFieldPosition], 1), 1, 1024);
    zone.length = kit::clamp_int(whole(f[kFieldLength], 1), 1, 1024);
    zone.track = number(f[kFieldTrack], 1.0f, 0.0f, 1.0f);
    zones_[zone_count_] = zone;
    return zone_count_++;
  }

  // --- picking --------------------------------------------------------------------------

  static int outside(int value, int low, int high) {
    return value < low ? low - value : (value > high ? value - high : 0);
  }

  // The zones a note plays, into `picked`; their count.
  int pick(int key, int velocity, int* picked) {
    const float root_key = static_cast<float>(key);
    int best_key = 1 << 20, best_velocity = 1 << 20;
    float best_root = 1.0e9f;
    // By key first, then by velocity among those; off the map, the nearer root.
    for (int z = 0; z < zone_count_; ++z) {
      const int away = outside(key, zones_[z].low_key, zones_[z].high_key);
      if (away < best_key) best_key = away;
    }
    for (int z = 0; z < zone_count_; ++z) {
      const Zone& zone = zones_[z];
      if (outside(key, zone.low_key, zone.high_key) != best_key) continue;
      const int away = outside(velocity, zone.low_velocity, zone.high_velocity);
      if (away < best_velocity) best_velocity = away;
    }
    const bool off_the_map = best_key > 0;
    if (off_the_map) {
      for (int z = 0; z < zone_count_; ++z) {
        const Zone& zone = zones_[z];
        if (outside(key, zone.low_key, zone.high_key) != best_key) continue;
        if (outside(velocity, zone.low_velocity, zone.high_velocity) != best_velocity) continue;
        const float away = zone.root > root_key ? zone.root - root_key : root_key - zone.root;
        if (away < best_root) best_root = away;
      }
    }
    int candidates[kCandidates];
    int found = 0;
    for (int z = 0; z < zone_count_ && found < kCandidates; ++z) {
      const Zone& zone = zones_[z];
      if (outside(key, zone.low_key, zone.high_key) != best_key) continue;
      if (outside(velocity, zone.low_velocity, zone.high_velocity) != best_velocity) continue;
      if (off_the_map) {
        const float away = zone.root > root_key ? zone.root - root_key : root_key - zone.root;
        if (away != best_root) continue;
        // Two zones as near as each other: the earlier one, with its layers.
        if (found > 0 && (zone.low_key != zones_[candidates[0]].low_key || zone.high_key != zones_[candidates[0]].high_key)) {
          continue;
        }
      }
      candidates[found++] = z;
    }

    // Round robin: of each group, the position whose turn it is (the lowest
    // there is when that one is missing). Each group then moves on by one.
    int count = 0;
    for (int n = 0; n < found; ++n) {
      const Zone& zone = zones_[candidates[n]];
      bool plays = true;
      if (zone.group > 0) {
        int length = 1, lowest = 1 << 20;
        for (int m = 0; m < found; ++m) {
          const Zone& other = zones_[candidates[m]];
          if (other.group != zone.group) continue;
          if (other.length > length) length = other.length;
          if (other.position > length) length = other.position;
          if (other.position < lowest) lowest = other.position;
        }
        int turn = static_cast<int>(turns_[zone.group % kGroups] % static_cast<uint32_t>(length)) + 1;
        bool there = false;
        for (int m = 0; m < found; ++m) {
          const Zone& other = zones_[candidates[m]];
          if (other.group == zone.group && other.position == turn) there = true;
        }
        if (!there) turn = lowest;
        plays = zone.position == turn;
      }
      if (plays && count < kMaxLayers) picked[count++] = candidates[n];
    }
    for (int n = 0; n < found; ++n) {
      const int group = zones_[candidates[n]].group;
      if (group <= 0) continue;
      bool first = true;
      for (int m = 0; m < n; ++m) {
        if (zones_[candidates[m]].group == group) first = false;
      }
      if (first) ++turns_[group % kGroups];
    }
    return count;
  }

  // --- one voice ------------------------------------------------------------------------

  void start(const Zone& zone, int note_id, float key, float gain) {
    using namespace zone_sampler;
    const Sample& sample = samples_[zone.sample];
    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    if (stolen) hand_to_tail(voice.out_left * kVoiceGain, voice.out_right * kVoiceGain);
    voice.env.reset();
    voice.left = data_ + sample.offset;
    voice.right = sample.channels == 2 ? voice.left + sample.frames : voice.left;
    voice.frames = sample.frames;
    voice.position = static_cast<double>(zone.start);
    const float semitones = (key - zone.root) * zone.track + zone.tune;
    voice.step = kit::clamp(kit::semitones_to_ratio(semitones) * sample.rate / sample_rate(), kMinStep, kMaxStep);
    const float amount = param(kVelocity);
    voice.gain = 1.0f - amount + amount * gain;
    voice.gain_left = zone.gain_left;
    voice.gain_right = zone.gain_right;
    voice.end = zone.end;
    voice.loop_mode = zone.loop_mode;
    voice.looping = zone.loop_mode != kLoopOff;
    voice.leaving = false;
    voice.loop_start = zone.loop_start;
    voice.loop_end = zone.loop_end;
    voice.crossfade = zone.crossfade;
    voice.correlation = zone.correlation;
    voice.out_left = voice.out_right = 0.0f;
    voice.env.set(param(kAttack), 0.01f, 1.0f, param(kRelease));
    voice.env.gate_on();
  }

  // The frame a stencil index stands for: past the loop end, what the loop
  // plays next; past either end of the sound, its first or last frame.
  static int resolve(const Voice& voice, int index, bool wraps) {
    if (wraps && index >= voice.loop_end) {
      const int length = voice.loop_end - voice.loop_start;
      index = voice.loop_start + (index - voice.loop_start) % length;
    }
    return kit::clamp_int(index, 0, voice.frames - 1);
  }

  // The sound at frame `index` plus the fraction the weights were made for.
  static void read(const Voice& voice, int index, const float* w, bool wraps, float* left, float* right) {
    const int ceiling = wraps ? voice.loop_end : voice.frames;
    if (index > 0 && index < ceiling - 2) {
      const float* p = voice.left + index - 1;
      *left = w[0] * p[0] + w[1] * p[1] + w[2] * p[2] + w[3] * p[3];
      if (voice.right != voice.left) {
        const float* q = voice.right + index - 1;
        *right = w[0] * q[0] + w[1] * q[1] + w[2] * q[2] + w[3] * q[3];
      } else {
        *right = *left;
      }
    } else {
      const int i0 = resolve(voice, index - 1, wraps), i1 = resolve(voice, index, wraps);
      const int i2 = resolve(voice, index + 1, wraps), i3 = resolve(voice, index + 2, wraps);
      *left = w[0] * voice.left[i0] + w[1] * voice.left[i1] + w[2] * voice.left[i2] + w[3] * voice.left[i3];
      *right = w[0] * voice.right[i0] + w[1] * voice.right[i1] + w[2] * voice.right[i2] + w[3] * voice.right[i3];
    }
  }

  // One output frame of `voice` into its out_left / out_right, then move its
  // read head and deal with the loop or the end of the sound.
  void play(Voice& voice, float env, float pitch) {
    const double position = voice.position;
    const int index = static_cast<int>(position);
    const float t = static_cast<float>(position - static_cast<double>(index));
    const float t2 = t * t;
    const float t3 = t2 * t;
    const float w[4] = {-0.5f * t3 + t2 - 0.5f * t, 1.5f * t3 - 2.5f * t2 + 1.0f,
                        -1.5f * t3 + 2.0f * t2 + 0.5f * t, 0.5f * (t3 - t2)};
    const double fade_start = static_cast<double>(voice.loop_end - voice.crossfade);
    // A released "while held" loop is left between crossfades, never inside one.
    if (voice.leaving && voice.looping && position < fade_start) voice.looping = false;

    float left, right;
    read(voice, index, w, voice.looping, &left, &right);
    if (voice.looping && voice.crossfade > 0 && position >= fade_start) {
      float other_left, other_right;
      read(voice, index - (voice.loop_end - voice.loop_start), w, false, &other_left, &other_right);
      const float a = kit::clamp(static_cast<float>(position - fade_start) / static_cast<float>(voice.crossfade), 0.0f, 1.0f);
      // Linear blend, scaled to hold the power for this correlation.
      const float gain = 1.0f / std::sqrt(1.0f - 2.0f * a * (1.0f - a) * (1.0f - voice.correlation));
      left = gain * (left + a * (other_left - left));
      right = gain * (right + a * (other_right - right));
    }

    const float step = voice.step * pitch;
    float amplitude = env * voice.gain;
    if (!voice.looping) {
      // The last 2 ms before the end fade, so a sound that does not end at
      // zero does not click.
      const float room = static_cast<float>(static_cast<double>(voice.end) - position);
      const float fade_frames = step * edge_frames_;
      if (room < fade_frames) amplitude *= kit::clamp(room / fade_frames, 0.0f, 1.0f);
    }
    voice.out_left = left * amplitude * voice.gain_left;
    voice.out_right = right * amplitude * voice.gain_right;

    double next = position + static_cast<double>(step);
    if (voice.looping) {
      if (next >= static_cast<double>(voice.loop_end)) {
        const double length = static_cast<double>(voice.loop_end - voice.loop_start);
        next -= length;
        if (next >= static_cast<double>(voice.loop_end)) {
          next = static_cast<double>(voice.loop_start) + std::fmod(next - static_cast<double>(voice.loop_start), length);
        }
      }
    } else if (next >= static_cast<double>(voice.end)) {
      voice.env.reset();
    }
    voice.position = next;
  }

  // --- control --------------------------------------------------------------------------

  // Every 32 samples: the envelope times follow their knobs while a note sounds.
  void control() {
    using namespace zone_sampler;
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (voice.env.active()) voice.env.set(param(kAttack), 0.01f, 1.0f, param(kRelease));
    }
  }

  void retune(float hz) {
    tone_[0].set(hz, kit::kSqrtHalf, sample_rate());
    tone_[1].g = tone_[0].g;
    tone_[1].k = tone_[0].k;
    tone_[1].a1 = tone_[0].a1;
    tone_[1].a2 = tone_[0].a2;
    tone_[1].a3 = tone_[0].a3;
  }

  // Waking from sleep, or starting: every smoothed knob is where it was set,
  // and the control clock starts over, whatever the block sizes were.
  void arrive() {
    pitch_.snap(pitch_.target);
    tone_hz_.snap(tone_hz_.target);
    volume_.snap(volume_.target);
    retune(tone_hz_.value);
    for (int c = 0; c < 2; ++c) tone_[c].reset();
    clock_.reset(kControlPeriod);
  }

  void apply(int id) {
    using namespace zone_sampler;
    switch (id) {
      case kTune:
      case kFine:
        pitch_.set(kit::semitones_to_ratio(param(kTune) + 0.01f * param(kFine)), primed());
        break;
      case kTone:
        tone_hz_.set(param(kTone), primed());
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(param(kVolume)), primed());
        break;
      default:
        break;  // read at note-on and on the control clock
    }
  }

  float tail_gain() const {
    if (tail_count_ >= tail_length_) return 0.0f;
    const float t = static_cast<float>(tail_count_) / static_cast<float>(tail_length_);
    return 1.0f - t * t * (3.0f - 2.0f * t);
  }

  // Let `left`/`right`, which is about to stop, fade out instead.
  void hand_to_tail(float left, float right) {
    const float gain = tail_gain();
    tail_left_ = tail_left_ * gain + left;
    tail_right_ = tail_right_ * gain + right;
    tail_count_ = 0;
  }

  // --- the built-in instrument ----------------------------------------------------------

  // Three mono tones at 48 kHz, on C3, C4 and C5: a 2048-frame rise, then a
  // loop of about half a second that holds a whole number of cycles, so it
  // repeats as it stands. The lower the tone, the more harmonics it has.
  void build_default_instrument() {
    static constexpr int kRoots[3] = {48, 60, 72};
    static constexpr int kLows[3] = {0, 55, 67};
    static constexpr int kHighs[3] = {54, 66, 127};
    static constexpr int kRise = 2048;
    static constexpr float kHarmonics[6] = {1.0f, 0.5f, 0.28f, 0.14f, 0.07f, 0.035f};
    for (int z = 0; z < 3; ++z) {
      const double hz = 440.0 * std::exp2((kRoots[z] - 69) / 12.0);
      const int cycles = static_cast<int>(hz * 0.5 + 0.5);
      const int loop = static_cast<int>(cycles * 48000.0 / hz + 0.5);
      const int frames = kRise + loop;
      const int sample = zone_sample(frames, 1, 48000.0f);
      if (sample < 0) return;
      float* out = zone_sample_buffer(sample);
      const int harmonics = 6 - z;
      for (int i = 0; i < frames; ++i) {
        const double x = static_cast<double>(i - kRise) / static_cast<double>(loop);
        float tone = 0.0f;
        for (int h = 0; h < harmonics; ++h) {
          const double phase = cycles * x * static_cast<double>(h + 1);
          tone += kHarmonics[h] * kit::SineTable::lookup(static_cast<float>(phase - std::floor(phase)));
        }
        float rise = 1.0f;
        if (i < kRise) {
          const float t = static_cast<float>(i) / static_cast<float>(kRise);
          rise = t * t * (3.0f - 2.0f * t);
        }
        out[i] = 0.3f * rise * tone;
      }
      default_fields(sample, static_cast<float>(kRoots[z]), kLows[z], kHighs[z]);
      fields_[kFieldLoopMode] = static_cast<float>(kLoopOn);
      fields_[kFieldLoopStart] = static_cast<float>(kRise);
      zone_add();
    }
  }

  // The sounds, one after another: a mono sound takes `frames` floats, a
  // stereo one twice that (left, then right).
  float data_[zone_sampler::kZonePoolFloats] = {};
  Sample samples_[zone_sampler::kZoneSampleCapacity];
  Zone zones_[zone_sampler::kZoneCapacity];
  float fields_[kZoneFieldCount] = {};
  uint32_t turns_[kGroups] = {};  // notes each round-robin group has played
  int zone_count_ = 0;
  int sample_count_ = 0;
  int pool_used_ = 0;
  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::Svf tone_[2];
  kit::Smoother tone_hz_, pitch_, volume_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  float edge_frames_ = 96.0f;
  // The fade-out that replaces whatever was cut off.
  float tail_left_ = 0.0f, tail_right_ = 0.0f;
  float last_left_ = 0.0f, last_right_ = 0.0f;
  int tail_count_ = 0;
  int tail_length_ = 1;
};

}  // namespace livemix
