import type { DeployedImageConfigWithProductName } from './deployer/list'
import type { PascalCaseDeviceType } from './types'

export interface ProductConfigItem {
  /**
   * The name of the product.
   */
  name: string
  /**
   * The screen width of the product.
   */
  screenWidth: string
  /**
   * The screen height of the product.
   */
  screenHeight: string
  /**
   * The screen diagonal of the product.
   */
  screenDiagonal: string
  /**
   * The screen density of the product.
   */
  screenDensity: string
  /**
   * The outer screen width of the product.
   */
  outerScreenWidth?: string
  /**
   * The outer screen height of the product.
   */
  outerDoubleScreenWidth?: string
  /**
   * The outer double screen height of the product.
   */
  outerDoubleScreenHeight?: string
  /**
   * The outer double screen diagonal of the product.
   */
  outerDoubleScreenDiagonal?: string
  /**
   * The outer screen height of the product.
   */
  outerScreenHeight?: string
  /**
   * The outer screen diagonal of the product.
   */
  outerScreenDiagonal?: string
  /**
   * Whether the product is visible.
   */
  visible: boolean
}

export type ProductConfig = Record<PascalCaseDeviceType, ProductConfigItem[]>

export function createDeployedImageConfig(productConfigItem: ProductConfigItem): DeployedImageConfigWithProductName {
  return {
    density: productConfigItem.screenDensity,
    resolutionHeight: productConfigItem.screenHeight,
    resolutionWidth: productConfigItem.screenWidth,
    diagonalSize: productConfigItem.screenDiagonal,
    productName: productConfigItem.name,
  }
}
