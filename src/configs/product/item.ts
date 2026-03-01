import type { SerializableContent } from '../../common/serializable-content'
import type { BaseSerializable, Serializable } from '../../types'
import type { ProductConfigFile } from './product'
import { SerializableContentImpl } from '../../common/serializable-content'

export interface ProductConfigItem<
  DeviceType extends ProductConfigFile.DeviceType = ProductConfigFile.DeviceType,
  Name extends ProductConfigFile.GenericContent<DeviceType>['name'] = ProductConfigFile.GenericContent<DeviceType>['name'],
> extends Serializable<ProductConfigItem.Serializable>, Omit<SerializableContent<ProductConfigFile.GenericContent<DeviceType, Name>>, 'toJSON'> {
  /**
   * Get the product config file of the product.
   *
   * @returns The product config file of the product.
   */
  getProductConfigFile(): ProductConfigFile
  /**
   * Get the camel-case device type of the product.
   *
   * @returns The camel-case device type of the product.
   */
  getDeviceType(): DeviceType
  /**
   * Get the dev model of the product.
   *
   * - `Phone` → `PHEMU-FD00`
   * - `Foldable` → `PHEMU-FD01`
   * - `WideFold` → `PHEMU-FD02`
   * - `TripleFold` → `PHEMU-FD06`
   * - `2in1 Foldable` → `PCEMU-FD05`
   * - `Wearable` → `MCHEMU-AL00CN`
   *
   * Other cases will return `undefined`. It is very important to emulator to identify the device type.
   * If the dev model is no correct the emulator screen and features maybe have some problems (e.g. the
   * screen width and height is not correct、the foldable screen cannot be folded, etc.).
   */
  getDevModel(): ProductConfigItem.DevModelWithString | undefined
}

export namespace ProductConfigItem {
  export type Customize = 'Customize'

  export type PhoneName = 'nova 15 Pro、nova 15 Ultra'
    | 'nova 15'
    | 'Mate 80 Pro Max、Mate 80 RS'
    | 'Mate 80、Mate 80 Pro'
    | 'Mate 70 Pro、Mate 70 Pro+、Mate 70 RS'
    | 'Mate 70'
    | 'Mate 70 Air'
    | 'Mate 60 Pro、Mate 60 Pro+、Mate 60 RS'
    | 'Mate 60'
    | 'Pura 80 Pro、Pura 80 Pro+、Pura 80 Ultra'
    | 'Pura 80'
    | 'Pura 70 Pro、Pura 70 Pro+、Pura 70 Ultra'
    | 'Pura 70'
    | 'nova 14 Ultra'
    | 'nova 14 Pro'
    | 'nova 14'
    | 'nova 13 Pro'
    | 'nova 13'
    | 'nova 12 Pro、nova 12 Ultra'
    | 'nova 12'
    | 'Pocket 2'
    | 'nova flip、nova flip S'

  export type TabletName = 'MatePad Pro 11'
    | 'MatePad Pro 12'
    | 'MatePad Pro 13'
    | 'MatePad 11 S'
    | 'MatePad Air 12'

  export type TwoInOneName = 'MateBook Pro'

  export type FoldableName = 'Mate X5'
    | 'Mate X6'
    | 'Mate X7'

  export type WideFoldName = 'Pura X'

  export type TripleFoldName = 'Mate XT'

  export type TVName = 'TV'

  export type WearableName = 'Wearable'

  export type WearableKidName = 'WearableKid'

  export type TwoInOneFoldableName = 'MateBook Fold'

  export type Name
    = | PhoneName
      | TabletName
      | TwoInOneName
      | FoldableName
      | WideFoldName
      | TripleFoldName
      | TVName
      | WearableName
      | TwoInOneFoldableName
      | WearableKidName
      | Customize

  export type NameWithString = Name | (string & {})

  export interface BaseContent {
    /**
     * The name of the product.
     */
    readonly name: NameWithString
    /**
     * The screen width of the product.
     */
    readonly screenWidth: string
    /**
     * The screen height of the product.
     */
    readonly screenHeight: string
    /**
     * The screen diagonal of the product.
     */
    readonly screenDiagonal: string
    /**
     * The screen density of the product.
     */
    readonly screenDensity: string
    /**
     * Whether the product is visible.
     */
    readonly visible: boolean
    /**
     * The dev model of the product.
     */
    readonly devModel?: string
  }

  export interface BaseFoldContent extends BaseContent {
    /**
     * The name of the product.
     */
    readonly name: FoldableName | WideFoldName | TripleFoldName | TwoInOneFoldableName | Customize
    /**
     * The outer screen width of the product.
     */
    readonly outerScreenWidth: string
    /**
     * The outer screen height of the product.
     */
    readonly outerScreenHeight: string
    /**
     * The outer screen diagonal of the product.
     */
    readonly outerScreenDiagonal: string
  }

