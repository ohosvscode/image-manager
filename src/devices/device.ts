import type { LocalImage } from '../images'
import type { ProductPreset } from '../screens/product-preset'
import type { Screen } from '../screens/screen'
import type { FullDeployedImageOptions } from './list'
import { DeployError } from '../errors'
import { ProductPresetImpl } from '../screens/product-preset'

export interface Device {
  getOptions(): Device.Options
  getImage(): LocalImage
  setUuid(uuid: Device.UUID): this
  getUuid(): Device.UUID
  buildList(): FullDeployedImageOptions
  buildIni(): Record<string, string | undefined>
  toIniString(): Promise<string>
  deploy(): Promise<void>
  delete(): Promise<void>
  isDeployed(): Promise<boolean>
  toJSON(): Device.Stringifiable
}

export namespace Device {
  export type UUID = `${string}-${string}-${string}-${string}-${string}`

  export interface Options {
    name: string
    cpuNumber: number
    diskSize: number
    memorySize: number
    screen: Screen | ProductPreset
  }

  export interface IniOptions {
    /** @default CN */
    vendorCountry?: string
    /** @default true */
    isPublic?: boolean
    /** Override the ini options. */
    overrides?: Record<string, string | undefined>
  }

  export interface Stringifiable extends Omit<Options, 'screen'> {
    list: FullDeployedImageOptions
    ini: Record<string, string | undefined>
  }
}

export class DeviceImpl implements Device {
  private uuid: `${string}-${string}-${string}-${string}-${string}`

  constructor(
    private readonly image: LocalImage,
    private readonly options: Device.Options,
  ) {
    this.uuid = image.getImageManager().getOptions().crypto.randomUUID()
  }

  getOptions(): Device.Options {
    return this.options
  }

  getImage(): LocalImage {
    return this.image
  }

  getScreen(): Screen {
    if (this.options.screen instanceof ProductPresetImpl)
      return this.options.screen.toScreen()
    return this.options.screen as Screen
  }

  setUuid(uuid: Device.UUID): this {
    this.uuid = uuid
    return this
  }

  getUuid(): Device.UUID {
    return this.uuid
  }

  private cachedList: FullDeployedImageOptions | null = null

  setCachedList(list: FullDeployedImageOptions): this {
    this.cachedList = list
    return this
  }

  private cachedIni: Record<string, string | undefined> | null = null

  setCachedIni(ini: Record<string, string | undefined>): this {
    this.cachedIni = ini
    return this
  }

  buildList(): FullDeployedImageOptions {
    if (this.cachedList)
      return this.cachedList

    const { path, deployedPath, imageBasePath, configPath, logPath } = this.image.getImageManager().getOptions()
    const screen = this.getScreen()

    const list: FullDeployedImageOptions = {
      'name': this.options.name,
      'apiVersion': this.image.getApiVersion(),
      'cpuNumber': this.options.cpuNumber.toFixed(),
      'diagonalSize': screen.getDiagonal().toFixed(2),
      'resolutionHeight': screen.getHeight().toFixed(),
      'resolutionWidth': screen.getWidth().toFixed(),
      'density': screen.getDensity().toFixed(),
      'memoryRamSize': this.options.memorySize.toFixed(),
      'dataDiskSize': this.options.diskSize.toFixed(),
      'path': path.resolve(deployedPath, this.options.name),
      'type': this.image.getSnakecaseDeviceType(),
      'uuid': this.uuid,
      'version': this.image.getVersion(),
      'imageDir': this.image.getPath().split(',').join(path.sep) + path.sep,
      'showVersion': `${this.image.getTargetOS()} ${this.image.getTargetVersion()}(${this.image.getApiVersion()})`,
      'harmonyos.sdk.path': imageBasePath,
      'harmonyos.config.path': configPath,
      'harmonyos.log.path': logPath,
      'hw.apiName': this.image.getTargetVersion(),
      'abi': this.image.getArch(),
      'harmonyOSVersion': `${this.image.getTargetOS()}-${this.image.getTargetVersion()}`,
      'guestVersion': `${this.image.getTargetOS()} ${this.image.getVersion()}(${this.image.getReleaseType()})`,
    }

    if (this.options.screen instanceof ProductPresetImpl) {
      const productConfig = this.options.screen.getProductConfig()

      if (productConfig.devModel)
        list.devModel = productConfig.devModel

      if (productConfig.name)
        list.model = productConfig.name
    }

    return list
  }

