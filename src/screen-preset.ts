import type { ProductConfigFile, ProductConfigItem } from './configs'
import type { EmulatorFile } from './configs/emulator/emulator'
import type { BaseSerializable } from './types'

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
}

export namespace ScreenPreset {
  export interface Serializable<
    ProductDeviceType extends ProductConfigFile.DeviceType = ProductConfigFile.DeviceType,
    ProductName extends ProductConfigFile.GenericContent<ProductDeviceType>['name'] = ProductConfigFile.GenericContent<ProductDeviceType>['name'],
  > extends BaseSerializable<ScreenPreset<ProductDeviceType, ProductName>> {}

  export interface Options<
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
    return this.options.productConfigItem
  }

  toJSON(): ScreenPreset.Serializable<ProductDeviceType, ProductName> {
    return {
      emulatorDeviceItem: this.getEmulatorDeviceItem().toJSON(),
      productConfigItem: this.getProductConfigItem().toJSON(),
    }
  }
}
