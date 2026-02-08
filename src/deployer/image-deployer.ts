import type { LocalImage } from '../images'
import type { DeployedImageConfig, DeployedImageOptions, FullDeployedImageOptions } from './list'

export interface ImageDeployer {
  setUuid(uuid: `${string}-${string}-${string}-${string}-${string}`): this
  setModel(model: string): this
  setDevModel(devModel: FullDeployedImageOptions['devModel']): this
  setCpuNumber(cpuNumber: number): this
  setMemoryRamSize(memoryRamSize: number): this
  setDataDiskSize(dataDiskSize: number): this
  setCoverResolutionWidth(coverResolutionWidth: number | string): this
  setCoverResolutionHeight(coverResolutionHeight: number | string): this
  setCoverDiagonalSize(coverDiagonalSize: number | string): this
  setIsDefault(isDefault: boolean): this
  setIsCustomize(isCustomize: boolean): this
  setIsPublic(isPublic: boolean): this
  setVendorCountry(vendorCountry: string): this
  setHwHdcPort(hwHdcPort: string | number): this
  /**
   * Build the list object of the current device.
   *
   * @returns The list object of the current device. Can be used to build the `lists.json` file.
   */
  buildList(): Promise<FullDeployedImageOptions>
  /**
   * Build the `config.ini` object of the current device.
   *
   * @returns The `config.ini` object of the current device.
   */
  buildIni(): Promise<Record<string, string>>
  /**
   * Build the `config.ini` string of the current device.
   *
   * @returns The `config.ini` string of the current device, can write to file directly.
   */
  toIniString(): Promise<string>
  /**
   * Deploy the image.
   *
   * @param symlinkImage - If true, symlink the system image to current device directory. Default is `true`.
   */
  deploy(symlinkImage?: boolean): Promise<void | Error>
}

class ImageDeployerImpl implements ImageDeployer {
  private readonly options: Partial<FullDeployedImageOptions> = {}
  private isDefault = true
  private isCustomize = false
  private isPublic = true
  private vendorCountry = 'CN'
  private hwHdcPort: string | number = 'notset'

  constructor(
    private readonly image: LocalImage,
    uuid: string,
    name: string,
    readonly config: DeployedImageConfig,
  ) {
    this.options.uuid = uuid
    this.options.name = name
    Object.assign(this.options, config)
  }

  setUuid(uuid: string): this {
    this.options.uuid = uuid
    return this
  }

  setModel(model: string): this {
    this.options.model = model
    return this
  }

  setDevModel(devModel: FullDeployedImageOptions['devModel']): this {
    this.options.devModel = devModel
    return this
  }

  setCpuNumber(cpuNumber: number): this {
    this.options.cpuNumber = cpuNumber.toString()
    return this
  }

  setMemoryRamSize(memoryRamSize: number): this {
    this.options.memoryRamSize = memoryRamSize.toString()
    return this
  }

  setDataDiskSize(dataDiskSize: number): this {
    this.options.dataDiskSize = dataDiskSize.toString()
    return this
  }

  setCoverResolutionWidth(coverResolutionWidth: number | string): this {
    this.options.coverResolutionWidth = coverResolutionWidth.toString()
    return this
  }

  setCoverResolutionHeight(coverResolutionHeight: number | string): this {
    this.options.coverResolutionHeight = coverResolutionHeight.toString()
    return this
  }

  setCoverDiagonalSize(coverDiagonalSize: number | string): this {
    this.options.coverDiagonalSize = coverDiagonalSize.toString()
    return this
  }

  setIsDefault(isDefault: boolean): this {
    this.isDefault = isDefault
    return this
  }

  setIsCustomize(isCustomize: boolean): this {
    this.isCustomize = isCustomize
    return this
  }

  setIsPublic(isPublic: boolean): this {
    this.isPublic = isPublic
    return this
  }

  setHwHdcPort(hwHdcPort: string | number): this {
    this.hwHdcPort = hwHdcPort.toString()
    return this
  }

  setVendorCountry(vendorCountry: string): this {
    this.vendorCountry = vendorCountry
    return this
  }

