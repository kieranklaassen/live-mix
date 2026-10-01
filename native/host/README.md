# live-mix plug-in host

A small JUCE application that loads VST3 plug-ins (and Audio Units on macOS)
and processes audio for a page over a WebSocket on the loopback interface. A
desktop shell starts it next to its page; the page talks to it through
`@kieranklaassen/live-mix/native`. The guide and the protocol are in
[docs/native.md](../../docs/native.md).

## Build

```sh
pnpm host:build            # here: host and test plug-ins, into tmp/plugin-host
node native/host/build.mjs --out <dir> [--debug] [--test-plugins] [--juce <checkout>] [--jobs N]
```

`build.mjs` runs CMake (with Ninja when it is installed) and prints the path of
the binary on its last line:

| Platform | Binary                                                                                                   |
| -------- | -------------------------------------------------------------------------------------------------------- |
| macOS    | `<dir>/LiveMixPluginHost_artefacts/Release/live-mix-plugin-host.app/Contents/MacOS/live-mix-plugin-host` |
| Linux    | `<dir>/LiveMixPluginHost_artefacts/Release/live-mix-plugin-host`                                         |

You need:

- CMake 3.22 or newer and a C++20 compiler (Xcode's command line tools on
  macOS; GCC or Clang on Linux).
- JUCE 9.0.2. The build looks at `--juce` / `-DJUCE_DIR`, then `$JUCE_DIR`,
  then `~/JUCE`, and otherwise fetches the pinned tag itself (a slower first
  configure, nothing to install). The pin is in `cmake/LiveMixJUCE.cmake` and
  matches kkfonie's; a checkout at another version is refused unless
  `-DLIVE_MIX_ALLOW_JUCE_MISMATCH=ON`.
- On Linux, the development packages JUCE's GUI needs:

  ```sh
  sudo apt-get install -y build-essential cmake ninja-build pkg-config \
    libasound2-dev libfreetype-dev libfontconfig1-dev libx11-dev libxcomposite-dev \
    libxcursor-dev libxext-dev libxi-dev libxinerama-dev libxrandr-dev libxrender-dev \
    libgl1-mesa-dev libegl-dev
  ```

  and a display when it runs (`xvfb-run -a` on a machine without one).

On macOS the host is an `LSUIElement` application: no Dock icon and no menu
bar of its own; plug-in editor windows still show.

## Run

A shell normally starts it with `startPluginHost` from
`@kieranklaassen/live-mix/native/shell`. By hand:

```sh
live-mix-plugin-host [--port N] [--token T] [--data-dir DIR] [--stay-alive]
```

It prints one line of JSON when it is ready,
`{"ready":true,"protocol":1,"port":49152,"token":"…"}`, and exits when its
standard input closes, unless `--stay-alive`. Without `--port` it takes a free
one; without `--token` it makes one. `--data-dir` is where the plug-in list
(`plugins.xml`) is kept between runs.

## Test

```sh
pnpm host:build && pnpm test:host
```

`test/host.test.mjs` starts the built binary and speaks the protocol to it:
hello, a refused token, scan, load, audio through the test gain plug-in
(sample-exact against its 64-sample delay), state, MIDI into the test synth,
the editor window, unloading, shutdown. On macOS it also loads one of Apple's
own Audio Units. `LIVE_MIX_PLUGIN_HOST_BUILD` names another build directory.

`test/plugins/` holds the two plug-ins the tests load, built as VST3 with
`--test-plugins`: **LiveMix Test Gain** (gain, a Normal/Invert/Mute mode, 64
samples of reported latency) and **LiveMix Test Sine** (an instrument: a sine
per held note, no envelope). They are test fixtures, not something to ship.

## Source

| File                  | What it is                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------- |
| `Source/Main.cpp`     | Arguments, the ready line, shutdown when the parent goes                                    |
| `Source/WebSocket.*`  | A WebSocket server on `juce::StreamingSocket`: handshake, frames, one thread per connection |
| `Source/HostServer.*` | The control protocol, the plug-in list and scanning, the audio connections                  |
| `Source/PluginSlot.*` | One loaded plug-in: processing, parameters, state, MIDI, its editor window                  |
| `Source/Sha1.h`       | SHA-1 for the WebSocket handshake                                                           |

## Licence

The sources here are MIT like the rest of the repository. A binary built from
them links JUCE, and falls under JUCE's terms: the AGPLv3, or the JUCE licence
you hold. See [docs/native.md](../../docs/native.md#licensing).
