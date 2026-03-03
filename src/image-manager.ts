import type { FileSystem } from 'vscode-fs'
import type { EmulatorFile, ProductConfigFile } from './configs'
import type { ListsFile, ListsFileItem } from './configs/lists'
import type { Device } from './devices/device'
import type { LocalImage } from './images/local-image'
import type { RemoteImage } from './images/remote-image'
import type { ResolvedImageManagerOptions } from './options'
import type { BaseSerializable, Serializable } from './types'
import { RelativePattern } from 'vscode-fs'
import { ConfigIniFileImpl } from './configs/config-ini/config-ini'
import { EmulatorFileImpl } from './configs/emulator/emulator'
import { ListsFileImpl } from './configs/lists/lists'
import { NamedIniFileImpl } from './configs/named-ini/named-ini'
import { ProductConfigFileImpl } from './configs/product/product'
import { DeviceImpl } from './devices/device'
import { LocalImageImpl } from './images/local-image'
import { RemoteImageImpl } from './images/remote-image'
import { OptionsResolver } from './options'
import { ScreenPresetImpl } from './screens/screen-preset'
import { SDKList } from './sdk-list'
import { DeviceTypeConverter } from './utils/devicetype-converter'

export namespace ImageManager {
  export interface Adapter {
    os?: Pick<typeof import('node:os'), 'homedir'>
    fs?: FileSystem
    join?: typeof import('vscode-uri').Utils.joinPath
    URI?: typeof import('vscode-uri').URI
    dirname?: typeof import('vscode-uri').Utils.dirname
    basename?: typeof import('vscode-uri').Utils.basename
    toWeb?: typeof import('node:stream').Readable.toWeb
    fromWeb?: typeof import('node:stream').Readable.fromWeb
    process?: Pick<typeof import('node:process'), 'platform' | 'env' | 'arch'>
    crypto?: Pick<typeof import('node:crypto'), 'createHash' | 'randomUUID'>
    child_process?: Pick<typeof import('node:child_process'), 'spawn'>
    axios?: import('axios').AxiosInstance
    isAxiosError?(error: unknown): error is import('axios').AxiosError
    unzipper?: typeof import('unzipper')
  }

  export interface Options {
    /**
     * The base path to store the images.
     */
    imageBasePath?: string | import('vscode-uri').URI
    /**
     * The path to store the deployed images.
     */
    deployedPath?: string | import('vscode-uri').URI
    /**
     * The base path to store the downloaded images zip files.
     *
     * @default `imageBasePath/cache`
     */
    cachePath?: string | import('vscode-uri').URI
    /**
     * The path to store the HarmonyOS SDK.
     *
     * - In macOS, it will be `/Applications/DevEco-Studio.app/Contents/sdk/default/openharmony` by default;
     * - In Windows, it will be `C:\Program Files\Huawei\DevEco Studio\sdk\default\openharmony` by default;
     * - In other platforms, it will be `~/.Huawei/Sdk/default/openharmony` by default.
     */
    sdkPath?: string | import('vscode-uri').URI
    /**
     * The path to store the HarmonyOS configuration files.
     *
     * - In macOS, it will be `~/Library/Application Support/Huawei/DevEcoStudio6.0` by default;
     * - In Windows, it will be `%APPDATA%\Roaming\Huawei\DevEcoStudio6.0` by default;
     * - In other platforms, it will be `~/.Huawei/DevEcoStudio6.0` by default.
     */
    configPath?: string | import('vscode-uri').URI
    /**
     * The path to store the HarmonyOS log files.
     *
     * - In macOS, it will be `~/Library/Logs/Huawei/DevEcoStudio6.0` by default;
     * - In Windows, it will be `%APPDATA%\Local\Huawei\DevEcoStudio6.0\log` by default;
     * - In other platforms, it will be `~/.Huawei/DevEcoStudio6.0/log` by default.
     */
    logPath?: string | import('vscode-uri').URI
    /**
     * The folder to store the emulator executable files.
     *
     * It must contain the `Emulator` (In windows, it will be `Emulator.exe`) executable file.
     *
     * - In macOS, it will be `/Applications/DevEco-Studio.app/Contents/tools/emulator`;
     * - In Windows, it will be `C:\Program Files\Huawei\DevEco Studio\tools\emulator`;
     * - In other platforms, it will be `~/.Huawei/Emulator`.
     */
    emulatorPath?: string | import('vscode-uri').URI
    /**
     * The platform-specific adapters.
     */
    adapter?: ImageManager.Adapter
  }

