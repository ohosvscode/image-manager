import type { Device } from '../deployer/image-deployer'
import type { DeployedImageConfigWithProductName, FullDeployedImageOptions, ProductNameable } from '../deployer/list'
import type { ProductConfigItem } from '../product-config'
import type { DeviceType, Stringifiable } from '../types'
import type { BaseImage } from './image'
import { createImageDeployer } from '../deployer/image-deployer'
import { ImageBase } from './image'

export interface LocalImage extends BaseImage, Stringifiable<LocalImage.Stringifiable> {
  imageType: 'local'
  createDevice(name: string, config: DeployedImageConfigWithProductName): Device
  getProductConfig(): Promise<ProductConfigItem[]>
  delete(): Promise<void | Error>
  buildStartCommand(deployer: Device): Promise<string>
  start(deployer: Device): Promise<import('node:child_process').ChildProcess>
  buildStopCommand(deployer: Device): Promise<string>
  stop(deployer: Device): Promise<import('node:child_process').ChildProcess>
  getDevices(): Promise<Device[]>
}

export namespace LocalImage {
  export interface Stringifiable extends Omit<BaseImage.Stringifiable, 'imageType'> {
    imageType: 'local'
    executablePath: string
  }
}

export class LocalImageImpl extends ImageBase<LocalImage.Stringifiable> implements LocalImage {
  imageType = 'local' as const

  createDevice(name: string, config: ProductNameable<FullDeployedImageOptions>): Device {
    return createImageDeployer(
      this,
      this.getImageManager().getOptions().crypto.randomUUID(),
      name,
      config,
    )
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

  async buildStartCommand(deployer: Device): Promise<string> {
    const config = await deployer.buildList()
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

  async buildStopCommand(deployer: Device): Promise<string> {
    const config = await deployer.buildList()
    const executablePath = this.getExecutablePath()
    const args = [
      '-stop',
      `"${config.name.replace(/"/g, '\\"')}"`,
    ].join(' ')
    return `${executablePath} ${args}`
  }

  async stop(deployer: Device): Promise<import('node:child_process').ChildProcess> {
    const { child_process, emulatorPath } = this.getImageManager().getOptions()
    return child_process.exec(await this.buildStopCommand(deployer), { cwd: emulatorPath })
  }

  private typeAssert<T>(value: unknown): asserts value is T {}

  async getDevices(): Promise<Device[]> {
    const { path, fs, imageBasePath } = this.getImageManager().getOptions()
    const listsJsonPath = path.resolve(this.getImageManager().getOptions().deployedPath, 'lists.json')
    if (!fs.existsSync(listsJsonPath) || !fs.statSync(listsJsonPath).isFile())
      return []
    const listsJson: unknown = JSON.parse(fs.readFileSync(listsJsonPath, 'utf-8'))
    if (!Array.isArray(listsJson) || this.imageType !== 'local')
      return []

    this.typeAssert<LocalImage>(this)
    const devices: Device[] = []
    for (const listsJsonItem of listsJson as unknown[]) {
      if (typeof listsJsonItem !== 'object' || listsJsonItem === null)
        continue
      if (!('imageDir' in listsJsonItem) || typeof listsJsonItem.imageDir !== 'string')
        continue
      if (!('name' in listsJsonItem) || typeof listsJsonItem.name !== 'string')
        continue
      if (path.resolve(this.getFsPath()) !== path.resolve(imageBasePath, listsJsonItem.imageDir))
        continue
      devices.push(this.createDevice(listsJsonItem.name, listsJsonItem as ProductNameable<FullDeployedImageOptions>))
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
