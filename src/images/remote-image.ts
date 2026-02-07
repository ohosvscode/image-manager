import type { Stringifiable } from '../types'
import type { BaseImage } from './image'
import { ImageBase } from './image'

export interface RemoteImage extends BaseImage, Stringifiable<RemoteImage.Stringifiable> {
  imageType: 'remote'
}

export namespace RemoteImage {
  export interface Stringifiable {
    imageType: 'remote'
    path: string
    apiVersion: string
    checksum: string
  }
}

export class RemoteImageImpl extends ImageBase<RemoteImage.Stringifiable> implements RemoteImage {
  imageType = 'remote' as const

  toJSON(): RemoteImage.Stringifiable {
    return {
      imageType: this.imageType,
      path: this.getPath(),
      apiVersion: this.getApiVersion(),
      checksum: this.getChecksum(),
    }
  }
}
