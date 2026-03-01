import type { SerializableContent } from '../../common/serializable-content'
import type { BaseSerializable, Serializable } from '../../types'
import type { ProductConfigFile, ProductConfigItem } from '../product'
import type { ListsFile } from './lists'
import { SerializableContentImpl } from '../../common/serializable-content'

export interface ListsFileItem<
  ProductDeviceType extends ProductConfigFile.DeviceType = ProductConfigFile.DeviceType,
  ProductName extends ProductConfigFile.GenericContent<ProductDeviceType>['name'] = ProductConfigFile.GenericContent<ProductDeviceType>['name'],
> extends Serializable<ListsFileItem.Serializable>, Omit<SerializableContent<ListsFileItem.Content<ProductDeviceType, ProductName>>, 'toJSON'> {
  getListsFile(): ListsFile
}

export namespace ListsFileItem {
  export interface Serializable extends BaseSerializable<ListsFileItem> {}

  export type DeviceType
    = | 'phone'
      | 'tablet'
      | '2in1'
      | 'foldable'
      | 'widefold'
      | 'triplefold'
      | '2in1_foldable'
      | 'tv'
      | 'wearable'

  export type DeviceTypeWithString = DeviceType | (string & {})

  export interface Content<
    ProductDeviceType extends ProductConfigFile.DeviceType = ProductConfigFile.DeviceType,
    ProductName extends ProductConfigFile.GenericContent<ProductDeviceType>['name'] = ProductConfigFile.GenericContent<ProductDeviceType>['name'],
  > {
    /**
     * Diagonal size.
     *
     * @example '1.6'
     */
    readonly 'diagonalSize': string
    /**
     * Density.
     *
     * @example '320'
     */
    readonly 'density': string
    /**
     * Resolution height.
     *
     * @example '466'
     */
    readonly 'resolutionHeight': string
    /**
     * Resolution width.
     *
     * @example '466'
     */
    readonly 'resolutionWidth': string
    /**
     * RAM size.
     *
     * @example '4096'
     */
    readonly 'memoryRamSize': string
    /**
     * CPU number.
     *
     * @example '4'
     */
    readonly 'cpuNumber': string
    /**
     * Data disk size.
     *
     * @example '6144'
     */
    readonly 'dataDiskSize': string
    /**
     * Deployed name.
     *
     * @example 'Huawei_Wearable'
     */
    readonly 'name': string
    /**
     * UUID.
     *
     * @example 'ce454934-3a1b-4770-9838-dc85c5d7b6c1'
     */
    readonly 'uuid': string
    /**
     * OpenHarmony/HarmonyOS version.
     *
     * @example '6.0.1'
     */
    readonly 'hw.apiName': string
    /**
     * Device model.
     *
     * @example 'MCHEMU-AL00CN'
     */
    readonly 'devModel'?: ProductConfigItem.DevModelWithString
    /**
     * Model.
     *
     * @example 'Mate 80 Pro Max、Mate 80 RS'
     */
    readonly 'model'?: ProductName
    /**
     * Image directory.
     *
     * @example 'system-image/HarmonyOS-6.0.1/wearable_arm/'
     */
    readonly 'imageDir': string
    /**
     * Image SDK version.
     *
     * @example '6.0.0.112'
     */
    readonly 'version': string
    /**
     * Device type.
     *
     * @example 'wearable', 'phone', 'tablet'
     */
    readonly 'type': DeviceTypeWithString
    /**
     * Architecture.
     *
     * @example 'arm'
     */
    readonly 'abi': string
    /**
     * API version.
     *
     * @example '21'
     */
    readonly 'apiVersion': string
    /**
     * Deployed path.
     *
     * @example '/Users/xxx/.Huawei/Emulator/deployed/Huawei_Wearable'
     */
    readonly 'path': string
    /**
     * Show version.
     *
     * @example 'HarmonyOS 6.0.1(21)'
     */
    readonly 'showVersion': string
    /**
     * HarmonyOS version.
     *
     * @example 'HarmonyOS-6.0.1'
     */
    readonly 'harmonyOSVersion'?: string
    /**
     * Guest version.
     *
     * @example 'HarmonyOS 6.0.1(21)'
     */
    readonly 'guestVersion'?: string
    /**
     * Cover resolution width.
     *
     * @example '2472'
     */
    readonly 'coverResolutionWidth'?: string
    /**
     * Cover resolution height.
     *
     * @example '1648'
     */
    readonly 'coverResolutionHeight'?: string
    /**
     * Cover diagonal size.
     *
     * @example '13.0'
     */
    readonly 'coverDiagonalSize'?: string
    /**
     * HarmonyOS SDK path.
     *
     * @example '/Applications/DevEco-Studio.app/Contents/sdk'
     */
    readonly 'harmonyos.sdk.path': string
    /**
     * HarmonyOS config path.
     *
     * @example '/Users/xxx/Library/Application Support/Huawei/DevEcoStudio6.0'
     */
    readonly 'harmonyos.config.path': string
    /**
     * HarmonyOS log path.
     *
     * @example '/Users/xxx/Library/Logs/Huawei/DevEcoStudio6.0'
     */
    readonly 'harmonyos.log.path': string
    /**
     * Additional properties.
     */
    readonly [key: string]: any
  }

  export function is(value: unknown): value is ListsFileItem {
    return value instanceof ListsFileItemImpl
  }
}

export class ListsFileItemImpl extends SerializableContentImpl<ListsFileItem.Content> implements ListsFileItem {
  constructor(
    private readonly listsFile: ListsFile,
    protected readonly content: ListsFileItem.Content,
  ) {
    super(listsFile.getImageManager(), content)
  }

  getListsFile(): ListsFile {
    return this.listsFile
  }

  getContent(): ListsFileItem.Content {
    return this.content
  }

  toJSON(): ListsFileItem.Serializable {
    return {
      imageManager: this.getImageManager().toJSON(),
      content: this.getContent(),
      listsFile: this.getListsFile().toJSON(),
    }
  }
}
