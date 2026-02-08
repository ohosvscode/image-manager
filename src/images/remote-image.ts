import type { Stringifiable } from '../types'
import type { BaseImage } from './image'
import { ImageBase } from './image'

export interface RemoteImage extends BaseImage, Stringifiable<RemoteImage.Stringifiable> {
  imageType: 'remote'
}

export namespace RemoteImage {
  export interface Stringifiable extends Omit<BaseImage.Stringifiable, 'imageType'> {
    imageType: 'remote'
  }
}

export class RemoteImageImpl extends ImageBase<RemoteImage.Stringifiable> implements RemoteImage {
  imageType = 'remote' as const

  toJSON(): RemoteImage.Stringifiable {
    return super.toJSON()
  }
}
