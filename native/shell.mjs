// What a desktop shell (Electron, Tauri's sidecar, a test) needs around the
// plug-in host: build it, find the binary, start it and stop it. Plain Node,
// no dependencies; `@kieranklaassen/live-mix/native/shell` in a main process.
//
//   const host = await startPluginHost({ binary, dataDir })
//   // hand { url: host.url, token: host.token } to the page (see findNativeHost)
//   await host.stop()

import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { createInterface } from 'node:readline'
import { fileURLToPath } from 'node:url'

/** The protocol version this package's client speaks. */
export const PLUGIN_HOST_PROTOCOL = 1

/** Where the host's CMake project is, inside this package. */
export const pluginHostSourceDir = join(dirname(fileURLToPath(import.meta.url)), 'host')

const PRODUCT = 'live-mix-plugin-host'

/** Where a build in `buildDir` puts the host binary on this platform. */
export function pluginHostBinaryPath(
  buildDir,
  { config = 'Release', platform = process.platform } = {},
) {
  const artefacts = join(buildDir, 'LiveMixPluginHost_artefacts', config)
  if (platform === 'darwin') return join(artefacts, `${PRODUCT}.app`, 'Contents', 'MacOS', PRODUCT)
  if (platform === 'win32') return join(artefacts, `${PRODUCT}.exe`)
  return join(artefacts, PRODUCT)
}

/** Where a build with `testPlugins` puts the two VST3 plug-ins the host's tests load. */
export function pluginHostTestPluginsDir(buildDir) {
  return join(buildDir, 'test', 'plugins')
}

/** Where a build with `testPlugins` puts the second Link peer the host's tests talk to. */
export function pluginHostLinkPeerPath(buildDir, { platform = process.platform } = {}) {
  return join(buildDir, 'test', 'link', `live-mix-link-peer${platform === 'win32' ? '.exe' : ''}`)
}

function hasCommand(command) {
  const probe = spawnSync(command, ['--version'], { stdio: 'ignore' })
  return !probe.error && probe.status === 0
}

function run(command, args, stdio) {
  const result = spawnSync(command, args, { stdio })
  if (result.error) throw new Error(`live-mix: could not run ${command}: ${result.error.message}`)
  if (result.status !== 0) {
    throw new Error(`live-mix: ${command} ${args.join(' ')} failed with status ${result.status}`)
  }
}

/**
 * Configure and build the host with CMake (and Ninja where it is installed).
 * Needs a C++20 compiler; JUCE comes from `juceDir`, `$JUCE_DIR`, `~/JUCE` or
 * is fetched at the pinned version; Ableton Link comes from `linkDir`,
 * `$LINK_DIR` or is fetched too, unless `link` is false. Returns the path of
 * the binary.
 */
export function buildPluginHost({
  buildDir,
  config = 'Release',
  juceDir,
  testPlugins = false,
  link = true,
  linkDir,
  jobs,
  stdio = 'inherit',
} = {}) {
  if (!buildDir) throw new Error('live-mix: buildPluginHost needs a buildDir')
  if (!hasCommand('cmake')) {
    throw new Error('live-mix: building the plug-in host needs CMake 3.22 or newer on the PATH')
  }
  const configure = ['-S', pluginHostSourceDir, '-B', buildDir, `-DCMAKE_BUILD_TYPE=${config}`]
  if (!existsSync(join(buildDir, 'CMakeCache.txt')) && hasCommand('ninja'))
    configure.push('-G', 'Ninja')
  if (juceDir) configure.push(`-DJUCE_DIR=${juceDir}`)
  configure.push(`-DLIVE_MIX_HOST_BUILD_TEST_PLUGINS=${testPlugins ? 'ON' : 'OFF'}`)
  configure.push(`-DLIVE_MIX_HOST_LINK=${link ? 'ON' : 'OFF'}`)
  if (link && linkDir) configure.push(`-DLINK_DIR=${linkDir}`)
  run('cmake', configure, stdio)

  const build = ['--build', buildDir, '--config', config, '--target', 'LiveMixPluginHost']
  if (testPlugins) build.push('LiveMixTestPlugins')
  if (jobs) build.push('--parallel', String(jobs))
  else build.push('--parallel')
  run('cmake', build, stdio)

  const binary = pluginHostBinaryPath(buildDir, { config })
  if (!existsSync(binary)) throw new Error(`live-mix: the build finished without ${binary}`)
  return binary
}

/**
 * Start the host and wait for the line that says where it listens. The host
 * exits by itself when this process does (it watches its standard input), and
 * `stop()` ends it sooner.
 *
 * `wrapper` runs the host under another program, e.g. `['xvfb-run', '-a']` on
 * a Linux machine without a display: plug-in editors need one.
 */
export function startPluginHost({
  binary,
  dataDir,
  port,
  token,
  args = [],
  env,
  wrapper = [],
  timeoutMs = 15000,
  onExit,
  onLog,
} = {}) {
  if (!binary) return Promise.reject(new Error('live-mix: startPluginHost needs the host binary'))
  if (!existsSync(binary)) {
    return Promise.reject(new Error(`live-mix: no plug-in host at ${binary}; build it first`))
  }
  const hostArgs = [...args]
  if (port) hostArgs.push('--port', String(port))
  if (token) hostArgs.push('--token', token)
  if (dataDir) hostArgs.push('--data-dir', dataDir)
  const [command, ...leading] = [...wrapper, binary]

  return new Promise((resolve, reject) => {
    const child = spawn(command, [...leading, ...hostArgs], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: env ?? process.env,
    })
    let settled = false
    let exited = false
    const exit = new Promise((done) => {
      child.once('exit', (code, signal) => {
        exited = true
        done({ code, signal })
      })
    })

    const fail = (error) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      child.kill()
      reject(error)
    }
    const timer = setTimeout(
      () =>
        fail(new Error(`live-mix: the plug-in host did not report ready within ${timeoutMs} ms`)),
      timeoutMs,
    )

    child.once('error', (error) =>
      fail(new Error(`live-mix: could not start ${command}: ${error.message}`)),
    )
    void exit.then(({ code, signal }) => {
      fail(new Error(`live-mix: the plug-in host exited before it was ready (${signal ?? code})`))
      onExit?.({ code, signal })
    })
    createInterface({ input: child.stderr }).on('line', (line) => onLog?.(line))

    const stop = async () => {
      if (exited) return
      // Closing its input is the polite way; the kill is for a host stuck in a plug-in.
      child.stdin.end()
      const forced = setTimeout(() => child.kill('SIGKILL'), 3000)
      await exit
      clearTimeout(forced)
    }

    createInterface({ input: child.stdout }).on('line', (line) => {
      if (settled) {
        onLog?.(line)
        return
      }
      let message
      try {
        message = JSON.parse(line)
      } catch {
        // A plug-in or a wrapper wrote to our output before the host did.
        onLog?.(line)
        return
      }
      if (message?.ready !== true) return
      if (message.protocol !== PLUGIN_HOST_PROTOCOL) {
        fail(
          new Error(
            `live-mix: the plug-in host speaks protocol ${message.protocol}, this package ${PLUGIN_HOST_PROTOCOL}; rebuild the host`,
          ),
        )
        return
      }
      settled = true
      clearTimeout(timer)
      resolve({
        url: `ws://127.0.0.1:${message.port}`,
        token: message.token,
        port: message.port,
        protocol: message.protocol,
        pid: child.pid,
        process: child,
        exit,
        stop,
      })
    })
  })
}
