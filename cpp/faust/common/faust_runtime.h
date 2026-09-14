#pragma once

// Allocation-free stand-ins for the Faust architecture classes (`dsp`, `UI`,
// `Meta`) that generated code expects. scripts/build-faust.sh emits the
// devices with `-nvi -scn FaustDsp -ns livemix::faust`, so nothing here is
// virtual: the DSP class is a plain value member and unused methods such as
// clone() fall away at link time.

#ifndef FAUSTFLOAT
#define FAUSTFLOAT float
#endif

namespace livemix::faust {

// Super class of every generated DSP; carries no state and no vtable.
struct FaustDsp {};

// Metadata sink. Library credits and compile options are visible in the
// generated source; nothing needs them at runtime.
struct Meta {
  void declare(const char* /*key*/, const char* /*value*/) {}
};

// Soundfile primitives are not used by live-mix devices; the type only has to
// exist for the UI protocol below to be complete.
struct Soundfile;

// One active widget of a device, as declared by its buildUserInterface().
struct FaustParam {
  const char* label = "";
  FAUSTFLOAT* zone = nullptr;
  FAUSTFLOAT init = 0.0f;
  FAUSTFLOAT min = 0.0f;
  FAUSTFLOAT max = 1.0f;
};

// Faust UI visitor that records the active widgets in declaration order. The
// position in that order is the `device_set_param` id, the same numbering
// scripts/faust-params-to-ts.mjs derives from the compiler's JSON for the
// TypeScript param table, so both sides read one source: the `.dsp`.
class UI {
 public:
  static constexpr int kMaxParams = 32;

  int count() const { return count_; }
  const FaustParam& param(int index) const { return params_[index]; }

  // Layout and metadata carry no runtime meaning here.
  void openTabBox(const char* /*label*/) {}
  void openHorizontalBox(const char* /*label*/) {}
  void openVerticalBox(const char* /*label*/) {}
  void closeBox() {}
  void declare(FAUSTFLOAT* /*zone*/, const char* /*key*/, const char* /*value*/) {}

  void addButton(const char* label, FAUSTFLOAT* zone) { add(label, zone, 0.0f, 0.0f, 1.0f); }
  void addCheckButton(const char* label, FAUSTFLOAT* zone) {
    add(label, zone, 0.0f, 0.0f, 1.0f);
  }
  void addVerticalSlider(const char* label, FAUSTFLOAT* zone, FAUSTFLOAT init,
                         FAUSTFLOAT min, FAUSTFLOAT max, FAUSTFLOAT /*step*/) {
    add(label, zone, init, min, max);
  }
  void addHorizontalSlider(const char* label, FAUSTFLOAT* zone, FAUSTFLOAT init,
                           FAUSTFLOAT min, FAUSTFLOAT max, FAUSTFLOAT /*step*/) {
    add(label, zone, init, min, max);
  }
  void addNumEntry(const char* label, FAUSTFLOAT* zone, FAUSTFLOAT init,
                   FAUSTFLOAT min, FAUSTFLOAT max, FAUSTFLOAT /*step*/) {
    add(label, zone, init, min, max);
  }

  // Passive widgets and soundfiles are not parameters.
  void addHorizontalBargraph(const char* /*label*/, FAUSTFLOAT* /*zone*/,
                             FAUSTFLOAT /*min*/, FAUSTFLOAT /*max*/) {}
  void addVerticalBargraph(const char* /*label*/, FAUSTFLOAT* /*zone*/,
                           FAUSTFLOAT /*min*/, FAUSTFLOAT /*max*/) {}
  void addSoundfile(const char* /*label*/, const char* /*filename*/,
                    Soundfile** /*sf_zone*/) {}

 private:
  void add(const char* label, FAUSTFLOAT* zone, FAUSTFLOAT init, FAUSTFLOAT min,
           FAUSTFLOAT max) {
    if (count_ >= kMaxParams) return;
    params_[count_] = FaustParam{label, zone, init, min, max};
    ++count_;
  }

  FaustParam params_[kMaxParams] = {};
  int count_ = 0;
};

}  // namespace livemix::faust
