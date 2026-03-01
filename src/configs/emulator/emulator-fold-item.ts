import type { SerializableContent } from '../../common/serializable-content'
import type { EmulatorFile } from './emulator'
import type { EmulatorBasicItem } from './emulator-basic-item'
import { SerializableContentImpl } from '../../common/serializable-content'

export interface EmulatorFoldItem extends SerializableContent<EmulatorFoldItem.Content> {
  getEmulatorFile(): EmulatorFile
}

export namespace EmulatorFoldItem {
  export type DeviceType = 'foldable' | '2in1_foldable' | 'triplefold' | 'widefold'

  export interface Content extends Omit<EmulatorBasicItem.Content, 'deviceType'> {
    readonly deviceType: DeviceType
    readonly coverResolutionWidth: number
    readonly coverResolutionHeight: number
    readonly coverDiagonalSize: number
  }

  export function is(value: unknown): value is EmulatorFoldItem {
    return value instanceof EmulatorFoldItemImpl
  }

  export function isDeviceType(value: unknown): value is DeviceType {
    return value === 'foldable' || value === '2in1_foldable' || value === 'triplefold' || value === 'widefold'
  }

  export function isContent(value: unknown): value is Content {
    return typeof value === 'object' && value !== null && 'name' in value && 'deviceType' in value && isDeviceType(value.deviceType)
  }
}

export class EmulatorFoldItemImpl extends SerializableContentImpl<EmulatorFoldItem.Content> implements EmulatorFoldItem {
  constructor(
    private readonly emulatorFile: EmulatorFile,
    protected readonly content: EmulatorFoldItem.Content,
  ) {
    super(emulatorFile.getImageManager(), content)
  }

  getEmulatorFile(): EmulatorFile {
    return this.emulatorFile
  }
}
