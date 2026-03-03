import type { ImageManager } from './image-manager'
import { createNodeFileSystem } from 'vscode-fs'

export type ResolvedImageManagerAdapter = Required<ImageManager.Adapter>
export type ResolvedImageManagerOptions = Omit<Required<ImageManager.Options>, 'imageBasePath' | 'deployedPath' | 'cachePath' | 'sdkPath' | 'configPath' | 'logPath' | 'emulatorPath'> & {
  adapter: ResolvedImageManagerAdapter
  imageBasePath: import('vscode-uri').URI
  deployedPath: import('vscode-uri').URI
  cachePath: import('vscode-uri').URI
  sdkPath: import('vscode-uri').URI
  defaultSdkPath: import('vscode-uri').URI | undefined
  configPath: import('vscode-uri').URI
  logPath: import('vscode-uri').URI
  emulatorPath: import('vscode-uri').URI
}

export namespace OptionsResolver {
  export async function resolveAdapter(adapter?: ImageManager.Adapter): Promise<ResolvedImageManagerAdapter> {
    const mergedAdapter: Omit<ResolvedImageManagerAdapter, 'isAxiosError'> & Partial<Pick<ResolvedImageManagerAdapter, 'isAxiosError'>> = {
      os: adapter?.os ?? await import('node:os'),
      process: adapter?.process ?? await import('node:process'),
      crypto: adapter?.crypto ?? await import('node:crypto'),
      child_process: adapter?.child_process ?? await import('node:child_process'),
      axios: adapter?.axios ?? (await import('axios')).default,
      fs: adapter?.fs ?? await createNodeFileSystem(),
      join: adapter?.join ?? (await import('vscode-uri')).Utils.joinPath,
      URI: adapter?.URI ?? (await import('vscode-uri')).URI,
      dirname: adapter?.dirname ?? (await import('vscode-uri')).Utils.dirname,
      basename: adapter?.basename ?? (await import('vscode-uri')).Utils.basename,
      toWeb: adapter?.toWeb ?? (await import('node:stream')).Readable.toWeb,
      fromWeb: adapter?.fromWeb ?? (await import('node:stream')).Readable.fromWeb,
      unzipper: adapter?.unzipper ?? await import('unzipper'),
    }

    if (adapter?.isAxiosError) {
      mergedAdapter.isAxiosError = adapter.isAxiosError
    }
    else {
      const axios = await import('axios')
      mergedAdapter.isAxiosError = (error: unknown) => axios.isAxiosError(error)
    }

    return mergedAdapter as ResolvedImageManagerAdapter
  }