  export interface PhoneContent extends BaseContent {
    /**
     * The name of the product.
     */
    readonly name: PhoneName | Customize
    /**
     * The one cutout path of the product.
     */
    readonly oneCutoutPath?: string
  }

  export interface TabletContent extends BaseContent {
    /**
     * The name of the product.
     */
    readonly name: TabletName | Customize
  }

  export interface TwoInOneContent extends BaseContent {
    /**
     * The name of the product.
     */
    readonly name: TwoInOneName | Customize
  }

  export interface FoldableContent extends BaseFoldContent {
    /**
     * The name of the product.
     */
    readonly name: FoldableName | Customize
  }

  export interface WideFoldContent extends BaseFoldContent {
    /**
     * The name of the product.
     */
    readonly name: WideFoldName
    /**
     * The outer screen width of the product.
     */
    readonly outerScreenWidth: string
    /**
     * The outer screen height of the product.
     */
    readonly outerScreenHeight: string
    /**
     * The outer screen diagonal of the product.
     */
    readonly outerScreenDiagonal: string
  }

  export interface TripleFoldContent extends BaseFoldContent {
    /**
     * The name of the product.
     */
    readonly name: TripleFoldName
    /**
     * The outer screen height of the product.
     */
    readonly outerDoubleScreenWidth: string
    /**
     * The outer double screen height of the product.
     */
    readonly outerDoubleScreenHeight: string
    /**
     * The outer double screen diagonal of the product.
     */
    readonly outerDoubleScreenDiagonal: string
  }

  export interface TwoInOneFoldableContent extends BaseFoldContent {
    /**
     * The name of the product.
     */
    readonly name: TwoInOneFoldableName
  }

  export interface TVContent extends BaseContent {
    /**
     * The name of the product.
     */
    readonly name: TVName
  }

  export interface WearableContent extends BaseContent {
    /**
     * The name of the product.
     */
    readonly name: WearableName
  }

  export interface WearableKidContent extends BaseContent {
    /**
     * The name of the product.
     */
    readonly name: WearableKidName
  }

  export type Content
    = | PhoneContent
      | TabletContent
      | TwoInOneContent
      | FoldableContent
      | WideFoldContent
      | TripleFoldContent
      | TwoInOneFoldableContent
      | TVContent
      | WearableContent
      | WearableKidContent

  export interface Serializable extends BaseSerializable<ProductConfigItem> {}

  export type DevModel
    = 'MCHEMU-AL00CN' // Wearable
      | 'PHEMU-FD00' // Phone
      | 'PHEMU-FD01' // Foldable
      | 'PHEMU-FD02' // WideFold
      | 'PCEMU-FD05' // 2in1 Foldable (Foldable)
      | 'PHEMU-FD06' // TripleFold

  export type DevModelWithString = DevModel | (string & {})

  export function is(value: unknown): value is ProductConfigItem {
    return value instanceof ProductConfigItemImpl
  }
}

export class ProductConfigItemImpl<
  DeviceType extends ProductConfigFile.DeviceType = ProductConfigFile.DeviceType,
  Name extends ProductConfigFile.GenericContent<DeviceType>['name'] = ProductConfigFile.GenericContent<DeviceType>['name'],
> extends SerializableContentImpl<ProductConfigFile.GenericContent<DeviceType, Name>> implements ProductConfigItem<DeviceType, Name> {
  constructor(
    private readonly productConfigFile: ProductConfigFile,
    protected readonly content: ProductConfigFile.GenericContent<DeviceType, Name>,
    private readonly deviceType: DeviceType,
  ) {
    super(productConfigFile.getImageManager(), content)
  }

  getProductConfigFile(): ProductConfigFile {
    return this.productConfigFile
  }

  getDeviceType(): DeviceType {
    return this.deviceType
  }

  async serialize(): Promise<string> {
    return JSON.stringify(this.getContent(), null, 2)
  }

  getDevModel(): ProductConfigItem.DevModelWithString | undefined {
    switch (this.getDeviceType()) {
      case 'Phone':
      case '2in1':
        return 'PHEMU-FD00'
      case 'Foldable':
        return 'PHEMU-FD01'
      case 'WideFold':
        return 'PHEMU-FD02'
      case 'TripleFold':
        return 'PHEMU-FD06'
      case '2in1 Foldable':
        return 'PCEMU-FD05'
      case 'Wearable':
        return 'MCHEMU-AL00CN'
    }
  }

  toJSON(): ProductConfigItem.Serializable {
    return {
      imageManager: this.getImageManager().toJSON(),
      content: this.getContent(),
      devModel: this.getDevModel(),
      deviceType: this.getDeviceType(),
      productConfigFile: this.getProductConfigFile().toJSON(),
    }
  }
}