  export interface Serializable extends BaseSerializable<ImageManager> {}
}

export interface ImageManager extends Serializable<ImageManager.Serializable> {
  /**
   * Get the resolved image manager options.
   */
  getOptions(): ResolvedImageManagerOptions
  /**
   * Get the operating system of the current image manager.
   */
  getOperatingSystem(): SDKList.OS
  /**
   * Get the architecture of the current image manager.
   */
  getArch(): SDKList.Arch
  /**
   * Get local images.
   */
  getLocalImages(): Promise<LocalImage[]>
  /**
   * Get remote images.
   *
   * @param supportVersion - The support version of the SDK. If not provided, the default value is `6.0-hos-single-9`.
   */
  getRemoteImages(supportVersion?: string): Promise<RemoteImage[] | SDKList.SDKListError>
  /**
   * Get downloaded remote images.
   *
   * @param supportVersion - The support version of the SDK. If not provided, the default value is `6.0-hos-single-9`.
   */
  getDownloadedRemoteImages(supportVersion?: string): Promise<RemoteImage[] | SDKList.SDKListError>
  /**
   * Check if the emulator is compatible with current image manager.
   */
  isCompatible(): Promise<boolean>
  /**
   * Get the `lists.json` file path.
   */
  getListsFilePath(): import('vscode-uri').URI
  /**
   * Read the `lists.json` file.
   *
   * @returns The `lists.json` file.
   */
  readListsFile(): Promise<ListsFile>
  /**
   * Read the `emulator.json` file.
   *
   * @returns The `emulator.json` file.
   */
  readEmulatorFile(): Promise<EmulatorFile>
  /**
   * Read the `product-config.json` file.
   *
   * @returns The `product-config.json` file.
   */
  readProductConfigFile(): Promise<ProductConfigFile>
  /**
   * Get deployed devices.
   */
  getDeployedDevices(): Promise<Device[]>
}

class ImageManagerImpl implements ImageManager {
  constructor(private readonly options: ResolvedImageManagerOptions) {}

  getOptions(): ResolvedImageManagerOptions {
    return this.options
  }

  getOperatingSystem(): SDKList.OS {
    switch (this.options.adapter.process.platform) {
      case 'win32':
        return 'windows'
      case 'darwin':
        return 'mac'
      default:
        return 'linux'
    }
  }

  getArch(): SDKList.Arch {
    if (this.options.adapter.process.arch.toLowerCase().includes('arm')) return 'arm64'
    return 'x86'
  }

  private async requestSdkList(supportVersion: string = '6.0-hos-single-9'): Promise<SDKList.Result> {
    const { adapter: { axios } } = this.getOptions()

    try {
      return await axios.post('https://devecostudio-drcn.deveco.dbankcloud.com/sdkmanager/v8/hos/getSdkList', {
        osArch: this.getArch(),
        osType: this.getOperatingSystem(),
        supportVersion,
      } satisfies SDKList.Request)
    }
    catch (error) {
      return error as SDKList.AxiosError
    }
  }

  private async safeReadAndParseSdkPkgFile(sdkPkgFileUri: import('vscode-uri').URI): Promise<LocalImage.OptionalSdkPkgFile | undefined> {
    const { adapter: { fs } } = this.getOptions()

    try {
      const sdkPkgFileContent = await fs.readFile(sdkPkgFileUri).then(buffer => buffer.toString())
      if (!sdkPkgFileContent.length) return undefined
      return JSON.parse(sdkPkgFileContent)
    }
    catch {
      return undefined
    }
  }

