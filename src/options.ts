export interface ImageManagerOptions {
  /**
   * The base path to store the images.
   */
  imageBasePath?: string
  /**
   * The path to store the deployed images.
   */
  deployedPath?: string
  /**
   * The base path to store the downloaded images zip files.
   *
   * @default `imageBasePath/cache`
   */
  cachePath?: string
  /**
   * The path to store the HarmonyOS SDK.
   *
   * - In macOS, it will be `/Applications/DevEco-Studio.app/Contents/sdk/default/openharmony` by default;
   * - In Windows, it will be `C:\Program Files\Huawei\DevEco Studio\sdk\default\openharmony` by default;
   * - In other platforms, it will be `~/.huawei/Sdk/default/openharmony` by default.
   */
  sdkPath?: string
  /**
   * The path to store the HarmonyOS configuration files.
   *
   * - In macOS, it will be `~/Library/Application Support/Huawei/DevEcoStudio6.0` by default;
   * - In Windows, it will be `%APPDATA%\Roaming\Huawei\DevEcoStudio6.0` by default;
   * - In other platforms, it will be `~/.huawei/DevEcoStudio6.0` by default.
   */
  configPath?: string
  /**
   * The path to store the HarmonyOS log files.
   *
   * - In macOS, it will be `~/Library/Logs/Huawei/DevEcoStudio6.0` by default;
   * - In Windows, it will be `%APPDATA%\Local\Huawei\DevEcoStudio6.0\log` by default;
   * - In other platforms, it will be `~/.huawei/DevEcoStudio6.0/log` by default.
   */
  logPath?: string
  /**
   * The folder to store the emulator executable files.
   *
   * It must contain the `Emulator` (In windows, it will be `Emulator.exe`) executable file.
   *
   * - In macOS, it will be `/Applications/DevEco-Studio.app/Contents/tools/emulator`;
   * - In Windows, it will be `C:\Program Files\Huawei\DevEco Studio\tools\emulator`;
   * - In other platforms, it will be `~/.huawei/Emulator`.
   */
  emulatorPath?: string
  os?: typeof import('node:os')
  fs?: typeof import('node:fs')
  path?: typeof import('node:path')
  process?: typeof import('node:process')
  crypto?: typeof import('node:crypto')
  child_process?: typeof import('node:child_process')
}

export type ResolvedImageManagerOptions = Required<ImageManagerOptions>

export async function resolveImageManagerOptions(options: ImageManagerOptions): Promise<ResolvedImageManagerOptions> {
  const os = options.os ?? await import('node:os')
  const path = options.path ?? await import('node:path')
  const process = options.process ?? await import('node:process')

  function resolveDefaultImageBasePath(): string {
    switch (process.platform) {
      case 'win32':
        return typeof process.env.APPDATA === 'string' && process.env.APPDATA.length > 0
          ? path.resolve(process.env.APPDATA, 'Local', 'Huawei', 'Sdk')
          : path.resolve(os.homedir(), 'AppData', 'Local', 'Huawei', 'Sdk')
      case 'darwin':
        return path.resolve(os.homedir(), 'Library', 'Huawei', 'Sdk')
      default:
        return path.resolve(os.homedir(), '.huawei', 'Sdk')
    }
  }

  function resolveDefaultDeployedPath(): string {
    switch (process.platform) {
      case 'win32':
        return typeof process.env.APPDATA === 'string' && process.env.APPDATA.length > 0
          ? path.resolve(process.env.APPDATA, 'Local', 'Huawei', 'Emulator', 'deployed')
          : path.resolve(os.homedir(), 'AppData', 'Local', 'Huawei', 'Emulator', 'deployed')
      default:
        return path.resolve(os.homedir(), '.huawei', 'Emulator', 'deployed')
    }
  }

  function resolveDefaultSdkPath(): string {
    switch (process.platform) {
      case 'darwin':
        return '/Applications/DevEco-Studio.app/Contents/sdk/default/openharmony'
      case 'win32':
        return 'C:\\Program Files\\Huawei\\DevEco Studio\\sdk\\default\\openharmony'
      default:
        return path.resolve(os.homedir(), '.huawei', 'Sdk', 'default', 'openharmony')
    }
  }

  function resolveDefaultConfigPath(): string {
    switch (process.platform) {
      case 'darwin':
        return path.resolve(os.homedir(), 'Library', 'Application Support', 'Huawei', 'DevEcoStudio6.0')
      case 'win32':
        return path.resolve(process.env.APPDATA ?? os.homedir(), 'Roaming', 'Huawei', 'DevEcoStudio6.0')
      default:
        return path.resolve(os.homedir(), '.huawei', 'DevEcoStudio6.0')
    }
  }

  function resolveDefaultLogPath(): string {
    switch (process.platform) {
      case 'darwin':
        return path.resolve(os.homedir(), 'Library', 'Logs', 'Huawei', 'DevEcoStudio6.0')
      case 'win32':
        return path.resolve(process.env.APPDATA ?? os.homedir(), 'Local', 'Huawei', 'DevEcoStudio6.0', 'log')
      default:
        return path.resolve(os.homedir(), '.huawei', 'DevEcoStudio6.0', 'log')
    }
  }

  function resolveDefaultEmulatorPath(): string {
    switch (process.platform) {
      case 'darwin':
        return '/Applications/DevEco-Studio.app/Contents/tools/emulator/Emulator'
      case 'win32':
        return path.resolve('C:', 'Program Files', 'Huawei', 'DevEco Studio', 'tools', 'emulator', 'Emulator.exe')
      default:
        return path.resolve(os.homedir(), '.huawei', 'Emulator')
    }
  }

  const imageBasePath = options.imageBasePath || resolveDefaultImageBasePath()
  const cachePath = options.cachePath || path.resolve(imageBasePath, 'cache')
  const deployedPath = options.deployedPath || resolveDefaultDeployedPath()
  const sdkPath = options.sdkPath || resolveDefaultSdkPath()
  const configPath = options.configPath || resolveDefaultConfigPath()
  const logPath = options.logPath || resolveDefaultLogPath()
  const emulatorPath = options.emulatorPath || resolveDefaultEmulatorPath()

  return {
    imageBasePath,
    deployedPath,
    cachePath,
    sdkPath,
    configPath,
    logPath,
    emulatorPath,
    path,
    os,
    fs: options.fs ?? await import('node:fs'),
    process: options.process ?? await import('node:process'),
    crypto: options.crypto ?? await import('node:crypto'),
    child_process: options.child_process ?? await import('node:child_process'),
  }
}
