import type { Device, DeviceImpl } from '../devices/device'
import type { FullDeployedImageOptions } from '../devices/list'
import type { ProductConfigItem } from '../product-config'
import type { ProductPreset } from '../screens/product-preset'
import type { Screen } from '../screens/screen'
import type { DeviceType, PascalCaseDeviceType, Stringifiable } from '../types'
import type { BaseImage } from './image'
import INI from 'ini'
import { createDevice } from '../devices/device'
import { createProductPreset } from '../screens/product-preset'
import { createScreen } from '../screens/screen'
import { ImageBase } from './image'

export interface LocalImage extends BaseImage, Stringifiable<LocalImage.Stringifiable> {
  imageType: 'local'
  getDevices(): Promise<Device[]>
  createDevice(options: Device.Options): Device
  delete(): Promise<void | Error>
  start(device: Device): Promise<import('node:child_process').ChildProcess>
  stop(device: Device): Promise<import('node:child_process').ChildProcess>
  buildStartCommand(device: Device): Promise<string>
  buildStopCommand(device: Device): Promise<string>
  getProductConfig(): Promise<ProductConfigItem[]>
}

export namespace LocalImage {
  export interface Stringifiable extends Omit<BaseImage.Stringifiable, 'imageType'> {
    imageType: 'local'
    executablePath: string
  }
}

export class LocalImageImpl extends ImageBase<LocalImage.Stringifiable> implements LocalImage {
  imageType = 'local' as const

  createDevice(options: Device.Options): Device {
    return createDevice(this, options)
  }

  async getPascalCaseDeviceType(): Promise<PascalCaseDeviceType | undefined> {
    const deviceType = this.getDeviceType().toLowerCase() as DeviceType
    if (!deviceType)
      return
    if (deviceType === 'pc')
      return '2in1 Foldable'
    const key = ['phone', 'tablet', '2in1', 'foldable', 'widefold', 'triplefold', '2in1 foldable', 'tv', 'wearable'].find(key => key === deviceType)
    if (key)
      return key as PascalCaseDeviceType
    return undefined
  }

  async getProductConfig(usingDefaultProductConfig: boolean = false): Promise<ProductConfigItem[]> {
    const productConfig = usingDefaultProductConfig
      ? (await import('../default-product-config')).default
      : await this.getImageManager().getProductConfig()
    const deviceType = this.getDeviceType().toLowerCase() as DeviceType
    if (!deviceType)
      return []
    if (deviceType === 'pc')
      return productConfig['2in1 Foldable'] ?? []
    const key = Object.keys(productConfig).find(key => key.toLowerCase() === deviceType)
    if (key)
      return productConfig[key] ?? []
    return []
  }

  async delete(): Promise<void | Error> {
    const { fs } = this.getImageManager().getOptions()
    const path = this.getFsPath()
    if (!fs.existsSync(path) || !fs.statSync(path).isDirectory())
      return new Error('Image path does not exist')
    fs.rmSync(path, { recursive: true })
    const devices = await this.getDevices()
    const error = await Promise.allSettled(devices.map(device => device.delete()))
      .then(results => results.find(result => result.status === 'rejected'))
    if (error)
      return error.reason
    return undefined
  }

  private getExecutablePath(): string {
    const { emulatorPath, process, path } = this.getImageManager().getOptions()
    return process.platform === 'win32' ? path.join(emulatorPath, 'Emulator.exe') : path.join(emulatorPath, 'Emulator')
  }

  async buildStartCommand(device: Device): Promise<string> {
    const config = device.buildList()
    const executablePath = this.getExecutablePath()
    const args = [
      '-hvd',
      `"${config.name.replace(/"/g, '\\"')}"`,
      '-path',
      `"${this.getImageManager().getOptions().deployedPath.replace(/"/g, '\\"')}"`,
      '-imageRoot',
      `"${this.getImageManager().getOptions().imageBasePath.replace(/"/g, '\\"')}"`,
    ].join(' ')
    return `${executablePath} ${args}`
  }

