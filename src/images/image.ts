import { LocalImage } from './local-image'
import { RemoteImage } from './remote-image'

export type Image = LocalImage | RemoteImage

export namespace Image {
  export type RelativePath = `system-image/${string}/${string}`

  export function is(value: unknown): value is Image {
    return LocalImage.is(value) || RemoteImage.is(value)
  }
}
