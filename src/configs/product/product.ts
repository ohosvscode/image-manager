import type { SerializableFile } from '../../common'
import type { BaseSerializable, Serializable } from '../../types'
import type { ProductConfigItem } from './item'
import { SerializableFileImpl } from '../../common/serializable-file'
import { ProductConfigItemImpl } from './item'

export interface ProductConfigFile extends Serializable<ProductConfigFile.Serializable>, Omit<SerializableFile, 'toJSON'> {
  /**
   * Find the product config items by the options.
   *
   * @param options - The options to find the product config items.
   * @template DeviceType - The device type to find. Example: `Foldable`, `Phone`.
   * @template Name - The name to find. Example: `Mate X7`, `Customize`.
   * @template OtherName - The name to find from other device types. Example: `nova 15 Pro、nova 15 Ultra`, `Customize`.
   * @description The name is strictly matched with the name in the `productConfig.json` file,
   * so if your device type and name are not corresponding, you will get a type error on the `name` property.
   * Sometimes there are some device names that the library hasn't adapted yet, you can still define it in the `name` property,
   * and it will not trigger a type error. Only when your device name and device type do not correspond to the library, will it trigger a type error.
   *
   * It is useful to prevent you from using the wrong name.
   * @returns The product config items.
   */
  findProductConfigItems<
    DeviceType extends ProductConfigFile.DeviceType = ProductConfigFile.DeviceType,
    Name extends ProductConfigFile.GenericContent<DeviceType>['name'] = ProductConfigFile.GenericContent<DeviceType>['name'],
    OtherName extends ProductConfigFile.OtherDeviceTypeNames<DeviceType> = ProductConfigFile.OtherDeviceTypeNames<DeviceType>,
  >(options: ProductConfigFile.FindOptions<DeviceType, Name, OtherName>): ProductConfigItem<DeviceType, Name>[]
  /**
   * Find the product config item by the options.
   *
   * @param options - The options to find the product config item.
   * @template DeviceType - The device type to find. Example: `Foldable`, `Phone`.
   * @template Name - The name to find. Example: `Mate X7`, `Customize`.
   * @template OtherName - The name to find from other device types. Example: `nova 15 Pro、nova 15 Ultra`, `Customize`.
   * @description The name is strictly matched with the name in the `productConfig.json` file,
   * so if your device type and name are not corresponding, you will get a type error on the `name` property.
   * Sometimes there are some device names that the library hasn't adapted yet, you can still define it in the `name` property,
   * and it will not trigger a type error. Only when your device name and device type do not correspond to the library, will it trigger a type error.
   *
   * It is useful to prevent you from using the wrong name.
   * @returns The product config item. If not found will return `undefined`.
   */
  findProductConfigItem<
    DeviceType extends ProductConfigFile.DeviceType = ProductConfigFile.DeviceType,
    Name extends ProductConfigFile.GenericContent<DeviceType>['name'] = ProductConfigFile.GenericContent<DeviceType>['name'],
    OtherName extends ProductConfigFile.OtherDeviceTypeNames<DeviceType> = ProductConfigFile.OtherDeviceTypeNames<DeviceType>,
  >(options: ProductConfigFile.FindOptions<DeviceType, Name, OtherName>): ProductConfigItem<DeviceType, Name> | undefined
}

export namespace ProductConfigFile {
  export type DeviceType
    = | 'Phone'
      | 'Tablet'
      | '2in1'
      | 'Foldable'
      | 'WideFold'
      | 'TripleFold'
      | '2in1 Foldable'
      | 'TV'
      | 'Wearable'
  export type DeviceTypeWithString = DeviceType | (string & {})

  export type PhoneContent = Record<'Phone', ProductConfigItem.PhoneContent[]>
  export type TabletContent = Record<'Tablet', ProductConfigItem.TabletContent[]>
  export type TwoInOneContent = Record<'2in1', ProductConfigItem.TwoInOneContent[]>
  export type FoldableContent = Record<'Foldable', ProductConfigItem.FoldableContent[]>
  export type WideFoldContent = Record<'WideFold', ProductConfigItem.WideFoldContent[]>
  export type TripleFoldContent = Record<'TripleFold', ProductConfigItem.TripleFoldContent[]>
  export type TwoInOneFoldableContent = Record<'2in1 Foldable', ProductConfigItem.TwoInOneFoldableContent[]>
  export type TVContent = Record<'TV', ProductConfigItem.TVContent[]>
  export type WearableContent = Record<'Wearable', ProductConfigItem.WearableContent[]>
  export type WearableKidContent = Record<'WearableKid', ProductConfigItem.WearableKidContent[]>