  buildIni(options: Device.IniOptions = {}): Record<string, string | undefined> {
    if (this.cachedIni)
      return this.cachedIni

    const listConfig = this.buildList()
    const screen = this.getScreen()
    const is2in1Foldable = listConfig.type === '2in1_foldable'
    const productPreset = this.options.screen instanceof ProductPresetImpl ? this.options.screen : null
    const productConfig = productPreset?.getProductConfig()
    const hasOuterScreen = is2in1Foldable && productConfig?.outerScreenWidth != null && productConfig?.outerScreenHeight != null && productConfig?.outerScreenDiagonal != null

    // 2in1 折叠屏：single=外屏(折叠)，double=主屏(展开)；非 2in1 或无 outer 时 single=主屏，number=1
    const useDualScreen = hasOuterScreen
    const singleDiagonal = useDualScreen ? productConfig!.outerScreenDiagonal! : screen.getDiagonal().toString()
    const singleHeight = useDualScreen ? productConfig!.outerScreenHeight! : screen.getHeight().toString()
    const singleWidth = useDualScreen ? productConfig!.outerScreenWidth! : screen.getWidth().toString()
    const doubleDiagonal = useDualScreen ? productConfig!.screenDiagonal : undefined
    const doubleHeight = useDualScreen ? productConfig!.screenHeight : undefined
    const doubleWidth = useDualScreen ? productConfig!.screenWidth : undefined

    const ini: Record<string, string | undefined> = {
      'name': listConfig.name,
      'deviceType': listConfig.type,
      'deviceModel': listConfig.devModel,
      'productModel': listConfig.model,
      'vendorCountry': options.vendorCountry ?? 'CN',
      'uuid': this.uuid,
      'configPath': listConfig['harmonyos.config.path'],
      'logPath': listConfig['harmonyos.log.path'],
      'sdkPath': listConfig['harmonyos.sdk.path'],
      'imageSubPath': listConfig.imageDir,
      'instancePath': listConfig.path,
      'os.osVersion': `${this.image.getTargetOS()} ${this.image.getTargetVersion()}(${this.image.getApiVersion()})`,
      'os.apiVersion': this.image.getApiVersion(),
      'os.softwareVersion': this.image.getVersion(),
      'os.isPublic': (options.isPublic ?? true) ? 'true' : 'false',
      'hw.cpu.arch': listConfig.abi,
      'hw.cpu.ncore': listConfig.cpuNumber,
      'hw.lcd.density': screen.getDensity().toFixed(),
      'hw.lcd.single.diagonalSize': singleDiagonal,
      'hw.lcd.single.height': singleHeight,
      'hw.lcd.single.width': singleWidth,
      'hw.lcd.number': useDualScreen ? '2' : '1',
      'hw.ramSize': listConfig.memoryRamSize,
      'hw.dataPartitionSize': listConfig.dataDiskSize,
      'isCustomize': productPreset ? 'false' : 'true',
      'hw.hdc.port': 'notset',
      ...options.overrides,
    }

    if (useDualScreen && doubleDiagonal != null && doubleHeight != null && doubleWidth != null) {
      ini['hw.lcd.double.diagonalSize'] = doubleDiagonal
      ini['hw.lcd.double.height'] = doubleHeight
      ini['hw.lcd.double.width'] = doubleWidth
    }

    // 非 2in1 双屏时，部分模拟器版本用 hw.phy 表示外屏像素；2in1 双屏时与 hw.lcd.single 一致，可省略
    if (productPreset && productConfig && !useDualScreen) {
      if (productConfig.outerScreenHeight)
        ini['hw.phy.height'] = productConfig.outerScreenHeight
      if (productConfig.outerScreenWidth)
        ini['hw.phy.width'] = productConfig.outerScreenWidth
    }

    return ini
  }

  async toIniString(): Promise<string> {
    return `${Object.entries(this.buildIni())
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')}\n`
  }

  async deploy(): Promise<void> {
    if (await this.isDeployed())
      return

    const { fs, path, deployedPath } = this.image.getImageManager().getOptions()

    if (!fs.existsSync(deployedPath))
      fs.mkdirSync(deployedPath, { recursive: true })

    const listsPath = path.join(deployedPath, 'lists.json')
    const listConfig = this.buildList()
    if (fs.existsSync(listConfig.path))
      throw new DeployError(DeployError.Code.DEVICE_ALREADY_DEPLOYED, `Image ${listConfig.name} already deployed`)

    if (!fs.existsSync(listsPath))
      return fs.writeFileSync(listsPath, JSON.stringify([listConfig], null, 2))
    const lists: FullDeployedImageOptions[] = JSON.parse(fs.readFileSync(listsPath, 'utf-8')) ?? []
    if (!Array.isArray(lists))
      throw new DeployError(DeployError.Code.LIST_JSON_NOT_AN_ARRAY, 'Lists is not an array')
    if (lists.find(item => item.name === listConfig.name))
      throw new DeployError(DeployError.Code.DEVICE_ALREADY_DEPLOYED, `Image ${listConfig.name} already deployed in lists.json`)
    lists.push(listConfig)

    // Write lists.json
    fs.writeFileSync(listsPath, JSON.stringify(lists, null, 2))

    // Write config.ini
    fs.mkdirSync(listConfig.path, { recursive: true })
    fs.writeFileSync(path.join(listConfig.path, 'config.ini'), await this.toIniString())
  }

  async delete(): Promise<void> {
    const { fs, path, deployedPath } = this.image.getImageManager().getOptions()
    const listsPath = path.join(deployedPath, 'lists.json')
    if (!fs.existsSync(listsPath) || !fs.statSync(listsPath).isFile())
      throw new Error('Lists file not found')

    const lists: FullDeployedImageOptions[] = JSON.parse(fs.readFileSync(listsPath, 'utf-8')) ?? []
    const index = lists.findIndex(item => item.name === this.options.name)
    if (index === -1)
      throw new Error(`Device ${this.options.name} not found`)
    lists.splice(index, 1)
    fs.writeFileSync(listsPath, JSON.stringify(lists, null, 2))
    fs.rmSync(path.resolve(this.buildList().path), { recursive: true })
  }

  async isDeployed(): Promise<boolean> {
    const { fs, path, deployedPath } = this.image.getImageManager().getOptions()
    const listsPath = path.join(deployedPath, 'lists.json')
    if (!fs.existsSync(listsPath) || !fs.statSync(listsPath).isFile())
      return false
    const lists: FullDeployedImageOptions[] = JSON.parse(fs.readFileSync(listsPath, 'utf-8')) ?? []
    return lists.some(item => item.name === this.options.name && fs.existsSync(path.resolve(item.path, 'config.ini')))
  }

  toJSON(): Device.Stringifiable {
    return {
      ...this.options,
      list: this.buildList(),
      ini: this.buildIni(),
    }
  }
}

export function createDevice(image: LocalImage, options: Device.Options): Device {
  return new DeviceImpl(image, options)
}