  export async function resolveImageManagerOptions(options: ImageManager.Options): Promise<ResolvedImageManagerOptions> {
    const adapter = await resolveAdapter(options.adapter)
    const { os, join, process, URI, fs } = adapter

    function resolveDefaultImageBasePath(): import('vscode-uri').URI {
      switch (process.platform) {
        case 'win32':
          return typeof process.env.APPDATA === 'string' && process.env.APPDATA.length > 0
            ? join(URI.file(process.env.APPDATA), 'Local', 'Huawei', 'Sdk')
            : join(URI.file(os.homedir()), 'AppData', 'Local', 'Huawei', 'Sdk')
        case 'darwin':
          return join(URI.file(os.homedir()), 'Library', 'Huawei', 'Sdk')
        default:
          return join(URI.file(os.homedir()), '.Huawei', 'Sdk')
      }
    }

    function resolveDefaultDeployedPath(): import('vscode-uri').URI {
      switch (process.platform) {
        case 'win32':
          return typeof process.env.APPDATA === 'string' && process.env.APPDATA.length > 0
            ? join(URI.file(process.env.APPDATA), 'Local', 'Huawei', 'Emulator', 'deployed')
            : join(URI.file(os.homedir()), 'AppData', 'Local', 'Huawei', 'Emulator', 'deployed')
        default:
          return join(URI.file(os.homedir()), '.Huawei', 'Emulator', 'deployed')
      }
    }

    function resolveDefaultSdkPath(): import('vscode-uri').URI {
      switch (process.platform) {
        case 'darwin':
          return URI.file('/Applications/DevEco-Studio.app/Contents/sdk/default/openharmony')
        case 'win32':
          return URI.file('C:\\Program Files\\Huawei\\DevEco Studio\\sdk\\default\\openharmony')
        default:
          return join(URI.file(os.homedir()), '.Huawei', 'Sdk', 'default', 'openharmony')
      }
    }

    function resolveDefaultConfigPath(): import('vscode-uri').URI {
      switch (process.platform) {
        case 'darwin':
          return join(URI.file(os.homedir()), 'Library', 'Application Support', 'Huawei', 'DevEcoStudio6.0')
        case 'win32':
          return join(URI.file(process.env.APPDATA ?? os.homedir()), 'Roaming', 'Huawei', 'DevEcoStudio6.0')
        default:
          return join(URI.file(os.homedir()), '.Huawei', 'DevEcoStudio6.0')
      }
    }

    function resolveDefaultLogPath(): import('vscode-uri').URI {
      switch (process.platform) {
        case 'darwin':
          return join(URI.file(os.homedir()), 'Library', 'Logs', 'Huawei', 'DevEcoStudio6.0')
        case 'win32':
          return join(URI.file(process.env.APPDATA ?? os.homedir()), 'Local', 'Huawei', 'DevEcoStudio6.0', 'log')
        default:
          return join(URI.file(os.homedir()), '.Huawei', 'DevEcoStudio6.0', 'log')
      }
    }

    function resolveDefaultEmulatorPath(): import('vscode-uri').URI {
      switch (process.platform) {
        case 'darwin':
          return URI.file('/Applications/DevEco-Studio.app/Contents/tools/emulator')
        case 'win32':
          return URI.file('C:\\Program Files\\Huawei\\DevEco Studio\\tools\\emulator')
        default:
          return join(URI.file(os.homedir()), '.Huawei', 'Emulator')
      }
    }

    const imageBasePath = typeof options.imageBasePath === 'string'
      ? options.imageBasePath
        ? URI.file(options.imageBasePath)
        : resolveDefaultImageBasePath()
      : options.imageBasePath
        ? options.imageBasePath
        : resolveDefaultImageBasePath()
    const cachePath = typeof options.cachePath === 'string'
      ? options.cachePath
        ? URI.file(options.cachePath)
        : join(imageBasePath, 'cache')
      : options.cachePath
        ? options.cachePath
        : join(imageBasePath, 'cache')
    const deployedPath = typeof options.deployedPath === 'string'
      ? options.deployedPath
        ? URI.file(options.deployedPath)
        : resolveDefaultDeployedPath()
      : options.deployedPath
        ? options.deployedPath
        : resolveDefaultDeployedPath()
    const sdkPath = typeof options.sdkPath === 'string'
      ? options.sdkPath
        ? URI.file(options.sdkPath)
        : resolveDefaultSdkPath()
      : options.sdkPath
        ? options.sdkPath
        : resolveDefaultSdkPath()
    const configPath = typeof options.configPath === 'string'
      ? options.configPath
        ? URI.file(options.configPath)
        : resolveDefaultConfigPath()
      : options.configPath
        ? options.configPath
        : resolveDefaultConfigPath()
    const logPath = typeof options.logPath === 'string'
      ? options.logPath
        ? URI.file(options.logPath)
        : resolveDefaultLogPath()
      : options.logPath
        ? options.logPath
        : resolveDefaultLogPath()
    const emulatorPath = typeof options.emulatorPath === 'string'
      ? options.emulatorPath
        ? URI.file(options.emulatorPath)
        : resolveDefaultEmulatorPath()
      : options.emulatorPath
        ? options.emulatorPath
        : resolveDefaultEmulatorPath()

    return {
      imageBasePath,
      deployedPath,
      cachePath,
      sdkPath,
      defaultSdkPath: await fs.isDirectory(resolveDefaultSdkPath()).then(
        isDirectory => isDirectory ? resolveDefaultSdkPath() : undefined,
        () => undefined,
      ),
      configPath,
      logPath,
      emulatorPath,
      adapter,
    }
  }
}
