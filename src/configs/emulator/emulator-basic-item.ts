import type { SerializableContent } from '../../common/serializable-content'
import type { EmulatorFile } from './emulator'
import { SerializableContentImpl } from '../../common/serializable-content'

export interface EmulatorBasicItem extends SerializableContent<EmulatorBasicItem.Content> {
  getEmulatorFile(): EmulatorFile
}

export namespace EmulatorBasicItem {
  export type DeviceType = '2in1' | 'tablet' | 'tv' | 'wearable' | 'phone'
  export type DeviceTypeWithString = DeviceType | (string & {})

  export interface Content {
    readonly name: string
    readonly deviceType: DeviceType
    readonly resolutionWidth: number
    readonly resolutionHeight: number
    readonly physicalWidth: number
    readonly physicalHeight: number
    readonly diagonalSize: number
    readonly density: number
    readonly memoryRamSize: number
    readonly datadiskSize: number
    readonly procNumber: number
    readonly api: number
  }

  export function is(value: unknown): value is EmulatorBasicItem {
    return value instanceof EmulatorBasicItemImpl
  }

  export function isDeviceType(value: unknown): value is DeviceType {
    return value === '2in1' || value === 'tablet' || value === 'tv' || value === 'wearable' || value === 'phone'
  }

  export function isContent(value: unknown): value is Content {
    return typeof value === 'object'
      && value !== null
      && 'name' in value
      && 'deviceType' in value
      && isDeviceType(value.deviceType)
  }
}

export class EmulatorBasicItemImpl extends SerializableContentImpl<EmulatorBasicItem.Content> implements EmulatorBasicItem {
  constructor(
    private readonly emulatorFile: EmulatorFile,
    protected readonly content: EmulatorBasicItem.Content,
  ) {
    super(emulatorFile.getImageManager(), content)
  }

  getEmulatorFile(): EmulatorFile {
    return this.emulatorFile
  }
}
