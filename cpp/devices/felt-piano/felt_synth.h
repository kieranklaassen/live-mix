#pragma once

#include "felt_voice.h"

namespace livemix {

// juce::Synthesiser's note/pedal bookkeeping (JUCE 8,
// juce_audio_basics/synthesisers/juce_Synthesiser.cpp) for one MIDI channel,
// plus Felt's FeltSynth::findVoiceToSteal (FeltVoice.cpp:218-257). Written
// JUCE-free so the same voice logic runs behind the device ABI:
// - noteOn: voices already playing the same note are released with tail-off,
//   then a free voice starts (or one is stolen: hard stop -> ghost pool).
// - noteOff: the key comes up; the voice is released unless the sustain or
//   sostenuto pedal holds it.
// - sustain pedal down marks every held key; up releases every voice whose
//   key is up and is not held by sostenuto. Voices started while the pedal is
//   down inherit it.
// - sostenuto down marks every sounding voice; up releases every marked voice
//   (JUCE's behaviour, even if the key is still down; Felt inherits it) and
//   clears the mark so the damper can fall (see handle_sostenuto_pedal).
// Notes are keyed by the host's `note_id` for note-off, by MIDI number for
// the same-note rule. Statically allocated; no allocation after construction.
class FeltSynth {
 public:
  static constexpr int kMaxPolyphony = 32;

  void prepare(double sample_rate, GhostPool* ghost_pool) {
    for (auto& voice : voices_) {
      voice.prepare_to_play(sample_rate);
      voice.set_ghost_pool(ghost_pool);
    }
    sustain_pedal_down_ = false;
    polyphony_ = kMaxPolyphony;
  }

  FeltVoice* voice(int index) { return &voices_[index]; }
  int num_voices() const { return kMaxPolyphony; }

  // live-mix addition: cap the pool new notes may start in (1..kMaxPolyphony)
  // so a host can trade polyphony for CPU. Voices above the cap that are
  // already sounding finish naturally; only allocation and stealing shrink.
  void set_polyphony(int voices) {
    if (voices < 1) voices = 1;
    if (voices > kMaxPolyphony) voices = kMaxPolyphony;
    polyphony_ = voices;
  }
  int polyphony() const { return polyphony_; }

  int active_voice_count() const {
    int count = 0;
    for (const auto& voice : voices_) count += voice.is_voice_active() ? 1 : 0;
    return count;
  }

  // juce::Synthesiser::noteOn for one channel.
  void note_on(int note_id, int midi_note, float velocity) {
    for (auto& voice : voices_) {
      if (voice.currently_playing_note() == midi_note) stop_voice(voice, 1.0f, true);
    }
    FeltVoice* target = find_free_voice();
    if (target == nullptr) return;
    // juce::Synthesiser::startVoice.
    if (target->currently_playing_note() > 0) target->stop_note(0.0f, false);
    target->begin(note_id, midi_note, sustain_pedal_down_);
    target->start_note(midi_note, velocity);
  }

  // juce::Synthesiser::noteOff, matching voices by the host's note id.
  void note_off(int note_id, float velocity, bool allow_tail_off) {
    for (auto& voice : voices_) {
      if (voice.note_id() != note_id || !voice.is_voice_active()) continue;
      voice.set_key_down(false);
      if (!(voice.is_sustain_pedal_down() || voice.is_sostenuto_pedal_down())) {
        stop_voice(voice, velocity, allow_tail_off);
      }
    }
  }

  // juce::Synthesiser::allNotesOff (tail-off).
  void all_notes_off() {
    for (auto& voice : voices_) {
      if (voice.is_voice_active()) stop_voice(voice, 1.0f, true);
    }
    sustain_pedal_down_ = false;
  }

  // juce::Synthesiser::handleSustainPedal.
  void handle_sustain_pedal(bool is_down) {
    if (is_down) {
      sustain_pedal_down_ = true;
      for (auto& voice : voices_) {
        if (voice.is_key_down()) voice.set_sustain_pedal_down(true);
      }
    } else {
      for (auto& voice : voices_) {
        voice.set_sustain_pedal_down(false);
        if (!voice.is_key_down() && !voice.is_sostenuto_pedal_down()) stop_voice(voice, 1.0f, true);
      }
      sustain_pedal_down_ = false;
    }
  }

  // juce::Synthesiser::handleSostenutoPedal, with one fix: the voice's
  // sostenuto flag is cleared when the pedal lifts. JUCE leaves it set (only
  // startVoice resets it), and FeltVoice's damper reads that flag
  // (`sustained = isSustainPedalDown() || isSostenutoPedalDown()`), so in the
  // JUCE build a key released under sostenuto never damps when the pedal
  // comes up; it rings until it decays or is stolen. Reported to kkfonie.
  void handle_sostenuto_pedal(bool is_down) {
    for (auto& voice : voices_) {
      if (is_down) {
        voice.set_sostenuto_pedal_down(true);
      } else if (voice.is_sostenuto_pedal_down()) {
        voice.set_sostenuto_pedal_down(false);
        stop_voice(voice, 1.0f, true);
      }
    }
  }

  bool sustain_pedal_down() const { return sustain_pedal_down_; }

  // Renders every active voice additively into outL/outR.
  void render(float* outL, float* outR, int num_samples) {
    for (auto& voice : voices_) voice.render(outL, outR, num_samples);
  }

 private:
  static void stop_voice(FeltVoice& voice, float velocity, bool allow_tail_off) {
    voice.stop_note(velocity, allow_tail_off);
  }

  // juce::Synthesiser::findFreeVoice with stealing enabled, within the cap.
  FeltVoice* find_free_voice() {
    for (int i = 0; i < polyphony_; ++i) {
      if (!voices_[i].is_voice_active()) return &voices_[i];
    }
    return find_voice_to_steal();
  }

  // FeltSynth::findVoiceToSteal: the quietest tail voice, else the quietest
  // non-sostenuto voice, else voice 0.
  FeltVoice* find_voice_to_steal() {
    FeltVoice* quietest_tail = nullptr;
    FeltVoice* quietest_any = nullptr;
    float tail_energy = 1.0e9f, any_energy = 1.0e9f;

    for (int i = 0; i < polyphony_; ++i) {
      FeltVoice& voice = voices_[i];
      if (!voice.is_voice_active()) continue;
      const float e = voice.block_energy();
      if (voice.is_tail_voice()) {
        if (e < tail_energy) {
          tail_energy = e;
          quietest_tail = &voice;
        }
      } else if (!voice.is_sostenuto_pedal_down()) {
        if (e < any_energy) {
          any_energy = e;
          quietest_any = &voice;
        }
      }
    }

    if (quietest_tail != nullptr) return quietest_tail;
    if (quietest_any != nullptr) return quietest_any;
    return &voices_[0];
  }

  FeltVoice voices_[kMaxPolyphony];
  bool sustain_pedal_down_ = false;
  int polyphony_ = kMaxPolyphony;
};

}  // namespace livemix