  private async safeReadAndParseInfoFile(infoFileUri: import('vscode-uri').URI): Promise<LocalImage.InfoFile | undefined> {
    const { adapter: { fs } } = this.getOptions()

    try {
      const infoFileContent = await fs.readFile(infoFileUri).then(buffer => buffer.toString())
      if (!infoFileContent.length) return undefined
      return JSON.parse(infoFileContent)
    }
    catch {
      return undefined
    }
  }

  async getLocalImages(): Promise<LocalImage[]> {
    const { adapter: { fs, join } } = this.getOptions()
    const localImages: LocalImage[] = []
    const systemImagePath = join(this.options.imageBasePath, 'system-image')
    const sdkPkgFiles = await fs.glob(new RelativePattern(systemImagePath, '**/sdk-pkg.json'), { deep: 3 })

    for (const sdkPkgFileUri of sdkPkgFiles) {
      const sdkPkgFile = await this.safeReadAndParseSdkPkgFile(sdkPkgFileUri)
      if (!sdkPkgFile) continue
      const infoFile = await this.safeReadAndParseInfoFile(sdkPkgFileUri.with({ path: sdkPkgFileUri.path.replace('sdk-pkg.json', 'info.json') }))
      if (!infoFile) continue
      localImages.push(new LocalImageImpl(this, sdkPkgFile, infoFile))
    }

    return localImages
  }

  async getRemoteImages(supportVersion: string = '6.0-hos-single-9'): Promise<RemoteImage[] | SDKList.SDKListError> {
    const remoteImages: RemoteImage[] = []
    const { adapter: { isAxiosError } } = this.getOptions()
    const resultOrError = await this.requestSdkList(supportVersion)
    if (isAxiosError(resultOrError)) return new SDKList.SDKListError(SDKList.SDKListError.Code.REQUEST_ERROR, 'Request failed with image sdk list.', resultOrError)
    if (!Array.isArray(resultOrError.data)) return new SDKList.SDKListError(SDKList.SDKListError.Code.REQUEST_ERROR, 'Request failed with image sdk list.', resultOrError)

    for (const item of resultOrError.data) {
      if (typeof item !== 'object' || item === null || Array.isArray(item)) continue
      remoteImages.push(new RemoteImageImpl(this, item))
    }

    return remoteImages
  }

  async getDownloadedRemoteImages(supportVersion?: string): Promise<RemoteImage[] | SDKList.SDKListError> {
    const remoteImages = await this.getRemoteImages(supportVersion)
    if (remoteImages instanceof SDKList.SDKListError) return remoteImages
    const downloadedRemoteImages: RemoteImage[] = []

    for (const remoteImage of remoteImages) {
      const localImage = await remoteImage.getLocalImage()
      if (!localImage) continue
      downloadedRemoteImages.push(remoteImage)
    }

    return downloadedRemoteImages
  }

  getListsFilePath(): import('vscode-uri').URI {
    const { deployedPath, adapter: { join } } = this.getOptions()
    return join(deployedPath, 'lists.json')
  }

  async readListsFile(): Promise<ListsFileImpl> {
    try {
      const { adapter: { fs } } = this.getOptions()
      const listsFilePath = this.getListsFilePath()
      const listsFileContent = await fs.readFile(listsFilePath).then(buffer => buffer.toString())
      if (!listsFileContent.length) return new ListsFileImpl(this, [])
      return new ListsFileImpl(this, JSON.parse(listsFileContent))
    }
    catch {
      return new ListsFileImpl(this, [])
    }
  }

  async readEmulatorFile(): Promise<EmulatorFile> {
    try {
      const { adapter: { fs, join } } = this.getOptions()
      const emulatorFilePath = join(this.options.emulatorPath, 'emulator.json')
      const emulatorFileContent = await fs.readFile(emulatorFilePath).then(buffer => buffer.toString())
      if (!emulatorFileContent.length) return new EmulatorFileImpl(this, (await import('./default-emulator-config')).default)
      return new EmulatorFileImpl(this, JSON.parse(emulatorFileContent))
    }
    catch {
      return new EmulatorFileImpl(this, (await import('./default-emulator-config')).default)
    }
  }

