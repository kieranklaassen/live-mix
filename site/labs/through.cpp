// The lab of a page that has no technique to take apart: a device's page,
// where the only stage is the loop itself and the device on the bench does
// the rest. One tap, the source as it came in.

#include "lab.h"

namespace {
lab::Tap in_tap{"in", "The loop, dry", lab::kAudio, lab::kSource, 2};
}  // namespace

void lab_setup() {}

void lab_render(int frames) {
  (void)frames;
  const int total = lab::total();
  for (int i = 0; i < total; ++i) in_tap.put(i, lab::in_at(0, i), lab::in_at(1, i));
}
