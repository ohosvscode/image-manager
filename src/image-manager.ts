import type { Image } from './images/image'
import type { ImageManagerOptions, ResolvedImageManagerOptions } from './options'
import type { ProductConfig } from './product-config'
import type { Arch, OS } from './types'
import axios from 'axios'
import satisfies from 'semver/functions/satisfies'
import { LocalImageImpl } from './images/local-image'
import { RemoteImageImpl } from './images/remote-image'
import { resolveImageManagerOptions } from './options'

export interface ImageManager {
  /**
   * Get the resolved options.
   */
  getOptions(): ResolvedImageManagerOptions
  /**
   * Get the images.
   *
   * @param supportVersion - The support version of the images. Default is `6.0-hos-single-9`.
   */
  getImages(supportVersion?: string): Promise<Image[]>
  /**
   * Get the product config.
   *
   * It will automatically read from the `imageBasePath/productConfig.json` file if it exists.
   * If the file does not exist, it will use the default product config.
   */
  getProductConfig(): Promise<ProductConfig>
  /**
   * Write the product config.
   *
   * @param existSkip - If the file exists, skip writing. Defaults to `false`.
   */
  writeDefaultProductConfig(existSkip?: boolean): Promise<void>
  /**
   * Get the operating system.
   */
  getOS(): OS
  /**
   * Get the architecture.
   */
  getArch(): Arch
  /**
   * Check if the emulator is compatible with current image manager.
   */
  isCompatible(): Promise<boolean>
}

class ImageManagerImpl implements ImageManager {
  constructor(private readonly resolvedOptions: ResolvedImageManagerOptions) {}

  getOptions(): ResolvedImageManagerOptions {
    return this.resolvedOptions
  }

  getOS(): OS {
    switch (this.resolvedOptions.process.platform) {
      case 'win32':
        return 'windows'
      case 'darwin':
        return 'mac'
      default:
        return 'linux'
    }
  }

  getArch(): Arch {
    if (this.resolvedOptions.process.arch.toLowerCase().includes('arm'))
      return 'arm64'
    return 'x86'
  }

  async getImages(supportVersion: string = '6.0-hos-single-9'): Promise<Image[]> {
    const response = await axios.post('https://devecostudio-drcn.deveco.dbankcloud.com/sdkmanager/v8/hos/getSdkList', {
      osArch: this.getArch(),
      osType: this.getOS(),
      supportVersion,
    })
    if (!Array.isArray(response.data))
      return []

    const images: Image[] = []

    for (const responseItem of response.data) {
      const resolvedFsPath = this.resolvedOptions.path.resolve(this.resolvedOptions.imageBasePath, ...responseItem.path.split(','))

      if (this.resolvedOptions.fs.existsSync(resolvedFsPath) && this.resolvedOptions.fs.statSync(resolvedFsPath).isDirectory()) {
        images.push(new LocalImageImpl(responseItem, this, resolvedFsPath))
      }
      else {
        images.push(new RemoteImageImpl(responseItem, this, resolvedFsPath))
      }
    }

    return images
  }

  async getProductConfig(): Promise<ProductConfig> {
    const productConfigPath = this.resolvedOptions.path.resolve(this.resolvedOptions.imageBasePath, 'productConfig.json')
    if (!this.resolvedOptions.fs.existsSync(productConfigPath) || !this.resolvedOptions.fs.statSync(productConfigPath).isFile()) {
      const productConfig = await import('./default-product-config')
      return productConfig.default
    }

    return JSON.parse(this.resolvedOptions.fs.readFileSync(productConfigPath, 'utf-8'))
  }

  async writeDefaultProductConfig(existSkip = false): Promise<void> {
    const productConfigPath = this.resolvedOptions.path.resolve(this.resolvedOptions.imageBasePath, 'productConfig.json')
    if (existSkip && this.resolvedOptions.fs.existsSync(productConfigPath))
      return
    this.resolvedOptions.fs.writeFileSync(productConfigPath, JSON.stringify((await import('./default-product-config')).default, null, 2))
  }

  async isCompatible(): Promise<boolean> {
    const { fs, path, emulatorPath } = this.resolvedOptions
    const sdkPkgPath = path.resolve(emulatorPath, 'sdk-pkg.json')
    if (!fs.existsSync(sdkPkgPath) || !fs.statSync(sdkPkgPath).isFile())
      return false
    const sdkPkg = JSON.parse(fs.readFileSync(sdkPkgPath, 'utf-8'))
    if (!sdkPkg?.data?.version || typeof sdkPkg.data.version !== 'string')
      return false
    const [major, minor, patch] = sdkPkg.data.version.split('.').map(Number)
    return satisfies(`${major}.${minor}.${patch}`, '>=6.0.2')
  }
}

export async function createImageManager(options: ImageManagerOptions = {}): Promise<ImageManager> {
  const resolvedOptions = await resolveImageManagerOptions(options)
  return new ImageManagerImpl(resolvedOptions)
}
