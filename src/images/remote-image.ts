import type { EmulatorFile } from '../configs'
import type { ImageDownloader } from '../image-downloader'
import type { ImageManager } from '../image-manager'
import type { SDKList } from '../sdk-list'
import type { BaseSerializable, Serializable } from '../types'
import type { BaseImage } from './base-image'
import type { Image } from './image'
import type { LocalImage } from './local-image'
import { RemoteImageRequestError } from '../errors/request-error'
import { ImageDownloaderImpl } from '../image-downloader'
import { BaseImageImpl } from './base-image'

export interface RemoteImage extends Serializable<RemoteImage.Serializable>, Omit<BaseImage, 'toJSON'> {
  readonly imageType: 'remote'
  /**
   * Get the remote image SDK.
   *
   * @returns The remote image SDK.
   */
  getRemoteImageSDK(): SDKList.OptionalRemoteImageSDK
  /**
   * Get the local image if it is already downloaded.
   *
   * @param force - If `true` will reload the local image from the image manager and file system again. Default is `false`.
   * @returns The local image if it is already downloaded, otherwise `undefined`.
   */
  getLocalImage(force?: boolean): Promise<LocalImage | undefined>
  /**
   * Create a downloader for the remote image.
   *
   * @param signals - The signals to abort the download.
   */
  createDownloader(signals?: AbortController): Promise<ImageDownloader>
}

export namespace RemoteImage {
  export interface Serializable extends BaseImage.Serializable, Omit<BaseSerializable<RemoteImage>, 'imageManager'> {}

  export function is(value: unknown): value is RemoteImage {
    return value instanceof RemoteImageImpl
  }
}

export class RemoteImageImpl extends BaseImageImpl implements RemoteImage {
  readonly imageType = 'remote'

  constructor(
    protected readonly imageManager: ImageManager,
    private readonly remoteImageSDK: SDKList.OptionalRemoteImageSDK = {},
  ) {
    super({
      imageManager,
      relativePath: remoteImageSDK.path?.split(',').join('/') as Image.RelativePath ?? '',
      apiVersion: remoteImageSDK.apiVersion ? Number.parseInt(remoteImageSDK.apiVersion) : 0,
    })
  }

  getRemoteImageSDK(): SDKList.OptionalRemoteImageSDK {
    return this.remoteImageSDK
  }

  getFullDeviceType(): EmulatorFile.FullDeviceTypeWithString {
    const displayName = this.getRemoteImageSDK().displayName
    const name = displayName?.split('-')
    return name?.[name.length - 1] as EmulatorFile.FullDeviceTypeWithString
  }

  private _localImage?: LocalImage | undefined

  async getLocalImage(force: boolean = false): Promise<LocalImage | undefined> {
    if (!force && this._localImage) return this._localImage
    const localImages = await this.getImageManager().getLocalImages()
    this._localImage = localImages.find(localImage => localImage.getFullPath().toString() === this.getFullPath().toString())
    return this._localImage
  }

  async createDownloader(signals?: AbortController): Promise<ImageDownloader> {
    const { adapter: { axios, isAxiosError } } = this.imageManager.getOptions()

    try {
      const response = await axios.post('https://devecostudio-drcn.deveco.dbankcloud.com/sdkmanager/v7/hos/download', {
        osArch: this.getImageManager().getArch(),
        osType: this.getImageManager().getOperatingSystem(),
        path: {
          path: this.getRemoteImageSDK().path,
          version: this.getRemoteImageSDK().version,
        },
        // I don't know what this is but it's required when downloading some images
        // e.g. path: system-image,HarmonyOS-5.0.1,phone_arm, version: 5.0.0.112 (API13) must be provided
        // It seem like a UUID and not like a real IMEI
        imei: 'd490a470-8719-4baf-9cc4-9c78d40d',
      })
      if (typeof response.data?.url !== 'string') throw new RemoteImageRequestError(response.data?.body, response.data?.code)
      return new ImageDownloaderImpl(this, response.data.url, signals)
    }
    catch (error) {
      if (isAxiosError(error)) throw new RemoteImageRequestError(error.message, Number(error.code), error)
      if (error instanceof Error) throw new RemoteImageRequestError(error.message, -1, error)
      throw new RemoteImageRequestError('Unknown request error.', -1, error)
    }
  }

  toJSON(): RemoteImage.Serializable {
    return {
      ...super.toJSON(),
      remoteImageSDK: this.getRemoteImageSDK(),
    }
  }
}
