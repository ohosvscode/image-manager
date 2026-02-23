import type { ProductConfigItem } from '../product-config'
import type { PascalCaseDeviceType, Stringifiable } from '../types'
import type { ScreenPreset } from './screen-preset'

export interface ProductPreset extends Stringifiable<ProductPreset.Stringifiable> {
  getScreenPreset(): ScreenPreset
  getProductConfig(): ProductConfigItem
  getDeviceType(): PascalCaseDeviceType
}

export namespace ProductPreset {
  export interface Stringifiable {
    product: ProductConfigItem
    deviceType: PascalCaseDeviceType
  }
}

export class ProductPresetImpl implements ProductPreset {
  constructor(
    private readonly productConfig: ProductConfigItem,
    private readonly deviceType: PascalCaseDeviceType,
    private readonly screenPreset: ScreenPreset,
  ) {}

  getProductConfig(): ProductConfigItem {
    return this.productConfig
  }

  getDeviceType(): PascalCaseDeviceType {
    return this.deviceType
  }

  getScreenPreset(): ScreenPreset {
    return this.screenPreset
  }

  toJSON(): ProductPreset.Stringifiable {
    return {
      product: this.productConfig,
      deviceType: this.deviceType,
    }
  }
}

export function createProductPreset(productConfig: ProductConfigItem, deviceType: PascalCaseDeviceType, screenPreset: ScreenPreset): ProductPreset {
  return new ProductPresetImpl(productConfig, deviceType, screenPreset)
}