  export type Content
    = & PhoneContent
      & TabletContent
      & TwoInOneContent
      & FoldableContent
      & WideFoldContent
      & TripleFoldContent
      & TwoInOneFoldableContent
      & TVContent
      & WearableContent
      & WearableKidContent

  export type GenericContent<
    DeviceType extends ProductConfigFile.DeviceType = ProductConfigFile.DeviceType,
    Name extends ProductConfigItem.NameWithString = Content[DeviceType][number]['name'],
  > = Content[DeviceType][number] extends { name: Name } ? Content[DeviceType][number] : Content[DeviceType][number]

  /** Names from device types other than DeviceType. Used to detect ambiguous names like "Customize". */
  export type OtherDeviceTypeNames<DeviceType extends ProductConfigFile.DeviceType> = Exclude<ProductConfigItem.Name, Content[DeviceType][number]['name']>

  export interface Serializable extends BaseSerializable<ProductConfigFile> {}

  export interface Generic {
    readonly deviceType: DeviceType
    readonly name: ProductConfigItem.NameWithString
  }

  export interface FindOptions<
    DeviceType extends ProductConfigFile.DeviceType = ProductConfigFile.DeviceType,
    Name extends ProductConfigFile.GenericContent<DeviceType>['name'] = ProductConfigFile.GenericContent<DeviceType>['name'],
    OtherName extends OtherDeviceTypeNames<DeviceType> = OtherDeviceTypeNames<DeviceType>,
  > {
    /**
     * The device type to find.
     */
    readonly deviceType?: DeviceType
    /**
     * The name to find.
     *
     * @notes
     *
     * - Known wrong name (from other device type) → `never` (type error)
     * - Known correct name → `Name` or `NameWithString` if ambiguous
     * - Arbitrary string (not in predefined list) → `NameWithString` (allowed)
     */
    readonly name?: Name extends OtherName
      ? never
      : Name extends Content[DeviceType][number]['name']
        ? Name extends OtherName
          ? ProductConfigItem.NameWithString
          : Name
        : ProductConfigItem.NameWithString
  }

  export function is(value: unknown): value is ProductConfigFile {
    return value instanceof ProductConfigFileImpl
  }
}

export class ProductConfigFileImpl extends SerializableFileImpl<ProductConfigFile.Content> implements ProductConfigFile {
  async serialize(): Promise<string> {
    return JSON.stringify(this.getContent(), null, 2)
  }

  async write(): Promise<void> {
    const { imageBasePath, adapter: { join } } = this.getImageManager().getOptions()
    return this.writeToFileSystem(join(imageBasePath, 'productConfig.json'))
  }

  findProductConfigItems<
    DeviceType extends ProductConfigFile.DeviceType = ProductConfigFile.DeviceType,
    Name extends ProductConfigFile.GenericContent<DeviceType>['name'] = ProductConfigFile.GenericContent<DeviceType>['name'],
    OtherName extends ProductConfigFile.OtherDeviceTypeNames<DeviceType> = ProductConfigFile.OtherDeviceTypeNames<DeviceType>,
  >(options: ProductConfigFile.FindOptions<DeviceType, Name, OtherName> = {},
  ): ProductConfigItem<DeviceType, Name>[] {
    const content = this.getContent()
    const items: ProductConfigItem<DeviceType, Name>[] = []

    for (const deviceType of Object.keys(content) as ProductConfigFile.DeviceType[]) {
      if (options.deviceType && deviceType !== options.deviceType) continue
      for (const item of content[deviceType]) {
        if (options.name && item.name !== options.name) continue
        items.push(new ProductConfigItemImpl<DeviceType, Name>(this, item as ProductConfigFile.GenericContent<DeviceType, Name>, deviceType as DeviceType))
      }
    }

    return items
  }

  findProductConfigItem<
    DeviceType extends ProductConfigFile.DeviceType = ProductConfigFile.DeviceType,
    Name extends ProductConfigFile.GenericContent<DeviceType>['name'] = ProductConfigFile.GenericContent<DeviceType>['name'],
    OtherName extends ProductConfigFile.OtherDeviceTypeNames<DeviceType> = ProductConfigFile.OtherDeviceTypeNames<DeviceType>,
  >(options: ProductConfigFile.FindOptions<DeviceType, Name, OtherName> = {},
  ): ProductConfigItem<DeviceType, Name> | undefined {
    return this.findProductConfigItems(options)[0]
  }
}