  async buildList(): Promise<FullDeployedImageOptions> {
    if (!this.options.name)
      throw new Error('Name is required')

    return {
      ...this.options as DeployedImageOptions,
      'imageDir': this.image.getPath().split(',').join(this.image.getImageManager().getOptions().path.sep) + this.image.getImageManager().getOptions().path.sep,
      'version': this.image.getVersion(),
      'abi': this.image.getArch(),
      'apiVersion': this.image.getApiVersion(),
      'path': this.image.getImageManager().getOptions().path.resolve(
        this.image.getImageManager().getOptions().deployedPath,
        this.options.name ?? '',
      ),
      'showVersion': `${this.image.getTargetOS()} ${this.image.getTargetVersion()}(${this.image.getApiVersion()})`,
      'harmonyOSVersion': `${this.image.getTargetOS()}-${this.image.getTargetVersion()}`,
      'hw.apiName': this.image.getTargetVersion(),
      'harmonyos.sdk.path': this.image.getImageManager().getOptions().imageBasePath,
      'harmonyos.config.path': this.image.getImageManager().getOptions().configPath,
      'harmonyos.log.path': this.image.getImageManager().getOptions().logPath,
      'type': this.image.getSnakecaseDeviceType(),
    }
  }

  async buildIni(): Promise<Record<string, string>> {
    const config = await this.buildList()

    return {
      'name': config.name,
      'hw.lcd.density': config.density,
      'hw.lcd.height': config.resolutionHeight,
      'hw.lcd.width': config.resolutionWidth,
      'hw.cpu.ncore': config.cpuNumber,
      'hw.phy.height': config.diagonalSize,
      'hw.phy.width': config.diagonalSize,
      'diagonalSize': config.diagonalSize,
      'hw.ramSize': config.memoryRamSize,
      'deviceType': config.type,
      'uuid': config.uuid,
      'hmApiVersion': config.apiVersion,
      'hmAbi': config.abi,
      'hmVersion': config.version,
      'hw.cpu.arch': config.abi,
      'hw.apiName': config['hw.apiName'],
      'image.sysdir.1': config.imageDir,
      'hvd.path': config.path,
      'disk.dataPartition.size': `${config.dataDiskSize}M`,
      'hmShowVersion': config.showVersion,
      'harmonyOSVersion': config.harmonyOSVersion,
      'harmonyos.sdk.path': config['harmonyos.sdk.path'],
      'harmonyos.config.path': config['harmonyos.config.path'],
      'harmonyos.log.path': config['harmonyos.log.path'],
      'guest.version': config.version,
      'devModel': config.devModel,
      'model': config.model,
      'isDefault': this.isDefault ? 'true' : 'false',
      'isCustomize': this.isCustomize ? 'true' : 'false',
      'isPublic': this.isPublic ? 'true' : 'false',
      'vendorCountry': this.vendorCountry,
      'hw.hdc.port': this.hwHdcPort.toString(),
    }
  }

  async toIniString(): Promise<string> {
    return `${Object.entries(await this.buildIni())
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')}\n`
  }

  private writeLists(config: FullDeployedImageOptions): void | Error {
    const fs = this.image.getImageManager().getOptions().fs
    const path = this.image.getImageManager().getOptions().path
    const listsPath = path.resolve(this.image.getImageManager().getOptions().deployedPath, 'lists.json')
    if (!fs.existsSync(listsPath)) {
      fs.writeFileSync(listsPath, JSON.stringify([config], null, 2))
    }
    else {
      const lists: FullDeployedImageOptions[] = JSON.parse(fs.readFileSync(listsPath, 'utf-8')) ?? []
      if (!Array.isArray(lists))
        return new Error('Lists is not an array')
      if (lists.find(item => item.name === config.name))
        return
      lists.push(config)
      fs.writeFileSync(listsPath, JSON.stringify(lists, null, 2))
    }
  }

  async deploy(symlinkImage: boolean = true): Promise<void | Error> {
    const { fs, path } = this.image.getImageManager().getOptions()
    const imageBasePath = this.image.getImageManager().getOptions().imageBasePath
    const config = await this.buildList()
    if (fs.existsSync(config.path))
      return new Error(`Image ${config.name} already deployed`)

    const error = this.writeLists(config)
    if (error)
      return error

    fs.mkdirSync(config.path, { recursive: true })
    fs.writeFileSync(path.join(config.path, 'config.ini'), await this.toIniString())

    const systemImageDir = path.join(imageBasePath, 'system-image')
    if (symlinkImage && fs.existsSync(systemImageDir)) {
      const linkPath = path.join(config.path, 'system-image')
      try {
        const target = path.relative(config.path, systemImageDir)
        fs.symlinkSync(target, linkPath)
      }
      catch (err) {
        return err instanceof Error ? err : new Error(String(err))
      }
    }
    return undefined
  }
}

export function createImageDeployer(
  image: LocalImage,
  uuid: string,
  name: string,
  config: DeployedImageConfig,
): ImageDeployer {
  return new ImageDeployerImpl(image, uuid, name, config)
}
