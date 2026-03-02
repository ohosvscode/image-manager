import type { SerializableFile } from '../../common/serializable-file'
import type { BaseSerializable, Serializable } from '../../types'
import { SerializableFileImpl } from '../../common/serializable-file'
import { EmulatorBasicItem, EmulatorBasicItemImpl } from './emulator-basic-item'
import { EmulatorFoldItem, EmulatorFoldItemImpl } from './emulator-fold-item'
import { EmulatorTripleFoldItem, EmulatorTripleFoldItemImpl } from './emulator-triplefold-item'
import { EmulatorGroupItem, EmulatorGroupItemImpl } from './group-item'

export interface EmulatorFile extends Serializable<EmulatorFile.Serializable>, Omit<SerializableFile, 'toJSON'> {
  findDeviceItems<DeviceType extends EmulatorFile.DeviceType>(options?: EmulatorFile.FindDeviceItemOptions<DeviceType extends EmulatorGroupItem.DeviceType ? never : DeviceType>): EmulatorFile.DeviceItem[]
  findDeviceItem<DeviceType extends EmulatorFile.DeviceType>(options?: EmulatorFile.FindDeviceItemOptions<DeviceType extends EmulatorGroupItem.DeviceType ? never : DeviceType>): EmulatorFile.DeviceItem | undefined
  findItems(options?: EmulatorFile.FindItemOptions): EmulatorFile.Item[]
  findItem(options?: EmulatorFile.FindItemOptions): EmulatorFile.Item | undefined
  getItems(): EmulatorFile.Item[]
  getDeviceItems(): EmulatorFile.DeviceItem[]
}

export namespace EmulatorFile {
  export interface Serializable extends Omit<BaseSerializable<EmulatorFile>, 'imageManager'> {}
  export type ItemContent = EmulatorBasicItem.Content | EmulatorFoldItem.Content | EmulatorTripleFoldItem.Content
  export type Content = Array<ContentItem>
  export type ContentItem = EmulatorGroupItem.Content | ItemContent
  export type DeviceItem = EmulatorBasicItem | EmulatorFoldItem | EmulatorTripleFoldItem
  export type Item = EmulatorGroupItem | DeviceItem
  export type DeviceType = EmulatorBasicItem.DeviceType | EmulatorFoldItem.DeviceType | EmulatorTripleFoldItem.DeviceType
  export type DeviceTypeWithString = DeviceType | (string & {})
  export type FullDeviceType = DeviceType | EmulatorGroupItem.DeviceType
  export type FullDeviceTypeWithString = FullDeviceType | (string & {})

  export function is(value: unknown): value is EmulatorFile {
    return value instanceof EmulatorFileImpl
  }

  export function isItemContent(value: unknown): value is EmulatorFile.ItemContent {
    return typeof value === 'object'
      && value !== null
      && (EmulatorBasicItem.isContent(value) || EmulatorFoldItem.isContent(value) || EmulatorTripleFoldItem.isContent(value))
  }

  export function isContentItem(value: unknown): value is EmulatorFile.ContentItem {
    return typeof value === 'object'
      && value !== null
      && (EmulatorGroupItem.isContent(value) || EmulatorFile.isItemContent(value))
  }

  export interface FindDeviceItemOptions<DeviceType extends DeviceTypeWithString = DeviceTypeWithString> {
    /**
     * The API version to find.
     */
    readonly apiVersion?: number
    /**
     * The device type to find.
     */
    readonly deviceType?: DeviceType
  }

  export interface FindItemOptions {
    /**
     * The API version to find.
     */
    readonly apiVersion?: number
    /**
     * The device type to find.
     */
    readonly fullDeviceType?: FullDeviceTypeWithString
  }
}

export class EmulatorFileImpl extends SerializableFileImpl<EmulatorFile.Content> implements EmulatorFile {
  async serialize(): Promise<string> {
    return JSON.stringify(this.getContent(), null, 2)
  }

  async write(): Promise<void> {
    const { emulatorPath, adapter: { join } } = this.getImageManager().getOptions()
    return this.writeToFileSystem(join(emulatorPath, 'emulator.json'))
  }

  getItems(): EmulatorFile.Item[] {
    // eslint-disable-next-line array-callback-return
    return this.getContent().map((item) => {
      if (EmulatorGroupItem.isContent(item)) {
        return new EmulatorGroupItemImpl(this, item)
      }
      else if (EmulatorFile.isItemContent(item)) {
        if (EmulatorBasicItem.isContent(item)) {
          return new EmulatorBasicItemImpl(this, item)
        }
        else if (EmulatorFoldItem.isContent(item)) {
          return new EmulatorFoldItemImpl(this, item)
        }
        else if (EmulatorTripleFoldItem.isContent(item)) {
          return new EmulatorTripleFoldItemImpl(this, item)
        }
      }
    }).filter(Boolean) as EmulatorFile.Item[]
  }

  getDeviceItems(items: EmulatorFile.DeviceItem[] = []): EmulatorFile.DeviceItem[] {
    for (const item of this.getItems()) {
      if (EmulatorBasicItem.is(item)) {
        items.push(item)
      }
      else if (EmulatorFoldItem.is(item)) {
        items.push(item)
      }
      else if (EmulatorTripleFoldItem.is(item)) {
        items.push(item)
      }
      else {
        this.getDeviceItems(item.getChildren())
      }
    }
    return items
  }

  findDeviceItems(options: EmulatorFile.FindDeviceItemOptions = {}): EmulatorFile.DeviceItem[] {
    const items: EmulatorFile.DeviceItem[] = []

    const pushDeviceItem = (item: EmulatorFile.DeviceItem) => {
      if (EmulatorBasicItem.is(item)) {
        if ((options.apiVersion && item.getContent().api === options.apiVersion) && (options.deviceType && item.getContent().deviceType === options.deviceType)) {
          items.push(item)
        }
      }
      else if (EmulatorFoldItem.is(item)) {
        if ((options.apiVersion && item.getContent().api === options.apiVersion) && (options.deviceType && item.getContent().deviceType === options.deviceType)) {
          items.push(item)
        }
      }
      else if (EmulatorTripleFoldItem.is(item)) {
        if ((options.apiVersion && item.getContent().api === options.apiVersion) && (options.deviceType && item.getContent().deviceType === options.deviceType)) {
          items.push(item)
        }
      }
    }

    for (const item of this.getItems()) {
      if (EmulatorGroupItem.is(item)) {
        for (const child of item.getChildren()) {
          pushDeviceItem(child)
        }
      }
      else {
        pushDeviceItem(item)
      }
    }

    return items
  }

  findDeviceItem(options: EmulatorFile.FindDeviceItemOptions = {}): EmulatorFile.DeviceItem | undefined {
    return this.findDeviceItems(options)[0]
  }

  findItems(options: EmulatorFile.FindItemOptions = {}): EmulatorFile.Item[] {
    return this.getItems().filter((item) => {
      if ((options.apiVersion && item.getContent().api === options.apiVersion) && (options.fullDeviceType && item.getContent().deviceType === options.fullDeviceType)) {
        return true
      }
      return false
    })
  }

  findItem(options: EmulatorFile.FindItemOptions = {}): EmulatorFile.Item | undefined {
    return this.findItems(options)[0]
  }

  toJSON(): EmulatorFile.Serializable {
    return {
      ...super.toJSON(),
      deviceItems: this.getDeviceItems().map(item => item.toJSON()),
      items: this.getItems().map(item => item.toJSON()),
    }
  }
}