  async readProductConfigFile(): Promise<ProductConfigFile> {
    try {
      const { adapter: { fs, join } } = this.getOptions()
      const productConfigFilePath = join(this.options.emulatorPath, 'product-config.json')
      const productConfigFileContent = await fs.readFile(productConfigFilePath).then(buffer => buffer.toString())
      if (!productConfigFileContent.length) return new ProductConfigFileImpl(this, (await import('./default-product-config')).default)
      return new ProductConfigFileImpl(this, JSON.parse(productConfigFileContent))
    }
    catch {
      return new ProductConfigFileImpl(this, (await import('./default-product-config')).default)
    }
  }

  async getDeployedDevices(): Promise<Device[]> {
    const deployedDevices: Device[] = []
    const listsFile = await this.readListsFile()
    const productConfigFile = await this.readProductConfigFile()
    const emulatorFile = await this.readEmulatorFile()

    for (const listFileItem of listsFile.getListsFileItems()) {
      const productConfigItem = productConfigFile.findProductConfigItem({
        deviceType: DeviceTypeConverter.snakecaseToCamelcase(listFileItem.getContent().type),
        name: listFileItem.getContent().model,
      })
      if (!productConfigItem) continue
      const emulatorDeviceItem = emulatorFile.findDeviceItem({
        deviceType: listFileItem.getContent().type as ListsFileItem.DeviceType,
        apiVersion: Number(listFileItem.getContent().apiVersion),
      })
      if (!emulatorDeviceItem) continue

      const screen = new ScreenPresetImpl({ productConfigItem, emulatorDeviceItem })
      const device = new DeviceImpl({
        imageManager: this,
        listsFile,
        listFileItem,
        screen,
      })

      // Read the `config.ini` file.
      const configIniFileUri = ConfigIniFileImpl.getFileUri(device)
      const parsedConfigIniFile = await ConfigIniFileImpl.safeReadAndParse(device)
      if (!parsedConfigIniFile) {
        listsFile.deleteListsFileItem(listFileItem)
        continue
      }
      device.setConfigIniFile(new ConfigIniFileImpl(device, configIniFileUri, parsedConfigIniFile))

      // Read the named `*.ini` file.
      const namedIniFileUri = NamedIniFileImpl.getFileUri(device)
      const parsedNamedIniFile = await NamedIniFileImpl.safeReadAndParse(device)
      if (!parsedNamedIniFile) {
        listsFile.deleteListsFileItem(listFileItem)
        continue
      }
      device.setNamedIniFile(new NamedIniFileImpl(device, namedIniFileUri, parsedNamedIniFile))

      deployedDevices.push(device)
    }

    if (listsFile.isChanged) listsFile.write()

    return deployedDevices
  }

  toJSON(): ImageManager.Serializable {
    return {
      options: this.getOptions(),
      operatingSystem: this.getOperatingSystem(),
      arch: this.getArch(),
      listsFilePath: this.getListsFilePath(),
    }
  }

  async isCompatible(): Promise<boolean> {
    const { emulatorPath, adapter: { fs, join, URI } } = this.getOptions()
    const sdkPkgPath = join(emulatorPath, 'sdk-pkg.json').fsPath
    if (!(await fs.isFile(URI.file(sdkPkgPath)))) return false
    const sdkPkg = JSON.parse(await fs.readFile(URI.file(sdkPkgPath)).then(buffer => buffer.toString()))
    if (!sdkPkg?.data?.version || typeof sdkPkg.data.version !== 'string') return false
    const [major, minor, patch] = sdkPkg.data.version.split('.').map(Number)
    const satisfies = (await import('semver/functions/satisfies')).default
    return satisfies(`${major}.${minor}.${patch}`, '>=6.0.2')
  }
}

export async function createImageManager(options: ImageManager.Options): Promise<ImageManager> {
  const resolvedOptions = await OptionsResolver.resolveImageManagerOptions(options)
  return new ImageManagerImpl(resolvedOptions)
}
