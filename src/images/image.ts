import type { ImageDownloader } from '../image-downloader'
import type { ImageManager } from '../image-manager'
import type { DeviceType, SnakecaseDeviceType, Stringifiable } from '../types'
import type { LocalImage, LocalImageImpl } from './local-image'
import type { RemoteImage, RemoteImageImpl } from './remote-image'
import axios from 'axios'
import { RequestUrlError } from '../errors'
import { createImageDownloader } from '../image-downloader'

export interface BaseImage {
  getImageManager(): ImageManager
  getPath(): string
  getArch(): 'arm' | 'x86' | (string & {})
  getChecksum(): string
  getReleaseType(): string
  getVersion(): string
  getApiVersion(): string
  getTargetOS(): string
  getTargetVersion(): string
  getFsPath(): string
  getDeviceType(): DeviceType | (string & {})
  getSnakecaseDeviceType(): SnakecaseDeviceType | (string & {})
  getUrl(): Promise<string | RequestUrlError>
  isDownloaded(): Promise<boolean>
  createDownloader(signal?: AbortSignal): Promise<ImageDownloader<this> | RequestUrlError>
}

export namespace BaseImage {
  export interface Stringifiable {
    imageType: ImageType
    arch: 'arm' | 'x86' | (string & {})
    path: string
    checksum: string
    fsPath: string
    version: string
    apiVersion: string
    targetOS: string
    targetVersion: string
    deviceType: DeviceType | (string & {})
    snakecaseDeviceType: SnakecaseDeviceType | (string & {})
  }
}

export type Image = LocalImage | RemoteImage
export type ImageType = 'local' | 'remote'

export abstract class ImageBase<T extends BaseImage.Stringifiable> implements BaseImage, Stringifiable<T> {
  abstract imageType: ImageType

  constructor(
    private readonly response: any,
    private readonly imageManager: ImageManager,
    private readonly resolvedFsPath: string,
  ) {}

  getImageManager(): ImageManager {
    return this.imageManager
  }

  getArch(): 'arm' | 'x86' | (string & {}) {
    const [,,deviceTypeWithArch] = this.getPath()?.split(',') ?? []
    const split = deviceTypeWithArch?.split('_') ?? []
    return split[split.length - 1]
  }

  getPath(): string {
    return this.response?.path
  }

  getChecksum(): string {
    return this.response?.archive?.complete?.checksum
  }

  getReleaseType(): string {
    return this.response?.releaseType
  }

  getFsPath(): string {
    return this.resolvedFsPath
  }

  async isDownloaded(): Promise<boolean> {
    return this.imageManager.getOptions().fs.existsSync(this.getFsPath()) && this.imageManager.getOptions().fs.statSync(this.getFsPath()).isDirectory()
  }

  getVersion(): string {
    return this.response?.version
  }

  getApiVersion(): string {
    return this.response?.apiVersion
  }

  getTargetOS(): string {
    const [,systemNameWithVersion] = this.getPath()?.split(',') ?? []
    const [systemName] = systemNameWithVersion?.split('-') ?? []
    return systemName ?? ''
  }

  getTargetVersion(): string {
    const [,systemNameWithVersion] = this.getPath()?.split(',') ?? []
    const [, version] = systemNameWithVersion?.split('-') ?? []
    return version ?? ''
  }

  getDeviceType(): DeviceType | (string & {}) {
    const [,,deviceTypeWithArch] = this.getPath()?.split(',') ?? []
    const [deviceType] = deviceTypeWithArch?.split('_') ?? []
    return deviceType ?? ''
  }

  getSnakecaseDeviceType(): SnakecaseDeviceType | (string & {}) {
    const deviceType = this.getDeviceType()
    if (deviceType === 'pc')
      return '2in1_foldable'
    return deviceType.toLowerCase()
  }

  async createDownloader(): Promise<ImageDownloader<this> | RequestUrlError> {
    const url = await this.getUrl()
    if (url instanceof RequestUrlError)
      return url
    return createImageDownloader(this as LocalImageImpl | RemoteImageImpl, url) as ImageDownloader<this>
  }

  async getUrl(): Promise<string | RequestUrlError> {
    try {
      const response = await axios.post('https://devecostudio-drcn.deveco.dbankcloud.com/sdkmanager/v7/hos/download', {
        osArch: this.imageManager.getArch(),
        osType: this.imageManager.getOS(),
        path: {
          path: this.getPath(),
          version: this.getVersion(),
        },
        // I don't know what this is but it's required when downloading some images
        // e.g. path: system-image,HarmonyOS-5.0.1,phone_arm, version: 5.0.0.112 (API13) must be provided
        // It seem like a UUID and not like a real IMEI
        imei: 'd490a470-8719-4baf-9cc4-9c78d40d',
      })
      if (typeof response.data?.url !== 'string')
        return new RequestUrlError(response.data?.body, response.data?.code)
      return response.data.url
    }
    catch (error) {
      return new RequestUrlError(error.message, error.code, error)
    }
  }

  toJSON(): T {
    return {
      imageType: this.imageType,
      arch: this.getArch(),
      path: this.getPath(),
      checksum: this.getChecksum(),
      fsPath: this.getFsPath(),
      version: this.getVersion(),
      apiVersion: this.getApiVersion(),
      targetOS: this.getTargetOS(),
      targetVersion: this.getTargetVersion(),
      deviceType: this.getDeviceType(),
      snakecaseDeviceType: this.getSnakecaseDeviceType(),
    } as T
  }
}