  async start(deployer: Device): Promise<import('node:child_process').ChildProcess> {
    const { child_process, emulatorPath } = this.getImageManager().getOptions()
    return child_process.exec(await this.buildStartCommand(deployer), { cwd: emulatorPath })
  }

  async buildStopCommand(device: Device): Promise<string> {
    const config = device.buildList()
    const executablePath = this.getExecutablePath()
    const args = [
      '-stop',
      `"${config.name.replace(/"/g, '\\"')}"`,
    ].join(' ')
    return `${executablePath} ${args}`
  }

  async stop(device: Device): Promise<import('node:child_process').ChildProcess> {
    const { child_process, emulatorPath } = this.getImageManager().getOptions()
    return child_process.exec(await this.buildStopCommand(device), { cwd: emulatorPath })
  }

  private async createScreenLike(listsJsonItem: FullDeployedImageOptions): Promise<Screen | ProductPreset> {
    if (!listsJsonItem.model) {
      return createScreen({
        diagonal: Number(listsJsonItem.diagonalSize),
        height: Number(listsJsonItem.resolutionHeight),
        width: Number(listsJsonItem.resolutionWidth),
        density: Number(listsJsonItem.density),
      })
    }

    const productConfig = await this.getProductConfig()
    const productConfigItem = productConfig.find(item => item.name === listsJsonItem.model)
    const pascalCaseDeviceType = await this.getPascalCaseDeviceType()
    if (
      !productConfigItem
      || !pascalCaseDeviceType
      || productConfigItem.screenDiagonal !== listsJsonItem.diagonalSize
      || productConfigItem.screenHeight !== listsJsonItem.resolutionHeight
      || productConfigItem.screenWidth !== listsJsonItem.resolutionWidth
      || productConfigItem.screenDensity !== listsJsonItem.density
    ) {
      return createScreen({
        diagonal: Number(listsJsonItem.diagonalSize),
        height: Number(listsJsonItem.resolutionHeight),
        width: Number(listsJsonItem.resolutionWidth),
        density: Number(listsJsonItem.density),
      })
    }
    return createProductPreset(productConfigItem, pascalCaseDeviceType)
  }

  async getDevices(): Promise<Device[]> {
    const { path, fs, deployedPath, imageBasePath } = this.getImageManager().getOptions()
    const listsJsonPath = path.resolve(deployedPath, 'lists.json')
    if (!fs.existsSync(listsJsonPath) || !fs.statSync(listsJsonPath).isFile())
      return []
    const listsJson: unknown = JSON.parse(fs.readFileSync(listsJsonPath, 'utf-8'))
    if (!Array.isArray(listsJson) || this.imageType !== 'local')
      return []

    const devices: Device[] = []

    for (const listsJsonItem of listsJson as FullDeployedImageOptions[]) {
      if (path.resolve(imageBasePath, listsJsonItem.imageDir) !== this.getFsPath())
        continue
      const iniFilePath = path.resolve(listsJsonItem.path, 'config.ini')
      if (!fs.existsSync(iniFilePath) || !fs.statSync(iniFilePath).isFile())
        continue

      const device = this.createDevice({
        name: listsJsonItem.name,
        cpuNumber: Number(listsJsonItem.cpuNumber),
        diskSize: Number(listsJsonItem.dataDiskSize),
        memorySize: Number(listsJsonItem.memoryRamSize),
        screen: await this.createScreenLike(listsJsonItem),
      }) as DeviceImpl

      device.setUuid(listsJsonItem.uuid as Device.UUID)
        .setCachedList(listsJsonItem)
        .setCachedIni(INI.parse(fs.readFileSync(iniFilePath, 'utf-8')))

      if (!fs.existsSync(listsJsonItem.path) || !fs.statSync(listsJsonItem.path).isDirectory())
        continue
      devices.push(device)
    }

    return devices
  }

  toJSON(): LocalImage.Stringifiable {
    return {
      ...super.toJSON(),
      executablePath: this.getExecutablePath(),
    }
  }
}
