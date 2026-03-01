import type { SerializableContent } from '../../common/serializable-content'
import { SerializableContentImpl } from '../../common/serializable-content'
import { EmulatorFile } from './emulator'
import { EmulatorBasicItem, EmulatorBasicItemImpl } from './emulator-basic-item'
import { EmulatorFoldItem, EmulatorFoldItemImpl } from './emulator-fold-item'
import { EmulatorTripleFoldItem, EmulatorTripleFoldItemImpl } from './emulator-triplefold-item'

export interface EmulatorGroupItem extends SerializableContent<EmulatorGroupItem.Content> {
  getEmulatorFile(): EmulatorFile
  getChildren(): EmulatorFile.DeviceItem[]
}

export namespace EmulatorGroupItem {
  export type DeviceType = 'phone_all' | 'pc_all'
  export type DeviceTypeWithString = DeviceType | (string & {})

  export interface Content {
    readonly name: string
    readonly deviceType: DeviceTypeWithString
    readonly api: number
    readonly children: EmulatorFile.ItemContent[]
  }

  export function is(value: unknown): value is EmulatorGroupItem {
    return value instanceof EmulatorGroupItemImpl
  }

  export function isContent(value: unknown): value is EmulatorGroupItem.Content {
    return typeof value === 'object'
      && value !== null
      && 'name' in value
      && 'deviceType' in value
      && 'api' in value
      && 'children' in value
      && Array.isArray(value.children)
      && value.children.every(EmulatorFile.isItemContent)
  }
}

export class EmulatorGroupItemImpl extends SerializableContentImpl<EmulatorGroupItem.Content> implements EmulatorGroupItem {
  constructor(
    private readonly emulatorFile: EmulatorFile,
    protected readonly content: EmulatorGroupItem.Content,
  ) {
    super(emulatorFile.getImageManager(), content)
  }

  getEmulatorFile(): EmulatorFile {
    return this.emulatorFile
  }

  getChildren(): EmulatorFile.DeviceItem[] {
    // eslint-disable-next-line array-callback-return
    return this.getContent().children.map((children) => {
      if (EmulatorBasicItem.isContent(children)) {
        return new EmulatorBasicItemImpl(this.emulatorFile, children)
      }
      else if (EmulatorFoldItem.isContent(children)) {
        return new EmulatorFoldItemImpl(this.emulatorFile, children)
      }
      else if (EmulatorTripleFoldItem.isContent(children)) {
        return new EmulatorTripleFoldItemImpl(this.emulatorFile, children)
      }
    }).filter(Boolean) as EmulatorFile.DeviceItem[]
  }
}
