import type { CustomizeFoldableScreen } from '.'
import type { ProductConfigFile, ProductConfigItem } from '../configs'
import type { EmulatorFile } from '../configs/emulator/emulator'
import type { BaseSerializable } from '../types'
import type { CustomizeScreen } from './customize-screen'
import { CustomizeFoldableScreenImpl } from './customize-foldable-screen'
import { CustomizeScreenImpl } from './customize-screen'

export interface ScreenPreset<
  ProductDeviceType extends ProductConfigFile.DeviceType = ProductConfigFile.DeviceType,
  ProductName extends ProductConfigFile.GenericContent<ProductDeviceType>['name'] = ProductConfigFile.GenericContent<ProductDeviceType>['name'],
> {
  /**
   * Get the emulator item content.
   *
   * @returns The emulator item content.
   */
  getEmulatorDeviceItem(): EmulatorFile.DeviceItem
  /**
   * Get the product config item content.
   *
   * @returns The product config item content.
   */
  getProductConfigItem(): ProductConfigItem<ProductDeviceType, ProductName>
  /**
   * Get the customize screen config.
   *
   * @returns The customize screen config.
   */
  getCustomizeScreenConfig(): CustomizeScreen | CustomizeFoldableScreen | undefined
}

export namespace ScreenPreset {
  export interface Serializable<
    ProductDeviceType extends ProductConfigFile.DeviceType = ProductConfigFile.DeviceType,
    ProductName extends ProductConfigFile.GenericContent<ProductDeviceType>['name'] = ProductConfigFile.GenericContent<ProductDeviceType>['name'],
  > extends BaseSerializable<ScreenPreset<ProductDeviceType, ProductName>> {}

  export interface PresetOptions<
    ProductDeviceType extends ProductConfigFile.DeviceType = ProductConfigFile.DeviceType,
    ProductName extends ProductConfigFile.GenericContent<ProductDeviceType>['name'] = ProductConfigFile.GenericContent<ProductDeviceType>['name'],
  > {
    /**
     * The emulator item content.
     */
    readonly emulatorDeviceItem: EmulatorFile.DeviceItem
    /**
     * The product config item content.
     */
    readonly productConfigItem: ProductConfigItem<ProductDeviceType, ProductName>
  }

  export interface CustomizeOptions<
    ProductDeviceType extends ProductConfigFile.DeviceType = ProductConfigFile.DeviceType,
    ProductName extends ProductConfigFile.GenericContent<ProductDeviceType>['name'] = ProductConfigFile.GenericContent<ProductDeviceType>['name'],
  > extends PresetOptions<ProductDeviceType, ProductName> {
    /**
     * The customize screen options.
     */
    readonly customizeScreen: CustomizeScreen.Options
  }

  export interface CustomizeFoldableOptions<
    ProductDeviceType extends ProductConfigFile.DeviceType = ProductConfigFile.DeviceType,
    ProductName extends ProductConfigFile.GenericContent<ProductDeviceType>['name'] = ProductConfigFile.GenericContent<ProductDeviceType>['name'],
  > extends CustomizeOptions<ProductDeviceType, ProductName> {
    /**
     * The customize foldable screen options.
     */
    readonly customizeFoldableScreen: CustomizeFoldableScreen.Options
  }

  export type Options<
    ProductDeviceType extends ProductConfigFile.DeviceType = ProductConfigFile.DeviceType,
    ProductName extends ProductConfigFile.GenericContent<ProductDeviceType>['name'] = ProductConfigFile.GenericContent<ProductDeviceType>['name'],
  > = ProductName extends ProductConfigItem.Customize
    ? ProductDeviceType extends 'Foldable'
      ? CustomizeFoldableOptions<ProductDeviceType, ProductName>
      : CustomizeOptions<ProductDeviceType, ProductName>
    : PresetOptions<ProductDeviceType, ProductName>

  export function is(value: unknown): value is ScreenPreset {
    return value instanceof ScreenPresetImpl
  }
}

export class ScreenPresetImpl<
  ProductDeviceType extends ProductConfigFile.DeviceType = ProductConfigFile.DeviceType,
  ProductName extends ProductConfigFile.GenericContent<ProductDeviceType>['name'] = ProductConfigFile.GenericContent<ProductDeviceType>['name'],
> implements ScreenPreset<ProductDeviceType, ProductName> {
  constructor(private readonly options: ScreenPreset.Options<ProductDeviceType, ProductName>) {}

  getEmulatorDeviceItem(): EmulatorFile.DeviceItem {
    return this.options.emulatorDeviceItem
  }

  getProductConfigItem(): ProductConfigItem<ProductDeviceType, ProductName> {
    return this.options.productConfigItem as ProductConfigItem<ProductDeviceType, ProductName>
  }

  private _customizeScreen: CustomizeScreen | CustomizeFoldableScreen | undefined

  getCustomizeScreenConfig(): CustomizeScreen | CustomizeFoldableScreen | undefined {
    if (this._customizeScreen) return this._customizeScreen
    if (this.getEmulatorDeviceItem().getContent().deviceType === 'foldable' && this.options.productConfigItem.getContent().name === 'Customize' && 'customizeScreen' in this.options && 'customizeFoldableScreen' in this.options) {
      this._customizeScreen = new CustomizeFoldableScreenImpl(this, this.options.customizeScreen, this.options.customizeFoldableScreen)
    }
    else if (this.options.productConfigItem.getContent().name === 'Customize' && 'customizeScreen' in this.options) {
      this._customizeScreen = new CustomizeScreenImpl(this, this.options.customizeScreen)
    }
    return this._customizeScreen
  }

  toJSON(): ScreenPreset.Serializable<ProductDeviceType, ProductName> {
    return {
      customizeScreenConfig: this.getCustomizeScreenConfig()?.toJSON(),
      emulatorDeviceItem: this.getEmulatorDeviceItem().toJSON(),
      productConfigItem: this.getProductConfigItem().toJSON(),
    }
  }
}
