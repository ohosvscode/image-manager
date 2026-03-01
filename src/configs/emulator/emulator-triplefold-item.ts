import type { SerializableContent } from '../../common/serializable-content'
import type { EmulatorFile } from './emulator'
import type { EmulatorBasicItem } from './emulator-basic-item'
import { SerializableContentImpl } from '../../common/serializable-content'

export interface EmulatorTripleFoldItem extends SerializableContent<EmulatorTripleFoldItem.Content> {
  getEmulatorFile(): EmulatorFile
}

export namespace EmulatorTripleFoldItem {
  export type DeviceType = 'triplefold'
  export type DeviceTypeWithString = DeviceType

  export interface Content extends Omit<EmulatorBasicItem.Content, 'deviceType'> {
    readonly deviceType: DeviceType
    readonly singleResolutionWidth: number
    readonly singleResolutionHeight: number
    readonly singleDiagonalSize: number
    readonly doubleResolutionWidth: number
    readonly doubleResolutionHeight: number
    readonly doubleDiagonalSize: number
  }

  export function is(value: unknown): value is EmulatorTripleFoldItem {
    return value instanceof EmulatorTripleFoldItemImpl
  }

  export function isDeviceType(value: unknown): value is DeviceType {
    return value === 'triplefold'
  }

  export function isContent(value: unknown): value is Content {
    return typeof value === 'object' && value !== null && 'name' in value && 'deviceType' in value && isDeviceType(value.deviceType)
  }
}

export class EmulatorTripleFoldItemImpl extends SerializableContentImpl<EmulatorTripleFoldItem.Content> implements EmulatorTripleFoldItem {
  constructor(
    private readonly emulatorFile: EmulatorFile,
    protected readonly content: EmulatorTripleFoldItem.Content,
  ) {
    super(emulatorFile.getImageManager(), content)
  }

  getEmulatorFile(): EmulatorFile {
    return this.emulatorFile
  }
}
