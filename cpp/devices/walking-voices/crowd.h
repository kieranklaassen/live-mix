#pragma once

// Who goes where. The held notes are seats with a number of places each, and
// the crowd is dealt out to them so that all the steps taken add up to the
// least there can be. On a line that has a simple answer: stand everybody in
// order of where they are now, fill the seats from the bottom, and no other
// dealing walks less in all.

#include "../../kit/kit.h"

namespace livemix {
namespace walking_dsp {

constexpr int kSingers = 36;
constexpr int kNotes = 12;
constexpr int kSeats = kNotes + 1;
// Nobody is left alone on a note.
constexpr int kCover = 2;

struct Seat {
  float pitch = 60.0f;  // semitones, as a key number
  float weight = 1.0f;
  int note = 0;
  bool own = true;  // the note itself; false for an octave beside it
  int quota = 0;
  float loud = 1.0f;  // how loud each of them sings there
};

// An octave beside a note.
inline Seat octave_seat(int note, float pitch, float weight) {
  Seat seat;
  seat.pitch = pitch;
  seat.weight = weight;
  seat.note = note;
  seat.own = false;
  return seat;
}

// The seats of `held` notes in order of pitch, weighted towards the bottom or
// the top, with an octave under or over the last of them as `low` asks.
inline int lay(const float* pitches, const int* slots, int held, float low, Seat* seats) {
  int count = 0;
  float whole = 0.0f;
  for (int n = 0; n < held; ++n) {
    const float rank = held > 1 ? static_cast<float>(n) / static_cast<float>(held - 1) - 0.5f : 0.0f;
    Seat& seat = seats[count++];
    seat = Seat();
    seat.pitch = pitches[n];
    seat.weight = std::exp2(-5.0f * low * rank);
    seat.loud = std::exp2(-1.8f * low * (low < 0.0f ? -low : low) * rank);
    seat.note = slots[n];
    whole += seat.weight;
  }
  const float under = pitches[0] - 12.0f, over = pitches[held - 1] + 12.0f;
  if (low > 0.05f && under > 26.0f) seats[count++] = octave_seat(slots[0], under, whole * low * 0.9f);
  if (low < -0.05f && over < 104.0f) seats[count++] = octave_seat(slots[held - 1], over, whole * -low * 0.9f);
  for (int t = count - 1; t > 0 && seats[t - 1].pitch > seats[t].pitch; --t) {
    const Seat swap = seats[t];
    seats[t] = seats[t - 1];
    seats[t - 1] = swap;
  }
  return count;
}

// Deals `people` places over `count` seats: two to each note's own seat, the
// rest by weight, the largest remainders first (the lower seat on a tie).
inline void deal(Seat* seats, int count, int people) {
  int left = people;
  float whole = 0.0f;
  for (int s = 0; s < count; ++s) {
    seats[s].quota = seats[s].own ? kCover : 0;
    left -= seats[s].quota;
    whole += seats[s].weight;
  }
  if (left <= 0 || !(whole > 0.0f)) return;
  // What each should have had of all the places, less what it has.
  float due[kSeats];
  float owed = 0.0f;
  for (int s = 0; s < count; ++s) {
    due[s] = kit::max(0.0f, seats[s].weight / whole * static_cast<float>(people) - static_cast<float>(seats[s].quota));
    owed += due[s];
  }
  const float scale = owed > 1.0e-6f ? static_cast<float>(left) / owed : 0.0f;
  int given = 0;
  for (int s = 0; s < count; ++s) {
    due[s] *= scale;
    const int whole_places = static_cast<int>(due[s] + 1.0e-4f);
    seats[s].quota += whole_places;
    due[s] -= static_cast<float>(whole_places);
    given += whole_places;
  }
  while (given < left) {
    int best = 0;
    for (int s = 1; s < count; ++s) {
      if (due[s] > due[best] + 1.0e-5f) best = s;
    }
    due[best] -= 1.0f;
    ++seats[best].quota;
    ++given;
  }
}

// One power for the whole crowd, however the seats are weighted.
inline void even_out(Seat* seats, int count, int people) {
  float power = 0.0f;
  for (int s = 0; s < count; ++s) power += static_cast<float>(seats[s].quota) * seats[s].loud * seats[s].loud;
  const float gain = power > 1.0e-6f ? std::sqrt(static_cast<float>(people) / power) : 1.0f;
  for (int s = 0; s < count; ++s) seats[s].loud *= gain;
}

// Gives each of `people` singers a seat. `place` is where each one is,
// `pinned` the seat one must keep or -1; the seats are in order of pitch.
// Ties go by the singers' own order.
inline void assign(const float* place, const int* pinned, int people, const Seat* seats, int count, int* seat_of) {
  int room[kSeats];
  for (int s = 0; s < count; ++s) room[s] = seats[s].quota;
  int order[kSingers];
  int loose = 0;
  for (int i = 0; i < people; ++i) {
    seat_of[i] = pinned[i];
    if (pinned[i] >= 0) {
      --room[pinned[i]];
      continue;
    }
    int at = loose++;
    while (at > 0 && place[order[at - 1]] > place[i]) {
      order[at] = order[at - 1];
      --at;
    }
    order[at] = i;
  }
  int seat = 0;
  for (int i = 0; i < loose; ++i) {
    while (seat < count - 1 && room[seat] <= 0) ++seat;
    seat_of[order[i]] = seat;
    --room[seat];
  }
}

// How far a key's name is from the pure interval it stands for, in semitones
// over the bass.
inline float pure_offset(float interval) {
  static constexpr float kPure[12] = {0.0f,     0.1173f, 0.0391f, 0.1564f,  -0.1369f, -0.0196f,
                                      -0.0978f, 0.0196f, 0.1369f, -0.1564f, -0.0391f, -0.1173f};
  const float nearest = std::floor(interval + 0.5f);
  const float off = interval - nearest;
  if (off > 0.35f || off < -0.35f) return 0.0f;
  int name = static_cast<int>(nearest) % 12;
  if (name < 0) name += 12;
  return nearest + kPure[name] - interval;
}

}  // namespace walking_dsp
}  // namespace livemix
