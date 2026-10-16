// A lab made for the tests of site/labs/lab.h (tests/unit/lab-header.test.ts), and built only by
// them. It declares one control and one tap more than a lab may, and it draws the picture of a
// tone that is still sounding where its samples end.

#include <cmath>

#include "../../../../labs/lab.h"

namespace {

// Thirty-three controls: one past kMaxControls.
#define CONTROL(n) lab::Control control_##n{"c" #n, "Control " #n, "", 0.0f, 1.0f, 0.0f};
CONTROL(1)
CONTROL(2)
CONTROL(3)
CONTROL(4)
CONTROL(5)
CONTROL(6)
CONTROL(7)
CONTROL(8)
CONTROL(9)
CONTROL(10)
CONTROL(11)
CONTROL(12)
CONTROL(13)
CONTROL(14)
CONTROL(15)
CONTROL(16)
CONTROL(17)
CONTROL(18)
CONTROL(19)
CONTROL(20)
CONTROL(21)
CONTROL(22)
CONTROL(23)
CONTROL(24)
CONTROL(25)
CONTROL(26)
CONTROL(27)
CONTROL(28)
CONTROL(29)
CONTROL(30)
CONTROL(31)
CONTROL(32)
CONTROL(33)

// The picture, and sixty-four taps after it: one past kMaxTaps.
lab::Tap picture{"picture", "A tone to its end", lab::kFrames, lab::kLesson};
#define TAP(n) lab::Tap tap_##n{"t" #n, "Tap " #n, lab::kCurve, lab::kLesson};
TAP(1)
TAP(2)
TAP(3)
TAP(4)
TAP(5)
TAP(6)
TAP(7)
TAP(8)
TAP(9)
TAP(10)
TAP(11)
TAP(12)
TAP(13)
TAP(14)
TAP(15)
TAP(16)
TAP(17)
TAP(18)
TAP(19)
TAP(20)
TAP(21)
TAP(22)
TAP(23)
TAP(24)
TAP(25)
TAP(26)
TAP(27)
TAP(28)
TAP(29)
TAP(30)
TAP(31)
TAP(32)
TAP(33)
TAP(34)
TAP(35)
TAP(36)
TAP(37)
TAP(38)
TAP(39)
TAP(40)
TAP(41)
TAP(42)
TAP(43)
TAP(44)
TAP(45)
TAP(46)
TAP(47)
TAP(48)
TAP(49)
TAP(50)
TAP(51)
TAP(52)
TAP(53)
TAP(54)
TAP(55)
TAP(56)
TAP(57)
TAP(58)
TAP(59)
TAP(60)
TAP(61)
TAP(62)
TAP(63)
TAP(64)

// 1,500 Hz is the thirty-second row of the picture to the hertz (32 * 48000 / 1024), at full
// scale: a row that reads 0 dB, with nothing in the rows far from it.
constexpr int kToneFrames = 6000;
constexpr int kColumns = 50;
float g_tone[kToneFrames];

}  // namespace

void lab_setup() {
  for (int i = 0; i < kToneFrames; ++i) {
    g_tone[i] = static_cast<float>(std::sin(2.0 * lab::kPi * 1500.0 * i / lab::kSampleRate));
  }
}

void lab_render(int frames) {
  (void)frames;
  // Not a loop: the tone stops where its samples do.
  lab::spectrogram_tap(picture, g_tone, kToneFrames, kColumns, false);
}
