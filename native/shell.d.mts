import { type ChildProcess, type StdioOptions } from 'node:child_process'

/** The protocol version this package's client speaks. */
export declare const PLUGIN_HOST_PROTOCOL: number

/** Where the host's CMake project is, inside this package. */
export declare const pluginHostSourceDir: string

/** Where a build in `buildDir` puts the host binary on this platform. */
export declare function pluginHostBinaryPath(
  buildDir: string,
  options?: { config?: string; platform?: NodeJS.Platform },
): string

/** Where a build with `testPlugins` puts the two VST3 plug-ins the host's tests load. */
export declare function pluginHostTestPluginsDir(buildDir: string): string

/** Where a build with `testPlugins` puts the second Link peer the host's tests talk to. */
export declare function pluginHostLinkPeerPath(
  buildDir: string,
  options?: { platform?: NodeJS.Platform },
): string

export interface BuildPluginHostOptions {
  /** CMake's build directory; created when missing. */
  buildDir: string
  /** `Release` (default) or `Debug`. */
  config?: string
  /** A JUCE checkout at the pinned version; otherwise `$JUCE_DIR`, `~/JUCE` or a fetch. */
  juceDir?: string
  /** Also build the two plug-ins the host's own tests load, and their Link peer. */
  testPlugins?: boolean
  /**
   * Build Ableton Link and Link Audio into the host (default true). Link is
   * GPL v2 or later, and a host built with it is covered by that licence;
   * false leaves it out.
   */
  link?: boolean
  /** An Ableton Link checkout with its submodules; `$LINK_DIR` or the pinned release otherwise. */
  linkDir?: string
  /** Parallel compile jobs; CMake's default when absent. */
  jobs?: number
  /** Where CMake's output goes (default `'inherit'`). */
  stdio?: StdioOptions
}

/**
 * Configure and build the host with CMake (and Ninja where it is installed).
 * Returns the path of the binary.
 */
export declare function buildPluginHost(options: BuildPluginHostOptions): string

export interface StartPluginHostOptions {
  /** The host binary, e.g. from `pluginHostBinaryPath` or `buildPluginHost`. */
  binary: string
  /** Where the host keeps its plug-in list between runs. */
  dataDir?: string
  /** A fixed port; the host picks a free one by default. */
  port?: number
  /** The token pages must present; the host makes one by default. */
  token?: string
  /** Further arguments for the host. */
  args?: string[]
  env?: NodeJS.ProcessEnv
  /** Run the host under another program, e.g. `['xvfb-run', '-a']`. */
  wrapper?: string[]
  /** How long to wait for the host's ready line (default 15000 ms). */
  timeoutMs?: number
  /** Called when the host process ends, however it ends. */
  onExit?: (status: { code: number | null; signal: NodeJS.Signals | null }) => void
  /** Lines the host or its plug-ins write to standard error (and stray output). */
  onLog?: (line: string) => void
}

export interface RunningPluginHost {
  /** `ws://127.0.0.1:<port>`: with `token`, what `NativeHostClient.connect` takes. */
  url: string
  token: string
  port: number
  protocol: number
  pid: number | undefined
  process: ChildProcess
  /** Resolves when the host process has ended. */
  exit: Promise<{ code: number | null; signal: NodeJS.Signals | null }>
  /** End the host and wait for it. */
  stop(): Promise<void>
}

/** Start the host and wait for the line that says where it listens. */
export declare function startPluginHost(options: StartPluginHostOptions): Promise<RunningPluginHost>
