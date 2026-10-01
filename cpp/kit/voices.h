#pragma once

#include <cstdint>

namespace livemix {
namespace kit {

// Note bookkeeping for polyphonic instruments: which voice plays which host
// note id, in what order they started, and which one to take when the pool
// is full. A new note takes an idle voice, else the quietest releasing
// voice, else the quietest held one (the oldest on a tie). The Voice type
// provides:
//
//   bool active() const;      still sounding (including its release tail)
//   bool releasing() const;   after note-off
//   float level() const;      current loudness, for stealing
//
// The pool never starts or stops a voice itself: note_on returns the slot
// and whether it was stolen, and the instrument does the rest.
template <typename Voice, int MaxVoices>
class VoicePool {
 public:
  static constexpr int kMaxVoices = MaxVoices;

  Voice voices[MaxVoices];

  void reset() {
    for (int i = 0; i < MaxVoices; ++i) {
      note_ids_[i] = -1;
      stamps_[i] = 0;
    }
    counter_ = 0;
    limit_ = MaxVoices;
  }

  // Cap the voices new notes may use (a CPU knob); 1..MaxVoices.
  void set_limit(int limit) { limit_ = limit < 1 ? 1 : (limit > MaxVoices ? MaxVoices : limit); }
  int limit() const { return limit_; }

  // Pick a voice for `note_id`. `*stolen` says whether it was still sounding.
  int note_on(int note_id, bool* stolen) {
    int choice = -1;
    for (int i = 0; i < limit_; ++i) {
      if (!voices[i].active()) {
        if (choice < 0 || stamps_[i] < stamps_[choice]) choice = i;
      }
    }
    *stolen = false;
    if (choice < 0) {
      choice = quietest(true);
      if (choice < 0) choice = quietest(false);
      *stolen = true;
    }
    note_ids_[choice] = note_id;
    stamps_[choice] = ++counter_;
    return choice;
  }

  // The newest held (not releasing) voice playing `note_id`, or -1.
  int find_held(int note_id) const {
    int choice = -1;
    for (int i = 0; i < MaxVoices; ++i) {
      if (note_ids_[i] == note_id && voices[i].active() && !voices[i].releasing()) {
        if (choice < 0 || stamps_[i] > stamps_[choice]) choice = i;
      }
    }
    return choice;
  }

  int note_id_of(int voice) const { return note_ids_[voice]; }

  int count_active() const {
    int count = 0;
    for (int i = 0; i < MaxVoices; ++i) count += voices[i].active() ? 1 : 0;
    return count;
  }

 private:
  int quietest(bool only_releasing) const {
    int choice = -1;
    float lowest = 1.0e9f;
    for (int i = 0; i < limit_; ++i) {
      if (only_releasing && !voices[i].releasing()) continue;
      const float level = voices[i].level();
      if (level < lowest || (level == lowest && choice >= 0 && stamps_[i] < stamps_[choice])) {
        lowest = level;
        choice = i;
      }
    }
    return choice;
  }

  int note_ids_[MaxVoices] = {};
  uint32_t stamps_[MaxVoices] = {};
  uint32_t counter_ = 0;
  int limit_ = MaxVoices;
};

}  // namespace kit
}  // namespace livemix
