import type { EmulatorFile } from '../configs'
import type { ImageManager } from '../image-manager'
import type { BaseSerializable, Serializable } from '../types'
import type { Image } from './image'

export interface BaseImage extends Serializable<BaseImage.Serializable> {
  /**
   * The type of the image.
   */
  readonly imageType: 'local' | 'remote'
  /**
   * Get the image manager.
   */
  getImageManager(): ImageManager
  /**
   * Get the relative path of the image.
   */
  getRelativePath(): Image.RelativePath
  /**
   * Get the full path of the image.
   */
  getFullPath(): import('vscode-uri').URI
  /**
   * Check if the image is downloaded.
   */
  isDownloaded(): Promise<boolean>
  /**
   * Get the API version of the image.
   */
  getApiVersion(): number
  /**
   * Get the device type of the image.
   */
  getFullDeviceType(): EmulatorFile.FullDeviceTypeWithString
}

export interface BaseImageOptions {
  imageManager: ImageManager
  relativePath: Image.RelativePath
  apiVersion: number
}

export namespace BaseImage {
  export interface Serializable extends BaseSerializable<BaseImage> {
    imageType: 'local' | 'remote'
  }

  export function is(value: unknown): value is BaseImage {
    return value instanceof BaseImageImpl
  }
}

export abstract class BaseImageImpl implements BaseImage {
  constructor(private readonly options: BaseImageOptions) {}

  abstract imageType: 'local' | 'remote'

  getImageManager(): ImageManager {
    return this.options.imageManager
  }

  getRelativePath(): Image.RelativePath {
    return this.options.relativePath
  }

  getFullPath(): import('vscode-uri').URI {
    const { imageBasePath, adapter: { join } } = this.getImageManager().getOptions()
    return join(imageBasePath, this.getRelativePath())
  }

  getApiVersion(): number {
    return this.options.apiVersion
  }

  abstract getFullDeviceType(): EmulatorFile.FullDeviceTypeWithString

  async isDownloaded(): Promise<boolean> {
    try {
      const localImages = await this.getImageManager().getLocalImages()
      return localImages.some(localImage => localImage.getFullPath().toString() === this.getFullPath().toString())
    }
    catch {
      return false
    }
  }

  toJSON(): BaseImage.Serializable {
    return {
      imageType: this.imageType,
      imageManager: this.getImageManager().toJSON(),
      relativePath: this.getRelativePath(),
      fullPath: this.getFullPath().toJSON(),
      apiVersion: this.getApiVersion(),
      fullDeviceType: this.getFullDeviceType(),
    }
  }
}
