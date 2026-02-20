import type { ProductConfigItem } from '../product-config'
import type { PascalCaseDeviceType } from '../types'
import type { Screen } from './screen'
import { createScreen } from './screen'

export interface ProductPreset {
  getProductConfig(): ProductConfigItem
  getDeviceType(): PascalCaseDeviceType
  toScreen(): Screen
  toJSON(): ProductPreset.Stringifiable
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
  ) {}

  getProductConfig(): ProductConfigItem {
    return this.productConfig
  }

  getDeviceType(): PascalCaseDeviceType {
    return this.deviceType
  }

  toScreen(): Screen {
    return createScreen({
      diagonal: Number(this.productConfig.screenDiagonal),
      density: Number(this.productConfig.screenDensity),
      height: Number(this.productConfig.screenHeight),
      width: Number(this.productConfig.screenWidth),
    })
  }

  toJSON(): ProductPreset.Stringifiable {
    return {
      product: this.productConfig,
      deviceType: this.deviceType,
    }
  }
}

export async function createProductPreset(productConfig: ProductConfigItem, deviceType: PascalCaseDeviceType): Promise<ProductPreset> {
  return new ProductPresetImpl(productConfig, deviceType)
}
