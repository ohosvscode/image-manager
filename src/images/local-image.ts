import type { ImageDeployer } from '../deployer/image-deployer'
import type { DeployedImageConfigWithProductName } from '../deployer/list'
import type { ProductConfigItem } from '../product-config'
import type { DeviceType, Stringifiable } from '../types'
import type { BaseImage } from './image'
import { createImageDeployer } from '../deployer/image-deployer'
import { ImageBase } from './image'

export interface LocalImage extends BaseImage, Stringifiable<LocalImage.Stringifiable> {
  imageType: 'local'
  createDeployer(name: string, config: DeployedImageConfigWithProductName): ImageDeployer
  getProductConfig(): Promise<ProductConfigItem[]>
  delete(): Promise<void | Error>
  buildStartCommand(deployer: ImageDeployer): Promise<string>
  start(deployer: ImageDeployer): Promise<import('node:child_process').ChildProcess>
  buildStopCommand(deployer: ImageDeployer): Promise<string>
  stop(deployer: ImageDeployer): Promise<import('node:child_process').ChildProcess>
}

export namespace LocalImage {
  export interface Stringifiable {
    imageType: 'local'
    path: string
    version: string
    apiVersion: string
    targetVersion: string
    checksum: string
  }
}

export class LocalImageImpl extends ImageBase<LocalImage.Stringifiable> implements LocalImage {
  imageType = 'local' as const

  createDeployer(name: string, config: DeployedImageConfigWithProductName): ImageDeployer {
    return createImageDeployer(
      this,
      this.getImageManager().getOptions().crypto.randomUUID(),
      name,
      config,
    )
  }

  async getProductConfig(): Promise<ProductConfigItem[]> {
    const productConfig = await this.getImageManager().getProductConfig()
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
    const fs = this.getImageManager().getOptions().fs
    const path = this.getFsPath()
    if (!fs.existsSync(path) || !fs.statSync(path).isDirectory())
      return new Error('Image path does not exist')
    fs.rmSync(path, { recursive: true })
    return undefined
  }

  private getExecutablePath(): string {
    const { emulatorPath, process, path } = this.getImageManager().getOptions()
    return process.platform === 'win32' ? path.join(emulatorPath, 'Emulator.exe') : path.join(emulatorPath, 'Emulator')
  }

  async buildStartCommand(deployer: ImageDeployer): Promise<string> {
    const config = await deployer.buildList()
    const executablePath = this.getExecutablePath()
    const args = [
      '-hvd',
      `"${config.name.replace(/"/g, '\\"')}"`,
      '-path',
      `"${this.getImageManager().getOptions().deployedPath.replace(/"/g, '\\"')}"`,
      '-imageRoot',
      `"${config.path.replace(/"/g, '\\"')}"`,
    ].join(' ')
    return `${executablePath} ${args}`
  }

  async start(deployer: ImageDeployer): Promise<import('node:child_process').ChildProcess> {
    const { child_process, emulatorPath } = this.getImageManager().getOptions()
    return child_process.exec(await this.buildStartCommand(deployer), { cwd: emulatorPath })
  }

  async buildStopCommand(deployer: ImageDeployer): Promise<string> {
    const config = await deployer.buildList()
    const executablePath = this.getExecutablePath()
    const args = [
      '-stop',
      `"${config.name.replace(/"/g, '\\"')}"`,
    ].join(' ')
    return `${executablePath} ${args}`
  }

  async stop(deployer: ImageDeployer): Promise<import('node:child_process').ChildProcess> {
    const { child_process, emulatorPath } = this.getImageManager().getOptions()
    return child_process.exec(await this.buildStopCommand(deployer), { cwd: emulatorPath })
  }

  toJSON(): LocalImage.Stringifiable {
    return {
      imageType: this.imageType,
      path: this.getPath(),
      version: this.getVersion(),
      apiVersion: this.getApiVersion(),
      targetVersion: this.getTargetVersion(),
      checksum: this.getChecksum(),
    }
  }
}
